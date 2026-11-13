// ============================================================
// SERVICE DE TAUX DE CHANGE — 100 % backend
// ============================================================
// Aucun appel direct aux API externes depuis le navigateur :
//   - les devises viennent de  GET /api/oracle/fiat   (84 devises)
//   - l'or et le BTC viennent de GET /api/price/all
// Le backend gère les fournisseurs, le cache et les replis ; le
// navigateur n'a donc plus jamais d'erreur CORS.

import { api } from '../api/client';

export interface Rates {
  [key: string]: number;
}

export interface CryptoPrices {
  gold: number;
  btc: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let cachedRates: Rates | null = null;
let lastFetch = 0;
let cachedSource = '';

/** Dernière source réellement utilisée par l'oracle (ex. « live », « cache »). */
export function ratesSource(): string {
  return cachedSource;
}

async function fetchOracleRates(): Promise<{ rates: Rates; source: string } | null> {
  try {
    const { data } = await api.get<{ rates?: Rates; source?: string }>('/api/oracle/fiat');
    if (!data?.rates) return null;
    // Le backend renvoie « 1 USD = X unités » : on force USD = 1 comme référence.
    return { rates: { ...data.rates, USD: 1 }, source: data.source || 'oracle' };
  } catch {
    return null;
  }
}

/** Or + BTC depuis le backend (remplace CoinGecko côté navigateur). */
export async function fetchCryptoPrices(): Promise<CryptoPrices | null> {
  try {
    const { data } = await api.get<{
      prices?: { gold_usd_per_ounce?: number; btc_usd?: number };
    }>('/api/price/all');
    const prices = data?.prices;
    if (!prices) return null;
    return {
      gold: Number(prices.gold_usd_per_ounce) || 0,
      btc: Number(prices.btc_usd) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Charge les taux de change. Renvoie un objet vide si le backend est
 * injoignable : les appelants doivent alors afficher un état « indisponible »
 * plutôt qu'un taux inventé.
 */
export async function loadRates(force: boolean = false): Promise<Rates> {
  const now = Date.now();

  if (!force && cachedRates && now - lastFetch < CACHE_DURATION_MS) {
    return cachedRates;
  }

  const result = await fetchOracleRates();
  if (result) {
    cachedRates = result.rates;
    cachedSource = result.source;
    lastFetch = now;
    return result.rates;
  }

  // Backend indisponible : on garde le dernier jeu connu s'il existe.
  return cachedRates ?? {};
}

/** Convertit un montant entre deux devises à partir des taux « unités par USD ». */
export function convert(amount: number, from: string, to: string, rates: Rates): number {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate || !Number.isFinite(fromRate) || !Number.isFinite(toRate)) {
    return NaN;
  }
  return (amount / fromRate) * toRate;
}

/** Formate un montant dans une devise (repli lisible si le code est inconnu). */
export function formatPrice(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
