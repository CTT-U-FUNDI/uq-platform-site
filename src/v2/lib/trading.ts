import apiClient from '../../api/client';
import { ecrireCacheTaux, reponseHorsLigne, sansReponseHttp } from './api';
import type { SeriesPeriod } from './charts';

/**
 * Client du marche UQ : devises, ordres, P2P mobile et notifications d'ecran.
 * Chaque fonction correspond a une route reelle du backend Rust
 * (`uq_platform_bin/src/trading_routes.rs`). Aucun prix n'est calcule ici :
 * l'oracle renvoie deja les taux, le backend les applique.
 */

const unwrap = <T,>(response: { data: T }): T => response.data;

// ==================== Types ====================

export interface TradingMarket {
  pair: string;
  base: string;
  quote: string;
  /** Unites de `quote` pour 1 `base`, lues sur l'oracle. */
  price: number;
  last: number;
  trades_24h: number;
  volume_24h: number;
}

export interface TradingMarketsResponse {
  status: string;
  base: string;
  updated_at: number;
  source: string;
  /** Libellé de fraîcheur publié par le moteur (ou posé par le cache local). */
  badge?: string;
  age_secs?: number;
  /** Vrai quand la réponse vient du cache de l'appareil, réseau coupé. */
  hors_ligne?: boolean;
  markets: TradingMarket[];
}

export interface TradingProfile {
  pseudo: string;
  phone: string;
  operator: string;
  kyc_verified: boolean;
  display_currency: string;
}

export interface TradingBalance {
  code: string;
  balance: number;
  /** null quand le moteur de taux n'a jamais observé cette devise. */
  usd_value: number | null;
}

export interface TradingContextResponse {
  status: string;
  uq: string;
  profile: TradingProfile;
  phone_ready: boolean;
  pin_configured: boolean;
  balances: TradingBalance[];
  /**
   * `borb_usd` : prix interne d'1 BORB en USD publié par le régulateur. `null`
   * quand il n'est pas disponible — l'app n'invente jamais de référence.
   */
  oracle: { base: string; updated_at: number; source: string; borb_usd?: number | null };
}

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface TradingOrder {
  id: number;
  uq: string;
  pair: string;
  base: string;
  quote: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  filled: number;
  total: number;
  status: 'open' | 'filled' | 'cancelled';
  created_at: number;
  updated_at: number;
}

export interface OrderbookLevel {
  price: number;
  amount: number;
  orders: number;
}

export interface OrderbookResponse {
  status: string;
  pair: string;
  base: string;
  quote: string;
  oracle_price: number | null;
  last_price: number | null;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface TradeRow {
  price: number;
  amount: number;
  total: number;
  side: OrderSide;
  created_at: number;
}

export interface TradesResponse {
  status: string;
  pair: string;
  base: string;
  quote: string;
  trades: TradeRow[];
}

/** Indicateur d'écart au taux de référence : il informe, il ne bloque pas la vente. */
export interface P2PRateSignal {
  niveau: 'ok' | 'attention' | 'indisponible';
  sens: 'proche' | 'eleve' | 'bas' | 'inconnu';
  ecart_pct?: number;
  message: string;
}

export interface P2POffer {
  id: number;
  uq: string;
  pseudo: string;
  side: OrderSide;
  currency: string;
  /** Unites de `currency` pour 1 BORB (base du taux : `rate_base`). */
  rate: number;
  rate_base?: string;
  /**
   * Unite des bornes et du deja pris : `BORB` pour les offres recentes (la
   * quantite vendue est en BORB), `DEVISE` pour les offres heritees ou le
   * montant saisi etait en devise de paiement.
   */
  amount_unit?: 'BORB' | 'DEVISE';
  min_borb?: number;
  max_borb?: number;
  remaining_borb?: number;
  /** 1 BORB dans la devise de l'offre, composé par l'oracle ; null si indisponible. */
  reference_rate?: number | null;
  rate_deviation_pct?: number | null;
  rate_signal?: P2PRateSignal;
  min_amount: number;
  max_amount: number;
  /** Déjà pris sur l'offre, dans la devise de paiement. */
  taken_amount?: number;
  remaining?: number;
  operator: string;
  city: string;
  /** Numero masque tant que la commande n'est pas prise. */
  phone: string;
  status: string;
  created_at: number;
  mine: boolean;
}

export interface P2POffersResponse {
  status: string;
  offers: P2POffer[];
}

export type P2POrderStatus = 'pending_payment' | 'paid' | 'completed' | 'cancelled';

export interface P2POrder {
  id: number;
  offer_id: number;
  buyer: string;
  seller: string;
  /** Fiche publique du vendeur ; c'est elle qui s'affiche, jamais l'identifiant. */
  seller_display?: string;
  currency: string;
  amount: number;
  /** Quantity of BORB immobilised by the escrow. */
  escrow_points?: number;
  /** `escrow_points` décliné en BORB. */
  borb_amount?: number;
  rate: number;
  rate_base?: string;
  usd_amount: number;
  /** Legacy : la ligne de l'acheteur, telle qu'elle était stockée avant la
   *  séparation. Ne sert plus comme référence de preuve — voir `numeroDePreuve`. */
  phone?: string;
  /** La ligne d'où part le paiement de l'acheteur. */
  buyer_phone?: string;
  /** La ligne où le paiement doit arriver : ce que l'acheteur doit recopier. */
  seller_phone?: string;
  /** Le serveur seul sait quelle ligne la preuve de l'appelant doit montrer. */
  numero_de_preuve?: string;
  operator: string;
  status: P2POrderStatus;
  chat_group_id: string;
  created_at: number;
  updated_at: number;
  /** Renseignes par la liste : role de l'appelant et vis-a-vis. */
  role?: 'buyer' | 'seller';
  peer?: string;
  /** Analyse de la preuve déposée par l'appelant : ouvre ou non « J'ai payé ». */
  my_proof?: P2PProof | null;
  /** Analyse de la preuve de la partie adverse, visible avant de libérer les BORB. */
  peer_proof?: P2PProof | null;
}

/**
 * La ligne mobile money que cette partie doit montrer sur sa preuve. Le serveur
 * la résout déjà (`numero_de_preuve`) ; ce repli couvre les commandes plus
 * anciennes, où `phone` portait le numéro de l'acheteur et ne peut donc jamais
 * servir de référence à l'acheteur lui-même.
 */
export function numeroDePreuve(order: P2POrder): string {
  if (order.numero_de_preuve) return order.numero_de_preuve;
  return order.role === 'seller' ? order.buyer_phone || '' : order.seller_phone || '';
}

export interface P2POrdersResponse {
  status: string;
  uq: string;
  orders: P2POrder[];
}

export interface P2PTakeResponse {
  status: string;
  order: P2POrder;
  seller_phone: string;
  buyer_kyc_verified: boolean;
  instructions: string;
}

export type NotificationScope = 'kyc' | 'coffre' | 'zando' | 'trading' | 'chat';

export interface ScreenNotification {
  id: number;
  scope: NotificationScope | string;
  title: string;
  body: string;
  reference: string;
  read: boolean;
  created_at: number;
  /** L'objet derrière la notification est encore vivant (ordre ouvert,
   *  commande P2P en attente, épargne verrouillée) : tête épinglée. */
  en_cours: boolean;
}

export interface ScreenNotificationsResponse {
  status: string;
  uq: string;
  total_unread: number;
  total_en_cours: number;
  counts: Partial<Record<NotificationScope | string, number>>;
  notifications: ScreenNotification[];
}

// ==================== Marche ====================

/**
 * Paires du marche, lues sur l'oracle. Hors-ligne, la derniere reponse recue
 * continue de s'appliquer : un membre qui consulte ses offres sans reseau doit
 * voir les memes taux que juste avant la coupure, avec leur age affiche.
 */
export const getTradingMarkets = () =>
  apiClient
    .get<TradingMarketsResponse>('/api/trading/markets')
    .then(unwrap)
    .then((data) => {
      // Une reponse sans paire ne prouve rien : elle n'ecrase pas la capture.
      if (data?.markets && data.markets.length > 0) ecrireCacheTaux('marches', data);
      return data;
    })
    .catch((error) => {
      if (!sansReponseHttp(error)) throw error;
      return reponseHorsLigne<TradingMarketsResponse>('marches');
    });

export const getTradingContext = (uq: string) =>
  apiClient
    .get<TradingContextResponse>(`/api/trading/context/${encodeURIComponent(uq)}`)
    .then(unwrap);

export const getOrderbook = (pair: string) =>
  apiClient
    .get<OrderbookResponse>(`/api/trading/orderbook/${encodeURIComponent(pair)}`)
    .then(unwrap);

export const getPairTrades = (pair: string) =>
  apiClient
    .get<TradesResponse>(`/api/trading/trades/${encodeURIComponent(pair)}`)
    .then(unwrap);

export const placeOrder = (payload: {
  uq: string;
  pair: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  price?: number;
  pin: string;
}) =>
  apiClient
    .post<{ status: string; execution: string; oracle_price: number; order: TradingOrder }>(
      '/api/trading/orders',
      payload,
    )
    .then(unwrap);

export const getTradingOrders = (uq: string) =>
  apiClient
    .get<{ status: string; uq: string; open_count: number; orders: TradingOrder[] }>(
      `/api/trading/orders/${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

export const cancelOrder = (id: number, uq: string) =>
  apiClient
    .post<{ status: string; message: string }>(`/api/trading/orders/${id}/cancel`, { uq })
    .then(unwrap);

/**
 * Performance personnelle : le backend appaire les exécutions du compte en FIFO
 * et ne déclare une vente gagnante ou perdante que si un lot acheté existe. Une
 * vente sans lot n'est pas transformée en position courte inventée, elle est
 * comptée dans `lots_non_apparies`.
 *
 * Le prix d'une paire est libellé dans sa devise `quote` : PnL et volume sont
 * agrégés devise par devise, jamais sommés ensemble.
 */
export interface PerformancePoint {
  date: string;
  pnl_realise: number;
  pnl_cumule: number;
  volume: number;
  trades: number;
}

export interface PerformanceTotals {
  devise: string;
  pnl_realise: number;
  volume: number;
  trades: number;
}

export interface PerformanceResponse {
  status: string;
  uq: string;
  periode: SeriesPeriod;
  secondes: number;
  executions_comptees: number;
  lots_non_apparies: number;
  positions_ouvertes: { pair: string; devise: string; quantite: number; prix_moyen: number }[];
  devises: PerformanceTotals[];
  series: Record<string, PerformancePoint[]>;
}

export const getTradingPerformance = (uq: string, periode: SeriesPeriod) =>
  apiClient
    .get<PerformanceResponse>(`/api/trading/performance/${encodeURIComponent(uq)}`, {
      params: { periode },
    })
    .then(unwrap);

// ==================== P2P mobile ====================

export const getP2POffers = (uq: string, filters: { currency?: string; side?: OrderSide } = {}) =>
  apiClient
    .get<P2POffersResponse>('/api/p2p/market/offers', { params: { uq, ...filters } })
    .then(unwrap);

export const createP2POffer = (payload: {
  uq: string;
  side: OrderSide;
  /** Devise d'encaissement du vendeur ; défaut USD côté backend. */
  currency: string;
  /** Monnaie de paiement pour 1 BORB — l'acheteur ne saisit jamais de devise. */
  rate: number;
  /** Bornes de la vente exprimées en BORB. */
  min_borb: number;
  max_borb: number;
  operator?: string;
  city?: string;
}) =>
  apiClient
    .post<{ status: string; offer: P2POffer }>('/api/p2p/market/offers', payload)
    .then(unwrap);

export const takeP2POffer = (
  id: number,
  payload: {
    uq: string;
    pin: string;
    borb_amount?: number;
    amount?: number;
    /** Devise dans laquelle l'acheteur a saisi son `amount` (convertie en BORB
     *  par le backend via l'USD). Sans elle, la saisie est réputée en BORB. */
    pay_currency?: string;
  },
) =>
  apiClient
    .post<P2PTakeResponse>(`/api/p2p/market/offers/${id}/take`, payload)
    .then(unwrap);

export const getP2POrders = (uq: string) =>
  apiClient
    .get<P2POrdersResponse>(`/api/p2p/market/orders/${encodeURIComponent(uq)}`)
    .then(unwrap);

export const confirmP2POrder = (id: number, uq: string, derogation = false) =>
  apiClient
    .post<{
      status: string;
      message: string;
      preuve_id?: number;
      verdict?: string;
      conformite?: number;
      derogue?: boolean;
    }>(`/api/p2p/market/orders/${id}/confirm`, { uq, derogation })
    .then(unwrap);

export const completeP2POrder = (id: number, uq: string) =>
  apiClient
    .post<{ status: string; message: string }>(`/api/p2p/market/orders/${id}/complete`, { uq })
    .then(unwrap);

export const cancelP2POrder = (id: number, uq: string, litige = false) =>
  apiClient
    .post<{ status: string; message: string; apprentissage?: unknown }>(
      `/api/p2p/market/orders/${id}/cancel`,
      { uq, litige },
    )
    .then(unwrap);

// ==================== Earn (rendement) ====================

export type EarnPeriod = '7j' | '30j' | '1an';

export interface EarnProduct {
  currency: string;
  staked: number;
  rewarded_24h: number;
  daily_pct: number;
  apy_pct: number;
  case2_available: number;
}

export interface EarnPosition {
  id: number;
  currency: string;
  principal: number;
  rewards: number;
  locked_at: number;
  unlock_at: number;
  days_left: number;
  can_withdraw: boolean;
  early_penalty_preview: number;
}

export interface EarnContextResponse {
  status: string;
  uq: string;
  updated_at: number;
  policy: {
    currencies: string[];
    lock_days: number;
    early_penalty_pct: number;
    fee_share_pct: number;
    distribution_hours: number;
  };
  wallets: { currency: string; balance: number }[];
  products: EarnProduct[];
  positions: EarnPosition[];
  history: { position_id: number; currency: string; amount: number; created_at: number }[];
}

/** Un point = un jour et une devise réellement versés dans `earn_rewards`. */
export interface EarnRewardPoint {
  date: string;
  currency: string;
  amount: number;
  cumulative: number;
  reward_count: number;
}

export interface EarnRewardsResponse {
  status: string;
  uq: string;
  periode: EarnPeriod;
  secondes: number;
  depuis: number;
  updated_at: number;
  series: EarnRewardPoint[];
  /** Totaux par devise : les devises ne sont jamais sommées ensemble. */
  totaux: { currency: string; total: number }[];
  recompenses_comptees: number;
  points: number;
  produits: EarnProduct[];
}

export const getEarnContext = (uq: string) =>
  apiClient
    .get<EarnContextResponse>(`/api/trading/earn/context/${encodeURIComponent(uq)}`)
    .then(unwrap);

export const getEarnRewards = (uq: string, periode: EarnPeriod) =>
  apiClient
    .get<EarnRewardsResponse>(`/api/trading/earn/rewards/${encodeURIComponent(uq)}`, {
      params: { periode },
    })
    .then(unwrap);

// ==================== Notifications d'ecran ====================

export const getScreenNotifications = (uq: string) =>
  apiClient
    .get<ScreenNotificationsResponse>(
      `/api/notifications/screen/${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

export const markScreenNotificationsRead = (payload: {
  uq: string;
  ids?: number[];
  scope?: string;
  references?: string[];
  all?: boolean;
}) => apiClient.post('/api/notifications/screen/read', payload).then(unwrap);


// ==================== Preuves de paiement P2P ====================

export type P2PProofVerdict = 'valide' | 'doute' | 'rejet';

/**
 * Verdict du test de connaissance du nom : la contrepartie recopie le nom que
 * son opérateur affiche après le paiement, nom que la plateforme ne lui montre
 * jamais. `inverifiable` veut dire qu'aucune comparaison n'a pu avoir lieu, pas
 * que quelqu'un a menti.
 */
export type P2PNomVerifie = 'conforme' | 'partiel' | 'inverifiable' | 'divergent';

export interface P2PProofSignal {
  nom: string;
  /** -1 = rassurant, 0 = neutre, +1 = accusateur. */
  force: number;
  detail: string;
}

export interface P2PAnalyse {
  verdict: P2PProofVerdict;
  /** 0 à 1 : ce que le moteur trouve la capture conforme à la commande. */
  conformite: number;
  /** Un générateur nommé dans le fichier : le moteur refuse, l'humain tranche. */
  veto: boolean;
  /** Résultat du test de connaissance du nom du bénéficiaire. */
  nom_verifie?: P2PNomVerifie;
  raisons: string[];
  signaux: P2PProofSignal[];
}

export interface P2PProof {
  id: number;
  role: 'buyer' | 'seller';
  uq: string;
  montant_declare?: number;
  devise_declare?: string;
  numero_declare?: string;
  nom_declare?: string;
  verdict: P2PProofVerdict;
  conformite: number;
  veto: boolean;
  /** Résultat du test de connaissance, porté par la dernière preuve. */
  nom_ok?: number;
  nom_verifie?: P2PNomVerifie;
  /** L'acheteur a assumé un doute ou un écart : mention visible au vendeur. */
  derogue?: boolean;
  raisons?: string[];
  signaux?: P2PProofSignal[];
  issue?: string;
  created_at: number;
}

export interface P2PAttendu {
  montant: number;
  devise: string;
  numero: string;
  /** Étiquette publique de la contrepartie : le nom officiel, lui, ne sort
   *  jamais du serveur — c'est ce qui fait de sa recopie un test. */
  nom: string;
  nom_officiel?: boolean;
}

export interface P2PProofAttachResponse {
  status: string;
  preuve_id: number;
  role: 'buyer' | 'seller';
  analyse: P2PAnalyse;
  attendu: P2PAttendu;
}

export interface P2PProofsResponse {
  status: string;
  preuves: P2PProof[];
}

export interface P2PProofImageResponse {
  status: string;
  preuve_id: number;
  order_id: number;
  role: 'buyer' | 'seller';
  verdict: P2PProofVerdict;
  image: string;
}

export const attachP2PProof = (
  id: number,
  payload: {
    uq: string;
    image: string;
    montant: number;
    devise: string;
    numero: string;
    nom: string;
  },
) =>
  apiClient
    .post<P2PProofAttachResponse>(`/api/p2p/market/orders/${id}/proofs`, payload)
    .then(unwrap);

export const getP2PProofs = (id: number, uq: string) =>
  apiClient
    .get<P2PProofsResponse>(
      `/api/p2p/market/orders/${id}/proofs?uq=${encodeURIComponent(uq)}`,
    )
    .then(unwrap);

export const getP2PProofImage = (preuveId: number, uq: string) =>
  apiClient
    .get<P2PProofImageResponse>(
      `/api/p2p/market/proofs/${preuveId}/image?uq=${encodeURIComponent(uq)}`,
    )
    .then(unwrap);