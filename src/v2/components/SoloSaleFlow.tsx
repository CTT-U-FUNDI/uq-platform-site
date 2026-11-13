// ============================================================================
// SoloSaleFlow.tsx — Parcours de publication solo (sans cadre, 100% app)
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from './Icon';
import { Button } from './Ui';
import { PinSheet } from './PinSheet';
import { SoloGuide } from './SoloGuide';
import { createZandoItem, getPinStatus, PIN_MAX_LENGTH, PIN_MIN_LENGTH, publishZandoItem, updateZandoItem, verifyPin } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { convertCDFToBORB, formatDevise, getRates } from '../../services/currency';
import { useSession } from '../lib/session';

export type EtapeFlow = 1 | 2 | 3 | 4 | 5 | 6;
export type TypeAnnonce = 'service' | 'vente';
export type EtatProduit = 'stock' | 'occasion' | 'piece';

const CATEGORIES_SERVICE: Array<{ nom: string; icone: IconName }> = [
  { nom: 'Plomberie', icone: 'wrench' },
  { nom: 'Electricite', icone: 'bolt' },
  { nom: 'Coiffure', icone: 'scissors' },
  { nom: 'Livraison', icone: 'package' },
  { nom: 'Reparation', icone: 'tool' },
  { nom: 'Construction', icone: 'home' },
  { nom: 'Transport', icone: 'car' },
  { nom: 'Menage', icone: 'spark' },
  { nom: 'Cours', icone: 'book' },
  { nom: 'Sante', icone: 'cross' },
  { nom: 'Autre service', icone: 'plus' },
];

const CATEGORIES_VENTE: Array<{ nom: string; icone: IconName }> = [
  { nom: 'Vehicule', icone: 'car' },
  { nom: 'Moto', icone: 'bolt' },
  { nom: 'Terrain', icone: 'leaf' },
  { nom: 'Maison', icone: 'home' },
  { nom: 'Appartement', icone: 'building' },
  { nom: 'Telephone', icone: 'phone' },
  { nom: 'Ordinateur', icone: 'txt' },
  { nom: 'TV & Audio', icone: 'play' },
  { nom: 'Soulier', icone: 'shoe' },
  { nom: 'Vetement', icone: 'shirt' },
  { nom: 'Meuble', icone: 'box' },
  { nom: 'Electromenager', icone: 'tool' },
  { nom: 'Alimentation', icone: 'fork' },
  { nom: 'Bijou', icone: 'star' },
  { nom: 'Autre objet', icone: 'plus' },
];

export interface SoloDraft {
  etape: EtapeFlow;
  type: TypeAnnonce | null;
  photo: string;
  titre: string;
  description: string;
  categorie: string;
  prix: number;
  devise: string;
  position: { lat: number; lng: number; label: string } | null;
  etat: EtatProduit;
}

interface SoloSaleFlowProps {
  onClose: () => void;
  onPublish: (draft: SoloDraft) => Promise<void>;
  initial?: SoloDraft | null;
  itemId?: string | null;
}

const DRAFT_KEY = 'uq.solo.draft.v1';

function draftVide(): SoloDraft {
  return {
    etape: 1,
    type: null,
    photo: '',
    titre: '',
    description: '',
    categorie: '',
    prix: 0,
    devise: 'USD',
    position: null,
    etat: 'stock',
  };
}

function chargerDraft(): SoloDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return draftVide();
    return { ...draftVide(), ...JSON.parse(raw) };
  } catch {
    return draftVide();
  }
}

function sauverDraft(d: SoloDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}

const TITRES: Record<EtapeFlow, string> = {
  1: 'Nouvelle annonce',
  2: 'Type',
  3: 'Photo',
  4: 'Details',
  5: 'Prix',
  6: 'Apercu',
};

export function SoloSaleFlow({ onClose, onPublish, initial, itemId }: SoloSaleFlowProps) {
  const [draft, setDraft] = useState<SoloDraft>(() => initial ?? chargerDraft());
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [devises, setDevises] = useState<string[]>(['USD', 'CDF', 'EUR']);
  const [deviseOuverte, setDeviseOuverte] = useState(false);
  const [gpsEnCours, setGpsEnCours] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pubEnCours, setPubEnCours] = useState(false);
  const session = useSession();
  /** Longueur reelle du PIN du compte : jamais 4 ou 6 en dur. */
  const pin = useAsync(() => getPinStatus(session?.uq || ''), [session?.uq], {
    enabled: Boolean(session?.uq),
  });
  const pinLength = Math.min(
    Math.max(Number(pin.data?.pin_length) || PIN_MIN_LENGTH, PIN_MIN_LENGTH),
    PIN_MAX_LENGTH,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Debounce : sauvegarde 800ms apres la derniere frappe (pas a chaque caractere)
  useEffect(() => {
    const t = setTimeout(() => sauverDraft(draft), 800);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    void (async () => {
      try {
        const rates = await getRates();
        const codes = Object.keys(rates.rates || {}).sort();
        if (codes.length > 0) {
          setDevises(['USD', 'CDF', ...codes.filter((c) => c !== 'USD' && c !== 'CDF')]);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (draft.etape > 3) {
      arreterCamera();
      return;
    }
    void demarrerCamera();
    return () => arreterCamera();
  }, [draft.etape]);

  const demarrerCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {}
  }, []);

  const arreterCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const majDraft = useCallback((patch: Partial<SoloDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const setEtape = useCallback((etape: EtapeFlow) => {
    setDraft((d) => ({ ...d, etape }));
  }, []);

  const capturerPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setErreur('GPS non disponible.');
      return;
    }
    setGpsEnCours(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        majDraft({
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: 'Ma position',
          },
        });
        setGpsEnCours(false);
      },
      () => {
        setErreur('Position refusee. Saisis manuellement.');
        setGpsEnCours(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [majDraft]);

  const capturerPhoto = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      setErreur('Camera non prete.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    majDraft({ photo: canvas.toDataURL('image/jpeg', 0.85), etape: 4 });
  }, [majDraft]);

  const importerPhoto = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => majDraft({ photo: String(reader.result || ''), etape: 4 });
      reader.readAsDataURL(file);
    },
    [majDraft],
  );

  const publier = useCallback(
    async (pin: string): Promise<string | void> => {
      if (!session?.uq) return 'Session introuvable.';
      setPubEnCours(true);
      setErreur(null);
      try {
        const verif = await verifyPin(session.uq, pin);
        if (!verif?.valid) {
          setPubEnCours(false);
          return verif?.message || 'PIN incorrect.';
        }
        // Le prix est saisi dans la devise choisie ; le backend attend des
        // unites internes (BORB). Sans taux publie, on refuse plutot que
        // d'inventer une parite 1 pour 1.
        let price_borb = Math.round(draft.prix);
        if (draft.devise && draft.devise !== 'BORB') {
          try {
            price_borb = Math.max(1, Math.round(await convertCDFToBORB(draft.prix, draft.devise)));
          } catch {
            setPubEnCours(false);
            return `Taux indisponible pour ${draft.devise} : prix non converti.`;
          }
        }

        // `media_urls` est stocke cote backend comme une chaine JSON : on
        // l'emballe toujours dans un tableau, meme pour une photo unique.
        const media = draft.photo ? JSON.stringify([draft.photo]) : '[]';
        const payload: Record<string, unknown> = {
          type: draft.type === 'service' ? 'service' : 'produit',
          title: draft.titre,
          // La vente solo n'a qu'un champ libre : il alimente `description`,
          // le seul texte que la modification serveur autorise.
          description: draft.description,
          subtitle: '',
          price_borb: price_borb,
          price_usd: 0,
          category: draft.categorie,
          media_urls: media,
        };
        if (itemId) {
          // Mode edition : mettre a jour l'annonce existante
          await updateZandoItem(itemId, payload);
        } else {
          // Mode creation : creer puis publier
          const created = await createZandoItem(payload);
          if (!created?.item_id) {
            setPubEnCours(false);
            return created?.message || 'Creation impossible.';
          }
          await publishZandoItem(created.item_id);
        }
        localStorage.removeItem(DRAFT_KEY);
        setPinOpen(false);
        setPubEnCours(false);
        await onPublish(draft);
        return;
      } catch (e) {
        setPubEnCours(false);
        const msg =
          typeof e === 'object' && e !== null
            ? (e as { response?: { data?: { message?: string } }; message?: string }).response?.data
                ?.message || (e as { message?: string }).message
            : undefined;
        return msg || 'Publication impossible.';
      }
    },
    [session, draft, onPublish],
  );

  const peutContinuer = (): boolean => {
    if (draft.etape === 2) return draft.type !== null;
    if (draft.etape === 3) return draft.photo.length > 0;
    if (draft.etape === 4) return draft.titre.trim().length > 0 && draft.categorie.trim().length > 0;
    if (draft.etape === 5) return draft.prix > 0;
    return true;
  };

  const suivant = () => {
    sauverDraft(draft);
    if (draft.etape < 6) setEtape((draft.etape + 1) as EtapeFlow);
  };

  const precedent = () => {
    sauverDraft(draft);
    if (draft.etape > 1) setEtape((draft.etape - 1) as EtapeFlow);
    else onClose();
  };

  return (
    <div className="solo-flow">
      {/* Camera floue en fond (ecrans 1-3) */}
      {(draft.etape === 1 || draft.etape === 2 || draft.etape === 3) && (
        <>
          <video ref={videoRef} className="solo-flow__cam" autoPlay muted playsInline />
          <div className="solo-flow__overlay" />
        </>
      )}

      {/* Header fixe */}
      <div className="solo-flow__header">
        <button
          type="button"
          className="solo-flow__close"
          onClick={precedent}
          aria-label="Retour"
        >
          <Icon name={draft.etape === 1 ? 'x' : 'arrow-left'} size={18} />
        </button>
        <div className="solo-flow__header-titre">
          <b>{TITRES[draft.etape]}</b>
          <span>{draft.etape}/6</span>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="solo-flow__contenu">
        <SoloGuide etape={draft.etape} />

        {draft.etape === 1 && (
          <div className="solo-flow__centre">
            <h2 className="solo-flow__accueil-titre">Que veux-tu publier ?</h2>
            <p className="solo-flow__accueil-sous">Une photo, un prix, une position. C'est tout.</p>
          </div>
        )}

        {draft.etape === 2 && (
          <div className="solo-flow__choix">
            <button
              type="button"
              className="solo-flow__choix-btn"
              data-on={draft.type === 'service'}
              onClick={() => majDraft({ type: 'service', etape: 3 })}
            >
              <Icon name="tool" size={32} />
              <span>Service</span>
              <small>Plombier, coiffeur, livreur...</small>
            </button>
            <button
              type="button"
              className="solo-flow__choix-btn"
              data-on={draft.type === 'vente'}
              onClick={() => majDraft({ type: 'vente', etape: 3 })}
            >
              <Icon name="tag" size={32} />
              <span>Vente</span>
              <small>Telephone, moto, terrain...</small>
            </button>
          </div>
        )}

        {draft.etape === 3 && (
          <div className="solo-flow__photo-choix">
            <button type="button" className="solo-flow__photo-btn" onClick={capturerPhoto}>
              <Icon name="camera" size={28} />
              <span>Prendre une photo</span>
            </button>
            <label className="solo-flow__photo-btn">
              <Icon name="image" size={28} />
              <span>Importer une photo</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importerPhoto(f);
                }}
              />
            </label>
          </div>
        )}

        {draft.etape === 4 && (
          <div className="solo-flow__form">
            <input
              className="solo-flow__input"
              placeholder="Titre de l'annonce"
              value={draft.titre}
              maxLength={60}
              onChange={(e) => majDraft({ titre: e.target.value })}
            />
            <textarea
              className="solo-flow__textarea"
              placeholder="Description (optionnel)"
              value={draft.description}
              maxLength={300}
              rows={3}
              onChange={(e) => majDraft({ description: e.target.value })}
            />
            <h3 className="solo-flow__section">Categorie</h3>
            <div className="solo-flow__mosaique">
              {(draft.type === 'service' ? CATEGORIES_SERVICE : CATEGORIES_VENTE).map((c) => (
                <button
                  key={c.nom}
                  type="button"
                  className="solo-flow__cat"
                  data-on={draft.categorie === c.nom}
                  onClick={() => majDraft({ categorie: c.nom })}
                >
                  <Icon name={c.icone} size={20} />
                  <span>{c.nom}</span>
                </button>
              ))}
            </div>
            {draft.categorie === 'Autre' && (
              <input
                className="solo-flow__input"
                placeholder="Nom de ta categorie"
                onChange={(e) => majDraft({ categorie: e.target.value })}
              />
            )}
          </div>
        )}

        {draft.etape === 5 && (
          <div className="solo-flow__form">
            <h3 className="solo-flow__section">Prix</h3>
            <div className="solo-flow__prix-ligne">
              <input
                className="solo-flow__input solo-flow__input--prix"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={draft.prix || ''}
                onChange={(e) => majDraft({ prix: Number(e.target.value) || 0 })}
              />
              <div className="solo-flow__devise">
                <button
                  type="button"
                  className="solo-flow__devise-btn"
                  onClick={() => setDeviseOuverte((o) => !o)}
                >
                  {draft.devise}
                  <Icon name="chevronDown" size={12} />
                </button>
                {deviseOuverte && (
                  <div className="solo-flow__devise-liste">
                    {devises.map((d) => (
                      <button
                        key={d}
                        type="button"
                        data-on={d === draft.devise}
                        onClick={() => {
                          majDraft({ devise: d });
                          setDeviseOuverte(false);
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="solo-flow__prix-apercu">
              Apercu : {formatDevise(draft.prix, draft.devise)}
            </p>

            <h3 className="solo-flow__section">Etat</h3>
            <div className="solo-flow__etats">
              {(['stock', 'occasion', 'piece'] as EtatProduit[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  className="solo-flow__etat"
                  data-on={draft.etat === e}
                  onClick={() => majDraft({ etat: e })}
                >
                  {e === 'stock' ? 'En stock' : e === 'occasion' ? 'Occasion' : 'Piece'}
                </button>
              ))}
            </div>

            <h3 className="solo-flow__section">Position</h3>
            <div className="solo-flow__pos">
              <input
                className="solo-flow__input"
                placeholder="Quartier, ville"
                value={draft.position?.label || ''}
                onChange={(e) =>
                  majDraft({
                    position: { lat: 0, lng: 0, label: e.target.value },
                  })
                }
              />
              <button
                type="button"
                className="solo-flow__gps"
                onClick={capturerPosition}
                disabled={gpsEnCours}
              >
                <Icon name="pin" size={16} />
                {gpsEnCours ? '...' : 'GPS'}
              </button>
            </div>
          </div>
        )}

        {draft.etape === 6 && (
          <div className="solo-flow__form">
            <h3 className="solo-flow__section">Apercu dans le flux</h3>
            <div className="solo-flow__apercu">
              {draft.photo ? (
                <img className="solo-flow__apercu-photo" src={draft.photo} alt={draft.titre} />
              ) : (
                <div className="solo-flow__apercu-photo solo-flow__apercu-photo--empty">
                  <Icon name="image" size={28} />
                </div>
              )}
              <div className="solo-flow__apercu-corps">
                <h3>{draft.titre || 'Sans titre'}</h3>
                {draft.description && <p>{draft.description}</p>}
                <div className="solo-flow__apercu-meta">
                  <span className="solo-flow__badge">{draft.categorie || '—'}</span>
                  <span className="solo-flow__badge solo-flow__badge--etat">
                    {draft.etat === 'stock' ? 'En stock' : draft.etat === 'occasion' ? 'Occasion' : 'Piece'}
                  </span>
                </div>
                {draft.position?.label && (
                  <div className="solo-flow__apercu-pos">
                    <Icon name="pin" size={11} />
                    {draft.position.label}
                  </div>
                )}
                <div className="solo-flow__apercu-prix">
                  {formatDevise(draft.prix, draft.devise)}
                </div>
              </div>
            </div>
            {erreur && <div className="solo-flow__error">{erreur}</div>}
          </div>
        )}
      </div>

      {/* Footer fixe */}
      <div className="solo-flow__footer">
        {draft.etape > 1 && (
          <button
            type="button"
            className="solo-flow__btn solo-flow__btn--ghost"
            onClick={() => {
              sauverDraft(draft);
              setDraft(draftVide());
              onClose();
            }}
          >
            Brouillon
          </button>
        )}
        {draft.etape < 6 ? (
          <button
            type="button"
            className="solo-flow__btn solo-flow__btn--primary"
            onClick={suivant}
            disabled={!peutContinuer()}
          >
            Continuer
          </button>
        ) : (
          <button
            type="button"
            className="solo-flow__btn solo-flow__btn--primary"
            onClick={() => setPinOpen(true)}
            disabled={pubEnCours}
          >
            {pubEnCours ? 'Publication...' : 'Publier'}
          </button>
        )}
      </div>

      <PinSheet
        open={pinOpen}
        onClose={() => {
          if (!pubEnCours) setPinOpen(false);
        }}
        title="Confirmer la publication"
        subtitle="Ton code PIN est demande avant la mise en ligne"
        length={pinLength}
        onSubmit={publier}
      />
    </div>
  );
}
