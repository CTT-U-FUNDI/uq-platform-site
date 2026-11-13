import { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { StatusBadge, VerificationStatus } from '../components/StatusBadge';
import { Icon, type IconName } from '../../../components/ui/Icon';

interface VerificationPageProps {
  uqNumber: string;
}

type Step = 'identity' | 'selfie' | 'mobile_money' | 'recap' | 'submitted';

export function VerificationPage({ uqNumber }: VerificationPageProps) {
  const [status, setStatus] = useState<VerificationStatus>('not_verified');
  const [currentStep, setCurrentStep] = useState<Step>('identity');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [msgOk, setMsgOk] = useState(true);

  // Données collectées
  const [identityPhoto, setIdentityPhoto] = useState<string | null>(null);
  const [identityName, setIdentityName] = useState('');
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileOperator, setMobileOperator] = useState('MTN');
  const [mobileSimName, setMobileSimName] = useState('');

  useEffect(() => {
    loadStatus();
  }, [uqNumber]);

  const loadStatus = async () => {
    try {
      const resp = await apiClient.get(`/api/account/verification/${uqNumber}`);
      setStatus(resp.data.status || 'not_verified');
    } catch {
      setStatus('not_verified');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File, type: 'identity' | 'selfie') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (type === 'identity') setIdentityPhoto(base64);
      else setSelfiePhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const canGoNext = (): boolean => {
    if (currentStep === 'identity') return !!identityPhoto && identityName.length >= 3;
    if (currentStep === 'selfie') return !!selfiePhoto;
    if (currentStep === 'mobile_money') return mobileNumber.length >= 9 && mobileSimName.length >= 3;
    return true;
  };

  const nextStep = () => {
    setMessage('');
    if (currentStep === 'identity') setCurrentStep('selfie');
    else if (currentStep === 'selfie') setCurrentStep('mobile_money');
    else if (currentStep === 'mobile_money') setCurrentStep('recap');
  };

  const prevStep = () => {
    setMessage('');
    if (currentStep === 'selfie') setCurrentStep('identity');
    else if (currentStep === 'mobile_money') setCurrentStep('selfie');
    else if (currentStep === 'recap') setCurrentStep('mobile_money');
  };

  const submitVerification = async () => {
    setSubmitting(true);
    setMessage('');

    try {
      const resp = await apiClient.post('/api/account/verification/submit', {
        uq_number: uqNumber,
        identity_photo: identityPhoto,
        identity_name: identityName,
        selfie_photo: selfiePhoto,
        mobile_number: mobileNumber,
        mobile_operator: mobileOperator,
        mobile_sim_name: mobileSimName,
      });

      if (resp.data.status === 'success') {
        setStatus('pending');
        setCurrentStep('submitted');
        setMessage('Documents envoyés. Vérification en cours...');
        setMsgOk(true);
      } else {
        setMessage(resp.data.message || 'Erreur');
        setMsgOk(false);
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || e.message);
      setMsgOk(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-2 border-[#FCD535] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ===== DEJA VERIFIE =====
  if (status === 'verified') {
    return (
      <div className="bg-[#0ECB81]/10 border border-[#0ECB81]/30 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="text-6xl mb-4"><Icon name="checkCircle" size={20} tone="success" /></div>
        <h3 className="text-xl font-bold text-[#0ECB81] mb-2">Compte Vérifié</h3>
        <p className="text-sm text-[#8E8E9A]">Tu es éligible à toutes les fonctions UQ.</p>
      </div>
    );
  }

  // ===== EN ATTENTE =====
  if (status === 'pending' || currentStep === 'submitted') {
    return (
      <div className="bg-[#FCD535]/10 border border-[#FCD535]/30 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="text-6xl mb-4"><Icon name="hourglass" size={20} tone="muted" /></div>
        <h3 className="text-xl font-bold text-[#FCD535] mb-2">En cours de vérification</h3>
        <p className="text-sm text-[#8E8E9A] mb-4">Tes documents sont en cours d'examen. Cela peut prendre 24-48h.</p>
        <StatusBadge status="pending" size="lg" />
      </div>
    );
  }

  // ===== ETAPES (NOUVEL ORDRE) =====
  const STEPS = [
    { id: 'identity',     label: 'Identité', icon: 'idCard' as IconName },
    { id: 'selfie',       label: 'Selfie', icon: 'scanFace' as IconName },
    { id: 'mobile_money', label: 'Mobile', icon: 'phone' as IconName },
    { id: 'recap',        label: 'Résumé', icon: 'clipboard' as IconName },
  ];

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-lg mx-auto">

      {/* ═══ HEADER + PROGRESS ═══ */}
      <div className="bg-gradient-to-br from-[#B5378C]/20 to-[#FCD535]/20 border border-[#B5378C]/30 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold"><Icon name="idCard" size={18} tone="info" /> Vérification</h2>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => {
            const done = i < currentStepIndex;
            const active = i === currentStepIndex;
            return (
              <div key={step.id} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done ? 'bg-[#0ECB81] text-black' :
                  active ? 'bg-[#FCD535] text-black' :
                  'bg-[#2A2A38] text-[#5A5A6A]'
                }`}>
                  {done ? <Icon name="check" size={14} /> : <Icon name={step.icon} size={14} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${done ? 'bg-[#0ECB81]' : 'bg-[#2A2A38]'}`} />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center mt-3 text-[#8E8E9A]">
          Étape {currentStepIndex + 1} / {STEPS.length} — {STEPS[currentStepIndex]?.label}
        </p>
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded-xl text-sm ${
          msgOk ? 'bg-[#0ECB81]/15 text-[#0ECB81]' : 'bg-[#F6465D]/15 text-[#F6465D]'
        }`}>
          {message}
        </div>
      )}

      {/* ═══ ETAPE 1 : CARTE D'IDENTITE ═══ */}
      {currentStep === 'identity' && (
        <div className="space-y-4">
          <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/15 flex items-center justify-center text-2xl"><Icon name="idCard" size={24} tone="info" /></div>
              <div>
                <h3 className="text-sm font-bold">Carte d'identité</h3>
                <p className="text-[11px] text-[#8E8E9A]">Photo nette recto</p>
              </div>
            </div>

            {identityPhoto ? (
              <div className="relative mb-4">
                <img src={identityPhoto} alt="Carte" className="w-full h-48 object-cover rounded-xl" />
                <button onClick={() => setIdentityPhoto(null)}
                  className="absolute top-2 right-2 px-3 py-1 bg-[#F6465D] text-white text-xs rounded-full font-bold">
                  Supprimer
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-[#2A2A38] hover:border-[#FCD535] rounded-xl p-8 text-center cursor-pointer mb-4">
                <div className="text-4xl mb-2"><Icon name="camera" size={32} /></div>
                <p className="text-sm font-medium">Prendre une photo</p>
                <p className="text-[11px] text-[#8E8E9A] mt-1">Document entier visible</p>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'identity')} />
              </label>
            )}

            <label className="text-xs text-[#8E8E9A] uppercase tracking-wide block mb-2">
              Nom EXACT sur le document
            </label>
            <input type="text" value={identityName}
              onChange={(e) => setIdentityName(e.target.value.toUpperCase())}
              placeholder="JEAN MUTOMBO"
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#2A2A38] text-[#EAECEF] uppercase focus:border-[#FCD535] outline-none" />
            <p className="text-[10px] text-[#FCD535] mt-2"><Icon name="alert" size={12} tone="warning" /> Doit correspondre exactement</p>
          </div>

          <button onClick={nextStep} disabled={!canGoNext()}
            className={`w-full py-4 rounded-full font-bold text-white ${
              canGoNext() ? 'bg-gradient-to-r from-[#B5378C] to-[#FCD535] active:scale-95' : 'bg-[#2A2A38] opacity-50 cursor-not-allowed'
            }`}>
            Continuer →
          </button>
        </div>
      )}

      {/* ═══ ETAPE 2 : SELFIE ═══ */}
      {currentStep === 'selfie' && (
        <div className="space-y-4">
          <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/15 flex items-center justify-center text-2xl"><Icon name="scanFace" size={24} tone="info" /></div>
              <div>
                <h3 className="text-sm font-bold">Selfie (détection vivant)</h3>
                <p className="text-[11px] text-[#8E8E9A]">Visage bien éclairé</p>
              </div>
            </div>

            {selfiePhoto ? (
              <div className="relative mb-4">
                <img src={selfiePhoto} alt="Selfie" className="w-full h-64 object-cover rounded-xl" />
                <button onClick={() => setSelfiePhoto(null)}
                  className="absolute top-2 right-2 px-3 py-1 bg-[#F6465D] text-white text-xs rounded-full font-bold">
                  Supprimer
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-[#2A2A38] hover:border-[#FCD535] rounded-xl p-12 text-center cursor-pointer mb-4">
                <div className="text-5xl mb-3"><Icon name="scanFace" size={20} tone="info" /></div>
                <p className="text-sm font-medium">Prendre un selfie</p>
                <p className="text-[11px] text-[#8E8E9A] mt-1">Regarde la caméra</p>
                <input type="file" accept="image/*" capture="user" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'selfie')} />
              </label>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={prevStep} className="px-6 py-4 rounded-full bg-[#2A2A38] text-[#EAECEF] font-bold">
              <Icon name="arrowLeft" size={20} /> Retour
            </button>
            <button onClick={nextStep} disabled={!canGoNext()}
              className={`flex-1 py-4 rounded-full font-bold text-white ${
                canGoNext() ? 'bg-gradient-to-r from-[#B5378C] to-[#FCD535] active:scale-95' : 'bg-[#2A2A38] opacity-50 cursor-not-allowed'
              }`}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ═══ ETAPE 3 : MOBILE MONEY (DERNIERE) ═══ */}
      {currentStep === 'mobile_money' && (
        <div className="space-y-4">
          <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/15 flex items-center justify-center text-2xl"><Icon name="phone" size={24} tone="info" /></div>
              <div>
                <h3 className="text-sm font-bold">Numéro Mobile Money</h3>
                <p className="text-[11px] text-[#8E8E9A]">Le numéro et le nom sur ta carte SIM</p>
              </div>
            </div>

            <label className="text-xs text-[#8E8E9A] uppercase tracking-wide block mb-2">Numéro</label>
            <input type="tel" value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d+]/g, ''))}
              placeholder="+243 812 345 678"
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#2A2A38] text-[#EAECEF] focus:border-[#FCD535] outline-none mb-4" />

            <label className="text-xs text-[#8E8E9A] uppercase tracking-wide block mb-2">Opérateur</label>
            <select value={mobileOperator} onChange={(e) => setMobileOperator(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#2A2A38] text-[#EAECEF] focus:border-[#FCD535] outline-none mb-4">
              <option value="MTN">MTN Mobile Money</option>
              <option value="Orange">Orange Money</option>
              <option value="Airtel">Airtel Money</option>
              <option value="Vodacom">Vodacom M-Pesa</option>
            </select>

            <label className="text-xs text-[#8E8E9A] uppercase tracking-wide block mb-2">
              NOM LÉGAL sur la carte SIM
            </label>
            <input type="text" value={mobileSimName}
              onChange={(e) => setMobileSimName(e.target.value.toUpperCase())}
              placeholder="JEAN MUTOMBO"
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#2A2A38] text-[#EAECEF] uppercase focus:border-[#FCD535] outline-none" />
            <p className="text-[10px] text-[#FCD535] mt-2">
              <Icon name="alert" size={12} tone="warning" /> Le nom enregistré sur ta carte SIM
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={prevStep} className="px-6 py-4 rounded-full bg-[#2A2A38] text-[#EAECEF] font-bold">
              <Icon name="arrowLeft" size={20} /> Retour
            </button>
            <button onClick={nextStep} disabled={!canGoNext()}
              className={`flex-1 py-4 rounded-full font-bold text-white ${
                canGoNext() ? 'bg-gradient-to-r from-[#B5378C] to-[#FCD535] active:scale-95' : 'bg-[#2A2A38] opacity-50 cursor-not-allowed'
              }`}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ═══ ETAPE 4 : RECAP ═══ */}
      {currentStep === 'recap' && (
        <div className="space-y-4">
          <div className="bg-[#181A20] border border-[#2A2A38] rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span className="text-lg"><Icon name="checkCircle" size={18} tone="success" /></span> Récapitulatif
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#0A0A0F] rounded-xl">
                <span className="text-2xl"><Icon name="idCard" size={24} tone="info" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#8E8E9A] uppercase">Carte d'identité</p>
                  <p className="text-sm font-medium truncate">{identityName}</p>
                </div>
                <span className="text-[#0ECB81]"><Icon name="check" size={20} tone="success" /></span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0A0A0F] rounded-xl">
                <span className="text-2xl"><Icon name="scanFace" size={24} tone="info" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#8E8E9A] uppercase">Selfie</p>
                  <p className="text-sm font-medium">Photo fournie</p>
                </div>
                <span className="text-[#0ECB81]"><Icon name="check" size={20} tone="success" /></span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0A0A0F] rounded-xl">
                <span className="text-2xl"><Icon name="phone" size={24} tone="info" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#8E8E9A] uppercase">Mobile Money</p>
                  <p className="text-sm font-medium truncate">{mobileNumber} · {mobileOperator}</p>
                  <p className="text-[10px] text-[#5A5A6A]">SIM : {mobileSimName}</p>
                </div>
                <span className="text-[#0ECB81]"><Icon name="check" size={20} tone="success" /></span>
              </div>
            </div>
          </div>

          <div className="bg-[#FCD535]/10 border border-[#FCD535]/30 rounded-xl p-4">
            <p className="text-xs text-[#FCD535]">
              <Icon name="alert" size={14} tone="warning" /> En cliquant sur "Envoyer", tu confirmes que les informations sont exactes.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={prevStep} className="px-6 py-4 rounded-full bg-[#2A2A38] text-[#EAECEF] font-bold">
              <Icon name="arrowLeft" size={20} /> Retour
            </button>
            <button onClick={submitVerification} disabled={submitting}
              className="flex-1 py-4 rounded-full font-bold text-white bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] active:scale-95 disabled:opacity-50">
              {submitting ? 'Envoi...' : 'Envoyer pour vérification'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationPage;
