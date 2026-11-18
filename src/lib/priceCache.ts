import apiClient from '../api/client';

/** Cache local des taux (60s) — evite de frapper le serveur a chaque ecran.
 *  Retourne les donnees fraiches, ou le cache si le reseau echoue (hors-ligne). */
let cache: { ts: number; data: any } | null = null;
const TTL = 60_000;

export async function getPriceAll(): Promise<any> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return cache.data;
  try {
    const r = await apiClient.get('/api/price/all');
    cache = { ts: now, data: r.data };
    return r.data;
  } catch (e) {
    if (cache) return cache.data; // fallback hors-ligne
    throw e;
  }
}
