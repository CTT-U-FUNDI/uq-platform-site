/**
 * Import d'images locales (PNG / JPEG / WebP).
 *
 * Le backend n'a AUCUNE route d'upload de fichier : les seules destinations
 * sont `/api/account/avatar/set` (URL ou data URI, plafond
 * `AVATAR_MAX_CHARS`) et `media_urls` des offres Zando (tableau d'URL).
 * On lit donc le fichier, on le redimensionne dans un canvas puis on l'envoie
 * en data URI. La taille finale est verifiee contre le plafond reel.
 */

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';

export interface CompressOptions {
  /** Cote le plus long, en pixels. */
  maxSide?: number;
  /** Longueur maximale de la chaine produite (data URI compris). */
  maxChars: number;
  /** Format de sortie ; WebP compresse mieux a qualite visuelle egale. */
  type?: string;
  /** Qualite de 0 a 1 (ignoree pour le PNG). */
  quality?: number;
}

export interface CompressedImage {
  dataUrl: string;
  chars: number;
  width: number;
  height: number;
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image illisible.'));
    image.src = src;
  });

const draw = (
  image: HTMLImageElement,
  maxSide: number,
  type: string,
  quality: number,
): { dataUrl: string; width: number; height: number } => {
  const longest = Math.max(image.width, image.height) || 1;
  const scale = Math.min(1, maxSide / longest);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Compression impossible sur cet appareil.');
  context.drawImage(image, 0, 0, width, height);

  return { dataUrl: canvas.toDataURL(type, quality), width, height };
};

/**
 * Compresse une image jusqu'a tenir sous `maxChars`, en reduisant d'abord la
 * qualite puis les dimensions. Leve une erreur explicite si c'est impossible.
 */
export async function compressImageFile(
  file: File,
  options: CompressOptions,
): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choisis un fichier image (PNG, JPEG ou WebP).');
  }

  const source = await loadImage(await readAsDataUrl(file));
  const type = options.type || 'image/webp';
  let maxSide = options.maxSide || 1024;
  let quality = options.quality ?? 0.85;

  let result = draw(source, maxSide, type, quality);
  let guard = 0;

  while (result.dataUrl.length > options.maxChars && guard < 12) {
    guard += 1;
    if (quality > 0.45) {
      quality = Math.max(0.4, quality - 0.12);
    } else {
      maxSide = Math.max(96, Math.round(maxSide * 0.8));
    }
    result = draw(source, maxSide, type, quality);
  }

  if (result.dataUrl.length > options.maxChars) {
    throw new Error('Image trop lourde meme apres compression. Choisis une photo plus légère.');
  }

  return { ...result, chars: result.dataUrl.length };
}

/** Ouvre le selecteur de fichier systeme et renvoie le fichier choisi. */
export const pickImageFile = (accept = IMAGE_ACCEPT): Promise<File | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    input.onchange = () => {
      const file = input.files && input.files[0] ? input.files[0] : null;
      input.remove();
      resolve(file);
    };
    document.body.appendChild(input);
    input.click();
  });

/** Convertit une longueur de chaine base64 en octets approximatifs. */
export const dataUrlBytes = (dataUrl: string): number => {
  const comma = dataUrl.indexOf(',');
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((payload.length * 3) / 4);
};

/** "142 Ko" / "1,2 Mo" — pour informer sur le poids reel avant envoi. */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Ko';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
};
