import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { version } from '../../../package.json';
import { Icon } from '../components/Icon';
import { PinPad } from '../components/PinPad';
import { HumanScenePuzzle } from '../components/HumanScenePuzzle';
import { Sheet, UqInput } from '../components/Ui';
import { useSession } from '../lib/session';
import { enregistrerPasskey, etatBiometrie, lireCleAppareil } from '../lib/webauthn';
import { LogoUQ } from '../../components/ui/LogoUQ';
import { AuthAiSheet } from '../components/AuthAiSheet';
import '../styles/auth-cine.css';
import {
  authFinalize,
  authForgotPassword,
  authLoginPin,
  authStep1,
  authStep2,
  guardianLogin,
  humanBegin,
  humanConfig,
  humanVerify,
  PIN_MIN_LENGTH,
  type HumanMode,
  type HumanSymbol,
} from '../lib/api';

/**
 * « biometrie » = le serveur a reconnu la cle de cet appareil et ne demande que
 * sa signature. « enroler » = session ouverte, on propose la cle pour la
 * prochaine reprise. Le numero UQ reste affiche pendant toutes ces etapes :
 * la saisie email + mot de passe se fait en arriere-plan, par-dessus le compte
 * deja choisi.
 */
type Step = 'number' | 'email' | 'password' | 'pin' | 'biometrie' | 'success';

/** Trois echecs verrouillent le formulaire 30 secondes, sans jamais dire combien il en reste. */
const MAX_FAILURES = 3;
const LOCK_SECONDS = 30;
const GENERIC_ERROR = 'Identifiants incorrects.';
const PIN_ERROR = 'Code incorrect.';
const NETWORK_ERROR = 'Connexion au serveur impossible.';

/** Le numéro appartient au compte en cours d'ouverture : on l'affiche masqué. */
function masqueNumero(numero: string): string {
  const chiffres = numero.replace(/^UQ-?/i, '');
  if (!chiffres) return '';
  if (chiffres.length <= 4) return `UQ-${'•'.repeat(chiffres.length)}`;
  return `UQ-${'•'.repeat(chiffres.length - 4)}${chiffres.slice(-4)}`;
}

interface AuthScreenProps {
  onCreateAccount: () => void;
  /** Remis apres une creation : numero et mail UQ deja saisis. */
  prefill?: { number: string; email: string } | null;
  /** Retour à la page d'accueil vitrine (optionnel). */
  onBack?: () => void;
}

/** Le widget Cloudflare n'existe que si le script est charge. */
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

type SecureOutcome =
  | { kind: 'no-session' }
  | { kind: 'refused' }
  | { kind: 'pin'; sessionId: string; tfaToken: string }
  | { kind: 'ready'; owner: boolean; sessionId: string; tfaToken: string };

type HumanVisualChallenge =
  | { jeton: string; kind: 'symboles'; cible: HumanSymbol; symboles: HumanSymbol[] }
  | { jeton: string; kind: 'scene'; objets: number[]; cibleIdx: number };

interface HumanInteraction {
  input_type: 'mouse' | 'touch' | 'pen' | 'keyboard' | 'none';
  pointer_samples: number;
  path_length: number;
  direction_changes: number;
  motion_samples: number;
  motion_variance: number;
}

interface PointerSample {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

function nouveauSignalInteraction(): HumanInteraction {
  return {
    input_type: 'none',
    pointer_samples: 0,
    path_length: 0,
    direction_changes: 0,
    motion_samples: 0,
    motion_variance: 0,
  };
}

const HUMAN_SYMBOL_LABELS: Record<HumanSymbol, string> = {
  cercle: 'cercle',
  triangle: 'triangle',
  carre: 'carré',
  losange: 'losange',
  etoile: 'étoile',
  coeur: 'cœur',
};

function formaterAttente(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return `${minutes}:${String(reste).padStart(2, '0')}`;
}

function HumanPuzzleSymbol({ symbol }: { symbol: HumanSymbol }) {
  const shape = {
    cercle: <circle cx="24" cy="24" r="13" />,
    triangle: <path d="M24 9 39 36H9L24 9Z" />,
    carre: <rect x="11" y="11" width="26" height="26" rx="3" />,
    losange: <path d="m24 7 17 17-17 17L7 24 24 7Z" />,
    etoile: <path d="m24 6 5.5 11.2L42 19l-9 8.8 2.1 12.5L24 34.4 12.9 40.3 15 27.8 6 19l12.5-1.8L24 6Z" />,
    coeur: <path d="M24 39S8 29 8 18.5A8.5 8.5 0 0 1 24 14a8.5 8.5 0 0 1 16 4.5C40 29 24 39 24 39Z" />,
  }[symbol];

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {shape}
    </svg>
  );
}

/**
 * Connexion a etages, pilote par le serveur.
 *
 *  - Le numero UQ ouvre la porte. Le serveur seul decide du palier (24 h, 48 h,
 *    plafond de 30 jours) : reprise par la cle de l'appareil, ou email + mot de
 *    passe puis cle. Le client ne peut pas s'attribuer un palier plus doux.
 *  - Le numero reste affiche a chaque etape : la saisie email + mot de passe se
 *    superpose au compte deja choisi, puis disparait au profit de la biométrie.
 *  - Le code de securite n'apparait que si le backend le reclame pour ce compte ;
 *    le repli vers /api/guardian/login couvre les comptes rattaches.
 *  - Les messages du backend ne sont jamais affiches tels quels (ils citent les
 *    tentatives), sauf le motif du palier : lui explique pourquoi on redemande
 *    le mot de passe.
 */
export function AuthScreen({ onCreateAccount, prefill, onBack }: AuthScreenProps) {
  const { completeLogin, reprendre, consulterPalier, numeroMemorise, oublierCetAppareil, toast } =
    useSession();

  const [step, setStep] = useState<Step>('number');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [pin, setPin] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [tfaToken, setTfaToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [failures, setFailures] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);

  // Motif annonce par le serveur pour justifier le palier exige.
  const [motif, setMotif] = useState('');
  const [messageBiometrie, setMessageBiometrie] = useState('');

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotValue, setForgotValue] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  // Menu du bas : les trois liens ne sont accessibles qu'apres la porte anti-robot.
  const [menuOpen, setMenuOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState<HumanMode>('visuel_local');
  const [gateSiteKey, setGateSiteKey] = useState('');
  const [gateBusy, setGateBusy] = useState(false);
  const [gateLabel, setGateLabel] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateChallenge, setGateChallenge] = useState<HumanVisualChallenge | null>(null);
  const [gateChoice, setGateChoice] = useState<number | null>(null);
  const [gateChallengeError, setGateChallengeError] = useState('');
  const [motionActif, setMotionActif] = useState(false);
  // Verrou impose par le serveur apres 3 echecs ou un quota depasse, en secondes.
  const [gateLock, setGateLock] = useState(0);
  const [glissement, setGlissement] = useState<{ x: number; y: number; index: number | null } | null>(
    null,
  );
  const turnstileHost = useRef<HTMLDivElement | null>(null);
  const turnstileWidget = useRef<string | null>(null);
  const gateActive = useRef(false);
  const gateAttempt = useRef(0);
  const interaction = useRef<HumanInteraction>(nouveauSignalInteraction());
  const lastPointerSample = useRef<PointerSample | null>(null);
  const motionStats = useRef({ samples: 0, mean: 0, sumSquares: 0 });
  const motionListener = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const tuilesRef = useRef<HTMLDivElement | null>(null);

  const shakeTimer = useRef<number | undefined>(undefined);
  const locked = lockSeconds > 0;

  useEffect(() => () => window.clearTimeout(shakeTimer.current), []);
  useEffect(
    () => () => {
      if (motionListener.current) {
        window.removeEventListener('devicemotion', motionListener.current);
        motionListener.current = null;
      }
    },
    [],
  );

  // Le compte a rebours suit uniquement le verrou decide par le serveur.
  useEffect(() => {
    if (gateLock <= 0) return;
    const minuteur = window.setTimeout(() => setGateLock((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearTimeout(minuteur);
  }, [gateLock]);

  // Bascule depuis la creation : numero et mail UQ sont deja en place.
  useEffect(() => {
    if (!prefill?.number) return;
    setNumber(prefill.number.toUpperCase());
    setEmail(prefill.email || '');
    setStep('password');
  }, [prefill]);

  const tentativesReprise = useRef(0);

  /**
   * Reprise a l'ouverture de l'ecran. Le numero deja ouvert sur cet appareil est
   * pre-rempli et le serveur est interroge sans ceremonie : une signature
   * WebAuthn reclamee sans geste serait annulee par le navigateur. Palier doux ->
   * un seul bouton a presser, puis la biométrie. Palier complet -> les etapes
   * email + mot de passe s'ouvrent par-dessus le numero, qui reste affiche.
   */
  useEffect(() => {
    if (prefill?.number) return;
    if (!numeroMemorise) return;
    if (tentativesReprise.current > 0) return;
    tentativesReprise.current += 1;
    setNumber(numeroMemorise.toUpperCase());
    let annule = false;
    void (async () => {
      const consultation = await consulterPalier(numeroMemorise);
      if (annule) return;
      setMotif(consultation.motif || '');
      if (consultation.palier === 'auto' || consultation.palier === 'biometrie') {
        setStep('biometrie');
        return;
      }
      setStep('number');
    })().catch(() => {
      if (!annule) setMotif('Reprise impossible pour le moment.');
    });
    return () => {
      annule = true;
    };
  }, [numeroMemorise, prefill, consulterPalier]);

  // Compte a rebours du verrouillage temporaire.
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = window.setTimeout(() => setLockSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [lockSeconds]);

  // Le quota de tentatives repart a zero une fois le verrouillage expire.
  useEffect(() => {
    if (lockSeconds === 0) setFailures(0);
  }, [lockSeconds]);

  const flashError = (message: string) => {
    setError(message);
    setShake(true);
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShake(false), 480);
  };

  const registerFailure = (message: string = GENERIC_ERROR) => {
    flashError(message);
    setPassword('');
    setPin('');
    const next = failures + 1;
    if (next >= MAX_FAILURES) {
      setFailures(0);
      setLockSeconds(LOCK_SECONDS);
      return;
    }
    setFailures(next);
  };

  /**
   * Numero saisi : on interroge le serveur, lui seul sait si cet appareil est
   * reconnu. Palier doux -> on signe avec la cle ; palier complet -> l'etape
   * email + mot de passe s'ouvre par-dessus le numero, qui reste affiche.
   */
  const submitNumber = async () => {
    if (busy || locked) return;
    const value = number.trim().toUpperCase();
    if (!/^UQ-\d+$/.test(value)) {
      flashError('Saisis les chiffres de ton numéro UQ.');
      return;
    }
    setNumber(value);
    setError('');
    setBusy(true);
    try {
      const reprise = await reprendre(value);
      setMotif(reprise.motif || '');
      if (reprise.ok) return;
      if (reprise.palier === 'auto' || reprise.palier === 'biometrie') {
        setMessageBiometrie(reprise.message || reprise.motif || '');
        setStep('biometrie');
        return;
      }
      setStep('email');
    } catch {
      flashError(NETWORK_ERROR);
      setStep('email');
    } finally {
      setBusy(false);
    }
  };

  /** Relance la signature biométrique sans repasser par la saisie. */
  const submitBiometrie = async () => {
    if (busy || locked) return;
    setBusy(true);
    setError('');
    try {
      const reprise = await reprendre(number);
      setMotif(reprise.motif || '');
      if (reprise.ok) return;
      if (reprise.palier === 'complet' || reprise.palier === 'aucun_appareil') {
        setMessageBiometrie('');
        setStep('email');
        return;
      }
      setMessageBiometrie(reprise.message || reprise.motif || 'Vérification biométrique interrompue.');
    } catch {
      flashError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = () => {
    if (locked) return;
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      flashError('Saisis une adresse email valide.');
      return;
    }
    setEmail(value);
    setError('');
    setStep('password');
  };

  /**
   * Etape 1 + etape 2 du parcours securise : l'email saisi est transmis au
   * serveur, qui le compare a celui du compte avant meme de tester le mot de
   * passe. Le proprietaire doit confirmer son mot de passe trois fois : chaque
   * confirmation abandonne la session, on en recree donc une transparente pour
   * ne pas demander trois fois la saisie.
   */
  const runSecureFlow = async (value: string): Promise<SecureOutcome> => {
    for (let round = 0; round < MAX_FAILURES; round += 1) {
      const first = await authStep1(number);
      if (first.httpStatus === 404) return { kind: 'no-session' };
      if (first.httpStatus !== 200 || !first.session_id || !first.tfa_token) {
        return { kind: 'refused' };
      }
      let owner = Boolean(first.is_owner);
      const second = await authStep2(first.session_id, first.tfa_token, email.trim(), value);
      const tfa = second.tfa_token || first.tfa_token;
      if (second.status === 'attempt_required') continue;
      if (second.status !== 'step_required' && second.status !== 'success') {
        return { kind: 'refused' };
      }
      if (second.is_owner !== undefined) owner = Boolean(second.is_owner);
      if (second.status === 'step_required' && second.step === 3 && owner) {
        return { kind: 'pin', sessionId: first.session_id, tfaToken: tfa };
      }
      return { kind: 'ready', owner, sessionId: first.session_id, tfaToken: tfa };
    }
    return { kind: 'refused' };
  };

  const finishWithToken = async (token: string) => {
    localStorage.removeItem('uq_switched_from');
    setStep('success');
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    await completeLogin(token);
    toast('Connexion réussie', 'success');
  };

  /**
   * Un controle complet (email + mot de passe) vient de reussir et le serveur
   * l'a horodate : la cle de cet appareil peut naitre dans l'enclave. Si le
   * navigateur ne peut pas (http sur une adresse de LAN, WebAuthn absent), on le
   * dit : la prochaine ouverture repassera par le palier complet.
   */
  const ouvrirCleAppareil = async (numero: string) => {
    const cle = await enregistrerPasskey(numero);
    if (cle.ok) toast('Clé biométrique enregistrée sur cet appareil', 'success');
    else if (cle.message) toast(cle.message);
  };

  const finalize = async (owner: boolean, session: string, tfa: string) => {
    const data = await authFinalize(owner, session, tfa, lireCleAppareil());
    if (data.status !== 'success' || !data.token) {
      registerFailure();
      return;
    }
    if (data.uq_number) localStorage.setItem('uq_number', data.uq_number);
    if (data.uq_email) localStorage.setItem('uq_email', data.uq_email);
    if (data.uq_pseudo) localStorage.setItem('uq_pseudo', data.uq_pseudo);
    if (data.display_name) localStorage.setItem('uq_name', data.display_name);
    if (data.account) localStorage.setItem('uq_account', JSON.stringify(data.account));
    if (owner) localStorage.setItem('uq_is_owner', 'true');
    else localStorage.removeItem('uq_is_owner');

    setStep('success');
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    await completeLogin(data.token);
    toast('Connexion réussie', 'success');
    await ouvrirCleAppareil(data.uq_number || number);
  };

  const submitPassword = async () => {
    if (busy || locked) return;
    if (!password) {
      flashError(GENERIC_ERROR);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const outcome = await runSecureFlow(password);
      if (outcome.kind === 'no-session') {
        // Compte rattache au proprietaire : seule cette porte delivre un jeton.
        const fallback = await guardianLogin({
          number,
          email,
          password,
          credential_id: lireCleAppareil(),
        });
        if (!fallback.token) {
          registerFailure();
          return;
        }
        if (fallback.account) {
          localStorage.setItem('uq_account', JSON.stringify(fallback.account));
        }
        await finishWithToken(fallback.token);
        await ouvrirCleAppareil(number);
        return;
      }
      if (outcome.kind === 'refused') {
        registerFailure();
        return;
      }
      if (outcome.kind === 'pin') {
        setSessionId(outcome.sessionId);
        setTfaToken(outcome.tfaToken);
        setPassword('');
        setPin('');
        setError('');
        setStep('pin');
        return;
      }
      await finalize(outcome.owner, outcome.sessionId, outcome.tfaToken);
    } catch {
      flashError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const submitPin = async () => {
    if (busy || locked || pin.length < PIN_MIN_LENGTH) return;
    setBusy(true);
    setError('');
    try {
      const data = await authLoginPin(sessionId, tfaToken, pin);
      if (data.status !== 'step_required' && data.status !== 'success') {
        registerFailure(PIN_ERROR);
        return;
      }
      await finalize(true, sessionId, data.tfa_token || tfaToken);
    } catch {
      flashError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const openForgot = () => {
    setForgotValue(number);
    setForgotSent(false);
    setForgotOpen(true);
  };

  const sendForgot = async () => {
    if (forgotBusy) return;
    setForgotBusy(true);
    try {
      await authForgotPassword((forgotValue || number).trim().toUpperCase());
    } catch {
      // Reponse volontairement opaque : on affiche la meme chose dans tous les cas.
    } finally {
      setForgotBusy(false);
      setForgotSent(true);
    }
  };

  // ====================
  // PORTE ANTI-ROBOT — le menu du bas ne s'ouvre qu'apres verification.
  // Le backend choisit le service : Turnstile des que ses cles sont posees,
  // sinon défi visuel local validé côté serveur. Le symbole se glisse sur sa
  // tuile et le dépôt suffit à valider : le serveur compte les échecs et pose
  // un verrou de cinq minutes, le client n'a rien à confirmer lui-même.
  // ====================
  const ouvrirOptions = () => {
    gateAttempt.current += 1;
    gateActive.current = false;
    if (motionListener.current) {
      window.removeEventListener('devicemotion', motionListener.current);
      motionListener.current = null;
    }
    setGateBusy(false);
    setGateOpen(false);
    setMenuOpen(true);
    setGateError('');
    setGateChallenge(null);
    setGateChoice(null);
    setGlissement(null);
  };

  /** Vrai quand le serveur impose un verrou : le compte à rebours est la seule info utile. */
  const appliquerVerrou = (reponse: {
    raison?: string;
    secondes_restantes?: number;
  }): boolean => {
    if (reponse.raison !== 'penalite' && reponse.raison !== 'debit') return false;
    setGateLock(Math.min(900, Math.max(5, Math.ceil(reponse.secondes_restantes ?? 300))));
    setGateChallenge(null);
    setGateChoice(null);
    setGateChallengeError('');
    setGateError('');
    return true;
  };

  const validerTurnstile = async (jeton: string, attempt: number) => {
    if (!gateActive.current || gateAttempt.current !== attempt) return;
    setGateBusy(true);
    setGateLabel('Vérification en cours…');
    try {
      const fin = await humanVerify({ jeton });
      if (!gateActive.current || gateAttempt.current !== attempt) return;
      if (fin.httpStatus === 200 && fin.status === 'success' && fin.verification_reussie) {
        ouvrirOptions();
      }
      else setGateError(fin.message || 'Vérification échouée. Réessaie.');
    } catch {
      if (gateActive.current && gateAttempt.current === attempt) setGateError(NETWORK_ERROR);
    } finally {
      if (gateAttempt.current === attempt) setGateBusy(false);
    }
  };

  const ouvrirPorte = async () => {
    if (gateBusy) return;
    // Verrou en cours : on rouvre la feuille avec le compte a rebours deja impose
    // par le serveur, sans consommer une nouvelle demande de defi.
    if (gateLock > 0) {
      setMenuOpen(false);
      gateActive.current = true;
      setGateBusy(false);
      setGateChallenge(null);
      setGateError('');
      setGateOpen(true);
      return;
    }
    const attempt = gateAttempt.current + 1;
    gateAttempt.current = attempt;
    if (motionListener.current) {
      window.removeEventListener('devicemotion', motionListener.current);
      motionListener.current = null;
    }
    setMenuOpen(false);
    gateActive.current = true;
    setGateError('');
    setGateChallenge(null);
    setGateChoice(null);
    setGateChallengeError('');
    setMotionActif(false);
    setGlissement(null);
    interaction.current = nouveauSignalInteraction();
    lastPointerSample.current = null;
    motionStats.current = { samples: 0, mean: 0, sumSquares: 0 };
    setGateOpen(true);
    setGateBusy(true);
    setGateLabel('Préparation de la vérification…');
    try {
      const cfg = await humanConfig();
      if (!gateActive.current || gateAttempt.current !== attempt) return;
      if (cfg.httpStatus !== 200 || cfg.status !== 'success' || !cfg.mode) {
        setGateError(
          cfg.httpStatus === 404
            ? 'Le serveur de vérification doit être mis à jour puis redémarré.'
            : cfg.message || 'Vérification indisponible. Réessaie dans un instant.',
        );
        return;
      }
      const mode: HumanMode = cfg.mode;
      setGateMode(mode);
      if (mode === 'turnstile') {
        if (!cfg.site_key) {
          setGateError('Configuration de vérification incomplète. Réessaie plus tard.');
          return;
        }
        setGateSiteKey(cfg.site_key);
        setGateLabel('Complète la vérification Cloudflare.');
        return;
      }
      if (mode === 'indisponible') {
        setGateError(cfg.message || 'Vérification indisponible pour le moment.');
        return;
      }
      const debut = await humanBegin();
      if (!gateActive.current || gateAttempt.current !== attempt) return;
      const jeton = debut.jeton;
      if (debut.httpStatus !== 200 || debut.status !== 'success' || !jeton) {
        if (appliquerVerrou(debut)) return;
        setGateError(debut.message || 'Défi visuel indisponible. Réessaie dans un instant.');
        return;
      }
      if (
        debut.mode === 'scene' &&
        debut.objets &&
        debut.objets.length >= 3 &&
        debut.cible_idx !== undefined &&
        debut.cible_idx >= 0 &&
        debut.cible_idx < debut.objets.length
      ) {
        setGateChallenge({
          jeton,
          kind: 'scene',
          objets: debut.objets,
          cibleIdx: debut.cible_idx,
        });
        setGateLabel('Observe la scène : les objets et les numéros se mélangent.');
        return;
      }
      if (!debut.cible || !debut.symboles || debut.symboles.length !== 6) {
        if (appliquerVerrou(debut)) return;
        setGateError(debut.message || 'Défi visuel indisponible. Réessaie dans un instant.');
        return;
      }
      setGateChallenge({
        jeton,
        kind: 'symboles',
        cible: debut.cible,
        symboles: debut.symboles,
      });
      setGateLabel('Glisse le symbole sur sa tuile.');
    } catch {
      if (gateActive.current && gateAttempt.current === attempt) setGateError(NETWORK_ERROR);
    } finally {
      if (gateAttempt.current === attempt) setGateBusy(false);
    }
  };

  const verifierDefiVisuel = async (
    attempt: number,
    challenge: HumanVisualChallenge,
    choix: number,
  ) => {
    if (!gateActive.current || gateAttempt.current !== attempt || gateBusy) return;
    setGateBusy(true);
    setGateError('');
    setGateLabel('Vérification du défi…');
    if (motionListener.current) {
      window.removeEventListener('devicemotion', motionListener.current);
      motionListener.current = null;
    }
    try {
      if (gateAttempt.current !== attempt) return;
      const fin = await humanVerify({
        jeton: challenge.jeton,
        choix,
        interaction: { ...interaction.current },
      });
      if (!gateActive.current || gateAttempt.current !== attempt) return;
      if (
        fin.httpStatus === 200 &&
        fin.status === 'success' &&
        fin.verification_reussie
      ) {
        ouvrirOptions();
      } else if (appliquerVerrou(fin)) {
        // Le serveur a pose son verrou : le compte a rebours remplace le defi.
      } else if (fin.raison === 'choix') {
        setGateChallengeError(fin.message || 'Vérification échouée.');
        setGateChoice(null);
      } else {
        setGateError(fin.message || 'Vérification échouée.');
      }
    } catch {
      if (gateActive.current && gateAttempt.current === attempt) setGateError(NETWORK_ERROR);
    } finally {
      if (gateAttempt.current === attempt) setGateBusy(false);
    }
  };

  /** Depose le symbole sur une tuile : le depot seul vaut validation. */
  const soumettreSymbole = async (index: number) => {
    if (!gateChallenge || gateBusy || gateLock > 0) return;
    setGateChoice(index);
    setGateChallengeError('');
    await verifierDefiVisuel(gateAttempt.current, gateChallenge, index);
  };

  /** Scene : l'utilisateur choisit le numéro lu sur l'objet ciblé. */
  const soumettreSceneNumero = async (nombre: number) => {
    if (!gateChallenge || gateChallenge.kind !== 'scene') return;
    if (gateBusy || gateLock > 0) return;
    setGateChoice(null);
    setGateChallengeError('');
    await verifierDefiVisuel(gateAttempt.current, gateChallenge, nombre);
  };

  /** Tuile survolée par le pointeur, ou null hors de la grille. */
  const tuileSousLePointeur = (x: number, y: number): number | null => {
    const hote = tuilesRef.current;
    if (!hote) return null;
    const cases = Array.from(hote.children) as HTMLElement[];
    const index = cases.findIndex((caseEl) => {
      const zone = caseEl.getBoundingClientRect();
      return x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom;
    });
    return index >= 0 ? index : null;
  };

  const demarrerGlissement = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isTrusted || !gateChallenge || gateBusy || gateLock > 0) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setGlissement({ x: event.clientX, y: event.clientY, index: null });
  };

  const suivreGlissement = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!glissement) return;
    setGlissement({
      x: event.clientX,
      y: event.clientY,
      index: tuileSousLePointeur(event.clientX, event.clientY),
    });
  };

  const terminerGlissement = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!glissement) return;
    const index = tuileSousLePointeur(event.clientX, event.clientY);
    setGlissement(null);
    if (index !== null) void soumettreSymbole(index);
  };

  const enregistrerMouvementPointeur = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isTrusted || !gateChallenge || gateBusy) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const previous = lastPointerSample.current;
    const dx = previous ? x - previous.x : 0;
    const dy = previous ? y - previous.y : 0;
    const signal = interaction.current;
    signal.input_type =
      event.pointerType === 'touch'
        ? 'touch'
        : event.pointerType === 'pen'
          ? 'pen'
          : event.pointerType === 'mouse'
            ? 'mouse'
            : 'none';
    signal.pointer_samples = Math.min(signal.pointer_samples + 1, 512);
    if (previous) {
      signal.path_length = Math.min(signal.path_length + Math.hypot(dx, dy), 100);
      if (previous.dx * dx + previous.dy * dy < 0 && signal.direction_changes < 512) {
        signal.direction_changes += 1;
      }
    }
    lastPointerSample.current = { x, y, dx, dy };
  };

  const activerCapteursMouvement = async () => {
    if (!('DeviceMotionEvent' in window)) return;
    const motionConstructor = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    try {
      if (motionConstructor.requestPermission) {
        const permission = await motionConstructor.requestPermission();
        if (permission !== 'granted') return;
      }
      if (motionListener.current) {
        window.removeEventListener('devicemotion', motionListener.current);
      }
      const listener = (event: DeviceMotionEvent) => {
        const axes = [
          event.accelerationIncludingGravity?.x,
          event.accelerationIncludingGravity?.y,
          event.accelerationIncludingGravity?.z,
          event.rotationRate?.alpha,
          event.rotationRate?.beta,
          event.rotationRate?.gamma,
        ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
        if (axes.length === 0 || motionStats.current.samples >= 256) return;
        const magnitude = Math.sqrt(axes.reduce((total, value) => total + value * value, 0));
        const stats = motionStats.current;
        stats.samples += 1;
        const delta = magnitude - stats.mean;
        stats.mean += delta / stats.samples;
        stats.sumSquares += delta * (magnitude - stats.mean);
        interaction.current.motion_samples = stats.samples;
        interaction.current.motion_variance =
          stats.samples > 1 ? stats.sumSquares / (stats.samples - 1) : 0;
      };
      motionListener.current = listener;
      window.addEventListener('devicemotion', listener);
      setMotionActif(true);
    } catch {
      setMotionActif(false);
    }
  };

  useEffect(() => {
    if (!gateOpen || gateMode !== 'turnstile' || !gateSiteKey) return;
    let annule = false;
    const lancer = () => {
      const hote = turnstileHost.current;
      if (annule || !hote || !window.turnstile) return;
      const attempt = gateAttempt.current;
      hote.innerHTML = '';
      turnstileWidget.current = window.turnstile.render(hote, {
        sitekey: gateSiteKey,
        callback: (jeton: string) => void validerTurnstile(jeton, attempt),
        'error-callback': () => setGateError('Vérification impossible.'),
      });
    };
    const nettoyer = () => {
      annule = true;
      if (turnstileWidget.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidget.current);
        turnstileWidget.current = null;
      }
    };
    if (window.turnstile) {
      lancer();
      return nettoyer;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = lancer;
    script.onerror = () => setGateError('Vérification indisponible.');
    document.head.appendChild(script);
    return nettoyer;
    // validerTurnstile n'est appele que par le widget, jamais au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateOpen, gateMode, gateSiteKey]);

  const fermerPorte = () => {
    gateAttempt.current += 1;
    gateActive.current = false;
    setGateBusy(false);
    setGateOpen(false);
    setGateError('');
    setGateChallenge(null);
    setGateChoice(null);
    setGateChallengeError('');
    if (motionListener.current) {
      window.removeEventListener('devicemotion', motionListener.current);
      motionListener.current = null;
    }
  };

  const cardTitle =
    step === 'number'
      ? 'Connexion'
      : step === 'email'
        ? 'Vérification'
        : step === 'password'
          ? 'Mot de passe'
          : step === 'pin'
            ? 'Code de sécurité'
            : step === 'biometrie'
              ? 'Clé de l’appareil'
              : 'Bienvenue';

  const cardHint =
    step === 'number'
      ? 'Entre ton numéro UQ pour continuer.'
      : step === 'email'
        ? motif || 'Confirme l’adresse email liée à ce compte.'
        : step === 'password'
          ? 'Dernière vérification avant l’ouverture de ta session.'
          : step === 'pin'
            ? 'Saisis ton code à 4 à 6 chiffres.'
            : step === 'biometrie'
              ? motif || 'Le serveur reconnaît cet appareil : seule ta clé biométrique ouvre la session.'
              : 'Ta session est ouverte.';

  // Le numéro reste a l'ecran tant que la session n'est pas ouverte : l'etape
  // email + mot de passe se superpose au compte choisi, elle ne le remplace pas.
  const numeroAffiche = number.trim().toUpperCase();
  const afficherNumero =
    step !== 'number' && step !== 'success' && Boolean(numeroAffiche);

  const biometriePossible = etatBiometrie();

  const minutes = Math.floor(lockSeconds / 60);
  const seconds = lockSeconds % 60;
  const clock = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const fieldError = error && !locked;

  return (
    <div className="uq-cine v2-root" data-theme="dark">
      <div className="v2-frame v2-auth">
        <div className="uq-cine-bg" aria-hidden="true">
          <div className="uq-land-mesh">
            <div className="uq-land-blob uq-land-blob--1" />
            <div className="uq-land-blob uq-land-blob--2" />
            <div className="uq-land-blob uq-land-blob--3" />
          </div>
          <div className="uq-land-dots" />
          <svg className="uq-land-grain" aria-hidden="true">
            <filter id="uq-cine-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#uq-cine-noise)" />
          </svg>
        </div>

        <div className="v2-body v2-auth-body">
          <div className="v2-auth-shell">
            <header className="v2-auth-head">
              {onBack && (
                <button
                  type="button"
                  className="v2-auth-back"
                  onClick={onBack}
                  aria-label="Retour à l'accueil"
                >
                  <Icon name="arrowLeft" size={18} />
                </button>
              )}
              <LogoUQ size={80} className="v2-auth-logo" />
              <div className="v2-auth-title">UQ Platform</div>
              <div className="v2-auth-subtitle">Connectez-vous à votre espace</div>
            </header>

            <div className={`v2-auth-card ${shake ? 'v2-shake' : ''}`}>
              {locked ? (
                <div className="v2-auth-locked">
                  <span className="v2-auth-locked-icon">
                    <Icon name="lock" size={26} />
                  </span>
                  <div className="v2-auth-card-title">Compte temporairement verrouillé</div>
                  <div className="v2-auth-hint">Réessaie dans un instant.</div>
                  <div className="v2-auth-timer">{clock}</div>
                </div>
              ) : step === 'success' ? (
                <div className="v2-auth-success">
                  <span className="v2-auth-success-icon">
                    <Icon name="check" size={30} strokeWidth={2.2} />
                  </span>
                  <div className="v2-auth-card-title">Connexion réussie</div>
                  <span className="v2-spinner" style={{ color: '#5aa9ff' }} />
                  <div className="v2-auth-hint">Ouverture de ton espace…</div>
                </div>
              ) : (
                <>
                  {step !== 'number' && (
                    <button
                      type="button"
                      className="v2-auth-back"
                      onClick={() => {
                        setError('');
                        setStep(
                          step === 'password'
                            ? 'email'
                            : step === 'pin'
                              ? 'password'
                              : step === 'biometrie'
                                ? 'number'
                                : 'number',
                        );
                      }}
                      style={{ marginBottom: 10 }}
                    >
                      <Icon name="back" size={16} />
                      Retour
                    </button>
                  )}

                  <div className="v2-auth-card-title">{cardTitle}</div>
                  <div className="v2-auth-card-hint">{cardHint}</div>

                  {afficherNumero && (
                    <div className="v2-auth-account">
                      <span className="v2-auth-account-num">
                        <Icon name="user" size={15} />
                        {showNumber ? numeroAffiche : masqueNumero(numeroAffiche)}
                      </span>
                      <button
                        type="button"
                        className="v2-auth-link"
                        aria-label={showNumber ? 'Masquer le numéro UQ' : 'Afficher le numéro UQ'}
                        onClick={() => setShowNumber((current) => !current)}
                      >
                        <Icon name={showNumber ? 'eyeOff' : 'eye'} size={16} />
                      </button>
                      <button
                        type="button"
                        className="v2-auth-link"
                        onClick={() => {
                          setError('');
                          setStep('number');
                        }}
                      >
                        <Icon name="edit" size={16} />
                        Changer de compte
                      </button>
                    </div>
                  )}

                  <div className="v2-auth-step">
                    {step === 'number' && (
                      <>
                        <label className="v2-auth-field">
                          <span className="v2-auth-label">Numéro UQ</span>
                          <UqInput
                            value={number}
                            onChange={setNumber}
                            onEnter={() => void submitNumber()}
                          />
                        </label>
                        {motif && !fieldError && (
                          <div className="v2-auth-hint" style={{ fontSize: 12.5 }}>
                            {motif}
                          </div>
                        )}
                        {fieldError && (
                          <div className="v2-auth-error">
                            <Icon name="alert" size={16} />
                            {error}
                          </div>
                        )}
                        <button
                          type="button"
                          className="v2-auth-cta"
                          onClick={() => void submitNumber()}
                          disabled={busy}
                        >
                          {busy ? <span className="v2-spinner" /> : null}
                          Continuer
                        </button>
                        {numeroMemorise && (
                          <button
                            type="button"
                            className="v2-auth-link"
                            onClick={() => {
                              oublierCetAppareil();
                              setNumber('');
                              setMotif('');
                              setMessageBiometrie('');
                              toast('Cet appareil ne pourra plus ouvrir la session sans email et mot de passe');
                            }}
                          >
                            Oublier cet appareil
                          </button>
                        )}
                      </>
                    )}

                    {step === 'email' && (
                      <>
                        <label className="v2-auth-field">
                          <span className="v2-auth-label">Email</span>
                          <div className="v2-input-group">
                            <Icon name="mail" size={18} className="v2-auth-icon" />
                            <input
                              type="email"
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              placeholder="vous@exemple.com"
                              autoComplete="email"
                              autoCapitalize="none"
                              spellCheck={false}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') submitEmail();
                              }}
                            />
                          </div>
                        </label>
                        {fieldError && (
                          <div className="v2-auth-error">
                            <Icon name="alert" size={16} />
                            {error}
                          </div>
                        )}
                        <button type="button" className="v2-auth-cta" onClick={submitEmail}>
                          Continuer
                        </button>
                      </>
                    )}

                    {step === 'password' && (
                      <>
                        <label className="v2-auth-field">
                          <span className="v2-auth-label">Mot de passe</span>
                          <div className="v2-input-group">
                            <Icon name="lock" size={18} className="v2-auth-icon" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') void submitPassword();
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((current) => !current)}
                              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                              style={{ display: 'grid', placeItems: 'center', color: '#7d8ca3' }}
                            >
                              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                            </button>
                          </div>
                        </label>

                        <button type="button" className="v2-auth-link" onClick={openForgot}>
                          Mot de passe oublié ?
                        </button>

                        {fieldError && (
                          <div className="v2-auth-error">
                            <Icon name="alert" size={16} />
                            {error}
                          </div>
                        )}

                        <button
                          type="button"
                          className="v2-auth-cta"
                          onClick={() => void submitPassword()}
                          disabled={busy}
                        >
                          {busy ? <span className="v2-spinner" /> : null}
                          Se connecter
                        </button>
                      </>
                    )}

                    {step === 'biometrie' && (
                      <>
                        {messageBiometrie && (
                          <div className="v2-auth-error" role="alert">
                            <Icon name="alert" size={16} />
                            {messageBiometrie}
                          </div>
                        )}

                        <button
                          type="button"
                          className="v2-auth-cta"
                          onClick={() => void submitBiometrie()}
                          disabled={busy || !biometriePossible.disponible}
                        >
                          {busy ? <span className="v2-spinner" /> : <Icon name="key" size={18} />}
                          Valider avec ma biométrie
                        </button>

                        {!biometriePossible.disponible && (
                          <div className="v2-auth-hint" style={{ fontSize: 12.5, marginTop: 8 }}>
                            {biometriePossible.message}
                          </div>
                        )}

                        <button
                          type="button"
                          className="v2-auth-link"
                          onClick={() => {
                            setError('');
                            setMessageBiometrie('');
                            setStep('email');
                          }}
                        >
                          Utiliser email et mot de passe
                        </button>
                      </>
                    )}

                    {step === 'pin' && (
                      <>
                        <PinPad
                          value={pin}
                          onChange={(next) => {
                            setPin(next);
                            setError('');
                          }}
                          disabled={busy}
                          shake={shake}
                        />
                        {fieldError && (
                          <div className="v2-auth-error">
                            <Icon name="alert" size={16} />
                            {error}
                          </div>
                        )}
                        <button
                          type="button"
                          className="v2-auth-cta"
                          onClick={() => void submitPin()}
                          disabled={busy || pin.length < PIN_MIN_LENGTH}
                        >
                          {busy ? <span className="v2-spinner" /> : null}
                          Valider
                        </button>
                        <button
                          type="button"
                          className="v2-auth-back"
                          onClick={() => {
                            setPin('');
                            setError('');
                            setStep('password');
                          }}
                          style={{ alignSelf: 'center' }}
                        >
                          Annuler
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <footer className="v2-auth-foot">
              <div className="v2-auth-footer-actions">
                <button
                  type="button"
                  className="v2-auth-ai-trigger"
                  aria-label="Ouvrir UQ AI"
                  onClick={() => {
                    setMenuOpen(false);
                    setAiOpen(true);
                  }}
                >
                  <Icon name="sparkles" size={18} />
                </button>
                <button
                  type="button"
                  className="v2-auth-kebab"
                  aria-label={menuOpen ? 'Fermer les options' : 'Options du compte'}
                  aria-expanded={menuOpen}
                  disabled={gateBusy}
                  onClick={() => {
                    if (menuOpen) setMenuOpen(false);
                    else void ouvrirPorte();
                  }}
                >
                  <Icon name={menuOpen ? 'close' : 'more'} size={20} />
                </button>
              </div>
              <div className="v2-auth-version">v{version}</div>
            </footer>
          </div>
        </div>
      </div>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        centered
        title="Options du compte"
      >
        <div className="v2-auth-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            data-strong="true"
            onClick={() => {
              setMenuOpen(false);
              onCreateAccount();
            }}
          >
            <span className="v2-auth-menu-icon" aria-hidden="true">
              <Icon name="sparkles" size={15} />
            </span>
            Créer un compte
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setLegal('terms');
            }}
          >
            <span className="v2-auth-menu-icon" aria-hidden="true">
              <Icon name="file" size={15} />
            </span>
            Conditions d’utilisation
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setLegal('privacy');
            }}
          >
            <span className="v2-auth-menu-icon" aria-hidden="true">
              <Icon name="shield" size={15} />
            </span>
            Politique de confidentialité
          </button>
        </div>
      </Sheet>

      <Sheet
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Mot de passe oublié"
        subtitle="Recevez un lien de réinitialisation par email."
      >
        {forgotSent ? (
          <div className="v2-auth-hint" style={{ fontSize: 13.5 }}>
            Si ces informations correspondent à un compte, un email de réinitialisation sera envoyé.
          </div>
        ) : (
          <div className="v2-stack">
            <label className="v2-field">
              <span className="v2-label">Numéro UQ</span>
              <UqInput value={forgotValue} onChange={setForgotValue} />
            </label>
            <button
              type="button"
              className="v2-btn v2-btn--primary v2-btn--block"
              onClick={() => void sendForgot()}
              disabled={forgotBusy || !forgotValue.trim()}
            >
              {forgotBusy ? <span className="v2-spinner" /> : null}
              Envoyer
            </button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={gateOpen}
        onClose={fermerPorte}
        className="v2-auth-gate-sheet"
        title="Vérification de sécurité"
      >
        <div className="v2-stack v2-human-content" aria-busy={gateBusy}>
          {gateBusy && (
            <div className="v2-human-busy" role="status" aria-live="polite">
              <span className="v2-spinner" />
              <span>{gateLabel}</span>
            </div>
          )}
          {gateLock > 0 && !gateBusy && (
            <div className="v2-human-lock" role="status" aria-live="polite">
              <Icon name="shield" size={16} />
              <span>Trop d’échecs. Nouvelle vérification dans {formaterAttente(gateLock)}.</span>
            </div>
          )}
          {gateChallenge && !gateBusy && !gateError && gateLock <= 0 && (
            <div
              className="v2-human-puzzle"
              onPointerMove={enregistrerMouvementPointeur}
              onPointerDownCapture={(event) => {
                if (event.isTrusted) {
                  interaction.current.input_type =
                    event.pointerType === 'touch'
                      ? 'touch'
                      : event.pointerType === 'pen'
                        ? 'pen'
                        : event.pointerType === 'mouse'
                          ? 'mouse'
                          : 'none';
                }
              }}
              onKeyDownCapture={(event) => {
                if (event.isTrusted) interaction.current.input_type = 'keyboard';
              }}
            >
              {gateChallenge.kind === 'scene' && (
                <HumanScenePuzzle
                  objets={gateChallenge.objets}
                  cibleIdx={gateChallenge.cibleIdx}
                  desactive={gateBusy || gateLock > 0}
                  onReponse={(nombre) => void soumettreSceneNumero(nombre)}
                />
              )}
              {gateChallenge.kind === 'symboles' && (
                <>
                  <div className="v2-human-puzzle-ask">Glisse le symbole sur sa tuile</div>
                  <div
                    className={`v2-human-symbol-target${glissement ? ' is-dragging' : ''}`}
                    aria-label={`Symbole à déposer : ${HUMAN_SYMBOL_LABELS[gateChallenge.cible]}`}
                    onPointerDown={demarrerGlissement}
                    onPointerMove={suivreGlissement}
                    onPointerUp={terminerGlissement}
                    onPointerCancel={() => setGlissement(null)}
                  >
                    <HumanPuzzleSymbol symbol={gateChallenge.cible} />
                  </div>
                  <div
                    className="v2-human-symbol-grid"
                    ref={tuilesRef}
                    role="group"
                    aria-label="Emplacements des symboles"
                  >
                    {gateChallenge.symboles.map((symbol, index) => (
                      <button
                        type="button"
                        key={`${symbol}-${index}`}
                        className={`v2-human-symbol-choice${
                          glissement?.index === index ? ' is-over' : ''
                        }${gateChoice === index ? ' is-selected' : ''}`}
                        aria-label={`Déposer sur ${HUMAN_SYMBOL_LABELS[symbol]}`}
                        onClick={() => void soumettreSymbole(index)}
                        disabled={gateBusy || gateLock > 0}
                      >
                        <HumanPuzzleSymbol symbol={symbol} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {gateChallengeError && (
                <div className="v2-auth-error" role="alert">
                  <Icon name="alert" size={16} />
                  {gateChallengeError}
                </div>
              )}
              {'DeviceMotionEvent' in window && (
                <button
                  type="button"
                  className="v2-human-motion"
                  aria-pressed={motionActif}
                  aria-label="Autoriser le capteur de mouvement du téléphone"
                  onClick={() => void activerCapteursMouvement()}
                  disabled={gateBusy}
                >
                  <Icon name="shield" size={14} />
                  Capteur
                </button>
              )}
            </div>
          )}
          {glissement && gateChallenge?.kind === 'symboles' && (
            <div
              className="v2-human-ghost"
              style={{ left: glissement.x, top: glissement.y }}
              aria-hidden="true"
            >
              <HumanPuzzleSymbol symbol={gateChallenge.cible} />
            </div>
          )}
          {gateMode === 'turnstile' && !gateError && (
            <>
              {!gateBusy && (
                <div className="v2-human-busy" role="status" aria-live="polite">
                  <span className="v2-spinner" />
                  <span>Chargement de la vérification…</span>
                </div>
              )}
              <div className="v2-human-turnstile" ref={turnstileHost} />
            </>
          )}
          {gateError && (
            <div className="v2-auth-error" role="alert">
              <Icon name="alert" size={16} />
              {gateError}
            </div>
          )}
          {gateError && (
            <button
              type="button"
              className="v2-btn v2-btn--sm v2-btn--outline v2-btn--block"
              onClick={() => void ouvrirPorte()}
              disabled={gateBusy}
            >
              <Icon name="refresh" size={18} />
              Réessayer
            </button>
          )}
          {gateBusy && (
            <button
              type="button"
              className="v2-btn v2-btn--sm v2-btn--outline v2-btn--block"
              onClick={fermerPorte}
            >
              Annuler
            </button>
          )}
        </div>
      </Sheet>

      <Sheet
        open={legal !== null}
        onClose={() => setLegal(null)}
        className="v2-auth-gate-sheet"
        title={legal === 'privacy' ? 'Politique de confidentialité' : 'Conditions d’utilisation'}
        subtitle="Document officiel"
      >
        <div className="v2-auth-hint" style={{ fontSize: 13.5 }}>
          Le document officiel n’est pas encore publié dans l’application. Il sera accessible ici dès sa
          mise en ligne par l’équipe UQ.
        </div>
      </Sheet>
      <AuthAiSheet open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
