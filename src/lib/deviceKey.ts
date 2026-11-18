import { Capacitor } from '@capacitor/core';
import UqCrypto from './uqCrypto';

/**
 * Cle Ed25519 de l'appareil — generee une fois par le plugin natif UqCrypto
 * et conservee dans le stockage local de l'app.
 *
 * Usage : signatures UQ_MAIL_V1 / UQ_SMS_V1 (voir v2/lib/comms.ts).
 * La cle privee ne quitte jamais l'appareil : seul le resultat signe part.
 *
 * Note : le backend verifie la signature Ed25519 mais ne lie pas encore le
 * vk au compte (uq_index.public_key) — la cle locale fait foi cote client.
 */

const CLE_STOCKAGE = 'uq_device_key_v1';

export interface CleAppareil {
  /** Cle publique X.509/SPKI en base64 (44 octets DER). */
  publicKey: string;
  /** Cle privee PKCS8 en base64. */
  privateKey: string;
}

const b64VersOctets = (b64: string): Uint8Array => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const octetsVersHex = (o: Uint8Array): string =>
  Array.from(o, (b) => b.toString(16).padStart(2, '0')).join('');

/** Vrai quand la crypto native est disponible (Android). Sur web : non. */
export const cryptoAppareilDisponible = (): boolean => Capacitor.isNativePlatform();

/** Charge la cle de l'appareil ou la genere. Null hors plateforme native. */
export async function cleAppareil(): Promise<CleAppareil | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (brut) {
      const lu = JSON.parse(brut) as CleAppareil;
      if (lu?.publicKey && lu?.privateKey) return lu;
    }
    const kp = await UqCrypto.generateKeyPair();
    const cle: CleAppareil = { publicKey: kp.publicKey, privateKey: kp.privateKey };
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(cle));
    return cle;
  } catch {
    return null;
  }
}

/**
 * vk au format backend : 32 octets bruts de la cle de verification,
 * en hex. La cle publique X.509 DER fait 44 octets ; les 32 derniers
 * sont la cle Ed25519 brute (prefixe SPKI fixe de 12 octets).
 */
export function vkHex(publicKeyB64: string): string {
  const der = b64VersOctets(publicKeyB64);
  if (der.length < 32) return '';
  return octetsVersHex(der.slice(der.length - 32));
}

export interface SignatureUq {
  vk: string;
  ts: number;
  signature: string;
}

/**
 * Signe `DOMAINE|{uq}|{vk}|{ts}` en Ed25519 — le format exact attendu par
 * mail_routes.rs / sms_routes.rs (signature + vk + ts en hex).
 */
export async function signatureUq(
  domaine: 'UQ_MAIL_V1' | 'UQ_SMS_V1',
  uq: string,
): Promise<SignatureUq> {
  const cle = await cleAppareil();
  if (!cle) throw new Error('CRYPTO_INDISPONIBLE');
  const vk = vkHex(cle.publicKey);
  if (!vk) throw new Error('CLE_INVALIDE');
  const ts = Math.floor(Date.now() / 1000);
  const message = `${domaine}|${uq}|${vk}|${ts}`;
  const { signature } = await UqCrypto.sign({
    privateKey: cle.privateKey,
    data: message,
  });
  return { vk, ts, signature: octetsVersHex(b64VersOctets(signature)) };
}
