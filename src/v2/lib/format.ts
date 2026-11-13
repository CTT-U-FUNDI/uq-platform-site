const LOCALE = 'fr-FR';

const numberFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/**
 * Compteurs style réseau social : 123 · 10,2K · 1,2M · 1,5Md.
 * Une décimale au plus, virgule française, arrondi vers le bas (1999 -> 1,9K).
 */
const PAIERS_COMPACTES: [number, string][] = [
  [1_000_000_000, 'Md'],
  [1_000_000, 'M'],
  [1_000, 'K'],
];

export const formatCount = (value: number | null | undefined): string => {
  const brut = Number(value);
  const n = Number.isFinite(brut) ? Math.max(0, Math.floor(brut)) : 0;
  for (const [seuil, suffixe] of PAIERS_COMPACTES) {
    if (n >= seuil) {
      const uneDecimale = Math.floor((n / seuil) * 10) / 10;
      return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(
        uneDecimale,
      )}${suffixe}`;
    }
  }
  return String(n);
};

export const formatNumber = (value: number | null | undefined, maxFrac = 2): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  if (!Number.isFinite(value)) return '0';
  if (maxFrac === 0) return integerFormatter.format(value);
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(value);
};

/** 1234567.8 -> "1 234 567" (pour les points entiers) */
export const formatInt = (value: number | null | undefined): string => formatNumber(value, 0);

const SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CDF: 'FC',
  XOF: 'CFA',
  XAF: 'FCFA',
  NGN: '₦',
  ZAR: 'R',
  KES: 'KSh',
  INR: '₹',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  JPY: '¥',
  BRL: 'R$',
  MAD: 'DH',
  DZD: 'DA',
  TND: 'DT',
  RWF: 'FRw',
  UGX: 'USh',
  TZS: 'TSh',
  GHS: 'GH₵',
  ETB: 'Br',
  AED: 'AED',
  SAR: 'SAR',
  TRY: '₺',
};

export const currencySymbol = (code: string | undefined | null): string => {
  if (!code) return '';
  const key = code.toUpperCase();
  return SYMBOLS[key] || key;
};

export const formatCurrency = (amount: number, code: string): string => {
  const symbol = currencySymbol(code);
  const decimals = amount >= 1000 ? 0 : 2;
  const numeric = formatNumber(amount, decimals);
  return symbol.length <= 1 ? `${symbol}${numeric}` : `${numeric} ${symbol}`;
};

/** Accepte un timestamp en secondes ou millisecondes. */
const toDate = (timestamp: number): Date => {
  if (!timestamp || !Number.isFinite(timestamp)) return new Date(0);
  return new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
};

export const formatDate = (timestamp: number): string => {
  const date = toDate(timestamp);
  if (date.getTime() === 0) return '—';
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (timestamp: number): string => {
  const date = toDate(timestamp);
  if (date.getTime() === 0) return '';
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (timestamp: number): string => {
  const date = toDate(timestamp);
  if (date.getTime() === 0) return '—';
  return `${date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })} · ${formatTime(
    timestamp,
  )}`;
};

/** "aujourd'hui", "hier", puis date courte. */
export const relativeDay = (timestamp: number): string => {
  const date = toDate(timestamp);
  if (date.getTime() === 0) return '—';
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diff === 0) return `Aujourd'hui`;
  if (diff === 1) return 'Hier';
  if (diff < 7) return date.toLocaleDateString(LOCALE, { weekday: 'long' });
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' });
};

export const initials = (value: string | undefined | null): string => {
  if (!value) return 'UQ';
  const clean = value.replace(/^UQ-/i, '').replace(/["'()]/g, '').trim();
  if (!clean) return 'UQ';
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

/** `media_urls` arrive souvent en JSON string. */
export const parseMediaUrls = (raw: string | string[] | null | undefined): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((entry) => typeof entry === 'string');
    if (typeof parsed === 'string') return parsed ? [parsed] : [];
    return [];
  } catch {
    // Anciennes lignes : une adresse brute (http, chemin local ou data URI)
    // etait stockee sans tableau JSON.
    return raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:') ? [raw] : [];
  }
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;
const IMAGE_DATA = /^data:image\//i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/**
 * Vrai si l'adresse est un visuel : extension d'image ou data URI base64
 * (les images importees depuis l'appareil sont envoyees en data URI).
 */
export const isImageUrl = (value: string): boolean =>
  Boolean(value) && (IMAGE_DATA.test(value) || IMAGE_EXT.test(value));

/** Premier visuel exploitable d'une liste de medias. */
export const firstImageUrl = (media: string[]): string => media.find(isImageUrl) || '';

/** Vrai si l'adresse est une vidéo hébergée (les data URI d'image ne le sont jamais). */
export const isVideoUrl = (value: string): boolean =>
  Boolean(value) && !/^data:/i.test(value) && VIDEO_EXT.test(value);

/** Première vidéo exploitable d'une liste de medias. */
export const firstVideoUrl = (media: string[]): string => media.find(isVideoUrl) || '';

/**
 * Adresse facturable par le lecteur : le premier lien http qui n'est pas une
 * image (un contenu lecteur est un lien externe, pas une photo d'offre).
 */
export const firstContentUrl = (media: string[]): string =>
  media.find((entry) => /^https?:\/\//i.test(entry) && !isImageUrl(entry)) || '';

/**
 * Une vitrine de boutique n'a pas de prix : elle se paie en présence (5 % du
 * catalogue par 24 h), pas à l'achat. Aucun écran ne doit lui afficher de
 * montant ni de bouton panier.
 */
export const estVitrineBoutique = (item: { type?: string | null } | undefined | null): boolean =>
  String(item?.type || '').trim().toLowerCase() === 'boutique';

/** Compte à rebours de présence : « 6 j 13 h », « 13 h 20 min », « 40 min ». */
export const formatDureeRestante = (secondes: number): string => {
  const total = Math.max(0, Math.floor(Number(secondes) || 0));
  if (total === 0) return 'Expirée';
  const jours = Math.floor(total / 86400);
  const heures = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (jours > 0) return `${jours} j ${heures} h`;
  if (heures > 0) return `${heures} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${total} s`;
};

const TX_LABELS: Record<string, string> = {  send: 'Envoi',
  receive: 'Reception',
  transfer: 'Transfert',
  ubi: 'Revenu universel',
  convert: 'Conversion',
  claim: 'Reclamation',
  reward: 'Recompense',
  fee: 'Frais',
  buy: 'Achat',
  sell: 'Vente',
  deposit: 'Depot',
  withdraw: 'Retrait',
};

export const txLabel = (type: string | undefined | null): string => {
  if (!type) return 'Operation';
  const key = type.toLowerCase();
  return TX_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

export const isIncomingTx = (type: string | undefined | null): boolean => {
  if (!type) return false;
  const key = type.toLowerCase();
  return ['receive', 'ubi', 'claim', 'reward', 'deposit', 'buy'].includes(key);
};

export const shortUq = (uq: string): string => {
  if (!uq) return '';
  if (uq.length <= 16) return uq;
  return `${uq.slice(0, 10)}…${uq.slice(-4)}`;
};

export const pct = (value: number): string => `${formatNumber(value, 1)}%`;


/**
 * Nettoie un pseudo pour l'affichage :
 * - retire les @
 * - retire les espaces
 * - met la premiere lettre en majuscule
 * Ex: "uq@dev" -> "UqDev", "@uqdev" -> "UqDev"
 */
export function nettoyerPseudo(pseudo: string | null | undefined): string {
  if (!pseudo) return 'Membre UQ';
  const nettoye = pseudo.replace(/@/g, '').replace(/\s+/g, '').trim();
  if (!nettoye) return 'Membre UQ';
  return nettoye.charAt(0).toUpperCase() + nettoye.slice(1);
}
