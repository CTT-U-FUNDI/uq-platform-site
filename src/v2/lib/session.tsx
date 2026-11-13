import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authResume, getMe, getPreferences, setPreferences } from './api';
import { authentifierParPasskey, lireCleAppareil, oublierCleAppareil } from './webauthn';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'auto';
export type FontSizePreference = 'small' | 'medium' | 'large' | 'xlarge';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'default' | 'success' | 'error';
}

/** Palier decide par le serveur pour « ce numero + cette cle de l'appareil ». */
export type PalierConnexion = 'auto' | 'biometrie' | 'complet' | 'aucun_appareil';

export interface ResultatReprise {
  palier: PalierConnexion;
  ok: boolean;
  /** Ce que le serveur a explique (age de la derniere connexion, plafond 30 j...). */
  motif?: string;
  message?: string;
}

interface SessionContextValue {
  ready: boolean;
  authenticated: boolean;
  uq: string;
  pseudo: string;
  email: string;
  displayName: string;
  isOwner: boolean;
  /** Role porte par le JWT : "guardian" pour le proprietaire, "user" sinon. */
  role: string;
  /** Vrai si le JWT ouvre les routes reservees (guardian / owner / admin). */
  isGuardian: boolean;
  /**
   * Numero UQ du dernier compte ouvert sur cet appareil. Sert a pre-remplir la
   * saisie : le serveur seul decide si ce numero suffit ou non.
   */
  numeroMemorise: string;
  theme: ThemeMode;
  themePreference: ThemePreference;
  fontScale: FontSizePreference;
  displayUnit: string;
  toasts: ToastItem[];
  toast: (message: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: number) => void;
  completeLogin: (token: string) => Promise<void>;
  /** Reprise selon le palier serveur : rien, biometrie, ou controle complet. */
  reprendre: (uqNumber?: string) => Promise<ResultatReprise>;
  /** Le palier du serveur, sans ceremonie : a appeler au montage d'un ecran. */
  consulterPalier: (uqNumber?: string) => Promise<ResultatReprise>;
  signOut: () => void;
  /** Oublie la cle de cet appareil : la biometrie ne pourra plus reprendre. */
  oublierCetAppareil: () => void;
  refreshProfile: () => Promise<void>;
  setThemePreference: (preference: ThemePreference) => void;
  setFontScale: (value: FontSizePreference) => void;
  setDisplayUnit: (value: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE = {
  token: 'uq_token',
  uq: 'uq_number',
  pseudo: 'uq_pseudo',
  email: 'uq_email',
  name: 'uq_name',
  owner: 'uq_is_owner',
  theme: 'uq_theme',
  /**
   * Seul survit a la deconnexion. C'est un souvenir de saisie, pas un droit :
   * le numero reapparait dans le champ, et le serveur decide s'il suffit.
   */
  dernierCompte: 'uq_dernier_compte',
};

const systemTheme = (): ThemeMode =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const resolveTheme = (preference: ThemePreference): ThemeMode =>
  preference === 'auto' ? systemTheme() : preference;

const readThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(STORAGE.theme);
  return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto';
};

const clearStoredSession = () => {
  [
    'uq_token',
    'uq_number',
    'uq_pseudo',
    'uq_email',
    'uq_name',
    'uq_account',
    'uq_is_owner',
    'uq_guardian_token',
    'uq_switched_from',
  ].forEach((key) => localStorage.removeItem(key));
};

/** Roles qui ouvrent le coffre proprietaire cote backend (ROLES_OWNER). */
const OWNER_ROLES = ['guardian', 'owner', 'admin'];

/**
 * Lit la charge utile du JWT (aucune verification de signature : le backend
 * reste seul juge). Sert a choisir le coffre affiche et a eviter de pretendre
 * qu'une session est ouverte alors qu'elle est expiree.
 */
const decodeJwtPayload = (token: string | null): { role?: string; exp?: number } => {
  if (!token) return {};
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};
    const normalised = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded)) as { role?: string; exp?: number };
    return {
      role: typeof decoded.role === 'string' && decoded.role ? decoded.role : undefined,
      exp: typeof decoded.exp === 'number' ? decoded.exp : undefined,
    };
  } catch {
    return {};
  }
};

const decodeJwtRole = (token: string | null): string => decodeJwtPayload(token).role || 'user';

/** Le JWT est-il expire (horloge locale, marge de 30 s en faveur de la prudence) ? */
const jwtExpire = (token: string | null): boolean => {
  const { exp } = decodeJwtPayload(token);
  if (!exp) return false;
  return exp * 1000 <= Date.now() + 30_000;
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [uq, setUq] = useState(() => localStorage.getItem(STORAGE.uq) || '');
  const [pseudo, setPseudo] = useState(() => localStorage.getItem(STORAGE.pseudo) || '');
  const [email, setEmail] = useState(() => localStorage.getItem(STORAGE.email) || '');
  const [displayName, setDisplayName] = useState(() => localStorage.getItem(STORAGE.name) || '');
  const [isOwner, setIsOwner] = useState(() => localStorage.getItem(STORAGE.owner) === 'true');
  const [numeroMemorise, setNumeroMemorise] = useState(
    () => localStorage.getItem(STORAGE.dernierCompte) || localStorage.getItem(STORAGE.uq) || '',
  );
  const [role, setRole] = useState(() => decodeJwtRole(localStorage.getItem(STORAGE.token)));
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(readThemePreference);
  const [theme, setTheme] = useState<ThemeMode>(() => resolveTheme(readThemePreference()));
  const [fontScale, setFontScaleState] = useState<FontSizePreference>(
    (localStorage.getItem('uq_font_size') as FontSizePreference) || 'medium',
  );
  const [displayUnit, setDisplayUnitState] = useState<string>(
    localStorage.getItem('uq_display_unit') || 'BORB',
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastItem['tone'] = 'default') => {
      if (!message) return;
      const id = toastId.current + 1;
      toastId.current = id;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((entry) => entry.id !== id));
      }, 3600);
    },
    [],
  );

  const applyPreferences = useCallback((preferences: Record<string, unknown> | undefined) => {
    if (!preferences) return;
    const nextTheme = preferences.theme;
    if (nextTheme === 'light' || nextTheme === 'dark' || nextTheme === 'auto') {
      localStorage.setItem(STORAGE.theme, nextTheme);
      setThemePreferenceState(nextTheme);
      setTheme(resolveTheme(nextTheme));
    }
    const nextFont = preferences.font_size;
    if (nextFont === 'small' || nextFont === 'medium' || nextFont === 'large' || nextFont === 'xlarge') {
      localStorage.setItem('uq_font_size', nextFont);
      setFontScaleState(nextFont);
    }
    const nextUnit = preferences.display_unit;
    if (typeof nextUnit === 'string' && nextUnit) {
      localStorage.setItem('uq_display_unit', nextUnit);
      setDisplayUnitState(nextUnit);
    }
    const nextLanguage = preferences.language;
    if (typeof nextLanguage === 'string') localStorage.setItem('uq_language', nextLanguage);
  }, []);

  const refreshProfile = useCallback(async () => {
    const me = await getMe();
    if (!me?.me) throw new Error('Profil indisponible');
    const identity = me.identity || {};
    const nextUq = me.me.uq_number || localStorage.getItem(STORAGE.uq) || '';
    const nextPseudo = me.me.pseudo || '';
    const nextEmail = me.me.email || '';
    const nextName =
      `${identity.prenom || ''} ${identity.nom || ''}`.trim() || me.me.pseudo || nextUq;
    setUq(nextUq);
    setPseudo(nextPseudo);
    setEmail(nextEmail);
    setDisplayName(nextName);
    setIsOwner(Boolean(me.me.is_owner));
    localStorage.setItem(STORAGE.uq, nextUq);
    localStorage.setItem(STORAGE.pseudo, nextPseudo);
    localStorage.setItem(STORAGE.email, nextEmail);
    localStorage.setItem(STORAGE.name, nextName);
    if (nextUq) localStorage.setItem(STORAGE.dernierCompte, nextUq);
    setNumeroMemorise(nextUq || localStorage.getItem(STORAGE.dernierCompte) || '');
    if (me.me.is_owner) localStorage.setItem(STORAGE.owner, 'true');
    else localStorage.removeItem(STORAGE.owner);
    // La bascule ne demande jamais le numero du proprietaire : il est retenu
    // des qu'une session proprietaire est ouverte sur ce terminal.
    if (me.me.is_owner && nextUq) localStorage.setItem('uq_linked_owner', nextUq);
  }, []);

  const completeLogin = useCallback(
    async (token: string) => {
      localStorage.setItem(STORAGE.token, token);
      const nextRole = decodeJwtRole(token);
      setRole(nextRole);
      // Une connexion non-proprietaire ferme toute session gardien residuelle :
      // le coffre proprietaire ne doit jamais survivre a un autre compte.
      if (!OWNER_ROLES.includes(nextRole)) localStorage.removeItem('uq_guardian_token');
      setAuthenticated(true);
      try {
        await refreshProfile();
      } catch {
        // Le token est valide mais /api/me peut echouer : on garde la session.
      }
      const numero = localStorage.getItem(STORAGE.uq) || '';
      if (numero) {
        localStorage.setItem(STORAGE.dernierCompte, numero);
        setNumeroMemorise(numero);
      }
      try {
        const currentUq = localStorage.getItem(STORAGE.uq) || '';
        if (currentUq) {
          const preferences = await getPreferences(currentUq);
          applyPreferences(preferences?.preferences as Record<string, unknown> | undefined);
        }
      } catch {
        // Preferences optionnelles.
      }
      setReady(true);
    },
    [applyPreferences, refreshProfile],
  );

  /**
   * Interroge le serveur sur le palier de CE numero + CETTE cle, sans rien
   * signer. Appelé au montage de l'ecran : une ceremonie WebAuthn doit partir
   * d'un geste de l'utilisateur, sinon le navigateur l'annule.
   */
  const consulterPalier = useCallback(
    async (uqNumero?: string): Promise<ResultatReprise> => {
      const numero = (uqNumero || localStorage.getItem(STORAGE.uq) || numeroMemorise || '').trim();
      if (!numero) {
        return { palier: 'complet', ok: false, motif: 'Saisissez votre numéro UQ pour reprendre.' };
      }

      const cle = lireCleAppareil();
      if (!cle) {
        return {
          palier: 'aucun_appareil',
          ok: false,
          motif: 'Aucune clé biométrique n’est mémorisée sur cet appareil.',
        };
      }

      let reprise;
      try {
        reprise = await authResume(numero, cle);
      } catch {
        return {
          palier: 'complet',
          ok: false,
          motif: 'Serveur injoignable : la reprise ne peut pas être confirmée.',
        };
      }

      if (reprise.httpStatus === 404) {
        return { palier: 'aucun_appareil', ok: false, motif: reprise.message || 'Compte introuvable.' };
      }

      // Le serveur est seul juge du palier. Une erreur 500 ou un champ absent ne
      // doit jamais déboucher sur une connexion plus douce : on retombe sur le
      // contrôle complet.
      const palier: PalierConnexion =
        reprise.palier === 'auto' ||
        reprise.palier === 'biometrie' ||
        reprise.palier === 'complet' ||
        reprise.palier === 'aucun_appareil'
          ? reprise.palier
          : 'complet';

      return { palier, ok: false, motif: reprise.motif || reprise.message };
    },
    [numeroMemorise],
  );

  const reprendre = useCallback(
    async (uqNumero?: string): Promise<ResultatReprise> => {
      const consultation = await consulterPalier(uqNumero);
      const numero = (uqNumero || localStorage.getItem(STORAGE.uq) || numeroMemorise || '').trim();
      if (consultation.palier === 'complet' || consultation.palier === 'aucun_appareil') {
        return consultation;
      }

      const tentative = await authentifierParPasskey(numero, lireCleAppareil());
      if (tentative.ok && tentative.token) {
        await completeLogin(tentative.token);
        return {
          palier: consultation.palier,
          ok: true,
          motif: consultation.motif,
          message: tentative.message,
        };
      }

      if (tentative.palier === 'complet') {
        return {
          palier: 'complet',
          ok: false,
          motif: tentative.message || 'Le serveur exige un contrôle complet pour cet appareil.',
        };
      }

      return {
        palier: consultation.palier,
        ok: false,
        motif: consultation.motif,
        message: tentative.message,
      };
    },
    [completeLogin, consulterPalier, numeroMemorise],
  );

  const oublierCetAppareil = useCallback(() => {
    oublierCleAppareil();
    localStorage.removeItem(STORAGE.dernierCompte);
    setNumeroMemorise('');
  }, []);

  const signOut = useCallback(() => {
    clearStoredSession();
    setAuthenticated(false);
    setUq('');
    setPseudo('');
    setEmail('');
    setDisplayName('');
    setIsOwner(false);
    setRole('user');
    localStorage.removeItem(STORAGE.theme);
    setThemePreferenceState('auto');
    setTheme(systemTheme());
  }, []);

  // Verification de session au demarrage
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = localStorage.getItem(STORAGE.token);
      if (!token) {
        if (!cancelled) setReady(true);
        return;
      }
      // Un JWT expire n'est pas une session : le rendre visible ferait croire a
      // l'utilisateur qu'il est connecté alors que chaque appel sera refuse.
      if (jwtExpire(token)) {
        clearStoredSession();
        setRole('user');
        if (!cancelled) setReady(true);
        return;
      }
      if (!OWNER_ROLES.includes(decodeJwtRole(token))) {
        localStorage.removeItem('uq_guardian_token');
      }
      try {
        await refreshProfile();
        if (!cancelled) setAuthenticated(true);
        const currentUq = localStorage.getItem(STORAGE.uq) || '';
        if (currentUq) {
          try {
            const preferences = await getPreferences(currentUq);
            if (!cancelled) {
              applyPreferences(preferences?.preferences as Record<string, unknown> | undefined);
            }
          } catch {
            // ignore
          }
        }
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          clearStoredSession();
          setRole('user');
        }
        // Toute autre erreur (reseau, 500) : on ne pretend pas que la session est
        // ouverte. L'ecran de connexion reprendra par le palier serveur.
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyPreferences, refreshProfile]);

  // Suivi du theme systeme quand la preference est "auto"
  useEffect(() => {
    if (themePreference !== 'auto') return;
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const handler = () => setTheme(query.matches ? 'dark' : 'light');
    query.addEventListener?.('change', handler);
    return () => query.removeEventListener?.('change', handler);
  }, [themePreference]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    localStorage.setItem(STORAGE.theme, preference);
    setThemePreferenceState(preference);
    setTheme(resolveTheme(preference));
    const currentUq = localStorage.getItem(STORAGE.uq);
    if (currentUq) {
      setPreferences({ uq_number: currentUq, theme: preference }).catch(() => undefined);
    }
  }, []);

  const setFontScale = useCallback((value: FontSizePreference) => {
    localStorage.setItem('uq_font_size', value);
    setFontScaleState(value);
    const currentUq = localStorage.getItem(STORAGE.uq);
    if (currentUq) {
      setPreferences({ uq_number: currentUq, font_size: value }).catch(() => undefined);
    }
  }, []);

  const setDisplayUnit = useCallback((value: string) => {
    localStorage.setItem('uq_display_unit', value);
    setDisplayUnitState(value);
    const currentUq = localStorage.getItem(STORAGE.uq);
    if (currentUq) {
      setPreferences({ uq_number: currentUq, display_unit: value }).catch(() => undefined);
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ready,
      authenticated,
      uq,
      pseudo,
      email,
      displayName,
      isOwner,
      role,
      isGuardian: OWNER_ROLES.includes(role),
      numeroMemorise,
      theme,
      themePreference,
      fontScale,
      displayUnit,
      toasts,
      toast,
      dismissToast,
      completeLogin,
      reprendre,
      consulterPalier,
      signOut,
      oublierCetAppareil,
      refreshProfile,
      setThemePreference,
      setFontScale,
      setDisplayUnit,
    }),
    [
      ready,
      authenticated,
      uq,
      pseudo,
      email,
      displayName,
      isOwner,
      role,
      numeroMemorise,
      theme,
      themePreference,
      fontScale,
      displayUnit,
      toasts,
      toast,
      dismissToast,
      completeLogin,
      reprendre,
      consulterPalier,
      signOut,
      oublierCetAppareil,
      refreshProfile,
      setThemePreference,
      setFontScale,
      setDisplayUnit,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession doit etre utilise dans SessionProvider');
  return context;
}
