/**
 * Camera du KYC : ouverture, capture d'image legeres et messages d'erreur explicites.
 * Rien n'est simule : si la camera refuse, on le dit et on propose le mode fichier.
 */

export interface PisteCamera {
  stream: MediaStream;
  piste: MediaStreamTrack;
  largeur: number;
  hauteur: number;
  ideale: boolean;
}

export type MotifCamera =
  | 'absence'
  | 'non_secure'
  | 'refus'
  | 'introuvable'
  | 'occupee'
  | 'contrainte'
  | 'inconnu';

const TEXTES: Record<MotifCamera, string> = {
  absence: "Cet appareil n'expose pas de caméra à l'application.",
  non_secure: "La caméra exige une connexion sécurisée (https ou localhost).",
  refus: "Accès caméra refusé : autorise-la dans les réglages du navigateur.",
  introuvable: 'Aucune caméra détectée sur cet appareil.',
  occupee: 'La caméra est utilisée par une autre application.',
  contrainte: "La caméra demandée n'est pas disponible sur cet appareil.",
  inconnu: 'Ouverture de la caméra impossible.',
};

export const messageCamera = (motif: MotifCamera): string => TEXTES[motif];

export class ErreurCamera extends Error {
  motif: MotifCamera;
  constructor(motif: MotifCamera) {
    super(TEXTES[motif]);
    this.motif = motif;
  }
}

export const cameraPossible = (): boolean =>
  Boolean(typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) &&
  (typeof window === 'undefined' || window.isSecureContext);

const motifDepuis = (erreur: unknown): MotifCamera => {
  const nom = String((erreur as { name?: string })?.name || '');
  if (nom === 'NotAllowedError' || nom === 'SecurityError') return 'refus';
  if (nom === 'NotFoundError' || nom === 'DevicesNotFoundError') return 'introuvable';
  if (nom === 'NotReadableError' || nom === 'TrackStartError') return 'occupee';
  if (nom === 'OverconstrainedError') return 'contrainte';
  return 'inconnu';
};

interface OptionsOuverture {
  face?: boolean;
  largeur?: number;
  hauteur?: number;
}

/** Ouvre la camera demandee, en repli sur n'importe quelle camera si celle-ci manque. */
export async function ouvrirCamera({
  face = false,
  largeur = 1280,
  hauteur = 960,
}: OptionsOuverture = {}): Promise<PisteCamera> {
  if (!cameraPossible()) {
    throw new ErreurCamera(
      typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia
        ? 'non_secure'
        : 'absence',
    );
  }

  const tentative = async (contrainte: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({ video: contrainte, audio: false });

  let stream: MediaStream;
  try {
    stream = await tentative({
      facingMode: face ? 'user' : 'environment',
      width: { ideal: largeur },
      height: { ideal: hauteur },
    });
  } catch (erreur) {
    const motif = motifDepuis(erreur);
    if (motif === 'contrainte' || motif === 'introuvable') {
      try {
        stream = await tentative({ width: { ideal: largeur }, height: { ideal: hauteur } });
      } catch (replis) {
        throw new ErreurCamera(motifDepuis(replis));
      }
    } else {
      throw new ErreurCamera(motif);
    }
  }

  const piste = stream.getVideoTracks()[0];
  if (!piste) throw new ErreurCamera('introuvable');
  const reglage = piste.getSettings ? piste.getSettings() : ({} as MediaTrackSettings);
  return {
    stream,
    piste,
    largeur: Number(reglage.width) || largeur,
    hauteur: Number(reglage.height) || hauteur,
    ideale: Boolean(reglage.width),
  };
}

export function fermerCamera(piste: PisteCamera | null | undefined): void {
  if (!piste) return;
  try {
    piste.piste.stop();
  } catch {
    /* la piste est deja ferme */
  }
  piste.stream.getTracks().forEach((track) => track.stop());
}

/** Charge un PNG base64 produit par le moteur (le defi de vivacite). */
export function chargerImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Défi illisible'));
    image.src = dataUrl;
  });
}

interface OptionsCapture {
  largeurMax?: number;
  qualite?: number;
  /** Gabarit a incruster, avec la geometrie annoncee par le backend. */
  defi?: { image: HTMLImageElement; rect: { cx: number; cy: number; w: number }; ratio: number } | null;
}

/**
 * Dessine la video dans un canvas et rend un JPEG calibre pour le moteur de vision.
 * L'incrustation suit exactement le contrat partage (centre cx/cy, largeur = w *
 * largeur d'image, hauteur = largeur * ratio) : le serveur retrouve le defi.
 */
export function capturerJpeg(
  video: HTMLVideoElement,
  { largeurMax = 640, qualite = 0.72, defi = null }: OptionsCapture = {},
): Promise<Blob | null> {
  const largeurSource = video.videoWidth || largeurMax;
  const hauteurSource = video.videoHeight || Math.round((largeurSource * 3) / 4);
  if (!largeurSource || !hauteurSource) return Promise.resolve(null);

  const facteur = Math.min(1, largeurMax / largeurSource);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(largeurSource * facteur));
  canvas.height = Math.max(1, Math.round(hauteurSource * facteur));
  const contexte = canvas.getContext('2d');
  if (!contexte) return Promise.resolve(null);
  contexte.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (defi) {
    const large = Math.round(defi.rect.w * canvas.width);
    const haut = Math.max(8, Math.round(large * defi.ratio));
    const x = Math.round(defi.rect.cx * canvas.width) - Math.floor(large / 2);
    const y = Math.round(defi.rect.cy * canvas.height) - Math.floor(haut / 2);
    if (x >= 0 && y >= 0 && x + large <= canvas.width && y + haut <= canvas.height) {
      contexte.drawImage(defi.image, x, y, large, haut);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', qualite);
  });
}

/** Encode une sequence de JPEG en base64 sans prefixe, comme l'attend le backend. */
export async function versBase64(blob: Blob): Promise<string> {
  const tampon = await blob.arrayBuffer();
  const octets = new Uint8Array(tampon);
  let chunk = '';
  const PAS = 8192;
  for (let index = 0; index < octets.length; index += PAS) {
    chunk += String.fromCharCode(...octets.subarray(index, index + PAS));
  }
  return btoa(chunk);
}

/** Torche de la camera arriere, si l'appareil la propose. */
export function flashTorche(piste: MediaStreamTrack | null, allumer: boolean): Promise<boolean> {
  const capacites = piste?.getCapabilities?.() as { torch?: boolean } | undefined;
  if (!piste || !capacites?.torch) return Promise.resolve(false);
  return piste
    .applyConstraints({ advanced: [{ torch: allumer } as MediaTrackConstraintSet] })
    .then(() => true)
    .catch(() => false);
}
