// ============================================================
// COFFRE SCREEN - Version Magistrale 2026
// Effets visuels : glassmorphism, neon glow, animations pro
// Palette : Rouge UQ + Bleu UQ + Or BORB
// ============================================================

import { Icon } from '../../../components/ui/Icon';
import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../api/client';
import { UQLoader } from '../../../components/ui/UQLoader';
import { PinModal } from '../../../components/ui/PinModal';
import { LogoBorb } from '../../../components/ui/LogoBorb';
import { FixoIcon } from '../../../components/ui/FixoIcon';
import { FixoAssistant } from '../../../components/ui/FixoAssistant';
import { UQ_COLORS, UQ_GRADIENTS } from '../../../theme/colors';
import { PseudoAutocomplete, PseudoResult } from '../components/PseudoAutocomplete';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { CoffreNavBar } from '../components/CoffreNavBar';
import { ReceivePanel } from '../components/ReceivePanel';
import { SendModal } from '../components/SendModal';
import { SoldeDual } from '../components/SoldeDual';
import { BalanceChart } from "../components/BalanceChart";
import { ScannerModal } from "../components/ScannerModal";
import { ExternalTransferModal } from "../components/ExternalTransferModal";
import { MultiWallets } from "../components/MultiWallets";
import { BorbLiveDashboard } from "../components/BorbLiveDashboard";
import {
  IconDashboard, IconCoffre, IconTransactions,
  IconSend, IconReceive, IconConvert, IconTrading, IconUbi,
  IconBank, IconCard, IconChevron, IconClose,
  IconShield, IconUnits, IconActions, IconMedalBronze, IconMedalSilver,
  IconMedalGold, IconMedalPlatinum, IconMobileMoney, IconCrypto,
  IconWallet, IconEye, IconEyeOff, IconMoney, IconScan } from '../../../components/ui/UQIcons';

const VALID_UNITS = ['BORB', 'borb', 'mborb', 'nborb', 'pborb', 'fborb'];

interface UnitInfo {
  unit: string;
  name: string;
  value: number;
  rate: number;
  display: string;
}

interface Balance {
  balance: {
    bubbles: number;
    points: number;
    frozen_points: number;
    borb_total: number;
    display: string;
  };
  units: UnitInfo[];
}

interface Case {
  name: string;
  percentage: number;
  balance: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  fee: number;
  counterparty: string;
  timestamp: number;
  hash?: string;
  memo?: string;
  status?: string;
  borb_id?: string;
  prev_hash?: string;
  block_number?: number;
}

const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const fmtUsd = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });
const fmtCdf = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

type Tab = 'dashboard' | 'send' | 'receive' | 'convert' | 'ubi' | 'history' | 'vault';

interface TabDef {
  id: Tab;
  label: string;
  Icon: any;
}

const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { id: 'send',      label: 'Envoyer',   Icon: IconSend },
  { id: 'receive',   label: 'Recevoir',  Icon: IconCard },
  { id: 'convert',   label: 'Convertir', Icon: IconConvert },
  { id: 'ubi',       label: 'UBI',       Icon: IconUbi },
  { id: 'history',   label: 'Historique', Icon: IconTransactions },
  { id: 'vault',     label: 'Coffre',    Icon: IconCoffre },
];

export default function CoffreScreen({ onBack, onTradingClick }: {
  onBack?: () => void;
  onTradingClick?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goldChange24h, setGoldChange24h] = useState(0);
  const [btcPrice, setBtcPrice] = useState(0);
  const [tauxCdfLive, setTauxCdfLive] = useState(0);
  const [tauxLive, setTauxLive] = useState<Record<string, number>>({});
  const [walletBorbBalance, setWalletBorbBalance] = useState(0);
  const [availableWallets, setAvailableWallets] = useState<Array<{ code: string; balance: number }>>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletsReady, setWalletsReady] = useState(false);
  const [goldPrice, setGoldPrice] = useState(0);
  /* 0 = aucune observation : tant que /api/price/all n'a pas répondu, le BORB
     n'a pas de valeur USD connue. Démarrer à 1 afficherait « 1 BORB = 1 USD ». */
  const [borbUsdRate, setBorbUsdRate] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [displayUnit, setDisplayUnit] = useState('BORB');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState('');
  const [pinCallback, setPinCallback] = useState<((pin: string) => void) | null>(null);
  const [pinCancelCallback, setPinCancelCallback] = useState<(() => void) | null>(null);
  const [showFixo, setShowFixo] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendNom, setSendNom] = useState('');
  const [sendPrenom, setSendPrenom] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalMode, setExternalMode] = useState<'depot' | 'retrait'>('depot');
  const [sendMessage, setSendMessage] = useState('');
  const [histoFiltre, setHistoFiltre] = useState<'all' | 'send' | 'receive' | 'ubi'>('all');
  const [histoPage, setHistoPage] = useState(1);
  const [integrite, setIntegrite] = useState<any>(null);
  const [histoErreur, setHistoErreur] = useState('');
  const [verifEnCours, setVerifEnCours] = useState(false);
  const HISTO_PAR_PAGE = 20;
  const [convertFrom, setConvertFrom] = useState('BORB');
  const [convertTo, setConvertTo] = useState('borb');
  const [convertAmount, setConvertAmount] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  const isRefreshingRef = useRef(false);
  const uqNumber = localStorage.getItem('uq_number') || '';

  const loadAllData = async () => {
    if (!uqNumber) { setError('Non connecte'); setLoading(false); return; }
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const bR = await apiClient.get(`/api/borb/balance/${uqNumber}`);
      setBalance(bR.data);

      const pR = await apiClient.get(`/api/account/preferences/${uqNumber}`);
      if (pR.data.preferences?.display_unit) setDisplayUnit(pR.data.preferences.display_unit);

      const cR = await apiClient.get('/api/cases/stats');
      const casesData = cR.data.cases || [];
      setCases(casesData.map((c: any) => ({
        name: c[0] || '',
        percentage: c[1] || 0,
        balance: c[2] || 0,
      })));

      const tR = await apiClient.get(`/api/borb/transactions/${uqNumber}`);
      if (tR.data.status === 'error') {
        setHistoErreur(tR.data.message || 'Historique illisible');
        setTransactions([]);
      } else {
        setHistoErreur('');
        setTransactions(tR.data.transactions || []);
      }

      // Prix marché live (or, BTC, BORB) — un seul appel pour les trois
      try {
        const priceR = await apiClient.get('/api/price/all');
        const prices = priceR.data?.prices || {};
        if (prices.borb_usd) setBorbUsdRate(prices.borb_usd);
        if (prices.btc_usd) setBtcPrice(prices.btc_usd);
        if (prices.gold_usd_per_ounce) setGoldPrice(prices.gold_usd_per_ounce);
      } catch {}

      // Taux LIVE complets depuis l'oracle (84 devises)
      try {
        const cdfR = await apiClient.get('/api/oracle/fiat/CDF');
        if (cdfR.data?.units_per_usd) {
          setTauxCdfLive(cdfR.data.units_per_usd);
        }
      } catch {}
      
      // Tous les taux live pour le SoldeDual
      try {
        const allR = await apiClient.get('/api/oracle/fiat');
        if (allR.data?.rates) {
          const t: Record<string, number> = {};
          for (const [code, unitsPerUsd] of Object.entries(allR.data.rates)) {
            const n = Number(unitsPerUsd);
            if (n > 0) t[code] = n;
          }
          setTauxLive(t);
        }
      } catch {}

      // ===== WALLET BORB BALANCE (nouveau systeme multi_wallets) =====
      try {
        const walletR = await apiClient.get(`/api/account/wallets/${uqNumber}`);
        const walletList: any[] = Array.isArray(walletR.data?.wallets) ? walletR.data.wallets : [];
        const borbWallet = walletList.find((w: any) => w.code === 'BORB');
        if (borbWallet) {
          setWalletBorbBalance(borbWallet.balance || 0);
        }
        setAvailableWallets(walletList.map((w: any) => ({
          code: String(w.code),
          balance: Number(w.balance) || 0,
        })));
        setWalletsReady(Array.isArray(walletR.data?.wallets));
      } catch (e) {
        console.error('[WALLET] Erreur:', e);
        setWalletsReady(false);
      } finally {
        setWalletsLoading(false);
      }

      setLoading(false);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Erreur');
      setLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5 * 60 * 1000);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => { clearInterval(interval); window.removeEventListener('resize', checkMobile); };
  }, []);

  const requirePin = async (
    action: string,
    callback: (pin: string) => void,
    onCancel?: () => void,
    strict: boolean = false,
  ) => {
    try {
      const s = await apiClient.post('/api/account/pin/status', { uq_number: uqNumber });
      if (s.data?.pin_status === 'NotConfigured' || s.data?.pin_configured === false) {
        if (strict) {
          // Certaines opérations (conversion) n'ont AUCUN mode sans PIN :
          // le backend répond 403 PIN_NOT_CONFIGURED. On prévient avant l'appel.
          setModalMessage('Configure un code PIN dans Profil avant de convertir.');
          return;
        }
        callback('');
        return;
      }
    } catch {}
    setPinAction(action);
    setPinCallback(() => callback);
    setPinCancelCallback(onCancel ? () => onCancel : null);
    setShowPinModal(true);
  };

  const handlePinSuccess = (verifiedPin?: string) => {
    setShowPinModal(false);
    setPinCancelCallback(null);
    if (pinCallback) pinCallback(verifiedPin || '');
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    const cancel = pinCancelCallback;
    setPinCancelCallback(null);
    if (cancel) cancel();
  };

  const getSelectedUnit = () => {
    if (!balance) return { value: 0, display: '0', unit: 'BORB', rate: 1 };
    const info = balance.units.find(u => u.unit === displayUnit);
    if (!info) return { value: walletBorbBalance, display: fmt(walletBorbBalance), unit: 'BORB', rate: 1 };
    return { value: info.value, display: fmt(info.value), unit: info.unit, rate: info.rate };
  };

  const selUnit = getSelectedUnit();
  const borbUsd = borbUsdRate;
  const portfolioUsd = walletBorbBalance * borbUsd;
  const portfolioCdf = portfolioUsd * (tauxCdfLive || 0);
  /** Aucun des deux soldes n'a de sens sans les deux taux observés. */
  const sansTaux = !borbUsd || !tauxCdfLive;
  // Repartition selon profil actif (owner peut basculer)
  // Lire le solde du profil actif depuis les donnees du backend
  // (treasury_system pour Profil 1, dev_profile pour Profil 2)
  const [soldeProfil1, setSoldeProfil1] = useState(0);
  const [soldeProfil2, setSoldeProfil2] = useState(0);
  
  // Charger les soldes des profils
  useEffect(() => {
    const chargerSoldes = async () => {
      try {
        const r1 = await apiClient.get('/api/distribution/treasury');
        if (r1.data?.stock_borb !== undefined) setSoldeProfil1(r1.data.stock_borb);
      } catch {}
      try {
        const r2 = await apiClient.get('/api/distribution/delis');
        if (r2.data?.balance_borb !== undefined) setSoldeProfil2(r2.data.balance_borb);
      } catch {}
    };
    if (uqNumber) chargerSoldes();
  }, [uqNumber]);
  
  // Solde affiche : directement depuis balance
  const borbAffiche = walletBorbBalance;
  const portfolioUsdAffiche = portfolioUsd;
  const portfolioCdfAffiche = portfolioCdf;

  // Helper : convertir USD -> devise cible avec le taux réellement observé.
  // Pas de table de repli : sans taux observé, le montant s'affiche « — »,
  // comme le fait déjà le backend (503 TAUX_INDISPONIBLE).
  const toDevise = (usd: number, devise: string): string => {
    const taux = tauxLive[devise];
    if (!taux || taux <= 0) return '—';
    // tauxLive = units_per_usd (1 USD = X devise)
    if (devise === 'CDF') return Math.round(usd * taux).toLocaleString('fr-FR');
    if (devise === 'XOF' || devise === 'XAF' || devise === 'NGN' || devise === 'KES') {
      return Math.round(usd * taux).toLocaleString('fr-FR');
    }
    return (usd * taux).toFixed(2);
  };


  const changeDisplayUnit = async (u: string) => {
    if (!VALID_UNITS.includes(u)) return;
    setDisplayUnit(u);
    try {
      await apiClient.post('/api/account/preferences', { uq_number: uqNumber, display_unit: u });
    } catch {}
  };

  const handlePseudoSelect = (r: PseudoResult) => {
    setSendTo(r.pseudo);
    setSendNom(r.nom);
    setSendPrenom(r.prenom);
  };

  const handleSend = async (data: {
    recipientPseudo: string;
    amountPoints: number;
    feePoints: number;
    memo: string;
    devise: string;
    montantDevise: number;
  }) => {
    requirePin('send', async () => {
      setModalLoading(true); setModalMessage('');
      try {
        // Le backend refuse un transfert sans devise (BORB non transférable).
        // On envoie donc TOUJOURS la devise convertie + son montant exact ;
        // amount_points ne sert plus que de repli.
        const r = await apiClient.post('/api/borb/send', {
          sender: uqNumber,
          recipient: data.recipientPseudo,
          currency: data.devise,
          amount_currency: data.montantDevise,
          amount_points: data.amountPoints,
          fee_points: data.feePoints,
          memo: data.memo,
        });
        if (r.data.status === 'success') {
          const envoye = Number(r.data.amount) || data.montantDevise;
          setModalMessage(`Envoyé : ${envoye} ${r.data.currency || data.devise} (frais 0)`);
          setShowSendModal(false);
          setSendTo(''); setSendNom(''); setSendPrenom(''); setSendAmount(''); setSendNote('');
          await loadAllData();
          setActiveTab('history');
        } else {
          setModalMessage(r.data.message || 'Erreur');
        }
      } catch (e: any) {
        setModalMessage(e.response?.data?.message || e.message);
      } finally {
        setModalLoading(false);
      }
    });
  };

  const verifierIntegrite = async () => {
    setVerifEnCours(true);
    try {
      const r = await apiClient.post(`/api/history/${uqNumber}/verify`);
      setIntegrite(r.data);
    } catch (e: any) {
      setIntegrite({ integre: false, message: e.response?.data?.message || e.message });
    } finally {
      setVerifEnCours(false);
    }
  };

  const handleConvert = async () => {
    const montant = parseFloat(convertAmount);
    if (!montant || montant <= 0) { setModalMessage('Remplis le montant'); return; }
    // « borb » n'est qu'un alias minuscule de BORB côté UI.
    const depuis = convertFrom.toUpperCase();
    const vers = convertTo === 'borb' ? 'BORB' : convertTo.toUpperCase();
    requirePin('convert', async (pin) => {
      setModalLoading(true); setModalMessage('');
      try {
        // Vrai endpoint de conversion : il déplace réellement les fonds
        // (l'ancien /api/borb/convert n'était qu'un calculateur).
        const r = await apiClient.post('/api/account/wallets/convert', {
          uq_number: uqNumber,
          from: depuis === 'BORB' ? 'BORB' : depuis,
          to: vers === 'BORB' ? 'BORB' : vers,
          amount: montant,
          pin: pin || '',
        });
        if (r.data.status === 'success') {
          setModalMessage(
            `Converti : ${r.data.amount_from} ${depuis} → ${r.data.amount_to} ${convertTo.toUpperCase()}`
          );
          setTimeout(() => { setConvertAmount(''); loadAllData(); }, 2500);
        } else {
          setModalMessage(r.data.message || 'Erreur');
        }
      } catch (e: any) {
        const code = e.response?.data?.code;
        setModalMessage(
          code === 'PIN_NOT_CONFIGURED'
            ? 'Configure un code PIN dans Profil avant de convertir.'
            : e.response?.data?.message || e.message
        );
      } finally { setModalLoading(false); }
    }, undefined, true);
  };

  const handleUbi = async () => {
    requirePin('ubi', async () => {
      setModalLoading(true); setModalMessage('');
      try {
        const r = await apiClient.post('/api/ubi/claim', { account: uqNumber });
        if (r.data.status === 'success') {
          setModalMessage(`UBI reclame : +${r.data.amount_points || 100} points`);
          setTimeout(() => { loadAllData(); }, 2500);
        } else setModalMessage(r.data.message || 'Erreur');
      } catch (e: any) { setModalMessage(e.response?.data?.message || e.message); }
      finally { setModalLoading(false); }
    });
  };

  const caseLabels = ['Tresor', 'Frais', 'Recomp.', 'Epargne', 'Credit', 'Shield'];
  const caseIcons = [IconBank, IconActions, IconUbi, IconCoffre, IconWallet, IconShield];

  if (loading) {
    return <UQLoader message="Chargement du coffre UQ..." subMessage="Connexion securisee" />;
  }

  if (error || !balance) {
    return (
      <div className="min-h-screen bg-[var(--uq-bg-primary)] text-[var(--uq-text-primary)] flex items-center justify-center p-4">
        <div className="bg-[var(--uq-bg-secondary)] border border-[#F6465D]/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(246,70,93,0.3)]">
          <p className="text-[#F6465D] text-sm mb-4">{error || 'Erreur'}</p>
          <button onClick={() => loadAllData()} className="text-[var(--uq-text-primary)] text-sm underline hover:text-[#E63946]">
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="uq-screen uq-spatial-background relative overflow-hidden">

      {/* Fond anime avec gradients rouge/bleu */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[140px] uq-animate-pulse"
             style={{ backgroundColor: 'rgba(230,57,70,0.28)', animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[140px] uq-animate-pulse"
             style={{ backgroundColor: 'rgba(46,134,222,0.22)', animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[180px] opacity-30"
             style={{ backgroundColor: 'rgba(181,55,140,0.15)' }} />
      </div>

      {/* SIDEBAR PC */}
      {!isMobile && (
        <aside
          className={`hidden md:flex fixed top-0 left-0 h-[calc(100vh-4rem)] z-40 flex-col border-r border-[var(--uq-border)] transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(20,10,25,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '4px 0 30px rgba(230,57,70,0.1), 4px 0 60px rgba(46,134,222,0.08)',
          }}
        >
          <div className="p-4 border-b border-[var(--uq-border)] flex items-center justify-between shrink-0">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <LogoBorb size={28} />
                <span className="text-sm font-bold uq-gradient-text">BORB</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-[var(--uq-text-secondary)] hover:text-[var(--uq-text-primary)] transition-colors p-1"
            >
              <IconChevron size={18} direction={sidebarOpen ? 'left' : 'right'} />
            </button>
          </div>

          {onBack && (
            <div className="p-3 border-b border-[var(--uq-border)] shrink-0">
              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--uq-bg-tertiary)] hover:bg-[var(--uq-bg-hover)] text-[var(--uq-text-secondary)] hover:text-[var(--uq-text-primary)] transition-all text-xs font-bold active:scale-95"
              >
                <IconClose size={14} />
                {sidebarOpen && <span>Fermer</span>}
              </button>
            </div>
          )}

          <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
            {TABS.map(({ id, label, Icon }) => {
              const IconComp = Icon;
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 mx-2 my-0.5 rounded-xl text-sm font-bold text-left transition-all active:scale-[0.98] ${
                    active
                      ? 'text-white shadow-[0_0_20px_rgba(230,57,70,0.4)]'
                      : 'text-[var(--uq-text-secondary)] hover:text-[var(--uq-text-primary)] hover:bg-[var(--uq-bg-tertiary)]'
                  }`}
                  style={active ? {
                    background: UQ_GRADIENTS.main,
                    backgroundSize: '200% 200%',
                    border: '1px solid rgba(230,57,70,0.5)',
                  } : {}}
                >
                  <IconComp size={18} color={active ? '#FFFFFF' : UQ_COLORS.textSecondary} />
                  {sidebarOpen && <span className="flex-1">{label}</span>}
                </button>
              );
            })}

            <div className="my-3 mx-4 h-px bg-gradient-to-r from-transparent via-[#E63946]/40 to-transparent" />

            <button
              onClick={() => onTradingClick?.()}
              className="w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-bold text-left transition-all active:scale-[0.98] text-[var(--uq-text-secondary)] hover:text-[var(--uq-text-primary)] hover:bg-[var(--uq-bg-tertiary)]"
            >
              <IconTrading size={18} color={UQ_COLORS.textSecondary} />
              {sidebarOpen && <span className="flex-1">Trading</span>}
            </button>
          </nav>

          {sidebarOpen && (
            <div className="p-4 border-t border-[var(--uq-border)] shrink-0">
              <div
                className="rounded-xl p-3 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(14,203,129,0.15), rgba(14,203,129,0.05))',
                  border: '1px solid rgba(14,203,129,0.4)',
                  boxShadow: '0 0 20px rgba(14,203,129,0.2)',
                }}
              >
                <IconShield size={20} color={UQ_COLORS.green} />
                <div>
                  <p className="text-xs font-bold" style={{ color: UQ_COLORS.green }}>Securite A+</p>
                  <p className="text-[10px]" style={{ color: 'rgba(14,203,129,0.7)' }}>2FA active</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      <CoffreNavBar
        activeTab={activeTab as any}
        onTabChange={(t) => setActiveTab(t as Tab)}
        onBack={() => onBack?.()}
        onTradingClick={onTradingClick}
      />

      <main className={`relative z-10 transition-all duration-300 ${!isMobile ? (sidebarOpen ? 'md:ml-64' : 'md:ml-20') : ''}`}>
        <div className="uq-screen-content space-y-6">

          {activeTab === 'dashboard' && (
            <>
              {/* CARTE SOLDE PRINCIPALE - Effet magistral */}
              <div className="rounded-[28px] p-7 relative overflow-hidden uq-animate-slide-up"
                   style={{
                     background: 'linear-gradient(135deg, rgba(230,57,70,0.30) 0%, rgba(181,55,140,0.22) 35%, rgba(46,134,222,0.25) 100%)',
                     border: '1px solid rgba(230,57,70,0.4)',
                     boxShadow: '0 0 60px rgba(230,57,70,0.25), 0 0 100px rgba(46,134,222,0.15), inset 0 0 60px rgba(255,255,255,0.03)',
                   }}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-60"
                     style={{ background: 'radial-gradient(circle, rgba(181,55,140,0.4), transparent 70%)' }} />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-40"
                     style={{ background: 'radial-gradient(circle, rgba(46,134,222,0.3), transparent 70%)' }} />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <LogoBorb size={24} />
                      <p className="text-xs tracking-[0.2em] text-white/80 uppercase font-semibold">Portefeuille BORB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={displayUnit}
                        onChange={(e) => changeDisplayUnit(e.target.value)}
                        className="bg-white/10 hover:bg-white/20 border border-white/25 rounded-xl px-2.5 py-1 text-xs font-bold text-white cursor-pointer focus:outline-none backdrop-blur-md transition-all"
                      >
                        {VALID_UNITS.map(u => <option key={u} value={u} className="bg-[#181A20]">{u}</option>)}
                      </select>
                      <button
                        onClick={() => setBalanceHidden(!balanceHidden)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all active:scale-90"
                      >
                        {balanceHidden ? <IconEye size={16} color="#FFF" /> : <IconEyeOff size={16} color="#FFF" />}
                      </button>
                    </div>
                  </div>

                  {/* Solde - Dual avec 3 scrolls */}
                  {balanceHidden ? (
                    <div className="space-y-2 py-4">
                      <p className="text-5xl font-black text-white tracking-wider">******</p>
                      <p className="text-lg text-white/70">****** USD</p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-3">
                      {/* Solde en devise locale (principal) */}
                      <p className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(230,57,70,0.4)]">
                        {sansTaux ? '—' : fmtCdf(portfolioCdfAffiche)} {!sansTaux && <span className="text-3xl text-white/80">FC</span>}
                      </p>
                      
                      {/* Equivalent USD (comparaison) */}
                      <p className="text-lg text-white/60 font-medium">
                        {sansTaux ? 'taux indisponible' : `≈ $${fmtUsd(portfolioUsdAffiche)} USD`}
                      </p>
                      
                      {/* BORB camoufle en protection tech */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-base"><Icon name="shield" size={18} tone="success" /></span>
                        <span className="text-xs font-bold text-[#0ECB81]">
                          Fonds immunisés par ORB : 100% sécurisé
                        </span>
                      </div>
                      
                      {/* Selecteur "Voir en" + Case solde */}
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-[10px] text-white/50 uppercase tracking-wider">Voir en :</span>
                        <select
                          value={displayCurrency}
                          onChange={(e) => setDisplayCurrency(e.target.value)}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-2 py-1 text-xs font-bold text-white cursor-pointer focus:outline-none"
                        >
                          {['USD', 'EUR', 'GBP', 'CDF', 'XOF', 'XAF', 'NGN', 'ZAR', 'KES'].map(code => (
                            <option key={code} value={code} className="bg-[#181A20]">{code}</option>
                          ))}
                        </select>
                        <span className="px-3 py-1.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/40 text-xs font-black text-[#0ECB81]">
                          {displayCurrency === 'USD' && (sansTaux ? '—' : `$${fmtUsd(portfolioUsdAffiche)}`)}
                          {displayCurrency === 'CDF' && (sansTaux ? '—' : `${toDevise(portfolioUsdAffiche, 'CDF')} FC`)}
                          {displayCurrency === 'EUR' && (sansTaux ? '—' : `€${toDevise(portfolioUsdAffiche, 'EUR')}`)}
                          {displayCurrency === 'GBP' && (sansTaux ? '—' : `£${toDevise(portfolioUsdAffiche, 'GBP')}`)}
                          {displayCurrency === 'XOF' && (sansTaux ? '—' : `${toDevise(portfolioUsdAffiche, 'XOF')} CFA`)}
                          {displayCurrency === 'XAF' && (sansTaux ? '—' : `${toDevise(portfolioUsdAffiche, 'XAF')} FCFA`)}
                          {displayCurrency === 'NGN' && (sansTaux ? '—' : `₦${toDevise(portfolioUsdAffiche, 'NGN')}`)}
                          {displayCurrency === 'ZAR' && (sansTaux ? '—' : `R${toDevise(portfolioUsdAffiche, 'ZAR')}`)}
                          {displayCurrency === 'KES' && (sansTaux ? '—' : `KSh${toDevise(portfolioUsdAffiche, 'KES')}`)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Prix live BTC + Or */}
                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        {btcPrice > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/40 shadow-[0_0_15px_rgba(247,147,26,0.3)]">
                            <span>₿</span>
                            <span>BTC</span>
                            <span className="font-mono">${btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                          </span>
                        )}
                        {goldPrice > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                            <span>◆</span>
                            <span>OR</span>
                            <span className="font-mono">${goldPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                          </span>
                        )}
                      </div>
                </div>
              </div>

              {/* 3 CARTES - Unit / Cases / Boucliers */}

              {/* Graphique P&L */}
              <BalanceChart uqNumber={uqNumber} currentScorePoints={balance?.balance?.points ?? 0} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Unites */}
                <div className="rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(123,94,167,0.4)]"
                     style={{
                       background: 'linear-gradient(135deg, rgba(123,94,167,0.15) 0%, rgba(26,26,36,0.95) 100%)',
                       border: '1px solid rgba(123,94,167,0.35)',
                       boxShadow: '0 0 20px rgba(123,94,167,0.15)',
                     }}>
                  <div className="flex items-center gap-2 mb-3">
                    <IconUnits size={18} color={UQ_COLORS.purple} />
                    <p className="text-xs font-bold tracking-wider uppercase text-white/85">Mes Unites</p>
                  </div>
                  <div className="space-y-1.5">
                    {balance.units.map((u) => (
                      <div key={u.unit} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: UQ_COLORS.purple, boxShadow: `0 0 8px ${UQ_COLORS.purple}` }} />
                          <span className="text-white/65">{u.unit}</span>
                        </div>
                        <span style={{ color: UQ_COLORS.gold }} className="font-mono font-bold">{fmt(u.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cases */}
                <div className="rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]"
                     style={{
                       background: 'linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(26,26,36,0.95) 100%)',
                       border: '1px solid rgba(255,215,0,0.35)',
                       boxShadow: '0 0 20px rgba(255,215,0,0.12)',
                     }}>
                  <div className="flex items-center gap-2 mb-3">
                    <IconCoffre size={18} color={UQ_COLORS.gold} />
                    <p className="text-xs font-bold tracking-wider uppercase text-white/85">Mes Cases</p>
                  </div>
                  <div className="space-y-1.5">
                    {cases.slice(0, 6).map((c, i) => {
                      const IconComp = caseIcons[i] || IconBank;
                      return (
                        <div key={c.name || i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <IconComp size={12} color={UQ_COLORS.gold} />
                            <span className="text-white/65">{caseLabels[i]}</span>
                          </div>
                          <span style={{ color: UQ_COLORS.gold }} className="font-mono text-[10px] font-bold">{c.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Boucliers */}
                <div className="rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(14,203,129,0.4)]"
                     style={{
                       background: 'linear-gradient(135deg, rgba(14,203,129,0.12) 0%, rgba(26,26,36,0.95) 100%)',
                       border: '1px solid rgba(14,203,129,0.35)',
                       boxShadow: '0 0 20px rgba(14,203,129,0.12)',
                     }}>
                  <div className="flex items-center gap-2 mb-3">
                    <IconShield size={18} color={UQ_COLORS.green} />
                    <p className="text-xs font-bold tracking-wider uppercase text-white/85">Mes Boucliers</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { Icon: IconMedalBronze, label: 'Bronze', color: '#CD7F32' },
                      { Icon: IconMedalSilver, label: 'Argent', color: '#C0C0C0' },
                      { Icon: IconMedalGold, label: 'Or', color: UQ_COLORS.gold },
                      { Icon: IconMedalPlatinum, label: 'Platine', color: '#E5E4E2' },
                    ].map((m) => {
                      const IconComp = m.Icon;
                      return (
                        <div key={m.label} className="flex items-center gap-2 text-xs">
                          <IconComp size={16} color={m.color} />
                          <span className="text-white/65">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTIONS RAPIDES */}
              <div className="rounded-2xl p-5"
                   style={{
                     background: 'linear-gradient(135deg, rgba(37,37,51,0.7) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid var(--uq-border)',
                     boxShadow: '0 0 30px rgba(230,57,70,0.08)',
                   }}>
                <div className="flex items-center gap-2 mb-4">
                  <IconActions size={18} color={UQ_COLORS.gold} />
                  <p className="text-xs font-bold tracking-wider uppercase text-white/85">Actions rapides</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'send', label: 'Envoyer', Icon: IconSend, color: UQ_COLORS.blue, action: () => setActiveTab('send') },
                    { id: 'convert', label: 'Convertir', Icon: IconConvert, color: UQ_COLORS.purple, action: () => setActiveTab('convert') },
                    { id: 'ubi', label: 'UBI', Icon: IconUbi, color: UQ_COLORS.magenta, action: () => setActiveTab('ubi') },
                    { id: 'trading', label: 'Trading', Icon: IconTrading, color: UQ_COLORS.gold, action: () => onTradingClick?.() },
                  ].map((a) => {
                    const IconComp = a.Icon;
                    return (
                      <button
                        key={a.id}
                        onClick={a.action}
                        className="rounded-2xl p-4 hover:scale-105 transition-all duration-300 text-center group active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, ${a.color}25, ${a.color}08)`,
                          border: `1px solid ${a.color}50`,
                          boxShadow: `0 0 20px ${a.color}20`,
                        }}
                      >
                        <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                          <IconComp size={26} color={a.color} />
                        </div>
                        <p className="text-xs font-bold text-white">{a.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BANQUE EXTERNE */}
              <div className="rounded-2xl p-5"
                   style={{
                     background: 'linear-gradient(135deg, rgba(37,37,51,0.7) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid var(--uq-border)',
                     boxShadow: '0 0 30px rgba(46,134,222,0.08)',
                   }}>
                <div className="flex items-center gap-2 mb-4">
                  <IconBank size={18} color={UQ_COLORS.blue} />
                  <p className="text-xs font-bold tracking-wider uppercase text-white/85">Banque externe</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'mobile', label: 'Mobile Money', desc: 'M-Pesa / Airtel / Orange', Icon: IconMobileMoney, color: UQ_COLORS.green },
                    { id: 'crypto', label: 'Crypto', desc: 'USDT / BTC / ETH', Icon: IconCrypto, color: UQ_COLORS.gold },
                    { id: 'bank', label: 'Virement', desc: 'IBAN / SWIFT', Icon: IconBank, color: UQ_COLORS.blue },
                  ].map((b) => {
                    const IconComp = b.Icon;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setModalMessage(`${b.label} - Bientot disponible`)}
                        className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95 hover:scale-[1.02]"
                        style={{
                          background: 'var(--uq-bg-primary)',
                          border: `1px solid ${b.color}30`,
                          boxShadow: `0 0 15px ${b.color}10`,
                        }}
                      >
                        <IconComp size={24} color={b.color} />
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{b.label}</p>
                          <p className="text-[10px] text-white/55 truncate">{b.desc}</p>
                        </div>
                        <IconChevron size={14} color={UQ_COLORS.textSecondary} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ===== ENVOYER ===== */}
          {/* ===== ENVOYER ===== */}
          {activeTab === 'send' && (
            <div className="space-y-4 uq-animate-fade-in max-w-5xl mx-auto">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <IconSend size={22} color={UQ_COLORS.blue} />
                Envoyer des BORB
              </h2>

              <div className="rounded-2xl p-8 flex flex-col items-center gap-4"
                   style={{
                     background: 'linear-gradient(135deg, rgba(37,37,51,0.7) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid rgba(46,134,222,0.3)',
                     boxShadow: '0 0 30px rgba(46,134,222,0.15)',
                   }}>
                <p className="text-sm text-white/65 text-center leading-relaxed max-w-2xl">
                  Choisis un destinataire par son pseudo, saisis un montant dans la devise de ton choix : la conversion est faite par l&apos;oracle.
                </p>

                {/* Bouton Nouvel envoi */}
                <button
                  onClick={() => { setSendMessage(''); setShowSendModal(true); }}
                  className="w-full py-5 rounded-2xl font-black text-base text-white active:scale-95 transition-all hover:shadow-[0_0_40px_rgba(230,57,70,0.6)] flex items-center justify-center gap-3"
                  style={{ background: UQ_GRADIENTS.main, backgroundSize: '200% 200%' }}
                >
                  <IconSend size={22} color="#FFF" />
                  Nouvel envoi
                </button>

                {/* Bouton Scanner pour payer */}
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full py-5 rounded-2xl font-black text-base text-white active:scale-95 transition-all flex items-center justify-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, #2E86DE, #7B4DD9)',
                    boxShadow: '0 0 30px rgba(46,134,222,0.5), inset 0 0 20px rgba(255,255,255,0.05)',
                    border: '1px solid rgba(46,134,222,0.5)',
                  }}
                >
                  <IconScan size={22} color="#FFF" />
                  Scanner pour payer
                </button>

                {/* Separateur OU */}
                <div className="w-full flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="text-[10px] font-black text-white/40 tracking-widest">OU</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                {/* Bouton Depot externe */}
                <button
                  onClick={() => { setExternalMode('depot'); setShowExternalModal(true); }}
                  className="w-full py-5 rounded-2xl font-black text-base text-white active:scale-95 transition-all flex items-center justify-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, #0ECB81, #2E86DE)',
                    boxShadow: '0 0 30px rgba(14,203,129,0.5), inset 0 0 20px rgba(255,255,255,0.05)',
                    border: '1px solid rgba(14,203,129,0.5)',
                  }}
                >
                  <span style={{ fontSize: '20px' }}><Icon name="arrowDown" size={20} tone="brand" /></span>
                  Depot externe
                </button>

                {/* Bouton Retrait externe */}
                <button
                  onClick={() => { setExternalMode('retrait'); setShowExternalModal(true); }}
                  className="w-full py-5 rounded-2xl font-black text-base text-white active:scale-95 transition-all flex items-center justify-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #B5378C)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,215,0,0.5)',
                  }}
                >
                  <span style={{ fontSize: '20px' }}><Icon name="arrowUp" size={20} tone="success" /></span>
                  Retrait externe
                </button>

                {sendMessage && (
                  <div className="w-full p-3 rounded-xl text-xs bg-[var(--uq-bg-primary)] text-white/75 border border-[var(--uq-border)]">{sendMessage}</div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'receive' && <ReceivePanel uqNumber={uqNumber} />}

          {activeTab === 'convert' && (
            <div className="space-y-4 uq-animate-fade-in">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <IconConvert size={22} color={UQ_COLORS.purple} />
                Convertir
              </h2>
              <div className="rounded-2xl p-5 space-y-4"
                   style={{
                     background: 'linear-gradient(135deg, rgba(37,37,51,0.7) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid rgba(123,94,167,0.3)',
                     boxShadow: '0 0 30px rgba(123,94,167,0.15)',
                   }}>
                <input type="number" placeholder="Montant" value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  className="w-full p-4 bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] rounded-xl text-white text-base focus:border-[var(--uq-magenta)] outline-none transition-all" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={convertFrom} onChange={(e) => setConvertFrom(e.target.value)}
                    className="p-3 bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] rounded-xl text-white text-sm font-bold">
                    {VALID_UNITS.map(u => <option key={u} value={u} className="bg-[#181A20]">{u}</option>)}
                  </select>
                  <select value={convertTo} onChange={(e) => setConvertTo(e.target.value)}
                    className="p-3 bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] rounded-xl text-white text-sm font-bold">
                    {VALID_UNITS.map(u => <option key={u} value={u} className="bg-[#181A20]">{u}</option>)}
                  </select>
                </div>
                <button onClick={handleConvert} disabled={modalLoading}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white disabled:opacity-50 active:scale-95 transition-all hover:shadow-[0_0_40px_rgba(123,94,167,0.5)]"
                  style={{ background: UQ_GRADIENTS.main, backgroundSize: '200% 200%' }}>
                  {modalLoading ? 'Conversion...' : 'Convertir'}
                </button>
                {modalMessage && (
                  <div className="p-3 rounded-xl text-sm bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">{modalMessage}</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ubi' && (
            <div className="space-y-4 uq-animate-fade-in">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <IconUbi size={22} color={UQ_COLORS.magenta} />
                Revenu de base universel
              </h2>
              <div className="rounded-2xl p-7 text-center space-y-5"
                   style={{
                     background: 'linear-gradient(135deg, rgba(181,55,140,0.2) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid rgba(181,55,140,0.4)',
                     boxShadow: '0 0 40px rgba(181,55,140,0.2)',
                   }}>
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                     style={{ background: UQ_GRADIENTS.diagonal, boxShadow: '0 0 40px rgba(181,55,140,0.5)' }}>
                  <IconUbi size={36} color="#FFF" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Reclamez votre UBI</h3>
                <p className="text-xs text-white/65 max-w-xs mx-auto leading-relaxed">
                  Chaque jour, un revenu de base est distribue a tous les utilisateurs actifs.
                </p>
                <button onClick={handleUbi} disabled={modalLoading}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white disabled:opacity-50 active:scale-95 transition-all hover:shadow-[0_0_40px_rgba(181,55,140,0.6)]"
                  style={{ background: UQ_GRADIENTS.main, backgroundSize: '200% 200%' }}>
                  {modalLoading ? 'Reclamation...' : 'Reclamer UBI'}
                </button>
                {modalMessage && (
                  <div className="p-3 rounded-xl text-sm bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">{modalMessage}</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (() => {
            const filtrees = transactions.filter((t) =>
              histoFiltre === 'all' ? true
              : histoFiltre === 'send' ? t.type === 'send'
              : histoFiltre === 'receive' ? t.type === 'receive'
              : t.type === 'ubi'
            );
            const pages = Math.max(1, Math.ceil(filtrees.length / HISTO_PAR_PAGE));
            const page = Math.min(histoPage, pages);
            const visibles = filtrees.slice((page - 1) * HISTO_PAR_PAGE, page * HISTO_PAR_PAGE);

            return (
            <div className="space-y-4 uq-animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <IconTransactions size={22} color={UQ_COLORS.magenta} />
                  Historique
                </h2>
                <button
                  onClick={verifierIntegrite}
                  disabled={verifEnCours}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold bg-[var(--uq-bg-secondary)] border border-[var(--uq-border)] text-white/75 disabled:opacity-50 active:scale-95 transition-all hover:border-[#E63946]/50 hover:text-white"
                >
                  {verifEnCours ? 'Verification...' : 'Verifier l integrite'}
                </button>
              </div>

              {histoErreur && (
                <div className="p-3 rounded-xl text-[11px] bg-[#F6465D]/10 border border-[#F6465D]/40 text-[#F6465D]">
                  {histoErreur}
                </div>
              )}
              {integrite && (
                <div className={`p-3 rounded-xl text-[11px] border ${
                  integrite.integre
                    ? 'bg-[#0ECB81]/10 border-[#0ECB81]/40 text-[#0ECB81]'
                    : 'bg-[#F6465D]/10 border-[#F6465D]/40 text-[#F6465D]'
                }`}>
                  {integrite.integre
                    ? `Historique intact - ${integrite.tx_count ?? ''} transaction(s) scellee(s)`
                    : `${integrite.message || 'Historique modifie ou cadenas absent'}`}
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {([['all', 'Tout'], ['send', 'Envoyes'], ['receive', 'Recus'], ['ubi', 'UBI']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => { setHistoFiltre(id as any); setHistoPage(1); }}
                    className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                      histoFiltre === id
                        ? 'text-white shadow-[0_0_20px_rgba(230,57,70,0.4)]'
                        : 'bg-[var(--uq-bg-secondary)] text-white/65 border border-[var(--uq-border)]'
                    }`}
                    style={histoFiltre === id ? { background: UQ_GRADIENTS.main } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl p-3"
                   style={{
                     background: 'linear-gradient(135deg, rgba(37,37,51,0.7) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid var(--uq-border)',
                     boxShadow: '0 0 25px rgba(230,57,70,0.08)',
                   }}>
                {visibles.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-8">Aucune transaction</p>
                ) : (
                  <div className="space-y-2">
                    {visibles.map((t) => {
                      const entrant = t.type === 'receive' || t.type === 'ubi' || t.type === 'recovered';
                      const couleur = entrant ? UQ_COLORS.green : UQ_COLORS.red;
                      const signe = entrant ? '+' : '-';
                      const libelle = t.type === 'send' ? 'Envoye'
                                    : t.type === 'ubi' ? 'UBI'
                                    : t.type === 'recovered' ? 'Recupere'
                                    : 'Recu';
                      return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTx(t)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left active:scale-[0.98] hover:scale-[1.01]"
                        style={{
                          background: 'var(--uq-bg-primary)',
                          border: '1px solid var(--uq-border)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            entrant ? 'bg-[#0ECB81]/20' : 'bg-[#F6465D]/20'
                          }`}
                          style={{
                            boxShadow: entrant ? '0 0 15px rgba(14,203,129,0.3)' : '0 0 15px rgba(246,70,93,0.3)',
                          }}>
                            {entrant ? <IconReceive size={16} color={couleur} /> : <IconSend size={16} color={couleur} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{libelle}</p>
                            <p className="text-xs text-white/50 truncate max-w-[150px]">{t.counterparty}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-mono block font-bold" style={{ color: couleur }}>
                            {signe}{fmt(t.amount / 100)} BORB
                          </span>
                          <span className="text-[10px] text-white/45">
                            {new Date(t.timestamp * 1000).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setHistoPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-xl text-[11px] font-bold bg-[var(--uq-bg-secondary)] border border-[var(--uq-border)] text-white/75 disabled:opacity-30"
                  >
                    Precedent
                  </button>
                  <span className="text-[11px] text-white/55">
                    Page {page} / {pages} - {filtrees.length} operation(s)
                  </span>
                  <button
                    onClick={() => setHistoPage(Math.min(pages, page + 1))}
                    disabled={page >= pages}
                    className="px-4 py-2 rounded-xl text-[11px] font-bold bg-[var(--uq-bg-secondary)] border border-[var(--uq-border)] text-white/75 disabled:opacity-30"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
            );
          })()}

          {activeTab === 'vault' && (
            <div className="space-y-4 uq-animate-fade-in">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <IconCoffre size={22} color={UQ_COLORS.gold} />
                Coffre en detail
              </h2>

              {/* ═══ MES PORTEFEUILLES MULTI-DEVISES ═══ */}
              <MultiWallets
                uqNumber={uqNumber}
                onWalletsChange={setAvailableWallets}
                onRequirePin={requirePin}
              />

              {/* ═══ FLUX BORB — 6 CASES TEMPS REEL ═══ */}
              <BorbLiveDashboard uqNumber={uqNumber} />

              {/* ═══ SOUS-UNITES BORB ═══ */}
              <div className="rounded-2xl p-5"
                   style={{
                     background: 'linear-gradient(135deg, rgba(123,94,167,0.15) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid rgba(123,94,167,0.35)',
                     boxShadow: '0 0 30px rgba(123,94,167,0.15)',
                   }}>
                <div className="flex items-center gap-2 mb-4">
                  <IconUnits size={18} color={UQ_COLORS.purple} />
                  <p className="text-xs font-bold tracking-wider uppercase text-white/85">Sous-unites BORB</p>
                </div>
                <div className="space-y-2">
                  {balance.units.map((u, index) => {
                    // Timer de deverrouillage progressif : 3s par unite
                    // Unite 1 = debloquee, unite 2 = +3s, unite 3 = +6s, etc.
                    const estDebloquee = index === 0 || (walletBorbBalance / 100) >= Math.pow(10, index);
                    return (
                      <div key={u.unit} className="flex items-center justify-between p-3 rounded-xl"
                           style={{
                             background: 'var(--uq-bg-primary)',
                             border: '1px solid var(--uq-border)',
                             opacity: estDebloquee ? 1 : 0.5,
                           }}>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full"
                               style={{
                                 backgroundColor: estDebloquee ? UQ_COLORS.purple : '#666',
                                 boxShadow: estDebloquee ? `0 0 10px ${UQ_COLORS.purple}` : 'none',
                               }} />
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                              {u.unit}
                              {!estDebloquee && (
                                <span className="text-[10px] text-yellow-500 font-normal">
                                  <Icon name="lock" size={12} tone="muted" /> Debloque a {Math.pow(10, index).toLocaleString('fr-FR')} BORB
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-white/50">1 BORB = {fmt(u.rate)} {u.unit}</p>
                          </div>
                        </div>
                        <p className="font-mono text-sm font-bold" style={{ color: estDebloquee ? UQ_COLORS.gold : '#666' }}>
                          {estDebloquee ? fmt(u.value) : '••••'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══ LES 6 CASES ═══ */}
              <div className="rounded-2xl p-5"
                   style={{
                     background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(26,26,36,0.95) 100%)',
                     border: '1px solid rgba(255,215,0,0.3)',
                     boxShadow: '0 0 30px rgba(255,215,0,0.12)',
                   }}>
                <div className="flex items-center gap-2 mb-4">
                  <IconCoffre size={18} color={UQ_COLORS.gold} />
                  <p className="text-xs font-bold tracking-wider uppercase text-white/85">Les 6 Cases</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {caseLabels.map((label, i) => {
                    const c = cases[i] || { percentage: 0, balance: 0 };
                    const IconComp = caseIcons[i] || IconBank;
                    return (
                      <div key={label} className="p-3 rounded-2xl"
                           style={{
                             background: `linear-gradient(135deg, ${UQ_COLORS.gold}15, transparent)`,
                             border: `1px solid ${UQ_COLORS.gold}40`,
                             boxShadow: `0 0 15px ${UQ_COLORS.gold}15`,
                           }}>
                        <div className="flex items-center gap-2 mb-2">
                          <IconComp size={16} color={UQ_COLORS.gold} />
                          <p className="text-xs font-bold text-white">{label}</p>
                        </div>
                        <p className="text-xl font-black text-white mb-1" style={{ color: UQ_COLORS.gold }}>{c.percentage}%</p>
                        <p className="text-[10px] text-white/50">{fmt(c.balance / 100)} BORB</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

            {/* Scanner QR */}
      <ScannerModal
        show={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(pseudo, name) => {
          setSendTo(pseudo);
          setSendNom(name);
          setSendPrenom('');
          setShowSendModal(true);
        }}
      />

            {/* Depot / Retrait externe */}
      <ExternalTransferModal
        show={showExternalModal}
        mode={externalMode}
        onClose={() => setShowExternalModal(false)}
        onP2PClick={() => onTradingClick?.()}
      />

      {showSendModal && (
        <SendModal
          uqNumber={uqNumber}
          availableWallets={availableWallets}
          balanceLoading={walletsLoading}
          balanceReady={walletsReady}
          initialRecipient={sendTo}
          initialNom={sendNom}
          initialPrenom={sendPrenom}
          onClose={() => setShowSendModal(false)}
          onConfirm={handleSend}
          loading={modalLoading}
          message={modalMessage}
        />
      )}

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          uqNumber={uqNumber}
          onClose={() => setSelectedTx(null)}
        />
      )}

      <div className="fixed bottom-24 right-6 z-40">
        <FixoIcon size={56} onClick={() => setShowFixo(true)} badge={0} />
      </div>

      {showPinModal && (
        <PinModal
          action={pinAction}
          uqNumber={uqNumber}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
        />
      )}

      {showFixo && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[110] flex items-center justify-center p-4 uq-animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowFixo(false)}
        >
          <div className="w-full max-w-md uq-animate-scale-in">
            <FixoAssistant onClose={() => setShowFixo(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
