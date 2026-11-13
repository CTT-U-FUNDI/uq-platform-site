/**
 * Client des routes de guidage KYC (/api/kyc/live/*).
 *
 * Les images de guidage partent en JPEG brut : pas de base64, pas d'enveloppe
 * JSON, donc 33 % d'octets en moins sur une connexion mobile. Seule la sequence
 * de vivacite est envoyee en JSON (elle reste petite et bornee a 40 images).
 */

import { apiFetch } from '../../api/client';
import { ApiError } from './api';
import type { MesureDocument, MesureVisage } from './kycGuide';

export interface CadreDefi {
  cx: number;
  cy: number;
  w: number;
}

export interface SessionKyc {
  session: string;
  nonce: string;
  texte: string;
  /** Gabarit JPEG en base64, a coller en bas du selfie pendant la vivacite. */
  template: string;
  ratio: number;
  rect: CadreDefi;
  expires_in: number;
}

export interface BilanSequence {
  frames: number;
  faces: number;
  nonce_hits: number;
  face_ratio: number;
  nonce_ratio: number;
  motion: number;
  spread: number;
  size_variation: number;
  blur_median: number;
  score_mean: number;
  ok: boolean;
  reasons: string[];
  session?: string;
  nonce?: string;
}

export interface MesureDocumentBrute extends Partial<MesureDocument> {
  corners_px?: number[][];
  quad?: number[][];
  warped?: string;
  warp?: { light: number; blur: number; glare: number };
}

const POSTES: Record<string, string> = {
  SESSION_EXPIREE: 'Session expirée : relance la vérification',
  MOTEUR_INDISPONIBLE: 'Le moteur de vérification est indisponible',
};

async function lireJson<T>(reponse: Response): Promise<T> {
  const payload = (await reponse.json().catch(() => null)) as
    | { status?: string; message?: string; code?: string; data?: T }
    | null;
  if (!reponse.ok) {
    const code = payload?.code;
    const message =
      payload?.message || (code ? POSTES[code] : null) || `Requête refusée (${reponse.status})`;
    throw new ApiError(message, reponse.status, code);
  }
  // /session repond a plat, les autres sous { status, data } : on unifie ici.
  return ((payload as { data?: T } | null)?.data ?? (payload as T)) as T;
}

const envoieImage = async (
  chemin: string,
  session: string,
  image: Blob,
  extra = '',
): Promise<unknown> => {
  const reponse = await apiFetch(`${chemin}?session=${encodeURIComponent(session)}${extra}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg' },
    body: image,
  });
  return lireJson(reponse);
};

/** POST /api/kyc/live/session — nouveau nonce, nouveau gabarit, session a usage unique. */
export const demarrerSessionKyc = async (): Promise<SessionKyc> => {
  const reponse = await apiFetch('/api/kyc/live/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  return lireJson<SessionKyc>(reponse);
};

/** Le moteur ne renvoie jamais toutes les cles quand il ne voit rien : on complete. */
export const normaliserVisage = (brute: Partial<MesureVisage> | null | undefined): MesureVisage => ({
  detected: Boolean(brute?.detected),
  size: Number(brute?.size ?? 0),
  offset: { dx: Number(brute?.offset?.dx ?? 1), dy: Number(brute?.offset?.dy ?? 1) },
  angles: {
    roulis: Number(brute?.angles?.roulis ?? 90),
    lacet: Number(brute?.angles?.lacet ?? 1),
    tangage: Number(brute?.angles?.tangage ?? 0),
  },
  frontal: Boolean(brute?.frontal),
  light: Number(brute?.light ?? 0),
  blur: Number(brute?.blur ?? 0),
  glare: Number(brute?.glare ?? 0),
  score: Number(brute?.score ?? 0),
});

export const normaliserDocument = (brute: MesureDocumentBrute | null | undefined): MesureDocument => ({
  found: Boolean(brute?.found),
  coverage: Number(brute?.coverage ?? 0),
  aspect: Number(brute?.aspect ?? 0),
  tilt: Number(brute?.tilt ?? 90),
  light: Number(brute?.light ?? 0),
  blur: Number(brute?.blur ?? 0),
  glare: Number(brute?.glare ?? 0),
});

/** POST /api/kyc/live/face — une image du flux, une mesure pour le guide. */
export const mesurerVisage = async (session: string, image: Blob): Promise<MesureVisage> => {
  const brute = await envoieImage('/api/kyc/live/face', session, image);
  return normaliserVisage(brute as Partial<MesureVisage>);
};

/** POST /api/kyc/live/doc — quad du document + qualite, et redressement si demande. */
export const mesurerDocument = async (
  session: string,
  image: Blob,
  warp = false,
): Promise<{ mesure: MesureDocument; brute: MesureDocumentBrute }> => {
  const brute = (await envoieImage(
    '/api/kyc/live/doc',
    session,
    image,
    warp ? '&warp=1' : '',
  )) as MesureDocumentBrute;
  return { mesure: normaliserDocument(brute), brute };
};

/** POST /api/kyc/live/check — la sequence filmee a-t-elle reellement contenu le defi ? */
export const verifierSequenceKyc = async (
  session: string,
  frames: string[],
): Promise<BilanSequence> => {
  const reponse = await apiFetch('/api/kyc/live/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, frames }),
  });
  return lireJson<BilanSequence>(reponse);
};
