/**
 * Bougies et indicateurs techniques calculés à partir de séries réellement
 * chargées (source externe OHLC ou exécutions internes). Aucune série n'est
 * simulée : quand la source ne renvoie rien, le calcul renvoie une liste vide.
 */

export interface Candle {
  /** Bornes de la bougie, en secondes. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CandlePeriod = '1h' | '4h' | '1j' | '1sem' | '1mois';

/** Durée d'une bougie, en secondes. */
export const PERIODE_SECONDES: Record<CandlePeriod, number> = {
  '1h': 3600,
  '4h': 4 * 3600,
  '1j': 24 * 3600,
  '1sem': 7 * 24 * 3600,
  '1mois': 30 * 24 * 3600,
};

const nombre = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Bougies brutes telles que renvoyées par /api/external/market/ohlc/{symbol}. */
export interface RawOhlcBar {
  time?: string | number;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close?: number | string;
  volume?: number | string;
}

/**
 * Horodatage d'une barre externe : biquote renvoie un ISO-8601
 * (« 2026-10-30T20:00:00Z »), d'autres sources un epoch en secondes ou
 * millisecondes. Tout est ramené en secondes.
 */
function tempsEnSecondes(brut: string | number | undefined): number {
  if (brut === undefined || brut === null || brut === '') return 0;
  if (typeof brut === 'number') return brut > 1e11 ? brut / 1000 : brut;
  const numerique = Number(brut);
  if (Number.isFinite(numerique)) return numerique > 1e11 ? numerique / 1000 : numerique;
  const date = new Date(brut);
  const ms = date.getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

/** Convertit une barre externe en bougie ; renvoie null si le champ manque. */
export function candleDepuisBarre(barre: RawOhlcBar): Candle | null {
  const open = nombre(barre.open);
  const high = nombre(barre.high);
  const low = nombre(barre.low);
  const close = nombre(barre.close);
  if (open === null || high === null || low === null || close === null) return null;

  return {
    time: tempsEnSecondes(barre.time),
    open,
    high,
    low,
    close,
    volume: nombre(barre.volume) ?? 0,
  };
}

/** Agrège des exécutions (prix + montant + horodatage) en bougies par bucket. */
export function bougiesDepuisExecutions(
  rows: { price: number; amount: number; created_at: number }[],
  periode: CandlePeriod,
): Candle[] {
  const triees = [...rows]
    .map((row) => ({
      prix: nombre(row.price),
      montant: Math.max(nombre(row.amount) ?? 0, 0),
      instant: nombre(row.created_at) ?? 0,
    }))
    .filter((row): row is { prix: number; montant: number; instant: number } =>
      row.prix !== null && row.prix > 0,
    )
    .sort((a, b) => a.instant - b.instant);

  const buckets = new Map<number, { debut: number; prix: number[]; volumes: number[] }>();
  for (const row of triees) {
    const cle = cleDeRegroupement(row.instant, periode);
    const bucket = buckets.get(cle) || { debut: row.instant, prix: [], volumes: [] };
    bucket.prix.push(row.prix);
    bucket.volumes.push(row.montant);
    buckets.set(cle, bucket);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => ({
      time: bucket.debut,
      open: bucket.prix[0],
      close: bucket.prix[bucket.prix.length - 1],
      high: Math.max(...bucket.prix),
      low: Math.min(...bucket.prix),
      volume: bucket.volumes.reduce((sum, value) => sum + value, 0),
    }));
}

/**
 * Clé de regroupement d'une bougie. Les semaines et les mois sont calendaires
 * (lundi, mois civil) parce que les sources forex n'ont pas de barre le
 * week-end : un regroupement en blocs fixes de 7 ou 30 jours les découperait
 * n'importe comment.
 */
function cleDeRegroupement(time: number, periode: CandlePeriod): number {
  if (periode !== '1sem' && periode !== '1mois') {
    return Math.floor(time / PERIODE_SECONDES[periode]) * PERIODE_SECONDES[periode];
  }
  const date = new Date(time * 1000);
  if (periode === '1mois') return date.getFullYear() * 12 + date.getMonth();
  const lundi = new Date(date);
  lundi.setHours(0, 0, 0, 0);
  lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
  return Math.floor(lundi.getTime() / 1000);
}

/** Regroupe des bougies (ex. journalières) en bougies d'une période plus longue. */
export function regrouperCandles(candles: Candle[], periode: CandlePeriod): Candle[] {
  const buckets = new Map<number, Candle[]>();
  for (const candle of candles) {
    const cle = cleDeRegroupement(candle.time, periode);
    const liste = buckets.get(cle) || [];
    liste.push(candle);
    buckets.set(cle, liste);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, groupe]) => {
      const triees = [...groupe].sort((a, b) => a.time - b.time);
      return {
        time: triees[0].time,
        open: triees[0].open,
        close: triees[triees.length - 1].close,
        high: Math.max(...triees.map((entry) => entry.high)),
        low: Math.min(...triees.map((entry) => entry.low)),
        volume: triees.reduce((sum, entry) => sum + entry.volume, 0),
      };
    });
}

export function trierCandles(candles: Candle[]): Candle[] {
  return [...candles].sort((a, b) => a.time - b.time);
}

/** Moyenne mobile simple ; la valeur est null tant que la fenêtre n'est pas pleine. */
export function moyenneMobile(valeurs: number[], fenetre: number): (number | null)[] {
  const sortie: (number | null)[] = [];
  let cumul = 0;
  for (let i = 0; i < valeurs.length; i += 1) {
    cumul += valeurs[i];
    if (i >= fenetre) cumul -= valeurs[i - fenetre];
    sortie.push(i >= fenetre - 1 ? cumul / fenetre : null);
  }
  return sortie;
}

/** RSI de Wilder sur la période demandée (14 par défaut). */
export function rsi(valeurs: number[], periode = 14): (number | null)[] {
  const sortie: (number | null)[] = new Array(valeurs.length).fill(null);
  if (valeurs.length <= periode) return sortie;

  let gain = 0;
  let perte = 0;
  for (let i = 1; i <= periode; i += 1) {
    const delta = valeurs[i] - valeurs[i - 1];
    if (delta >= 0) gain += delta;
    else perte -= delta;
  }
  let gainMoyen = gain / periode;
  let perteMoyenne = perte / periode;
  sortie[periode] = perteMoyenne === 0 ? 100 : 100 - 100 / (1 + gainMoyen / perteMoyenne);

  for (let i = periode + 1; i < valeurs.length; i += 1) {
    const delta = valeurs[i] - valeurs[i - 1];
    gainMoyen = (gainMoyen * (periode - 1) + Math.max(delta, 0)) / periode;
    perteMoyenne = (perteMoyenne * (periode - 1) + Math.max(-delta, 0)) / periode;
    sortie[i] = perteMoyenne === 0 ? 100 : 100 - 100 / (1 + gainMoyen / perteMoyenne);
  }
  return sortie;
}

const lissageExponentiel = (valeurs: number[], periode: number): number[] => {
  const alpha = 2 / (periode + 1);
  const sortie: number[] = [];
  valeurs.forEach((value, index) => {
    sortie.push(index === 0 ? value : value * alpha + sortie[index - 1] * (1 - alpha));
  });
  return sortie;
};

/** MACD (12, 26, 9) : ligne, signal et histogramme. */
export function macd(
  valeurs: number[],
  rapide = 12,
  lente = 26,
  signal = 9,
): { ligne: number[]; signal: number[]; histogramme: number[] } {
  if (valeurs.length === 0) return { ligne: [], signal: [], histogramme: [] };
  const emaRapide = lissageExponentiel(valeurs, rapide);
  const emaLente = lissageExponentiel(valeurs, lente);
  const ligne = emaRapide.map((value, index) => value - emaLente[index]);
  const emaSignal = lissageExponentiel(ligne, signal);
  return {
    ligne,
    signal: emaSignal,
    histogramme: ligne.map((value, index) => value - emaSignal[index]),
  };
}
