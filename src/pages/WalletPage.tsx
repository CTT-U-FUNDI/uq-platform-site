import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { Icon, type IconName } from '../components/ui/Icon';
import { LogoUQ } from '../components/ui/LogoUQ';

// ====================
// TYPES
// ====================
interface UnitInfo {
  position: number;
  unit: string;
  name: string;
  value: number;
  rate: number;
  display: string;
}

interface BalanceData {
  account: string;
  display: string;
  borb_total: number;
  points: number;
  units: UnitInfo[];
}

interface PriceData {
  gold_usd_per_ounce: number;
  btc_usd: number;
  borb_usd: number;
  borb_btc: number;
}

interface Transaction {
  id: number;
  type: 'send' | 'receive';
  amount: number;
  fee: number;
  counterparty: string;
  timestamp: number;
}

interface VaultCard {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  amount: number;
  unit: string;
  valueUsd: number;
  valueLocal: number;
  change24h: number;
  miniChart: number[];
}

// ====================
// COMPOSANT
// ====================
export default function WalletPage() {
  const [myBalance, setMyBalance] = useState<BalanceData | null>(null);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'security' | 'trade' | 'help'>('dashboard');
  const [btcHistory, setBtcHistory] = useState<number[]>([]);
  const [goldHistory, setGoldHistory] = useState<number[]>([]);
  const [btcChange24h, setBtcChange24h] = useState<number>(0);
  const [goldChange24h, setGoldChange24h] = useState<number>(0);
  // 1 USD = X CDF, lu sur l'oracle interne (moteur de taux). 0 = aucune
  // observation : les montants CDF s'affichent alors indisponibles.
  const [cdfRate, setCdfRate] = useState(0);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTone, setModalTone] = useState<'success' | 'error' | 'info'>('info');
  const notify = (msg: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setModalTone(tone);
    setModalMessage(msg);
  };
  const notifySuccess = (msg: string) => notify(msg, 'success');
  const notifyError = (msg: string) => notify(msg, 'error');
  const [selectedVault, setSelectedVault] = useState<VaultCard | null>(null);

  // Form states
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [convertFrom, setConvertFrom] = useState('BORB');
  const [convertTo, setConvertTo] = useState('borb');
  const [convertAmount, setConvertAmount] = useState('');
  const [freezeAmount, setFreezeAmount] = useState('');
  const [freezeMonths, setFreezeMonths] = useState('12');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mobile_money');
  const [depositAmount, setDepositAmount] = useState('');

  const accountId = localStorage.getItem('uq_number');
  const userName = localStorage.getItem('uq_name') || 'Alex R.';

  useEffect(() => {
    if (!accountId) { setLoading(false); return; }
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, [accountId]);

  const loadAll = async () => {
    if (!accountId) return;
    setLoading(true);
    setError('');
    try {
      const priceResp = await apiFetch('/api/price/all');
      const priceData = await priceResp.json();
      if (priceData && priceData.prices) setPrices(priceData.prices);
      else if (priceData && priceData.gold_usd_per_ounce) setPrices(priceData);

      const myResp = await apiFetch(`/api/borb/balance/${encodeURIComponent(accountId)}`);
      const myData = await myResp.json();
      if (!myData || myData.status === 'error' || !myData.balance) {
        setError('Compte introuvable');
        setLoading(false);
        return;
      }
      setMyBalance(myData);

      try {
        const casesResp = await apiFetch('/api/cases/stats');
        const casesData = await casesResp.json();
        const totalCases = (casesData.cases || []).reduce((sum: number, c: any) => sum + (c[1] || 0), 0);
        const parsedCases = (casesData.cases || []).map((c: any) => ({
          name: c[0],
          balance: c[1] || 0,
          pct: totalCases > 0 ? Math.round((c[1] / totalCases) * 100) : 0,
        }));
        setCases(parsedCases);
      } catch (e) {}

      try {
        const txResp = await apiFetch(`/api/borb/transactions/${encodeURIComponent(accountId)}`);
        const txData = await txResp.json();
        setTransactions(txData.transactions || []);
      } catch (e) {}

      // ===== Taux CDF observe par le moteur de taux (jamais en dur) =====
      try {
        const cdfResp = await apiFetch('/api/oracle/fiat/CDF');
        const cdfData = await cdfResp.json();
        setCdfRate(Number(cdfData.units_per_usd) || 0);
      } catch (e) {}

      // ===== Charger l'historique BTC/Gold =====
      try {
        const btcResp = await apiFetch('/api/price/history/btc');
        const btcData = await btcResp.json();
        if (btcData.data && Array.isArray(btcData.data)) {
          setBtcHistory(btcData.data);
          setBtcChange24h(btcData.change_pct || 0);
        }
      } catch (e) {}

      try {
        const goldResp = await apiFetch('/api/price/history/gold');
        const goldData = await goldResp.json();
        if (goldData.data && Array.isArray(goldData.data)) {
          setGoldHistory(goldData.data);
          const first = goldData.data[0] || 0;
          const last = goldData.data[goldData.data.length - 1] || 0;
          setGoldChange24h(first > 0 ? ((last - first) / first) * 100 : 0);
        }
      } catch (e) {}
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const openModal = (modal: string, vault?: VaultCard) => {
    setActiveModal(modal);
    notify('');
    setModalLoading(false);
    if (vault) setSelectedVault(vault);
  };

  const closeModal = () => {
    setActiveModal(null);
    notify('');
    setSelectedVault(null);
    setSendTo(''); setSendAmount(''); setConvertAmount('');
    setFreezeAmount(''); setWithdrawAmount(''); setDepositAmount('');
  };

  const handleSend = async () => {
    if (!sendTo || !sendAmount) { notify('Remplis tous les champs'); return; }
    const amountPoints = parseFloat(sendAmount) * 100;
    if (amountPoints <= 0) { notify('Montant invalide', 'error'); return; }
    setModalLoading(true); notify('');
    try {
      const resp = await apiFetch('/api/borb/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('uq_token')}` },
        body: JSON.stringify({ sender: accountId, recipient: sendTo, amount_points: Math.floor(amountPoints), fee_points: Math.floor(amountPoints * 0.001) })
      });
      const data = await resp.json();
      if (data.status === 'success') { notifySuccess('Envoyé ! Tx: ' + (data.tx_hash?.slice(0, 12) || '') + '...'); setTimeout(() => { closeModal(); loadAll(); }, 2000); }
      else notifyError( (data.message || 'Erreur'));
    } catch (err: any) { notifyError( err.message); }
    finally { setModalLoading(false); }
  };

  const handleConvert = async () => {
    if (!convertAmount) { notify('Remplis le montant'); return; }
    setModalLoading(true); notify('');
    try {
      const resp = await apiFetch('/api/borb/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: accountId, from: convertFrom, to: convertTo, amount: parseFloat(convertAmount) })
      });
      const data = await resp.json();
      if (data.status === 'success') { notifySuccess(`${convertAmount} ${convertFrom} = ${data.conversion?.result || '?'} ${convertTo}`); setTimeout(() => { closeModal(); loadAll(); }, 2500); }
      else notifyError( (data.message || 'Erreur'));
    } catch (err: any) { notifyError( err.message); }
    finally { setModalLoading(false); }
  };

  const handleUbi = async () => {
    setModalLoading(true); notify('');
    try {
      const resp = await apiFetch('/api/ubi/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('uq_token')}` },
        body: JSON.stringify({ account: accountId })
      });
      const data = await resp.json();
      if (data.status === 'success') { notifySuccess(`UBI réclamé : +${data.amount_points || 100} points`); setTimeout(() => { closeModal(); loadAll(); }, 2500); }
      else notifyError( (data.message || 'Erreur'));
    } catch (err: any) { notifyError( err.message); }
    finally { setModalLoading(false); }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !selectedVault) { notify('Remplis le montant'); return; }
    setModalLoading(true); notify('');
    try {
      const resp = await apiFetch('/api/connect/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('uq_token')}` },
        body: JSON.stringify({ account: accountId, amount: parseFloat(depositAmount), currency: selectedVault.symbol })
      });
      const data = await resp.json();
      if (data.status === 'success') { notifySuccess(`Dépôt demandé : ${depositAmount} ${selectedVault.symbol}`); setTimeout(() => { closeModal(); loadAll(); }, 2500); }
      else notifyError( (data.message || 'Erreur'));
    } catch (err: any) { notifyError( err.message); }
    finally { setModalLoading(false); }
  };

  const copyAddress = () => { navigator.clipboard.writeText(accountId || ''); notifySuccess('Adresse copiée'); };

  // Calculs
  const computeValues = (borb: number) => {
    if (!prices) return { usd: 0, btc: 0 };
    return { usd: borb * (prices.borb_usd || 0), btc: borb * (prices.borb_btc || 0) };
  };

  const formatNumber = (n: number) => (n || 0).toLocaleString('fr-FR');
  const formatBTC = (n: number) => (n || 0).toFixed(8);
  const formatUSD = (n: number) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatCDF = (n: number) => (n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  // Get today's date in English format
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  // ===== LOADING =====
  if (loading) return (
    <div className="min-h-screen bg-uq-bg text-uq-text flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-uq-blue-light border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-uq-text-secondary text-xs">Chargement du dashboard...</p>
      </div>
    </div>
  );

  if (!accountId) return (
    <div className="min-h-screen bg-uq-bg text-uq-text flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Non connecté</h2>
        <p className="text-uq-text-secondary text-sm">Connectez-vous pour accéder à votre coffre</p>
      </div>
    </div>
  );

  if (error || !myBalance) return (
    <div className="min-h-screen bg-uq-bg text-uq-text flex items-center justify-center p-4">
      <div className="bg-uq-card border border-uq-error/30 rounded-lg p-4 max-w-sm w-full text-center">
        <p className="text-uq-error text-sm mb-3">{error || 'Erreur'}</p>
        <button onClick={loadAll} className="text-uq-blue-light text-xs underline">Réessayer</button>
      </div>
    </div>
  );

  const myValues = computeValues(myBalance.borb_total || 0);
  const cdfValue = myValues.usd * cdfRate;
  /** Aucune valeur monétaire sans observation du prix BORB par l'API. */
  const sansTauxUsd = !prices?.borb_usd;

  // Build vault cards from units
  const vaultCards: VaultCard[] = (myBalance.units || []).map((unit, idx) => {
    // `|| 1` convertissait une unité sans taux publié comme si 1 unité = 1 BORB.
    // Sans taux, la carte n'a pas de valeur en dollars : 0, affiché « — ».
    const tauxUnitaire = Number(unit.rate) > 0 ? Number(unit.rate) : 0;
    const usd = tauxUnitaire ? (prices?.borb_usd || 0) * unit.value / tauxUnitaire : 0;
    
    // ===== VRAIES DONNÉES selon l'unité =====
    const isBORB = unit.unit.toUpperCase() === 'BORB';
    const history = isBORB ? goldHistory : btcHistory;
    const change24h = isBORB ? goldChange24h : btcChange24h;
    
    // Mini-chart avec les vraies données (les 12 derniers points)
    let miniChart: number[] = [];
    if (history.length > 0) {
      const last12 = history.slice(-12);
      const max = Math.max(...last12);
      const min = Math.min(...last12);
      const range = max - min || 1;
      miniChart = last12.map(v => ((v - min) / range) * 100);
    } else {
      // Fallback : ligne plate
      miniChart = Array(12).fill(50);
    }
    
    return {
      id: unit.unit,
      symbol: unit.unit.toUpperCase(),
      name: unit.name,
      logo: '/assets/borb.png',
      amount: unit.value,
      unit: unit.unit,
      valueUsd: usd,
      valueLocal: usd * cdfRate,
      change24h,
      miniChart,
    };
  });

  return (
    <div className="min-h-screen bg-uq-bg text-uq-text">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER GLOBAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="border-b border-uq-border bg-uq-card/50 backdrop-blur">
        <div className="px-6 py-3 flex items-center justify-between">

          {/* Left — Info */}
          <div className="flex items-center gap-4 text-xs">
            <span className="bg-uq-success/15 text-uq-success px-2 py-1 rounded font-medium">
              2FA ENABLED
            </span>
            <span className="text-uq-text-secondary">{dateStr}</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-uq-gradient flex items-center justify-center text-white text-xs font-bold">
                {userName.charAt(0)}
              </div>
              <span className="text-uq-text">User: <span className="font-medium">{userName}</span></span>
            </div>
          </div>

          {/* Center — Logo */}
          <div className="flex items-center gap-3">
            <LogoUQ variant="header" />
            <span className="text-lg font-bold bg-uq-gradient bg-clip-text text-transparent">UQ</span>
          </div>

          {/* Right — Navigation */}
          <nav className="flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'assets', label: 'Assets' },
              { id: 'security', label: 'Security' },
              { id: 'trade', label: 'Trade' },
              { id: 'help', label: 'Help' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-uq-gold/20 text-uq-gold border border-uq-gold/40'
                    : 'text-uq-text-secondary hover:text-uq-text hover:bg-uq-card-light'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MAIN */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <main className="px-6 py-8 max-w-7xl mx-auto">

        {/* WELCOME */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-uq-text mb-2">
            WELCOME, {userName.toUpperCase()}
          </h1>
          <p className="text-xs text-uq-text-secondary tracking-widest uppercase">
            SECURE YOUR DIGITAL FUTURE WITH BORB
          </p>
        </div>

        {/* TOTAL PORTFOLIO VALUE */}
        <div className="text-center mb-10">
          <p className="text-xs text-uq-text-secondary tracking-widest uppercase mb-2">
            Total Portfolio Value
          </p>
          <p className="text-5xl font-bold text-uq-gold mb-2">
            {sansTauxUsd ? '—' : `${formatUSD(myValues.usd)} USD`}
          </p>
          <p className="text-sm text-uq-gold/70 mb-1">
            ≈ {!sansTauxUsd && cdfRate > 0 ? `${formatCDF(cdfValue)} CDF` : 'CDF indisponible (oracle hors-ligne)'}
          </p>
          <p className={`text-xs font-medium ${goldChange24h >= 0 ? 'text-uq-success' : 'text-uq-error'}`}>
            {goldHistory.length > 0
              ? `(${goldChange24h >= 0 ? '+' : ''}${goldChange24h.toFixed(2)}% today)`
              : 'variation 24 h indisponible'}
          </p>
        </div>

        {/* ═══ MY VAULTS ═══ */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-uq-text tracking-wider uppercase">
              My Vaults
            </h2>
            <span className="text-xs text-uq-text-secondary">
              {vaultCards.length} unités
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultCards.map((vault) => (
              <div
                key={vault.id}
                className="bg-uq-card border border-uq-border rounded-xl p-4 hover:border-uq-gold/40 transition-all hover:shadow-lg hover:shadow-uq-gold/5"
              >
                {/* Header de la carte */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-uq-bg border border-uq-border flex items-center justify-center overflow-hidden">
                      <img src={vault.logo} alt={vault.name} className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-uq-text">{vault.symbol}</p>
                      <p className="text-xs text-uq-text-muted">{vault.name}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${vault.change24h >= 0 ? 'text-uq-success' : 'text-uq-error'}`}>
                    {vault.change24h >= 0 ? '+' : ''}{vault.change24h.toFixed(2)}%
                  </div>
                </div>

                {/* Mini chart */}
                <div className="h-12 mb-3 flex items-end gap-0.5">
                  {vault.miniChart.map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t ${vault.change24h >= 0 ? 'bg-uq-success/40' : 'bg-uq-error/40'}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                {/* Valeurs */}
                <div className="mb-3">
                  <p className="text-lg font-bold text-uq-text">
                    {formatNumber(vault.amount)} <span className="text-sm">{vault.unit}</span>
                  </p>
                  <p className="text-sm text-uq-gold">
                    {sansTauxUsd ? '—' : `$${formatUSD(vault.valueUsd)}`}
                  </p>
                  <p className="text-xs text-uq-text-muted">
                    ≈ {!sansTauxUsd && cdfRate > 0 ? `${formatCDF(vault.valueLocal)} CDF` : 'CDF indisponible'}
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal('vault-details', vault)}
                    className="flex-1 bg-uq-bg border border-uq-border hover:border-uq-blue-light/50 text-uq-text text-xs py-2 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => openModal('deposit', vault)}
                    className="flex-1 bg-uq-gradient text-white text-xs py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                  >
                    Deposit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ ACTIONS RAPIDES ═══ */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-uq-text tracking-wider uppercase mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { id: 'send', icon: 'upload', label: 'Envoyer' },
              { id: 'receive', icon: 'inbox', label: 'Recevoir' },
              { id: 'convert', icon: 'convert', label: 'Convertir' },
              { id: 'ubi', icon: 'gift', label: 'UBI' },
              { id: 'freeze', icon: 'snowflake', label: 'Geler' },
              { id: 'withdraw', icon: 'banknote', label: 'Retirer' },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => openModal(action.id)}
                className="bg-uq-card border border-uq-border hover:border-uq-gold/40 rounded-lg py-3 flex flex-col items-center gap-1 transition-all hover:scale-105"
              >
                <Icon name={action.icon as IconName} size={20} />
                <span className="text-xs text-uq-text-secondary">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ TRANSACTIONS RÉCENTES ═══ */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-uq-text tracking-wider uppercase mb-4">
            Recent Transactions
          </h2>
          <div className="bg-uq-card border border-uq-border rounded-xl overflow-hidden">
            {transactions.length === 0 ? (
              <p className="text-uq-text-secondary text-xs text-center py-8">Aucune transaction</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-uq-bg/50 border-b border-uq-border">
                  <tr className="text-xs text-uq-text-secondary uppercase tracking-wider">
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Counterparty</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-right px-4 py-2 font-medium">Amount</th>
                    <th className="text-right px-4 py-2 font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-uq-border">
                  {transactions.slice(0, 10).map((tx, idx) => (
                    <tr key={idx} className="hover:bg-uq-card-light/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 ${tx.type === 'send' ? 'text-uq-error' : 'text-uq-success'}`}>
                          <span>{tx.type === 'send' ? '↗' : '↙'}</span>
                          <span className="text-xs">{tx.type === 'send' ? 'Envoi' : 'Réception'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-uq-text font-mono">
                        {tx.counterparty || '?'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-uq-text-secondary">
                        {new Date(tx.timestamp * 1000).toLocaleDateString('fr-FR')}
                      </td>
                      <td className={`px-4 py-2.5 text-right text-xs font-mono ${tx.type === 'send' ? 'text-uq-error' : 'text-uq-success'}`}>
                        {tx.type === 'send' ? '-' : '+'}{formatNumber(tx.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-uq-text-secondary">
                        {tx.fee}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ═══ PRIX DU MARCHÉ ═══ */}
        {prices && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-uq-text tracking-wider uppercase mb-4">
              Market Prices
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-uq-card border border-uq-border rounded-lg p-3">
                <p className="text-xs text-uq-text-secondary mb-1">Or (XAU)</p>
                <p className="text-lg font-bold text-uq-gold">${formatUSD(prices.gold_usd_per_ounce)}</p>
                <p className="text-xs text-uq-text-muted">USD / once</p>
              </div>
              <div className="bg-uq-card border border-uq-border rounded-lg p-3">
                <p className="text-xs text-uq-text-secondary mb-1">Bitcoin (BTC)</p>
                <p className="text-lg font-bold text-uq-warning">${formatUSD(prices.btc_usd)}</p>
                <p className="text-xs text-uq-text-muted">USD / BTC</p>
              </div>
              <div className="bg-uq-card border border-uq-border rounded-lg p-3">
                <p className="text-xs text-uq-text-secondary mb-1">1 BORB</p>
                <p className="text-lg font-bold text-uq-blue-light">${formatUSD(prices.borb_usd)}</p>
                <p className="text-xs text-uq-text-muted">USD / BORB</p>
              </div>
              <div className="bg-uq-card border border-uq-border rounded-lg p-3">
                <p className="text-xs text-uq-text-secondary mb-1">1 BORB en BTC</p>
                <p className="text-sm font-bold text-uq-warning">{formatBTC(prices.borb_btc)}</p>
                <p className="text-xs text-uq-text-muted">BTC / BORB</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRÉSOR (6 CASES) ═══ */}
        {cases.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-uq-text tracking-wider uppercase mb-4">
              Treasury Breakdown
            </h2>
            <div className="bg-uq-card border border-uq-gold/20 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-uq-bg/50 border-b border-uq-border">
                  <tr className="text-xs text-uq-text-secondary uppercase tracking-wider">
                    <th className="text-left px-4 py-2 font-medium">Case</th>
                    <th className="text-right px-4 py-2 font-medium">Balance</th>
                    <th className="text-right px-4 py-2 font-medium">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-uq-border">
                  {cases.map((c: any, idx: number) => {
                    const icons: IconName[] = ['wallet', 'banknote', 'gift', 'snowflake', 'scale', 'shield'];
                    const labels = ['Trésor', 'Frais', 'Récompenses', 'Épargne', 'Crédit', 'Bouclier'];
                    return (
                      <tr key={idx} className="hover:bg-uq-card-light/30">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <Icon name={icons[idx]} size={16} />
                            <span className="text-xs text-uq-text">{labels[idx] || c.name}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-mono text-uq-text">
                          {formatNumber(c.balance)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-uq-text-secondary">
                          {c.pct || 0}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-uq-border bg-uq-card/30">
        <div className="px-6 py-4 max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-uq-text-secondary">
            <a href="#" className="hover:text-uq-text transition-colors">Security Guarantee</a>
            <a href="#" className="hover:text-uq-text transition-colors">Legal</a>
            <a href="#" className="hover:text-uq-text transition-colors">About BORB</a>
          </div>
          <div className="text-uq-text-muted">
            © 2026 UQ Platform
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-uq-card border border-uq-border rounded-xl p-5 w-full max-w-sm animate-scaleIn">

            {activeModal === 'send' && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="upload" size={18} tone="info" /> Envoyer BORB</h3>
                <input type="text" placeholder="Destinataire (UQ-XXXXXXXX)" value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-2" />
                <input type="number" placeholder="Montant en BORB" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-3" />
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Annuler</button>
                  <button onClick={handleSend} disabled={modalLoading} className="flex-1 bg-uq-gradient text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{modalLoading ? '...' : 'Envoyer'}</button>
                </div>
              </>
            )}

            {activeModal === 'receive' && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="inbox" size={18} tone="success" /> Recevoir BORB</h3>
                <p className="text-xs text-uq-text-secondary mb-2">Votre adresse :</p>
                <div className="bg-uq-bg border border-uq-border rounded-lg p-3 mb-3 break-all text-xs font-mono text-uq-text">{accountId}</div>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Fermer</button>
                  <button onClick={copyAddress} className="flex-1 bg-uq-gradient text-white py-2 rounded-lg text-sm font-medium">Copier</button>
                </div>
              </>
            )}

            {activeModal === 'convert' && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="convert" size={18} tone="info" /> Convertir</h3>
                <div className="flex gap-2 mb-2">
                  <select value={convertFrom} onChange={(e) => setConvertFrom(e.target.value)} className="flex-1 bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text">
                    {['BORB', 'borb', 'mborb', 'nborb', 'pborb', 'fborb'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <span className="text-uq-text-secondary self-center"><Icon name="arrowRight" size={20} /></span>
                  <select value={convertTo} onChange={(e) => setConvertTo(e.target.value)} className="flex-1 bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text">
                    {['BORB', 'borb', 'mborb', 'nborb', 'pborb', 'fborb'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <input type="number" placeholder="Montant" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-3" />
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Annuler</button>
                  <button onClick={handleConvert} disabled={modalLoading} className="flex-1 bg-uq-gradient text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{modalLoading ? '...' : 'Convertir'}</button>
                </div>
              </>
            )}

            {activeModal === 'ubi' && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="gift" size={18} tone="brand" /> Réclamer UBI</h3>
                <p className="text-xs text-uq-text-secondary mb-4">Réclame ton revenu universel quotidien.</p>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Annuler</button>
                  <button onClick={handleUbi} disabled={modalLoading} className="flex-1 bg-uq-gradient text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{modalLoading ? '...' : 'Réclamer'}</button>
                </div>
              </>
            )}

            {activeModal === 'freeze' && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="snowflake" size={18} tone="info" /> Geler BORB (2%/an)</h3>
                <input type="number" placeholder="Montant en BORB" value={freezeAmount} onChange={(e) => setFreezeAmount(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-2" />
                <select value={freezeMonths} onChange={(e) => setFreezeMonths(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-3">
                  <option value="3">3 mois</option>
                  <option value="6">6 mois</option>
                  <option value="12">12 mois</option>
                  <option value="24">24 mois</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Annuler</button>
                  <button onClick={async () => {
                    if (!freezeAmount) { notify('Remplis le montant'); return; }
                    setModalLoading(true);
                    try {
                      const resp = await apiFetch('/api/freeze/contract', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('uq_token')}` }, body: JSON.stringify({ account: accountId, amount_points: parseFloat(freezeAmount) * 100, months: parseInt(freezeMonths) }) });
                      const data = await resp.json();
                      if (data.status === 'success') { notifySuccess(`${freezeAmount} BORB gelés`); setTimeout(() => { closeModal(); loadAll(); }, 2500); }
                      else notifyError( (data.message || 'Erreur'));
                    } catch (err: any) { notifyError( err.message); }
                    finally { setModalLoading(false); }
                  }} disabled={modalLoading} className="flex-1 bg-uq-gradient text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{modalLoading ? '...' : 'Geler'}</button>
                </div>
              </>
            )}

            {activeModal === 'withdraw' && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="banknote" size={18} tone="success" /> Retirer BORB</h3>
                <input type="number" placeholder="Montant en BORB" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-2" />
                <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-3">
                  <option value="mobile_money">Mobile Money</option>
                  <option value="crypto">Crypto (USDT)</option>
                  <option value="bank">Virement bancaire</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Annuler</button>
                  <button onClick={async () => {
                    if (!withdrawAmount) { notify('Remplis le montant'); return; }
                    setModalLoading(true);
                    try {
                      const resp = await apiFetch('/api/connect/sell', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('uq_token')}` }, body: JSON.stringify({ account: accountId, amount_borb: parseFloat(withdrawAmount), method: withdrawMethod }) });
                      const data = await resp.json();
                      if (data.status === 'success') { notifySuccess(`Retrait demandé`); setTimeout(() => { closeModal(); loadAll(); }, 2500); }
                      else notifyError( (data.message || 'Erreur'));
                    } catch (err: any) { notifyError( err.message); }
                    finally { setModalLoading(false); }
                  }} disabled={modalLoading} className="flex-1 bg-uq-gradient text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{modalLoading ? '...' : 'Retirer'}</button>
                </div>
              </>
            )}

            {activeModal === 'deposit' && selectedVault && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="wallet" size={18} tone="brand" /> Déposer {selectedVault.symbol}</h3>
                <p className="text-xs text-uq-text-secondary mb-3">Montant à déposer en {selectedVault.symbol} :</p>
                <input type="number" placeholder={`Montant en ${selectedVault.symbol}`} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-uq-bg border border-uq-border rounded-lg px-3 py-2 text-sm text-uq-text mb-3" />
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Annuler</button>
                  <button onClick={handleDeposit} disabled={modalLoading} className="flex-1 bg-uq-gradient text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{modalLoading ? '...' : 'Déposer'}</button>
                </div>
              </>
            )}

            {activeModal === 'vault-details' && selectedVault && (
              <>
                <h3 className="text-base font-semibold mb-4"><Icon name="chart" size={18} tone="info" /> {selectedVault.symbol} — Détails</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-uq-text-secondary">Nom</span>
                    <span className="text-uq-text">{selectedVault.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-uq-text-secondary">Solde</span>
                    <span className="text-uq-text font-mono">{formatNumber(selectedVault.amount)} {selectedVault.unit}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-uq-text-secondary">Valeur USD</span>
                    <span className="text-uq-gold font-mono">{sansTauxUsd ? '—' : `$${formatUSD(selectedVault.valueUsd)}`}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-uq-text-secondary">Valeur CDF</span>
                    <span className="text-uq-text font-mono">{!sansTauxUsd && cdfRate > 0 ? `${formatCDF(selectedVault.valueLocal)} CDF` : 'CDF indisponible'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-uq-text-secondary">Variation 24h</span>
                    <span className={`font-mono ${selectedVault.change24h >= 0 ? 'text-uq-success' : 'text-uq-error'}`}>
                      {selectedVault.change24h >= 0 ? '+' : ''}{selectedVault.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <button onClick={closeModal} className="w-full bg-uq-bg border border-uq-border py-2 rounded-lg text-sm">Fermer</button>
              </>
            )}

            {modalMessage && (
              <p
                className={
                  'text-xs text-center mt-3 ' +
                  (modalTone === 'success' ? 'text-uq-green' : modalTone === 'error' ? 'text-uq-red' : 'text-uq-blue-light')
                }
              >
                {modalMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
