// ============================================================================
// SoloSaleForm.tsx — Formulaire de vente solo (objet / service)
// S'ouvre depuis le bouton + de l'accueil (1 clic).
// Publie dans le flux Zando comme une carte solo.
// ============================================================================

import { useCallback, useState } from 'react';
import { Icon } from './Icon';
import { Button, Card, Field, Input, Textarea, ScreenHeader, Chip } from './Ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SoloCategorie = 'Véhicule' | 'Immobilier' | 'Service' | 'Objet' | 'Autre';

export interface SoloItem {
  photo: string;
  titre: string;
  description: string;
  prix: number;
  categorie: SoloCategorie;
  geoloc: string;
}

interface SoloSaleFormProps {
  onClose: () => void;
  onPublish: (item: SoloItem) => Promise<void>;
}

const CATEGORIES: SoloCategorie[] = ['Véhicule', 'Immobilier', 'Service', 'Objet', 'Autre'];

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function SoloSaleForm({ onClose, onPublish }: SoloSaleFormProps) {
  const [photo, setPhoto] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [categorie, setCategorie] = useState<SoloCategorie>('Objet');
  const [geoloc, setGeoloc] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peutPublier = titre.trim().length >= 3 && prix.trim().length > 0 && photo.length > 0 && !busy;

  const handlePublish = useCallback(async () => {
    if (!peutPublier) return;
    setBusy(true);
    setError(null);
    try {
      await onPublish({
        photo,
        titre: titre.trim(),
        description: description.trim(),
        prix: Number(prix) || 0,
        categorie,
        geoloc: geoloc.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setBusy(false);
    }
  }, [peutPublier, onPublish, photo, titre, description, prix, categorie, geoloc]);

  return (
    <div className="solo-form">
      <ScreenHeader
        title="Vendre un objet / service"
        onBack={onClose}
        right={
          <Button
            size="sm"
            variant="primary"
            onClick={() => void handlePublish()}
            disabled={!peutPublier}
            loading={busy}
          >
            Publier
          </Button>
        }
      />

      <div className="solo-form__body">
        {/* Photo */}
        <Card>
          <div className="solo-form__photo">
            {photo ? (
              <img src={photo} alt="Aperçu" className="solo-form__photo-img" />
            ) : (
              <div className="solo-form__photo-empty">
                <Icon name="camera" size={32} />
                <span>Ajouter une photo</span>
              </div>
            )}
            <label className="solo-form__photo-btn">
              <Icon name="camera" size={14} />
              <span>{photo ? 'Changer' : 'Choisir'}</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => setPhoto(String(r.result || ''));
                  r.readAsDataURL(f);
                }}
              />
            </label>
          </div>
        </Card>

        {/* Titre */}
        <Field label="Titre" hint={`${titre.length}/60`}>
          <Input
            value={titre}
            onChange={(e) => setTitre(e.target.value.slice(0, 60))}
            placeholder="Ex. iPhone 13 Pro Max 256 Go"
          />
        </Field>

        {/* Description */}
        <Field label="Description" hint={`${description.length}/300`}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 300))}
            placeholder="Décris l'objet ou le service en quelques lignes."
            rows={3}
          />
        </Field>

        {/* Prix */}
        <Field label="Prix (FC)">
          <Input
            type="number"
            inputMode="numeric"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="Ex. 1200000"
          />
        </Field>

        {/* Catégorie */}
        <Field label="Catégorie">
          <div className="solo-form__cats">
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={categorie === c}
                onClick={() => setCategorie(c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        </Field>

        {/* Géolocalisation */}
        <Field label="Lieu (quartier, ville)">
          <Input
            value={geoloc}
            onChange={(e) => setGeoloc(e.target.value)}
            placeholder="Ex. Gombe, Kinshasa"
          />
        </Field>

        {error && (
          <div className="solo-form__error">
            <Icon name="alert" size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className="solo-form__note">
          <Icon name="info" size={14} />
          <span>
            Une seule annonce. Elle entre dans le flux Zando comme une carte solo.
            PIN demandé avant la publication.
          </span>
        </div>
      </div>
    </div>
  );
}