// ============================================================
// ORACLE SERVICE — Parle au backend (84 devises)
// ============================================================
import { api } from '../api/client';

export interface OracleRate {
  status: string;
  currency: string;
  devise?: string;
  taux_usd: number;
  usd_per_unit: number;
  units_per_usd: number;
  units_per_borb?: number;
  borb_per_unit?: number;
  borb_usd: number;
  source: string;
  updated_at: number;
}

export interface OracleAll {
  status: string;
  base: string;
  source: string;
  borb_usd: number;
  rates: Record<string, number>;
  devises: string[];
  categories: {
    afrique: number;
    international: number;
    crypto: number;
    total: number;
  };
  updated_at: number;
}

export interface LockResponse {
  status: string;
  devise: string;
  duree_s: number;
  lock_expire_at: number;
  taux_usd: number;
  source: string;
}

export interface DetectResponse {
  status: string;
  devise: string;
  pays: string;
  symbole?: string;
}

// Charger TOUS les taux (84 devises)
export async function fetchAllRates(): Promise<OracleAll> {
  const { data } = await api.get<OracleAll>('/api/oracle/fiat');
  return data;
}

// Charger UN taux
export async function fetchRate(devise: string): Promise<OracleRate> {
  const { data } = await api.get<OracleRate>(`/api/oracle/fiat/${devise}`);
  return data;
}

// Lock un taux (30s)
export async function lockRate(devise: string): Promise<LockResponse> {
  const { data } = await api.post<LockResponse>('/api/oracle/lock', { devise });
  return data;
}

// Vérifier un lock actif
export async function getLocked(devise: string): Promise<LockResponse | null> {
  try {
    const { data } = await api.get<LockResponse>(`/api/oracle/locked/${devise}`);
    return data;
  } catch {
    return null;
  }
}

// Détecter devise locale (GPS/IP)
export async function detectCurrency(): Promise<DetectResponse> {
  const { data } = await api.post<DetectResponse>('/api/oracle/detect', {});
  return data;
}
