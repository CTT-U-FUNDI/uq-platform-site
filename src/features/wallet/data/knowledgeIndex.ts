import { KNOWLEDGE_FR } from './borbContent.fr';
import { KNOWLEDGE_EN } from './borbContent.en';
import { KNOWLEDGE_ES } from './borbContent.es';
import { KNOWLEDGE_SW } from './borbContent.sw';
import type { KnowledgeEntry } from './borbContent.fr';
import type { Lang, Tone } from './uqaiEnrichment';
import {
  ALL_LANGS,
  ALIAS_GROUPS,
  MANUAL_ANSWERS,
  TOPIC_EQUIVALENTS,
  LANGUAGE_HINTS,
  STOPWORDS,
  OFF_TOPIC_HINTS,
  PHRASES,
  LANG_NAMES,
  INTROS,
  HOWTO_HINTS,
  DEFINITION_HINTS,
  MONEY_HINTS,
  SECURITY_HINTS,
  SUPPORT_HINTS,
  DOMAIN_WORDS,
  SMALL_TALK_PREFIXES,
  SMALL_TALK_SUFFIXES,
  CANONICAL_QUERIES,
  BORB_REMINDER,
} from './uqaiEnrichment';
import type { QueryFocus } from './uqaiEnrichment';

export type { Lang } from './uqaiEnrichment';
export type { KnowledgeEntry } from './borbContent.fr';

export const ALL_KNOWLEDGE: Record<Lang, KnowledgeEntry[]> = {
  fr: KNOWLEDGE_FR,
  en: KNOWLEDGE_EN,
  es: KNOWLEDGE_ES,
  sw: KNOWLEDGE_SW,
};

// ============================================================================
// STOCKAGE LOCAL (sûr même hors navigateur)
// ============================================================================

const memoryStore: Record<string, string> = {};

function storageGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      return localStorage.getItem(key);
    }
  } catch {
    // stockage indisponible : on utilise la mémoire
  }
  return memoryStore[key] ?? null;
}

function storageSet(key: string, value: string) {
  memoryStore[key] = value;
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {
    // stockage indisponible : la mémoire suffit
  }
}

// ============================================================================
// NORMALISATION
// ============================================================================

/**
 * Normalise une phrase : minuscules, accents retirés, ponctuation aplatie,
 * lettres répétées réduites ("commeeeent" -> "comment").
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’'`´]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/([a-z])\1{2,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const GLOBAL_STOPWORDS = new Set<string>();
for (const lang of ALL_LANGS) {
  for (const word of STOPWORDS[lang]) {
    const n = normalizeText(word);
    if (n) GLOBAL_STOPWORDS.add(n);
  }
}
GLOBAL_STOPWORDS.add('uq');
GLOBAL_STOPWORDS.add('app');
GLOBAL_STOPWORDS.add('application');
GLOBAL_STOPWORDS.add('qu');

const FILLERS = new Set([
  'doing', 'going', 'today', 'tonight', 'now', 'maintenant', 'aujourd', 'hui',
  'beaucoup', 'bien', 'tres', 'vraiment', 'really', 'so', 'much', 'very', 'sana',
  'vizuri', 'muy', 'mucho', 'ahora', 'sasa', 'poa', 'sawa', 'ok', 'okay', 'please',
  'svp', 'stp', 'tafadhali', 'favor', 'dear', 'cher', 'there', 'here',
]);

/** Découpe en mots utiles (sans mots vides), pour toutes les langues. */
export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter((w) => w.length >= 2 && !GLOBAL_STOPWORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

function hasPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const idx = haystack.indexOf(needle);
  if (idx < 0) return false;
  const beforeOk = idx === 0 || haystack[idx - 1] === ' ';
  const end = idx + needle.length;
  const afterOk = end === haystack.length || haystack[end] === ' ';
  return beforeOk && afterOk;
}

/** Distance d'édition bornée (retourne max+1 dès que la limite est dépassée). */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  const cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

const PHONETIC_GROUPS = ['ckq', 'sz', 'iy', 'vb', 'jg'];

function sameFirstSound(a: string, b: string): boolean {
  if (a[0] === b[0]) return true;
  return PHONETIC_GROUPS.some((group) => group.includes(a[0]) && group.includes(b[0]));
}

/**
 * Similarité entre deux mots : exacte, racine commune, inclusion ou faute légère.
 * Renvoie 0..1.
 */
export function tokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  // Racine commune : creer/creation, comprar/compra, gagner/gagne...
  if (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4)) return 0.78;

  // Préfixe swahili ou mot inclus : kufungua/fungua, nimepoteza/poteza...
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 5 && (a.includes(b) || b.includes(a))) return 0.72;

  // Faute de frappe : on tolère 1-3 lettres selon la longueur. Les fautes
  // phonétiques (c/k, s/z, v/b, i/y) sont acceptées sur la première lettre.
  // La tolérance se base sur le mot le plus long pour rester symétrique
  // ("sui" doit reconnaître "suis", pas seulement l'inverse).
  const refLen = Math.max(a.length, b.length);
  const tolerance = refLen <= 3 ? 0 : refLen <= 5 ? 1 : refLen <= 8 ? 2 : 3;
  if (tolerance === 0 || !sameFirstSound(a, b)) return 0;
  const d = editDistance(a, b, tolerance);
  if (d > tolerance) return 0;
  const sim = 1 - d / refLen;
  return sim >= 0.7 ? sim : 0;
}

function bestTokenSimilarity(word: string, tokens: string[]): number {
  let best = 0;
  for (const t of tokens) {
    const s = tokenSimilarity(word, t);
    if (s > best) best = s;
    if (best === 1) break;
  }
  return best;
}

// ============================================================================
// RAISONNEMENT : construction de la question
// ============================================================================

export type QuestionType =
  | 'definition'
  | 'howto'
  | 'why'
  | 'where'
  | 'yesno'
  | 'cost'
  | 'list'
  | 'statement';

export interface QueryAnalysis {
  raw: string;
  searchQuery: string;
  tokens: string[];
  questionType: QuestionType;
  focus: QueryFocus | 'other';
  action: 'send' | 'exchange' | 'buy' | 'sell' | 'secure' | 'none';
  misconception: boolean;
  canonical: string[];
  canonicalUsed: boolean;
  reasoning: string;
}

const SMALL_TALK_PREFIX_NORMS: string[] = [];
const SMALL_TALK_SUFFIX_NORMS: string[] = [];
for (const lang of ALL_LANGS) {
  for (const phrase of SMALL_TALK_PREFIXES[lang]) {
    const norm = normalizeText(phrase);
    if (norm && !SMALL_TALK_PREFIX_NORMS.includes(norm)) SMALL_TALK_PREFIX_NORMS.push(norm);
  }
  for (const phrase of SMALL_TALK_SUFFIXES[lang]) {
    const norm = normalizeText(phrase);
    if (norm && !SMALL_TALK_SUFFIX_NORMS.includes(norm)) SMALL_TALK_SUFFIX_NORMS.push(norm);
  }
}
SMALL_TALK_PREFIX_NORMS.sort((a, b) => b.length - a.length);
SMALL_TALK_SUFFIX_NORMS.sort((a, b) => b.length - a.length);

/** Retire "bonjour", "merci", "svp"... autour d'une vraie question. */
function stripSmallTalk(norm: string): string {
  let out = norm;
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const prefix of SMALL_TALK_PREFIX_NORMS) {
      if (out.length > prefix.length && out.startsWith(`${prefix} `)) {
        out = out.slice(prefix.length + 1);
        changed = true;
        break;
      }
    }
    if (!changed) {
      for (const suffix of SMALL_TALK_SUFFIX_NORMS) {
        if (out.length > suffix.length && out.endsWith(` ${suffix}`)) {
          out = out.slice(0, out.length - suffix.length - 1);
          changed = true;
          break;
        }
      }
    }
    if (!changed) break;
  }
  out = out.trim();
  // On ne vide jamais une phrase entièrement conversationnelle : la salutation
  // seule doit rester une salutation.
  return out.length > 0 ? out : norm;
}

const QUESTION_WORDS = new Set([
  'combien', 'comment', 'pourquoi', 'quand', 'quelle', 'quelles', 'quels',
  'quel', 'which', 'what', 'whats', 'how', 'much', 'many', 'does', 'did',
  'is', 'are', 'can', 'cuanto', 'cuanta', 'cuantas', 'cual', 'cuales',
  'como', 'cuando', 'donde', 'porque', 'nini', 'gani', 'jinsi', 'kiasi',
  'lini', 'wapi', 'kwanini', 'vipi', 'je', 'peux', 'puis', 'peut', 'puedo',
  'se', 'inaweza', 'naweza', 'nawezaje', 'est', 'ce', 'que', 'es',
  'csq', 'keske', 'keskec', 'kesako', 'koi', 'kec', 'kesske', 'ske',
]);

function isDomainToken(token: string): boolean {
  if (/^\d+$/.test(token)) return true;
  if (QUESTION_WORDS.has(token) || FILLERS.has(token)) return true;
  for (const word of DOMAIN_WORDS) {
    if (tokenSimilarity(token, word) >= 0.78) return true;
  }
  return false;
}

function tokenCovers(tokens: string[], stems: string[]): boolean {
  for (const token of tokens) {
    for (const stem of stems) {
      if (tokenSimilarity(token, stem) >= 0.76) return true;
    }
  }
  return false;
}

const EXCHANGE_STEMS = ['echanger', 'echange', 'convertir', 'conversion', 'convert', 'exchange', 'cambiar', 'badilisha'];
const SELL_STEMS = ['vendre', 'vente', 'sell', 'vender', 'kuuza', 'uza'];
const BUY_STEMS = ['acheter', 'achat', 'buy', 'comprar', 'nunua'];
const SEND_STEMS = ['envoyer', 'envoi', 'send', 'transferer', 'transfer', 'payer', 'pay', 'enviar', 'tuma', 'kutuma', 'wasilisha', 'nitume', 'nituma', 'atume', 'tutume'];
const SECURE_STEMS = ['securiser', 'secure', 'proteger', 'protect', 'linda', 'wezesha'];
const CURRENCY_STEMS = ['devise', 'devises', 'currency', 'currencies', 'divisa', 'divisas', 'sarafu', 'moneda', 'monnaie', 'argent', 'money', 'pesa', 'dinero', 'euro', 'euros', 'dollar', 'dollars', 'dolar', 'dolares'];
const P2P_STEMS = ['p2p'];
const ZANDO_STEMS = ['zando', 'studio', 'boutique', 'produit', 'produits', 'article', 'articles', 'contenu', 'contenus', 'publier', 'publication', 'publications', 'annonce', 'annonces', 'element', 'elements', 'item', 'items', 'bidhaa', 'kipengee', 'producto', 'product', 'listing'];
const LEVEL_STEMS = ['niveau', 'niveaux', 'nivel', 'niveles', 'ngazi', 'level', 'levels', 'kyc', 'verification', 'verifier', 'verifie', 'verifiee', 'verificar', 'identite', 'identidad', 'utambulisho', 'thibitisha', 'uthibitisho', 'plafond', 'plafonds', 'debloquer'];
const TRADING_STEMS = ['trading', 'trader', 'trade', 'bourse', 'ordre', 'ordres', 'order', 'orders', 'orderbook', 'carnet', 'paire', 'paires', 'pair', 'pairs'];
const MARKET_STEMS = ['marche', 'marches', 'market', 'markets', 'reperer', 'scan', 'scanner', 'volume', 'volumes', 'liquidite', 'liquidites', 'soko', 'mercado'];

const DEFINITION_RE = /\b(qu est ce|c est quoi|kesako|keskec|what is|what are|whats|que es|qu es|ni nini|maana ya|definition|definicion)\b/;
const COST_RE = /\b(combien|how much|cuanto|kiasi gani|prix|price|precio|bei|frais|fee|fees|ada|gharama|coute|coutent|cost)\b/;
const WHY_RE = /\b(pourquoi|why|por que|kwa nini|kwanini)\b/;
const WHERE_RE = /\b(ou puis je|ou trouver|ou acheter|where|donde|wapi)\b/;
const HOWTO_RE = /\b(comment|how|como|jinsi|nawezaje|naweza|how do i|how to)\b/;
const LIST_RE = /\b(quelles|quels|which|que divisas|cuales|zipi|gani|liste)\b/;
const YESNO_RE = /\b(est ce que|peut on|puis je|je peux|can i|is it|does it|se puede|puedo|inaweza|naweza)\b/;

function detectQuestionType(qNorm: string): QuestionType {
  if (DEFINITION_RE.test(qNorm)) return 'definition';
  if (COST_RE.test(qNorm)) return 'cost';
  if (WHY_RE.test(qNorm)) return 'why';
  if (WHERE_RE.test(qNorm)) return 'where';
  if (HOWTO_RE.test(qNorm)) return 'howto';
  if (LIST_RE.test(qNorm)) return 'list';
  if (YESNO_RE.test(qNorm)) return 'yesno';
  return 'statement';
}

/**
 * Analyse une question : retire le bavardage, identifie le type de question,
 * le sujet et l'action, détecte les confusions BORB, et reconstruit une vraie
 * question quand l'utilisateur n'a écrit qu'un mot-clé.
 */
export function analyzeQuery(raw: string, detection: LangDetection, uiLang: Lang): QueryAnalysis {
  const qNorm = normalizeText(raw);
  const searchQuery = qNorm ? stripSmallTalk(qNorm) : qNorm;
  const tokens = tokenize(searchQuery);
  const questionType = detectQuestionType(searchQuery);

  const action: QueryAnalysis['action'] =
    tokenCovers(tokens, EXCHANGE_STEMS) ? 'exchange'
      : tokenCovers(tokens, SELL_STEMS) ? 'sell'
        : tokenCovers(tokens, BUY_STEMS) ? 'buy'
          : tokenCovers(tokens, SEND_STEMS) ? 'send'
            : tokenCovers(tokens, SECURE_STEMS) ? 'secure'
              : 'none';

  const hasBorb = tokens.some((t) => t.startsWith('borb'));
  const hasCurrency = tokenCovers(tokens, CURRENCY_STEMS);
  const hasCurrencyUnit = tokenCovers(tokens, ['devise', 'devises', 'currency', 'currencies', 'divisa', 'divisas', 'sarafu']);
  const hasFees = tokenCovers(tokens, ['frais', 'fee', 'fees', 'cout', 'couts', 'cost', 'prix', 'price', 'precio', 'taux', 'rate', 'ada', 'gharama', 'bei', 'kiwango']);
  const hasBalance = /\b(solde|balance|salio)\b/.test(searchQuery);
  const hasP2P = tokenCovers(tokens, P2P_STEMS);
  const hasZando = tokenCovers(tokens, ZANDO_STEMS);
  const hasLevel = tokenCovers(tokens, LEVEL_STEMS);
  const hasTrading = tokenCovers(tokens, TRADING_STEMS);
  const hasMarket = tokenCovers(tokens, MARKET_STEMS);
  // « marketer » est trop proche de « market » : on ne reconstruit pas une
  // question de marché à partir de ce mot.
  const hasMarketer = tokens.some((t) => t.startsWith('marketer') || t.startsWith('ambassadeur'));

  let focus: QueryFocus | 'other' = 'other';
  if (hasBorb) {
    if (hasP2P) focus = 'borb';
    else if (action === 'sell') focus = 'sell';
    else if (action === 'buy') focus = 'buy';
    else if (action === 'exchange') focus = 'exchange';
    else if (action === 'send') focus = 'send';
    else if (hasCurrencyUnit && questionType !== 'definition' && questionType !== 'why') focus = 'exchange';
    else focus = 'borb';
  } else if (hasMarketer) focus = 'other';
  else if (hasP2P) focus = 'p2p';
  else if (hasZando) focus = 'zando';
  else if (hasLevel) focus = 'level';
  else if (hasTrading) focus = 'trading';
  else if (hasMarket) focus = 'market';
  else if (hasCurrency) {
    if (action === 'exchange') focus = 'exchange';
    else if (action === 'send') focus = 'send';
    else focus = 'currencies';
  } else if (action === 'send') focus = 'send';
  else if (action === 'buy') focus = 'buy';
  else if (action === 'sell') focus = 'sell';
  else if (action === 'exchange') focus = 'exchange';
  else if (hasFees || questionType === 'cost') focus = 'fees';

  const misconception = hasBorb && (action === 'send' || hasCurrency || hasBalance);

  const canonical: string[] = [];
  const shortQuery = tokens.length > 0 && tokens.length <= 3;
  const domainOnly = tokens.length > 0 && tokens.every(isDomainToken);
  // Un énoncé explicite sur le BORB (envoi, achat, vente, échange, devise)
  // suffit à reconstruire la question, même avec des mots en plus.
  const decisiveBorb =
    hasBorb && (action === 'send' || action === 'buy' || action === 'sell' || action === 'exchange' || hasCurrency || hasBalance);
  // « vendre du BORB en P2P » doit garder sa réponse spécifique : pas de
  // reconstruction générique par-dessus.
  const keepRawBorbP2P = hasBorb && hasP2P;
  if (focus !== 'other' && !keepRawBorbP2P && ((shortQuery && domainOnly) || decisiveBorb)) {
    const canonicalLang = detection.lang || uiLang;
    canonical.push(...(CANONICAL_QUERIES[focus][canonicalLang] || []));
  }

  const canonicalNote = canonical.length > 0 ? ` canonical="${canonical[0]}"` : '';
  const reasoning = `qtype=${questionType} focus=${focus} action=${action}${canonicalNote}${misconception ? ' borb-confusion' : ''}`;

  return {
    raw,
    searchQuery,
    tokens,
    questionType,
    focus,
    action,
    misconception,
    canonical,
    canonicalUsed: canonical.length > 0,
    reasoning,
  };
}

// ============================================================================
// INDEX
// ============================================================================

interface IndexedKeyword {
  raw: string;
  norm: string;
  tokens: string[];
}

interface IndexedEntry {
  entry: KnowledgeEntry;
  lang: Lang;
  topic: string;
  keywords: IndexedKeyword[];
  titleNorm: string;
  titleTokens: string[];
  suggestionNorms: string[];
}

function indexEntries(): Record<Lang, IndexedEntry[]> {
  const result = {} as Record<Lang, IndexedEntry[]>;
  for (const lang of ALL_LANGS) {
    result[lang] = ALL_KNOWLEDGE[lang].map((entry) => ({
      entry,
      lang,
      topic: TOPIC_EQUIVALENTS[entry.id] || entry.id,
      keywords: (entry.keywords || []).map((kw) => ({
        raw: kw,
        norm: normalizeText(kw),
        tokens: tokenize(kw),
      })),
      titleNorm: normalizeText(entry.response.title),
      titleTokens: tokenize(entry.response.title),
      suggestionNorms: (entry.response.suggestions || []).map((s) => normalizeText(s)),
    }));
  }
  return result;
}

const INDEX = indexEntries();

interface IndexedAlias {
  norm: string;
  tokens: string[];
}

const ALIAS_LANG_INDEX: Record<Lang, IndexedAlias[]> = { fr: [], en: [], es: [], sw: [] };
for (const group of ALIAS_GROUPS) {
  for (const lang of ALL_LANGS) {
    for (const alias of group.aliases[lang]) {
      const norm = normalizeText(alias);
      if (!norm) continue;
      ALIAS_LANG_INDEX[lang].push({ norm, tokens: tokenize(alias) });
    }
  }
}

// Les alias servent aussi à la COMPRÉHENSION : chaque topic hérite des
// formulations naturelles et fautives écrites à la main.
interface TopicAlias {
  lang: Lang;
  raw: string;
  norm: string;
  tokens: string[];
}

const ALIAS_TOPIC_INDEX: Record<string, TopicAlias[]> = {};
for (const group of ALIAS_GROUPS) {
  const topic = TOPIC_EQUIVALENTS[group.topic] || group.topic;
  const list = ALIAS_TOPIC_INDEX[topic] || (ALIAS_TOPIC_INDEX[topic] = []);
  for (const lang of ALL_LANGS) {
    for (const alias of group.aliases[lang]) {
      const norm = normalizeText(alias);
      if (!norm) continue;
      list.push({ lang, raw: alias, norm, tokens: tokenize(alias) });
    }
  }
}

// Profil de mots vides par langue : les mots partagés entre plusieurs langues
// pèsent moins, les mots exclusifs pèsent plus. Cela détecte la langue d'une
// question même sans accent ni ponctuation.
const STOPWORD_SETS: Record<Lang, Set<string>> = { fr: new Set(), en: new Set(), es: new Set(), sw: new Set() };
for (const lang of ALL_LANGS) {
  for (const word of STOPWORDS[lang]) {
    for (const token of normalizeText(word).split(' ')) {
      if (token.length >= 2) STOPWORD_SETS[lang].add(token);
    }
  }
}

// ============================================================================
// DÉTECTION DE LANGUE
// ============================================================================

export interface LangDetection {
  lang: Lang | null;
  scores: Record<Lang, number>;
  margin: number;
}

export function detectQueryLangEx(query: string): LangDetection {
  const qNorm = normalizeText(query);
  const raw = (query || '').toLowerCase();
  const scores: Record<Lang, number> = { fr: 0, en: 0, es: 0, sw: 0 };
  if (!qNorm) return { lang: null, scores, margin: 0 };

  const qWords = qNorm.split(' ').filter(Boolean);
  const qWordSet = new Set(qWords);

  for (const lang of ALL_LANGS) {
    for (const hint of LANGUAGE_HINTS[lang]) {
      const h = normalizeText(hint);
      if (!h) continue;
      if (hasPhrase(qNorm, h)) {
        if (!h.includes(' ')) {
          let owners = 0;
          for (const other of ALL_LANGS) if (STOPWORD_SETS[other].has(h)) owners++;
          // "la", "de", "es"... sont partagés : indice faible.
          scores[lang] += owners > 1 ? 0.45 : Math.min(8, 1 + h.length / 4);
        } else {
          scores[lang] += Math.min(8, 1 + h.length / 4);
        }
      } else if (!h.includes(' ') && h.length >= 2 && qWordSet.has(h)) {
        scores[lang] += 1.4;
      }
    }
    for (const alias of ALIAS_LANG_INDEX[lang]) {
      if (alias.norm.length >= 5 && qNorm.includes(alias.norm)) {
        scores[lang] += Math.min(7, 2 + alias.norm.length / 8);
      } else if (alias.tokens.length >= 2) {
        let hits = 0;
        for (const token of alias.tokens) if (qWordSet.has(token)) hits++;
        const coverage = hits / alias.tokens.length;
        if (coverage >= 0.75) scores[lang] += 1.2 + coverage * 1.5;
      }
    }
  }

  // Profil de mots vides : un mot exclusif à une langue est un indice fort,
  // un mot partagé (la, de, un...) est un indice faible.
  for (const word of qWords) {
    if (word.length < 2) continue;
    let owners = 0;
    for (const lang of ALL_LANGS) if (STOPWORD_SETS[lang].has(word)) owners++;
    if (owners === 0) continue;
    const weight = owners === 1 ? 1.2 : 0.3;
    for (const lang of ALL_LANGS) {
      if (STOPWORD_SETS[lang].has(word)) scores[lang] += weight;
    }
  }

  if (/[¿¡ñ]/i.test(raw)) scores.es += 3;

  const sorted = ALL_LANGS
    .map((lang) => ({ lang, score: scores[lang] }))
    .sort((a, b) => b.score - a.score);
  const max = sorted[0].score;
  const second = sorted[1].score;
  const margin = max - second;

  if (max < 2.5 || margin < 0.8) return { lang: null, scores, margin };
  return { lang: sorted[0].lang, scores, margin };
}

/** Détection simple conservée pour la compatibilité. */
export function detectLang(): Lang {
  const saved = storageGet('uq_lang') as Lang | null;
  if (saved && ALL_LANGS.includes(saved)) return saved;
  try {
    const nav = (typeof navigator !== 'undefined' ? navigator.language || '' : '').toLowerCase();
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('sw')) return 'sw';
  } catch {
    // pas de navigateur
  }
  return 'en';
}

// ============================================================================
// SCORING
// ============================================================================

function scorePhrase(qNorm: string, qTokens: string[], phrase: string): number {
  const pNorm = normalizeText(phrase);
  if (!pNorm) return 0;
  if (!qNorm) return 0;

  // Correspondance de la phrase entière (très forte).
  if (qNorm === pNorm) return 120 + Math.min(60, pNorm.length * 3);
  if (pNorm.length >= 3 && qNorm.includes(pNorm)) return 55 + Math.min(50, pNorm.length * 2);

  if (qTokens.length === 0) return 0;
  const pTokens = tokenize(phrase);
  if (pTokens.length === 0) return 0;

  let hits = 0;
  let sum = 0;
  for (const pt of pTokens) {
    const sim = bestTokenSimilarity(pt, qTokens);
    if (sim >= 0.65) {
      hits++;
      sum += sim;
    }
  }
  const coverage = hits / pTokens.length;
  if (coverage < 0.5) return 0;

  const quality = sum / pTokens.length;
  return coverage * 30 + quality * 20 + Math.min(pTokens.length, 4) * 6 + (pNorm.length >= 5 ? 4 : 0);
}

interface EntryScore {
  score: number;
  matched: string[];
}

function scoreEntry(
  item: IndexedEntry,
  qNorm: string,
  qTokens: string[],
  langWeight: number,
  qLang: Lang | null
): EntryScore {
  if (qTokens.length === 0 && !qNorm) return { score: 0, matched: [] };

  const keywordScores: number[] = [];
  const matched: string[] = [];

  for (const kw of item.keywords) {
    const s = scorePhrase(qNorm, qTokens, kw.raw);
    if (s > 0) {
      keywordScores.push(s);
      matched.push(kw.raw);
    }
  }

  keywordScores.sort((a, b) => b - a);
  let score = keywordScores[0] || 0;
  if (keywordScores[1]) score += keywordScores[1] * 0.25;
  if (keywordScores[2]) score += keywordScores[2] * 0.1;

  // Formulations naturelles écrites à la main (avec fautes) : c'est le cœur
  // de l'enrichissement manuel. On ignore les alias d'un seul mot trop courts
  // pour éviter de réagir à un mot vague isolé.
  const aliases = ALIAS_TOPIC_INDEX[item.topic];
  if (aliases) {
    let bestAlias = 0;
    let bestAliasRaw: string | null = null;
    for (const alias of aliases) {
      if (alias.tokens.length < 2 && alias.norm.length < 8) continue;
      const value = scorePhrase(qNorm, qTokens, alias.raw);
      if (value <= 0) continue;
      const languageBonus = !qLang || alias.lang === qLang ? 1 : 0.9;
      const weighted = value * languageBonus;
      if (weighted > bestAlias) {
        bestAlias = weighted;
        bestAliasRaw = alias.raw;
      }
    }
    if (bestAlias > 0) {
      score += bestAlias * 0.9;
      if (bestAliasRaw) matched.push(`alias:${bestAliasRaw}`);
    }
  }

  // Le titre est une excellente question "naturelle" (ex. clic sur une suggestion).
  const titleScore = scorePhrase(qNorm, qTokens, item.entry.response.title);
  score += titleScore * 0.55;

  // Une suggestion cliquée doit aussi être reconnue.
  let bestSuggestion = 0;
  for (const s of item.suggestionNorms) {
    const value = scorePhrase(qNorm, qTokens, s);
    if (value > bestSuggestion) bestSuggestion = value;
  }
  score += bestSuggestion * 0.12;

  if (keywordScores.length >= 2) score += 10;
  if (keywordScores.length >= 3) score += 6;

  return { score: score * langWeight, matched: [...new Set(matched)] };
}

// ============================================================================
// RÉCUPÉRATION MULTI-LANGUE
// ============================================================================

export interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
  lang: Lang;
  matched: string[];
}

export interface TopicCandidate {
  topic: string;
  score: number;
  best: ScoredEntry;
  variants: Partial<Record<Lang, ScoredEntry>>;
}

export interface RetrievalResult {
  candidates: TopicCandidate[];
  best: TopicCandidate | null;
  qLang: Lang | null;
  qTokens: string[];
  qNorm: string;
}

function retrieveKnowledge(query: string, uiLang: Lang, detection: LangDetection): RetrievalResult {
  const qNorm = normalizeText(query);
  const qTokens = tokenize(query);
  const qLang = detection.lang;
  const weights: Record<Lang, number> = {
    fr: 0.9,
    en: 0.9,
    es: 0.9,
    sw: 0.9,
  };
  for (const lang of ALL_LANGS) {
    if (lang === qLang) weights[lang] = 1.12;
    else if (lang === uiLang) weights[lang] = 1.02;
  }

  const byTopic = new Map<string, TopicCandidate>();

  for (const lang of ALL_LANGS) {
    for (const item of INDEX[lang]) {
      const { score, matched } = scoreEntry(item, qNorm, qTokens, weights[lang], qLang);
      if (score <= 0) continue;

      let group = byTopic.get(item.topic);
      if (!group) {
        group = {
          topic: item.topic,
          score: 0,
          best: { entry: item.entry, score, lang, matched },
          variants: {},
        };
        byTopic.set(item.topic, group);
      }

      const previousVariant = group.variants[lang];
      if (!previousVariant || score > previousVariant.score) {
        group.variants[lang] = { entry: item.entry, score, lang, matched };
      }
      if (score > group.score) {
        group.score = score;
        group.best = { entry: item.entry, score, lang, matched };
      }
    }
  }

  const candidates = [...byTopic.values()].sort((a, b) => b.score - a.score);
  return {
    candidates,
    best: candidates[0] || null,
    qLang,
    qTokens,
    qNorm,
  };
}

// ============================================================================
// RÉPONSES MANUELLES (conversation + sujets)
// ============================================================================

const STRICT_CHAT = new Set([
  'chat_greeting',
  'chat_how_are_you',
  'chat_thanks',
  'chat_farewell',
  'chat_ack',
  'chat_test',
]);

interface ManualCandidate {
  entry: (typeof MANUAL_ANSWERS)[number];
  score: number;
  lang: Lang;
  pattern: string;
}

/** Tokens d'une formulation manuelle : on GARDE les mots vides ("hello",
 * "hi", "merci"...), sinon une salutation ne serait jamais comparée. */
function patternTokens(pattern: string): string[] {
  const normalized = normalizeText(pattern);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter((w) => w.length >= 2)
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

function leftoverTokens(pattern: string, qTokens: string[]): string[] {
  const remaining = [...qTokens];
  for (const pt of patternTokens(pattern)) {
    let bestIdx = -1;
    let bestSim = 0;
    for (let i = 0; i < remaining.length; i++) {
      const sim = tokenSimilarity(remaining[i], pt);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestSim >= 0.7) remaining.splice(bestIdx, 1);
  }
  return remaining.filter((t) => !FILLERS.has(t) && !INTERROGATIVE_WORDS.has(t));
}

const INTERROGATIVE_WORDS = new Set([
  'nani', 'nini', 'gani', 'jinsi', 'kiasi', 'wapi', 'vipi', 'quand', 'comment',
  'pourquoi', 'combien', 'quelle', 'quelles', 'quel', 'quels', 'who', 'what',
  'which', 'how', 'why', 'when', 'where', 'quien', 'que', 'cual', 'cuales',
  'como', 'cuando', 'donde', 'cuanto', 'porque',
]);

function scoreManualPattern(
  entry: (typeof MANUAL_ANSWERS)[number],
  pattern: string,
  qNorm: string,
  qTokens: string[]
): number {
  const pNorm = normalizeText(pattern);
  if (!pNorm || !qNorm) return 0;

  if (qNorm === pNorm) return 240;

  const isStrict = STRICT_CHAT.has(entry.id) || entry.kind === 'chat';
  const isSingleWord = patternTokens(pattern).length <= 1;

  if (pNorm.length >= 5 && qNorm.includes(pNorm)) {
    const left = leftoverTokens(pattern, qTokens);
    // « je m'appelle Destin » : le prénom qui suit n'invalide pas la phrase.
    const allowsName =
      entry.id === 'chat_introduce_user' && left.length === 1 && !INTERROGATIVE_WORDS.has(left[0]);
    if ((isStrict || isSingleWord) && left.length > 0 && !allowsName) return 0;
    const penalty = left.length === 0 ? 1 : allowsName ? 0.9 : left.length === 1 ? 0.55 : 0.3;
    return (145 + Math.min(45, pNorm.length)) * penalty;
  }

  const contentTokens = tokenize(pattern);
  const pTokens = contentTokens.length > 0 ? contentTokens : patternTokens(pattern);
  if (pTokens.length === 0) return 0;

  let hits = 0;
  for (const pt of pTokens) {
    if (bestTokenSimilarity(pt, qTokens) >= 0.7) hits++;
  }
  const coverage = hits / pTokens.length;
  if (coverage < 0.75) return 0;

  const left = leftoverTokens(pattern, qTokens);
  const allowsName =
    entry.id === 'chat_introduce_user' && left.length === 1 && !INTERROGATIVE_WORDS.has(left[0]);
  if ((isStrict || isSingleWord) && left.length > 0 && !allowsName) return 0;

  // Plus la question contient de mots hors de la formulation, plus la
  // correspondance est incertaine : on pénalise au lieu d'ignorer.
  const penalty = left.length === 0 ? 1 : allowsName ? 0.9 : left.length === 1 ? 0.55 : 0.3;
  return (65 + coverage * 40 + Math.min(20, pTokens.length * 4)) * penalty;
}

function findBestManual(
  query: string,
  uiLang: Lang,
  detection: LangDetection
): ManualCandidate | null {
  const qNorm = normalizeText(query);
  const qTokens = tokenize(query);
  if (!qNorm) return null;

  let best: ManualCandidate | null = null;

  for (const entry of MANUAL_ANSWERS) {
    for (const lang of ALL_LANGS) {
      const weight = lang === detection.lang ? 1.06 : lang === uiLang ? 1.0 : 0.94;
      for (const pattern of entry.patterns[lang]) {
        const score = scoreManualPattern(entry, pattern, qNorm, qTokens);
        if (score <= 0) continue;
        const weighted = score * weight;
        if (!best || weighted > best.score) {
          best = { entry, score: weighted, lang, pattern };
        }
      }
    }
  }

  return best && best.score >= 65 ? best : null;
}

function detectRequestedLanguage(query: string): Lang | null {
  const q = normalizeText(query);
  if (/(english|anglais|ingles|kiingereza)/.test(q)) return 'en';
  if (/(francais|french|frances|faransa|kifaransa)/.test(q)) return 'fr';
  if (/(espagnol|spanish|espanol|kihispania)/.test(q)) return 'es';
  if (/(swahili|kiswahili)/.test(q)) return 'sw';
  return null;
}

// ============================================================================
// COMPOSITION DE LA RÉPONSE
// ============================================================================

export interface AnswerText {
  title: string;
  content: string;
  suggestions: string[];
}

export interface AiAnswer extends AnswerText {
  confidence: number;
  intent: string;
  entryId?: string;
  answerLang: Lang;
  detectedLang: Lang | null;
  understoodAs?: string;
  reasoning: string;
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickVariant(candidate: TopicCandidate, lang: Lang): ScoredEntry {
  return candidate.variants[lang] || candidate.best;
}

function titleForTopic(candidate: TopicCandidate, lang: Lang): string | null {
  const variant = candidate.variants[lang];
  return variant ? variant.entry.response.title : null;
}

function isSecurityEntry(entry: KnowledgeEntry): boolean {
  return /security|shamir|2fa|pin|biometric|blackkey|login_security|privacy_private|recover/i.test(entry.id);
}

function isSupportEntry(entry: KnowledgeEntry): boolean {
  return /support|report|bug|emergency/i.test(entry.id);
}

function isMoneyEntry(entry: KnowledgeEntry): boolean {
  return /borb|price|fee|case_|earn|saving|credit|ubi|rich|trading|bubble|treasury|reward|recycle|p2p|zando/i.test(entry.id);
}

function isDefinitionTitle(title: string): boolean {
  const t = normalizeText(title);
  return (
    t.startsWith('qu est ce') ||
    t.startsWith('c est quoi') ||
    t.startsWith('what is') ||
    t.startsWith('que es') ||
    t.includes(' ni nini') ||
    t.startsWith('borb ni') ||
    t.includes('ni nini')
  );
}

function matchesHints(qNorm: string, qTokens: string[], hints: string[]): boolean {
  for (const hint of hints) {
    const h = normalizeText(hint);
    if (!h) continue;
    if (h.includes(' ')) {
      if (qNorm.includes(h)) return true;
    } else if (qTokens.includes(h)) {
      return true;
    }
  }
  return false;
}

function toneOf(entry: KnowledgeEntry, query: string): Tone {
  const qNorm = normalizeText(query);
  const qTokens = tokenize(query);

  if (isSecurityEntry(entry) || matchesHints(qNorm, qTokens, SECURITY_HINTS)) return 'security';
  if (isSupportEntry(entry) || matchesHints(qNorm, qTokens, SUPPORT_HINTS)) return 'support';
  if (isDefinitionTitle(entry.response.title) || matchesHints(qNorm, qTokens, DEFINITION_HINTS)) return 'definition';
  if (matchesHints(qNorm, qTokens, HOWTO_HINTS)) return 'howto';
  if (isMoneyEntry(entry) || matchesHints(qNorm, qTokens, MONEY_HINTS)) return 'money';
  return 'default';
}

function containsEmojiHint(text: string): boolean {
  return /[💡⚠️✅🔒🎁👉🧠🌾💸💳🛡️❄️💰🏆🫧📡🚗🎵🏪]/.test(text);
}

function uniqueStrings(items: (string | null | undefined)[]): string[] {
  const result: string[] = [];
  for (const item of items) {
    const value = (item || '').trim();
    if (value && !result.includes(value)) result.push(value);
  }
  return result;
}

function confidenceForScore(score: number): number {
  if (score >= 200) return 0.97;
  if (score >= 150) return 0.93;
  if (score >= 100) return 0.86;
  if (score >= 60) return 0.7;
  if (score >= 28) return 0.45;
  return 0;
}

function buildKnowledgeAnswer(
  candidate: TopicCandidate,
  retrieval: RetrievalResult,
  uiLang: Lang,
  query: string
): AiAnswer {
  const detected = retrieval.qLang || (candidate.best.score >= 60 ? candidate.best.lang : null);
  const confidence = confidenceForScore(candidate.score);

  // Langue de réponse : langue de la question, sinon langue de l'interface,
  // sinon anglais/français. On ne traduit jamais à la volée : on choisit la
  // fiche existante dans la bonne langue.
  const preference: Lang[] = [];
  for (const lang of [detected, uiLang, 'en', 'fr', 'es', 'sw'] as (Lang | null)[]) {
    if (lang && !preference.includes(lang)) preference.push(lang);
  }

  let answerEntry = candidate.best.entry;
  let answerLang: Lang = candidate.best.lang;
  for (const lang of preference) {
    const variant = candidate.variants[lang];
    if (variant) {
      answerEntry = variant.entry;
      answerLang = variant.lang;
      break;
    }
  }

  const phrases = PHRASES[answerLang];
  const tone = toneOf(answerEntry, query);
  const seed = hashString(query + answerEntry.id);

  let content = '';
  if (confidence >= 0.85) {
    const intro = INTROS[answerLang][tone][seed % INTROS[answerLang][tone].length];
    content = `${intro}\n\n${answerEntry.response.content}`;
  } else if (confidence >= 0.6) {
    content = `${phrases.ambiguous.replace('{title}', answerEntry.response.title)}\n\n${answerEntry.response.content}`;
  } else {
    content = `${phrases.lowConfidence.replace('{title}', answerEntry.response.title)}\n\n${answerEntry.response.content}`;
  }

  // Note honnête si on a dû répondre dans une autre langue que celle demandée.
  if (answerLang !== uiLang && detected && answerLang !== detected) {
    content = `${phrases.translationNote
      .replace('{lang}', LANG_NAMES[answerLang][uiLang])
      .replace('{answerLang}', LANG_NAMES[answerLang][answerLang])}\n\n${content}`;
  }

  // Une petite proposition d'approfondissement, sans surcharger.
  if (!containsEmojiHint(answerEntry.response.content) && answerEntry.response.content.length < 700) {
    content += `\n\n${phrases.offer}`;
  }

  const baseSuggestions = answerEntry.response.suggestions || [];
  const relatedTitles = retrieval.candidates
    .filter((c) => c.topic !== candidate.topic)
    .slice(0, 4)
    .map((c) => titleForTopic(c, answerLang));

  const suggestions =
    confidence >= 0.85
      ? uniqueStrings([...baseSuggestions, ...relatedTitles]).slice(0, 4)
      : uniqueStrings([...relatedTitles.slice(0, 2), ...baseSuggestions]).slice(0, 4);

  return {
    title: answerEntry.response.title,
    content,
    suggestions,
    confidence,
    intent: candidate.topic,
    entryId: answerEntry.id,
    answerLang,
    detectedLang: detected,
    understoodAs: confidence < 0.85 ? answerEntry.response.title : undefined,
    reasoning: `topic=${candidate.topic} score=${Math.round(candidate.score)} matched=${candidate.best.matched.join('|')}`,
  };
}

function matchesOffTopic(qNorm: string): boolean {
  for (const lang of ALL_LANGS) {
    for (const hint of OFF_TOPIC_HINTS[lang]) {
      const h = normalizeText(hint);
      if (h && hasPhrase(qNorm, h)) return true;
    }
  }
  return false;
}

function buildFallbackAnswer(
  query: string,
  uiLang: Lang,
  detection: LangDetection
): AiAnswer {
  const answerLang = detection.lang || uiLang;
  const phrases = PHRASES[answerLang];
  const qNorm = normalizeText(query);

  if (matchesOffTopic(qNorm)) {
    return {
      title: phrases.offTopicTitle,
      content: phrases.offTopic,
      suggestions: getDynamicSuggestions(answerLang),
      confidence: 0.2,
      intent: 'off_topic',
      answerLang,
      detectedLang: detection.lang,
      reasoning: 'off-topic hints detected',
    };
  }

  const shortQuery = query.length > 90 ? `${query.slice(0, 87)}...` : query;
  return {
    title: phrases.noMatchTitle,
    content: phrases.noMatch.replace('{query}', shortQuery),
    suggestions: getDynamicSuggestions(answerLang),
    confidence: 0.15,
    intent: 'no_match',
    answerLang,
    detectedLang: detection.lang,
    reasoning: 'no strong match',
  };
}

const BORB_AWARE_INTENTS = new Set([
  'topic_borb',
  'topic_transfer',
  'topic_borb_buy',
  'topic_borb_exchange',
  'topic_borb_p2p',
  'topic_currencies',
]);

function finalizeAnswer(answer: AiAnswer, analysis: QueryAnalysis): AiAnswer {
  const reminder =
    analysis.misconception && !BORB_AWARE_INTENTS.has(answer.intent)
      ? `${BORB_REMINDER[answer.answerLang]}\n\n`
      : '';
  return {
    ...answer,
    content: reminder + answer.content,
    reasoning: `${analysis.reasoning} | ${answer.reasoning}`,
  };
}

/**
 * Point d'entrée principal : comprend la question, choisit une réponse
 * naturelle et constructive, même en cas de faute ou de formulation floue.
 */
export function composeAnswer(query: string, uiLang: Lang): AiAnswer {
  const cleaned = (query || '').trim();
  const detection = detectQueryLangEx(cleaned);
  const analysis = analyzeQuery(cleaned, detection, uiLang);

  // On évalue la question nettoyée puis sa reconstruction canonique (quand
  // l'utilisateur n'a écrit qu'un mot-clé) et on garde la meilleure lecture.
  const searchQueries = uniqueStrings([analysis.searchQuery, ...analysis.canonical]);
  let manual: ManualCandidate | null = null;
  let retrieval: RetrievalResult | null = null;
  for (const candidateQuery of searchQueries) {
    const candidateManual = findBestManual(candidateQuery, uiLang, detection);
    if (candidateManual && (!manual || candidateManual.score > manual.score)) {
      manual = candidateManual;
    }
    const candidateRetrieval = retrieveKnowledge(candidateQuery, uiLang, detection);
    if (
      !retrieval ||
      (candidateRetrieval.best && (!retrieval.best || candidateRetrieval.best.score > retrieval.best.score))
    ) {
      retrieval = candidateRetrieval;
    }
  }
  if (!retrieval) {
    retrieval = retrieveKnowledge(analysis.searchQuery, uiLang, detection);
  }

  // Une fiche précise peut battre une réponse manuelle trop générale.
  // Exception : si la fiche ne peut pas répondre dans la langue de la question
  // alors que la réponse manuelle le peut, on privilégie la langue naturelle.
  // Les échanges sociaux (présentation, politesse) restent conversationnels.
  const SOCIAL_INTENTS = new Set(['chat_introduce_user', 'chat_nice_to_meet', 'chat_apology', 'chat_compliment']);
  let useManual = !!manual;
  if (manual && SOCIAL_INTENTS.has(manual.entry.id)) {
    useManual = true;
  } else if (manual && retrieval.best && retrieval.best.score > manual.score * 1.2) {
    const desired = detection.lang || uiLang;
    const manualHasDesired = !!manual.entry.answers[desired];
    const knowledgeHasDesired = !!retrieval.best.variants[desired];
    if (!(manualHasDesired && !knowledgeHasDesired)) {
      useManual = false;
    }
  }

  if (manual && useManual) {
    let answerLang = manual.lang;
    if (manual.entry.id === 'chat_language') {
      const requested = detectRequestedLanguage(cleaned);
      if (requested) answerLang = requested;
    }
    const text = manual.entry.answers[answerLang] || manual.entry.answers[uiLang];
    const confidence = manual.score >= 200 ? 0.96 : manual.score >= 140 ? 0.9 : manual.score >= 90 ? 0.78 : 0.66;
    return finalizeAnswer(
      {
        title: text.title,
        content: text.content,
        suggestions: text.suggestions,
        confidence,
        intent: manual.entry.id,
        answerLang,
        detectedLang: detection.lang,
        reasoning: `manual=${manual.entry.id} pattern="${manual.pattern}" score=${Math.round(manual.score)}`,
      },
      analysis
    );
  }

  if (retrieval.best && retrieval.best.score >= 28) {
    // Une question manifestement hors sujet ne doit pas recevoir une fiche UQ
    // approximative : on préfère le dire honnêtement et proposer des pistes.
    if (
      confidenceForScore(retrieval.best.score) < 0.9 &&
      matchesOffTopic(analysis.searchQuery)
    ) {
      return buildFallbackAnswer(analysis.searchQuery, uiLang, detection);
    }
    return finalizeAnswer(
      buildKnowledgeAnswer(retrieval.best, retrieval, uiLang, analysis.searchQuery),
      analysis
    );
  }

  return buildFallbackAnswer(analysis.searchQuery, uiLang, detection);
}

// ============================================================================
// COMPATIBILITÉ : RECHERCHE SIMPLE
// ============================================================================

export interface SearchResult {
  primary: KnowledgeEntry;
  related: KnowledgeEntry[];
  score: number;
  matchedKeywords: string[];
}

export function smartSearch(query: string, lang: Lang): SearchResult | null {
  const detection = detectQueryLangEx(query);
  const retrieval = retrieveKnowledge(query, lang, detection);
  if (!retrieval.best || retrieval.best.score < 20) return null;

  const primary = pickVariant(retrieval.best, lang).entry;
  const related = retrieval.candidates
    .slice(1, 5)
    .map((candidate) => pickVariant(candidate, lang).entry)
    .filter((entry) => entry.id !== primary.id);

  return {
    primary,
    related,
    score: retrieval.best.score,
    matchedKeywords: retrieval.best.best.matched,
  };
}

export function findAnswer(query: string, lang: Lang): KnowledgeEntry | null {
  const result = smartSearch(query, lang);
  return result?.primary || null;
}

/** Récupère une fiche par id, avec repli sur les langues / topics équivalents. */
export function getEntryById(id: string, lang: Lang): KnowledgeEntry | undefined {
  const topic = TOPIC_EQUIVALENTS[id] || id;
  const order: Lang[] = [];
  for (const candidate of [lang, ...ALL_LANGS]) {
    if (!order.includes(candidate)) order.push(candidate);
  }
  for (const candidateLang of order) {
    const found = ALL_KNOWLEDGE[candidateLang].find(
      (entry) => entry.id === id || (TOPIC_EQUIVALENTS[entry.id] || entry.id) === topic
    );
    if (found) return found;
  }
  return undefined;
}

// ============================================================================
// SUGGESTIONS DYNAMIQUES
// ============================================================================

const SUGGESTIONS_POOL: Record<Lang, string[]> = {
  fr: [
    'Comment créer un compte ?',
    'Combien vaut 1 BORB ?',
    'Comment gagner des BORB ?',
    'Comment activer la 2FA ?',
    'Le Trésor',
    'C\'est quoi le BORB ?',
    'Comment vendre sur Zando ?',
    'Comment épargner ?',
    'Les 12 méthodes',
    'Contacter le support',
  ],
  en: [
    'How to create an account?',
    'How much is 1 BORB?',
    'How to earn BORB?',
    'How to enable 2FA?',
    'The Treasury',
    'What is BORB?',
    'How to sell on Zando?',
    'How to save?',
    '12 methods',
    'Contact support',
  ],
  es: [
    '¿Cómo crear una cuenta?',
    '¿Cuánto vale 1 BORB?',
    '¿Cómo ganar BORB?',
    '¿Cómo activar 2FA?',
    'El Tesoro',
    '¿Qué es BORB?',
    '¿Cómo vender en Zando?',
    '¿Cómo ahorrar?',
    '12 métodos',
    'Contactar soporte',
  ],
  sw: [
    'Jinsi ya kufungua akaunti?',
    'BORB 1 ni ngapi?',
    'Jinsi ya kupata BORB?',
    'Jinsi ya kuwezesha 2FA?',
    'Hazina',
    'BORB ni nini?',
    'Jinsi ya kuuza Zando?',
    'Jinsi ya kuweka akiba?',
    'Njia 12',
    'Wasiliana na msaada',
  ],
};

function readHistory(lang: Lang): string[] {
  const historyKey = `uqai_history_${lang}`;
  try {
    const parsed = JSON.parse(storageGet(historyKey) || '[]');
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Suggestions : 6 sujets de base, enrichis des 2 dernières questions.
 */
export function getDynamicSuggestions(lang: Lang): string[] {
  const base = SUGGESTIONS_POOL[lang] || SUGGESTIONS_POOL.fr;
  const history = readHistory(lang);

  if (history.length > 0) {
    const recent = history.slice(-2);
    const remaining = base.filter((s) => !recent.includes(s));
    return uniqueStrings([...recent, ...remaining]).slice(0, 6);
  }

  return base.slice(0, 6);
}

export function saveToHistory(query: string, lang: Lang) {
  const historyKey = `uqai_history_${lang}`;
  const history = readHistory(lang);
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return;
  if (history[history.length - 1] !== trimmedQuery) history.push(trimmedQuery);
  storageSet(historyKey, JSON.stringify(history.slice(-10)));
}

// ============================================================================
// MESSAGES DE BIENVENUE
// ============================================================================

export const WELCOME_MESSAGES: Record<Lang, { title: string; content: string; suggestions: string[] }> = {
  fr: {
    title: 'Bonjour ! 👋',
    content:
      "Je suis UQ AI, ton assistant intelligent. Pose-moi n'importe quelle question sur UQ, le BORB, la sécurité, ou comment gagner des BORB.\n\nÉcris naturellement, même avec des fautes : je ferai de mon mieux pour comprendre.",
    suggestions: getDynamicSuggestions('fr'),
  },
  en: {
    title: 'Hello! 👋',
    content:
      "I'm UQ AI, your smart assistant. Ask me anything about UQ, BORB, security, or how to earn BORB.\n\nWrite naturally, typos are fine — I'll do my best to understand.",
    suggestions: getDynamicSuggestions('en'),
  },
  es: {
    title: '¡Hola! 👋',
    content:
      'Soy UQ AI, tu asistente inteligente. Pregúntame lo que quieras sobre UQ, BORB, seguridad o cómo ganar BORB.\n\nEscribe con naturalidad, aunque tengas faltas: haré lo posible por entenderte.',
    suggestions: getDynamicSuggestions('es'),
  },
  sw: {
    title: 'Habari! 👋',
    content:
      'Mimi ni UQ AI, msaidizi wako mahiri. Niulize chochote kuhusu UQ, BORB, usalama, au jinsi ya kupata BORB.\n\nAndika kawaida, hata ukiwa na makosa — nitajitahidi kukuelewa.',
    suggestions: getDynamicSuggestions('sw'),
  },
};

export * from './borbContent.fr';
export * from './menuStructure';
