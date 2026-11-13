import apiClient, { apiFetch, apiUrl } from '../../api/client';
import type { SeriesPeriod } from './charts';
import type { MiniSite as VitrineSite } from './site-model';

/**
 * Couche d'acces backend de la v2.
 * Les endpoints et les payloads sont ceux du backend Rust (Actix).
 * Rien n'est invente ici : chaque fonction correspond a une route existante.
 */

// ==================== Types ====================

export interface BalanceUnit {
  position: number;
  unit: string;
  name: string;
  value: number;
  rate: number;
  description?: string;
  display?: string;
}

export interface BorbBalance {
  status: string;
  account: string;
  balance: {
    bubbles: number;
    points: number;
    frozen_points: number;
    borb_total: number;
    display: string;
  };
  units: BalanceUnit[];
}

export interface WalletEntry {
  code: string;
  balance: number;
  borb_equivalent?: number;
  available_balance?: number;
  balance_points?: number;
  frozen?: number;
  transferable?: boolean;
}

/** Devise reellement detenue apres conversion (lecture seule). */
export interface WalletCurrency {
  code: string;
  balance: number;
}

export interface WalletsResponse {
  status: string;
  uq: string;
  wallets: WalletEntry[];
  total_borb: number;
  transferable_borb: number;
  borb_reserve?: number;
  borb_available: number;
  display_currency?: string;
  receive_currency?: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  fee: number;
  counterparty: string;
  timestamp: number;
  status: string;
  borb_id?: string;
  block_number?: number;
}

export interface CaseStat {
  name: string;
  percentage: number;
  balance: number;
}

/**
 * Element Zando tel que renvoye par /api/zando/items.
 * Le proprietaire de l'element est `shop_id` (c'est ce que le backend ecrit
 * dans shop_items) ; `seller_id` n'existe pas dans la reponse et `created_at`
 * non plus : les deux restent optionnels pour ne pas mentir sur la charge utile.
 */
export interface ZandoItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  price_borb: number;
  price_usd?: number;
  category: string;
  media_urls: string | null;
  type?: string;
  shop_id?: string;
  seller_id?: string;
  seller_pseudo?: string;
  created_at?: number | string;
  published_at?: string | null;
  /** Fin de la fenêtre de 48 h d'une vente solo. */
  expires_at?: string | null;
  published?: boolean;
  /** Vente solo confirmée : l'objet a quitté le flux pour toujours. */
  sold?: boolean;
  sold_at?: string | null;
  /** Nombre de modifications déjà utilisées (2 maximum). */
  edit_count?: number;
  edited_at?: string | null;
  rating?: number;
  review_count?: number;
  comment_count?: number;
  share_count?: number;
  /** Compteurs calculés par /api/zando/items/{shop_id} (absents de la liste globale). */
  view_count?: number;
  like_count?: number;
  commission_enabled?: boolean;
  commission_rate?: number;
}

/** Proprietaire d'un element Zando (shop_id cote backend, seller_id en secours). */
export const zandoOwner = (item: ZandoItem | null | undefined): string =>
  String(item?.shop_id || item?.seller_id || '');

/**
 * Horodatage d'un element Zando. Le backend renvoie des dates SQLite
 * (`YYYY-MM-DD HH:MM:SS`) ; l'identifiant `item_<nanosecondes>` reste le
 * dernier recours pour les anciennes lignes. Le resultat est en millisecondes
 * pour que `relativeDay` et les tris restent justes.
 */
export const zandoStamp = (item: ZandoItem | null | undefined): number => {
  if (!item) return 0;
  const raw = item.created_at;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 1e12 ? raw : raw * 1000;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
    const parsed = Date.parse(`${raw.trim().replace(' ', 'T')}Z`);
    if (Number.isFinite(parsed)) return parsed;
  }
  const match = /^item_(\d+)$/.exec(item.id || '');
  return match ? Math.round(Number(match[1]) / 1e6) : 0;
};

/** Date SQLite (`YYYY-MM-DD HH:MM:SS`, UTC) -> millisecondes. */
export const sqlStamp = (value: string | null | undefined): number => {
  if (!value) return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric > 1e12 ? numeric : numeric * 1000;
  }
  const parsed = Date.parse(`${value.trim().replace(' ', 'T')}Z`);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Identite publique d'un compte : GET /api/account/{uq}/public.
 * Le numero UQ reste un identifiant technique (connexion, API, liens) :
 * l'interface affiche `display`, `pseudo` ou `name`, jamais le numero.
 */
export interface PublicIdentity {
  status?: string;
  pseudo?: string;
  name?: string;
  display?: string;
  avatar_url?: string;
}

export const getPublicIdentity = (uq: string) =>
  apiClient
    .get<PublicIdentity>(`/api/account/${encodeURIComponent(uq)}/public`)
    .then(unwrap)
    .catch(() => null);

/**
 * Resolution d'un destinataire par pseudo : GET /api/account/public/{pseudo}.
 * `existe` est faux (HTTP 404) quand aucun compte ne correspond.
 */
export interface PublicPseudoResponse {
  status?: string;
  existe?: boolean;
  pseudo?: string;
  name?: string;
  display?: string;
  avatar_url?: string;
  message?: string;
}

export const lookupPublicPseudo = (pseudo: string) =>
  apiClient
    .get<PublicPseudoResponse>(
      `/api/account/public/${encodeURIComponent(pseudo.trim().replace(/^@/, ''))}`,
    )
    .then(unwrap);

export interface ChatConversation {
  peer_id: string;
  last_message: string;
  timestamp: number;
  /** Messages recus pas encore relus — comptés côté serveur. */
  non_lus?: number;
  /** Le correspondant a appelé une route chat dans la fenêtre de présence. */
  en_ligne?: boolean;
  /** La discussion est en mode auto-destruction. */
  ephemere?: boolean;
}

export interface ChatMessage {
  id?: number;
  sender?: string;
  from_user?: string;
  recipient?: string;
  content: string;
  /** Photo jointe (data URL locale), jamais stockee sur un cloud. */
  image?: string | null;
  /** Vrai quand le destinataire a ouvert la discussion. */
  delivered?: boolean;
  /** Fin de vie d'un message éphémère ; absent = persistant. */
  expires_at?: number | null;
  timestamp: number;
  [key: string]: unknown;
}

export interface ChatGroup {
  group_id: string;
  name: string;
  description: string;
  type: 'channel' | 'group' | string;
  visibility: string;
  role: string;
  is_member: boolean;
  member_count: number;
}

export interface SystemMessage {
  profile_code: string;
  type: string;
  content: string;
  timestamp: number;
}

export interface Preferences {
  language?: 'fr' | 'en' | 'es' | 'sw';
  theme?: 'dark' | 'light' | 'auto';
  font_size?: 'small' | 'medium' | 'large' | 'xlarge';
  display_unit?: string;
  privacy_real_name?: 'private' | 'friends' | 'public';
  privacy_description?: 'private' | 'friends' | 'public';
  privacy_city?: 'private' | 'friends' | 'public';
  privacy_origin_city?: 'private' | 'friends' | 'public';
  privacy_occupation?: 'private' | 'friends' | 'public';
  privacy_marital_status?: 'private' | 'friends' | 'public';
  privacy_mobile_money_number?: 'private' | 'friends' | 'public';
  privacy_trading_currency?: 'private' | 'friends' | 'public';
  notify_chat?: boolean | string;
  notify_wallet?: boolean | string;
  notify_trading?: boolean | string;
  notify_zando?: boolean | string;
  notify_system?: boolean | string;
  /** Autorisation du prélèvement continu de présence des boutiques. */
  robinet_vitrine?: boolean | string;
}

export interface Me {
  uq_number?: string;
  email?: string;
  pseudo?: string;
  is_owner?: boolean;
  code_promo?: string;
  created_at?: number;
  kyc_verified?: boolean;
  cadenas?: string;
  public_key?: string;
  sexe?: string;
  ville_provenance?: string;
  ville_actuelle?: string;
  statut_marital?: string;
  photo_url?: string;
  description?: string;
  emploi?: string;
  mobile_money_number?: string;
  mobile_money_operator?: string;
  date_naissance?: string;
}

export interface MeResponse {
  status: string;
  me: Me;
  identity?: { prenom?: string; nom?: string; sexe?: string; date_naissance?: string };
  message?: string;
}

export interface Prices {
  borb_usd?: number;
  btc_usd?: number;
  gold_usd_per_ounce?: number;
  eth_usd?: number;
  [key: string]: number | string | undefined;
}

/** Ligne de /api/account/devices/{uq} : `device` est le nom de l'appareil. */
export interface Device {
  device: string;
  ip: string;
  last_seen: number;
}

export interface KycStatus {
  status?: string;
  state?: string;
  verified?: boolean;
  [key: string]: unknown;
}

// ==================== Helpers ====================

const unwrap = <T,>(response: { data: T }): T => response.data;

// ==================== Cache hors-ligne des taux ====================
//
// Le téléphone peut perdre le réseau alors que le moteur, lui, a bien capté
// des taux : la dernière réponse réellement reçue est gardée localement et
// resservie en disant honnêtement depuis quand elle n'a pas été rafraîchie.
// Ce n'est pas un repli inventé : si rien n'a jamais été reçu, la lecture
// échoue et l'écran affiche « indisponible ».

const CLE_CACHE_TAUX = 'uq_taux_cache';

export interface OracleFiatResponse {
  rates?: Record<string, number>;
  units_per_usd?: number;
  /** Devises declarees par l'oracle (fiat puis crypto). */
  devises?: string[];
  /** `crypto` = nombre de devises crypto placees en fin de `devises`. */
  categories?: Record<string, number>;
  /** Provenance du taux agrégé : "bcc", "mediane", "stale"… */
  source?: string;
  /** Libellé de provenance calculé par le backend, jamais par l'app. */
  badge?: string;
  updated_at?: number;
  age_secs?: number;
  nb_sources?: number;
  /** Prix interne d'1 BORB/BORB en USD, publié par le régulateur. */
  borb_usd?: number;
  /** Devises resservies ce cycle depuis leur dernière observation réelle. */
  devises_rejouees?: number;
  /**
   * Parité publiée par le moteur : `points_par_borb` est le diviseur du grand
   * livre, `usd_par_borb` le prix interne du BORB. L'app ne les recalcule pas.
   */
  parite?: { points_par_borb?: number; usd_par_borb?: number };
  /** Par devise : provenance, fraîcheur et sources réellement nourricières. */
  details?: Record<
    string,
    {
      origines?: string[];
      officiel_bcc?: number;
      valeur?: number;
      source?: string;
      badge?: string;
      observe_a?: number;
      age_secs?: number;
    }
  >;
  /** Renseigné seulement quand la réponse vient du cache local. */
  hors_ligne?: boolean;
}

export interface PriceAllResponse {
  prices?: Prices;
  source?: Record<string, string>;
  updated_at?: number;
  /** Fraîcheur de la capture marché (or, BTC). */
  age_secs?: number;
  badge?: string;
  /** Renseigné seulement quand la réponse vient du cache local. */
  hors_ligne?: boolean;
}

function badgePerime(ageSecs: number): string {
  const heures = ageSecs / 3600;
  if (heures >= 48) return `Dernier taux connu (capté il y a ${Math.round(heures / 24)} jours)`;
  if (heures >= 1) return `Dernier taux connu (capté il y a ${Math.round(heures)} h)`;
  return 'Dernier taux connu (capté à l’instant)';
}

/** Relit la dernière réponse connue ; null si l'app n'a jamais reçu ce taux. */
function lireCacheTaux(cle: string): { reponse: unknown; recu_a: number } | null {
  try {
    const brut = localStorage.getItem(`${CLE_CACHE_TAUX}:${cle}`);
    if (!brut) return null;
    const lu = JSON.parse(brut) as { reponse?: unknown; recu_a?: number };
    if (!lu || !lu.reponse || !lu.recu_a) return null;
    return { reponse: lu.reponse, recu_a: lu.recu_a };
  } catch {
    return null;
  }
}

export function ecrireCacheTaux(cle: string, reponse: unknown): void {
  try {
    localStorage.setItem(
      `${CLE_CACHE_TAUX}:${cle}`,
      JSON.stringify({ reponse, recu_a: Date.now() }),
    );
  } catch {
    // Quota dépassé ou stockage coupé : le cache est un confort, pas une fonction vitale.
  }
}

/**
 * Réponse relue du cache, réétiquetée : la provenance du taux reste celle
 * publiée par le moteur, mais le libellé doit dire qu'il n'a pas été rafraîchi.
 *
 * `surcharge` évite d'écraser un champ dont le type dépend de la route : le
 * `source` de l'oracle fiat est une chaîne ("mediane", "bcc"), celui de
 * /api/price/all est un objet { gold, btc }.
 */
export function reponseHorsLigne<T>(cle: string, surcharge?: Record<string, unknown>): T {
  const cache = lireCacheTaux(cle);
  if (!cache) throw new Error(`Aucun taux « ${cle} » connu hors-ligne`);
  const ageSecs = Math.max(0, Math.round((Date.now() - cache.recu_a) / 1000));
  return {
    ...(cache.reponse as Record<string, unknown>),
    ...surcharge,
    badge: badgePerime(ageSecs),
    age_secs: ageSecs,
    hors_ligne: true,
  } as T;
}

/**
 * Vrai quand aucune réponse HTTP n'est arrivée (réseau coupé, backend éteint).
 *
 * La nuance compte : une route qui répond 503 « TAUX_INDISPONIBLE » ou 401
 * n'est pas une coupure. Resservir le cache dans ce cas afficherait un vieux
 * taux en le présentant comme la conséquence d'un problème de réseau.
 */
export function sansReponseHttp(error: unknown): boolean {
  const candidate = error as { response?: unknown; status?: number };
  return !candidate?.response && !candidate?.status;
}

/**
 * Parité points -> BORB lue sur l'oracle, jamais recopiee dans l'app.
 *
 * Le grand livre compte en points et l'ecran affiche du BORB : le diviseur
 * appartient au backend (`parite.points_par_borb` de /api/oracle/fiat). La
 * derniere valeur recue est gardee localement, comme les taux, pour que les
 * montants du grand livre continuent de se convertir pendant une coupure.
 * Une valeur inconnue ne devient jamais 1 pour 1 : elle rend le montant
 * explicitement indisponible.
 */
const CLE_PARITE = 'uq_parite_points';
let pariteLue: number | null = null;

/** Parité connue ; 0 = le moteur ne l'a jamais transmise sur cet appareil. */
export const paritePointsParBorb = (): number => {
  if (pariteLue !== null) return pariteLue;
  try {
    pariteLue = Number(localStorage.getItem(CLE_PARITE)) || 0;
  } catch {
    pariteLue = 0;
  }
  return pariteLue;
};

function memoriserParite(valeurInconnue: unknown): void {
  const valeur = Number(valeurInconnue) || 0;
  if (valeur <= 0) return;
  pariteLue = valeur;
  try {
    localStorage.setItem(CLE_PARITE, String(valeur));
  } catch {
    // Storage coupé : la valeur reçue reste valable pour la session.
  }
}

/**
 * Ecriture du grand livre -> BORB affiche. `null` quand la parite n'a jamais
 * ete recue : l'appelant doit afficher « indisponible », pas `0 / 100`.
 */
export const pointsVersBorb = (
  points: number | string | null | undefined,
): number | null => {
  const parite = paritePointsParBorb();
  if (!parite) return null;
  return Number(points || 0) / parite;
};

export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function describeError(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof ApiError) return error.message;
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      response?: { data?: { message?: string; code?: string }; status?: number };
      message?: string;
    };
    return candidate.response?.data?.message || candidate.message || fallback;
  }
  return fallback;
}

export function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { response?: { data?: { code?: string } } };
    return candidate.response?.data?.code;
  }
  return undefined;
}

// ==================== Compte / session ====================

export const getMe = () => apiClient.get<MeResponse>('/api/me').then(unwrap);

// Pas de helper ici : /api/guardian/status est en GET (et exige la cle terminal),
// il est expose plus bas par `guardianStatus`.

export const logoutRequest = () => apiClient.post('/api/logout').then(unwrap);

export const getPreferences = (uq: string) =>
  apiClient
    .get<{ preferences?: Preferences }>(`/api/account/preferences/${encodeURIComponent(uq)}`)
    .then(unwrap);

export const setPreferences = (payload: Partial<Preferences> & { uq_number: string }) =>
  apiClient.post('/api/account/preferences', payload).then(unwrap);

export const setFontSize = (uq_number: string, font_size: string) =>
  apiClient.post('/api/account/font-size/set', { uq_number, font_size }).then(unwrap);

export const setCurrencyPreferences = (payload: {
  uq_number: string;
  display_currency?: string;
  receive_currency?: string;
}) => apiClient.post('/api/account/preferences/currency', payload).then(unwrap);

export const updateProfile = (payload: Record<string, unknown>) =>
  apiClient.post('/api/account/profile/update', payload).then(unwrap);

export const getAvatar = (uq_number: string) =>
  apiClient.post<{ avatar_url?: string }>('/api/account/avatar/get', { uq_number }).then(unwrap);

/**
 * Plafond du handler /api/account/avatar/set : 1 500 000 caracteres
 * (URL ou data URI base64 compris). Au-dela le backend repond 413.
 */
export const AVATAR_MAX_CHARS = 1_500_000;

/**
 * Plafond d'un media Zando. `media_urls` est une chaine JSON : la photo
 * importee y voyage en data URI. La charge utile reste sous la limite JSON
 * du serveur (mesuree en direct : 2 Mo, 413 au-dela).
 */
export const MEDIA_MAX_CHARS = 1_500_000;

/** `avatar` accepte une URL http ou un data URI base64 (import PNG). */
export const setAvatar = (uq_number: string, avatar: string) =>
  apiClient.post('/api/account/avatar/set', { uq_number, avatar }).then(unwrap);

export const getDevices = (uq: string) =>
  apiClient.get<{ devices?: Device[] }>(`/api/account/devices/${encodeURIComponent(uq)}`).then(unwrap);

export const revokeDevice = (uq_number: string, device: string) =>
  apiClient.post('/api/account/devices/revoke', { uq_number, device }).then(unwrap);

/** Identite privee du compte + contacts de recuperation (route garde JWT). */
export interface AccountInfosResponse {
  status: string;
  uq_number?: string;
  email?: string;
  pseudo?: string;
  code_promo?: string;
  is_owner?: boolean;
  created_at?: number;
  recovery_email?: string;
  recovery_phone?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
}

export const getAccountInfos = (uq: string) =>
  apiClient
    .get<AccountInfosResponse>(`/api/account/infos/${encodeURIComponent(uq)}`)
    .then(unwrap);

// ==================== Authentification ====================

export interface Step1Response {
  status?: string;
  session_id?: string;
  tfa_token?: string;
  is_owner?: boolean;
  attempts?: number;
  message?: string;
}

export interface Step2Response {
  status?: string;
  step?: number;
  tfa_token?: string;
  is_owner?: boolean;
  attempts_ok?: number;
  next_attempt?: number;
  message?: string;
}

export interface FinalizeResponse {
  status?: string;
  token?: string;
  uq_number?: string;
  uq_email?: string;
  uq_pseudo?: string;
  display_name?: string;
  account?: Record<string, unknown>;
  message?: string;
}

/**
 * POST /api/secure/step1
 * `switchFrom` reproduit l'en-tete X-Switch-From du backend : il n'autorise une
 * session que pour un membre de cercle bascule depuis son proprietaire.
 */
export const authStep1 = (uq_number: string, switchFrom?: string) =>
  apiClient
    .post<Step1Response>(
      '/api/secure/step1',
      { uq_number },
      {
        validateStatus: () => true,
        headers: switchFrom ? { 'X-Switch-From': switchFrom } : undefined,
      },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const authStep2 = (
  session_id: string,
  tfa_token: string,
  email: string,
  password: string,
) =>
  apiClient
    .post<Step2Response>(
      '/api/secure/step2',
      // L'email saisi est compare au compte cote serveur : il fait partie des
      // identifiants, ce n'est pas un champ decoratif.
      { session_id, tfa_token, email, password },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const authLoginPin = (session_id: string, tfa_token: string, login_pin: string) =>
  apiClient
    .post<Step2Response>(
      '/api/secure/step-login-pin',
      { session_id, tfa_token, login_pin },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const authFinalize = (
  isOwner: boolean,
  session_id: string,
  tfa_token: string,
  credential_id = '',
) =>
  apiClient
    .post<FinalizeResponse>(
      isOwner ? '/api/secure/finalize-owner' : '/api/secure/finalize-user',
      // credential_id : la cle deja enregistree sur CET appareil, si elle existe.
      // Le serveur s'en sert seulement pour horodater le controle complet.
      { session_id, tfa_token, credential_id },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

/** Palier de connexion decide par le serveur pour ce numero + cette cle. */
export interface ResumeResponse {
  status?: string;
  palier?: 'auto' | 'biometrie' | 'complet' | 'aucun_appareil';
  motif?: string;
  uq_number?: string;
  credential_id?: string;
  age_connexion_secs?: number | null;
  age_controle_complet_secs?: number | null;
  email_mot_de_passe_requis?: boolean;
  biometrie_requise?: boolean;
  message?: string;
  httpStatus?: number;
}

export const authResume = (uq_number: string, credential_id: string) =>
  apiClient
    .post<ResumeResponse>(
      '/api/auth/resume',
      { uq_number, credential_id },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

/** POST /api/secure/forgot-password — reponse volontairement generique. */
export const authForgotPassword = (uq_number: string) =>
  apiClient
    .post<{ status?: string; message?: string }>(
      '/api/secure/forgot-password',
      { uq_number },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export interface CreateAccountPayload {
  prenom: string;
  nom: string;
  date_naissance: string;
  lieu_naissance: string;
  pays: string;
  adresse: string;
  telephone: string;
  password: string;
  /** Email du compte : l'identifiant de connexion choisi a l'inscription. */
  email?: string;
  /** Pseudo choisi par l'utilisateur (jamais « UQ »). */
  pseudo?: string;
  sexe?: string;
  statut_marital?: string;
  ville_provenance?: string;
  ville_actuelle?: string;
  profession?: string;
  code_promo_parrain?: string;
  /** Email externe : jamais une identite, uniquement un contact de recuperation. */
  recovery_email?: string;
  recovery_phone?: string;
  /** Jeton livre par /api/verify/confirm : prouve que le numero a recu le code. */
  verification_telephone?: string;
  /** Pass emis par /api/human/verify : preuve humaine obligatoire, usage unique. */
  preuve_humaine?: string;
}

export interface CreateAccountResponse {
  status: string;
  uq_number?: string;
  email?: string;
  pseudo?: string;
  code_promo?: string;
  full_name?: string;
  cadenas?: string;
  recovery_email?: string;
  recovery_phone?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  message?: string;
  raison?: string;
}

export const createAccount = (payload: CreateAccountPayload) =>
  apiClient
    .post<CreateAccountResponse>('/api/account/create', payload, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

// ====================
// Vérification du téléphone, codes à usage unique, porte anti-robot
// Routes réelles de uq_platform_bin/src/verify_routes.rs.
// ====================

export interface PhoneCheckResponse {
  status: string;
  valide?: boolean;
  e164?: string | null;
  iso?: string | null;
  pays?: string | null;
  operateur?: string | null;
  raison?: string;
  httpStatus?: number;
}

/** Le numero saisi est-il attribuable (indicatif + longueur d'abonne) ? 100 % local. */
export const checkPhone = (telephone: string) =>
  apiClient
    .post<PhoneCheckResponse>('/api/phone/check', { telephone }, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export interface OtpChallengeResponse {
  status: string;
  jeton?: string;
  portee?: string;
  cible?: string;
  envoye?: boolean;
  /** `reportee` quand aucun fournisseur SMS n'est configure : rien ne bloque. */
  mode?: 'reel' | 'reportee';
  raison?: string;
  message?: string;
  httpStatus: number;
}

export const requestOtp = (portee: 'telephone' | 'email', valeur: string) =>
  apiClient
    .post<OtpChallengeResponse>('/api/verify/challenge', { portee, valeur }, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export interface OtpConfirmResponse {
  status: string;
  verifie?: boolean;
  portee?: string;
  valeur?: string;
  /** Preuve a usage unique a presenter a /api/account/create. */
  jeton_verifie?: string;
  raison?: string;
  message?: string;
  httpStatus: number;
}

export const confirmOtp = (jeton: string, code: string) =>
  apiClient
    .post<OtpConfirmResponse>('/api/verify/confirm', { jeton, code }, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export type HumanMode = 'turnstile' | 'visuel_local' | 'indisponible';
export type HumanSymbol = 'cercle' | 'triangle' | 'carre' | 'losange' | 'etoile' | 'coeur';

export interface HumanConfigResponse {
  status: string;
  mode?: HumanMode;
  site_key?: string | null;
  message?: string;
  httpStatus: number;
}

export const humanConfig = () =>
  apiClient
    .get<HumanConfigResponse>('/api/human/config', { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export interface HumanBeginResponse {
  status: string;
  jeton?: string;
  /** "scene" = objets animés numérotés ; "symboles" = puzzle classique. */
  mode?: 'scene' | 'symboles';
  cible?: HumanSymbol;
  symboles?: HumanSymbol[];
  /** Scène : numéros affichés sur chaque objet (10-99, uniques). */
  objets?: number[];
  /** Scène : index de l'objet ciblé (celui dont il faut lire le numéro). */
  cible_idx?: number;
  expire_at?: number;
  message?: string;
  raison?: string;
  secondes_restantes?: number;
  httpStatus: number;
}

export const humanBegin = () =>
  apiClient
    .post<HumanBeginResponse>('/api/human/begin', {}, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

/** Variante forçant la scène animée (?type=scene) — rendu unique côté client. */
export const humanBeginScene = () =>
  apiClient
    .post<HumanBeginResponse>('/api/human/begin?type=scene', {}, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export interface HumanVerifyResponse {
  status: string;
  verification_reussie?: boolean;
  mode?: HumanMode;
  /** Pass à durée limitée autorisant les routes sensibles (création, 2FA). */
  pass?: string;
  indice_interaction?: string;
  message?: string;
  raison?: string;
  secondes_restantes?: number;
  httpStatus: number;
}

export const humanVerify = (payload: {
  jeton?: string;
  choix?: number;
  interaction?: {
    input_type: 'mouse' | 'touch' | 'pen' | 'keyboard' | 'none';
    pointer_samples: number;
    path_length: number;
    direction_changes: number;
    motion_samples: number;
    motion_variance: number;
  };
}) =>
  apiClient
    .post<HumanVerifyResponse>('/api/human/verify', payload, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export interface RecoveryContactsPayload {
  uq_number: string;
  recovery_email?: string;
  recovery_phone?: string;
  verification_telephone?: string;
}

export interface RecoveryContactsResponse {
  status: string;
  message?: string;
  recovery_email?: string;
  recovery_phone?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  raison?: string;
  httpStatus: number;
}

export const updateRecoveryContacts = (payload: RecoveryContactsPayload) =>
  apiClient
    .post<RecoveryContactsResponse>('/api/account/recovery/update', payload, { validateStatus: () => true })
    .then((r) => ({ ...r.data, httpStatus: r.status }));

// ==================== Coffre / portefeuille ====================

export const getBalance = (uq: string) =>
  apiClient.get<BorbBalance>(`/api/borb/balance/${encodeURIComponent(uq)}`).then(unwrap);

export const getWallets = (uq: string) =>
  apiClient.get<WalletsResponse>(`/api/account/wallets/${encodeURIComponent(uq)}`).then(unwrap);

/** Soldes par devise convertie : lecture seule cote backend. */
export const getWalletCurrencies = (uq: string) =>
  apiClient
    .get<{ status?: string; currencies?: WalletCurrency[] }>(
      `/api/account/wallets/currencies/${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

export const getTransactions = (uq: string) =>
  apiClient
    .get<{ status?: string; transactions?: Transaction[]; total?: number }>(
      `/api/borb/transactions/${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

/**
 * Série privée du coffre : agrégation de tout le grand livre du compte, alors
 * que `getTransactions` est plafonnée aux dernières lignes. `reconcilie` dit si
 * le grand livre explique le solde affiché ; quand il ne l'explique pas,
 * `solde_points` reste null et seule la colonne `cumul_flux` est dessinable.
 */
export interface BalanceSeriesPoint {
  date: string;
  flux_net: number;
  entrees: number;
  sorties: number;
  transactions: number;
  cumul_flux: number;
  solde_points: number | null;
}

export interface BalanceSeriesResponse {
  status: string;
  account: string;
  periode: SeriesPeriod;
  unite: string;
  solde_actuel_points: number;
  reconcilie: boolean;
  ecart_reconciliation_points: number;
  lignes_non_classifiees_historique: number;
  lignes_historique: number;
  lignes_rejetees: number;
  types_non_classes: Record<string, number>;
  series: BalanceSeriesPoint[];
}

export interface WalletAnalyticsSource {
  code: string;
  label: string;
  direction: 'entree' | 'sortie';
  amount: number;
  transactions: number;
}

export interface WalletAnalyticsPoint {
  date: string;
  entrees: number;
  sorties: number;
  net: number;
  transactions: number;
  by_source: Record<string, number>;
}

export interface WalletAnalyticsResponse {
  status: string;
  account: string;
  periode: SeriesPeriod;
  unit: 'points';
  solde_actuel_points: number;
  reconcilie: boolean;
  ecart_reconciliation_points: number;
  lignes_non_classifiees_historique: number;
  totals: {
    entrees: number;
    sorties: number;
    net: number;
    transactions: number;
  };
  sources: WalletAnalyticsSource[];
  series: WalletAnalyticsPoint[];
  lignes_rejetees: number;
  types_non_classes: Record<string, number>;
}

export const getBalanceSeries = (uq: string, periode: SeriesPeriod) =>
  apiClient
    .get<BalanceSeriesResponse>(`/api/borb/balance/series/${encodeURIComponent(uq)}`, {
      params: { periode },
    })
    .then(unwrap);

/** Analyse privée des mouvements réellement écrits dans le coffre. */
export const getWalletAnalytics = (uq: string, periode: SeriesPeriod) =>
  apiClient
    .get<WalletAnalyticsResponse>(`/api/analytics/wallet/${encodeURIComponent(uq)}`, {
      params: { periode },
    })
    .then(unwrap);

export const getTransfers = (uq: string) =>
  apiClient
    .get(`/api/account/wallets/transfers/${encodeURIComponent(uq)}`)
    .then(unwrap)
    .catch(() => null);

/** Facture telle que renvoyee par /api/invoices/by-user/{uq}. */
export interface Invoice {
  invoice_id: string;
  tx_id: string;
  created_at: number;
  amount_borb: number;
  amount_usd: number;
  rate: number;
  fee_borb?: number;
  type?: string;
  from_user?: string;
  to_user?: string;
  status?: string;
}

export const getInvoicesByUser = (uq: string) =>
  apiClient
    .get<{ status?: string; invoices?: Invoice[]; total?: number }>(
      `/api/invoices/by-user/${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

/**
 * Le PDF de facture exige le JWT (auth_guard::exiger_auth) : on le recupere
 * avec `apiFetch` (qui ajoute le Bearer) avant de l'ouvrir en blob.
 */
export const fetchInvoicePdf = async (invoiceId: string): Promise<Blob> => {
  const response = await apiFetch(`/api/invoices/${encodeURIComponent(invoiceId)}/pdf`);
  if (!response.ok) throw new Error('Facture indisponible');
  return response.blob();
};

/*
 * `amount_points` et `fee_points` sont obligatoires cote backend (u64 non
   optionnels) : le handler recalcule de toute facon les frais reels.

   IMPORTANT — le BORB n'est pas transferable en direct : tout `currency`
   vide, `BORB` ou `BORB` est refuse (BORB_NOT_TRANSFERABLE). Le destinataire
   recoit une devise convertie : `currency` doit donc etre un code fiat de
   l'oracle et `amount_currency` exprime le montant dans cette devise.
 */
export const sendBorb = (payload: {
  sender: string;
  recipient: string;
  currency: string;
  amount_points: number;
  fee_points: number;
  amount_currency?: number;
  memo?: string;
}) => apiClient.post('/api/borb/send', payload).then(unwrap);

export const convertWallets = (payload: {
  uq_number: string;
  from: string;
  to: string;
  amount: number;
  pin: string;
}) => apiClient.post('/api/account/wallets/convert', payload).then(unwrap);

/**
 * POST /api/account/wallets/withdraw — retrait direct vers une destination
 * externe (mobile money, banque…). Le backend exige le PIN, débite
 * `multi_wallets` (montant + frais) et enregistre un retrait `pending`.
 * La réserve BORB n'est JAMAIS retirable (est_retirable = fiat ou crypto).
 */
export const withdrawWallet = (payload: {
  uq_number: string;
  currency: string;
  amount: number;
  destination: string;
  pin: string;
}) =>
  apiClient
    .post<{
      status: string;
      withdrawal_id: number;
      currency: string;
      amount: number;
      fee: number;
      net: number;
      destination: string;
      withdrawal_status: string;
      message?: string;
    }>('/api/account/wallets/withdraw', payload)
    .then(unwrap);

// ==================== Dépôts mobile money ====================
// Déclarer un dépôt (après envoi réel) → le propriétaire vérifie la
// réception sur son mobile money puis confirme : multi_wallets + réserve
// BORB sont crédités. `canal`/`provider`/`api_reference` sont prévus pour
// les futurs agrégateurs de paiement.

export interface WalletDeposit {
  id: number;
  uq: string;
  nom: string;
  prenom: string;
  operateur: string;
  numero: string;
  devise: string;
  montant: number;
  montant_exact: number;
  uq_pseudo: string;
  code_sms: string;
  canal: string;
  provider?: string | null;
  api_reference?: string | null;
  statut: 'en_attente' | 'credite' | 'refuse' | 'expire' | 'annule' | string;
  motif?: string | null;
  owner_uq?: string | null;
  traite_at?: number | null;
  created_at: number;
}

/** POST /api/wallet/depot — déclare un dépôt déjà envoyé (PIN exigé). */
export const declareDeposit = (payload: {
  uq_number: string;
  nom: string;
  prenom: string;
  operateur: string;
  numero: string;
  devise: string;
  montant: number;
  montant_exact?: number;
  uq_pseudo?: string;
  code_sms: string;
  pin: string;
}) =>
  apiClient
    .post<{ status: string; deposit_id: number; statut: string; message?: string }>(
      '/api/wallet/depot',
      payload,
    )
    .then(unwrap);

/** GET /api/wallet/depot/{uq} — historique des dépôts de l'utilisateur. */
export const getMyDeposits = (uq: string) =>
  apiClient
    .get<{ status: string; depots?: WalletDeposit[] }>(
      `/api/wallet/depot/${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

/** POST /api/wallet/depot/{id}/annuler — annule un dépôt en attente. */
export const cancelDeposit = (id: number) =>
  apiClient
    .post<{ status: string; message?: string }>(
      `/api/wallet/depot/${id}/annuler`,
      {},
    )
    .then(unwrap);

/** GET /api/owner/depots?statut= — file de validation du propriétaire. */
export const getOwnerDeposits = (statut?: string) =>
  guardianRequest<{ status?: string; depots?: WalletDeposit[] }>(
    `/api/owner/depots${statut ? `?statut=${encodeURIComponent(statut)}` : ''}`,
  );

/** POST /api/owner/depots/{id}/confirmer — réception vérifiée → crédit. */
export const confirmOwnerDeposit = (id: number) =>
  guardianRequest<{ status?: string; statut?: string; credit?: Record<string, number>; message?: string }>(
    `/api/owner/depots/${id}/confirmer`,
    { method: 'POST' },
  );

/** POST /api/owner/depots/{id}/refuser — { motif? } : pas de crédit. */
export const refuseOwnerDeposit = (id: number, motif?: string) =>
  guardianRequest<{ status?: string; message?: string }>(
    `/api/owner/depots/${id}/refuser`,
    { method: 'POST', body: JSON.stringify({ motif: motif || '' }) },
  );

export const claimUbi = (account: string) =>
  apiClient.post('/api/ubi/claim', { account }).then(unwrap);

export const getUbiInfo = () => apiClient.get('/api/ubi/info').then(unwrap).catch(() => null);

export const verifyHistory = (uq: string) =>
  apiClient.post(`/api/history/${encodeURIComponent(uq)}/verify`).then(unwrap);

export const searchPseudos = (search: string) =>
  apiClient
    .get<{ pseudos?: { pseudo: string; nom?: string; prenom?: string; display?: string; verified?: boolean }[] }>(
      `/api/uq/pseudos?search=${encodeURIComponent(search)}`,
    )
    .then(unwrap);

export const getQrUrl = (uq: string) =>
  apiUrl(`/api/account/${encodeURIComponent(uq)}/qr.png?t=${Date.now()}`);

/** Reçu PNG signe d'une transaction (route publique, sans JWT). */
export const getReceiptUrl = (uq: string, txId: number | string) =>
  apiUrl(`/api/transactions/${encodeURIComponent(uq)}/${encodeURIComponent(String(txId))}/receipt.png`);

// ==================== Prix / marche ====================

/**
 * `source` nomme la source réellement interrogée par le backend (or, BTC). Rien
 * n'est supposé ici : absente ou vide, l'interface n'affiche pas de provenance.
 */
export const getPrices = () =>
  apiClient
    .get<PriceAllResponse>('/api/price/all')
    .then(unwrap)
    .then((data) => {
      if (data?.prices && Object.keys(data.prices).length) ecrireCacheTaux('prix', data);
      return data;
    })
    .catch((error) => {
      if (!sansReponseHttp(error)) throw error;
      return reponseHorsLigne<PriceAllResponse>('prix');
    });

export const getFiatRates = () =>
  apiClient
    .get<OracleFiatResponse>('/api/oracle/fiat')
    .then(unwrap)
    .then((data) => {
      // Un payload sans taux ne prouve rien : il ne doit pas écraser la
      // dernière capture connue.
      if (data?.rates && Object.keys(data.rates).length) {
        ecrireCacheTaux('fiat', data);
        memoriserParite(data.parite?.points_par_borb);
      }
      return data;
    })
    .catch((error) => {
      if (!sansReponseHttp(error)) throw error;
      return reponseHorsLigne<OracleFiatResponse>('fiat', { source: 'stale' });
    });

/**
 * Une devise sur `/api/oracle/fiat/{code}`, avec cache local : un écran de
 * conversion qui ne peut pas joindre le backend doit montrer le dernier taux
 * recu et son age, pas une erreur pleine page.
 */
export interface FiatRateResponse {
  currency?: string;
  usd_per_unit?: number;
  units_per_usd?: number;
  units_per_borb?: number;
  borb_per_unit?: number;
  borb_usd?: number;
  source?: string;
  badge?: string;
  origines?: string[];
  mediane?: number;
  officiel_bcc?: number;
  updated_at?: number;
  hors_ligne?: boolean;
}

export const getFiatRate = (code: string) => {
  const cle = `fiat:${code.toUpperCase()}`;
  return apiClient
    .get<FiatRateResponse>(`/api/oracle/fiat/${encodeURIComponent(code)}`)
    .then(unwrap)
    .then((data) => {
      // 404 DEVISE_INCONNUE n'est pas une capture : rien à memoriser.
      if (data && (data.units_per_usd ?? 0) > 0) ecrireCacheTaux(cle, data);
      return data;
    })
    .catch((error) => {
      if (!sansReponseHttp(error)) throw error;
      return reponseHorsLigne<FiatRateResponse>(cle, { source: 'stale' });
    });
};

export const getCasesStats = () =>
  apiClient.get<{ status?: string; cases?: [string, number][] }>('/api/cases/stats').then(unwrap);

export const getLiveStats = () => apiClient.get('/api/cases/live-stats').then(unwrap).catch(() => null);

export const getBtcHistory = () => apiClient.get('/api/price/history/btc').then(unwrap).catch(() => null);

export interface AssetHistory {
  data?: number[];
  first?: number;
  last?: number;
  change_pct?: number;
  symbol?: string;
}

export const getAssetHistory = (symbol: 'btc' | 'gold' | 'all') =>
  apiClient
    .get<AssetHistory>(`/api/price/history/${symbol}`)
    .then(unwrap)
    .catch(() => null);

export const getCryptoPrice = (symbol: string) =>
  apiClient
    .get(`/api/external/crypto/price/${encodeURIComponent(symbol)}`)
    .then(unwrap)
    .catch(() => null);

export const getCryptoKlines = (symbol: string) =>
  apiClient
    .get(`/api/external/crypto/klines/${encodeURIComponent(symbol)}`)
    .then(unwrap)
    .catch(() => null);

export const getExternalStatus = () =>
  apiClient.get('/api/external/status').then(unwrap).catch(() => null);

export interface CryptoMarketQuoteResponse {
  status?: string;
  symbol?: string;
  source?: string;
  cached?: boolean;
  stale?: boolean;
  capture?: ExternalCaptureInfo;
  message?: string;
  data?: {
    price?: number;
    pair?: string;
    currency?: string;
    change_percent?: number;
    open?: number;
    day_high?: number;
    day_low?: number;
    volume?: number;
  };
}

export interface CryptoMarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ExternalCaptureInfo {
  captured_at?: number;
  age_sec?: number;
  ttl_sec?: number;
  fresh?: boolean;
  persisted?: boolean;
  error?: string;
}

export interface CryptoKlinesResponse {
  status?: string;
  symbol?: string;
  interval?: string;
  source?: string;
  cached?: boolean;
  stale?: boolean;
  capture?: ExternalCaptureInfo;
  message?: string;
  candles?: CryptoMarketCandle[];
}

export const getCryptoMarketQuote = (symbol: string) =>
  apiClient
    .get<CryptoMarketQuoteResponse>(
      `/api/external/crypto/price/${encodeURIComponent(symbol)}`,
    )
    .then(unwrap);

export const getCryptoMarketKlines = (
  symbol: string,
  interval: '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M',
  limit = 200,
) =>
  apiClient
    .get<CryptoKlinesResponse>(
      `/api/external/crypto/klines/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&limit=${limit}`,
    )
    .then(unwrap);

export interface StockQuoteResponse {
  status?: string;
  symbol?: string;
  source?: string;
  cached?: boolean;
  stale?: boolean;
  capture?: ExternalCaptureInfo;
  message?: string;
  data?: {
    symbol?: string;
    price?: number;
    currency?: string;
    previous_close?: number;
    change_percent?: number;
    history?: Array<{
      time: number;
      close: number;
      volume?: number | null;
    }>;
    average_volume?: number;
    open?: number;
    day_high?: number;
    day_low?: number;
    volume?: number;
  };
}

/** Cours indicatif Yahoo Finance via le proxy backend (aucune cle dans le navigateur). */
export const getStockQuote = (
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1d',
) =>
  apiClient
    .get<StockQuoteResponse>(
      `/api/external/stock/quote/${encodeURIComponent(symbol)}?range=${range}`,
    )
    .then(unwrap);

/** Bougie telle que servie par /api/external/market/ohlc/{symbol}. */
export interface MarketOhlcBar {
  time?: string | number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  is_open?: boolean;
}

export interface MarketOhlcResponse {
  status?: string;
  symbol?: string;
  interval?: string;
  source?: string;
  cached?: boolean;
  stale?: boolean;
  capture?: ExternalCaptureInfo;
  message?: string;
  candles?: MarketOhlcBar[];
}

/**
 * GET /api/external/market/ohlc/{symbol} — bougies temps réel (biquote).
 * Intervalles admis côté source : 1m, 5m, 15m, 30m, 1h, 4h, 1d.
 * Renvoie null sur erreur réseau : l'écran décide alors du repli à afficher.
 */
export const getMarketOhlc = (symbol: string, interval: string, limit = 120) =>
  apiClient
    .get<MarketOhlcResponse>(
      `/api/external/market/ohlc/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&limit=${limit}`,
    )
    .then(unwrap)
    .catch(() => null);

/** GET /api/external/market/tick/{symbol} — prix temps réel d'une paire. */
export const getMarketTick = (symbol: string) =>
  apiClient
    .get<{ status?: string; source?: string; cached?: boolean; data?: Record<string, unknown> }>(
      `/api/external/market/tick/${encodeURIComponent(symbol)}`,
    )
    .then(unwrap)
    .catch(() => null);

/** GET /api/external/gold/spot — or de référence (xaus.com, cache 5 min). */
export const getGoldSpot = () =>
  apiClient
    .get<{ status?: string; source?: string; cached?: boolean; data?: Record<string, unknown> }>(
      '/api/external/gold/spot',
    )
    .then(unwrap)
    .catch(() => null);

// ==================== Zando / marketplace ====================

export const listZandoItems = () =>
  apiClient.get<{ items?: ZandoItem[] }>('/api/zando/items').then(unwrap);

export const listShopItems = (shopId: string) =>
  apiClient.get<{ items?: ZandoItem[] }>(`/api/zando/items/${encodeURIComponent(shopId)}`).then(unwrap);

export const getZandoItem = (id: string) =>
  apiClient.get<{ item?: ZandoItem }>(`/api/zando/item/${encodeURIComponent(id)}`).then(unwrap);

export const interactZando = (
  id: string,
  type: 'view' | 'like' | 'share' | 'comment',
  content?: string,
) =>
  apiClient
    .post(
      `/api/zando/item/${encodeURIComponent(id)}/interact`,
      type === 'comment' ? { type, content: content ?? '' } : { type },
    )
    .then(unwrap);

export const createZandoItem = (payload: Record<string, unknown>) =>
  apiClient.post<{ status?: string; item_id?: string; message?: string }>(
    '/api/zando/item/create',
    payload,
  ).then(unwrap);

// ==================== Reseau (demandes d'amitie) ====================

export const requestNetwork = (payload: { destinataire: string; pin: string }) =>
  apiClient.post<{ status?: string; message?: string; demande_id?: string }>(
    '/api/network/request',
    payload,
  ).then(unwrap);

export const acceptNetwork = (payload: { demandeur: string; pin: string }) =>
  apiClient.post<{ status?: string; message?: string }>(
    '/api/network/accept',
    payload,
  ).then(unwrap);

export const rejectNetwork = (payload: { demandeur: string; pin: string }) =>
  apiClient.post<{ status?: string; message?: string }>(
    '/api/network/reject',
    payload,
  ).then(unwrap);

export const leaveNetwork = (payload: { autre: string; pin: string }) =>
  apiClient.post<{ status?: string; message?: string }>(
    '/api/network/leave',
    payload,
  ).then(unwrap);

export const listNetwork = () =>
  apiClient.get<{
    status?: string;
    recues?: Array<{ de: string; created_at: number; expires_at: number }>;
    envoyees?: Array<{ vers: string; created_at: number; expires_at: number }>;
  }>('/api/network/list').then(unwrap);

export const publishZandoItem = (id: string) =>
  apiClient.post(`/api/zando/item/${encodeURIComponent(id)}/publish`).then(unwrap);

/** POST /api/zando/item/{id}/sold — l'objet quitte le flux, l'historique reste. */
export const marquerZandoVendu = (id: string) =>
  apiClient.post(`/api/zando/item/${encodeURIComponent(id)}/sold`).then(unwrap);

export const deleteZandoItem = (id: string) =>
  apiClient.post(`/api/zando/item/${encodeURIComponent(id)}/delete`).then(unwrap);

/**
 * POST /api/zando/item/{id}/update — les champs absents sont completes avec
 * l'offre en place (le backend exige un titre et un prix non nuls).
 */
export const updateZandoItem = async (id: string, payload: Record<string, unknown>) => {
  const current = await getZandoItem(id);
  const item = current.item;
  const media = payload.media_urls ?? item?.media_urls ?? [];
  return apiClient
    .post(`/api/zando/item/${encodeURIComponent(id)}/update`, {
      title: payload.title ?? item?.title ?? '',
      subtitle: payload.subtitle ?? item?.subtitle ?? '',
      description: payload.description ?? item?.description ?? '',
      media_urls: typeof media === 'string' ? media : JSON.stringify(media),
      type: payload.type ?? item?.type ?? 'text',
      price_borb: payload.price_borb ?? item?.price_borb ?? 0,
      price_usd: payload.price_usd ?? item?.price_usd ?? 0,
      category: payload.category ?? item?.category ?? 'general',
      commission_enabled: payload.commission_enabled ?? item?.commission_enabled ?? false,
      commission_rate: payload.commission_rate ?? item?.commission_rate ?? 0,
    })
    .then(unwrap);
};

export interface ZandoInteraction {
  user_id: string;
  type: 'view' | 'like' | 'share' | 'comment';
  created_at?: string;
  /** Charge libre : `{"content": "..."}` pour un commentaire. */
  data?: string;
}

/** GET /api/zando/item/{id}/interactions — reponse `{ data: { interactions } }`. */
export const listZandoInteractions = (itemId: string) =>
  apiClient
    .get<{ data?: { interactions?: ZandoInteraction[] } }>(
      `/api/zando/item/${encodeURIComponent(itemId)}/interactions`,
    )
    .then((r) => r.data.data?.interactions ?? []);

// ----- Agents (commissionnaires) -----

export interface ZandoAgent {
  user_id: string;
  commission_rate?: number;
  sales_count?: number;
  total_earned?: number;
  joined_at?: string;
}

/** POST /api/zando/agent/become — { item_id, user_id } */
export const becomeZandoAgent = (itemId: string, userId: string) =>
  apiClient
    .post('/api/zando/agent/become', { item_id: itemId, user_id: userId })
    .then(unwrap);

/** GET /api/zando/agents/{item_id} */
export const listZandoAgents = (itemId: string) =>
  apiClient
    .get<{ agents?: ZandoAgent[]; total?: number }>(`/api/zando/agents/${encodeURIComponent(itemId)}`)
    .then((r) => r.data.agents ?? []);

/** POST /api/zando/agent/sale — renvoie la commission creditee (BORB). */
export const recordZandoAgentSale = (
  itemId: string,
  agentId: string,
  saleAmountBorb: number,
) =>
  apiClient
    .post<{ status?: string; commission_earned?: number; message?: string }>(
      '/api/zando/agent/sale',
      { item_id: itemId, agent_id: agentId, sale_amount_borb: saleAmountBorb },
    )
    .then((r) => r.data.commission_earned ?? 0);

// ----- Contacts -----

export type ZandoContactField = 'number' | 'email' | 'phone';

export interface ZandoSharedContact {
  shared_with_id: string;
  field: string;
  shared_at?: string;
}

/** POST /api/zando/contacts/request — renvoie l'identifiant de la demande. */
export const requestZandoContact = (
  requesterId: string,
  targetId: string,
  field: ZandoContactField,
) =>
  apiClient
    .post<{ status?: string; request_id?: string; message?: string }>(
      '/api/zando/contacts/request',
      { requester_id: requesterId, target_id: targetId, field },
    )
    .then((r) => r.data.request_id ?? '');

/** POST /api/zando/contacts/{id}/accept */
export const acceptZandoContact = (requestId: string) =>
  apiClient
    .post(`/api/zando/contacts/${encodeURIComponent(requestId)}/accept`)
    .then(unwrap);

/** POST /api/zando/contacts/{id}/refuse */
export const refuseZandoContact = (requestId: string) =>
  apiClient
    .post(`/api/zando/contacts/${encodeURIComponent(requestId)}/refuse`)
    .then(unwrap);

/** POST /api/zando/contacts/share — { owner_id, shared_with_id, field } */
export const shareZandoContact = (
  ownerId: string,
  sharedWithId: string,
  field: ZandoContactField,
) =>
  apiClient
    .post('/api/zando/contacts/share', {
      owner_id: ownerId,
      shared_with_id: sharedWithId,
      field,
    })
    .then(unwrap);

/** GET /api/zando/contacts/shared/{user_id} */
export const listZandoSharedContacts = (userId: string) =>
  apiClient
    .get<{ contacts?: ZandoSharedContact[] }>(
      `/api/zando/contacts/shared/${encodeURIComponent(userId)}`,
    )
    .then((r) => r.data.contacts ?? []);

// ----- Brouillons -----

export type ZandoDraftType = 'shop' | 'item' | 'message';

export interface ZandoDraft {
  id: string;
  user_id: string;
  draft_type: ZandoDraftType;
  data: unknown;
  created_at?: string;
  updated_at?: string;
}

/** POST /api/zando/drafts — renvoie l'identifiant du brouillon cree. */
export const saveZandoDraft = (
  userId: string,
  draftType: ZandoDraftType,
  data: unknown,
) =>
  apiClient
    .post<{ status?: string; draft_id?: string; message?: string }>('/api/zando/drafts', {
      user_id: userId,
      draft_type: draftType,
      data,
    })
    .then((r) => r.data.draft_id ?? '');

/** GET /api/zando/drafts/{id} */
export const getZandoDraft = (draftId: string) =>
  apiClient
    .get<{ status?: string; data?: ZandoDraft }>(`/api/zando/drafts/${encodeURIComponent(draftId)}`)
    .then((r) => r.data.data ?? null);

/** DELETE /api/zando/drafts/{id} */
export const deleteZandoDraft = (draftId: string) =>
  apiClient.delete(`/api/zando/drafts/${encodeURIComponent(draftId)}`).then(unwrap);

export interface ZandoDailyAnalytics {
  date: string;
  views: number;
  likes: number;
}

export interface ZandoAnalyticsResponse {
  status: string;
  period_days: number;
  daily: ZandoDailyAnalytics[];
}

export const getZandoAnalytics = (shopId: string) =>
  apiClient
    .get<ZandoAnalyticsResponse>(`/api/zando/analytics/${encodeURIComponent(shopId)}`)
    .then(unwrap);

export interface StudioFormat {
  id: string;
  label: string;
  icon?: string;
}

/** GET /api/studio/types — formats de contenu acceptes par le backend. */
export const getStudioTypes = () =>
  apiClient.get<{ status?: string; types?: StudioFormat[] }>('/api/studio/types').then(unwrap);

/** GET /api/studio/suggest — conseils de publication (JWT requis). */
export const getStudioSuggest = () =>
  apiClient
    .get<{ status?: string; suggestions?: { title: string; description: string; priority?: number }[] }>(
      '/api/studio/suggest',
    )
    .then(unwrap);

/** Type personnalise du marche (categories dynamiques du Studio). */
export interface ZandoCustomType {
  id: string;
  owner_id?: string;
  name: string;
  emoji?: string;
  color?: string;
  description?: string;
  fields?: string;
  created_at?: number;
}

/** GET /api/zando/custom-types — categories definies par les utilisateurs. */
export const listZandoCustomTypes = () =>
  apiClient.get<{ types?: ZandoCustomType[]; total?: number }>('/api/zando/custom-types').then(unwrap);

/** POST /api/zando/custom-type/create — { owner_id, name, emoji?, color?, description?, fields? } */
export const createZandoCustomType = (payload: {
  owner_id: string;
  name: string;
  emoji?: string;
  color?: string;
  description?: string;
  fields?: string;
}) =>
  apiClient
    .post<{ status?: string; type_id?: string; message?: string }>('/api/zando/custom-type/create', payload)
    .then(unwrap);

// ==================== Revente de connexion ====================
//
// La fiche du vendeur est stockée côté serveur : un nom, une photo, la nature
// du lien, une position et une mesure. Le tarif par seconde n'y figure pas —
// il ne quitte jamais l'appareil (voir `lib/connexion.ts`).

export interface ConnexionFiche {
  id: string;
  owner: string;
  nom: string;
  photo: string;
  reseau: 'starlink' | 'mobile';
  latitude: number;
  longitude: number;
  signal: number;
  debit_mbps: number;
  latence_ms: number;
  mesuree_a: number;
  publiee: boolean;
  creee_a: number;
  maj_a: number;
}

/** Ce que l'acheteur reçoit : ni UQ, ni coordonnées exactes, seulement la distance. */
export interface ConnexionVendeur {
  id: string;
  nom: string;
  photo?: string;
  reseau: 'starlink' | 'mobile';
  signal: number;
  debit_mbps: number;
  latence_ms: number;
  mesuree_a: number;
  puissance: number;
  distance_km: number | null;
  mesure_peu_fraiche?: boolean;
  score?: number;
  /** Combien de comptes ont parlé de cette fiche. Zéro est une réponse. */
  avis_total?: number;
  /** Moyenne de leurs notes, ou rien quand personne n'a encore noté. */
  avis_moyenne?: number | null;
}

/** Ce que le serveur compte du flux au moment où on l'interroge. */
export interface VitaliteBoutique {
  fiches: number;
  vendeurs: number;
  satellite: number;
  mobile: number;
  mesures_fraiches: number;
  derniere_fiche_a: number;
}

/** Un avis publié : la voix d'un compte, jamais son identifiant. */
export interface ConnexionAvis {
  note: number;
  texte?: string;
  ecrit_a: number;
}

export interface ConnexionAvisReponse {
  status?: string;
  annonce_id?: string;
  avis_total?: number;
  avis_moyenne?: number;
  avis?: ConnexionAvis[];
  message?: string;
}

export interface ConnexionRegion {
  status?: string;
  trie_par?: 'proximite_et_puissance' | 'puissance';
  rayon_km?: number;
  position_demandee?: boolean;
  total?: number;
  vitalite?: VitaliteBoutique;
  en_avant?: ConnexionVendeur | null;
  suivants?: ConnexionVendeur[];
  boutique?: {
    id: string;
    nom: string;
    description?: string;
    confiance_systeme?: boolean;
    /** La mention de confiance portée par la fiche du système. */
    confiance?: string;
    visuels?: string[];
  };
  message?: string;
}

/** Le corps d'une fiche : exactement ce que le serveur accepte de publier. */
export interface ConnexionPayload {
  nom: string;
  reseau: 'starlink' | 'mobile';
  photo?: string;
  latitude: number;
  longitude: number;
  signal?: number;
  debit_mbps?: number;
  latence_ms?: number;
}

/** POST /api/connexion/publish — un compte tient une seule fiche. */
export const publierConnexion = (payload: ConnexionPayload) =>
  apiClient
    .post<{ status?: string; annonce?: ConnexionFiche; puissance?: number; prix_local?: boolean; message?: string }>(
      '/api/connexion/publish',
      payload,
    )
    .then(unwrap);

/** POST /api/connexion/unpublish — retirer du flux sans effacer la fiche. */
export const retirerConnexion = () =>
  apiClient
    .post<{ status?: string; publiee?: boolean; annonce?: ConnexionFiche; message?: string }>(
      '/api/connexion/unpublish',
      {},
    )
    .then(unwrap);

/** GET /api/connexion/mine — relire sa fiche, publiée ou retirée. */
export const maConnexion = () =>
  apiClient
    .get<{ status?: string; annonce?: ConnexionFiche | null; publiee?: boolean; puissance?: number }>(
      '/api/connexion/mine',
    )
    .then(unwrap);

/** GET /api/connexion/nearby — la région de l'acheteur, classée proximité × puissance. */
export const connexionsProches = (position?: { latitude: number; longitude: number }, rayonKm?: number) => {
  const parametres = new URLSearchParams();
  if (position) {
    parametres.set('latitude', String(position.latitude));
    parametres.set('longitude', String(position.longitude));
  }
  if (rayonKm) parametres.set('rayon_km', String(rayonKm));
  const requete = parametres.toString();
  return apiClient
    .get<ConnexionRegion>(`/api/connexion/nearby${requete ? `?${requete}` : ''}`)
    .then(unwrap);
};

/**
 * POST /api/connexion/avis — une voix par compte et par fiche.
 *
 * Reposer son avis remplace la ligne précédente au lieu d'ajouter une ligne :
 * le compteur que la boutique affiche ne peut pas être monté à la main.
 */
export const noterConnexion = (annonceId: string, note: number, texte = '') =>
  apiClient
    .post<ConnexionAvisReponse & { note?: number }>('/api/connexion/avis', {
      annonce_id: annonceId,
      note,
      texte,
    })
    .then(unwrap);

/** GET /api/connexion/avis?annonce_id=… — les avis d'une fiche, sans leurs auteurs. */
export const avisConnexion = (annonceId: string) =>
  apiClient
    .get<ConnexionAvisReponse>(`/api/connexion/avis?annonce_id=${encodeURIComponent(annonceId)}`)
    .then(unwrap);

export const searchMarket = (query: string) =>
  apiClient
    .get(`/api/search?q=${encodeURIComponent(query)}`)
    .then(unwrap)
    .catch(() => null);

/**
 * Boutique créée depuis le Studio. Le backend range les boutiques et les
 * produits dans la même table `publications` : `GET /api/shops` renvoie donc
 * les deux, et on ne garde que les enregistrements porteurs d'un `owner`.
 */
/** Une tranche de contenu du mini-site, libre au vendeur. */
export interface ShopSection {
  id: string;
  titre: string;
  type: string;
  contenu?: string;
  media?: string;
}

/**
 * Frais de présence calculés côté serveur : 5 % du catalogue par 24 heures,
 * laissés couler seconde par seconde par le robinet (jamais débités d'avance).
 */
export interface ShopFees {
  pourcent: number;
  catalogue_points: number;
  frais_24h_points: number;
  par_seconde_points: number;
  duree_secondes: number;
  /** Faux tant que le vendeur n'a pas ouvert le robinet par un geste PIN. */
  robinet_ouvert?: boolean;
  /** Total déjà prélevé du coffre pour cette présence, en points. */
  regle_points?: number;
  /** Secondes écoulées pas encore facturées (les fractions de point). */
  secondes_en_attente?: number;
}

export const GALERIE_MAX = 10;

/**
 * Identifiant de la boutique système. Elle est annexée au compte owner et
 * fabriquée par le serveur à la lecture : elle n'est dans aucune base, donc
 * aucun Studio ne peut l'écraser, et son compteur de présence n'existe pas.
 */
export const BOUTIQUE_SYSTEME_ID = 'uq_connexion';

/** Limites produit du mini-site édité (miroir du backend). */
export const SITE_PAGES_MAX = 3;
export const SITE_MEDIAS_MAX = 2;

export interface MediaAdjust {
  brightness: number;
  contrast: number;
  saturation: number;
  highlights: number;
  shadows: number;
  sharp: number;
  warmth: number;
  hue: number;
  vignette: number;
}
export interface SiteOverlay {
  type: 'photo' | 'video';
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface SiteSound {
  track: string;
  src: string;
  start: number;
  len: number;
}
export interface SiteSeg {
  start: number;
  end: number;
}
export interface SiteMedia {
  type: 'photo' | 'video';
  src: string;
  label: string;
  dur: number;
  adj: MediaAdjust;
  speed: number;
  crop: number;
  overlays: SiteOverlay[];
  sound: SiteSound | null;
  segs: SiteSeg[];
}
export interface SiteButton {
  label: string;
  kind: string;
  /** Lien externe pour kind « lien » ; contact/achat ouvrent chat et panier. */
  url?: string;
}
export interface SiteSocial {
  name: string;
  url: string;
}
export interface SiteVideo {
  url: string;
  title: string;
  src: string;
}
export interface SitePage {
  name: string;
  medias: SiteMedia[];
  buttons: SiteButton[];
  video: SiteVideo | null;
  social: SiteSocial[];
}
export interface MiniSite {
  pages: SitePage[];
}

export interface ShopRecord {
  id: string;
  /** Propriétaire technique (identifiant du compte) : jamais affiché tel quel. */
  owner: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  /** Vitrine présente dans le flux Zando. */
  open: boolean;
  /** Secondes (le backend écrit `chrono::Utc::now().timestamp()`). */
  created_at: number;
  presentation_photo?: string;
  presentation_video?: string;
  gallery?: string[];
  sections?: ShopSection[];
  /** Fin de présence en ligne, en secondes. 0 ou absent = boutique héritée. */
  en_ligne_jusqu_a?: number;
  vitrine_item_id?: string;
  /** Le robinet de présence coule (autorisé par un geste PIN). */
  robinet?: boolean;
  /** Total déjà prélevé du coffre pour cette présence, en points. */
  regle_points?: number;
  /** Boutique tenue par le système, annexée au compte owner. */
  systeme?: boolean;
  /** Le profil affiche la mention de confiance système. */
  confiance_systeme?: boolean;
  /** Le libellé de cette mention, porté par la fiche : « TrustUnder ». */
  confiance?: string;
  /** Mini-site assemblé par le Studio (pages, médias, boutons). Absent = non créé. */
  site?: MiniSite | null;
  /**
   * Studio de vitrine (nouveau modèle 22 panneaux). Il fait foi pour l'aperçu
   * et la fiche acheteur ; `site` n'est que sa projection héritée.
   */
  vitrine?: VitrineSite | null;
}

/** GET /api/shops — la route échoue silencieusement : rien ne bloque l'écran. */
export const listShops = async (): Promise<ShopRecord[]> => {
  const answer = await apiClient
    .get<{ shops?: unknown[] }>('/api/shops')
    .then(unwrap)
    .catch(() => null);
  return (answer?.shops || []).filter((value): value is ShopRecord => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return typeof record.id === 'string' && typeof record.owner === 'string' && typeof record.name === 'string';
  });
};

/** Le corps d'une boutique : identité, accroche, galerie et sections. */
export interface ShopPayload {
  name: string;
  description?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  en_ligne?: boolean;
  presentation?: { photo?: string; video?: string };
  gallery?: string[];
  sections?: ShopSection[];
  /** Mini-site Studio : null efface, absent laisse inchangé. */
  site?: MiniSite | null;
  /** Studio de vitrine : null efface, absent laisse inchangé. */
  vitrine?: VitrineSite | null;
}

/** POST /api/shop/create — le propriétaire est le compte authentifié. */
export const createShop = (payload: ShopPayload & { owner?: string }) =>
  apiClient
    .post<{ status?: string; shop?: ShopRecord; frais?: ShopFees; message?: string }>(
      '/api/shop/create',
      payload,
    )
    .then(unwrap);

/** POST /api/shop/{id}/update — la galerie reste modifiable. */
export const updateShop = (id: string, payload: ShopPayload) =>
  apiClient
    .post<{ status?: string; shop?: ShopRecord; frais?: ShopFees; message?: string }>(
      `/api/shop/${encodeURIComponent(id)}/update`,
      payload,
    )
    .then(unwrap);

/**
 * GET /api/shop/{id} — la boutique, son compteur et le frais à venir.
 * Une boutique inconnue répond 404 : on renvoie null plutôt que de bloquer.
 * La boutique système répond sans compteur ni frais : elle ne s'achète pas de
 * présence en ligne, `secondes_restantes` et `frais` sont alors absents.
 */
export const getShop = async (
  id: string,
): Promise<{
  shop: ShopRecord;
  en_ligne: boolean;
  secondes_restantes?: number;
  systeme?: boolean;
  frais?: ShopFees;
} | null> => {
  try {
    const answer = await apiClient
      .get<{
        shop: ShopRecord;
        en_ligne: boolean;
        secondes_restantes?: number;
        systeme?: boolean;
        frais?: ShopFees;
      }>(`/api/shop/${encodeURIComponent(id)}`)
      .then(unwrap);
    return answer?.shop ? answer : null;
  } catch {
    return null;
  }
};

/**
 * POST /api/shop/{id}/renew — prolonger la présence et ouvrir le robinet.
 * PIN obligatoire : le geste vaut autorisation du prélèvement continu. Ce route
 * ne débite rien, le robinet coule seconde par seconde côté serveur. `jours`
 * prolonge l'échéance (1 à 7), dans la limite de 7 jours de présence continue.
 */
export const renewShop = (id: string, payload: { pin: string; uq_number: string; jours?: number }) =>
  apiClient
    .post<{
      status?: string;
      message?: string;
      code?: string;
      shop?: ShopRecord;
      robinet_ouvert?: boolean;
      en_ligne_jusqu_a?: number;
      secondes_restees?: number;
      pourcent?: number;
      catalogue_points?: number;
      frais_24h_points?: number;
      par_seconde_points?: number;
      regle_points?: number;
    }>(`/api/shop/${encodeURIComponent(id)}/renew`, payload)
    .then(unwrap);

/**
 * Boutique courante d'un vendeur. Le backend remplace la ligne portée par son
 * `id` : la plus récente reste celle qui représente l'état voulu.
 */
export const latestShopOf = (shops: ShopRecord[], owner: string): ShopRecord | null => {
  const id = owner.toUpperCase();
  const owned = shops.filter((shop) => shop.owner.toUpperCase() === id);
  if (owned.length === 0) return null;
  return owned.reduce((best, shop) => (shop.created_at >= best.created_at ? shop : best));
};

/** Secondes de présence restantes ; une boutique héritée n'est pas comptée. */
export const secondesRestantesBoutique = (shop: ShopRecord | null | undefined): number => {
  const echeance = Number(shop?.en_ligne_jusqu_a || 0);
  if (!echeance) return 0;
  return Math.max(0, echeance - Math.floor(Date.now() / 1000));
};

export const boutiqueEnLigne = (shop: ShopRecord | null | undefined): boolean => {
  if (!shop) return false;
  return shop.open !== false && secondesRestantesBoutique(shop) > 0;
};

// ==================== Chat ====================

export const getChatInbox = (uq: string) =>
  apiClient
    .get<{ conversations?: ChatConversation[] }>(`/api/chat/inbox/${encodeURIComponent(uq)}`)
    .then(unwrap);

/**
 * Contact persiste (table chat_contacts du compte) : toute conversation ajoute
 * son interlocuteur, sauf s'il a ete supprime. `zando_item_id` relie la
 * conversation a l'element du marche quand elle a demarre depuis Zando.
 */
export interface ChatContact {
  peer_id: string;
  added_at: number;
  deleted?: boolean;
  blocked?: boolean;
  muted?: boolean;
  locked?: boolean;
  /** Auto-destruction des messages que CE compte envoie dans le fil. */
  ephemere?: boolean;
  zando_item_id?: string | null;
  zando_item_title?: string | null;
}

/** GET /api/chat/contacts/{uq} */
export const listChatContacts = (uq: string) =>
  apiClient
    .get<{ contacts?: ChatContact[]; total?: number }>(
      `/api/chat/contacts/${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

/** POST /api/chat/contacts — action add | delete | restore. */
export const upsertChatContact = (payload: {
  uq: string;
  peer_id: string;
  action?: 'add' | 'delete' | 'restore';
  zando_item_id?: string;
  zando_item_title?: string;
}) =>
  apiClient
    .post<{ status?: string; contact?: ChatContact | null }>('/api/chat/contacts', payload)
    .then(unwrap);

/** POST /api/chat/settings — bloquer, rendre silencieux, verrouiller ou rendre ephemere. */
export const updateChatSettings = (payload: {
  uq: string;
  peer_id: string;
  blocked?: boolean;
  muted?: boolean;
  locked?: boolean;
  ephemere?: boolean;
}) =>
  apiClient
    .post<{ status?: string; contact?: ChatContact | null }>('/api/chat/settings', payload)
    .then(unwrap);

/** Etat reseau du chat : compteurs mesures, pas de valeur inventee. */
export interface ChatReseau {
  status?: string;
  /** Mention honnete du modele de securite reel. */
  chiffrement?: string;
  ephemere_par_defaut?: boolean;
  ttl_ephemere_secondes?: number;
  presence_secondes?: number;
  contacts_en_ligne?: number;
  conversations_en_ligne?: number;
  total_conversations?: number;
  messages_non_lus?: number;
  conversations_non_lues?: number;
}

/**
 * L'appel echoue quand le serveur ne repond pas : l'erreur remonte au bandeau,
 * qui doit distinguer « hors ligne » de « rien a signaler ».
 */
export const getChatStatus = () =>
  apiClient.get<ChatReseau>('/api/chat/status').then(unwrap);

export interface ChatThreadResponse {
  status?: string;
  peer?: string;
  messages?: ChatMessage[];
  /** Nombre de messages marques lus par cet appel. */
  lus_marques?: number;
  /** Le fil du lecteur est en auto-destruction. */
  ephemere?: boolean;
  ttl_seconds?: number;
}

export const getChatMessages = (peer: string, me: string) =>
  apiClient
    .get<ChatThreadResponse>(
      `/api/chat/messages/${encodeURIComponent(peer)}?me=${encodeURIComponent(me)}`,
    )
    .then(unwrap);

/** POST /api/chat/read — { peer } : accuse de lecture sans recharger tout le fil. */
export const marquerLu = (peer: string) =>
  apiClient
    .post<{ status?: string; marques?: number }>('/api/chat/read', { peer })
    .then(unwrap)
    .catch(() => null);

/**
 * POST /api/chat/send — le lien Zando est facultatif : il rattache la
 * conversation a l'element du marche pour les deux participants. La photo
 * voyage en data URL et reste dans le stock local de la plateforme.
 */
export const sendChatMessage = (
  sender: string,
  recipient: string,
  content: string,
  zando?: { id?: string | null; title?: string | null },
  image?: string | null,
) =>
  apiClient
    .post<{ status?: string; sent?: boolean; message_id?: string; blocked?: boolean }>(
      '/api/chat/send',
      {
        sender,
        recipient,
        content,
        ...(zando?.id ? { zando_item_id: zando.id } : {}),
        ...(zando?.title ? { zando_item_title: zando.title } : {}),
        ...(image ? { image } : {}),
      },
    )
    .then(unwrap);

/** Signalement d'un interlocuteur : payload de /api/chat/report. */
export interface SignalementPayload {
  cible_uq: string;
  motif: 'spam' | 'frauduleux' | 'illegal' | 'hors_sujet';
  description?: string;
  /** Capture locale en data URL, jamais une URL externe. */
  preuve?: string;
}

export interface SignalementReponse {
  status?: string;
  id?: number;
  statut?: string;
  message?: string;
}

/** Motifs acceptes par le backend (chat_reports::MOTIFS). */
export const MOTIFS_SIGNALEMENT: SignalementPayload['motif'][] = [
  'spam',
  'frauduleux',
  'illegal',
  'hors_sujet',
];

export const ETIQUETTES_MOTIF: Record<SignalementPayload['motif'], string> = {
  spam: 'Spam ou messages repetes',
  frauduleux: 'Arnaque / compte frauduleux',
  illegal: 'Contenu illegal',
  hors_sujet: 'Hors sujet sur Zando',
};

/**
 * POST /api/chat/report — signalement d'un interlocuteur. Un dossier deja
 * ouvert repond 409 : le message du serveur est rendu tel quel.
 */
export const signalerPair = (payload: SignalementPayload) =>
  apiClient.post<SignalementReponse>('/api/chat/report', payload).then(unwrap);

// ==================== UQ AI ====================

/**
 * Message de la passerelle /api/ai/ask. Le serveur ne garde rien : l'historique
 * voyage avec la question, dans la limite des derniers tours utiles.
 */
export interface AiTour {
  role: 'user' | 'assistant';
  texte: string;
}

/**
 * Reponse de l'assistant. `disponible: false` n'est pas une erreur : c'est le
 * signal de repli sur la base de connaissances locale du frontend.
 */
export interface AiReponse {
  disponible: boolean;
  reponse?: string;
  source?: 'gemini' | 'local';
  modele?: string;
  raison?: string;
}

export const askUqAi = (question: string, histoire: AiTour[], langue?: string) =>
  apiClient
    .post<AiReponse>(
      '/api/ai/ask',
      {
        question,
        histoire: histoire.slice(-12),
        ...(langue ? { langue } : {}),
      },
      /* La passerelle attend le fournisseur jusqu'a 25 s : le delai global de
         15 s aurait declare un echec sur une reponse en cours. */
      { timeout: 30000 },
    )
    .then(unwrap);

export const listChatGroups = (uq: string) =>
  apiClient
    .get<{ groups?: ChatGroup[] }>(`/api/chat/groups/${encodeURIComponent(uq)}`)
    .then(unwrap);

export const getGroupMessages = (groupId: string) =>
  apiClient
    .get<{ messages?: ChatMessage[] }>(`/api/chat/groups/${encodeURIComponent(groupId)}/messages`)
    .then(unwrap);

export const sendGroupMessage = (groupId: string, content: string) =>
  apiClient.post(`/api/chat/groups/${encodeURIComponent(groupId)}/messages`, { content }).then(unwrap);

export const createChatGroup = (payload: {
  name: string;
  description?: string;
  type?: string;
  visibility?: string;
}) => apiClient.post<{ group?: ChatGroup }>('/api/chat/groups', payload).then(unwrap);

export const joinChatGroup = (groupId: string) =>
  apiClient.post(`/api/chat/groups/${encodeURIComponent(groupId)}/join`).then(unwrap);

export const leaveChatGroup = (groupId: string) =>
  apiClient.post(`/api/chat/groups/${encodeURIComponent(groupId)}/leave`).then(unwrap);

export const deleteChatGroup = (groupId: string) =>
  apiClient.delete(`/api/chat/groups/${encodeURIComponent(groupId)}`).then(unwrap);

export const inviteToGroup = (groupId: string, member_id: string) =>
  apiClient
    .post(`/api/chat/groups/${encodeURIComponent(groupId)}/members`, { member_id })
    .then(unwrap);

export const getSystemMessages = () =>
  apiClient
    .get<{ messages?: SystemMessage[] }>('/api/treasury/system/messages')
    .then(unwrap)
    .catch(() => ({ messages: [] }));

// ==================== Securite / PIN / KYC ====================

/**
 * Bornes du PIN cote backend (pin_manager::PIN_MIN_LENGTH / PIN_MAX_LENGTH).
 * La longueur exacte du PIN en place est lue via /api/account/pin/status.
 */
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

/**
 * Reponse de /api/account/pin/status. `pin_status` est l'enum PinStatus
 * serialise par le backend : "Ready", "NotConfigured", "Disabled" ou un
 * objet { Locked } / { Cooldown }. `pin_length` est la longueur reelle du PIN.
 */
export interface PinStatusResponse {
  status?: string;
  pin_status?: string | Record<string, unknown>;
  pin_length?: number;
}

export const getPinStatus = (uq_number: string) =>
  apiClient.post<PinStatusResponse>('/api/account/pin/status', { uq_number }).then(unwrap);

/** Le PIN n'est utilisable que lorsque le backend repond "Ready". */
export const pinIsConfigured = (status?: PinStatusResponse | null): boolean =>
  status?.pin_status === 'Ready' ||
  (typeof status?.pin_status === 'object' && status?.pin_status !== null);

export const verifyPin = (uq_number: string, pin: string) =>
  apiClient
    .post<{ valid?: boolean; pin_configured?: boolean; message?: string }>(
      '/api/account/pin/verify',
      { uq_number, pin },
    )
    .then(unwrap);

/**
 * Configure ou modifie le PIN (meme route).
 * - `password` est TOUJOURS exige (verification du mot de passe du compte).
 * - `old_pin` devient obligatoire des qu'un PIN existe deja.
 * - Le backend accepte 4 a 6 chiffres (pin_manager::PIN_MIN/MAX_LENGTH).
 */
export const setPin = (payload: {
  uq_number: string;
  pin: string;
  password: string;
  old_pin?: string;
}) => apiClient.post('/api/account/pin/set', payload).then(unwrap);

export const removePin = (uq_number: string, password?: string) =>
  apiClient.post('/api/account/pin/remove', { uq_number, password }).then(unwrap);

export const verifyPassword = (uq_number: string, password: string) =>
  apiClient
    .post<{ valid?: boolean; message?: string }>('/api/account/pin/verify-password', {
      uq_number,
      password,
    })
    .then(unwrap);

export const changePassword = (payload: {
  uq_number: string;
  old_password: string;
  new_password: string;
}) => apiClient.post('/api/account/password/change', payload).then(unwrap);

export const getSecurityStatus = () =>
  apiClient.get('/api/security/status').then(unwrap).catch(() => null);

// ----- WebAuthn (biometrie : Face ID / empreinte / Windows Hello) -----

/**
 * Reponse des routes de challenge (`.../begin`).
 * `allowCredentials` est la liste des cles que le serveur attend : le navigateur
 * ne peut signer qu'avec l'une d'elles.
 */
export interface WebAuthnBeginResponse {
  status?: string;
  message?: string;
  challenge?: string;
  timeout?: number;
  rpId?: string;
  userVerification?: string;
  rp?: { name: string; id: string };
  user?: { id: string; name: string; displayName: string };
  pubKeyCredParams?: { type: 'public-key'; alg: number }[];
  attestation?: string;
  authenticatorSelection?: { userVerification?: string; residentKey?: string };
  allowCredentials?: { type: 'public-key'; id: string }[];
  palier?: string;
  token?: string;
  httpStatus?: number;
}

/**
 * POST /api/webauthn/register/begin
 * La route exige la session en cours (Bearer) : un passkey ne se greffe que sur
 * un compte deja authentifie.
 */
export const webauthnRegisterBegin = (uq_number: string) =>
  apiClient
    .post<WebAuthnBeginResponse>(
      '/api/webauthn/register/begin',
      { uq_number },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

/**
 * POST /api/webauthn/register/complete
 * `attestation_object` = `response.attestationObject` brut de l'authentificateur,
 * en base64url. Le serveur en tire lui-meme la cle publique et l'identifiant :
 * le client n'envoie plus de « public_key » interpretée a sa facon.
 */
export const webauthnRegisterComplete = (payload: {
  uq_number: string;
  challenge: string;
  attestation_object: string;
  credential_id: string;
  device_name?: string;
}) =>
  apiClient
    .post<{
      status?: string;
      message?: string;
      credential_id?: string;
      device_label?: string;
      controle_complet_herite?: boolean;
      httpStatus?: number;
    }>(
      '/api/webauthn/register/complete',
      payload,
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const webauthnLoginBegin = (uq_number: string, credential_id = '') =>
  apiClient
    .post<WebAuthnBeginResponse>(
      '/api/webauthn/login/begin',
      { uq_number, credential_id },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

/**
 * POST /api/webauthn/login/complete
 * Le serveur verifie la signature ECDSA sur `authenticator_data ||
 * sha256(client_data_json)` : sans ces trois champs, rien ne peut etre verifie.
 */
export const webauthnLoginComplete = (payload: {
  uq_number: string;
  challenge: string;
  credential_id: string;
  authenticator_data: string;
  client_data_json: string;
  signature: string;
}) =>
  apiClient
    .post<{
      status?: string;
      message?: string;
      token?: string;
      uq_number?: string;
      credential_id?: string;
      palier?: string;
      role?: string;
      email_mot_de_passe_requis?: boolean;
      httpStatus?: number;
    }>(
      '/api/webauthn/login/complete',
      payload,
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const webauthnTransactionBegin = (uq_number: string, transaction_id: string) =>
  apiClient
    .post<WebAuthnBeginResponse>(
      '/api/webauthn/transaction/begin',
      { uq_number, transaction_id },
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const webauthnTransactionComplete = (payload: {
  uq_number: string;
  challenge: string;
  transaction_id: string;
  credential_id: string;
  authenticator_data: string;
  client_data_json: string;
  signature: string;
}) =>
  apiClient
    .post<{ status?: string; message?: string; validated?: boolean; httpStatus?: number }>(
      '/api/webauthn/transaction/complete',
      payload,
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const webauthnList = () =>
  apiClient
    .post<{ status?: string; credentials?: { credential_id: string; device_name?: string }[] }>(
      '/api/webauthn/list',
      {},
      { validateStatus: () => true },
    )
    .then((r) => ({ ...r.data, httpStatus: r.status }));

export const getKycStatus = () =>
  apiClient.get<KycStatus>('/api/kyc/status').then(unwrap).catch(() => null);

export interface KycDossierStatut {
  status?: string;
  uq_number?: string;
  statut?: 'AUCUN' | 'EnAttente' | 'Verifie' | 'Refuse' | string;
  soumis_at?: number;
  decision_at?: number;
  message?: string;
}

export const getKycStatut = (user: string) =>
  apiClient
    .get<KycDossierStatut>(`/api/kyc/statut/${encodeURIComponent(user)}`)
    .then(unwrap)
    .catch(() => null);

/** Depot du dossier KYC (identite + photo + selfie + session de vivacite). */
export const submitIdentityDossier = (payload: {
  uq_number: string;
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  pays?: string;
  adresse?: string;
  telephone?: string;
  document_number?: string;
  photo_base64?: string;
  video_base64?: string;
  selfie_base64?: string;
  session_vivacite?: string;
}) => apiClient.post('/api/core/verify-identity', payload).then(unwrap);

export const analyzeKycDoc = (payload: Record<string, unknown>) =>
  apiClient.post('/api/kyc/doc/analyze', payload).then(unwrap);

export const submitVerification = (payload: Record<string, unknown>) =>
  apiClient.post('/api/account/verification/submit', payload).then(unwrap);

export const getVerificationStatus = (id: string) =>
  apiClient.get(`/api/account/verification/${encodeURIComponent(id)}`).then(unwrap);

export const canReclaim = () =>
  apiClient
    .get<{
      status?: string;
      can_reclaim?: boolean;
      raison?: string;
      solde_borb?: number;
      uq_profil2?: string;
    }>('/api/kyc/can-reclaim')
    .then(unwrap)
    .catch(() => null);

// ==================== Lecteur / divers ====================

export const playerStart = (payload: Record<string, unknown> = {}) =>
  apiClient
    .post<{ status?: string; cached?: boolean; message?: string; price_per_second?: number }>(
      '/api/player/start',
      payload,
    )
    .then(unwrap);

export const playerTick = (payload: Record<string, unknown> = {}) =>
  apiClient.post('/api/player/tick', payload).then(unwrap);

export const playerStop = (contentUrl?: string) =>
  apiClient
    .post<{ status?: string; total_points_paid?: number; message?: string }>(
      '/api/player/stop',
      contentUrl ? { content_url: contentUrl } : {},
    )
    .then(unwrap);

export const playerStatus = () => apiClient.get('/api/player/status').then(unwrap);

export const playerStats = () => apiClient.get('/api/player/stats').then(unwrap);

export const getNetworkStatus = () => apiClient.get('/api/network/status').then(unwrap).catch(() => null);

export const getVaultStatus = () => apiClient.get('/api/vault/status').then(unwrap).catch(() => null);

export const getTreasury = () => apiClient.get('/api/distribution/treasury').then(unwrap).catch(() => null);

export const getDelis = () => apiClient.get('/api/distribution/delis').then(unwrap).catch(() => null);

export const getTreasury1m = () => apiClient.get('/api/treasury/1m/status').then(unwrap).catch(() => null);

// ==================== Gardien / coffre proprietaire ====================
// Les routes owner exigent un JWT de role owner/guardian. Le jeton guardian
// est stocke separement pour ne pas ecraser la session utilisateur.

const GUARDIAN_STORAGE = 'uq_guardian_token';

export const getGuardianToken = (): string | null => localStorage.getItem(GUARDIAN_STORAGE);

export const setGuardianToken = (token: string | null) => {
  if (token) localStorage.setItem(GUARDIAN_STORAGE, token);
  else localStorage.removeItem(GUARDIAN_STORAGE);
};

const guardianRequest = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  // Jeton gardien explicite s'il existe, sinon la session courante : une
  // connexion proprietaire delivre deja un JWT de role guardian.
  const token = getGuardianToken() || localStorage.getItem('uq_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await apiFetch(path, { ...init, headers });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message || `Requete refusee (${response.status})`;
    throw new ApiError(message, response.status, (payload as { code?: string } | null)?.code);
  }
  return payload as T;
};

export interface GuardianLoginResponse {
  status?: string;
  message?: string;
  token?: string;
  account?: Record<string, unknown>;
  httpStatus?: number;
}

/**
 * POST /api/guardian/login — { number, email, password }
 * Ne leve pas sur un refus HTTP : les messages du backend citent le nombre de
 * tentatives restantes, c'est a l'appelant de n'afficher qu'un texte generique.
 * Aucun jeton de session n'est joint : c'est la porte d'entree publique.
 * `credential_id` : la cle deja enregistree sur CET appareil, si elle existe.
 * Le serveur s'en sert seulement pour horoder le controle complet.
 */
export const guardianLogin = async (payload: {
  number: string;
  email: string;
  password: string;
  credential_id?: string;
}) => {
  const response = await apiFetch('/api/guardian/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => null)) as GuardianLoginResponse | null;
  return { ...(data || {}), httpStatus: response.status };
};

/** POST /api/location/update — position GPS de l'appareil (facultative). */
export const updateLocation = (payload: {
  uq_number: string;
  latitude: number;
  longitude: number;
}) =>
  apiClient
    .post('/api/location/update', payload, { validateStatus: () => true })
    .then((r) => r.data);

/** GET /api/guardian/status — exige la cle terminal */
export const guardianStatus = () =>
  guardianRequest<{ locked?: boolean; failed_attempts?: number; session_active?: boolean }>(
    '/api/guardian/status',
  );

export const guardianLogout = () =>
  guardianRequest('/api/guardian/logout', { method: 'POST' }).catch(() => null);

export interface Treasury1mState {
  status?: string;
  tresor_1m?: {
    profil?: string;
    solde_borb?: number;
    solde_points?: number;
    cible_borb?: number;
    seuil_recharge_borb?: number;
    recharge_necessaire?: boolean;
    source?: string;
    transferable?: boolean;
    note?: string;
  };
  ocean_borb?: number;
  invariant_ok?: boolean;
}

/** GET /api/treasury/1m/status */
export const getTreasury1mStatus = () => guardianRequest<Treasury1mState>('/api/treasury/1m/status');

/** POST /api/treasury/1m/recharge (owner) */
export const rechargeTreasury1m = (force = false) =>
  guardianRequest<Record<string, unknown>>(`/api/treasury/1m/recharge${force ? '?force=true' : ''}`, {
    method: 'POST',
  });

/** GET /api/distribution/repartition/status (owner) */
export const getRepartitionStatus = () =>
  guardianRequest<{ status?: string; deja_reparti?: boolean; stats?: Record<string, unknown> }>(
    '/api/distribution/repartition/status',
  );

/** GET /api/distribution/delis (owner) — profil 2 */
export const getDistributionDelis = () =>
  guardianRequest<Record<string, unknown>>('/api/distribution/delis');

/** GET /api/distribution/treasury (owner) */
export const getDistributionTreasury = () =>
  guardianRequest<Record<string, unknown>>('/api/distribution/treasury');

/**
 * Numero UQ du profil vise par une bascule (proprietaire ou profil rattache).
 *
 * Contrat attendu cote backend : `GET /api/distribution/delis` renvoie le
 * profil rattache et `GET /api/distribution/treasury` le proprietaire, tous
 * deux accompagnes de leur champ `uq`. La lecture tolere l'objet a plat comme
 * l'objet imbrique (`profile2_delis` / `profile1_treasury`).
 *
 * Si le backend ne fournit pas le champ, la fonction renvoie une chaine vide :
 * l'appelant se rabat alors sur le numero deja memorise par le terminal. Aucun
 * numero de compte n'est ecrit en dur ici.
 */
export interface ProfileTarget {
  uq: string;
  email: string;
}

export const resolveProfileUq = async (profile: 'owner' | 'profil2'): Promise<ProfileTarget> => {
  const clean = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : '';

  const readTarget = (payload: unknown, depth = 0): ProfileTarget => {
    if (!payload || typeof payload !== 'object' || depth > 2) return { uq: '', email: '' };
    const record = payload as Record<string, unknown>;
    const direct = clean(record.uq) || clean(record.uq_number);
    const email = clean(record.email);
    if (direct) return { uq: direct.toUpperCase(), email };
    const nestedKeys =
      profile === 'owner' ? ['profile1_treasury', 'treasury'] : ['profile2_delis', 'delis'];
    for (const key of [...nestedKeys, 'stats']) {
      const nested = readTarget(record[key], depth + 1);
      if (nested.uq) return nested;
    }
    return { uq: '', email: '' };
  };

  try {
    const payload = await (profile === 'owner' ? getDistributionTreasury() : getDistributionDelis());
    return readTarget(payload);
  } catch {
    return { uq: '', email: '' };
  }
};

/** GET /api/treasury/wallets */
export const getTreasuryWallets = () =>
  guardianRequest<{ status?: string; wallets?: { crypto_type?: string; wallet_address?: string; label?: string; is_default?: number }[] }>(
    '/api/treasury/wallets',
  );

export interface ClaimResult {
  status?: string;
  message?: string;
  /** Champs `*_points`, `*_avant`, `*_apres` : grand livre en points. */
  montant_points?: number;
  /** Champs `*_borb` : deja ramenes en BORB par le backend (nom de transport). */
  montant_borb?: number;
  owner_avant?: number;
  owner_apres?: number;
  profil2_avant?: number;
  profil2_apres?: number;
  owner_borb?: number;
  profil2_borb?: number;
}

/** POST /api/distribution/claim-with-pin — { code_pin, uq_profil2? } */
export const claimDistributionWithPin = (payload: { code_pin: string; uq_profil2?: string }) =>
  guardianRequest<ClaimResult>('/api/distribution/claim-with-pin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export interface AutoValidateKycResult {
  status?: string;
  message?: string;
  target_uq?: string;
  target_email?: string;
  validated_at?: number;
}

/**
 * POST /api/distribution/auto-validate-kyc
 * Body : { owner_uq, owner_email, target_uq, target_email }
 * Le backend verifie l'identite de l'owner avant de valider le KYC de la cible.
 */
export const autoValidateKyc = (payload: {
  owner_uq: string;
  owner_email: string;
  target_uq: string;
  target_email: string;
}) =>
  guardianRequest<AutoValidateKycResult>('/api/distribution/auto-validate-kyc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ==================== Publications ephemeres (7 jours, statuts 24 h) ====================

export type PublicationKind = 'annonce' | 'conference' | 'publication' | 'status';

export interface PublicationComment {
  pseudo: string;
  content: string;
  created_at: number;
  mine?: boolean;
}

export interface Publication {
  id: string;
  kind: PublicationKind | string;
  title: string;
  body: string;
  price?: number | null;
  /** Media du statut (URL ou data URI) : null pour une publication texte. */
  media?: string | null;
  /** Element Zando que le statut met en avant : la publication n'en est qu'un lien. */
  zando_item_id?: string | null;
  author_pseudo: string;
  author_name?: string;
  author_avatar?: string;
  author_badge?: string;
  author_certifie?: boolean;
  created_at: number;
  expires_at: number;
  likes: number;
  liked: boolean;
  mine: boolean;
  vues: number;
  comments: PublicationComment[];
  comment_count: number;
}

/** GET /api/publications — annonces, conferences, posts et statuts en ligne. */
export const listPublications = () =>
  apiClient
    .get<{ publications?: Publication[] }>('/api/publications')
    .then(unwrap);

/** POST /api/publications — { kind, title, body?, price?, media?, zando_item_id? } */
export const createPublication = (payload: {
  kind: PublicationKind;
  title: string;
  body?: string;
  price?: number;
  media?: string;
  zando_item_id?: string;
}) =>
  apiClient
    .post<{ publication?: Publication }>('/api/publications', payload)
    .then(unwrap);

/** POST /api/publications/{id}/like — ajout idempotent, renvoie le nouveau total. */
export const likePublication = (id: string) =>
  apiClient
    .post<{ likes: number; deja_like: boolean }>(
      `/api/publications/${encodeURIComponent(id)}/like`,
      {},
    )
    .then(unwrap);

/** DELETE /api/publications/{id}/like — retrait, renvoie le nouveau total. */
export const unlikePublication = (id: string) =>
  apiClient
    .delete<{ likes: number; retire: boolean }>(
      `/api/publications/${encodeURIComponent(id)}/like`,
    )
    .then(unwrap);

/** POST /api/publications/{id}/view — vue comptée, identifiant anonyme accepté. */
export const recordPublicationView = (id: string) =>
  apiClient
    .post<{ vues: number }>(`/api/publications/${encodeURIComponent(id)}/view`, {})
    .then(unwrap);

/** POST /api/publications/{id}/comment — { content } */
export const commentPublication = (id: string, content: string) =>
  apiClient
    .post<{ publication?: Publication }>(
      `/api/publications/${encodeURIComponent(id)}/comment`,
      { content },
    )
    .then(unwrap);

// ====================
// Profil public : stats, badge, abonnés, notation
// ====================

export interface ReputationColors {
  vert: number;
  blanc: number;
  orange: number;
  rouge: number;
  noir: number;
  vert_depuis_rouge: number;
}

export interface ProfileStatsResponse {
  pseudo: string;
  name: string;
  avatar_url: string;
  couleur_anneau?: string;
  est_ami?: boolean;
  demande_envoyee_par_moi?: boolean;
  demande_envoyee_vers_moi?: boolean;
  public_profile?: {
    description?: string;
    city?: string;
    origin_city?: string;
    occupation?: string;
    marital_status?: string;
    mobile_money_number?: string;
    trading_currency?: string;
  };
  stats: {
    total_publications: number;
    total_likes_recus: number;
    total_vues_recues: number;
    total_commentaires_recus: number;
    total_commentaires_ecrits: number;
    total_abonnes: number;
    total_abonnements: number;
    note_moyenne: number;
    nb_avis: number;
    ventes: number;
    anciennete_jours: number;
    kyc_verifie: boolean;
    reputation?: ReputationColors;
    total_reseaux?: number;
  };
  score_confiance: {
    total: number;
    composantes: Record<string, number>;
    certifie: boolean;
    badge: string;
  };
  vous_suivez_deja: boolean;
}

export interface FollowIdentity {
  pseudo: string;
  name: string;
  avatar_url: string;
}

/** GET /api/profile/stats/{pseudo} — stats agrégées, score et badge. */
export const getProfileStats = (pseudo: string) =>
  apiClient
    .get<ProfileStatsResponse>(`/api/profile/stats/${encodeURIComponent(pseudo)}`)
    .then(unwrap);

/** POST /api/follow/{pseudo} — suivre, renvoie le nouveau total d'abonnés. */
export const followUser = (pseudo: string) =>
  apiClient
    .post<{ total_abonnes: number; deja_suivi: boolean }>(
      `/api/follow/${encodeURIComponent(pseudo)}`,
      {},
    )
    .then(unwrap);

/** DELETE /api/follow/{pseudo} — ne plus suivre. */
export const unfollowUser = (pseudo: string) =>
  apiClient
    .delete<{ total_abonnes: number }>(`/api/follow/${encodeURIComponent(pseudo)}`)
    .then(unwrap);

/** GET /api/follow/{pseudo}/followers?limit&offset — abonnés (pseudo uniquement). */
export const listFollowers = (pseudo: string, limit = 20, offset = 0) =>
  apiClient
    .get<{ total: number; abonnes: FollowIdentity[] }>(
      `/api/follow/${encodeURIComponent(pseudo)}/followers?limit=${limit}&offset=${offset}`,
    )
    .then(unwrap);

/** GET /api/follow/{pseudo}/following?limit&offset — abonnements. */
export const listFollowing = (pseudo: string, limit = 20, offset = 0) =>
  apiClient
    .get<{ total: number; abonnements: FollowIdentity[] }>(
      `/api/follow/${encodeURIComponent(pseudo)}/following?limit=${limit}&offset=${offset}`,
    )
    .then(unwrap);

/** POST /api/profile/{pseudo}/note — note de 1 à 5, une par compte. */
export const rateProfile = (pseudo: string, note: number) =>
  apiClient
    .post<{ note_moyenne: number; nb_avis: number }>(
      `/api/profile/${encodeURIComponent(pseudo)}/note`,
      { note },
    )
    .then(unwrap);

// ---------------------------------------------------------------------------
// Marketplace — transactions séquestre / hors UQ / livreur de confiance.
// Backend : uq_platform_bin/src/marketplace.rs + marketplace_routes.rs.
// ---------------------------------------------------------------------------

export interface MarketplaceTransaction {
  id: number;
  produit_id: string;
  type_produit: string;
  vendeur: string;
  acheteur: string;
  livreur_uq?: string | null;
  statut: string;
  points_total?: number;
  points_livraison?: number;
  devise?: string;
  acompte?: boolean;
  vendeur_a_livre?: boolean;
  acheteur_a_recu?: boolean;
  recupere_at?: number | null;
  creneau_id?: number | null;
  mode_paiement?: string;
  frais_hors_uq?: number;
  created_at?: number;
}

export interface LivreurConfiance {
  vendeur: string;
  livreur: string;
  statut: string;
  nb_livraisons?: number;
  created_at?: number;
}

export const TYPE_PRODUIT_LABELS: Record<string, string> = {
  physique: 'Produit physique',
  numerique: 'Produit numérique',
  transport: 'Transport',
  sport: 'Sport',
  en_ligne: 'En ligne',
  domicile: 'À domicile',
  service: 'Service',
};

export const STATUT_TX_LABELS: Record<string, string> = {
  reservation: 'Réservation',
  payee: 'Payée — séquestre',
  confirme: 'Confirmée',
  attente_livreur: 'Livreur proposé',
  en_validation: 'Code de confirmation',
  libere: 'Libérée',
  litige: 'Litige',
  annulee: 'Annulée',
  hors_uq_reserve: 'Hors UQ — réservé',
  hors_uq_en_attente: 'Hors UQ — en attente vendeur',
  hors_uq_confirme: 'Hors UQ — confirmé',
  hors_uq_litige: 'Hors UQ — litige',
  hors_uq_terminee: 'Hors UQ — terminée',
};

/** POST /api/marketplace/transactions — crée la réservation (statut `reservation`). */
export const marketplaceCreer = (payload: {
  produit_id: string;
  type_produit: string;
  vendeur: string;
  points_total: number;
  points_livraison?: number;
  devise?: string;
  acompte?: boolean;
  creneau_id?: number;
}) =>
  apiClient
    .post<{ id: number }>('/api/marketplace/transactions', payload)
    .then(unwrap);

/** GET /api/marketplace/{id} — le prix est masqué côté serveur pour le livreur. */
export const marketplaceDetail = (id: number) =>
  apiClient
    .get<MarketplaceTransaction>(`/api/marketplace/${id}`)
    .then(unwrap);

/** GET /api/marketplace/mes?role=acheteur|vendeur|livreur */
export const marketplaceMes = (role: 'acheteur' | 'vendeur' | 'livreur') =>
  apiClient
    .get<MarketplaceTransaction[]>(`/api/marketplace/mes?role=${role}`)
    .then(unwrap);

/** POST /api/marketplace/{id}/payer — body { pin } : séquestre le montant. */
export const marketplacePayer = (id: number, pin: string) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/payer`, { pin })
    .then(unwrap);

export const marketplaceAccepter = (id: number) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/accepter`)
    .then(unwrap);

export const marketplaceRefuser = (id: number) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/refuser`)
    .then(unwrap);

/** POST /api/marketplace/{id}/livreur — body { livreur } (UQ ou pseudo). */
export const marketplaceAssignLivreur = (id: number, livreur: string) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/livreur`, { livreur })
    .then(unwrap);

export const marketplaceLivreurAccepte = (id: number) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/livreur_accepte`)
    .then(unwrap);

export const marketplaceLivreurRefuse = (id: number) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/livreur_refuse`)
    .then(unwrap);

/** POST /api/marketplace/{id}/action — livre | recoit | recupere | code | litige | annuler. */
export const marketplaceAction = (
  id: number,
  action: 'livre' | 'recoit' | 'recupere' | 'code' | 'litige' | 'annuler',
  code?: string,
  motif?: string,
) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/action`, {
      action,
      ...(code ? { code } : {}),
      ...(motif ? { motif } : {}),
    })
    .then(unwrap);

/** POST /api/marketplace/{id}/gps — point GPS de la transaction. */
export const marketplaceGps = (id: number, lat: number, lng: number) =>
  apiClient
    .post<{ enregistre: boolean }>(`/api/marketplace/${id}/gps`, { lat, lng })
    .then(unwrap);

// --- Q18 : paiement hors UQ (déclaré, 1 % par partie, sans garantie UQ) ---

export const horsUqAcheteur = (id: number, pin: string) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/mode-hors-uq/acheteur`, { pin })
    .then(unwrap);

export const horsUqVendeur = (id: number, pin: string) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/mode-hors-uq/vendeur`, { pin })
    .then(unwrap);

export const horsUqRefuser = (id: number) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/mode-hors-uq/refuser`)
    .then(unwrap);

export const horsUqLitige = (id: number, motif: string) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/hors-uq/litige`, { motif })
    .then(unwrap);

export const horsUqTerminer = (id: number) =>
  apiClient
    .post<MarketplaceTransaction>(`/api/marketplace/${id}/hors-uq/terminer`)
    .then(unwrap);

// --- Livreurs de confiance (Q9) ---

/** GET /api/livreur/list — livreurs de confiance du vendeur connecté (Q9). */
export const livreurList = () =>
  apiClient.get<LivreurConfiance[]>('/api/livreur/list').then(unwrap);

/** POST /api/livreur/register — body { livreur, charte_acceptee } (Q9). */
export const livreurRegister = (livreur: string, charteAcceptee = true) =>
  apiClient
    .post<{ enregistre: boolean }>('/api/livreur/register', {
      livreur,
      charte_acceptee: charteAcceptee,
    })
    .then(unwrap);

/** POST /api/livreur/remove — body { livreur } : retire un livreur (Q9). */
export const livreurRemove = (livreur: string) =>
  apiClient
    .post<{ retire: boolean }>('/api/livreur/remove', { livreur })
    .then(unwrap);

/** GET /api/account/warnings — avertissements et blocages du compte. */
export const accountWarnings = () =>
  apiClient.get<Record<string, unknown>>('/api/account/warnings').then(unwrap);
