import { registerPlugin } from '@capacitor/core';

interface UqCryptoPlugin {
  generateKeyPair(): Promise<{ publicKey: string; privateKey: string }>;
  sign(o: { privateKey: string; data: string }): Promise<{ signature: string }>;
  verify(o: { publicKey: string; data: string; signature: string }): Promise<{ valid: boolean }>;
  encrypt(o: { key: string; data: string }): Promise<{ data: string }>;
  decrypt(o: { key: string; data: string }): Promise<{ data: string }>;
  deriveKey(o: { passphrase: string; salt?: string; iterations?: number }): Promise<{ key: string }>;
}

const UqCrypto = registerPlugin<UqCryptoPlugin>('UqCrypto');

/** Signature Ed25519 locale — la cle privee ne quitte jamais l'appareil. */
export const signLocal = (privateKeyB64: string, data: string) =>
  UqCrypto.sign({ privateKey: privateKeyB64, data });

export const verifyLocal = (publicKeyB64: string, data: string, signatureB64: string) =>
  UqCrypto.verify({ publicKey: publicKeyB64, data, signature: signatureB64 });

export const generateKeyPairLocal = () => UqCrypto.generateKeyPair();

/** Chiffrement AES-256-GCM local (vaults, exports, donnees sensibles). */
export const encryptLocal = (keyB64: string, data: string) =>
  UqCrypto.encrypt({ key: keyB64, data });

export const decryptLocal = (keyB64: string, dataB64: string) =>
  UqCrypto.decrypt({ key: keyB64, data: dataB64 });

/** Derive une cle AES-256 depuis une passphrase (PBKDF2, 100k iterations). */
export const deriveKeyLocal = (passphrase: string, salt?: string) =>
  UqCrypto.deriveKey({ passphrase, salt });

export default UqCrypto;
