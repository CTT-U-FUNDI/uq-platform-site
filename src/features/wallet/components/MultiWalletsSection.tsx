// ============================================================
// MULTI WALLETS SECTION - 3 categories avec selecteur
// Locales / Internationales / Crypto
// Chaque ligne = scroll + montant + equivalent USD dessous
// ============================================================

import { useEffect, useState } from 'react';
import apiClient from '../../../api/client';

// ====================
// CATEGORIES DE DEVISES
// ====================

const DEVISES_LOCALES = [
  'CDF', 'XAF', 'XOF', 'NGN', 'KES', 'ZAR', 'MAD', 'GHS',
  'UGX', 'TZS', 'EGP', 'RWF', 'BIF', 'MZN', 'AOA', 'ETB',
] as const;

const DEVISES_INTERNATIONALES = [
  'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD',
  'INR', 'BRL', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY',
] as const;

const CRYPTOS = [
  'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'SOL', 'ADA',
  'DOGE', 'TRX', 'DOT', 'MATIC', 'XAU', 'XAG', 'LTC', 'LINK',
] as const;

type Categorie = 'locales' | 'internationales' | 'crypto';

// ====================
// TYPES
// ====================

interface Wallet {
  code: string;
  balance: number;
  rate: number;          // 1 devise = X BORB
  borb_equivalent: number;
}

interface Props {
  uqNumber: string;
  onWalletChange?: (categorie: Categorie, code: string) => void;
}

// ====================
// FORMATAGE
// ====================

function formatMontant(montant: number, devise: string): string {
  if (devise === 'CDF') {
    return `${Math.round(montant).toLocaleString('fr-FR').replace(/\u202f/g, ' ')} FC`;
  }
  if (devise === 'USD') {
    return `$${montant.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  if (devise === 'EUR') {
    return `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} EUR`;
  }
  if (devise === 'GBP') {
    return `${montant.toLocaleString('en-US', { maximumFractionDigits: 2 })} GBP`;
  }
  if (['XAF', 'XOF'].includes(devise)) {
    return `${Math.round(montant).toLocaleString('fr-FR')} FCFA`;
  }
  if (['BTC', 'ETH'].includes(devise)) {
    return `${montant.toFixed(8)} ${devise}`;
  }
  if (devise === 'XAU') {
    return `${montant.toFixed(4)} XAU`;
  }
  return `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${devise}`;
}

// ====================
// COMPOSANT LIGNE (scroll + montant + equivalent USD)
// ====================

function LigneWallet({
  numero,
  devise,
  setDevise,
  wallets,
  tauxUsd,
}: {
  numero: 1 | 2 | 3;
  devise: string;
  setDevise: (d: string) => void;
  wallets: Wallet[];
  tauxUsd: number | null;
}) {
  const tailles: Record<number, string> = {
    1: 'text-2xl sm:text-3xl font-black',
    2: 'text-lg font-bold',
    3: 'text-base font-bold',
  };

  const wallet = wallets.find(w => w.code === devise);
  const balance = wallet?.balance || 0;
  const borbEquiv = wallet?.borb_equivalent || 0;
  const usdEquiv = tauxUsd === null ? null : borbEquiv * tauxUsd;

  // Devises disponibles dans la categorie actuelle
  const options = (() => {
    if (DEVISE_CATEGORIE_ACTUELLE === 'locales') return DEVISES_LOCALES;
    if (DEVISE_CATEGORIE_ACTUELLE === 'internationales') return DEVISES_INTERNATIONALES;
    return CRYPTOS;
  })();

  return (
    <div className="flex flex-col gap-1 mb-3">
      <div className="flex items-center gap-3">
        <select
          value={devise}
          onChange={(e) => setDevise(e.target.value)}
          className="bg-[#0C1530] hover:bg-[#111E3D] border border-[#2F6BFF]/30 rounded-lg px-2 py-1 text-[11px] font-bold text-white cursor-pointer focus:outline-none min-w-[60px]"
        >
          {options.map((d) => (
            <option key={d} value={d} className="bg-[#0C1530]">{d}</option>
          ))}
        </select>

        <p className={tailles[numero] + ' text-white flex-1'}>
          {balance > 0 ? formatMontant(balance, devise) : `0 ${devise}`}
        </p>
      </div>

      <p className="text-[10px] text-[#83D5DB]/65 pl-[72px]">
        {usdEquiv === null ? 'Equivalent USD indisponible' : `≈ $${usdEquiv.toFixed(2)} USD`}
      </p>
    </div>
  );
}

// Variable globale pour la categorie (lue dans LigneWallet)
let DEVISE_CATEGORIE_ACTUELLE: Categorie = 'locales';

// ====================
// COMPOSANT PRINCIPAL
// ====================

export function MultiWalletsSection({ uqNumber, onWalletChange }: Props) {
  const [categorie, setCategorie] = useState<Categorie>('locales');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tauxUsd, setTauxUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  // Devises par defaut selon categorie
  const [devLocale1, setDevLocale1] = useState('CDF');
  const [devLocale2, setDevLocale2] = useState('XAF');
  const [devLocale3, setDevLocale3] = useState('XOF');

  const [devIntl1, setDevIntl1] = useState('USD');
  const [devIntl2, setDevIntl2] = useState('EUR');
  const [devIntl3, setDevIntl3] = useState('GBP');

  const [devCrypto1, setDevCrypto1] = useState('BTC');
  const [devCrypto2, setDevCrypto2] = useState('ETH');
  const [devCrypto3, setDevCrypto3] = useState('XAU');

  // Mettre a jour la variable globale
  DEVISE_CATEGORIE_ACTUELLE = categorie;

  // Charger les wallets
  useEffect(() => {
    if (!uqNumber) {
      setErreur('Identifiant du compte manquant.');
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient.get(`/api/account/wallets/${uqNumber}`)
      .then((r) => {
        const data = r.data;
        if (data.status !== 'success' || !Array.isArray(data.wallets)) {
          throw new Error(data.message || 'Réponse de portefeuille invalide.');
        }
        setWallets(data.wallets || []);
        setErreur('');
      })
      .catch((e: any) => setErreur(e.response?.data?.message || e.message || 'Erreur de chargement du portefeuille'))
      .finally(() => setLoading(false));

    // Charger le taux USD/BORB
    apiClient.get('/api/price/all')
      .then((r) => {
        const data = r.data;
        if (Number.isFinite(data.prices?.borb_usd) && data.prices.borb_usd > 0) {
          setTauxUsd(data.prices.borb_usd);
        }
      })
      .catch(() => setTauxUsd(null));
  }, [uqNumber]);

  if (loading) {
    return (
      <div className="rounded-3xl p-6 border border-white/10 bg-black/40">
        <p className="text-white/50 text-sm text-center">Chargement des portefeuilles...</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="rounded-3xl p-6 border border-[#F6465D]/30 bg-[#F6465D]/10">
        <p className="text-[#F6465D] text-sm text-center">{erreur}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5 border border-white/10"
         style={{
           background: 'linear-gradient(135deg, rgba(18,48,59,0.72) 0%, rgba(8,25,34,0.96) 100%)',
           boxShadow: '0 0 30px rgba(47,107,255,0.1)',
         }}>

      {/* Selecteur de categorie */}
      <div className="flex gap-2 mb-5">
        {([
          ['locales', 'Locales', '#2F6BFF'],
          ['internationales', 'Internat.', '#38BDF8'],
          ['crypto', 'Crypto', '#B4DDEB'],
        ] as const).map(([id, label, couleur]) => (
          <button
            key={id}
            onClick={() => setCategorie(id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
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
            {label}
          </button>
        ))}
      </div>

      {/* Contenu selon categorie */}
      <div className="space-y-1">
        {categorie === 'locales' && (
          <>
            <LigneWallet numero={1} devise={devLocale1} setDevise={setDevLocale1} wallets={wallets} tauxUsd={tauxUsd} />
            <LigneWallet numero={2} devise={devLocale2} setDevise={setDevLocale2} wallets={wallets} tauxUsd={tauxUsd} />
            <LigneWallet numero={3} devise={devLocale3} setDevise={setDevLocale3} wallets={wallets} tauxUsd={tauxUsd} />
          </>
        )}
        {categorie === 'internationales' && (
          <>
            <LigneWallet numero={1} devise={devIntl1} setDevise={setDevIntl1} wallets={wallets} tauxUsd={tauxUsd} />
            <LigneWallet numero={2} devise={devIntl2} setDevise={setDevIntl2} wallets={wallets} tauxUsd={tauxUsd} />
            <LigneWallet numero={3} devise={devIntl3} setDevise={setDevIntl3} wallets={wallets} tauxUsd={tauxUsd} />
          </>
        )}
        {categorie === 'crypto' && (
          <>
            <LigneWallet numero={1} devise={devCrypto1} setDevise={setDevCrypto1} wallets={wallets} tauxUsd={tauxUsd} />
            <LigneWallet numero={2} devise={devCrypto2} setDevise={setDevCrypto2} wallets={wallets} tauxUsd={tauxUsd} />
            <LigneWallet numero={3} devise={devCrypto3} setDevise={setDevCrypto3} wallets={wallets} tauxUsd={tauxUsd} />
          </>
        )}
      </div>

    </div>
  );
}