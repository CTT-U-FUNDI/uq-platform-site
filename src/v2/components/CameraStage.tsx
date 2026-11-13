import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { CadreDefi, BilanSequence } from '../lib/kycLive';
import type { EtatGuide } from '../lib/kycGuide';

/**
 * Scene de capture KYC : la video en direct, et par-dessus le moteur de guide.
 *
 * Tout est dessine en coordonnees normalisees de l'image, projetees dans le
 * rectangle reellement occupe par la video (object-fit: contain). Comme la
 * capture envoyee au moteur est l'image entiere, ce que l'utilisateur voit
 * coincide avec ce que le serveur verifie — decalage impossible.
 */

export type ModeCapture = 'visage' | 'document' | 'vivacite';

const TONS: Record<string, string> = {
  erreur: '#ff6b6b',
  attendre: '#ffd166',
  agir: '#7cc4ff',
  pres: '#78e0b0',
  ok: '#3ddc97',
};

interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  stream: MediaStream | null;
  /** Appartient a l'ecran : la capture JPEG part du meme element que l'apercu. */
  videoRef: RefObject<HTMLVideoElement>;
  mode: ModeCapture;
  guide?: EtatGuide | null;
  /** Quad du document, 4 coins normalises [x, y] dans l'ordre des coordonnées recues. */
  quad?: number[][] | null;
  defi?: { template: string; rect: CadreDefi; ratio: number } | null;
  miroir?: boolean;
  consigne?: string | null;
  progressionLibelle?: string | null;
  erreur?: string | null;
  /** Aperçu de la capture : recouvre la vidéo sans fermer la caméra. */
  apercu?: string | null;
  children?: ReactNode;
}

const projection = (scene: Rectangle, video: { w: number; h: number }): Rectangle => {
  if (!video.w || !video.h) return scene;
  const facteur = Math.min(scene.w / video.w, scene.h / video.h);
  const w = video.w * facteur;
  const h = video.h * facteur;
  return { x: scene.x + (scene.w - w) / 2, y: scene.y + (scene.h - h) / 2, w, h };
};

const cheminArondi = (contexte: CanvasRenderingContext2D, cadre: Rectangle, rayon: number) => {
  const r = Math.min(rayon, cadre.w / 2, cadre.h / 2);
  contexte.beginPath();
  contexte.moveTo(cadre.x + r, cadre.y);
  contexte.lineTo(cadre.x + cadre.w - r, cadre.y);
  contexte.quadraticCurveTo(cadre.x + cadre.w, cadre.y, cadre.x + cadre.w, cadre.y + r);
  contexte.lineTo(cadre.x + cadre.w, cadre.y + cadre.h - r);
  contexte.quadraticCurveTo(
    cadre.x + cadre.w,
    cadre.y + cadre.h,
    cadre.x + cadre.w - r,
    cadre.y + cadre.h,
  );
  contexte.lineTo(cadre.x + r, cadre.y + cadre.h);
  contexte.quadraticCurveTo(cadre.x, cadre.y + cadre.h, cadre.x, cadre.y + cadre.h - r);
  contexte.lineTo(cadre.x, cadre.y + r);
  contexte.quadraticCurveTo(cadre.x, cadre.y, cadre.x + r, cadre.y);
  contexte.closePath();
};

/** Quatre equerres, comme les appareils photo qui encadrent une cible. */
const cheminEquerres = (
  contexte: CanvasRenderingContext2D,
  cadre: Rectangle,
  longueur: number,
) => {
  const l = Math.min(longueur, cadre.w / 3, cadre.h / 3);
  contexte.beginPath();
  const coins: Array<[number, number, number, number]> = [
    [cadre.x, cadre.y, 1, 1],
    [cadre.x + cadre.w, cadre.y, -1, 1],
    [cadre.x + cadre.w, cadre.y + cadre.h, -1, -1],
    [cadre.x, cadre.y + cadre.h, 1, -1],
  ];
  for (const [x, y, dx, dy] of coins) {
    contexte.moveTo(x, y + dy * l);
    contexte.lineTo(x, y);
    contexte.lineTo(x + dx * l, y);
  }
};

export function CameraStage({
  stream,
  videoRef,
  mode,
  guide,
  quad,
  defi,
  miroir = false,
  consigne,
  progressionLibelle,
  erreur,
  apercu,
  children,
}: Props) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const toileRef = useRef<HTMLCanvasElement | null>(null);
  const etatRef = useRef({ guide, quad, mode, defi, miroir, apercu });
  etatRef.current = { guide, quad, mode, defi, miroir, apercu };
  const [cadreVideo, setCadreVideo] = useState<Rectangle | null>(null);

  // Le defi s'affiche pile la ou il sera incruste dans l'image envoyee : meme
  // projection que le canvas, en pixels cette fois.
  useEffect(() => {
    const scene = sceneRef.current;
    const video = videoRef.current;
    if (!scene || !video) return;
    const maj = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      setCadreVideo(
        projection(
          { x: 0, y: 0, w: scene.clientWidth, h: scene.clientHeight },
          { w: video.videoWidth, h: video.videoHeight },
        ),
      );
    };
    maj();
    video.addEventListener('loadedmetadata', maj);
    video.addEventListener('loadeddata', maj);
    const observateur = new ResizeObserver(maj);
    observateur.observe(scene);
    return () => {
      video.removeEventListener('loadedmetadata', maj);
      video.removeEventListener('loadeddata', maj);
      observateur.disconnect();
    };
  }, [stream, mode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch(() => {
        /* certains navigateurs exigent un geste : le bouton Ouvrir la camera le fournit */
      });
    }
  }, [stream]);

  useEffect(() => {
    let animation = 0;
    const dessiner = () => {
      animation = requestAnimationFrame(dessiner);
      const toile = toileRef.current;
      const scene = sceneRef.current;
      const video = videoRef.current;
      const contexte = toile?.getContext('2d');
      if (!toile || !scene || !contexte) return;

      const ratioDevice = window.devicePixelRatio || 1;
      const largeur = scene.clientWidth;
      const hauteur = scene.clientHeight;
      if (toile.width !== Math.round(largeur * ratioDevice)) {
        toile.width = Math.round(largeur * ratioDevice);
        toile.height = Math.round(hauteur * ratioDevice);
      }
      contexte.setTransform(ratioDevice, 0, 0, ratioDevice, 0, 0);
      contexte.clearRect(0, 0, largeur, hauteur);
      if (etatRef.current.apercu) return;
      if (!video || !video.videoWidth) return;

      const cadre = projection({ x: 0, y: 0, w: largeur, h: hauteur }, {
        w: video.videoWidth,
        h: video.videoHeight,
      });
      const courant = etatRef.current;
      const couleur = TONS[courant.guide?.consigne.ton || 'attendre'];
      const progression = courant.guide?.progression ?? 0;

      // Voile leger autour de la zone utile : le regard reste au centre.
      contexte.save();
      contexte.fillStyle = 'rgba(6,10,18,0.42)';
      contexte.beginPath();
      contexte.rect(0, 0, largeur, hauteur);
      contexte.rect(cadre.x, cadre.y, cadre.w, cadre.h);
      contexte.fill('evenodd');
      contexte.restore();

      if (courant.mode === 'document') {
        const cible = {
          x: cadre.x + cadre.w * 0.07,
          y: cadre.y + cadre.h * 0.2,
          w: cadre.w * 0.86,
          h: cadre.h * 0.6,
        };
        contexte.save();
        contexte.setLineDash([10, 10]);
        contexte.lineWidth = 2;
        contexte.strokeStyle = 'rgba(255,255,255,0.35)';
        cheminArondi(contexte, cible, 18);
        contexte.stroke();
        contexte.restore();

        if (courant.quad && courant.quad.length === 4) {
          contexte.save();
          contexte.lineWidth = 3;
          contexte.strokeStyle = couleur;
          contexte.shadowColor = couleur;
          contexte.shadowBlur = 14;
          contexte.beginPath();
          courant.quad.forEach((point, index) => {
            const x = cadre.x + point[0] * cadre.w;
            const y = cadre.y + point[1] * cadre.h;
            if (index === 0) contexte.moveTo(x, y);
            else contexte.lineTo(x, y);
          });
          contexte.closePath();
          contexte.stroke();
          contexte.restore();
        }
      } else {
        // Cadre visage, facon Face ID : ovale + anneau de progression.
        const rayonX = cadre.w * 0.31;
        const rayonY = cadre.h * 0.34;
        const centreX = cadre.x + cadre.w / 2;
        const centreY = cadre.y + cadre.h * 0.44;

        contexte.save();
        contexte.lineWidth = 3;
        contexte.strokeStyle = 'rgba(255,255,255,0.22)';
        contexte.beginPath();
        contexte.ellipse(centreX, centreY, rayonX, rayonY, 0, 0, Math.PI * 2);
        contexte.stroke();

        contexte.lineWidth = 6;
        contexte.lineCap = 'round';
        contexte.strokeStyle = couleur;
        contexte.shadowColor = couleur;
        contexte.shadowBlur = 18;
        contexte.beginPath();
        contexte.ellipse(
          centreX,
          centreY,
          rayonX,
          rayonY,
          0,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * progression,
        );
        contexte.stroke();
        contexte.restore();

        cheminEquerres(contexte, {
          x: centreX - rayonX * 1.16,
          y: centreY - rayonY * 1.1,
          w: rayonX * 2.32,
          h: rayonY * 2.2,
        }, 26);
        contexte.lineWidth = 3;
        contexte.strokeStyle = 'rgba(255,255,255,0.5)';
        contexte.stroke();
      }

      if (courant.miroir) {
        // Rappel discret : l'apercu est retourne, l'image envoyee ne l'est pas.
        contexte.save();
        contexte.font = '600 11px system-ui, sans-serif';
        contexte.fillStyle = 'rgba(255,255,255,0.55)';
        contexte.fillText('miroir', cadre.x + 12, cadre.y + cadre.h - 12);
        contexte.restore();
      }
    };
    animation = requestAnimationFrame(dessiner);
    return () => cancelAnimationFrame(animation);
  }, []);

  const styleDefi =
    defi && cadreVideo
      ? {
          left: `${cadreVideo.x + defi.rect.cx * cadreVideo.w}px`,
          top: `${cadreVideo.y + defi.rect.cy * cadreVideo.h}px`,
          width: `${defi.rect.w * cadreVideo.w}px`,
        }
      : undefined;

  const ton = guide?.consigne.ton || 'attendre';

  return (
    <div className={`kyc-stage kyc-stage-${mode}`} ref={sceneRef}>
      <video ref={videoRef} className="kyc-video" muted playsInline autoPlay />
      <canvas ref={toileRef} className="kyc-toile" />

      {apercu ? (
        <img className="kyc-apercu" src={apercu} alt="Aperçu de la capture" draggable={false} />
      ) : null}

      {defi && styleDefi && !apercu ? (
        <div className="kyc-defi" style={styleDefi}>
          <img
            className="kyc-defi-image"
            src={`data:image/jpeg;base64,${defi.template}`}
            alt="Défi de vivacité à conserver dans le cadre"
            draggable={false}
          />
          <span className="kyc-defi-legende">le défi doit rester lisible ici</span>
        </div>
      ) : null}

      {consigne ? (
        <div className={`kyc-consigne kyc-ton-${ton}`} role="status" aria-live="polite">
          {consigne}
        </div>
      ) : null}

      {progressionLibelle ? (
        <div className="kyc-jauge">
          <span style={{ width: `${Math.round((guide?.progression ?? 0) * 100)}%` }} />
        </div>
      ) : null}

      {erreur ? <div className="kyc-erreur-camera">{erreur}</div> : null}

      {children}
    </div>
  );
}

export const bilanTexte = (bilan: BilanSequence | null): string => {
  if (!bilan) return '';
  return `visages ${Math.round(bilan.face_ratio * 100)} % · défi ${Math.round(
    bilan.nonce_ratio * 100,
  )} % · mouvement ${Math.round(bilan.motion * 100)} %`;
};
