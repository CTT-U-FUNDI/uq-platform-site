/**
 * Épreuve de travail locale exigee par /api/human/verify (verify_routes.rs).
 *
 * Le backend attend un `nonce` tel que sha256("<defi>:<nonce>"), ecrit en
 * hexadecimal minuscule, commence par `difficulte` bits nuls. La regle des bits
 * est reprise a l'identique : un chiffre hexadecimal porte 4 bits.
 *
 * Le SHA-256 est calcule ici plutot que via crypto.subtle : l'application est
 * servie en http sur le reseau local (http://hote:5000), un contexte non securise
 * ou window.crypto.subtle n'existe pas.
 */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = (value: number, bits: number): number => ((value >>> bits) | (value << (32 - bits))) >>> 0;

/** Empreinte SHA-256 en hexadecimal minuscule, comme `hash_hex` cote Rust. */
export function sha256Hex(text: string): string {
  const message = new TextEncoder().encode(text);
  const bitsLo = message.length * 8;
  const bitsHi = Math.floor(bitsLo / 0x100000000);
  const padded = Math.ceil((message.length + 9) / 64) * 64;
  const buffer = new Uint8Array(padded);
  buffer.set(message);
  buffer[message.length] = 0x80;
  const view = new DataView(buffer.buffer);
  view.setUint32(padded - 8, bitsHi);
  view.setUint32(padded - 4, bitsLo >>> 0);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let offset = 0; offset < padded; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
      const s1 = (rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const s1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + s1 + ch + K[i] + w[i]) >>> 0;
      const s0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((v) => v.toString(16).padStart(8, '0')).join('');
}

/** Meme regle que `commence_par_zeros` : les `bits` premiers bits sont nuls. */
export function commenceParZeros(empreinte: string, bits: number): boolean {
  if (bits <= 0) return true;
  const chiffres = Math.floor(bits / 4);
  const restants = bits % 4;
  if (empreinte.length < chiffres + (restants > 0 ? 1 : 0)) return false;
  for (let i = 0; i < chiffres; i += 1) {
    if (empreinte[i] !== '0') return false;
  }
  if (restants === 0) return true;
  const next = parseInt(empreinte[chiffres], 16);
  return Number.isFinite(next) && next < (1 << (4 - restants));
}

/** Le nonce est recherche a partir de zero : 2048 empreintes par cedage de boucle. */
const PAS = 2048;

const attendre = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Vérification annulée', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', annuler);
      resolve();
    }, ms);
    const annuler = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Vérification annulée', 'AbortError'));
    };
    signal?.addEventListener('abort', annuler, { once: true });
  });

/**
 * Cherche le nonce qui resout le defi, puis laisse passer la duree minimale
 * reclamee par le serveur (POW_DUREE_MIN_SECS) avant de rendre la main.
 * `commenceAt` doit etre horodate au premier essai, pas a la fin du calcul.
 */
export async function resoudreEpreuve(
  defi: string,
  difficulte: number,
  dureeMinSecs = 1,
  onProgress?: (essais: number) => void,
  signal?: AbortSignal,
): Promise<{ nonce: string; commenceAt: number; essais: number }> {
  const commenceAt = Math.floor(Date.now() / 1000);
  let essais = 0;
  for (;;) {
    if (signal?.aborted) throw new DOMException('Vérification annulée', 'AbortError');
    const debut = essais;
    for (let i = 0; i < PAS; i += 1, essais += 1) {
      if (commenceParZeros(sha256Hex(`${defi}:${debut + i}`), difficulte)) {
        const restant = commenceAt + dureeMinSecs - Math.floor(Date.now() / 1000);
        if (restant > 0) await attendre(restant * 1000 + 300, signal);
        return { nonce: String(debut + i), commenceAt, essais: debut + i + 1 };
      }
    }
    onProgress?.(essais);
    await attendre(0, signal);
  }
}
