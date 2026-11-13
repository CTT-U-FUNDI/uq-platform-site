import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { LogoUQ } from '../components/ui/LogoUQ';
import { Icon } from '../components/ui/Icon';
import {
  IconMedal, IconUnlock, IconIdCard,
  IconKeypad, IconMail, IconKey, IconSparkle,
  IconDNA, IconFingerprint, IconEye, IconMoreVertical
} from '../components/ui/Icons';
import { useScreen } from '../context/ScreenContext';
import {
  validateNumeroUQ,
  validatePassword
} from '../utils/validators';

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
  onCreateAccount?: () => void;
}

type LoginStep =
  | 'numero'      // Écran 1 : Numéro UQ
  | 'password'    // Écran 2 : Email + Mot de passe
  | 'code3543'    // Écran 3 : Code 3543 (owner)
  | 'code2fa'     // Écran 4 : 2FA
  | 'biometrie'   // Écran 5 : Biométrie
  | 'iphone';     // Mode iPhone (blocage)

interface IphoneState {
  cooldownUntil: number;
  remaining: number;
  level: number;
  attempts: number;
  uqNumber: string;
}

export function LoginScreen({ onLoginSuccess, onCreateAccount }: LoginScreenProps) {
  const { setScreen } = useScreen();

  useEffect(() => {
    setScreen('login');
  }, [setScreen]);

  // ====================
  // ÉTAT
  // ====================
  const [step, setStep] = useState<LoginStep>('numero');
  const [numero, setNumero] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code3543, setCode3543] = useState('');
  const [code2fa, setCode2fa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const [sessionId, setSessionId] = useState('');
  const [tfaToken, setTfaToken] = useState('');

  const [flashMsg, setFlashMsg] = useState('');
  const [flashType, setFlashType] = useState<'error' | 'attempt'>('error');

  const [iphoneState, setIphoneState] = useState<IphoneState | null>(null);

  const uqInputRef = useRef<HTMLInputElement>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ====================
  // TIMER MODE IPHONE
  // ====================
  useEffect(() => {
    if (step !== 'iphone' || !iphoneState) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, iphoneState.cooldownUntil - now);

      if (remaining === 0) {
        setIphoneState(null);
        setStep('numero');
        setNumero('');
        setPassword('');
        setError('');
        setAttemptCount(0);
      } else {
        setIphoneState({ ...iphoneState, remaining });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, iphoneState]);

  // ====================
  // FLASH TIMER — Disparition automatique après 2 secondes
  // ====================
  useEffect(() => {
    if (!flashMsg) return;

    console.log('🚀 Flash affiché:', flashMsg);

    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }

    flashTimerRef.current = setTimeout(() => {
      console.log('⏱️ Flash timer expiré, reset...');
      setFlashMsg('');
      setStep('numero');
      setNumero('');
      setPassword('');
      setCode3543('');
      setSessionId('');
      setTfaToken('');
      setError('');
      setTimeout(() => uqInputRef.current?.focus(), 100);
    }, 2000);

    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, [flashMsg]);

  // ====================
  // AFFICHER FLASH "Mauvaise donnée"
  // ====================
  const showErrorFlash = () => {
    setFlashMsg("Mauvaise donnée");
    setFlashType('error');
  };

  // ====================
  // AFFICHER FLASH "Tentative X/3"
  // ====================
  const showAttemptFlash = (nextAttempt: number) => {
    setFlashMsg(`Tentative ${nextAttempt}/3`);
    setFlashType('attempt');
  };

  // ====================
  // GÉRER RÉPONSE IPHONE MODE
  // ====================
  const handleIphoneResponse = (data: any, uq: string) => {
    setIphoneState({
      cooldownUntil: data.cooldown_until,
      remaining: data.cooldown_remaining,
      level: data.cooldown_level,
      attempts: data.attempts,
      uqNumber: uq,
    });
    setStep('iphone');
    setNumero('');
    setPassword('');
    setError('');
  };

  // ====================
  // ÉTAPE 1 : NUMÉRO UQ
  // ====================
  const handleNumeroSubmit = async () => {
    const validation = validateNumeroUQ(numero);
    if (!validation.valid) { setError(validation.error || 'Numéro invalide'); return; }

    setLoading(true); setError('');

    try {
      const resp = await apiClient.post(
        '/api/secure/step1',
        { uq_number: numero },
        { validateStatus: () => true },
      );
      const data = resp.data;

      if (resp.status === 429 && data.status === 'iphone_mode') {
        setLoading(false);
        handleIphoneResponse(data, numero);
        return;
      }

      if (resp.status < 200 || resp.status >= 300) {
        setLoading(false);
        showErrorFlash();
        return;
      }

      setSessionId(data.session_id);
      setTfaToken(data.tfa_token);
      setIsOwner(data.is_owner === true);
      if (data.is_owner === true) {
        localStorage.setItem('uq_is_owner', 'true');
      } else {
        localStorage.removeItem('uq_is_owner');
      }

      setLoading(false);
      setStep('password');
    } catch (err) {
      setLoading(false);
      showErrorFlash();
    }
  };

  // ====================
  // ÉTAPE 2 : MOT DE PASSE
  // ====================
  const handlePasswordSubmit = async () => {
    const validation = validatePassword(password);
    if (!validation.valid) { setError(validation.error || 'Mot de passe invalide'); return; }

    setLoading(true); setError('');

    try {
      const resp = await apiClient.post(
        '/api/secure/step2',
        {
          session_id: sessionId,
          tfa_token: tfaToken,
          password,
        },
        { validateStatus: () => true },
      );
      const data = resp.data;

      if (resp.status === 429 && data.status === 'iphone_mode') {
        setLoading(false);
        handleIphoneResponse(data, numero);
        return;
      }

      if (resp.status < 200 || resp.status >= 300) {
        setLoading(false);
        showErrorFlash();
        return;
      }

      // ===== OWNER : Compter les tentatives =====
      if (data.status === 'attempt_required') {
        const nextAttempt = data.next_attempt;
        setAttemptCount(data.attempts_ok);
        setLoading(false);
        showAttemptFlash(nextAttempt);
        return;
      }

      // ===== OWNER tentative 3/3 → code 3543 =====
      if (data.status === 'step_required' && data.step === 3 && data.is_owner) {
        setTfaToken(data.tfa_token);
        setAttemptCount(3);
        setLoading(false);
        setStep('code3543');
        return;
      }

      // ===== USER → 2FA =====
      if (data.status === 'step_required' && !data.is_owner) {
        const visualCode = Math.floor(100000 + Math.random() * 900000).toString();
        setCode2fa(visualCode);
        setTfaToken(data.tfa_token);
        setLoading(false);
        setStep('code2fa');
        return;
      }

      setLoading(false);
      showErrorFlash();
    } catch (err) {
      setLoading(false);
      showErrorFlash();
    }
  };

  // ====================
  // ÉTAPE 3 : CODE 3543 (OWNER)
  // ====================
  const handle3543Submit = async () => {
    if (code3543.length < 4 || code3543.length > 6 || !/^\d+$/.test(code3543)) {
      setError('Le code doit avoir 4 à 6 chiffres'); return;
    }

    setLoading(true); setError('');

    try {
      const resp = await apiClient.post(
        '/api/secure/step-login-pin',
        {
          session_id: sessionId,
          tfa_token: tfaToken,
          login_pin: code3543,
        },
        { validateStatus: () => true },
      );
      const data = resp.data;

      if (resp.status === 429 && data.status === 'iphone_mode') {
        setLoading(false);
        handleIphoneResponse(data, numero);
        return;
      }

      if (resp.status < 200 || resp.status >= 300) {
        setLoading(false);
        showErrorFlash();
        return;
      }

      setTfaToken(data.tfa_token);
      const visualCode = Math.floor(100000 + Math.random() * 900000).toString();
      setCode2fa(visualCode);
      setLoading(false);
      setStep('code2fa');
    } catch (err) {
      setLoading(false);
      showErrorFlash();
    }
  };

  // ====================
  // ÉTAPE 4 : 2FA
  // ====================
  const handle2FASubmit = () => {
    setStep('biometrie');
  };

  // ====================
  // ÉTAPE 5 : BIOMÉTRIE → CONNEXION
  // ====================
  const handleBiometrie = async () => {
    setLoading(true); setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const endpoint = isOwner ? '/api/secure/finalize-owner' : '/api/secure/finalize-user';

      const resp = await apiClient.post(
        endpoint,
        {
          session_id: sessionId,
          tfa_token: tfaToken,
        },
        { validateStatus: () => true },
      );
      const data = resp.data;

      if (resp.status < 200 || resp.status >= 300 || data.status !== 'success') {
        setLoading(false);
        showErrorFlash();
        return;
      }

      localStorage.setItem('uq_token', data.token);
      localStorage.setItem('uq_number', data.uq_number);
      if (data.uq_email) localStorage.setItem('uq_email', data.uq_email);
      if (data.uq_pseudo) localStorage.setItem('uq_pseudo', data.uq_pseudo);
      if (data.display_name) localStorage.setItem('uq_name', data.display_name);
      if (data.account) localStorage.setItem('uq_account', JSON.stringify(data.account));

      onLoginSuccess(data.token);
    } catch (err) {
      setLoading(false);
      showErrorFlash();
    }
  };

  // ====================
  // FORMAT TIMER
  // ====================
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ====================
  // RENDER
  // ====================
  return (
    <div
      className="uq-spatial-background min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden text-[var(--uq-text-primary)]"
      style={{
        background: `
          radial-gradient(ellipse at top left, rgba(91, 168, 232, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(230, 57, 70, 0.15) 0%, transparent 50%),
          var(--uq-bg-primary)
        `,
      }}
    >
      {/* Glow bleu + rouge */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91, 168, 232, 0.4) 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(230, 57, 70, 0.4) 0%, transparent 70%)', transform: 'translate(50%, 50%)' }} />

      {/* FLASH MESSAGE */}
      {flashMsg && (
        <div className={flashType === 'error' ? 'flash-error' : 'attempt-message'}>
          {flashMsg}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODE IPHONE                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'iphone' && iphoneState && (
        <div className="iphone-mode-overlay">
          <div className="iphone-lock-icon"><Icon name="lock" size={20} tone="muted" /></div>
          <div className="iphone-title">Compte temporairement bloqué</div>
          <div className="iphone-subtitle">Réessayez dans</div>
          <div className="iphone-timer">{formatTime(iphoneState.remaining)}</div>
          <div className="iphone-progress-bar">
            <div className="iphone-progress-fill" style={{ width: `${(iphoneState.remaining / 60) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ÉCRAN 1 : NUMÉRO UQ                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'numero' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 fade-in relative z-10">
          <LogoUQ variant="login" animated />
          <p className="text-uq-text text-2xl font-semibold mt-8 mb-12 text-center">
            Heureux de te revoir !
          </p>
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-uq-gradient bg-clip-text text-transparent uppercase">
              <IconMedal size={16} color="#7B5EA7" />
              <span>Numéro UQ</span>
            </label>
            <input ref={uqInputRef} type="text" value={numero}
              onChange={(e) => setNumero(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleNumeroSubmit()}
              placeholder="UQ-XXXXXXXX"
              className="input-lueur w-full bg-uq-card-light border border-uq-border rounded-ios px-5 py-4 text-uq-text text-center text-lg placeholder-uq-text-muted focus:outline-none focus:border-uq-blue-light transition-colors"
              autoFocus />
            {error && <p className="text-uq-error text-sm mt-3 text-center">{error}</p>}
            {numero.length >= 5 && (
              <button onClick={handleNumeroSubmit} disabled={loading}
                className="w-full mt-6 py-4 rounded-pill bg-uq-gradient text-white font-semibold text-lg active:scale-95 transition-transform disabled:opacity-50">
                {loading ? 'Vérification...' : 'Continuer'}
              </button>
            )}
          </div>

          {/* Menu ⋮ */}
          <div className="mt-12 relative flex flex-col items-center">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                ${menuOpen ? 'bg-uq-blue-light/20 text-uq-blue-light rotate-90' : 'text-uq-text-secondary hover:bg-uq-card-light'}`}
              aria-label="Menu">
              <IconMoreVertical size={20} />
            </button>
            {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
            {menuOpen && (
              <div className="absolute bottom-full mb-3 z-50 bg-uq-card/95 backdrop-blur-xl rounded-ios-xl border border-uq-border shadow-2xl shadow-black/60 overflow-hidden fade-in"
                style={{ minWidth: '240px' }}>

                {/* UQ AI */}
                <button onClick={() => { setMenuOpen(false); alert("🧠 UQ AI — Bientôt disponible"); }}
                  className="input-lueur w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-uq-card-light transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #E63946, #B5378C, #7B5EA7)' }}>
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <span className="text-sm font-semibold bg-uq-gradient bg-clip-text text-transparent">
                    <Icon name="bot" size={16} tone="info" /> UQ AI — Besoin d'aide ?
                  </span>
                </button>

                <div className="h-px bg-uq-border mx-3" />

                {/* Aide */}
                <button onClick={() => { setMenuOpen(false); alert("❓ Aide — FAQ"); }}
                  className="input-lueur w-full flex items-center gap-3 px-4 py-3.5 text-uq-text text-left hover:bg-uq-card-light transition-colors">
                  <div className="w-8 h-8 rounded-full bg-uq-blue/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 text-sm font-bold">?</span>
                  </div>
                  <span className="text-sm font-medium">Aide</span>
                </button>

                <div className="h-px bg-uq-border mx-3" />

                {/* Politique */}
                <button onClick={() => { setMenuOpen(false); alert("📄 Politique de confidentialité"); }}
                  className="input-lueur w-full flex items-center gap-3 px-4 py-3.5 text-uq-text text-left hover:bg-uq-card-light transition-colors">
                  <div className="w-8 h-8 rounded-full bg-uq-purple/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 text-sm font-bold">P</span>
                  </div>
                  <span className="text-sm font-medium">Politique de confidentialité</span>
                </button>

                <div className="h-px bg-uq-border mx-3" />

                {/* Créer compte */}
                <button onClick={() => { setMenuOpen(false); onCreateAccount?.(); }}
                  className="input-lueur w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-uq-card-light transition-colors">
                  <div className="w-8 h-8 rounded-full bg-uq-gradient flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">+</span>
                  </div>
                  <span className="text-sm font-semibold bg-uq-gradient bg-clip-text text-transparent">
                    Créer un compte
                  </span>
                </button>

                <div className="h-1 bg-uq-gradient opacity-50" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ÉCRAN 2 : MOT DE PASSE                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'password' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 fade-in relative z-10">
          <LogoUQ variant="login" animated />
          <div className="w-full max-w-sm bg-uq-card rounded-ios-xl p-6 border border-uq-border mt-8">
            <h2 className="flex items-center justify-center gap-2 text-uq-text text-xl font-bold mb-6">
              <IconUnlock size={22} color="#4A9EFF" />
              <span>VÉRIFICATION</span>
            </h2>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-uq-text-secondary text-xs mb-2">
                <IconIdCard size={14} color="#8E8E9A" />
                <span>NUMÉRO UQ</span>
              </label>
              <div className="input-lueur w-full bg-uq-card-light border border-uq-success rounded-ios px-4 py-3 text-uq-text text-center">
                {numero} ✓
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-uq-text-secondary text-sm mb-2">
                  <IconMail size={14} color="#8E8E9A" />
                  <span>EMAIL UQ</span>
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tonpseudo@zando.uq"
                  className="input-lueur w-full bg-uq-card-light border border-uq-border rounded-ios px-4 py-3 text-uq-text placeholder-uq-text-muted focus:outline-none focus:border-uq-blue-light" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-uq-text-secondary text-sm mb-2">
                  <IconKey size={14} color="#8E8E9A" />
                  <span>MOT DE PASSE</span>
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="8+ caracteres"
                  className="input-lueur w-full bg-uq-card-light border border-uq-border rounded-ios px-4 py-3 text-uq-text placeholder-uq-text-muted focus:outline-none focus:border-uq-blue-light"
                  autoFocus />
              </div>
              {error && <p className="text-uq-error text-sm text-center">{error}</p>}
              <button onClick={handlePasswordSubmit} disabled={loading}
                className="w-full py-4 rounded-pill bg-uq-gradient text-white font-semibold active:scale-95 transition-transform disabled:opacity-50">
                {loading ? 'Vérification...' : 'VALIDER'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ÉCRAN 3 : CODE 3543                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'code3543' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 fade-in relative z-10">
          <LogoUQ variant="login" animated />
          <div className="w-full max-w-sm mt-8">
            <div className="mb-4">
              <div className="input-lueur w-full bg-uq-card-light border border-uq-success rounded-ios px-4 py-3 text-uq-text text-center mb-2">
                {numero} ✓
              </div>
              <div className="input-lueur w-full bg-uq-card-light border border-uq-success rounded-ios px-4 py-3 text-uq-text text-center">
                Mot de passe <Icon name="check" size={14} tone="success" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-uq-text-secondary mb-4">
              <IconUnlock size={18} color="#4A9EFF" />
              <span>Code de déblocage</span>
            </div>
            <label className="flex items-center justify-center gap-2 text-uq-blue-light text-sm mb-4 font-bold">
              <IconKeypad size={16} color="#4A9EFF" />
              <span>CODE À 4 CHIFFRES</span>
            </label>
            <div className="flex gap-3 justify-center mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-14 h-16 rounded-ios flex items-center justify-center text-2xl font-bold transition-all
                  ${code3543.length > i ? 'bg-uq-card border-2 border-uq-blue-light text-uq-blue-light' : 'bg-uq-card-light border-2 border-uq-border text-uq-text-muted'}`}>
                  {code3543.length > i ? '●' : '—'}
                </div>
              ))}
            </div>
            <input type="tel" inputMode="numeric" maxLength={6} value={code3543}
              onChange={(e) => setCode3543(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && code3543.length >= 4 && handle3543Submit()}
              className="input-lueur w-full bg-uq-card-light border border-uq-border rounded-ios px-4 py-4 text-uq-text text-center text-2xl tracking-widest placeholder-uq-text-muted focus:outline-none focus:border-uq-blue-light"
              placeholder="• • • •" autoFocus />
            {error && <p className="text-uq-error text-sm mt-3 text-center">{error}</p>}
            <button onClick={handle3543Submit} disabled={loading || code3543.length < 4}
              className="w-full mt-6 py-4 rounded-pill bg-uq-gradient text-white font-semibold active:scale-95 transition-transform disabled:opacity-50">
              {loading ? 'Vérification...' : 'VALIDER'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ÉCRAN 4 : 2FA                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'code2fa' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 fade-in relative z-10">
          <LogoUQ variant="login" />
          <div className="w-full max-w-sm mt-8">
            <div className="input-lueur w-full bg-uq-card-light border border-uq-success rounded-ios px-4 py-3 text-uq-text text-center mb-6">
              {numero} ✓
            </div>
            <div className="flex items-center justify-center gap-2 text-uq-text-secondary mb-4">
              <IconSparkle size={18} color="#7B5EA7" />
              <span>Code 2FA généré</span>
            </div>
            <div className="w-full bg-uq-card rounded-ios px-4 py-6 text-center mb-6 border-2 border-uq-blue-light">
              <p className="flex items-center justify-center gap-2 text-uq-blue-light text-3xl font-bold tracking-widest">
                <IconSparkle size={20} color="#4A9EFF" />
                <span>{code2fa.split('').join(' ')}</span>
                <IconSparkle size={20} color="#4A9EFF" />
              </p>
            </div>
            <button onClick={handle2FASubmit}
              className="w-full py-4 rounded-pill bg-uq-gradient text-white font-semibold active:scale-95 transition-transform">
              VÉRIFIER
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ÉCRAN 5 : BIOMÉTRIE                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'biometrie' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 fade-in relative z-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <IconDNA size={28} color="#4A9EFF" />
            <h2 className="text-uq-text text-2xl font-bold text-center">Confirmation biométrique</h2>
          </div>
          <p className="text-uq-text-secondary text-center mb-10 max-w-sm">
            L'IA vérifie automatiquement
          </p>
          <button onClick={handleBiometrie} disabled={loading}
            className="w-40 h-40 rounded-full bg-uq-card border-2 border-uq-blue-light animate-poumon-bleu relative flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 mb-6">
            <IconFingerprint size={80} color="#4A9EFF" />
          </button>
          <p className="text-uq-text font-semibold mb-2">SCANNEZ VOTRE EMPREINTE</p>
          <div className="flex items-center gap-4 my-6 w-full max-w-xs">
            <div className="h-px bg-uq-border flex-1" />
            <span className="text-uq-text-muted text-sm">OU</span>
            <div className="h-px bg-uq-border flex-1" />
          </div>
          <button onClick={handleBiometrie} disabled={loading}
            className="w-40 h-40 rounded-full bg-uq-card border-2 border-uq-purple animate-poumon-bleu relative flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50">
            <IconEye size={80} color="#B5378C" />
          </button>
          <p className="text-uq-text font-semibold mt-4">SCANNEZ VOTRE VISAGE</p>
          {loading && <p className="text-uq-blue-light mt-6 animate-pulse">Vérification en cours...</p>}
        </div>
      )}
    </div>
  );
}
