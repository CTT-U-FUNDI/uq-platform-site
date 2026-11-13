import { useState, useEffect } from 'react';
import { getTemplate } from '../templates';
import { MediaUploader } from './MediaUploader';
import { PinModal } from '../../../components/ui/PinModal';
import api from '../../../api/client';
import * as MetierIcons from '../../../components/icons/metiers/MetierIcons';
import { Icon, type IconName } from '../../../components/ui/Icon';

interface CreateItemFormProps {
  type: string;
  onPublish: (data: any) => Promise<void>;
  onCancel: () => void;
  onBack: () => void;
  initialData?: any;
}

type Step = 'media' | 'details' | 'price' | 'review';

const CATEGORIES: { key: string; nom: string; icon: IconName }[] = [
  { key: 'general', nom: 'Général', icon: 'package' },
  { key: 'commerce', nom: 'Commerce', icon: 'shoppingBag' },
  { key: 'service', nom: 'Service', icon: 'tool' },
  { key: 'transport', nom: 'Transport', icon: 'car' },
  { key: 'communaute', nom: 'Communauté', icon: 'handshake' },
  { key: 'art', nom: 'Art & Culture', icon: 'palette' },
  { key: 'tech', nom: 'Technologie', icon: 'appWindow' },
  { key: 'agriculture', nom: 'Agriculture', icon: 'sprout' },
  { key: 'loisirs', nom: 'Loisirs', icon: 'gamepad' },
  { key: 'construction', nom: 'Construction', icon: 'layers' },
  { key: 'urgence', nom: 'Urgence', icon: 'lifeBuoy' },
];

export function CreateItemForm({ type, onPublish, onCancel, onBack, initialData }: CreateItemFormProps) {
  const template = getTemplate(type);
  const [step, setStep] = useState<Step>(initialData ? 'details' : 'media');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [publishError, setPublishError] = useState('');
  
  // Charger le statut du PIN
  useEffect(() => {
    const loadPinStatus = async () => {
      const uqNumber = localStorage.getItem('uq_number');
      if (!uqNumber) return;
      try {
        const r = await api.get(`/api/account/preferences/${uqNumber}`);
        if (r.data.preferences?.pin_enabled) setPinEnabled(true);
      } catch {}
    };
    loadPinStatus();
  }, []);
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (!initialData) return {};
    let mediaUrls: string[] = [];
    try {
      mediaUrls = typeof initialData.media_urls === 'string'
        ? JSON.parse(initialData.media_urls)
        : initialData.media_urls || [];
    } catch (error) {
      console.warn('Les médias de cette offre ne sont pas lisibles.', error);
    }
    return {
      titre: initialData.title || '',
      description: initialData.description || '',
      prix: initialData.price_borb?.toString() || '',
      categorie: initialData.category || 'general',
      photo: mediaUrls[0] || '',
    };
  });
  const [loading, setLoading] = useState(false);

  if (!template) return null;

  // Callback apres validation du PIN
  const onPinSuccess = async () => {
    setShowPinModal(false);
    if (pendingData) {
      await publishItem(pendingData);
      setPendingData(null);
    }
  };

  const getIcon = (iconKey: string, size = 24, color = 'currentColor') => {
    const IconComponent = (MetierIcons as any)[iconKey];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const publishItem = async (data: Record<string, unknown>) => {
    setLoading(true);
    setPublishError('');
    try {
      await onPublish(data);
    } catch (error) {
      console.error('La publication Zando a échoué.', error);
      setPublishError(error instanceof Error ? error.message : 'La publication a échoué. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    const data = {
      type,
      title: String(formData.titre || '').trim(),
      description: String(formData.description || '').trim(),
      price_borb: Number(formData.prix),
      media_urls: JSON.stringify(formData.photo ? [formData.photo] : []),
      category: String(formData.categorie || 'general'),
    };

    if (!data.title || !Number.isSafeInteger(data.price_borb) || data.price_borb <= 0) {
      setPublishError('Ajoutez un titre et un prix entier positif en BORB.');
      return;
    }

    if (pinEnabled) {
      setPendingData(data);
      setShowPinModal(true);
      return;
    }
    void publishItem(data);
  };

  const steps: Step[] = ['media', 'details', 'price', 'review'];
  const stepNumber = steps.indexOf(step) + 1;

  const goNext = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const goPrev = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else onBack();
  };

  const canContinue = () => {
    if (step === 'media') return true;
    if (step === 'details') return Boolean(String(formData.titre || '').trim());
    if (step === 'price') return Number.isSafeInteger(Number(formData.prix)) && Number(formData.prix) > 0;
    return true;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[var(--uq-bg-primary)] text-[var(--uq-text-primary)] animate-fade-in">
      
      {/* ─── HEADER COMPACT ─── */}
      <div className="px-4 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={step === 'media' ? onBack : goPrev}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm active:scale-90 transition-all"
          >
            <Icon name="arrowLeft" size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center animate-glow"
              style={{ backgroundColor: `${template.color}30` }}
            >
              {getIcon(template.iconKey, 12, template.color)}
            </div>
            <h2 className="text-xs font-bold text-white">{template.nom}</h2>
          </div>
          
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm active:scale-90 transition-all"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Barre de progression FINE */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                n <= stepNumber ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className="text-gray-500 text-[10px] mt-1 text-center">
          Étape {stepNumber} sur 4
        </p>
      </div>

      {/* ─── CONTENU ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        
        {/* ÉTAPE 1 : PHOTO */}
        {step === 'media' && (
          <div className="animate-slide-up space-y-3">
            <div className="text-center">
              <h3 className="text-white text-base font-bold"><Icon name="camera" size={18} /> Ajoute un média</h3>
              <p className="text-gray-500 text-xs mt-1">Photo ou vidéo de ton item</p>
            </div>
            <MediaUploader
              onUpload={(url) => handleChange('photo', url)}
              currentUrl={formData.photo}
            />
          </div>
        )}

        {/* ÉTAPE 2 : TITRE + DESCRIPTION */}
        {step === 'details' && (
          <div className="animate-slide-up space-y-3">
            <div className="text-center mb-2">
              <h3 className="text-white text-base font-bold"><Icon name="notebook" size={18} tone="info" /> Décris ton item</h3>
              <p className="text-gray-500 text-xs mt-1">Sois clair et précis</p>
            </div>
            
            <div>
              <label className="flex items-center justify-between text-white text-xs font-medium mb-1.5">
                <span>Titre <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                value={formData.titre || ''}
                onChange={(e) => handleChange('titre', e.target.value)}
                placeholder="Ex: iPhone 13 Pro 256 Go"
                className="input-lueur w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                autoFocus
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-white text-xs font-medium mb-1.5">
                <span>Description</span>
                <span className="text-gray-500 text-[10px]">
                  {(formData.description || '').length}/200
                </span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décris ton article en quelques mots..."
                maxLength={200}
                rows={3}
                className="input-lueur w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-white">Catégorie</p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleChange('categorie', cat.key)}
                    aria-pressed={(formData.categorie || 'general') === cat.key}
                    className={`rounded-xl p-2 text-center text-[10px] transition-colors ${
                      (formData.categorie || 'general') === cat.key
                        ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/60'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon name={cat.icon} size={20} className="mx-auto mb-0.5" />
                    {cat.nom}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : PRIX */}
        {step === 'price' && (
          <div className="animate-slide-up space-y-4">
            <div className="text-center">
              <h3 className="text-white text-base font-bold"><Icon name="wallet" size={18} tone="brand" /> Fixe ton prix</h3>
              <p className="text-gray-500 text-xs mt-1">Choisissez un prix entier en BORB</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 text-center border border-purple-500/20">
              <input
                type="number"
                min="1"
                step="1"
                value={formData.prix || ''}
                onChange={(e) => handleChange('prix', e.target.value)}
                placeholder="0"
                className="w-full bg-transparent border-none text-white text-4xl font-bold text-center focus:outline-none placeholder-gray-700"
                autoFocus
              />
              <p className="text-[#FFB800] text-sm font-bold mt-2">BORB</p>
            </div>
            <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-white/60">
              Les offres sont publiées via le serveur. Le serveur ne fournit pas encore de suggestion de prix par IA ni de paiement intégré.
            </p>
          </div>
        )}

        {/* ÉTAPE 6 : RÉCAPITULATIF */}
        {step === 'review' && (
          <div className="animate-slide-up space-y-3">
            <div className="text-center mb-2">
              <h3 className="text-white text-base font-bold"><Icon name="sparkle" size={18} tone="brand" /> Aperçu final</h3>
              <p className="text-gray-500 text-xs mt-1">Vérifie avant de publier</p>
            </div>
            
            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 animate-scale-in">
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                {formData.photo ? (
                  <img src={formData.photo} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl opacity-30"><Icon name="camera" size={20} /></span>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-white font-bold text-sm mb-1">
                  {formData.titre || 'Sans titre'}
                </h4>
                {formData.description && (
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                    {formData.description}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {formData.prix && <span className="font-bold text-[#FFB800]"><Icon name="wallet" size={20} tone="brand" /> {formData.prix} BORB</span>}
                  {formData.categorie && <span className="text-gray-400">· {CATEGORIES.find((category) => category.key === formData.categorie)?.nom || formData.categorie}</span>}
                </div>
              </div>
            </div>

            <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-white/60">
              Cette annonce est enregistrée et publiée sur Zando par le backend. Aucun paiement ou réservation n’est simulé.
            </p>
          </div>
        )}

      </div>

      {/* ─── BOUTON ─── */}
      <div className="p-3 border-t border-white/10 bg-black">
        {publishError && (
          <p className="mb-3 text-center text-sm text-red-300" role="alert">{publishError}</p>
        )}
        {step === 'review' ? (
          <button
            onClick={handlePublish}
            disabled={loading}
            className="w-full py-3 rounded-full font-bold text-white text-sm
                       bg-gradient-to-r from-purple-600 to-blue-600
                       active:scale-95 transition-all disabled:opacity-50
                       shadow-lg shadow-purple-500/50 animate-glow"
          >
            {loading ? 'Publication...' : 'PUBLIER'}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!canContinue()}
            className="w-full py-3 rounded-full font-bold text-white text-sm
                       bg-gradient-to-r from-purple-600 to-blue-600
                       active:scale-95 transition-all disabled:opacity-50"
          >
            Continuer →
          </button>
        )}
      </div>


      {/* ═══ PIN MODAL ═══ */}
      {showPinModal && (
        <PinModal
          action="publish"
          uqNumber={localStorage.getItem('uq_number') || ''}
          onSuccess={() => { void onPinSuccess(); }}
          onCancel={() => { setShowPinModal(false); setPendingData(null); }}
        />
      )}
    </div>
  );
}
