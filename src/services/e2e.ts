// ============================================================
// UQ Platform — Chiffrement E2E des messages (appareil à appareil)
// ECDH P-256 + AES-GCM via Web Crypto — aucune dépendance.
// La clé privée ne quitte JAMAIS l'appareil (localStorage).
// Firebase/Render ne voient que du ciphertext (enveloppe "v2:iv:ct").
// ============================================================

const LS_PRIV = 'uq_e2e_priv';
const LS_PUB = 'uq_e2e_pub';

const te = new TextEncoder();
const td = new TextDecoder();

function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- Clé privée locale (persistée, non extractable si possible) ----------
let _priv: CryptoKey | null = null;

export async function maClePrivee(): Promise<CryptoKey> {
  if (_priv) return _priv;
  const raw = localStorage.getItem(LS_PRIV);
  if (raw) {
    _priv = await crypto.subtle.importKey('jwk', JSON.parse(raw),
      { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    return _priv;
  }
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  localStorage.setItem(LS_PRIV, JSON.stringify(jwk));
  localStorage.setItem(LS_PUB, JSON.stringify(await crypto.subtle.exportKey('jwk', pair.publicKey)));
  _priv = pair.privateKey;
  return _priv;
}

// ---------- Clé publique (publée dans Firestore keys/{pseudo}) ----------
export async function maClePublique(): Promise<JsonWebKey> {
  const raw = localStorage.getItem(LS_PUB);
  if (raw) return JSON.parse(raw);
  await maClePrivee(); // génère la paire si absente
  return JSON.parse(localStorage.getItem(LS_PUB)!);
}

// ---------- Chiffrement : texte -> "v2:iv:ct" ----------
export async function chiffrer(texte: string, pubJwkDestinataire: JsonWebKey): Promise<string> {
  const priv = await maClePrivee();
  const pubDest = await crypto.subtle.importKey('jwk', pubJwkDestinataire,
    { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const aes = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: pubDest }, priv,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, te.encode(texte));
  return `v2:${b64(iv)}:${b64(ct)}`;
}

// ---------- Déchiffrement : nécessite la clé publique de l'expéditeur ----------
export async function dechiffrerAvec(enveloppe: string, pubJwkExpediteur: JsonWebKey): Promise<string | null> {
  if (!enveloppe.startsWith('v2:')) return null;
  try {
    const [, ivB64, ctB64] = enveloppe.split(':');
    const priv = await maClePrivee();
    const pubExp = await crypto.subtle.importKey('jwk', pubJwkExpediteur,
      { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const aes = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: pubExp }, priv,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(ivB64) as BufferSource }, aes, unb64(ctB64));
    return td.decode(pt);
  } catch { return null; }
}

export const estChiffre = (s: string) => typeof s === 'string' && s.startsWith('v2:');
