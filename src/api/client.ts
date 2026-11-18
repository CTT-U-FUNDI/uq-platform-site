import axios, { AxiosInstance } from 'axios';

const API_BASE = (() => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if ((import.meta as any).env?.DEV) return '';
  // Domaine officiel UQ : l'API est servie sur api.uqplatform.com (HTTPS).
  return 'https://api.uqplatform.com';
})();

export function apiUrl(path: string): string {
  const base = API_BASE || window.location.origin;
  return new URL(path, base).toString();
}

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem('uq_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(apiUrl(path), { ...init, headers });
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000, // 90s : cold start Render free tier ~50s
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uq_token');
  if (token) {
    if (!config.headers) config.headers = {} as any;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Mode hors-ligne : cache lecture seule =====
// Les GET sont mis en cache ; sans reseau on sert le cache (lecture seule,
// aucune operation hors-ligne). Au retour reseau, 'uq:online' est diffuse
// pour que les ecrans rafraichissent + notifications.
const CACHE_PREFIX = 'uq_cache:';
const isOfflineErr = (e: any) => !e?.response; // pas de reponse serveur = reseau

api.interceptors.response.use(
  (res) => {
    try {
      if (res.config.method === 'get' && res.data != null) {
        localStorage.setItem(CACHE_PREFIX + res.config.url, JSON.stringify(res.data));
      }
    } catch { /* quota */ }
    return res;
  },
  (err) => {
    const url = err?.config?.url;
    if (err?.config?.method === 'get' && url && isOfflineErr(err)) {
      try {
        const raw = localStorage.getItem(CACHE_PREFIX + url);
        if (raw != null) {
          // Reponse synthétique : donnees cachees + drapeau offline
          const data = JSON.parse(raw);
          return Promise.resolve({
            ...err.config && { config: err.config },
            data: typeof data === 'object' && data !== null ? { ...data, _offline: true } : { _offline: true, data },
            status: 200,
            statusText: 'OK (cache)',
            headers: {},
            config: err.config,
          });
        }
      } catch { /* cache corrompu */ }
    }
    return Promise.reject(err);
  },
);

// ===== File hors-ligne : POST en attente, rejoues au retour reseau =====
// Regle : JAMAIS d'operation financière hors-ligne. Les POST sont mis en
// file et rejoues tels quels au retour reseau — le serveur re-valide tout
// (solde, escrow, PIN) au moment de l'execution, donc pas de double depense.
const QUEUE_KEY = 'uq_offline_queue';
type QueuedReq = { url: string; method: string; body?: unknown; ts: number };

const lireFile = (): QueuedReq[] => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
};
const ecrireFile = (q: QueuedReq[]) => {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50))); } catch { /* quota */ }
};

const rejouerFile = async () => {
  const file = lireFile();
  if (!file.length) return;
  const reste: QueuedReq[] = [];
  for (const req of file) {
    try {
      await api.request({ url: req.url, method: req.method, data: req.body });
    } catch {
      reste.push(req); // encore hors-ligne ou erreur reseau -> on garde
    }
  }
  ecrireFile(reste);
  if (reste.length < file.length) {
    window.dispatchEvent(new CustomEvent('uq:queue-synced', { detail: { restants: reste.length } }));
  }
};

api.interceptors.request.use((config) => {
  // Hors-ligne detecte : les POST sont mis en file au lieu d'echouer.
  if (!navigator.onLine && (config.method === 'post' || config.method === 'put' || config.method === 'delete')) {
    const q = lireFile();
    q.push({
      url: config.url || '',
      method: (config.method || 'post').toUpperCase(),
      body: config.data,
      ts: Date.now(),
    });
    ecrireFile(q);
    // Annule la requete : l'appelant recoit une erreur reseau normale,
    // l'UI peut afficher "en attente de synchronisation".
    return Promise.reject(Object.assign(new Error('Hors ligne — requête mise en file'), { __uqQueued: true }));
  }
  return config;
});

// Retour reseau -> rejouer la file puis recharger les donnees
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void rejouerFile().then(() => window.dispatchEvent(new CustomEvent('uq:online')));
  });
  window.addEventListener('offline', () => {
    window.dispatchEvent(new CustomEvent('uq:offline'));
  });
}

export function hasToken(): boolean { return Boolean(localStorage.getItem('uq_token')); }
export function getToken(): string | null { return localStorage.getItem('uq_token'); }

export function forceLogout(): void {
  ['uq_token','uq_number','uq_email','uq_pseudo','uq_name','uq_account'].forEach(k => localStorage.removeItem(k));
  localStorage.setItem('uq_current_screen', 'login');
  window.location.reload();
}

export async function checkTokenValidity(): Promise<boolean> {
  if (!getToken()) return false;
  try { await api.get('/api/account/me'); return true; } catch { return false; }
}

export async function loginGuardian(number: string, email: string, password: string) {
  const r = await api.post('/api/guardian/login', { number, email, password });
  return r.data;
}
export async function loginUser(data: { number: string }) {
  const r = await api.post('/api/secure/step1', { uq_number: data.number });
  return r.data;
}
export async function logout() {
  const r = await api.post('/api/logout');
  return r.data;
}
export async function createAccount() {
  const r = await api.post('/api/account/create');
  return r.data;
}
export async function getBalance(accountId: string) {
  const r = await api.get(`/api/borb/balance/${accountId}`);
  return r.data;
}
export async function getWalletInfo(accountId: string) {
  const r = await api.get(`/api/account/wallets/${encodeURIComponent(accountId)}`);
  return r.data;
}
export async function getTransactions(accountId: string) {
  const r = await api.get(`/api/borb/transactions/${accountId}`);
  return r.data;
}
export async function getCases() {
  const r = await api.get('/api/cases/stats');
  return r.data;
}
export async function getDistribution() {
  const r = await api.get('/api/distribution/stats');
  return r.data;
}
export async function getShops() {
  const r = await api.get('/api/zando/items');
  return r.data;
}
export async function startPlayer(data?: { itemId?: string }) {
  const r = await api.post('/api/player/start', data || {});
  return r.data;
}
export async function stopPlayer() {
  const r = await api.post('/api/player/stop');
  return r.data;
}
export async function getPlayerStats() {
  const r = await api.get('/api/player/status');
  return r.data;
}
export async function createZandoItem(data: any) {
  const r = await api.post('/api/zando/item/create', data);
  return r.data;
}
export async function getZandoItems() {
  const r = await api.get('/api/zando/items');
  return r.data;
}
export async function getZandoItem(id: string) {
  const r = await api.get(`/api/zando/item/${id}`);
  return r.data;
}
export async function getStudioTypes() {
  const r = await api.get('/api/studio/types');
  return r.data;
}
export async function getStudioSuggest() {
  const r = await api.get('/api/studio/suggest');
  return r.data;
}
export async function getBorbSupply() {
  const r = await api.get('/api/blockchain/supply');
  return r.data;
}
export async function getCasesStats() {
  const r = await api.get('/api/cases/stats');
  return r.data;
}
export async function getUbiInfo() {
  const r = await api.get('/api/ubi/info');
  return r.data;
}
export async function claimUbi() {
  const r = await api.post('/api/ubi/claim');
  return r.data;
}
export async function getSecurityStatus() {
  const r = await api.get('/api/security/status');
  return r.data;
}
export async function getPeers() {
  const r = await api.get('/api/network/peers');
  return r.data;
}
export async function getNetworkStatus() {
  const r = await api.get('/api/network/status');
  return r.data;
}
export async function chatStatus() {
  const r = await api.get('/api/chat/status');
  return r.data;
}
export async function chatSend(data: { to: string; content: string }) {
  const r = await api.post('/api/chat/send', data);
  return r.data;
}
export async function chatConversation(data: { with: string }) {
  const r = await api.post('/api/chat/conversation', data);
  return r.data;
}
export async function vaultStatus() {
  const r = await api.get('/api/vault/status');
  return r.data;
}
export async function vaultSplit(data: any) {
  const r = await api.post('/api/vault/split', data);
  return r.data;
}
export async function vaultCombine(data: any) {
  const r = await api.post('/api/vault/combine', data);
  return r.data;
}
export async function dataMarket() {
  const r = await api.get('/api/data/market');
  return r.data;
}
export async function dataPublish(data: any) {
  const r = await api.post('/api/data/publish', data);
  return r.data;
}
export async function dataPurchase(data: any) {
  const r = await api.post('/api/data/purchase', data);
  return r.data;
}

export default api;
