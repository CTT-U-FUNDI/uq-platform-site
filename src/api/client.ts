import axios, { AxiosInstance } from 'axios';

const API_BASE = (() => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if ((import.meta as any).env?.DEV) return '';
  // Domaine officiel UQ : l'API est servie sur uqplatform.com.
  return 'https://uqplatform.com';
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
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uq_token');
  if (token) {
    if (!config.headers) config.headers = {} as any;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
