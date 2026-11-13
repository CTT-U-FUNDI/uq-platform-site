// ============================================================
// CURRENCY SERVICE — Conversion + formatage
// ============================================================
import { OracleAll, fetchAllRates } from './oracle';

let cachedRates: OracleAll | null = null;
let lastFetch = 0;
const CACHE_MS = 60 * 1000;

export async function getRates(): Promise<OracleAll> {
  const now = Date.now();
  if (cachedRates && now - lastFetch < CACHE_MS) return cachedRates;
  cachedRates = await fetchAllRates();
  lastFetch = now;
  return cachedRates;
}

export function clearCache() {
  cachedRates = null;
  lastFetch = 0;
}

// Une devise que l'oracle n'a pas observée n'a pas de taux : on remonte une
// erreur plutôt que de convertir au taux implicite « 1 pour 1 ».
function tauxObs(rates: OracleAll, devise: string): number {
  const taux = Number(rates.rates?.[devise]);
  if (!taux || taux <= 0) throw new Error(`Taux indisponible pour ${devise}`);
  return taux;
}

// `rates` est une table d'UNITES PAR DOLLAR. Y convertir un montant en BORB sans
// le prix du BORB revenait à écrire « 1 BORB = 1 USD ». Sans prix publié, la
// conversion échoue au lieu d'inventer une parité.
function prixBorbUsd(rates: OracleAll): number {
  const prix = Number(rates.borb_usd);
  if (!prix || prix <= 0) {
    throw new Error('Prix du BORB non réglé : aucune conversion BORB ne sera inventée');
  }
  return prix;
}

// 1 BORB = prixBorbUsd USD = prixBorbUsd × taux unités de la devise
export async function convertBORBToCDF(borb: number, devise = 'CDF'): Promise<number> {
  const rates = await getRates();
  return borb * prixBorbUsd(rates) * tauxObs(rates, devise);
}

// X devise / (taux × prix du BORB) = BORB
export async function convertCDFToBORB(montant: number, devise = 'CDF'): Promise<number> {
  const rates = await getRates();
  return montant / (tauxObs(rates, devise) * prixBorbUsd(rates));
}

// Conversion générique entre deux devises observées (units par USD), ou vers
// depuis le BORB via le prix publié.
export async function convert(montant: number, from: string, to: string): Promise<number> {
  const rates = await getRates();
  const enUsd = (montantDevise: number, devise: string) =>
    devise === 'BORB'
      ? montantDevise * prixBorbUsd(rates)
      : montantDevise / tauxObs(rates, devise);
  const depuisUsd = (montantUsd: number, devise: string) =>
    devise === 'BORB'
      ? montantUsd / prixBorbUsd(rates)
      : montantUsd * tauxObs(rates, devise);
  return depuisUsd(enUsd(montant, from), to);
}

// Format CDF (espace milliers, pas de décimales)
export function formatCDF(montant: number): string {
  const rounded = Math.round(montant);
  return `${rounded.toLocaleString('fr-FR').replace(/\u202f/g, ' ')} FC`;
}

// Format BORB (2 décimales)
export function formatBORB(montant: number): string {
  if (montant >= 1) return `${montant.toFixed(2)} BORB`;
  if (montant >= 0.0001) return `${montant.toFixed(6)} BORB`;
  return `${montant.toExponential(2)} BORB`;
}

// Format USD
export function formatUSD(montant: number): string {
  return `$${montant.toFixed(2)} USD`;
}

// Format intelligent selon devise
export function formatDevise(montant: number, devise: string): string {
  if (devise === 'CDF') return formatCDF(montant);
  if (devise === 'BORB') return formatBORB(montant);
  if (devise === 'USD') return formatUSD(montant);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    maximumFractionDigits: 2,
  }).format(montant);
}

// Affichage intelligent des exposants (>9 zéros)
export function formatExponent(nombre: number): string {
  if (nombre === 0) return '0';
  const abs = Math.abs(nombre);
  if (abs >= 0.000001 && abs < 1) {
    const str = nombre.toFixed(20).replace(/0+$/, '');
    const zeros = str.match(/\.(0+)/)?.[1].length || 0;
    if (zeros > 9) return nombre.toExponential(4);
  }
  return nombre.toString();
}
