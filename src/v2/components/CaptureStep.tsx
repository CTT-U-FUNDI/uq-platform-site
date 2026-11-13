import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraStage } from './CameraStage';
import { Icon } from './Icon';
import { Button, IconButton } from './Ui';
import {
  ErreurCamera,
  capturerJpeg,
  chargerImage,
  fermerCamera,
  flashTorche,
  ouvrirCamera,
  versBase64,
  type MotifCamera,
  type PisteCamera,
} from '../lib/camera';
import {
  guideDocument,
  guideVisage,
  type EtatGuide,
  type MesureDocument,
  type MesureVisage,
} from '../lib/kycGuide';
import {
  mesurerDocument,
  mesurerVisage,
  verifierSequenceKyc,
  type BilanSequence,
  type CadreDefi,
} from '../lib/kycLive';

/**
 * Une etape de capture guidee : camera ouverte, mesures envoyees au moteur de
 * vision a chaque image, consignes rendues par le guide local.
 *
 * Le moteur ne fait que mesurer ; c'est le guide qui décide quand capturer, et
 * il ne capture que quand tout est réuni (cadre, lumière, stabilité). En mode
 * séquence, les images sont incrustées du défi avant l'envoi, comme le contrat
 * /check l'attend.
 */

export interface CaptureUnique {
  /** JPEG envoyé au dossier (redressé pour la pièce). */
  base64: string;
  /** Aperçu data-url. */
  apercu: string;
  mesure?: MesureVisage | MesureDocument;
  rectifie?: boolean;
}

interface Props {
  mode: 'piece' | 'selfie' | 'vivacite';
  session: string;
  defi?: { template: string; rect: CadreDefi; ratio: number } | null;
  onUnique?: (capture: CaptureUnique) => void;
  onSequence?: (bilan: BilanSequence) => void;
  onAnnuler: () => void;
  /** Du point d'aperçu vers l'étape suivante : la capture ne valide pas toute seule. */
  onSuivant: () => void;
  titre: string;
  aide: string;
  surMesure?: (mesure: MesureVisage | MesureDocument) => void;
  /** La session de vivacité est à usage unique : le parent doit en rouvrir une. */
  onRelancer?: () => void;
}

const CADENCE = 320;
const IMAGES_SEQUENCE = 8;

/** Les deux guides partagent la meme interface ; les criteres different seulement. */
interface Guide {
  pas: (mesure: MesureVisage | MesureDocument, horodatage: number) => EtatGuide;
  reinitialiser: () => void;
}

export function CaptureStep({
  mode,
  session,
  defi,
  onUnique,
  onSequence,
  onAnnuler,
  onSuivant,
  titre,
  aide,
  surMesure,
  onRelancer,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const entreeRef = useRef<HTMLInputElement | null>(null);
  const pisteRef = useRef<PisteCamera | null>(null);
  const enCoursRef = useRef(false);
  const arretRef = useRef(false);
  const derniereRef = useRef<MesureVisage | MesureDocument | undefined>(undefined);
  const surMesureRef = useRef(surMesure);
  surMesureRef.current = surMesure;
  const guideRef = useRef<Guide>(mode === 'piece' ? guideDocument() : guideVisage());

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [etat, setEtat] = useState<EtatGuide | null>(null);
  const [quad, setQuad] = useState<number[][] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [motif, setMotif] = useState<MotifCamera | null>(null);
  const [imageDefi, setImageDefi] = useState<HTMLImageElement | null>(null);
  const [collecte, setCollecte] = useState(0);
  const [torche, setTorche] = useState(false);
  const [resultat, setResultat] = useState<CaptureUnique | BilanSequence | null>(null);

  const face = mode !== 'piece';

  useEffect(() => {
    let vivant = true;
    ouvrirCamera({ face })
      .then((piste) => {
        if (!vivant) {
          fermerCamera(piste);
          return;
        }
        pisteRef.current = piste;
        setStream(piste.stream);
      })
      .catch((raison: unknown) => {
        if (!vivant) return;
        const camera = raison instanceof ErreurCamera ? raison : null;
        setMotif(camera?.motif || 'inconnu');
        setErreur(camera ? camera.message : 'Camera indisponible.');
      });
    return () => {
      vivant = false;
      arretRef.current = true;
      fermerCamera(pisteRef.current);
      pisteRef.current = null;
    };
  }, [face]);

  useEffect(() => {
    if (!defi?.template) {
      setImageDefi(null);
      return;
    }
    let vivant = true;
    chargerImage(`data:image/jpeg;base64,${defi.template}`)
      .then((image) => vivant && setImageDefi(image))
      .catch(() => setErreur('Défi illisible : relance la vérification.'));
    return () => {
      vivant = false;
    };
  }, [defi?.template]);

  const fige = useCallback(async () => {
      const video = videoRef.current;
      if (!video || resultat) return;
      arretRef.current = true;

      if (mode === 'vivacite') {
        if (!imageDefi || !defi) {
          setErreur('Défi absent : relance la vérification.');
          arretRef.current = false;
          return;
        }
        const images: string[] = [];
        for (let index = 0; index < IMAGES_SEQUENCE; index += 1) {
          setCollecte(index + 1);
          const blob = await capturerJpeg(video, {
            largeurMax: 520,
            qualite: 0.7,
            defi: { image: imageDefi, rect: defi.rect, ratio: defi.ratio },
          });
          if (blob) images.push(await versBase64(blob));
          await new Promise((attente) => setTimeout(attente, 190));
        }
        if (images.length < 4) {
          setErreur('Trop peu d’images capturées : recommence.');
          setCollecte(0);
          arretRef.current = false;
          return;
        }
        const bilan = await verifierSequenceKyc(session, images).catch((raison: unknown) => {
          setErreur(raison instanceof Error ? raison.message : 'Contrôle impossible.');
          return null;
        });
        setCollecte(0);
        if (bilan) {
          setResultat(bilan);
          onSequence?.(bilan);
          return;
        }
        arretRef.current = false;
        return;
      }

      const brut = await capturerJpeg(video, {
        largeurMax: mode === 'piece' ? 900 : 720,
        qualite: 0.82,
      });
      if (!brut) {
        setErreur('Capture impossible : réessaie.');
        arretRef.current = false;
        return;
      }
      const base64 = await versBase64(brut);
      const detail = derniereRef.current;
      if (mode === 'piece') {
        // Le redressement se demande au moteur : il a déjà trouvé le quad.
        const { brute } = await mesurerDocument(session, brut, true).catch(() => ({
          brute: null as null | { warped?: string },
        }));
        const rectifiee = typeof brute?.warped === 'string' && brute.warped.length > 0;
        const final = rectifiee ? (brute as { warped: string }).warped : base64;
        const capture: CaptureUnique = {
          base64: final,
          apercu: `data:image/jpeg;base64,${final}`,
          mesure: detail,
          rectifie: rectifiee,
        };
        setResultat(capture);
        onUnique?.(capture);
        return;
      }
      const capture: CaptureUnique = {
        base64,
        apercu: `data:image/jpeg;base64,${base64}`,
        mesure: detail,
      };
      setResultat(capture);
      onUnique?.(capture);
    },
    [defi, imageDefi, mode, onSequence, onUnique, resultat, session],
  );

  const figeRef = useRef(fige);
  figeRef.current = fige;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || erreur) return;
    const tour = async () => {
      if (arretRef.current || enCoursRef.current || !video.videoWidth) return;
      enCoursRef.current = true;
      try {
        const blob = await capturerJpeg(video, { largeurMax: 480, qualite: 0.6 });
        if (!blob) return;
        let mesure: MesureVisage | MesureDocument;
        if (mode === 'piece') {
          const analyse = await mesurerDocument(session, blob);
          mesure = analyse.mesure;
          setQuad((analyse.brute.quad as number[][] | undefined) ?? null);
        } else {
          mesure = await mesurerVisage(session, blob);
        }
        surMesureRef.current?.(mesure);
        derniereRef.current = mesure;
        const etat = guideRef.current.pas(mesure, Date.now());
        setEtat(etat);
        if (etat.pret) await figeRef.current();
      } catch (raison) {
        const message = raison instanceof Error ? raison.message : 'Mesure impossible.';
        setErreur(message);
        arretRef.current = true;
      } finally {
        enCoursRef.current = false;
      }
    };
    const minuteur = window.setInterval(tour, CADENCE);
    tour();
    return () => window.clearInterval(minuteur);
  }, [erreur, mode, session]);

  const basculerTorche = () => {
    const piste = pisteRef.current?.piste || null;
    flashTorche(piste, !torche).then((obtenue) => {
      if (obtenue) setTorche(!torche);
      else setErreur('Cet appareil ne propose pas de torche.');
    });
  };

  const relancer = () => {
    setResultat(null);
    setErreur(null);
    setCollecte(0);
    arretRef.current = false;
    guideRef.current.reinitialiser();
    setEtat(null);
  };

  // Repli sans camera (poste de travail fixe) : la photo est mesuree par le meme
  // moteur, puis acceptee comme une capture. La vivacite, elle, exige la camera.
  const depuisFichier = async (fichier: File | undefined) => {
    if (!fichier) return;
    if (!fichier.type.startsWith('image/')) {
      setErreur('Choisis une image.');
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve(String(lecteur.result || ''));
        lecteur.onerror = () => reject(new Error('Fichier illisible'));
        lecteur.readAsDataURL(fichier);
      });
      const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
      const capture: CaptureUnique = { base64, apercu: dataUrl };
      setResultat(capture);
      onUnique?.(capture);
    } catch {
      setErreur('Fichier illisible.');
    }
  };

  const bilan = 'ok' in (resultat || {}) ? (resultat as BilanSequence) : null;
  const capture = resultat && !('ok' in resultat) ? (resultat as CaptureUnique) : null;

  if (bilan) {
    return (
      <div className="kyc-resultat">
        <div className={`kyc-resultat-bulle ${bilan.ok ? 'kyc-ok' : 'kyc-ko'}`}>
          <Icon name={bilan.ok ? 'check' : 'alert'} size={26} />
        </div>
        <h3 className="v2-h2">{bilan.ok ? 'Vivacité confirmée' : 'Vivacité non confirmée'}</h3>
        <ul className="kyc-resultat-liste">
          <li><span>Défi retrouvé</span><strong>{Math.round(bilan.nonce_ratio * 100)} %</strong></li>
          <li><span>Visages dans la séquence</span><strong>{Math.round(bilan.face_ratio * 100)} %</strong></li>
          <li><span>Mouvement</span><strong>{Math.round(bilan.motion * 100)} %</strong></li>
          <li><span>Images analysées</span><strong>{bilan.frames}</strong></li>
        </ul>
        {!bilan.ok && bilan.reasons.length ? (
          <p className="v2-muted">{bilan.reasons.join(' · ')}</p>
        ) : null}
        <div className="kyc-actions">
          {!bilan.ok && (
            <Button variant="secondary" icon="refresh" onClick={onRelancer || relancer}>
              Recommencer
            </Button>
          )}
          <Button icon={bilan.ok ? 'forward' : 'back'} onClick={bilan.ok ? onSuivant : onAnnuler}>
            {bilan.ok ? 'Continuer' : 'Revenir'}
          </Button>
        </div>
      </div>
    );
  }

  if (motif && !capture && mode !== 'vivacite') {
    return (
      <div className="kyc-resultat">
        <div className="kyc-resultat-bulle kyc-ko">
          <Icon name="alert" size={26} />
        </div>
        <h3 className="v2-h2">Caméra indisponible</h3>
        <p className="v2-muted">{erreur || 'Ouverture de la caméra impossible.'}</p>
        <input
          ref={entreeRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => void depuisFichier(event.target.files?.[0])}
        />
        <div className="kyc-actions">
          <Button variant="secondary" icon="back" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button icon="image" onClick={() => entreeRef.current?.click()}>
            Choisir une photo
          </Button>
        </div>
      </div>
    );
  }

  const consigneApercu =
    mode === 'piece'
      ? capture?.rectifie
        ? 'Pièce redressée : les quatre coins sont nets.'
        : 'Pièce capturée : vérifie que les bords ne sont pas coupés.'
      : 'Selfie capturé : le visage doit être net et centré.';

  return (
    <div className="kyc-capture">
      <CameraStage
        stream={stream}
        videoRef={videoRef}
        mode={mode === 'piece' ? 'document' : mode === 'selfie' ? 'visage' : 'vivacite'}
        guide={capture ? null : etat}
        quad={capture ? null : quad}
        miroir={face}
        apercu={capture?.apercu ?? null}
        defi={
          !capture && defi && imageDefi
            ? { template: defi.template, rect: defi.rect, ratio: defi.ratio }
            : null
        }
        consigne={
          capture
            ? consigneApercu
            : etat?.consigne.texte || (stream ? 'Je prépare la caméra…' : 'Ouverture de la caméra…')
        }
        progressionLibelle={capture || !etat ? null : `${Math.round(etat.progression * 100)} %`}
        erreur={erreur}
      />

      <div className="kyc-capture-bas">
        <div className="kyc-capture-titre">
          <div className="v2-h3">{titre}</div>
          <div className="v2-muted" style={{ fontSize: 12.5 }}>{aide}</div>
        </div>

        {collecte > 0 ? (
          <div className="kyc-collecte">
            <Icon name="play" size={14} />
            <span>{`Images ${collecte} / ${IMAGES_SEQUENCE}`}</span>
          </div>
        ) : null}

        {capture ? (
          <div className="kyc-actions">
            <IconButton name="back" label="Annuler" onClick={onAnnuler} />
            {stream ? (
              <Button variant="secondary" icon="refresh" onClick={relancer}>
                Reprendre
              </Button>
            ) : null}
            <Button icon="check" onClick={onSuivant}>
              Valider
            </Button>
          </div>
        ) : (
          <div className="kyc-actions">
            <IconButton name="back" label="Annuler" onClick={onAnnuler} />
            {!face && (
              <IconButton name={torche ? 'sun' : 'moon'} label="Torche" onClick={basculerTorche} />
            )}
            <Button
              variant="secondary"
              size="sm"
              icon="camera"
              onClick={() => void figeRef.current()}
              disabled={!stream || Boolean(erreur)}
            >
              Capturer maintenant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
