// ============================================================
// MULTI-WALLETS v2 - Portefeuilles virtuels (160+ devises)
// 3 CATEGORIES : Locales / Internationales / Crypto
// Recherche + Badges + Devises populaires
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../../api/client';

interface Wallet {
  code: string;
  balance: number;
  borb_equivalent: number;
  rate: number;
}

interface Props {
  uqNumber: string;
  onWalletsChange: (wallets: Array<{ code: string; balance: number }>) => void;
  onRequirePin: (action: string, callback: (pin: string) => void, onCancel?: () => void, strict?: boolean) => void;
}

// ====================
// CATEGORIES
// ====================

const DEVISES_LOCALES = [
  'CDF', 'XAF', 'XOF', 'NGN', 'KES', 'ZAR', 'MAD', 'GHS',
  'UGX', 'TZS', 'EGP', 'RWF', 'BIF', 'MZN', 'AOA', 'ETB',
  'DZD', 'TND', 'LYD', 'SDG', 'SSP', 'SOS', 'DJF', 'ERN',
  'MWK', 'ZMW', 'BWP', 'NAD', 'SZL', 'LSL', 'MGA', 'MUR',
  'SCR', 'KMF', 'GMD', 'GNF', 'LRD', 'SLL', 'SLE', 'CVE',
  'STN', 'MRU',
];

const DEVISES_INTERNATIONALES = [
  'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD',
  'INR', 'BRL', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY',
  'RUB', 'KRW', 'SGD', 'HKD', 'NZD', 'THB', 'MYR', 'IDR',
  'PHP', 'VND', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR',
  'JOD', 'ILS', 'PKR', 'BDT', 'LKR', 'NPR', 'ARS', 'CLP',
  'COP', 'PEN', 'UYU', 'VES',
];

const CRYPTOS = [
  'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'SOL', 'ADA',
  'DOGE', 'TRX', 'DOT', 'MATIC', 'XAU', 'XAG', 'LTC', 'LINK',
  'ATOM', 'AVAX', 'SHIB', 'XLM', 'ALGO', 'XMR',
];

const POPULAIRES_LOCALES = ['CDF', 'XAF', 'XOF', 'NGN', 'KES', 'ZAR'];
const POPULAIRES_INTERNATIONALES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY'];
const POPULAIRES_CRYPTO = ['BTC', 'ETH', 'USDT', 'USDC', 'XAU'];
const DEVISES_RECONVERTIBLES = new Set([
  'CDF', 'XAF', 'XOF', 'NGN', 'KES', 'ZAR', 'MAD', 'GHS', 'UGX', 'TZS',
  'EGP', 'RWF', 'BIF', 'MZN', 'AOA', 'ETB', 'USD', 'EUR', 'GBP', 'CHF',
  'JPY', 'CNY', 'CAD', 'AUD', 'INR', 'BRL', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY',
]);

type Categorie = 'locales' | 'internationales' | 'crypto';
export type WalletCurrencyCategory = 'Locale' | 'Internationale' | 'Crypto';

const LOCAL_CURRENCY_CODES = new Set(DEVISES_LOCALES);
const INTERNATIONAL_CURRENCY_CODES = new Set(DEVISES_INTERNATIONALES);
const CRYPTO_CURRENCY_CODES = new Set(CRYPTOS);

export const getCurrencyCategory = (code: string): WalletCurrencyCategory => {
  if (LOCAL_CURRENCY_CODES.has(code)) return 'Locale';
  if (CRYPTO_CURRENCY_CODES.has(code)) return 'Crypto';
  if (INTERNATIONAL_CURRENCY_CODES.has(code)) return 'Internationale';
  return 'Internationale';
};

const FLAGS: Record<string, string> = {
  CDF: 'CD', USD: 'US', EUR: 'EU', GBP: 'GB',
  XAF: 'AF', XOF: 'AF', NGN: 'NG', KES: 'KE',
  ZAR: 'ZA', MAD: 'MA', GHS: 'GH', UGX: 'UG',
  TZS: 'TZ', EGP: 'EG', RWF: 'RW', BIF: 'BI',
  BTC: 'BTC', ETH: 'ETH', USDT: 'USDT', USDC: 'USDC', XAU: 'XAU',
  BORB: 'BORB',
};

const NAMES: Record<string, string> = {
  CDF: 'Franc congolais', USD: 'Dollar americain', EUR: 'Euro',
  GBP: 'Livre sterling', BTC: 'Bitcoin', ETH: 'Ethereum',
  USDT: 'Tether', USDC: 'USD Coin', XAU: 'Or (once)',
  BORB: 'BORB', XAF: 'Franc CFA Centrale',
  XOF: 'Franc CFA Ouest', NGN: 'Naira nigerian',
  KES: 'Shilling kenyan', ZAR: 'Rand sud-africain',
};

export function MultiWallets({
  uqNumber,
  onWalletsChange,
  onRequirePin,
}: Props) {
  // ===== STATES =====
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [borbReserve, setBorbReserve] = useState(0);
  const [borbAvailable, setBorbAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<{ code: string; name: string } | null>(null);
  const [convertAmount, setConvertAmount] = useState('');
  const [conversionDirection, setConversionDirection] = useState<'borb-to-currency' | 'currency-to-borb'>('borb-to-currency');
  const [convertLoading, setConvertLoading] = useState(false);
  const [tauxLive, setTauxLive] = useState<Record<string, number>>({});
  const [borbUsd, setBorbUsd] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorie, setCategorie] = useState<Categorie>('locales');

  // ===== CHARGER LES TAUX LIVE =====
  useEffect(() => {
    const chargerTaux = async () => {
      try {
        const r = await apiClient.get('/api/oracle/fiat');
        if (r.data && r.data.rates) {
          const t: Record<string, number> = {};
          for (const [code, unitsPerUsd] of Object.entries(r.data.rates)) {
            const n = Number(unitsPerUsd);
            if (n > 0) t[code] = n;
          }
          setTauxLive(t);
          const currentBorbUsd = Number(r.data.borb_usd);
          setBorbUsd(Number.isFinite(currentBorbUsd) && currentBorbUsd > 0 ? currentBorbUsd : 0);
        } else {
          setTauxLive({});
          setBorbUsd(0);
        }
      } catch (e) {
        console.error('Erreur taux:', e);
        setTauxLive({});
        setBorbUsd(0);
      }
    };
    chargerTaux();
    const interval = setInterval(chargerTaux, 60000);
    return () => clearInterval(interval);
  }, []);

  // ===== CHARGER LES WALLETS =====
  const charger = async () => {
    setLoading(true);
    setWalletError('');
    try {
      const r = await apiClient.get(`/api/account/wallets/${uqNumber}`);
      if (r.data?.status !== 'success' || !Array.isArray(r.data.wallets)) {
        throw new Error(r.data?.message || 'Réponse de portefeuille invalide.');
      }
      setWallets(r.data.wallets || []);
      onWalletsChange(r.data.wallets);
      setBorbReserve(r.data.borb_reserve || 0);
      setBorbAvailable(r.data.borb_available || 0);
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setWalletError(error.response?.data?.message || error.message || 'Impossible de charger les portefeuilles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uqNumber) {
      charger();
    } else {
      setWalletError('Identifiant du compte manquant.');
      setLoading(false);
    }
  }, [uqNumber]);

  // ===== SCORE DE SÉCURITÉ CENTRAL =====
  const borbWallet = wallets.find(w => w.code === 'BORB' || w.code === 'BORB');
  const soldeBorb = borbWallet ? borbWallet.balance : borbReserve;

  // ===== LISTE FILTREE =====
  const devisesFiltrees = useMemo(() => {
    let liste: string[] = [];
    if (categorie === 'locales') liste = DEVISES_LOCALES;
    else if (categorie === 'internationales') liste = DEVISES_INTERNATIONALES;
    else liste = CRYPTOS;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      liste = liste.filter(c =>
        c.includes(q) || (NAMES[c] || '').toUpperCase().includes(q)
      );
    } else {
      const populaires = categorie === 'locales' ? POPULAIRES_LOCALES
        : categorie === 'internationales' ? POPULAIRES_INTERNATIONALES
        : POPULAIRES_CRYPTO;
      const top = populaires.filter(c => liste.includes(c));
      const reste = liste.filter(c => !populaires.includes(c)).sort();
      liste = [...top, ...reste];
    }
    return liste;
  }, [categorie, searchQuery]);

  // ===== COMPTEUR DEVISES ACTIVES PAR CATEGORIE =====
  const compterActives = (liste: string[]): number => {
    return liste.filter(code => {
      const w = wallets.find(x => x.code === code);
      return w && w.balance > 0;
    }).length;
  };
  const nbLocales = compterActives(DEVISES_LOCALES);
  const nbIntl = compterActives(DEVISES_INTERNATIONALES);
  const nbCrypto = compterActives(CRYPTOS);
  const activeWallets = wallets
    .filter((wallet) => wallet.balance > 0 && wallet.code !== 'BORB' && wallet.code !== 'BORB')
    .slice(0, 3);
  const walletBadgeTone = (code: string) => {
    if (code === 'CDF' || code === 'XAF' || code === 'XOF') return '#F59E0B';
    if (code === 'USD' || code === 'EUR' || code === 'GBP') return '#38BDF8';
    if (code === 'BTC' || code === 'ETH' || code === 'USDT') return '#F59E0B';
    return '#2DD4BF';
  };

  // ===== FORMATAGE =====
  const fmt = (n: number, decimals = 2) => {
    if (n === 0) return '0';
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(2);
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  };

  // ===== CONVERSION =====
  const ouvrirConfirmation = (code: string, direction: 'borb-to-currency' | 'currency-to-borb') => {
    const name = NAMES[code] || code;
    setConfirmation({ code, name });
    setConversionDirection(direction);
    setConvertAmount('');
    setMessage('');
  };

  const confirmerConversion = async (pin?: string) => {
    if (!confirmation || !convertAmount) return;
    const montant = parseFloat(convertAmount);
    if (isNaN(montant) || montant <= 0) {
      setMessage('Montant invalide');
      return;
    }
    const soldeSource = conversionDirection === 'borb-to-currency'
      ? borbAvailable
      : wallets.find((wallet) => wallet.code === confirmation.code)?.balance || 0;
    if (montant > soldeSource) {
      setMessage(`Solde insuffisant. Disponible : ${fmt(soldeSource)} ${conversionDirection === 'borb-to-currency' ? 'unités de score' : confirmation.code}.`);
      return;
    }
    if (pin === undefined) {
      onRequirePin(
        'convert',
        (verifiedPin) => { void confirmerConversion(verifiedPin); },
        () => setMessage(''),
        true,
      );
      return;
    }
    setConvertLoading(true);
    setMessage('');
    try {
      const from = conversionDirection === 'borb-to-currency' ? 'BORB' : confirmation.code;
      const to = conversionDirection === 'borb-to-currency' ? confirmation.code : 'BORB';
      // Vrai endpoint de conversion : il débite/credite réellement les poches
      // (l'ancien /api/borb/convert n'était qu'un calculateur sans effet).
      const r = await apiClient.post('/api/account/wallets/convert', {
        uq_number: uqNumber,
        from,
        to,
        amount: montant,
        pin: pin || '',
      });
      if (r.data.status === 'success') {
        setMessage(`Conversion OK : ${fmt(r.data.amount_from)} ${from} → ${fmt(r.data.amount_to)} ${to}`);
        setConfirmation(null);
        setConvertAmount('');
        await charger();
      } else {
        setMessage(r.data.message || 'Erreur');
      }
    } catch (e: any) {
      const code = e.response?.data?.code;
      setMessage(
        code === 'PIN_NOT_CONFIGURED'
          ? 'Configure un code PIN dans Profil avant de convertir.'
          : e.response?.data?.message || e.message
      );
    } finally {
      setConvertLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-[var(--uq-bg-secondary)] border border-[var(--uq-border)]">
        <p className="text-center text-white/60 text-sm">Chargement des portefeuilles...</p>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="rounded-2xl p-5 bg-[var(--uq-bg-secondary)] border border-[#F6465D]/30">
        <p className="text-center text-[#F6465D] text-sm">{walletError}</p>
        <button
          type="button"
          onClick={charger}
          className="block mx-auto mt-3 text-white/70 text-xs underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* SECTION 1 : BORB BALANCE */}
      <div className="rounded-2xl p-5"
           style={{
             background: 'linear-gradient(135deg, rgba(47,107,255,0.2) 0%, rgba(22,139,255,0.10) 50%, rgba(7,11,31,0.98) 100%)',
             border: '1px solid rgba(47,107,255,0.4)',
             boxShadow: '0 0 40px rgba(47,107,255,0.18), 0 0 80px rgba(22,139,255,0.1)',
           }}>
        <div className="flex items-center gap-2 mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" stroke="#0ECB81" />
          </svg>
          <p className="text-sm font-black tracking-wider uppercase text-white">
            Score de sécurité
          </p>
        </div>

        <p className="text-4xl font-black text-white tracking-tight mb-1">
          {fmt(soldeBorb, 2)} <span className="text-xl text-white/70">unités de score</span>
        </p>
        <p className="mb-2 text-xs font-semibold text-sky-100/80">
          Disponible pour conversion : {fmt(borbAvailable, 2)} unités BORB
        </p>

        <p className="text-xs text-white/60">
          BORB sécurise le compte. Convertissez les unités disponibles en devises utilisables ; les unités BORB elles-mêmes ne sont pas transférables.
        </p>
        <p className="mt-2 text-[11px] leading-5 text-amber-100/70">
          La conversion et les transferts UQ sont actuellement limités aux devises fiat prises en charge. Les cryptos affichées ne sont pas convertibles ni transférables dans UQ.
        </p>
      </div>

      {/* SECTION 2 : DEVISES VIRTUELLES */}
      <div className="rounded-2xl p-4"
           style={{
             background: 'linear-gradient(135deg, rgba(17,30,61,0.82) 0%, rgba(7,11,31,0.98) 100%)',
             border: '1px solid var(--uq-border)',
           }}>

        {/* Titre */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E86DE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
            <p className="text-xs font-black tracking-wider uppercase text-white/85">
              Mes Devises Virtuelles
            </p>
          </div>
          <span className="text-[10px] font-bold text-white/50">
            {devisesFiltrees.length} devise{devisesFiltrees.length !== 1 ? 's' : ''}
          </span>
        </div>

        {activeWallets.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {activeWallets.map((wallet) => (
              <div
                key={wallet.code}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold text-slate-100"
                style={{
                  background: `${walletBadgeTone(wallet.code)}22`,
                  borderColor: `${walletBadgeTone(wallet.code)}66`,
                  boxShadow: `0 0 14px ${walletBadgeTone(wallet.code)}22`,
                }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: walletBadgeTone(wallet.code) }} />
                {wallet.code}
                <span className="text-[9px] text-slate-300">{fmt(wallet.balance)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Rechercher (USD, BTC, CDF...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:border-[#E63946]/60 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-sm"
            >
              X
            </button>
          )}
        </div>

        {/* Selecteur categories AVEC BADGES */}
        <div className="flex gap-2 mb-4">
          {([
            ['locales', 'Locales', '#E63946', nbLocales],
            ['internationales', 'Internat.', '#2E86DE', nbIntl],
            ['crypto', 'Crypto', '#FFD700', nbCrypto],
          ] as const).map(([id, label, couleur, nb]) => (
            <button
              key={id}
              onClick={() => setCategorie(id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                categorie === id ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
              style={categorie === id ? {
                background: `linear-gradient(135deg, ${couleur}40, ${couleur}15)`,
                border: `1px solid ${couleur}`,
                boxShadow: `0 0 20px ${couleur}40`,
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span>{label}</span>
              {nb > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                  style={{
                    background: couleur,
                    color: '#000',
                    boxShadow: `0 0 8px ${couleur}`,
                  }}
                >
                  {nb}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Liste des devises */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {devisesFiltrees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/50 text-sm">Aucune devise trouvee</p>
              <p className="text-white/30 text-xs mt-1">Essayez un autre terme</p>
            </div>
          ) : (
            devisesFiltrees.map((code) => {
              const flag = FLAGS[code] || '--';
              const name = NAMES[code] || code;
              const wallet = wallets.find(w => w.code === code);
              const solde = wallet ? wallet.balance : 0;
              const estActif = solde > 0;

              return (
                <div
                  key={code}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{
                    background: estActif ? 'var(--uq-bg-secondary)' : 'rgba(255,255,255,0.03)',
                    border: estActif ? '1px solid rgba(14,203,129,0.4)' : '1px solid transparent',
                    opacity: estActif ? 1 : 0.75,
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#FFF', minWidth: '42px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>
                      {flag}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{code}</p>
                      <p className="text-[9px] text-white/50 truncate">{name}</p>
                    </div>
                  </div>

                  <div className="flex-1 text-right">
                    <p className="text-sm font-mono font-bold text-white">
                      {fmt(solde, code === 'BTC' ? 8 : 2)}
                    </p>
                    {estActif && (
                      <p className="text-[9px] text-[#0ECB81]">Solde enregistré</p>
                    )}
                  </div>

                  {DEVISES_RECONVERTIBLES.has(code) && borbAvailable > 0 && (
                        <button
                          onClick={() => ouvrirConfirmation(code, 'borb-to-currency')}
                          className="ml-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                          style={{
                            background: 'rgba(230,57,70,0.15)',
                            border: '1px solid rgba(230,57,70,0.4)',
                            color: '#FF6B6B',
                          }}
                        >
                          Convertir le score
                        </button>
                  )}
                  {DEVISES_RECONVERTIBLES.has(code) && solde > 0 && (
                    <button
                      onClick={() => ouvrirConfirmation(code, 'currency-to-borb')}
                      className="ml-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                      style={{
                        background: 'rgba(14,203,129,0.12)',
                        border: '1px solid rgba(14,203,129,0.4)',
                        color: '#0ECB81',
                      }}
                    >
                      Reconvertir en score
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-xs border ${
          message.startsWith('Conversion OK')
            ? 'bg-[#0ECB81]/10 border-[#0ECB81]/30 text-[#0ECB81]'
            : 'bg-[#F6465D]/10 border-[#F6465D]/30 text-[#F6465D]'
        }`}>
          {message}
        </div>
      )}

      {/* Modal confirmation */}
      {confirmation && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !convertLoading) setConfirmation(null); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#F6C85F]/30 bg-[#0C1530] p-6 shadow-2xl">

            <h3 className="text-lg font-bold text-[#FCD535] mb-3">
              Confirmer la conversion ?
            </h3>

            <p className="text-xs text-[#8E8E9A] mb-4 leading-relaxed">
              {conversionDirection === 'borb-to-currency' ? (
                <>Vous voulez convertir une partie du <strong className="text-white">score de sécurité</strong> en{' '}
                  <strong className="text-white">{confirmation.name} ({confirmation.code})</strong> ?</>
              ) : (
                <>Vous voulez reconvertir <strong className="text-white">{confirmation.name} ({confirmation.code})</strong>{' '}
                  en <strong className="text-white">score de sécurité central</strong> ?</>
              )}
            </p>

            <div className="mb-4 p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38]">
              <p className="text-[10px] text-[#8E8E9A] mb-1">
                {conversionDirection === 'borb-to-currency' ? 'Score disponible pour conversion' : `Solde ${confirmation.code} disponible`}
              </p>
              <p className="text-lg font-bold text-white">
                {conversionDirection === 'borb-to-currency'
                  ? `${fmt(borbAvailable)} / ${fmt(soldeBorb)} unités de score`
                  : `${fmt(wallets.find((wallet) => wallet.code === confirmation.code)?.balance || 0)} ${confirmation.code}`}
              </p>
            </div>

            <label className="block text-[10px] uppercase tracking-wider text-[#8E8E9A] mb-2">
              {conversionDirection === 'borb-to-currency' ? 'Unités de score à convertir' : `Montant ${confirmation.code} à reconvertir`}
            </label>
            <input
              type="number"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !convertLoading) confirmerConversion(); }}
              placeholder="0"
              min="0.01"
              step="0.01"
              autoFocus
              className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-center text-xl font-bold focus:outline-none focus:border-[#FCD535]"
            />

            <p className="text-[10px] text-[#8E8E9A] mt-2">
              {tauxLive[confirmation.code] > 0 && borbUsd > 0
                ? conversionDirection === 'borb-to-currency'
                  ? `Environ ${fmt((parseFloat(convertAmount) || 0) * borbUsd * tauxLive[confirmation.code], 2)} ${confirmation.code}`
                  : `Environ ${fmt((parseFloat(convertAmount) || 0) / (borbUsd * tauxLive[confirmation.code]), 2)} unités de score`
                : 'Taux de conversion indisponible depuis l’oracle'}
            </p>
            <p className="mt-2 text-[10px] text-sky-100/70">
              Le code PIN de votre compte sera vérifié avant toute conversion.
            </p>

            {message && (
              <div className="mt-3 p-3 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-[10px] text-center">
                {message}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setConfirmation(null); setConvertAmount(''); setMessage(''); }}
                disabled={convertLoading}
                className="flex-1 py-3 rounded-xl border border-[#2A2A38] text-[#8E8E9A] font-bold disabled:opacity-50"
              >
                Annuler
              </button>
              <button
              onClick={() => void confirmerConversion()}
                disabled={convertLoading || !convertAmount || !(tauxLive[confirmation.code] > 0) || !(borbUsd > 0)}
                className="flex-1 py-3 rounded-xl bg-[#FCD535] text-black font-bold disabled:opacity-50 hover:bg-[#FCD535]/90"
              >
                {convertLoading ? 'Conversion...' : 'Confirmer'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
