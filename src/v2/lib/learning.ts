import { useEffect, useSyncExternalStore } from 'react';
import {
  getMe,
  listPublications,
  listZandoItems,
  type Me,
  type ZandoItem,
} from './api';
import { getP2POffers, type P2POffer } from './trading';
import { estVitrineBoutique } from './format';

/**
 * Moteur de suggestions local.
 *
 * Il lit les donnees que l'application charge deja (publications, offres
 * Zando, offres P2P, profil) ainsi que les recherches saisies sur l'appareil,
 * puis n'expose que des suggestions. Tout reste dans le stockage local :
 * aucun appel reseau dedie, aucune donnee envoyee a l'exterieur.
 */

const MODEL_KEY = 'uq_learning_model_v1';
const CACHE_KEY = 'uq_learning_cache_v1';

const LIMITS = {
  titles: 90,
  texts: 70,
  prices: 200,
  rates: 300,
  searches: 80,
  clicks: 120,
  profile: 80,
  seen: 600,
};

const MIN_PRICE_SAMPLES = 3;
const MIN_RATE_SAMPLES = 3;
const MIN_TITLE_SAMPLES = 2;
const SEARCH_THROTTLE_MS = 60_000;
const SEARCH_LOG_DELAY_MS = 900;

interface WeightedText {
  text: string;
  weight: number;
}

interface Bucket {
  titles: WeightedText[];
  texts: WeightedText[];
  prices: number[];
}

interface SearchEntry {
  q: string;
  n: number;
  t: number;
}

interface ClickEntry {
  q: string;
  title: string;
  category: string;
  n: number;
}

interface DailyCounters {
  day: string;
  publications: number;
  items: number;
  offers: number;
  searches: number;
}

export interface LearningSources {
  publications: number;
  items: number;
  offers: number;
  profiles: number;
  searches: number;
}

interface Model {
  /** v2 : les taux P2P sont passés à la base « 1 BORB = X devise ». Les séries
   * apprises sous la base par USD ne sont pas comparables et sont écartées. */
  version: 2;
  enabled: boolean;
  updated_at: number;
  last_sync: number;
  sources: LearningSources;
  daily: DailyCounters;
  byCategory: Record<string, Bucket>;
  byKind: Record<string, Bucket>;
  rates: Record<string, number[]>;
  ratesByHour: Record<string, number[]>;
  searches: SearchEntry[];
  clicks: ClickEntry[];
  profile: WeightedText[];
  /** Empreintes deja comptees aujourd'hui (jour ISO) : evite de gonfler les poids. */
  seen: Record<string, string>;
}

/** Donnee normalisee d'une offre Zando : aucun identifiant n'est conserve. */
export interface LearnItem {
  title: string;
  description?: string;
  category?: string;
  /** Prix interne de l'offre (unites BORB). */
  price?: number;
  engagement?: number;
}

/** Donnee normalisee d'une publication : ni numero UQ ni pseudo. */
export interface LearnPublication {
  kind: string;
  title: string;
  body?: string;
  price?: number | null;
  likes?: number;
  comment_count?: number;
}

/** Donnee normalisee d'une offre P2P : ni telephone ni numero UQ. */
export interface LearnOffer {
  currency: string;
  rate: number;
  min_amount?: number;
  max_amount?: number;
  city?: string;
  created_at?: number;
}

interface CacheShape {
  at: number;
  publications: LearnPublication[];
  items: LearnItem[];
  offers: LearnOffer[];
}

// ==================== Etat local ====================

const emptyBucket = (): Bucket => ({ titles: [], texts: [], prices: [] });

const emptyModel = (): Model => ({
  version: 2,
  enabled: true,
  updated_at: 0,
  last_sync: 0,
  sources: { publications: 0, items: 0, offers: 0, profiles: 0, searches: 0 },
  daily: { day: '', publications: 0, items: 0, offers: 0, searches: 0 },
  byCategory: {},
  byKind: {},
  rates: {},
  ratesByHour: {},
  searches: [],
  clicks: [],
  profile: [],
  seen: {},
});

let cached: Model | null = null;
let revision = 0;
const listeners = new Set<() => void>();

const notify = () => {
  cached = null;
  revision += 1;
  listeners.forEach((listener) => listener());
};

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Stockage plein ou indisponible : le moteur reste silencieux.
  }
};

const isModel = (value: unknown): value is Model => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.version === 2 && typeof record.enabled === 'boolean';
};

const loadModel = (): Model => {
  if (cached) return cached;
  const raw = readStorage(MODEL_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isModel(parsed)) {
        cached = parsed;
        return parsed;
      }
    } catch {
      // Modele illisible : on repart d'un modele vide.
    }
  }
  cached = emptyModel();
  return cached;
};

const saveModel = (model: Model) => {
  model.updated_at = Date.now();
  writeStorage(MODEL_KEY, JSON.stringify(model));
  notify();
};

const readCache = (): CacheShape | null => {
  const raw = readStorage(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheShape;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = (cache: CacheShape) => {
  writeStorage(CACHE_KEY, JSON.stringify(cache));
};

// ==================== Outils de texte ====================

const STOPWORDS = new Set([
  'les', 'des', 'une', 'aux', 'par', 'est', 'sont', 'plus', 'que', 'qui', 'pas',
  'mais', 'comme', 'tout', 'tous', 'toute', 'toutes', 'leur', 'leurs', 'elle',
  'ils', 'nous', 'vous', 'mon', 'ton', 'son', 'mes', 'tes', 'ses', 'notre',
  'votre', 'chez', 'entre', 'vers', 'sans', 'sous', 'apres', 'avant', 'depuis',
  'pendant', 'ainsi', 'alors', 'donc', 'car', 'cette', 'ces', 'cet', 'pour',
  'avec', 'dans', 'sur', 'de', 'la', 'le', 'un', 'en', 'et', 'ou', 'au', 'du',
  'ne', 'se', 'ce', 'il', 'je', 'tu', 'on',
]);

/** Minuscules sans accents : la comparaison ignore la casse et les accents. */
export const normalizeText = (value: string): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Mots significatifs d'un texte (sans mots vides), pour les rapprochements. */
export const tokens = (value: string): string[] =>
  normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

const cleanText = (value: string): string => String(value || '').trim().replace(/\s+/g, ' ');

const clip = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const median = (values: number[]): number => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const dayKey = (date = new Date()): string => date.toISOString().slice(0, 10);

const fingerprint = (value: string): string => {
  let hash = 5381;
  const input = normalizeText(value);
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
  }
  return `${hash >>> 0}:${input.length}`;
};

const isFirstSeenToday = (model: Model, key: string): boolean => {
  const today = dayKey();
  if (model.seen[key] === today) return false;
  model.seen[key] = today;
  const entries = Object.entries(model.seen);
  if (entries.length > LIMITS.seen) {
    model.seen = Object.fromEntries(entries.slice(entries.length - LIMITS.seen));
  }
  return true;
};

const bumpDaily = (model: Model, counter: keyof Omit<DailyCounters, 'day'>, amount = 1) => {
  const today = dayKey();
  if (model.daily.day !== today) {
    model.daily = { day: today, publications: 0, items: 0, offers: 0, searches: 0 };
  }
  model.daily[counter] += amount;
};

const pushBounded = (list: number[], value: number) => {
  list.push(value);
  if (list.length > LIMITS.rates) {
    list.splice(0, list.length - LIMITS.rates);
  }
};

const upsertText = (list: WeightedText[], text: string, weight: number, limit: number) => {
  const clean = cleanText(text);
  if (!clean) return;
  const key = normalizeText(clean);
  const found = list.find((entry) => normalizeText(entry.text) === key);
  if (found) {
    found.weight += weight;
    found.text = clean;
  } else {
    list.push({ text: clean, weight });
  }
  list.sort((a, b) => b.weight - a.weight);
  if (list.length > limit) list.length = limit;
};

const bucketOf = (map: Record<string, Bucket>, key: string): Bucket => {
  if (!map[key]) map[key] = emptyBucket();
  return map[key];
};

const mergeBuckets = (buckets: Bucket[]): Bucket => {
  const merged = emptyBucket();
  for (const bucket of buckets) {
    for (const entry of bucket.titles) upsertText(merged.titles, entry.text, entry.weight, LIMITS.titles);
    for (const entry of bucket.texts) upsertText(merged.texts, entry.text, entry.weight, LIMITS.texts);
    merged.prices.push(...bucket.prices);
  }
  if (merged.prices.length > LIMITS.prices) {
    merged.prices = merged.prices.slice(merged.prices.length - LIMITS.prices);
  }
  return merged;
};

const categoryBucket = (model: Model, category?: string): Bucket => {
  const key = normalizeText(cleanText(category || ''));
  if (!key) return mergeBuckets(Object.values(model.byCategory));
  return model.byCategory[key] || emptyBucket();
};

const kindBucket = (model: Model, kind?: string): Bucket => {
  const key = normalizeText(cleanText(kind || ''));
  if (!key) return mergeBuckets(Object.values(model.byKind));
  return model.byKind[key] || emptyBucket();
};

const profileAffinity = (model: Model, text: string): number => {
  if (model.profile.length === 0) return 0;
  const words = new Set(tokens(text));
  let score = 0;
  for (const entry of model.profile) {
    if (words.has(entry.text)) score += entry.weight;
  }
  return score;
};

const overlapScore = (words: Set<string>, text: string): number => {
  let score = 0;
  for (const token of tokens(text)) {
    if (words.has(token)) score += 1;
  }
  return score;
};

// ==================== Apprentissage ====================

export const learningEnabled = (): boolean => loadModel().enabled;

export const setLearningEnabled = (enabled: boolean): void => {
  const model = loadModel();
  model.enabled = enabled;
  saveModel(model);
};

/** Efface le modele et le cache hors ligne de l'appareil. */
export const resetLearning = (): void => {
  const model = emptyModel();
  model.enabled = loadModel().enabled;
  cached = model;
  writeStorage(MODEL_KEY, JSON.stringify(model));
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Rien a supprimer si le stockage est indisponible.
  }
  notify();
};

/** Export JSON du modele, pour l'utilisateur (portabilite / RGPD). */
export const exportLearning = (): string => {
  const model = loadModel();
  return JSON.stringify(
    {
      version: model.version,
      updated_at: model.updated_at,
      last_sync: model.last_sync,
      sources: model.sources,
      daily: model.daily,
      categories: Object.keys(model.byCategory),
      searches: model.searches,
      clicks: model.clicks,
      profile: model.profile,
      rates: model.rates,
    },
    null,
    2,
  );
};

export interface LearningSnapshot {
  enabled: boolean;
  updatedAt: number;
  lastSync: number;
  sources: LearningSources;
  categories: number;
  searchCount: number;
  daily: DailyCounters;
}

export const learningSnapshot = (): LearningSnapshot => {
  const model = loadModel();
  return {
    enabled: model.enabled,
    updatedAt: model.updated_at,
    lastSync: model.last_sync,
    sources: { ...model.sources },
    categories: Object.keys(model.byCategory).filter(Boolean).length,
    searchCount: model.searches.length,
    daily: { ...model.daily },
  };
};

export const ingestItems = (items: LearnItem[]): void => {
  const model = loadModel();
  if (!model.enabled || items.length === 0) return;
  let added = 0;
  for (const item of items) {
    const title = cleanText(item.title || '');
    if (!title) continue;
    const key = fingerprint(`zando|${title}|${item.description || ''}|${item.price ?? ''}`);
    if (!isFirstSeenToday(model, key)) continue;
    const bucket = bucketOf(model.byCategory, normalizeText(cleanText(item.category || '')));
    const weight = 1 + Math.min(3, Number(item.engagement) || 0);
    upsertText(bucket.titles, title, weight, LIMITS.titles);
    if (item.description) {
      upsertText(bucket.texts, item.description, weight, LIMITS.texts);
    }
    const price = Number(item.price);
    if (Number.isFinite(price) && price > 0) {
      bucket.prices.push(price);
      if (bucket.prices.length > LIMITS.prices) {
        bucket.prices.splice(0, bucket.prices.length - LIMITS.prices);
      }
    }
    added += 1;
  }
  if (added === 0) return;
  model.sources.items += added;
  bumpDaily(model, 'items', added);
  saveModel(model);
};

export const ingestZandoItems = (items: ZandoItem[]): void => {
  ingestItems(
    items
      // Une vitrine de boutique n'est pas une offre : elle n'apprend ni prix ni texte.
      .filter((item) => !estVitrineBoutique(item))
      .map((item) => ({
        title: item.title,
        description: item.description,
        category: item.category,
        price: Number(item.price_borb),
        engagement:
          Math.min(3, (Number(item.comment_count) || 0) * 0.2 + (Number(item.review_count) || 0) * 0.15),
      })),
  );
};

export const ingestPublications = (entries: LearnPublication[]): void => {
  const model = loadModel();
  if (!model.enabled || entries.length === 0) return;
  let added = 0;
  for (const entry of entries) {
    const title = cleanText(entry.title || '');
    if (!title) continue;
    const key = fingerprint(`pub|${entry.kind}|${title}|${entry.body || ''}|${entry.price ?? ''}`);
    if (!isFirstSeenToday(model, key)) continue;
    const bucket = bucketOf(model.byKind, normalizeText(cleanText(entry.kind || '')));
    const weight =
      1 + Math.min(3, (Number(entry.likes) || 0) * 0.3 + (Number(entry.comment_count) || 0) * 0.2);
    upsertText(bucket.titles, title, weight, LIMITS.titles);
    if (entry.body) upsertText(bucket.texts, entry.body, weight, LIMITS.texts);
    const price = Number(entry.price);
    if (Number.isFinite(price) && price > 0) {
      bucket.prices.push(price);
      if (bucket.prices.length > LIMITS.prices) {
        bucket.prices.splice(0, bucket.prices.length - LIMITS.prices);
      }
    }
    added += 1;
  }
  if (added === 0) return;
  model.sources.publications += added;
  bumpDaily(model, 'publications', added);
  saveModel(model);
};

export const ingestOffers = (offers: LearnOffer[]): void => {
  const model = loadModel();
  if (!model.enabled || offers.length === 0) return;
  let added = 0;
  for (const offer of offers) {
    const currency = cleanText(offer.currency || '').toUpperCase();
    const rate = Number(offer.rate);
    if (!currency || !Number.isFinite(rate) || rate <= 0) continue;
    const key = fingerprint(
      `p2p|${currency}|${rate}|${offer.min_amount ?? ''}|${offer.max_amount ?? ''}|${offer.city || ''}`,
    );
    if (!isFirstSeenToday(model, key)) continue;
    if (!model.rates[currency]) model.rates[currency] = [];
    pushBounded(model.rates[currency], rate);
    const stamp = Number(offer.created_at);
    const hour = new Date(Number.isFinite(stamp) && stamp > 0 ? stamp * 1000 : Date.now()).getHours();
    const hourKey = `${currency}:${hour}`;
    if (!model.ratesByHour[hourKey]) model.ratesByHour[hourKey] = [];
    pushBounded(model.ratesByHour[hourKey], rate);
    added += 1;
  }
  if (added === 0) return;
  model.sources.offers += added;
  bumpDaily(model, 'offers', added);
  saveModel(model);
};

export const ingestProfile = (me: Me | null | undefined): void => {
  if (!me) return;
  const model = loadModel();
  if (!model.enabled) return;
  const text = cleanText([me.emploi, me.ville_actuelle, me.description].filter(Boolean).join(' · '));
  if (!text) return;
  const key = fingerprint(`profil|${text}`);
  if (!isFirstSeenToday(model, key)) return;
  for (const token of new Set(tokens(text))) {
    upsertText(model.profile, token, 1, LIMITS.profile);
  }
  model.sources.profiles += 1;
  saveModel(model);
};

export const logSearch = (raw: string): void => {
  const query = cleanText(raw).slice(0, 80);
  if (query.length < 2) return;
  const model = loadModel();
  if (!model.enabled) return;
  const key = normalizeText(query);
  const now = Date.now();
  const existing = model.searches.find((entry) => normalizeText(entry.q) === key);
  if (existing) {
    if (now - existing.t < SEARCH_THROTTLE_MS) return;
    existing.n += 1;
    existing.t = now;
    existing.q = query;
  } else {
    model.searches.unshift({ q: query, n: 1, t: now });
    if (model.searches.length > LIMITS.searches) {
      model.searches.length = LIMITS.searches;
    }
  }
  model.sources.searches += 1;
  bumpDaily(model, 'searches', 1);
  saveModel(model);
};

export const logSearchClick = (query: string, item: { title?: string; category?: string }): void => {
  const cleaned = cleanText(query);
  const title = cleanText(item?.title || '');
  if (cleaned.length < 2 || !title) return;
  const model = loadModel();
  if (!model.enabled) return;
  const queryKey = normalizeText(cleaned);
  const titleKey = normalizeText(title);
  const existing = model.clicks.find(
    (entry) => normalizeText(entry.q) === queryKey && normalizeText(entry.title) === titleKey,
  );
  if (existing) {
    existing.n += 1;
  } else {
    model.clicks.unshift({
      q: cleaned,
      title,
      category: cleanText(item?.category || ''),
      n: 1,
    });
    if (model.clicks.length > LIMITS.clicks) model.clicks.length = LIMITS.clicks;
  }
  saveModel(model);
};

// ==================== Suggestions ====================

export interface TitleSuggestionOptions {
  category?: string;
  kind?: string;
  seed?: string;
}

/** Titre proche des offres deja vues ; null quand les donnees manquent. */
export const suggestTitle = ({ category, kind, seed }: TitleSuggestionOptions = {}): string | null => {
  const model = loadModel();
  if (!model.enabled) return null;
  const bucket = kind ? kindBucket(model, kind) : categoryBucket(model, category);
  if (bucket.titles.length === 0) return null;

  const seedText = cleanText(seed || '');
  const words = new Set(tokens(seedText));
  if (words.size === 0) {
    if (bucket.titles.length < MIN_TITLE_SAMPLES) return null;
    const best = [...bucket.titles].sort(
      (a, b) =>
        b.weight + profileAffinity(model, b.text) - (a.weight + profileAffinity(model, a.text)),
    )[0];
    return best ? best.text : null;
  }

  let best: WeightedText | null = null;
  let bestScore = 0;
  for (const entry of bucket.titles) {
    const score =
      overlapScore(words, entry.text) * 10 +
      entry.weight +
      profileAffinity(model, entry.text);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  if (!best) return null;
  if (normalizeText(best.text) === normalizeText(seedText)) return null;
  return best.text;
};

export interface TextSuggestionOptions {
  category?: string;
  kind?: string;
  title?: string;
}

/** Texte (description, corps de publication) proche du titre saisi. */
export const suggestText = ({ category, kind, title }: TextSuggestionOptions = {}): string | null => {
  const model = loadModel();
  if (!model.enabled) return null;
  const bucket = kind ? kindBucket(model, kind) : categoryBucket(model, category);
  if (bucket.texts.length === 0) return null;
  const words = new Set(tokens(title || ''));
  if (words.size === 0) return null;

  let best: WeightedText | null = null;
  let bestScore = 0;
  for (const entry of bucket.texts) {
    const overlap = overlapScore(words, entry.text);
    if (overlap === 0) continue;
    const score = overlap * 10 + entry.weight + profileAffinity(model, entry.text);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best ? clip(best.text, 240) : null;
};

export interface PriceSuggestionOptions {
  category?: string;
  kind?: string;
}

/** Prix median (unites internes) des elements proches ; null si trop peu d'echantillons. */
export const suggestPriceUnits = ({ category, kind }: PriceSuggestionOptions = {}): number | null => {
  const model = loadModel();
  if (!model.enabled) return null;
  const bucket = kind ? kindBucket(model, kind) : categoryBucket(model, category);
  if (bucket.prices.length < MIN_PRICE_SAMPLES) return null;
  const value = median(bucket.prices);
  return value > 0 ? Math.round(value) : null;
};

/** Taux median observe pour une devise (unites de devise pour 1 BORB). */
export const suggestRate = (currency?: string): number | null => {
  const model = loadModel();
  if (!model.enabled) return null;
  const key = cleanText(currency || '').toUpperCase();
  if (!key) return null;
  const overall = model.rates[key];
  if (!overall || overall.length < MIN_RATE_SAMPLES) return null;
  const hourly = model.ratesByHour[`${key}:${new Date().getHours()}`];
  const source = hourly && hourly.length >= MIN_RATE_SAMPLES ? hourly : overall;
  const value = median(source);
  return value > 0 ? Math.round(value * 100) / 100 : null;
};

/** Pistes de recherche tirees des recherches precedentes (anonymisees). */
export const searchHints = (raw: string, limit = 4): string[] => {
  const model = loadModel();
  if (!model.enabled) return [];
  const query = cleanText(raw);
  const key = normalizeText(query);
  const pool = [...model.searches].sort((a, b) => b.n - a.n);
  const picked: string[] = [];
  for (const entry of pool) {
    const candidate = normalizeText(entry.q);
    if (!candidate || candidate === key) continue;
    if (key && !candidate.includes(key) && !key.includes(candidate)) continue;
    if (picked.some((text) => normalizeText(text) === candidate)) continue;
    picked.push(entry.q);
    if (picked.length >= limit) break;
  }
  return picked;
};

/** Mots des resultats deja ouverts pour une recherche proche (score de tri). */
export const learnedSearchTokens = (raw: string): Record<string, number> => {
  const model = loadModel();
  if (!model.enabled) return {};
  const words = new Set(tokens(raw));
  if (words.size === 0) return {};
  const out: Record<string, number> = {};
  for (const click of model.clicks) {
    if (overlapScore(words, click.q) === 0) continue;
    for (const token of tokens(`${click.title} ${click.category}`)) {
      out[token] = (out[token] || 0) + click.n;
    }
  }
  return out;
};

/** Score de pertinence d'un element pour une recherche (0 si rien appris). */
export const searchAffinity = (tokensMap: Record<string, number>, text: string): number => {
  let score = 0;
  for (const token of tokens(text)) {
    score += tokensMap[token] || 0;
  }
  return score;
};

// ==================== Synchronisation ====================

let syncInFlight = false;

const attempt = async <T,>(loader: () => Promise<T>): Promise<T | null> => {
  try {
    return await loader();
  } catch {
    return null;
  }
};

const toCachedPublication = (entry: LearnPublication): LearnPublication => ({
  kind: entry.kind,
  title: entry.title,
  body: entry.body,
  price: entry.price,
  likes: entry.likes,
  comment_count: entry.comment_count,
});

const toCachedItem = (item: ZandoItem): LearnItem => ({
  title: item.title,
  description: item.description,
  category: item.category,
  price: Number(item.price_borb),
  engagement:
    Math.min(3, (Number(item.comment_count) || 0) * 0.2 + (Number(item.review_count) || 0) * 0.15),
});

const toCachedOffer = (offer: P2POffer): LearnOffer => ({
  currency: offer.currency,
  rate: offer.rate,
  min_amount: offer.min_amount,
  max_amount: offer.max_amount,
  city: offer.city,
  created_at: offer.created_at,
});

/**
 * Lit les sources reelles de l'application et met le modele a jour.
 * En cas de coupure, les dernieres donnees mises en cache sont reutilisees.
 */
export const syncLearning = async (uq: string): Promise<void> => {
  if (!uq || syncInFlight) return;
  const model = loadModel();
  if (!model.enabled) return;
  syncInFlight = true;
  try {
    const [publications, items, offers, me] = await Promise.all([
      attempt(() => listPublications()),
      attempt(() => listZandoItems()),
      attempt(() => getP2POffers(uq)),
      attempt(() => getMe()),
    ]);

    const cache: CacheShape = readCache() || { at: 0, publications: [], items: [], offers: [] };

    if (publications) {
      const list = publications.publications || [];
      ingestPublications(list);
      cache.publications = list.slice(0, 60).map(toCachedPublication);
      cache.at = Date.now();
    } else if (cache.publications.length > 0) {
      ingestPublications(cache.publications);
    }

    if (items) {
      const list = items.items || [];
      ingestZandoItems(list);
      cache.items = list.slice(0, 80).map(toCachedItem);
      cache.at = Date.now();
    } else if (cache.items.length > 0) {
      ingestItems(cache.items);
    }

    if (offers) {
      const list = offers.offers || [];
      ingestOffers(list);
      cache.offers = list.slice(0, 80).map(toCachedOffer);
      cache.at = Date.now();
    } else if (cache.offers.length > 0) {
      ingestOffers(cache.offers);
    }

    if (me?.me) ingestProfile(me.me);

    writeCache(cache);
    const current = loadModel();
    current.last_sync = Date.now();
    saveModel(current);
  } finally {
    syncInFlight = false;
  }
};

// ==================== React ====================

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Version du modele : les composants recalculent leurs suggestions apres apprentissage. */
export const useLearningRevision = (): number =>
  useSyncExternalStore(subscribe, () => revision, () => 0);

/** L'apprentissage tourne en arriere-plan : au demarrage, puis toutes les heures. */
export const useLearningSync = (uq: string): void => {
  useEffect(() => {
    if (!uq || !learningEnabled()) return;
    void syncLearning(uq);
    const timer = window.setInterval(() => {
      void syncLearning(uq);
    }, 3_600_000);
    const onOnline = () => {
      void syncLearning(uq);
    };
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
  }, [uq]);
};

/** Journalise une recherche apres une courte stabilite de la saisie. */
export const useSearchLogging = (query: string): void => {
  useEffect(() => {
    const cleaned = cleanText(query);
    if (cleaned.length < 2) return;
    const timer = window.setTimeout(() => logSearch(cleaned), SEARCH_LOG_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query]);
};
