import { useMemo } from 'react';
import { useAsync } from './hooks';
import { getFiatRates, getPrices, getTransactions, getWalletCurrencies, getWallets } from './api';
import { devisesFiat, lireProvenanceTaux, totalEnDevise, type ProvenanceTaux } from './currency';
import type { Prices, Transaction, WalletCurrency, WalletEntry } from './api';

export interface WalletSnapshot {
  /** Solde du WALLET VIRTUEL (visible) exprime en BORB. */
  virtualBorb: number;
  /** Total renvoye par le backend (virtuel + reserve) : usage interne. */
  totalBorb: number;
  /** Montant engageable depuis le wallet virtuel. */
  available: number;
  /** Reserve de garantie BORB : cachee, jamais affichee hors coffre proprietaire. */
  borb: number;
  borbAvailable: number;
  frozen: number;
  /** Toutes les lignes brutes du backend. */
  wallets: WalletEntry[];
  /** Unites du wallet virtuel (sans la ligne reserve ni le doublon WALLET). */
  units: WalletEntry[];
  /** Devises reellement detenues apres conversion (lecture seule). */
  currencies: WalletCurrency[];
  /** Valeur de ces devises dans la devise d'affichage. */
  currenciesValue: number;
  displayCurrency: string;
  receiveCurrency: string;
  usdRate: number;
  rates: Record<string, number>;
  /** Devises fiat declarees par l'oracle (crypto et BORB exclus). */
  fiatCurrencies: string[];
  fiatValue: number;
  prices: Prices;
  transactions: Transaction[];
  /** Provenance et fraîcheur des taux, telles que publiées par l'oracle. */
  taux: ProvenanceTaux;
  /** Origine réellement interrogée pour l'or (ex. « xaus.com »). */
  goldSource: string;
}

const EMPTY: WalletSnapshot = {
  virtualBorb: 0,
  totalBorb: 0,
  available: 0,
  borb: 0,
  borbAvailable: 0,
  frozen: 0,
  wallets: [],
  units: [],
  currencies: [],
  currenciesValue: 0,
  displayCurrency: 'CDF',
  receiveCurrency: 'CDF',
  // 0 = aucune observation encore : le prix BORB->USD vient de /api/price/all.
  // Démarrer à 1 ferait croire « 1 BORB = 1 USD » le temps de la première
  // réponse, sur tous les montants de l'écran.
  usdRate: 0,
  rates: {},
  fiatCurrencies: [],
  fiatValue: 0,
  prices: {},
  transactions: [],
  taux: { badge: '', source: '', ageSecs: -1, horsLigne: false, devisesRejouees: 0, nbSources: 0 },
  goldSource: '',
};

/**
 * Instantane du portefeuille : soldes, prix et taux de change.
 *
 * Le backend renvoie dans `wallets` trois familles de lignes :
 *  - les unites fractales du WALLET VIRTUEL (`BORB`, `borb`, `mborb`...) ;
 *  - une ligne `WALLET` qui est le miroir du solde principal (meme argent) ;
 *  - une ligne `code: "BORB"` avec `transferable: false` qui est en realite la
 *    RESERVE BORB (points / 100).
 * Seules les unites comptent comme solde visible : additionner `WALLET` ou la
 * reserve doublerait le solde et exposerait le BORB, qui doit rester cache.
 */
export function useWalletSnapshot(uq: string) {
  const state = useAsync<WalletSnapshot>(
    async () => {
      const [walletsResult, pricesResult, ratesResult, transactionsResult, currenciesResult] =
        await Promise.allSettled([
          getWallets(uq),
          getPrices(),
          getFiatRates(),
          getTransactions(uq),
          getWalletCurrencies(uq),
        ]);

      const walletsPayload = walletsResult.status === 'fulfilled' ? walletsResult.value : null;
      const wallets = Array.isArray(walletsPayload?.wallets) ? walletsPayload!.wallets : [];
      const pricesPayload = pricesResult.status === 'fulfilled' ? pricesResult.value : null;
      const ratesPayload = ratesResult.status === 'fulfilled' ? ratesResult.value : null;
      const prices = pricesPayload?.prices || {};
      const rates =
        ratesResult.status === 'fulfilled' && ratesResult.value?.rates
          ? (ratesResult.value.rates as Record<string, number>)
          : {};

      // Liste fiat publiee par l'oracle : voir devisesFiat (lib/currency).
      const fiatCurrencies = devisesFiat(ratesPayload);
      const transactions =
        transactionsResult.status === 'fulfilled' && Array.isArray(transactionsResult.value?.transactions)
          ? transactionsResult.value!.transactions!.filter(Boolean)
          : [];

      const borbEntry = wallets.find((entry) => entry.code === 'BORB' && entry.transferable === false);
      const mainEntry = wallets.find((entry) => entry.code === 'WALLET');
      const units = wallets.filter((entry) => entry !== borbEntry && entry.code !== 'WALLET');
      const unitsTotal = units.reduce((sum, entry) => sum + (Number(entry.borb_equivalent) || 0), 0);

      const borb = Number(walletsPayload?.borb_reserve ?? borbEntry?.balance ?? 0) || 0;
      const borbAvailable =
        Number(walletsPayload?.borb_available ?? borbEntry?.available_balance ?? borb) || 0;
      const frozen = Number(mainEntry?.frozen) || 0;

      // Le solde du WALLET VIRTUEL est la valeur reellement detenue en unites.
      // Aucun repli sur la ligne `WALLET` : sans conversion le solde affiche
      // doit rester 0, ce miroir n'est pas une devise detenue.
      const virtual = Number(walletsPayload?.transferable_borb ?? unitsTotal) || 0;

      const totalBorb = Number(walletsPayload?.total_borb ?? virtual + borb) || virtual;
      const displayCurrency =
        walletsPayload?.display_currency || localStorage.getItem('uq_display_currency') || 'CDF';
      const receiveCurrency = walletsPayload?.receive_currency || displayCurrency;
      const usdRate = Number((prices as Record<string, number>).borb_usd) || 0;

      /**
       * `multi_wallets` est la seule source des devises reellement detenues :
       * les unites fractales ne sont pas des devises. Les lignes BORB/BORB sont
       * exclues, la reserve de securite n'etant pas une monnaie.
       */
      const rawCurrencies =
        currenciesResult.status === 'fulfilled' && Array.isArray(currenciesResult.value?.currencies)
          ? currenciesResult.value!.currencies!
          : [];
      const currencies = rawCurrencies.filter(
        (entry) =>
          Number(entry.balance) > 0 &&
          !['BORB', 'BORB'].includes(String(entry.code).toUpperCase()),
      );
      // Chaque solde est exprime dans sa propre devise : on le ramene dans la
      // devise d'affichage avec les taux publies par l'oracle. La formule est
      // celle du convertisseur partage, pas une recopie locale.
      const currenciesValue = totalEnDevise(currencies, rates, displayCurrency);

      return {
        virtualBorb: virtual,
        totalBorb,
        available: virtual,
        borb,
        borbAvailable,
        frozen,
        wallets,
        units,
        currencies,
        currenciesValue,
        displayCurrency,
        receiveCurrency,
        usdRate,
        rates,
        fiatCurrencies,
        fiatValue: currenciesValue,
        prices,
        transactions,
        taux: lireProvenanceTaux(ratesPayload),
        goldSource: pricesPayload?.source?.gold || '',
      };
    },
    [uq],
    { enabled: Boolean(uq) },
  );

  const data = state.data ?? EMPTY;

  return useMemo(
    () => ({ ...state, data, hasWallet: data.wallets.length > 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.loading, state.error, state.data, data],
  );
}
