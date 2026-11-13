import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Icon } from './Icon';

interface PinModalProps {
  action: string;
  uqNumber: string;
  onSuccess: (verifiedPin?: string) => void;
  onCancel: () => void;
  mode?: 'verify' | 'set' | 'change' | 'remove';
  pinLength?: 4 | 5 | 6;
}

export const PinModal: React.FC<PinModalProps> = ({
  action,
  uqNumber,
  onSuccess,
  onCancel,
  mode = 'verify',
  pinLength: propPinLength,
}) => {
  const [step, setStep] = useState<'old_pin' | 'length' | 'new_pin' | 'confirm' | 'password'>('old_pin');
  const [oldPin, setOldPin] = useState('');
  const [pinLength, setPinLength] = useState<4 | 5 | 6>(propPinLength || 6);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    
    // Charger le statut du PIN pour connaitre la longueur
    (async () => {
      try {
        const r = await apiClient.post('/api/account/pin/status', { uq_number: uqNumber });
        const len = r.data?.pin_length ?? (typeof r.data?.pin_status === 'object' ? r.data?.pin_status?.pin_length : undefined);
        if (len === 4 || len === 5 || len === 6) {
          setPinLength(len as 4 | 5 | 6);
        }
      } catch { /* ignore */ }
    })();
  }, [uqNumber]);

  useEffect(() => {
    if (propPinLength && (propPinLength === 4 || propPinLength === 5 || propPinLength === 6)) {
      setPinLength(propPinLength);
    }
  }, [propPinLength]);

  useEffect(() => {
    setPin('');
    setConfirmPin('');
    setOldPin('');
    setPassword('');
    setError('');

    if (mode === 'verify') setStep('new_pin');
    else if (mode === 'change' || mode === 'remove') setStep('old_pin');
    else setStep('length');
  }, [mode]);

  const close = () => {
    setVisible(false);
    setTimeout(onCancel, 300);
  };

  const actionLabels: Record<string, string> = {
    send: 'Envoyer BORB',
    convert: 'Convertir BORB',
    withdraw: 'Retirer',
    publish: 'Publier dans Zando',
    delete_draft: 'Supprimer brouillon',
    delete_item: 'Supprimer publication',
  };

  const handleKey = (key: string) => {
    const current = step === 'confirm' ? confirmPin : step === 'old_pin' ? oldPin : pin;
    const setCurrent = step === 'confirm' ? setConfirmPin : step === 'old_pin' ? setOldPin : setPin;

    if (key === 'delete') {
      setCurrent(current.slice(0, -1));
      setError('');
      return;
    }

    if (key === 'confirm') {
      if (current.length === pinLength) {
        if (step === 'old_pin') {
          // Ancien PIN entré → longueur
          setStep('length');
          setError('');
        } else if (step === 'new_pin') {
          if (mode === 'verify') {
            // Mode VERIFY : valider directement
            submit();
          } else {
            // Nouveau PIN entré → confirmation
            setStep('confirm');
            setError('');
          }
        } else if (step === 'confirm') {
          // Confirmation → vérifier correspondance
          if (pin !== confirmPin) {
            showError('Les PIN ne correspondent pas');
            setConfirmPin('');
            setStep('new_pin');
            return;
          }
          // → mot de passe
          setStep('password');
          setError('');
        }
      }
      return;
    }

    if (current.length < pinLength) {
      setCurrent(current + key);
      setError('');
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');

    try {
      if (mode === 'verify') {
        const r = await apiClient.post('/api/account/pin/verify', { uq_number: uqNumber, pin });
        if (r.data.valid) onSuccess(pin);
        else showError(r.data.message || 'PIN incorrect');
      } else if (mode === 'set' || mode === 'change') {
        const r = await apiClient.post('/api/account/pin/set', {
          uq_number: uqNumber,
          pin,
          password,
          old_pin: oldPin,
        });
        if (r.data.status === 'success') onSuccess();
        else showError(r.data.message || 'Erreur');
      } else if (mode === 'remove') {
        const r = await apiClient.post('/api/account/pin/remove', {
          uq_number: uqNumber,
          password,
        });
        if (r.data.status === 'success') onSuccess();
        else showError(r.data.message || 'Erreur');
      }
    } catch (e: any) {
      showError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    if (step === 'confirm') setConfirmPin('');
    if (step === 'new_pin') setPin('');
    if (step === 'old_pin') setOldPin('');
    if (step === 'password') setPassword('');
  };

  const currentPin = step === 'confirm' ? confirmPin : step === 'old_pin' ? oldPin : pin;
  const dots = Array.from({ length: pinLength });

  const stepTitle = {
    old_pin: 'Entre ton ancien PIN',
    length: 'Choisis la longueur',
    new_pin: mode === 'verify' ? 'Entre ton code PIN' : 'Choisis ton nouveau PIN',
    confirm: 'Confirme ton nouveau PIN',
    password: 'Mot de passe du compte',
  }[step];

  const stepNumber = {
    old_pin: 1,
    length: 2,
    new_pin: 3,
    confirm: 4,
    password: 5,
  }[step];

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-end justify-center transition-all duration-300 ${visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}
      onClick={close}
    >
      <div
        className={`w-full max-w-md bg-[#14141A] border-t border-[#2A2A38] rounded-t-3xl transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 rounded-full bg-[#2A2A38]" />
        </div>

        <div className={`p-5 ${shake ? 'uq-animate-shake' : ''}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FCD535]/15 flex items-center justify-center text-lg">
                <Icon name="lockKeyhole" size={18} tone="muted" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {mode === 'verify' && 'Code PIN'}
                  {mode === 'set' && 'Configurer le PIN'}
                  {mode === 'change' && 'Modifier le PIN'}
                  {mode === 'remove' && 'Supprimer le PIN'}
                </h3>
                <p className="text-xs text-[#8E8E9A]">
                  {mode === 'verify' ? (actionLabels[action] || 'Confirmation') : `Étape ${stepNumber}/5`}
                </p>
              </div>
            </div>
            <button onClick={close} className="text-[#8E8E9A] text-lg"><Icon name="x" size={18} /></button>
          </div>

          {/* Indicateur d'étapes */}
          {(mode === 'change' || mode === 'set') && (
            <div className="flex gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    n <= stepNumber ? 'bg-[#FCD535]' : 'bg-[#2A2A38]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Titre de l'étape */}
          <p className="text-center text-sm text-[#EAECEF] mb-1">
            {stepTitle}
          </p>

          {/* Sous-titre */}
          {step === 'length' ? (
            <p className="text-center text-[10px] text-[#5A5A6A] mb-5">
              Cette longueur s'appliquera au nouveau PIN
            </p>
          ) : step === 'password' ? (
            <p className="text-center text-[10px] text-[#5A5A6A] mb-5">
              Obligatoire pour confirmer
            </p>
          ) : step !== 'old_pin' ? (
            <p className="text-center text-[10px] text-[#5A5A6A] mb-5">
              {pinLength} chiffres requis
            </p>
          ) : (
            <p className="text-center text-[10px] text-[#5A5A6A] mb-5">
              Sécurité du compte
            </p>
          )}

          {/* ÉTAPE LONGUEUR */}
          {step === 'length' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPinLength(4)}
                  className={`py-4 rounded-xl font-bold text-sm border-2 transition-all ${
                    pinLength === 4
                      ? 'bg-[#FCD535]/15 border-[#FCD535] text-[#FCD535]'
                      : 'bg-[#0A0A0F] border-[#2A2A38] text-[#8E8E9A]'
                  }`}
                >
                  <div className="text-2xl mb-1">4</div>
                  <div className="text-[10px]">chiffres</div>
                </button>
                <button
                  onClick={() => setPinLength(6)}
                  className={`py-4 rounded-xl font-bold text-sm border-2 transition-all ${
                    pinLength === 6
                      ? 'bg-[#FCD535]/15 border-[#FCD535] text-[#FCD535]'
                      : 'bg-[#0A0A0F] border-[#2A2A38] text-[#8E8E9A]'
                  }`}
                >
                  <div className="text-2xl mb-1">6</div>
                  <div className="text-[10px]">chiffres</div>
                </button>
              </div>

              {error && <p className="text-sm text-center text-[#F6465D]">{error}</p>}

              <button
                onClick={() => {
                  setError('');
                  setPin('');
                  setConfirmPin('');
                  setStep('new_pin');
                }}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold active:scale-95 transition-transform"
              >
                Continuer
              </button>

              <button
                onClick={() => {
                  setError('');
                  setStep('old_pin');
                }}
                className="w-full py-2.5 rounded-full bg-[#1A1A24] border border-[#2A2A38] text-[#8E8E9A] text-xs font-semibold"
              >
                <Icon name="arrowLeft" size={20} /> Retour
              </button>
            </div>
          )}

          {/* ÉTAPES PIN (old_pin, new_pin, confirm) */}
          {(step === 'old_pin' || step === 'new_pin' || step === 'confirm') && (
            <>
              <div className="flex justify-center gap-3 mb-6">
                {dots.map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all ${
                      currentPin.length > i ? 'bg-[#FCD535] scale-110' : 'bg-[#2A2A38]'
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-sm text-center text-[#F6465D] mb-3">{error}</p>}

              <div className="grid grid-cols-3 gap-2 mb-3">
                {['1','2','3','4','5','6','7','8','9','delete','0','confirm'].map((key) => {
                  if (key === 'delete') return (
                    <button key={key} onClick={() => handleKey('delete')} disabled={currentPin.length === 0} className="h-14 rounded-xl bg-[#1A1A24] text-[#EAECEF] text-xl font-bold active:scale-95 disabled:opacity-30"><Icon name="delete" size={20} /></button>
                  );
                  if (key === 'confirm') return (
                    <button key={key} onClick={() => handleKey('confirm')} disabled={currentPin.length !== pinLength || loading} className="h-14 rounded-xl bg-gradient-to-br from-[#FCD535] to-[#F0CB2E] text-black text-xl font-bold active:scale-95 disabled:opacity-50">
                      {loading ? '⏳' : '✓'}
                    </button>
                  );
                  return (
                    <button key={key} onClick={() => handleKey(key)} disabled={currentPin.length >= pinLength} className="h-14 rounded-xl bg-[#1A1A24] text-[#EAECEF] text-xl font-bold active:scale-95 hover:bg-[#252533] disabled:opacity-50">{key}</button>
                  );
                })}
              </div>

              <button onClick={close} className="w-full py-2.5 rounded-full bg-[#1A1A24] border border-[#2A2A38] text-[#8E8E9A] text-xs font-semibold">Annuler</button>
            </>
          )}

          {/* ÉTAPE MOT DE PASSE */}
          {step === 'password' && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-[#0A0A0F] border border-[#2A2A38] rounded-xl px-4 py-3 pr-12 text-[#EAECEF] focus:outline-none focus:border-[#FCD535]"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E9A]"
                  type="button"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {error && <p className="text-sm text-center text-[#F6465D]">{error}</p>}

              <button
                onClick={() => {
                  if (!password) {
                    setError('Mot de passe requis');
                    return;
                  }
                  submit();
                }}
                disabled={loading || !password}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold active:scale-95 disabled:opacity-50 transition-transform"
              >
                {loading ? '⏳ Validation...' : 'Valider'}
              </button>

              <button
                onClick={() => {
                  setPassword('');
                  setError('');
                  setStep('confirm');
                }}
                className="w-full py-2.5 rounded-full bg-[#1A1A24] border border-[#2A2A38] text-[#8E8E9A] text-xs font-semibold"
              >
                <Icon name="arrowLeft" size={20} /> Retour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinModal;
