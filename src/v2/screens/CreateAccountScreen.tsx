import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { PinPad } from '../components/PinPad';
import { useSession } from '../lib/session';
import { LogoUQ } from '../../components/ui/LogoUQ';
import {
  confirmOtp,
  checkPhone,
  createAccount,
  describeError,
  humanBeginScene,
  humanVerify,
  requestOtp,
  setPin,
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  type CreateAccountPayload,
  type CreateAccountResponse,
  type PhoneCheckResponse,
} from '../lib/api';
import { HumanScenePuzzle } from '../components/HumanScenePuzzle';
import { Sheet } from '../components/Ui';

// ====================
// Parcours en six ecrans, dans l'ordre demande.
//   1 accueil — 2 etat civil — 3 naissance et metier — 4 mot de passe et PIN
//   5 telephone verifie et code promo — 6 l'identite UQ generee par le backend.
// Les regles de validation reproduisent domain/validation.rs : l'ecran ne dit
// jamais « ok » a un payload que le backend refuserait.
// ====================

type Step = 'welcome' | 'identity' | 'birth' | 'security' | 'phone' | 'summary';

const ORDRE: Step[] = ['identity', 'birth', 'security', 'phone', 'summary'];

/** Le backend n'accepte que des codes pays de 2-3 lettres (validation::validate_pays). */
const COUNTRIES: { code: string; name: string }[] = [
  { code: 'CD', name: 'RD Congo' },
  { code: 'CG', name: 'Congo-Brazzaville' },
  { code: 'CI', name: 'Côte d’Ivoire' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'TG', name: 'Togo' },
  { code: 'GA', name: 'Gabon' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'BI', name: 'Burundi' },
  { code: 'UG', name: 'Ouganda' },
  { code: 'TZ', name: 'Tanzanie' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'Afrique du Sud' },
  { code: 'AO', name: 'Angola' },
  { code: 'ZM', name: 'Zambie' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'NE', name: 'Niger' },
  { code: 'TD', name: 'Tchad' },
  { code: 'GN', name: 'Guinée' },
  { code: 'MA', name: 'Maroc' },
  { code: 'BE', name: 'Belgique' },
  { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'États-Unis' },
  { code: 'HT', name: 'Haïti' },
];

const NOM_RE = /^[\p{L}][\p{L}\s'.-]*$/u;

/** Meme regle que validate_prenom / validate_nom cote Rust. */
function validerNom(value: string, label: string, min: number): string {
  const cleaned = value.trim();
  if (!cleaned) return `Entre ton ${label.toLowerCase()}`;
  const length = [...cleaned].length;
  if (length < min) return `${label} : minimum ${min} caractères`;
  if (length > 50) return `${label} : maximum 50 caractères`;
  if (!NOM_RE.test(cleaned)) return `${label} : lettres, espaces et tirets uniquement`;
  return '';
}

/** Meme regle que verify_routes::email_valide : un email refuse n'est pas enregistre. */
function emailRecuperationValide(valeur: string): boolean {
  const v = valeur.trim();
  if (!v || v.length > 254 || /\s/.test(v)) return false;
  const [local, domaine] = v.split('@');
  if (!domaine || v.split('@').length !== 2) return false;
  return local.length >= 2 && domaine.includes('.') && !domaine.startsWith('.');
}

/** Age en annees a partir d'une date AAAA-MM-JJ. */
const ageFrom = (date: string): number | null => {
  const parts = date.split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return null;
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1;
  return age;
};

const validerPassword = (value: string): string => {
  if (value.length < 8) return 'Minimum 8 caractères';
  if (value.length > 64) return 'Maximum 64 caractères';
  if (!/[A-Z]/.test(value)) return 'Au moins 1 majuscule requise';
  if (!/[a-z]/.test(value)) return 'Au moins 1 minuscule requise';
  if (!/\d/.test(value)) return 'Au moins 1 chiffre requis';
  return '';
};

interface Props {
  onBack: () => void;
  /** Bascule vers la connexion avec le numero et le mail UQ deja saisis. */
  onGoLogin: (identity: { number: string; email: string }) => void;
}

export function CreateAccountScreen({ onBack, onGoLogin }: Props) {
  const { toast } = useSession();

  const [step, setStep] = useState<Step>('welcome');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CreateAccountResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState('');
  const [noted, setNoted] = useState(false);
  const [usePin, setUsePin] = useState(false);

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    sexe: '',
    date_naissance: '',
    lieu_naissance: '',
    profession: '',
    pays: 'CD',
    password: '',
    confirm: '',
    pin: '',
    telephone: '',
    recovery_email: '',
    promo: '',
  });

  // Etat de la verification du telephone (service /api/phone/check + OTP).
  const [numero, setNumero] = useState<PhoneCheckResponse | null>(null);
  const [verifNumero, setVerifNumero] = useState(false);
  const [otp, setOtp] = useState('');
  const [jeton, setJeton] = useState('');
  const [preuve, setPreuve] = useState('');
  const [otpMode, setOtpMode] = useState<'reel' | 'reportee' | ''>('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  // ===== Preuve humaine (scène) — exigée par /api/account/create =====
  const [passHumain, setPassHumain] = useState('');
  const [defi, setDefi] = useState<{ jeton: string; objets: number[]; cibleIdx: number } | null>(null);
  const [defiOuvert, setDefiOuvert] = useState(false);
  const [defiBusy, setDefiBusy] = useState(false);
  const [defiErreur, setDefiErreur] = useState('');
  const defiResolve = useRef<((pass: string) => void) | null>(null);

  /** Ouvre la scène : /api/human/begin?type=scene puis verify → pass. */
  const ouvrirDefi = async () => {
    setDefiErreur('');
    setDefiBusy(true);
    try {
      const debut = await humanBeginScene();
      if (
        debut.httpStatus !== 200 ||
        debut.status !== 'success' ||
        !debut.jeton ||
        !debut.objets ||
        debut.objets.length < 3 ||
        debut.cible_idx === undefined
      ) {
        setDefiErreur(debut.message || 'Défi indisponible — réessaie.');
        return;
      }
      setDefi({ jeton: debut.jeton, objets: debut.objets, cibleIdx: debut.cible_idx });
    } catch {
      setDefiErreur('Connexion au serveur impossible.');
    } finally {
      setDefiBusy(false);
    }
  };

  /** Réponse de la scène : /api/human/verify → pass à usage unique. */
  const reponseDefi = async (nombre: number) => {
    if (!defi || defiBusy) return;
    setDefiBusy(true);
    setDefiErreur('');
    try {
      const fin = await humanVerify({
        jeton: defi.jeton,
        choix: nombre,
        interaction: {
          input_type: 'none',
          pointer_samples: 0,
          path_length: 0,
          direction_changes: 0,
          motion_samples: 0,
          motion_variance: 0,
        },
      });
      if (fin.httpStatus === 200 && fin.status === 'success' && fin.verification_reussie && fin.pass) {
        setPassHumain(fin.pass);
        setDefiOuvert(false);
        setDefi(null);
        defiResolve.current?.(fin.pass);
        defiResolve.current = null;
        return;
      }
      setDefiErreur(fin.message || 'Mauvais numéro — réessaie.');
    } catch {
      setDefiErreur('Connexion au serveur impossible.');
    } finally {
      setDefiBusy(false);
    }
  };

  const fermerDefi = () => {
    setDefiOuvert(false);
    setDefi(null);
    defiResolve.current?.('');
    defiResolve.current = null;
  };

  /** Garantit un pass frais : le serveur l'exige à usage unique. */
  const assurerPassHumain = async (): Promise<string> => {
    if (passHumain) return passHumain;
    return await new Promise<string>((resolve) => {
      defiResolve.current = resolve;
      setDefiOuvert(true);
      void ouvrirDefi();
    });
  };

  const set = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const stepIndex = ORDRE.indexOf(step);

  const goBack = () => {
    setError('');
    if (step === 'welcome' || step === 'summary') {
      onBack();
      return;
    }
    setStep(ORDRE[ORDRE.indexOf(step) - 1] ?? 'welcome');
  };

  const next = (target: Step) => {
    setError('');
    setStep(target);
  };

  // ===== Regles par ecran, dans l'ordre du backend =====
  const identityError =
    validerNom(form.prenom.trim(), 'Prénom', 2) ||
    validerNom(form.nom.trim(), 'Nom', 2) ||
    (form.sexe !== 'F' && form.sexe !== 'M' ? 'Choisis ton sexe' : '');
  const identityReady = !identityError;

  const age = ageFrom(form.date_naissance);
  const birthError =
    (!form.date_naissance
      ? 'Entre ta date de naissance'
      : age === null
        ? 'Format attendu : AAAA-MM-JJ'
        : age < 13
          ? 'Âge minimum : 13 ans'
          : age > 120
            ? 'Date invalide'
            : '') ||
    (form.lieu_naissance.trim().length < 2 ? 'Lieu : minimum 2 caractères' : '') ||
    (form.lieu_naissance.trim().length > 100 ? 'Lieu : maximum 100 caractères' : '');
  const birthReady = !birthError;

  const passwordScore =
    (form.password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? 1 : 0) +
    (/\d/.test(form.password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0);
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort'];

  const securityError =
    validerPassword(form.password) ||
    (form.confirm !== form.password ? 'Les mots de passe ne correspondent pas.' : '') ||
    (usePin && form.pin.length < PIN_MIN_LENGTH
      ? `PIN : ${PIN_MIN_LENGTH} à ${PIN_MAX_LENGTH} chiffres`
      : '');
  const securityReady = !securityError;

  const phoneReady = Boolean(preuve) || Boolean(numero?.valide);

  // ===== Verification du numero : plan local, aucun fournisseur payant =====
  const timerNumero = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerNumero.current), []);

  const analyserNumero = (saisie: string) => {
    window.clearTimeout(timerNumero.current);
    setNumero(null);
    setPreuve('');
    setOtp('');
    setJeton('');
    setOtpMode('');
    setOtpMessage('');
    const value = saisie.replace(/[\s.-]/g, '');
    if (value.length < 8) return;
    timerNumero.current = window.setTimeout(async () => {
      setVerifNumero(true);
      try {
        const data = await checkPhone(value);
        setNumero(data);
      } catch {
        setNumero({ status: 'error', valide: false });
      } finally {
        setVerifNumero(false);
      }
    }, 450);
  };

  const envoyerCode = async () => {
    if (!numero?.valide || !numero.e164) {
      setError('Ce numéro ne semble pas attribuérable. Vérifie l’indicatif.');
      return;
    }
    setOtpBusy(true);
    setError('');
    try {
      const data = await requestOtp('telephone', numero.e164);
      if (data.status !== 'success' || !data.jeton) {
        setError(data.message || 'Envoi du code impossible.');
        return;
      }
      setJeton(data.jeton);
      setOtpMode(data.mode === 'reel' ? 'reel' : 'reportee');
      setOtpMessage(data.message || '');
      if (data.mode === 'reel') toast(`Code envoyé au ${data.cible}`, 'success');
    } catch {
      setError('Connexion au serveur impossible.');
    } finally {
      setOtpBusy(false);
    }
  };

  const validerCode = async () => {
    if (!jeton || otp.length !== 6) return;
    setOtpBusy(true);
    setError('');
    try {
      const data = await confirmOtp(jeton, otp);
      if (data.status !== 'success' || !data.jeton_verifie) {
        setError(data.message || 'Code incorrect.');
        return;
      }
      setPreuve(data.jeton_verifie);
      toast('Numéro vérifié', 'success');
    } catch {
      setError('Connexion au serveur impossible.');
    } finally {
      setOtpBusy(false);
    }
  };

  // ===== Creation =====
  const submit = async () => {
    if (!identityReady || !birthReady || !securityReady || !phoneReady) {
      setError('Complète toutes les informations demandées.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload: CreateAccountPayload = {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        sexe: form.sexe,
        date_naissance: form.date_naissance,
        lieu_naissance: form.lieu_naissance.trim(),
        profession: form.profession.trim() || undefined,
        pays: form.pays,
        // Le champ adresse n'est pas demande a l'inscription : il se complete
        // dans le profil. Le mot de passe de validation reste vide cote backend.
        adresse: '',
        telephone: numero?.e164 || form.telephone.replace(/[\s.-]/g, ''),
        password: form.password,
        recovery_phone: numero?.e164 || form.telephone.replace(/[\s.-]/g, ''),
      };
      if (form.promo.trim()) payload.code_promo_parrain = form.promo.trim().toUpperCase();
      const emailRecuperation = form.recovery_email.trim().toLowerCase();
      if (emailRecuperationValide(emailRecuperation)) payload.recovery_email = emailRecuperation;
      if (preuve) payload.verification_telephone = preuve;

      // Preuve humaine : le serveur l'exige à usage unique sur cette route.
      const pass = await assurerPassHumain();
      if (!pass) {
        setError('Vérification humaine requise pour créer le compte.');
        return;
      }
      payload.preuve_humaine = pass;

      const data = await createAccount(payload);
      if (String(data?.status) !== 'success') {
        setError(String(data?.message || 'Création du compte impossible.'));
        return;
      }

      const createdUq = String(data.uq_number || '');
      // Options post-creation : elles ne doivent jamais invalider le compte cree.
      if (usePin && createdUq && form.pin.length >= PIN_MIN_LENGTH) {
        try {
          await setPin({ uq_number: createdUq, pin: form.pin, password: form.password });
        } catch {
          toast('Compte créé, PIN non configuré', 'error');
        }
      }

      setResult(data);
      setNoted(false);
      setStep('summary');
    } catch (err) {
      setError(describeError(err, 'Création du compte impossible.'));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (key: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      setError('Copie impossible sur cet appareil.');
    }
  };

  const copyTout = async () => {
    const lignes = [
      `Numéro UQ : ${result?.uq_number || ''}`,
      `Email UQ : ${result?.email || ''}`,
      `Pseudo : ${result?.pseudo || ''}`,
      `Code promo : ${result?.code_promo || ''}`,
      `Mot de passe : ${form.password}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lignes);
      setCopiedKey('all');
      window.setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      setError('Copie impossible sur cet appareil.');
    }
  };

  const champsGeneres = [
    { key: 'uq', label: 'Numéro UQ', value: String(result?.uq_number || '—'), important: true },
    { key: 'email', label: 'Email UQ', value: String(result?.email || '—'), important: true },
    { key: 'pseudo', label: 'Pseudo (visible par les autres)', value: String(result?.pseudo || '—'), important: false },
    { key: 'promo', label: 'Code promo (pour parrainer)', value: String(result?.code_promo || '—'), important: false },
  ];

  return (
    <div className="v2-root" data-theme="dark">
      <div className="v2-frame v2-auth">
        <div className="v2-auth-halo" data-tone="red" />
        <div className="v2-auth-halo" data-tone="blue" />

        <div className="v2-body v2-auth-body">
          <div className="v2-auth-shell">
            <header className="v2-auth-head">
              <LogoUQ size={80} className="v2-auth-logo" />
              <div className="v2-auth-title">UQ Platform</div>
              <div className="v2-auth-subtitle">Créez votre identité numérique</div>
            </header>

            {step !== 'summary' && (
              <div className="v2-auth-progress" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((index) => (
                  <span key={index} data-done={step !== 'welcome' && index <= stepIndex} />
                ))}
              </div>
            )}

            <div className="v2-auth-card">
              {step !== 'welcome' && step !== 'summary' && (
                <button type="button" className="v2-auth-back" onClick={goBack} style={{ marginBottom: 10 }}>
                  <Icon name="back" size={16} />
                  Retour
                </button>
              )}

              {step === 'welcome' && (
                <div className="v2-auth-success">
                  <span style={{ fontSize: 54, lineHeight: 1 }}>
                    <Icon name="sparkles" size={20} />
                  </span>
                  <div className="v2-auth-card-title">Bienvenue sur UQ Platform</div>
                  <div className="v2-auth-hint">Créez votre identité numérique en 2 min.</div>
                  <button
                    type="button"
                    className="v2-auth-cta"
                    style={{ marginTop: 8 }}
                    onClick={() => next('identity')}
                  >
                    Commencer
                  </button>
                  <button type="button" className="v2-auth-link" style={{ alignSelf: 'center' }} onClick={onBack}>
                    J’ai déjà un compte
                  </button>
                </div>
              )}

              {step === 'identity' && (
                <>
                  <div className="v2-auth-card-title">Ton état civil</div>
                  <div className="v2-auth-card-hint">Prénom et nom tels que sur tes papiers.</div>

                  <div className="v2-auth-step">
                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Prénom</span>
                      <div className="v2-input-group">
                        <Icon name="user" size={18} className="v2-auth-icon" />
                        <input
                          value={form.prenom}
                          onChange={(event) => set('prenom', event.target.value)}
                          placeholder="Jean"
                          autoComplete="given-name"
                          maxLength={50}
                        />
                      </div>
                    </label>

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Nom</span>
                      <div className="v2-input-group">
                        <Icon name="users" size={18} className="v2-auth-icon" />
                        <input
                          value={form.nom}
                          onChange={(event) => set('nom', event.target.value)}
                          placeholder="Mukendi"
                          autoComplete="family-name"
                          maxLength={50}
                        />
                      </div>
                    </label>

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Sexe</span>
                      <div className="v2-input-group">
                        <Icon name="contact" size={18} className="v2-auth-icon" />
                        <select
                          className="v2-input"
                          value={form.sexe}
                          onChange={(event) => set('sexe', event.target.value)}
                          style={{ paddingLeft: 44 }}
                        >
                          <option value="">À préciser</option>
                          <option value="F">Femme</option>
                          <option value="M">Homme</option>
                        </select>
                      </div>
                    </label>

                    {error && (
                      <div className="v2-auth-error">
                        <Icon name="alert" size={16} />
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className="v2-auth-cta"
                      disabled={!identityReady}
                      onClick={() => next('birth')}
                    >
                      Continuer
                    </button>
                    {form.prenom || form.nom || form.sexe ? (
                      <div className="v2-auth-hint">{identityError || 'Écran 2 sur 5 complété.'}</div>
                    ) : null}
                  </div>
                </>
              )}

              {step === 'birth' && (
                <>
                  <div className="v2-auth-card-title">Naissance et métier</div>
                  <div className="v2-auth-card-hint">
                    Ces informations verrouillent ton identité : elles ne seront plus modifiables.
                  </div>

                  <div className="v2-auth-step">
                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Date de naissance</span>
                      <input
                        type="date"
                        className="v2-input"
                        value={form.date_naissance}
                        onChange={(event) => set('date_naissance', event.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                      />
                      {age !== null && (
                        <span className="v2-auth-hint">{age} ans</span>
                      )}
                    </label>

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Lieu de naissance</span>
                      <div className="v2-input-group">
                        <Icon name="pin" size={18} className="v2-auth-icon" />
                        <input
                          value={form.lieu_naissance}
                          onChange={(event) => set('lieu_naissance', event.target.value)}
                          placeholder="Kinshasa"
                          maxLength={100}
                        />
                      </div>
                    </label>

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Profession</span>
                      <div className="v2-input-group">
                        <Icon name="contact" size={18} className="v2-auth-icon" />
                        <input
                          value={form.profession}
                          onChange={(event) => set('profession', event.target.value)}
                          placeholder="Commerçante, développeur, étudiant…"
                          maxLength={60}
                        />
                      </div>
                      <span className="v2-auth-hint">Facultatif : elle s’affichera sur ta fiche de profil.</span>
                    </label>

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Pays</span>
                      <select
                        className="v2-input"
                        value={form.pays}
                        onChange={(event) => set('pays', event.target.value)}
                      >
                        {COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <span className="v2-auth-hint">
                        Le pays entre dans la fabrication de ton numéro UQ.
                      </span>
                    </label>

                    {error && (
                      <div className="v2-auth-error">
                        <Icon name="alert" size={16} />
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className="v2-auth-cta"
                      disabled={!birthReady}
                      onClick={() => next('security')}
                    >
                      Continuer
                    </button>
                    {birthError && form.date_naissance ? (
                      <div className="v2-auth-hint">{birthError}</div>
                    ) : null}
                  </div>
                </>
              )}

              {step === 'security' && (
                <>
                  <div className="v2-auth-card-title">Mot de passe de connexion</div>
                  <div className="v2-auth-card-hint">
                    8 caractères minimum, avec une majuscule, une minuscule et un chiffre.
                  </div>

                  <div className="v2-auth-step">
                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Mot de passe</span>
                      <div className="v2-input-group">
                        <Icon name="lock" size={18} className="v2-auth-icon" />
                        <input
                          type="password"
                          value={form.password}
                          onChange={(event) => set('password', event.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          maxLength={64}
                        />
                      </div>
                    </label>

                    {form.password && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="v2-auth-progress" style={{ flex: 1 }}>
                          {[0, 1, 2, 3].map((index) => (
                            <span key={index} data-done={index < passwordScore} />
                          ))}
                        </div>
                        <span className="v2-auth-hint" style={{ minWidth: 74, textAlign: 'right' }}>
                          {strengthLabels[passwordScore] || strengthLabels[0]}
                        </span>
                      </div>
                    )}

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Confirmation</span>
                      <div className="v2-input-group">
                        <Icon name="key" size={18} className="v2-auth-icon" />
                        <input
                          type="password"
                          value={form.confirm}
                          onChange={(event) => set('confirm', event.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          maxLength={64}
                        />
                      </div>
                      {form.confirm && form.confirm !== form.password && (
                        <span className="v2-auth-hint" style={{ color: '#ffb4b4' }}>
                          Les mots de passe ne correspondent pas.
                        </span>
                      )}
                    </label>

                    <div className="v2-row-between" style={{ alignItems: 'center', gap: 12 }}>
                      <div>
                        <div className="v2-auth-label">PIN du coffre (facultatif)</div>
                        <div className="v2-auth-hint">
                          {PIN_MIN_LENGTH} à {PIN_MAX_LENGTH} chiffres pour valider tes paiements.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="v2-toggle"
                        data-on={usePin}
                        aria-pressed={usePin}
                        aria-label="Configurer un PIN"
                        onClick={() => setUsePin((current) => !current)}
                      />
                    </div>

                    {usePin && (
                      <div className="v2-auth-pin-block">
                        <PinPad value={form.pin} onChange={(value) => set('pin', value)} disabled={busy} />
                      </div>
                    )}

                    {error && (
                      <div className="v2-auth-error">
                        <Icon name="alert" size={16} />
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className="v2-auth-cta"
                      disabled={!securityReady}
                      onClick={() => next('phone')}
                    >
                      Continuer
                    </button>
                    {securityError && form.password ? (
                      <div className="v2-auth-hint">{securityError}</div>
                    ) : null}
                  </div>
                </>
              )}

              {step === 'phone' && (
                <>
                  <div className="v2-auth-card-title">Téléphone de récupération</div>
                  <div className="v2-auth-card-hint">
                    Ton numéro sert à récupérer le compte en cas d’oubli. Il n’est jamais affiché.
                  </div>

                  <div className="v2-auth-step">
                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Numéro de téléphone</span>
                      <div className="v2-input-group">
                        <Icon name="phone" size={18} className="v2-auth-icon" />
                        <input
                          value={form.telephone}
                          onChange={(event) => {
                            set('telephone', event.target.value);
                            analyserNumero(event.target.value);
                          }}
                          placeholder="+243 81 000 0000"
                          inputMode="tel"
                          autoComplete="tel"
                        />
                      </div>
                      {verifNumero && <span className="v2-auth-hint">Analyse du numéro…</span>}
                      {!verifNumero && numero && (
                        numero.valide ? (
                          <span className="v2-auth-hint" style={{ color: '#8fe3b0' }}>
                            {numero.pays}
                            {numero.operateur ? ` · ${numero.operateur}` : ''} — {numero.e164}
                          </span>
                        ) : (
                          <span className="v2-auth-hint" style={{ color: '#ffb4b4' }}>
                            Numéro non reconnu : indicatif ou longueur d’abonné inconnu.
                          </span>
                        )
                      )}
                    </label>

                    {numero?.valide && !preuve && (
                      <button
                        type="button"
                        className="v2-btn v2-btn--outline v2-btn--block"
                        onClick={() => void envoyerCode()}
                        disabled={otpBusy || Boolean(jeton)}
                        style={{ borderColor: 'rgba(255,255,255,.14)', color: '#dbe4f0' }}
                      >
                        {otpBusy ? <span className="v2-spinner" /> : <Icon name="send" size={18} />}
                        {jeton ? 'Code demandé' : 'Recevoir le code par SMS'}
                      </button>
                    )}

                    {jeton && !preuve && (
                      <div className="v2-auth-pin-block">
                        <div className="v2-auth-hint" style={{ textAlign: 'center' }}>
                          {otpMode === 'reel'
                            ? otpMessage
                            : 'Réseau SMS non configuré : saisis le code reçu, ou passe cette étape.'}
                        </div>
                        <PinPad
                          value={otp}
                          onChange={(value) => {
                            setOtp(value);
                            setError('');
                          }}
                          minLength={6}
                          maxLength={6}
                          disabled={otpBusy}
                        />
                        <button
                          type="button"
                          className="v2-btn v2-btn--outline v2-btn--block"
                          onClick={() => void validerCode()}
                          disabled={otpBusy || otp.length !== 6}
                          style={{ borderColor: 'rgba(255,255,255,.14)', color: '#dbe4f0' }}
                        >
                          {otpBusy ? <span className="v2-spinner" /> : <Icon name="shield" size={18} />}
                          Vérifier le code
                        </button>
                      </div>
                    )}

                    {preuve && (
                      <div className="v2-auth-verified">
                        <Icon name="check" size={18} />
                        Numéro vérifié : {numero?.e164}
                      </div>
                    )}

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Email de récupération (facultatif)</span>
                      <div className="v2-input-group">
                        <Icon name="mail" size={18} className="v2-auth-icon" />
                        <input
                          type="email"
                          value={form.recovery_email}
                          onChange={(event) => set('recovery_email', event.target.value)}
                          placeholder="vous@gmail.com"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                        />
                      </div>
                      {form.recovery_email.trim() && !emailRecuperationValide(form.recovery_email) ? (
                        <span className="v2-auth-hint" style={{ color: '#ffb4b4' }}>
                          Adresse incomplète : elle ne sera pas enregistrée comme contact de récupération.
                        </span>
                      ) : (
                        <span className="v2-auth-hint">
                          Sert uniquement à prouver que le compte est le tien en cas de récupération.
                        </span>
                      )}
                    </label>

                    <label className="v2-auth-field">
                      <span className="v2-auth-label">Code promo d’un parrain (facultatif)</span>
                      <div className="v2-input-group">
                        <Icon name="gift" size={18} className="v2-auth-icon" />
                        <input
                          value={form.promo}
                          onChange={(event) => set('promo', event.target.value.toUpperCase())}
                          placeholder="UQ-PRENOM-1234"
                          autoCapitalize="characters"
                        />
                      </div>
                    </label>

                    {error && (
                      <div className="v2-auth-error">
                        <Icon name="alert" size={16} />
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className="v2-auth-cta"
                      disabled={!phoneReady || busy}
                      onClick={() => void submit()}
                    >
                      {busy ? <span className="v2-spinner" /> : null}
                      Créer mon compte
                    </button>
                    {!phoneReady && (
                      <div className="v2-auth-hint">Saisis un numéro valide pour continuer.</div>
                    )}
                  </div>
                </>
              )}

              {step === 'summary' && result && (
                <div className="v2-auth-success">
                  <span className="v2-auth-success-icon">
                    <Icon name="check" size={30} strokeWidth={2.2} />
                  </span>
                  <div className="v2-auth-card-title">Ton identité UQ est créée</div>
                  <div className="v2-auth-card-hint">
                    Le backend a généré ces quatre éléments. Note-les, surtout ton email UQ, ton numéro UQ
                    et ton mot de passe : sans eux, le compte est perdu.
                  </div>

                  <div className="v2-auth-identity">
                    {champsGeneres.map((champ) => (
                      <div className="v2-auth-identity-row" key={champ.key} data-important={champ.important}>
                        <div className="v2-auth-identity-label">
                          {champ.label}
                          {champ.important && <span className="v2-auth-identity-flag">à noter</span>}
                        </div>
                        <div className="v2-auth-identity-value">{champ.value}</div>
                        <button
                          type="button"
                          className="v2-auth-identity-copy"
                          onClick={() => void copy(champ.key, champ.value)}
                          aria-label={`Copier ${champ.label}`}
                        >
                          <Icon name={copiedKey === champ.key ? 'check' : 'copy'} size={16} />
                        </button>
                      </div>
                    ))}

                    <div className="v2-auth-identity-row" data-important="true">
                      <div className="v2-auth-identity-label">
                        Mot de passe
                        <span className="v2-auth-identity-flag">à noter</span>
                      </div>
                      <div className="v2-auth-identity-value">••••••••</div>
                      <button
                        type="button"
                        className="v2-auth-identity-copy"
                        onClick={() => void copy('password', form.password)}
                        aria-label="Copier le mot de passe"
                      >
                        <Icon name={copiedKey === 'password' ? 'check' : 'copy'} size={16} />
                      </button>
                    </div>
                  </div>

                  <button type="button" className="v2-btn v2-btn--outline v2-btn--block" onClick={() => void copyTout()}>
                    <Icon name={copiedKey === 'all' ? 'check' : 'copy'} size={18} />
                    {copiedKey === 'all' ? 'Copié' : 'Copier mes identifiants'}
                  </button>

                  <button
                    type="button"
                    className="v2-auth-confirm"
                    role="checkbox"
                    aria-checked={noted}
                    onClick={() => setNoted((current) => !current)}
                  >
                    <Icon name={noted ? 'check' : 'shield'} size={16} />
                    J’ai noté mon email UQ, mon numéro UQ et mon mot de passe
                  </button>

                  {error && (
                    <div className="v2-auth-error">
                      <Icon name="alert" size={16} />
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    className="v2-auth-cta"
                    disabled={!noted}
                    onClick={() =>
                      onGoLogin({ number: String(result.uq_number || ''), email: String(result.email || '') })
                    }
                  >
                    Aller à la connexion
                  </button>
                  <button type="button" className="v2-auth-link" style={{ alignSelf: 'center' }} onClick={onBack}>
                    Plus tard
                  </button>
                </div>
              )}
            </div>

            <footer className="v2-auth-foot">
              <div className="v2-auth-version">
                En créant un compte, tu acceptes les conditions d’utilisation de UQ Platform.
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* ===== Défi scène : preuve humaine exigée par /api/account/create ===== */}
      <Sheet
        open={defiOuvert}
        onClose={fermerDefi}
        className="v2-auth-gate-sheet"
        title="Vérification de sécurité"
      >
        <div className="v2-stack v2-human-content">
          {defiBusy && !defi && (
            <div className="v2-human-busy" role="status" aria-live="polite">
              <span className="v2-spinner" />
              <span>Chargement du défi…</span>
            </div>
          )}
          {defi && (
            <HumanScenePuzzle
              objets={defi.objets}
              cibleIdx={defi.cibleIdx}
              desactive={defiBusy}
              onReponse={(nombre) => void reponseDefi(nombre)}
            />
          )}
          {defiErreur && (
            <div className="v2-auth-error" role="alert">
              <Icon name="alert" size={16} />
              {defiErreur}
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
