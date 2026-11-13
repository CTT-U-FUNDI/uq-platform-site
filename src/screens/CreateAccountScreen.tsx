import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { LogoUQ } from '../components/ui/LogoUQ';
import { Icon } from '../components/ui/Icon';
import {
  IconMedal, IconIdCard, IconKeypad, IconMail, IconKey,
  IconSparkle, IconEye, IconFingerprint, IconMoreVertical
} from '../components/ui/Icons';
import {
  IconUser, IconLock, IconCopy, IconCheck, IconClose
} from '../components/ui/UQIcons';
import { FixoAssistant } from '../components/ui/FixoAssistant';
import { useScreen } from '../context/ScreenContext';
import {
  validatePrenom, validateNom, validateDateNaissance,
  validateCountry, validatePhone, validatePassword
} from '../utils/validators';

interface CreateAccountScreenProps {
  onBack: () => void;
  onSuccess: (accountInfo: any) => void;
}

type Step =
  | 'welcome' | 'prenom' | 'nom' | 'date' | 'lieu' | 'pays'
  | 'adresse' | 'phone' | 'sms' | 'password'
  | 'sexe' | 'statut_marital' | 'ville_provenance' | 'ville_actuelle'
  | 'promo' | 'creating' | 'recap' | 'success';

const PAYS_LIST = [
  { code: 'CD', flag: '🇨🇩', nom: 'Congo-Kinshasa', indicatif: '+243' },
  { code: 'CG', flag: '🇨🇬', nom: 'Congo-Brazzaville', indicatif: '+242' },
  { code: 'RW', flag: '🇷🇼', nom: 'Rwanda', indicatif: '+250' },
  { code: 'BI', flag: '🇧🇮', nom: 'Burundi', indicatif: '+257' },
  { code: 'UG', flag: '🇺🇬', nom: 'Ouganda', indicatif: '+256' },
  { code: 'KE', flag: '🇰🇪', nom: 'Kenya', indicatif: '+254' },
  { code: 'TZ', flag: '🇹🇿', nom: 'Tanzanie', indicatif: '+255' },
  { code: 'ZA', flag: '🇿🇦', nom: 'Afrique du Sud', indicatif: '+27' },
  { code: 'FR', flag: '🇫🇷', nom: 'France', indicatif: '+33' },
  { code: 'BE', flag: '🇧🇪', nom: 'Belgique', indicatif: '+32' },
];

export function CreateAccountScreen({ onBack, onSuccess }: CreateAccountScreenProps) {
  const { setScreen } = useScreen();

  const [step, setStep] = useState<Step>('welcome');

  // Form data
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [pays, setPays] = useState('CD');
  const [lieuNaissance, setLieuNaissance] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  // ===== PROFIL COMPLET (12 Oct 2026) =====
  const [sexe, setSexe] = useState('');
  const [statutMarital, setStatutMarital] = useState('');
  const [villeProvenance, setVilleProvenance] = useState('');
  const [villeActuelle, setVilleActuelle] = useState('');

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUQAI, setShowUQAI] = useState(false);
  const [uqaiTopic, setUqaiTopic] = useState<string | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setScreen('creation');
  }, [setScreen]);

  // ====================
  // NAVIGATION
  // ====================

  const goBack = () => {
    const steps: Step[] = ['welcome', 'prenom', 'nom', 'date', 'lieu', 'pays', 'adresse', 'phone', 'sms', 'password', 'sexe', 'statut_marital', 'ville_provenance', 'ville_actuelle'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else onBack();
  };

  const next = (nextStep: Step) => {
    setError('');
    setStep(nextStep);
  };

  // ====================
  // VALIDATIONS
  // ====================

  const submitPrenom = () => {
    const v = validatePrenom(prenom);
    if (!v.valid) { setError(v.error || 'Prenom invalide'); return; }
    next('nom');
  };

  const submitNom = () => {
    const v = validateNom(nom);
    if (!v.valid) { setError(v.error || 'Nom invalide'); return; }
    setNom(nom.toUpperCase());
    next('date');
  };

  const submitDate = () => {
    const v = validateDateNaissance(dateNaissance);
    if (!v.valid) { setError(v.error || 'Date invalide'); return; }
    next('lieu');
  };

  const submitLieu = () => {
    if (lieuNaissance.trim().length < 3) {
      setError('Lieu de naissance trop court (min 3 caracteres)');
      return;
    }
    next('pays');
  };

  const submitPays = () => next('adresse');

  const submitAdresse = () => {
    if (adresse.trim().length < 5) { setError('Adresse trop courte (min 5 caracteres)'); return; }
    next('phone');
  };

  const submitPhone = () => {
    const v = validatePhone(telephone);
    if (!v.valid) { setError(v.error || 'Telephone invalide'); return; }
    // Simuler envoi SMS
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      next('sms');
    }, 1000);
  };

  const submitSms = () => {
    if (smsCode !== '123456') {
      setError('Code incorrect. Utilise 123456 pour tester.');
      return;
    }
    next('password');
  };

  const submitPassword = () => {
    const v = validatePassword(password);
    if (!v.valid) { setError(v.error || 'Mot de passe invalide'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    submitPromo();
  };

  const submitPromo = async () => {
    // Generer un code promo automatique base sur le prenom si vide
    let finalPromo = promoCode.trim().toUpperCase();
    if (!finalPromo) {
      const random4 = Math.floor(1000 + Math.random() * 9000);
      finalPromo = `UQ-${prenom.toUpperCase()}-${random4}`;
    }

    setStep('creating');
    setLoading(true);

    // Animer la progress bar
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 200);

    try {
      const resp = await apiFetch('/api/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom,
          nom,
          date_naissance: dateNaissance,
          lieu_naissance: lieuNaissance,
          pays,
          adresse,
          telephone,
          password,
          // PROFIL COMPLET
          sexe,
          statut_marital: statutMarital,
          ville_provenance: villeProvenance,
          ville_actuelle: villeActuelle,
          // Code promo du parrain : uniquement s'il a été saisi par l'utilisateur
          // (le code généré automatiquement n'est PAS un code de parrainage)
          ...(promoCode.trim() ? { code_promo_parrain: promoCode.trim().toUpperCase() } : {}),
        }),
      });

      const data = await resp.json();

      setTimeout(() => {
        setLoading(false);
        if (data.status === 'success') {
          setResult({ ...data });  // code_promo vient du backend
          setStep('recap');
        } else {
          setError(data.message || 'Erreur lors de la creation');
          setStep('promo');
        }
      }, 2500);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erreur reseau');
      setStep('promo');
    }
  };

  const copyAll = () => {
    if (!result) return;
    const text = `Numero UQ : ${result.uq_number}\nEmail UQ : ${result.email}\nPseudo : ${result.pseudo}\nMot de passe : ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToLogin = () => {
    // Sauvegarder les infos pour pre-remplir le login
    sessionStorage.setItem('uq_pending_login', JSON.stringify({
      uq_number: result?.uq_number || '',
      email: result?.email || '',
      pseudo: result?.pseudo || '',
    }));
    onSuccess(result);
  };

  // ====================
  // RENDU
  // ====================

  const stepNumber = (() => {
    const order: Step[] = ['welcome', 'prenom', 'nom', 'date', 'pays', 'adresse', 'phone', 'sms', 'password', 'sexe', 'statut_marital', 'ville_provenance', 'ville_actuelle'];
    const idx = order.indexOf(step);
    return idx >= 0 ? idx + 1 : 0;
  })();

  return (
    <div className="uq-spatial-background min-h-screen flex flex-col relative overflow-hidden text-[var(--uq-text-primary)]">

      {/* Glow bleu */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91, 168, 232, 0.4) 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
      {/* Glow rouge */}
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(230, 57, 70, 0.4) 0%, transparent 70%)', transform: 'translate(50%, 50%)' }} />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER                                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {step !== 'welcome' && step !== 'creating' && step !== 'success' && (
        <header className="relative z-10 flex items-center justify-between px-4 py-4">
          <button onClick={goBack} className="w-10 h-10 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center text-[#EAECEF] active:scale-90 transition-all">
            <Icon name="arrowLeft" size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#8E8E9A] uppercase tracking-wider">CREER UN COMPTE</span>
            {stepNumber > 0 && (
              <span className="text-[10px] text-[#5A5A6A]">Etape {stepNumber}/14</span>
            )}
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center text-[#EAECEF] active:scale-90 transition-all">
            <IconMoreVertical size={18} />
          </button>
        </header>
      )}

      {/* Progress bar */}
      {step !== 'welcome' && step !== 'creating' && step !== 'success' && stepNumber > 0 && (
        <div className="relative z-10 px-4 pb-2">
          <div className="w-full h-1 bg-[#1A1A24] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] transition-all duration-300"
              style={{ width: `${(stepNumber / 14) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Menu ⋮ */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 right-4 z-50 w-64 bg-[#1A1A24]/95 backdrop-blur-xl rounded-2xl border border-[#2A2A38] shadow-2xl overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); setUqaiTopic(undefined); setShowUQAI(true); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#252533]"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E63946, #B5378C, #7B5EA7)' }}>
                <span className="text-sm"><Icon name="bot" size={16} tone="info" /></span>
              </div>
              <span className="text-sm font-semibold text-[#EAECEF]"><Icon name="bot" size={16} tone="info" /> UQ AI — Besoin d'aide ?</span>
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CONTENU                                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">

        {/* ECRAN 1 : BIENVENUE */}
        {step === 'welcome' && (
          <div className="w-full max-w-sm text-center">
            <LogoUQ variant="login" animated />
            <h1 className="text-[#EAECEF] text-3xl font-bold mt-8 mb-3">Bienvenue dans la famille UQ</h1>
            <p className="text-[#8E8E9A] mb-8">L'argent circule là où tu vis.</p>
            <button onClick={() => next('prenom')} className="w-full py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold text-lg active:scale-95 transition-transform">
              CREER UN COMPTE
            </button>
            <button onClick={onBack} className="w-full mt-3 py-3 rounded-full border border-[#2A2A38] text-[#8E8E9A] font-medium">
              J'ai deja un compte
            </button>
          </div>
        )}

        {/* ECRAN 2 : PRENOM */}
        {step === 'prenom' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconMedal size={16} color="#7B5EA7" />
              <span>Comment doit-on t'appeler ?</span>
            </label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitPrenom()}
              placeholder="Jean"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-lg focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {prenom.length >= 2 && (
              <button onClick={submitPrenom} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}

        {/* ECRAN 3 : NOM */}
        {step === 'nom' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconIdCard size={16} color="#7B5EA7" />
              <span>Quel est ton nom de famille ?</span>
            </label>
            <div className="bg-[#1A1A24] border border-[#FCD535]/40 rounded-xl p-3 mb-3">
              <p className="text-[#FCD535] text-xs"><Icon name="alert" size={14} tone="warning" /> Ecris ton nom EXACTEMENT comme sur ta piece d'identite (carte, passeport).</p>
              <p className="text-[#8E8E9A] text-[10px] mt-1">Ce nom sera verifie plus tard dans ton profil.</p>
            </div>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && submitNom()}
              placeholder="MUTOMBO"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-lg uppercase focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {nom.length >= 2 && (
              <button onClick={submitNom} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}

        {/* ECRAN 4 : DATE */}
        {step === 'date' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconIdCard size={16} color="#7B5EA7" />
              <span>Quel est ton jour de fete ?</span>
            </label>
            <input
              type="date"
              value={dateNaissance}
              onChange={(e) => setDateNaissance(e.target.value)}
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-lg focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            <p className="text-[#8E8E9A] text-xs mt-2 text-center">Tu dois avoir au moins 13 ans.</p>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {dateNaissance && (
              <button onClick={submitDate} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}
        {/* ECRAN 4.5 : LIEU DE NAISSANCE */}
        {step === 'lieu' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconIdCard size={16} color="#7B5EA7" />
              <span>Ou es-tu ne ?</span>
            </label>
            <input
              type="text"
              value={lieuNaissance}
              onChange={(e) => setLieuNaissance(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitLieu()}
              placeholder="Kalemie, RDC"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-lg focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            <p className="text-[#8E8E9A] text-xs mt-2 text-center">
              Comme sur ta carte d'identite ou ton passeport.
            </p>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {lieuNaissance.length >= 3 && (
              <button onClick={submitLieu} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}

        {/* ECRAN 5 : PAYS */}
        {step === 'pays' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconMedal size={16} color="#7B5EA7" />
              <span>D'ou viens-tu ?</span>
            </label>
            <select
              value={pays}
              onChange={(e) => setPays(e.target.value)}
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-lg focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            >
              {PAYS_LIST.map(p => (
                <option key={p.code} value={p.code}>{p.flag} {p.nom} ({p.indicatif})</option>
              ))}
            </select>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            <button onClick={submitPays} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
              CONTINUER
            </button>
          </div>
        )}

        {/* ECRAN 6 : ADRESSE */}
        {step === 'adresse' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconMedal size={16} color="#7B5EA7" />
              <span>Ou habites-tu ?</span>
            </label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAdresse()}
              placeholder="12 Avenue Kasa-Vubu, Kalemie"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {adresse.length >= 5 && (
              <button onClick={submitAdresse} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}

        {/* ECRAN 7 : TELEPHONE */}
        {step === 'phone' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconMedal size={16} color="#7B5EA7" />
              <span>Sur quel numero peut-on te joindre ?</span>
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitPhone()}
              placeholder="+243812345678"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-lg focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            <p className="text-[#8E8E9A] text-xs mt-2 text-center">Format international : +XXX XXXXXXXXX</p>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {telephone.length >= 10 && (
              <button onClick={submitPhone} disabled={loading} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95 disabled:opacity-50">
                {loading ? 'Envoi SMS...' : 'VERIFIER TELEPHONE'}
              </button>
            )}
          </div>
        )}

        {/* ECRAN 8 : SMS */}
        {step === 'sms' && (
          <div className="w-full max-w-sm text-center">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconKeypad size={16} color="#7B5EA7" />
              <span>Code recu par SMS</span>
            </label>
            <p className="text-[#8E8E9A] text-sm mb-6">Un code a 6 chiffres a ete envoye au {telephone}</p>
            <input
              type="tel"
              maxLength={6}
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && smsCode.length === 6 && submitSms()}
              placeholder="• • • • • •"
              className="w-full bg-[#1A1A24] border-2 border-[#4A9EFF] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-3xl tracking-widest focus:outline-none"
              autoFocus
            />
            <p className="text-[#FCD535] text-xs mt-3"><Icon name="lightbulb" size={14} tone="warning" /> Pour tester, utilise : 123456</p>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {smsCode.length === 6 && (
              <button onClick={submitSms} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                VERIFIER
              </button>
            )}
          </div>
        )}

        {/* ECRAN 9 : MOT DE PASSE */}
        {step === 'password' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconLock size={16} color="#7B5EA7" />
              <span>Choisis ton mot de passe</span>
            </label>
            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ caracteres"
                className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 pr-12 text-[#EAECEF] focus:outline-none focus:border-[#4A9EFF]"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E9A]">
                <IconEye size={18} />
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] focus:outline-none focus:border-[#4A9EFF]"
            />
            <p className="text-[#8E8E9A] text-xs mt-2">Min 8 car, 1 majuscule, 1 minuscule, 1 chiffre</p>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            {password && confirmPassword && (
              <button onClick={submitPassword} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}

                {/* ═══ ECRAN : SEXE ═══ */}
        {step === 'sexe' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconUser size={16} color="#7B5EA7" />
              <span>Quel est ton sexe ?</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[{v:'M',l:'♂️ Homme'},{v:'F',l:'♀️ Femme'},{v:'A',l:'⚧ Autre'}].map(({v,l}) => (
                <button key={v}
                  onClick={() => { setSexe(v); next('statut_marital'); }}
                  className={`py-4 rounded-2xl font-bold text-sm transition ${sexe === v ? 'bg-gradient-to-r from-[#E63946] to-[#2E86DE] text-white' : 'bg-[#1A1A24] border border-[#2A2A38] text-[#EAECEF]'}`}
                >{l}</button>
              ))}
            </div>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* ═══ ECRAN : STATUT MARITAL ═══ */}
        {step === 'statut_marital' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconUser size={16} color="#7B5EA7" />
              <span>Situation familiale ?</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[{v:'celibataire',l:'💍 Célibataire'},{v:'marie',l:'💒 Marié(e)'},{v:'divorce',l:'💔 Divorcé(e)'},{v:'veuf',l:'🕊️ Veuf(ve)'}].map(({v,l}) => (
                <button key={v}
                  onClick={() => { setStatutMarital(v); next('ville_provenance'); }}
                  className={`py-4 rounded-2xl font-bold text-xs transition ${statutMarital === v ? 'bg-gradient-to-r from-[#E63946] to-[#2E86DE] text-white' : 'bg-[#1A1A24] border border-[#2A2A38] text-[#EAECEF]'}`}
                >{l}</button>
              ))}
            </div>
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* ═══ ECRAN : VILLE PROVENANCE ═══ */}
        {step === 'ville_provenance' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconMedal size={16} color="#7B5EA7" />
              <span>D'ou viens-tu ?</span>
            </label>
            <input
              type="text"
              value={villeProvenance}
              onChange={(e) => setVilleProvenance(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && villeProvenance.length >= 2 && next('ville_actuelle')}
              placeholder="Kinshasa"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-lg focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            <p className="text-[#8E8E9A] text-xs mt-2 text-center">Ta ville d'origine.</p>
            {villeProvenance.length >= 2 && (
              <button onClick={() => next('ville_actuelle')} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}

        {/* ═══ ECRAN : VILLE ACTUELLE ═══ */}
        {step === 'ville_actuelle' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconMedal size={16} color="#7B5EA7" />
              <span>Ou vis-tu actuellement ?</span>
            </label>
            <input
              type="text"
              value={villeActuelle}
              onChange={(e) => setVilleActuelle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && villeActuelle.length >= 2 && next('promo')}
              placeholder="Lubumbashi"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAECEF] text-center text-lg focus:outline-none focus:border-[#4A9EFF]"
              autoFocus
            />
            <p className="text-[#8E8E9A] text-xs mt-2 text-center">Ta ville actuelle.</p>
            {villeActuelle.length >= 2 && (
              <button onClick={() => next('promo')} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-semibold active:scale-95">
                CONTINUER
              </button>
            )}
          </div>
        )}

        {/* ECRAN 10 : CODE PROMO */}
        {step === 'promo' && (
          <div className="w-full max-w-sm">
            <label className="flex items-center justify-center gap-2 mb-3 text-sm font-bold tracking-wider bg-gradient-to-r from-[#E63946] to-[#2E86DE] bg-clip-text text-transparent uppercase">
              <IconSparkle size={16} color="#7B5EA7" />
              <span>Ton code promo UQ</span>
            </label>
            <div className="bg-[#1A1A24] border border-[#FCD535]/40 rounded-2xl p-5 mb-4 text-center">
              <p className="text-[#FCD535] text-xs mb-2"><Icon name="gift" size={14} tone="brand" /> UQ va te generer un code promo unique :</p>
              <p className="text-[#EAECEF] text-xl font-mono font-bold">UQ-{prenom.toUpperCase()}-XXXX</p>
              <p className="text-[#8E8E9A] text-[10px] mt-2">Partage-le avec tes amis. Tu gagnes 1 BORB par inscription.</p>
            </div>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="(optionnel) Code d'un ami"
              className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-2xl px-5 py-4 text-[#EAEF] text-center focus:outline-none focus:border-[#4A9EFF]"
            />
            {error && <p className="text-[#F6465D] text-sm mt-3 text-center">{error}</p>}
            <button onClick={submitPromo} className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold text-lg active:scale-95">
              CREER MON COMPTE UQ
            </button>
            <button onClick={submitPromo} className="w-full mt-3 py-2 text-[#8E8E9A] text-sm">
              Passer cette etape
            </button>
          </div>
        )}

        {/* ECRAN 11 : CREATION EN COURS */}
        {step === 'creating' && (
          <div className="w-full max-w-sm text-center">
            <LogoUQ variant="login" animated />
            <p className="text-[#EAECEF] text-xl font-semibold mt-8 mb-6">On prepare ta place au chaud...</p>
            <div className="space-y-3 text-left mb-6">
              {[
                'Prenom et nom enregistres',
                'Date de naissance verifiee',
                'Pays et adresse enregistres',
                'Telephone verifie',
                'Generation de ton UqBlackKey...',
                'Attribution de ton numero UQ...',
                'Creation de ton email UQ...',
              ].map((txt, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={progress > (i * 14) ? 'text-[#0ECB81]' : 'text-[#5A5A6A]'}>
                    {progress > (i * 14) ? <Icon name="checkCircle" size={16} tone="success" /> : <Icon name="hourglass" size={16} tone="muted" />}
                  </span>
                  <span className={progress > (i * 14) ? 'text-[#EAECEF]' : 'text-[#5A5A6A]'}>{txt}</span>
                </div>
              ))}
            </div>
            <div className="w-full h-2 bg-[#1A1A24] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] transition-all duration-300"
                style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[#8E8E9A] text-sm mt-3">{progress}%</p>
          </div>
        )}

        {/* ECRAN 12 : RECAPITULATIF */}
        {step === 'recap' && result && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3"><Icon name="sparkle" size={20} tone="info" /></div>
              <h2 className="text-[#EAECEF] text-2xl font-bold">Tu es chez toi !</h2>
            </div>

            <div className="bg-[#FCD535]/10 border border-[#FCD535]/30 rounded-2xl p-4 mb-4">
              <p className="text-[#FCD535] text-xs font-bold text-center">
                <Icon name="alert" size={14} tone="warning" /> NOTE BIEN CES INFORMATIONS — tu en auras besoin pour te connecter
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="bg-[#1A1A24] rounded-xl p-4">
                <p className="text-[#8E8E9A] text-xs mb-1"><Icon name="tag" size={14} tone="warning" /> NUMERO UQ</p>
                <p className="text-[#EAECEF] font-mono text-lg">{result.uq_number}</p>
              </div>
              <div className="bg-[#1A1A24] rounded-xl p-4">
                <p className="text-[#8E8E9A] text-xs mb-1"><Icon name="mail" size={14} tone="info" /> EMAIL UQ</p>
                <p className="text-[#EAECEF] font-mono">{result.email}</p>
              </div>
              <div className="bg-[#1A1A24] rounded-xl p-4">
                <p className="text-[#8E8E9A] text-xs mb-1"><Icon name="user" size={14} /> PSEUDO UQ</p>
                <p className="text-[#EAECEF] font-mono">{result.pseudo}</p>
              </div>
              <div className="bg-[#1A1A24] rounded-xl p-4">
                <p className="text-[#8E8E9A] text-xs mb-1"><Icon name="key" size={14} tone="warning" /> MOT DE PASSE</p>
                <p className="text-[#EAECEF] font-mono">{'•'.repeat(password.length)}</p>
                <p className="text-[#5A5A6A] text-[10px] mt-1">Celui que tu as choisi</p>
              </div>
              <div className="bg-[#B5378C]/10 border border-[#B5378C]/30 rounded-xl p-4">
                <p className="text-[#B5378C] text-xs mb-1"><Icon name="gift" size={14} tone="brand" /> TON CODE PROMO</p>
                <p className="text-[#EAECEF] font-mono">{result.code_promo}</p>
                <p className="text-[#8E8E9A] text-[10px] mt-1">Partage-le avec tes amis</p>
              </div>
            </div>

            <button onClick={copyAll} className="w-full py-3 rounded-full border-2 border-[#4A9EFF] text-[#4A9EFF] font-semibold flex items-center justify-center gap-2 active:scale-95">
              <IconCopy size={16} />
              {copied ? 'COPIE !' : 'COPIER TOUT'}
            </button>

            <button onClick={goToLogin} className="w-full mt-4 py-4 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold text-lg active:scale-95">
              ALLER A LA CONNEXION
            </button>

            <p className="text-[#8E8E9A] text-xs text-center mt-4">
              <Icon name="lightbulb" size={14} tone="warning" /> Le numero UQ sera pre-rempli pour toi
            </p>
          </div>
        )}

      </main>

      {/* FENETRE UQ AI */}
      {showUQAI && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowUQAI(false)}
        >
          <div className="w-full max-w-md">
            <FixoAssistant
              onClose={() => { setShowUQAI(false); setUqaiTopic(undefined); }}
              initialTopic={uqaiTopic}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default CreateAccountScreen;




