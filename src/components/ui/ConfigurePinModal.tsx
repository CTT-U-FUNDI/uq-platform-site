// ============================================================
// CONFIGURE PIN MODAL - Configurer son PIN pour la 1ere fois
// ============================================================

import { useState } from 'react';
import apiClient from '../../api/client';
import { Icon } from './Icon';

interface Props {
  uqNumber: string;
  action: string;
  onSuccess: (configuredPin: string) => void;
  onCancel: () => void;
}

export function ConfigurePinModal({ uqNumber, action, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<'length' | 'pin' | 'confirm' | 'password'>('length');
  const [pinLength, setPinLength] = useState<4 | 5 | 6>(4);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const actionLabels: Record<string, string> = {
    send: 'Envoyer',
    convert: 'Convertir',
    withdraw: 'Retirer',
    ubi: 'Reclamer UBI',
  };

  const handleLengthSelect = (len: 4 | 5 | 6) => {
    setPinLength(len);
    setStep('pin');
  };

  const handlePinSubmit = () => {
    if (pin.length !== pinLength) {
      setError(`Le PIN doit faire ${pinLength} chiffres`);
      return;
    }
    setStep('confirm');
  };

  const handleConfirmSubmit = async () => {
    if (pin !== confirmPin) {
      setError('Les PIN ne correspondent pas');
      setConfirmPin('');
      return;
    }

    if (!password) {
      setError('');
      setStep('password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const r = await apiClient.post('/api/account/pin/set', {
        uq_number: uqNumber,
        pin,
        password,
        pin_length: pinLength,
      });

      if (r.data.status === 'success') {
        onSuccess(pin);
      } else {
        setError(r.data.message || 'Erreur lors de la configuration');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Erreur reseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,42,0.98) 0%, rgba(20,20,30,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.4)',
          boxShadow: '0 0 60px rgba(255,215,0,0.2), 0 0 100px rgba(230,57,70,0.15)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-2"><Icon name="lock" size={32} tone="muted" /></div>
          <h2 className="text-xl font-black text-white mb-1">
            Sécuriser ton coffre
          </h2>
          <p className="text-xs text-white/60">
            Configure ton PIN pour {actionLabels[action] || action}
          </p>
        </div>

        {/* ETAPE 1 : Choix longueur */}
        {step === 'length' && (
          <div>
            <p className="text-sm text-white/80 text-center mb-4">
              Choisis la longueur de ton PIN
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {([4, 5, 6] as const).map((len) => (
                <button
                  key={len}
                  onClick={() => handleLengthSelect(len)}
                  className="py-4 rounded-xl font-bold text-white transition-all active:scale-95 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(230,57,70,0.1) 100%)',
                    border: '1px solid rgba(255,215,0,0.4)',
                    boxShadow: '0 0 20px rgba(255,215,0,0.2)',
                  }}
                >
                  <div className="text-2xl font-black">{len}</div>
                  <div className="text-[10px] text-white/70">chiffres</div>
                </button>
              ))}
            </div>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl text-white/60 font-bold border border-white/10 hover:text-white"
            >
              Annuler
            </button>
          </div>
        )}

        {/* ETAPE 2 : Saisir PIN */}
        {step === 'pin' && (
          <div>
            <p className="text-sm text-white/80 text-center mb-3">
              Saisis ton PIN ({pinLength} chiffres)
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, pinLength);
                setPin(v);
                setError('');
              }}
              placeholder={`${pinLength} chiffres`}
              maxLength={pinLength}
              autoFocus
              className="w-full p-4 rounded-xl bg-black/60 border border-white/20 text-white text-center text-3xl font-mono font-bold tracking-[0.5em] focus:outline-none focus:border-[#FFD700] mb-3"
            />
            {error && (
              <div className="p-2 rounded-lg bg-[#F6465D]/15 text-[#F6465D] text-xs text-center mb-3">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('length'); setPin(''); setError(''); }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-bold"
              >
                Retour
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== pinLength}
                className="flex-1 py-3 rounded-xl font-bold text-black disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* ETAPE 3 : Confirmer PIN */}
        {step === 'confirm' && (
          <div>
            <p className="text-sm text-white/80 text-center mb-3">
              Confirme ton PIN
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, pinLength);
                setConfirmPin(v);
                setError('');
              }}
              placeholder={`Confirme ${pinLength} chiffres`}
              maxLength={pinLength}
              autoFocus
              className="w-full p-4 rounded-xl bg-black/60 border border-white/20 text-white text-center text-3xl font-mono font-bold tracking-[0.5em] focus:outline-none focus:border-[#FFD700] mb-3"
            />
            {error && (
              <div className="p-2 rounded-lg bg-[#F6465D]/15 text-[#F6465D] text-xs text-center mb-3">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('pin'); setConfirmPin(''); setError(''); }}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-bold disabled:opacity-40"
              >
                Retour
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={loading || confirmPin.length !== pinLength}
                className="flex-1 py-3 rounded-xl font-bold text-black disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* ETAPE 4 : Confirmer avec le mot de passe du compte */}
        {step === 'password' && (
          <div>
            <p className="text-sm text-white/80 text-center mb-3">
              Confirme avec le mot de passe de ton compte
            </p>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Mot de passe du compte"
              autoFocus
              className="w-full p-4 rounded-xl bg-black/60 border border-white/20 text-white text-sm focus:outline-none focus:border-[#FFD700] mb-3"
            />
            {error && (
              <div className="p-2 rounded-lg bg-[#F6465D]/15 text-[#F6465D] text-xs text-center mb-3">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('confirm'); setPassword(''); setError(''); }}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-bold disabled:opacity-40"
              >
                Retour
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={loading || !password}
                className="flex-1 py-3 rounded-xl font-bold text-black disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
              >
                {loading ? 'Sécurisation...' : 'Sécuriser le coffre'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}