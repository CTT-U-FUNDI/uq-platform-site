import { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiUrl } from '../../api/client';
import { Icon } from '../components/Icon';
import { PinSheet } from '../components/PinSheet';
import { BalanceSeriesChart } from '../components/BalanceSeriesChart';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBlock,
  Field,
  Hint,
  IconButton,
  Input,
  KeyValue,
  List,
  Row,
  ScreenHeader,
  Segmented,
  Sheet,
  Skeleton,
  Textarea,
} from '../components/Ui';
import { RateProvenance } from '../components/RateProvenance';
import { storeDisplayCurrency, tauxProvenanceLabel, useConvertisseurDevise } from '../lib/currency';
import { useAnimatedNumber, useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { useHelp } from '../lib/help';
import { useWalletSnapshot } from '../lib/useWallet';
import {
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  canReclaim,
  claimDistributionWithPin,
  claimUbi,
  convertWallets,
  describeError,
  errorCode,
  fetchInvoicePdf,
  getCasesStats,
  getInvoicesByUser,
  getPinStatus,
  getReceiptUrl,
  getUbiInfo,
  lookupPublicPseudo,
  pinIsConfigured,
  sendBorb,
  setCurrencyPreferences,
  verifyHistory,
  verifyPin,
  withdrawWallet,
  type ClaimResult,
  type PublicPseudoResponse,
  type Transaction,
} from '../lib/api';
import { identityLabel, useIdentities } from '../lib/identity';
import {
  formatCurrency,
  formatDateTime,
  formatInt,
  formatNumber,
  isIncomingTx,
  relativeDay,
  txLabel,
} from '../lib/format';

export type WalletIntent = 'send' | 'receive' | 'convert' | 'ubi';

type SheetName = WalletIntent | 'security' | 'tx' | 'currency' | 'withdraw' | 'deposit' | null;
type ActivityFilter = 'all' | 'in' | 'out';

/** Serialise start/stop du scanner : une seule utilisation camera a la fois. */
let scannerChain: Promise<void> = Promise.resolve();

export function WalletScreen({
  intent,
  onIntentHandled,
  onOpenSecurity,
  onOpenOwner,
  onGoTrading,
  onBack,
}: {
  intent?: WalletIntent | null;
  onIntentHandled?: () => void;
  onOpenSecurity?: () => void;
  onOpenOwner?: () => void;
  /** Ouvre l'onglet Trading (dépôt P2P mobile money). */
  onGoTrading?: () => void;
  onBack?: () => void;
}) {
  const { uq, pseudo, toast, isOwner } = useSession();
  const help = useHelp();
  const wallet = useWalletSnapshot(uq);
  const pin = useAsync(() => getPinStatus(uq), [uq], { enabled: Boolean(uq) });
  const invoices = useAsync(() => getInvoicesByUser(uq), [uq], { enabled: Boolean(uq) });
  const ubi = useAsync(() => getUbiInfo(), []);
  const cases = useAsync(() => getCasesStats(), []);
  // /api/kyc/can-reclaim se base sur le JWT : c'est le backend qui decide.
  const reclaim = useAsync(() => canReclaim(), [], { enabled: Boolean(uq) });

  const [tab, setTab] = useState<'balances' | 'activity'>('balances');
  const [sheet, setSheet] = useState<SheetName>(null);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [viewCurrency, setViewCurrency] = useState(wallet.data.displayCurrency || 'CDF');
  const [switchingCurrency, setSwitchingCurrency] = useState(false);

  // Reserve BORB : montant masque jusqu'a verification du code PIN.
  const [reserveVisible, setReserveVisible] = useState(false);
  const [reservePinOpen, setReservePinOpen] = useState(false);

  // Envoi
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientProfile, setRecipientProfile] = useState<PublicPseudoResponse | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendCurrency, setSendCurrency] = useState('');
  const [memo, setMemo] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendPinOpen, setSendPinOpen] = useState(false);

  // Scan QR du destinataire (html5-qrcode, capture locale)
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanStatus, setScanStatus] = useState<'init' | 'scan' | 'verif'>('init');
  const scanBusyRef = useRef(false);

  // Facture PDF de l'operation ouverte (chargement authentifie)
  const [invoiceBusy, setInvoiceBusy] = useState(false);

  // Conversion
  const [convertDirection, setConvertDirection] = useState<'out' | 'in'>('out');
  const [convertCurrency, setConvertCurrency] = useState(wallet.data.displayCurrency || 'CDF');
  const [convertAmount, setConvertAmount] = useState('');
  const [convertError, setConvertError] = useState('');
  const [pinOpen, setPinOpen] = useState(false);

  // Retrait direct : devise détenue (jamais la réserve BORB), destination
  // externe (mobile money, banque…), PIN exigé par le backend.
  const [withdrawCurrency, setWithdrawCurrency] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawPinOpen, setWithdrawPinOpen] = useState(false);

  const [busy, setBusy] = useState(false);

  // Reclamation 30 % (Profil 2) : PIN proprietaire, jamais stocke.
  const [claimSheet, setClaimSheet] = useState(false);
  const [claimPin, setClaimPin] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimReceiver, setClaimReceiver] = useState('');
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    if (!intent) return;
    setTab(intent === 'ubi' ? 'balances' : tab);
    setSheet(intent);
    onIntentHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  useEffect(() => {
    setConvertCurrency(wallet.data.displayCurrency || 'CDF');
    setViewCurrency(wallet.data.displayCurrency || 'CDF');
    // La devise du compte sert aussi aux ecrans qui n'ont pas le portefeuille.
    if (wallet.data.displayCurrency) storeDisplayCurrency(wallet.data.displayCurrency);
  }, [wallet.data.displayCurrency]);

  /**
   * Devises reellement detenues : `multi_wallets`, alimente par la conversion.
   * Sans conversion la liste est vide et le coffre n'affiche aucun solde.
   */
  const converted = wallet.data.currencies;
  const hasConverted = converted.length > 0;

  /**
   * Devises utilisables pour un envoi : les devises fiat declarees par
   * l'oracle (sa liste `devises` moins les crypto et le BORB). Le BORB et le
   * BORB ne sont pas transferables en direct (regle backend), et une devise
   * se detient apres conversion.
   */
  const sendCurrencies = useMemo(() => {
    // On n'envoie qu'une devise deja detenue : la conversion cree le solde.
    const held = converted.map((entry) => entry.code);
    if (held.length > 0) return held;
    const list = wallet.data.fiatCurrencies.length > 0
      ? wallet.data.fiatCurrencies
      : Object.keys(wallet.data.rates || {});
    return list
      .filter((code) => !['BORB', 'BORB'].includes(String(code).toUpperCase()))
      .sort();
  }, [converted, wallet.data.fiatCurrencies, wallet.data.rates]);

  useEffect(() => {
    if (sendCurrencies.length === 0) return;
    if (sendCurrency && sendCurrencies.includes(sendCurrency)) return;
    const preferred = sendCurrencies.includes(wallet.data.receiveCurrency)
      ? wallet.data.receiveCurrency
      : sendCurrencies[0];
    setSendCurrency(preferred);
  }, [sendCurrency, sendCurrencies, wallet.data.receiveCurrency]);

  /** Solde reellement detenu dans la devise selectionnee pour l'envoi. */
  const sendAvailable = Number(
    converted.find((entry) => entry.code === sendCurrency)?.balance || 0,
  );

  const currencies = useMemo(() => {
    // Le selecteur de devise d'affichage reste la liste fiat de l'oracle.
    const list = wallet.data.fiatCurrencies.length > 0
      ? wallet.data.fiatCurrencies
      : Object.keys(wallet.data.rates || {});
    return (list.length > 0 ? list : [viewCurrency]).sort();
  }, [wallet.data.fiatCurrencies, wallet.data.rates, viewCurrency]);

  // 0 = devise non observée par l'oracle. Pas de « || 1 » : convertir au taux
  // implicite 1 pour 1 afficherait un solde USD sous un libellé CDF.
  const convertisseur = useConvertisseurDevise({
    rates: wallet.data.rates,
    usdRate: wallet.data.usdRate,
    devise: viewCurrency,
  });
  const { sansTaux, versDevise: toView, versDevisePoints: toViewPoints, depuisDevise: toDisplay } =
    convertisseur;

  const viewAmount = convertisseur.totalEnDevise(converted);

  /** Le montant du héros glisse vers sa nouvelle valeur au lieu de sauter. */
  const viewAmountAnimated = useAnimatedNumber(viewAmount);

  const systemCases = useMemo(() => {
    const raw = (cases.data?.cases || []) as unknown as [string, number][];
    const list = raw.map((entry) => ({ name: String(entry[0]), balance: Number(entry[1]) || 0 }));
    const total = list.reduce((sum, entry) => sum + entry.balance, 0);
    return list.map((entry) => ({ ...entry, share: total > 0 ? (entry.balance / total) * 100 : 0 }));
  }, [cases.data]);

  /**
   * Le backend ne renvoie can_reclaim qu'au Profil 2 (cadenas + lien owner + solde bas).
   * Le bloc n'apparait que si la reclamation est possible, ou si la seule raison
   * du refus est le seuil de solde (on informe alors au lieu d'afficher un bouton mort).
   */
  const reclaimReason = String(reclaim.data?.raison || '');
  const reclaimBlockedByThreshold = !reclaim.data?.can_reclaim && /seuil/i.test(reclaimReason);
  const showClaim = Boolean(reclaim.data) &&
    (Boolean(reclaim.data?.can_reclaim) || reclaimBlockedByThreshold);

  const openClaim = () => {
    setClaimPin('');
    setClaimError('');
    setClaimReceiver(reclaim.data?.uq_profil2 || uq);
    setClaimSheet(true);
  };

  const submitClaim = async () => {
    const code = claimPin.trim();
    if (code.length < PIN_MIN_LENGTH) {
      setClaimError(`Le code PIN contient au moins ${PIN_MIN_LENGTH} chiffres.`);
      return;
    }
    setClaimBusy(true);
    setClaimError('');
    try {
      const result = await claimDistributionWithPin({
        code_pin: code,
        uq_profil2: claimReceiver || uq,
      });
      if (result?.status === 'error') {
        setClaimError(result.message || 'Réclamation refusée.');
        return;
      }
      setClaimSheet(false);
      setClaimPin('');
      setClaimResult(result);
      wallet.reload();
      reclaim.reload();
      toast('Réclamation effectuée', 'success');
    } catch (error) {
      setClaimError(describeError(error, 'Réclamation impossible.'));
    } finally {
      setClaimBusy(false);
    }
  };

  const chooseCurrency = async (code: string) => {
    setSwitchingCurrency(true);
    try {
      await setCurrencyPreferences({ uq_number: uq, display_currency: code });
      storeDisplayCurrency(code);
      setViewCurrency(code);
      setSheet(null);
      wallet.reload();
    } catch (error) {
      toast(describeError(error, 'Devise non modifiee.'), 'error');
    } finally {
      setSwitchingCurrency(false);
    }
  };

  const transactions = useMemo(() => {
    const list = wallet.data.transactions;
    if (filter === 'all') return list;
    return list.filter((tx) => (filter === 'in' ? isIncomingTx(tx.type) : !isIncomingTx(tx.type)));
  }, [wallet.data.transactions, filter]);

  const unitRate = useMemo(() => {
    const perBorb = wallet.data.usdRate * (Number(wallet.data.rates[convertCurrency]) || 0);
    if (!perBorb) return 0;
    return convertDirection === 'out' ? perBorb : 1 / perBorb;
  }, [wallet.data.usdRate, wallet.data.rates, convertCurrency, convertDirection]);

  const convertEstimate = useMemo(() => {
    const amount = Number(convertAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || !unitRate) return null;
    return amount * unitRate;
  }, [convertAmount, unitRate]);

  /**
   * Identites publiques des contreparties : l'activite ne renvoie que des UQ,
   * on affiche le pseudo. `wallet_transfers` renvoie deja un libelle public.
   */
  const counterparties = useMemo(
    () =>
      wallet.data.transactions
        .map((tx) => tx.counterparty || '')
        .filter((value) => /^UQ-\d+$/i.test(value)),
    [wallet.data.transactions],
  );
  const identities = useIdentities(counterparties);

  const counterpartyLabel = (value: string | undefined | null): string => {
    const raw = String(value || '');
    if (!raw) return '—';
    if (!/^UQ-\d+$/i.test(raw)) return raw;
    return identityLabel(raw, identities[raw.toUpperCase()]);
  };

  const pinConfigured = pinIsConfigured(pin.data);
  // Longueur lue par /api/account/pin/status : jamais 4 ou 6 en dur.
  const pinLength = Math.min(
    Math.max(Number(pin.data?.pin_length) || PIN_MIN_LENGTH, PIN_MIN_LENGTH),
    PIN_MAX_LENGTH,
  );

  const closeSheet = () => {
    setSheet(null);
    setSendError('');
    setConvertError('');
    setRecipient('');
    setRecipientName('');
    setRecipientProfile(null);
    setSendAmount('');
    setMemo('');
    setConvertAmount('');
  };

  const reloadAll = () => {
    wallet.reload();
    pin.reload();
    invoices.reload();
  };

  /**
   * Le backend resout le destinataire par pseudo (`destin` ou `uq@destin`) ou
   * par numero UQ. Un `@destin` tape par l'utilisateur est normalise en
   * `destin` : `resoudre_destinataire` prefixe lui-meme `uq@`.
   */
  const normalizeRecipient = (value: string): string => value.trim().replace(/^@/, '');

  /**
   * Scan du QR de reception ({ pseudo, name }) puis verification du compte
   * par /api/account/public/{pseudo}. La camera est coupee des que possible.
   */
  useEffect(() => {
    if (!scanOpen) return;
    let mounted = true;
    scanBusyRef.current = false;
    setScanError('');
    setScanStatus('init');
    let scanner: Html5Qrcode | null = null;

    const onDecoded = async (decoded: string) => {
      if (!mounted || scanBusyRef.current) return;
      let pseudo = '';
      let name = '';
      try {
        const payload = JSON.parse(decoded) as { pseudo?: unknown; name?: unknown };
        pseudo = String(payload?.pseudo || '').trim();
        name = String(payload?.name || '').trim();
      } catch {
        setScanError('QR non reconnu : ce n’est pas un QR UQ.');
        return;
      }
      if (!pseudo) {
        setScanError('QR invalide : pseudo absent.');
        return;
      }
      scanBusyRef.current = true;
      setScanStatus('verif');
      try {
        const found = await lookupPublicPseudo(pseudo);
        if (!found?.existe) {
          setScanError(found?.message || 'Compte introuvable.');
          setScanStatus('scan');
          scanBusyRef.current = false;
          return;
        }
        setRecipient(String(found.pseudo || pseudo).trim());
        setRecipientName(String(found.name || name).trim());
        setRecipientProfile(found);
        setScanOpen(false);
      } catch (error) {
        setScanError(describeError(error, 'Vérification impossible.'));
        setScanStatus('scan');
        scanBusyRef.current = false;
      }
    };

    // En StrictMode l'effet peut etre demonte avant la fin de `start()` :
    // la camera doit etre rendue avant toute relance.
    scannerChain = scannerChain.then(async () => {
      if (!mounted) return;
      scanner = new Html5Qrcode('v2-scan-reader');
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          onDecoded,
          () => {},
        );
        if (mounted) setScanStatus('scan');
      } catch {
        if (!mounted) return;
        setScanStatus('scan');
        setScanError('Impossible d’ouvrir la caméra. Autorise l’accès puis réessaie.');
      }
    });

    return () => {
      mounted = false;
      const current = scanner;
      scanner = null;
      if (!current) return;
      scannerChain = scannerChain.then(async () => {
        try {
          await current.stop();
        } catch {
          /* jamais demarre */
        }
        try {
          current.clear();
        } catch {
          /* deja libere */
        }
      });
    };
  }, [scanOpen]);

  /**
   * Saisie manuelle du pseudo : le profil public s'affiche pour confirmer
   * l'identite avant l'envoi. Aucun numero UQ n'est demande ni affiche.
   */
  useEffect(() => {
    if (sheet !== 'send') return;
    const cible = normalizeRecipient(recipient);
    setRecipientProfile(null);
    if (cible.length < 3 || /^UQ-/i.test(cible)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      lookupPublicPseudo(cible)
        .then((found) => {
          if (cancelled || !found?.existe) return;
          setRecipientProfile(found);
          setRecipientName(String(found.name || ''));
        })
        .catch(() => undefined);
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient, sheet]);

  /**
   * L'historique ne porte que l'id de transaction : la facture est rattachee
   * via `tx_id` renvoye par /api/invoices/by-user/{uq}. Sans facture, le
   * bouton n'est pas affiche.
   */
  const selectedInvoice = useMemo(() => {
    if (!selectedTx) return null;
    const list = invoices.data?.invoices || [];
    return (
      list.find(
        (invoice) =>
          invoice.tx_id === String(selectedTx.id) || Number(invoice.tx_id) === selectedTx.id,
      ) || null
    );
  }, [invoices.data, selectedTx]);

  /** PDF protege par JWT : recuperation authentifiee puis ouverture en blob. */
  const openInvoice = async () => {
    if (!selectedInvoice) return;
    setInvoiceBusy(true);
    try {
      const blob = await fetchInvoicePdf(selectedInvoice.invoice_id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast(describeError(error, 'Facture indisponible.'), 'error');
    } finally {
      setInvoiceBusy(false);
    }
  };

  /**
   * Envoi : validation locale, puis demande du PIN. Le BORB n'etant pas
   * transferable, le destinataire recoit une devise convertie : on envoie
   * donc `currency` (devise de l'oracle) + `amount_currency`.
   */
  const requestSend = () => {
    const amount = Number(sendAmount.replace(',', '.'));
    const target = normalizeRecipient(recipient);
    const selfPseudo = String(pseudo || '').replace(/^uq@/i, '').toLowerCase();

    if (!target) {
      setSendError('Renseigne le pseudo du destinataire.');
      return;
    }
    // Identification par pseudo : le profil doit avoir ete confirme a l'ecran.
    if (!/^UQ-\d+$/i.test(target) && !recipientProfile) {
      setSendError('Profil introuvable : vérifie le pseudo du destinataire.');
      return;
    }
    if (
      target.toUpperCase() === uq.toUpperCase() ||
      (selfPseudo && target.replace(/^uq@/i, '').toLowerCase() === selfPseudo)
    ) {
      setSendError('Tu ne peux pas t’envoyer des fonds à toi-même.');
      return;
    }
    if (!sendCurrency) {
      setSendError('Choisis la devise à envoyer.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setSendError('Saisis un montant valide.');
      return;
    }
    if (!pinConfigured) {
      setSendError('Configure d’abord un code PIN dans la sécurité du profil.');
      return;
    }
    setSendError('');
    setSendPinOpen(true);
  };

  /** Le PIN est verifie par /api/account/pin/verify avant tout envoi. */
  const confirmSend = async (code: string) => {
    const amount = Number(sendAmount.replace(',', '.'));
    const target = normalizeRecipient(recipient);
    try {
      const check = await verifyPin(uq, code);
      if (check?.valid === false) return 'Code PIN incorrect';
      if (check?.pin_configured === false) return 'Aucun code PIN configuré';

      await sendBorb({
        sender: uq,
        recipient: target,
        currency: sendCurrency,
        amount_currency: Number(amount.toFixed(2)),
        // Le montant fiat fait foi : `amount_points` n'est qu'un secours.
        amount_points: 0,
        fee_points: 0,
        memo: memo.trim() || undefined,
      });
      setSendPinOpen(false);
      toast('Transfert envoyé', 'success');
      closeSheet();
      reloadAll();
    } catch (error) {
      const codeErr = errorCode(error);
      if (codeErr === 'INSUFFICIENT_CURRENCY_BALANCE') {
        return `Solde ${sendCurrency} insuffisant : échange d’abord une part de ta réserve vers cette devise.`;
      }
      if (codeErr === 'RECIPIENT_INTROUVABLE') return 'Destinataire introuvable : vérifie le pseudo.';
      if (codeErr === 'BORB_NOT_TRANSFERABLE' || codeErr === 'UNSUPPORTED_TRANSFER_CURRENCY') {
        return 'Seules les devises converties sont transférables.';
      }
      if (codeErr === 'PIN_LOCKED') return 'Trop de tentatives, réessaie plus tard.';
      return describeError(error, 'Transfert impossible.');
    }
  };

  const submitConvert = async (code: string) => {
    const amount = Number(convertAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setPinOpen(false);
      setConvertError('Saisis un montant valide.');
      return 'Montant invalide';
    }
    try {
      // `BORB` est le nom de transport de la reserve : le backend le traite
      // comme le BORB (`from_borb`) et le debite sur `balance.points`.
      await convertWallets({
        uq_number: uq,
        from: convertDirection === 'out' ? 'BORB' : convertCurrency,
        to: convertDirection === 'out' ? convertCurrency : 'BORB',
        amount: Number(amount.toFixed(2)),
        pin: code,
      });
      setPinOpen(false);
      toast('Conversion effectuée', 'success');
      closeSheet();
      reloadAll();
    } catch (error) {
      const code_err = errorCode(error);
      if (code_err === 'PIN_NOT_CONFIGURED') {
        setPinOpen(false);
        setConvertError('Aucun code PIN configuré sur ce compte.');
        return 'Code PIN non configuré';
      }
      if (code_err === 'INVALID_PIN') return 'Code PIN incorrect';
      if (code_err === 'PIN_LOCKED') return 'Trop de tentatives, réessaie plus tard';
      return describeError(error, 'Conversion impossible.');
    }
  };

  /**
   * Retrait direct : le backend débite `multi_wallets` (montant + frais),
   * enregistre un retrait `pending` et Notifie le traitement externe.
   * La réserve BORB n'est jamais retirable — seules les devises détenues
   * (`converted`) sont proposées.
   */
  const requestWithdraw = () => {
    const amount = Number(withdrawAmount.replace(',', '.'));
    if (!withdrawCurrency) {
      setWithdrawError('Choisis la devise à retirer.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError('Saisis un montant valide.');
      return;
    }
    if (withdrawDestination.trim().length < 4) {
      setWithdrawError('Renseigne la destination (numéro mobile money ou coordonnées bancaires).');
      return;
    }
    if (!pinConfigured) {
      setWithdrawError('Configure d’abord un code PIN dans la sécurité du profil.');
      return;
    }
    setWithdrawError('');
    setWithdrawPinOpen(true);
  };

  const submitWithdraw = async (code: string): Promise<string | void> => {
    const amount = Number(withdrawAmount.replace(',', '.'));
    try {
      const check = await verifyPin(uq, code);
      if (check?.valid === false) return 'Code PIN incorrect';
      if (check?.pin_configured === false) return 'Aucun code PIN configuré';

      const res = await withdrawWallet({
        uq_number: uq,
        currency: withdrawCurrency,
        amount: Number(amount.toFixed(2)),
        destination: withdrawDestination.trim(),
        pin: code,
      });
      setWithdrawPinOpen(false);
      toast(
        `Retrait #${res.withdrawal_id} enregistré — ${formatNumber(res.net, 2)} ${res.currency} net après frais.`,
        'success',
      );
      closeSheet();
      reloadAll();
    } catch (error) {
      const codeErr = errorCode(error);
      if (codeErr === 'INSUFFICIENT_BALANCE') {
        return `Solde ${withdrawCurrency} insuffisant pour ce retrait.`;
      }
      if (codeErr === 'INVALID_PIN') return 'Code PIN incorrect';
      if (codeErr === 'PIN_LOCKED') return 'Trop de tentatives, réessaie plus tard';
      if (codeErr === 'DESTINATION_REQUIRED') return 'Destination du retrait requise.';
      return describeError(error, 'Retrait impossible.');
    }
  };

  /**
   * Le solde BORB reste masque : il ne se revele qu'apres verification du code
   * PIN sur cet appareil. L'echange redemande ensuite le PIN au backend.
   */
  const confirmReservePin = async (code: string): Promise<string | void> => {
    try {
      const check = await verifyPin(uq, code);
      if (check?.valid === false) return 'Code PIN incorrect';
      if (check?.pin_configured === false) return 'Aucun code PIN configuré';
      setReservePinOpen(false);
      setReserveVisible(true);
    } catch (error) {
      return describeError(error, 'Vérification impossible');
    }
  };

  /** Le seul chemin vers une devise : echanger une part de la reserve. */
  const openReserveConversion = () => {
    setConvertDirection('out');
    setConvertError('');
    setSheet('convert');
  };

  const runIntegrity = async () => {
    setBusy(true);
    try {
      const result = (await verifyHistory(uq)) as { valid?: boolean; status?: string; message?: string };
      const ok = result?.valid !== false && result?.status !== 'error';
      toast(
        ok ? 'Historique vérifié : aucune anomalie' : result?.message || 'Anomalie détectée dans l’historique',
        ok ? 'success' : 'error',
      );
    } catch (error) {
      toast(describeError(error, 'Vérification impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const runUbi = async () => {
    setBusy(true);
    try {
      const result = (await claimUbi(uq)) as { status?: string; message?: string; amount?: number };
      if (result?.status === 'error') {
        toast(result.message || 'Réclamation impossible', 'error');
      } else {
        toast(
          result?.amount ? `UBI reçu : ${toView(Number(result.amount))}` : 'UBI réclamé',
          'success',
        );
        wallet.reload();
      }
    } catch (error) {
      toast(describeError(error, 'Réclamation impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Partage : le destinataire n'a besoin que du pseudo. Le backend resout un
   * pseudo en compte (`resoudre_destinataire`), le numero UQ reste technique.
   */
  const copyUq = async () => {
    try {
      await navigator.clipboard.writeText(pseudo ? `@${pseudo}` : uq);
      toast('Pseudo copié', 'success');
    } catch {
      toast('Copie impossible', 'error');
    }
  };

  const receiveImage = useMemo(() => (sheet === 'receive' ? apiUrl(`/api/account/${encodeURIComponent(uq)}/qr.png?t=${Date.now()}`) : ''), [sheet, uq]);

  return (
    <>
      <ScreenHeader
        title="Coffre personnel"
        subtitle={pseudo ? `@${pseudo}` : 'Wallet virtuel'}
        onBack={onBack}
        right={
          <>
            <IconButton name="info" label="Guide du coffre" onClick={() => help.openHelp('coffre')} />
            <IconButton name="refresh" label="Actualiser" onClick={reloadAll} />
            <IconButton name="shield" label="Sécurité" onClick={() => setSheet('security')} />
          </>
        }
      />

      <div className="v2-pad">
        <div className="v2-hero">
          <div className="v2-row-between" style={{ alignItems: 'flex-start' }}>
            <span className="v2-hero-label">
              <Icon name="wallet" size={12} /> Wallet virtuel
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="v2-hero-pill"
                onClick={() => setSheet('currency')}
                aria-label="Changer la devise d’affichage"
              >
                <Icon name="globe" size={13} /> {viewCurrency}
              </button>
              <button
                className="v2-hero-pill"
                onClick={() => setHideBalance((value) => !value)}
                aria-label={hideBalance ? 'Afficher le solde' : 'Masquer le solde'}
              >
                <Icon name={hideBalance ? 'eyeOff' : 'eye'} size={14} />
              </button>
            </div>
          </div>

          {wallet.loading ? (
            <div style={{ marginTop: 12 }}>
              <div
                className="v2-skeleton"
                style={{ height: 38, width: 190, background: 'rgba(255,255,255,0.28)' }}
              />
            </div>
          ) : hasConverted ? (
            <div className="v2-hero-amount">
              {hideBalance ? (
                <span className="v2-hero-number">••••</span>
              ) : (
                <>
                  <span className="v2-hero-number">
                    {sansTaux ? '—' : formatNumber(viewAmountAnimated, 2)}
                  </span>
                  <span className="v2-hero-unit">{viewCurrency}</span>
                </>
              )}
            </div>
          ) : (
            /* Sans conversion il n'y a aucun solde : on ne l'invente pas. */
            <div className="v2-hero-amount">
              <span className="v2-hero-empty">Aucun solde converti</span>
            </div>
          )}

          {/* Symbole de l'écran, en filigrane derrière le montant. */}
          <span className="v2-hero-glyph" aria-hidden="true">
            <Icon name="wallet" size={124} />
          </span>

          <div className="v2-hero-meta">
            {hasConverted ? (
              <span className="v2-hero-pill">
                <Icon name="coin" size={13} />
                {converted.length === 1
                  ? converted[0].code
                  : `${converted.length} devises`}
              </span>
            ) : (
              <span className="v2-hero-pill">
                <Icon name="shield" size={13} /> Réserve plus bas
              </span>
            )}
          </div>
        </div>

        {/* Regle produit : sans conversion, le solde visible reste vide. */}
        {!wallet.loading && !wallet.error && !hasConverted && (
          <Card style={{ marginTop: 10 }}>
            <div className="v2-h3">Aucune devise disponible</div>
            <div style={{ marginTop: 8 }}>
              <Hint icon="swap">Échanger la réserve crée un solde</Hint>
            </div>
            {wallet.data.borbAvailable > 0 && (
              <Button block icon="swap" style={{ marginTop: 12 }} onClick={openReserveConversion}>
                Échanger ma réserve
              </Button>
            )}
          </Card>
        )}

        <div className="v2-actions" style={{ marginTop: 8 }}>
          <button className="v2-action" onClick={() => setSheet('send')}>
            <span className="v2-action-icon">
              <Icon name="send" size={20} />
            </span>
            Envoyer
          </button>
          <button className="v2-action" onClick={() => setSheet('receive')}>
            <span className="v2-action-icon v2-action-icon--green">
              <Icon name="qr" size={20} />
            </span>
            Recevoir
          </button>
          <button className="v2-action" onClick={() => setSheet('convert')}>
            <span className="v2-action-icon v2-action-icon--amber">
              <Icon name="swap" size={20} />
            </span>
            Convertir
          </button>
          <button className="v2-action" onClick={() => setSheet('ubi')}>
            <span className="v2-action-icon v2-action-icon--neutral">
              <Icon name="gift" size={20} />
            </span>
            UBI
          </button>
        </div>

        <div className="v2-actions" style={{ marginTop: 6 }}>
          <button className="v2-action" onClick={() => setSheet('withdraw')}>
            <span className="v2-action-icon v2-action-icon--amber">
              <Icon name="bank" size={20} />
            </span>
            Retirer
          </button>
          <button className="v2-action" onClick={() => setSheet('deposit')}>
            <span className="v2-action-icon v2-action-icon--green">
              <Icon name="plus" size={20} />
            </span>
            Déposer
          </button>
        </div>
      </div>

      <div className="v2-pad">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'balances', label: 'Soldes' },
            { value: 'activity', label: 'Activité' },
          ]}
        />
      </div>

      {tab === 'balances' ? (
        <div className="v2-pad">
          <div className="v2-section-title">
            <span><Icon name="coin" size={14} /> Mes devises</span>
          </div>
          <Card padded={false} className="v2-stagger" style={{ overflow: 'hidden' }}>
            {wallet.loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton height={20} width="55%" />
                <Skeleton height={20} width="42%" />
                <Skeleton height={20} width="48%" />
              </div>
            ) : wallet.error && !hasConverted ? (
              <div style={{ padding: '4px 0' }}>
                <ErrorBlock message={wallet.error} onRetry={wallet.reload} />
              </div>
            ) : (
              <List plain>
                {hasConverted ? (
                  <>
                    {converted.map((entry) => (
                      <Row
                        key={entry.code}
                        icon="coin"
                        iconTone="accent"
                        title={entry.code}
                        subtitle={
                          entry.code === viewCurrency
                            ? 'Devise d’affichage'
                            : `≈ ${formatCurrency(toDisplay(entry.code, entry.balance), viewCurrency)}`
                        }
                        value={
                          hideBalance
                            ? '••••'
                            : `${formatNumber(entry.balance, 2)} ${entry.code}`
                        }
                      />
                    ))}
                    <Row
                      icon="wallet"
                      title={`Total (${viewCurrency})`}
                      subtitle={<RateProvenance taux={wallet.data.taux} devise={viewCurrency} />}
                      value={hideBalance ? '••••' : sansTaux ? '— taux indisponible' : formatCurrency(viewAmount, viewCurrency)}
                    />
                  </>
                ) : (
                  <EmptyState
                    icon="wallet"
                    title="Aucune devise disponible"
                    description="Convertir une devise crée un solde."
                  />
                )}
              </List>
            )}
          </Card>

          <div style={{ marginTop: 6 }}>
            <Hint icon="shield">Réserve = garantie, pas une monnaie</Hint>
          </div>

          <div className="v2-section-title">
            <span><Icon name="shield" size={14} /> Réserve de sécurité</span>
          </div>
          <Card>
            <div className="v2-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="shield" size={15} />
              Réserve de sécurité (BORB)
            </div>

            {reserveVisible ? (
              <div className="v2-reserve-body">
                <KeyValue
                  label="Solde de la réserve"
                  value={hideBalance ? '••••' : `${formatNumber(wallet.data.borb, 2)} BORB`}
                />
                <KeyValue
                  label={`Équivalent en ${viewCurrency}`}
                  value={
                    hideBalance
                      ? '••••'
                      : toView(wallet.data.borb)
                  }
                />
                <KeyValue
                  label="Disponible à l’échange"
                  value={
                    hideBalance ? '••••' : `${formatNumber(wallet.data.borbAvailable, 2)} BORB`
                  }
                />
                {wallet.data.borb - wallet.data.borbAvailable > 0 && (
                  <KeyValue
                    label="Immobilisé (commandes P2P)"
                    value={
                      hideBalance
                        ? '••••'
                        : `${formatNumber(wallet.data.borb - wallet.data.borbAvailable, 2)} BORB`
                    }
                  />
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Button
                    icon="swap"
                    disabled={wallet.data.borbAvailable <= 0}
                    onClick={openReserveConversion}
                  >
                    Échanger
                  </Button>
                  <Button
                    variant="secondary"
                    icon="eyeOff"
                    onClick={() => setReserveVisible(false)}
                  >
                    Masquer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="v2-reserve-locked">
                <KeyValue label="Solde de la réserve" value="•••• BORB" />
                <KeyValue label={`Équivalent en ${viewCurrency}`} value="••••" />
                <Button
                  block
                  icon="lock"
                  style={{ marginTop: 12 }}
                  disabled={!pinConfigured && Boolean(pin.data)}
                  onClick={() => setReservePinOpen(true)}
                >
                  Voir ma réserve
                </Button>
                {!pinConfigured && pin.data && (
                  <div style={{ marginTop: 8 }}>
                    <Hint icon="lock" tone="warning" onClick={() => setSheet('security')}>
                      PIN requis pour déverrouiller
                    </Hint>
                  </div>
                )}
              </div>
            )}
          </Card>

          {systemCases.length > 0 && (
            <>
              <div className="v2-section-title">
                <span><Icon name="bank" size={14} /> Caisses du système</span>
              </div>
              <Card padded={false} className="v2-stagger" style={{ overflow: 'hidden' }}>
                <List plain>
                  {systemCases.map((entry) => (
                    <Row
                      key={entry.name}
                      icon="bank"
                      title={entry.name}
                      subtitle={`${formatNumber(entry.share, 1)} % des caisses`}
                      value={formatInt(entry.balance)}
                    />
                  ))}
                </List>
              </Card>
              <div style={{ marginTop: 6 }}>
                <Hint icon="eye">Lecture seule</Hint>
              </div>
            </>
          )}

          {isOwner && onOpenOwner && (
            <>
              <div className="v2-section-title">
                <span><Icon name="lock" size={14} /> Propriétaire</span>
              </div>
              <List>
                <Row
                  icon="lock"
                  iconTone="amber"
                  title="Coffre propriétaire"
                  subtitle="Trésor de la réserve, répartition et réclamation"
                  chevron
                  onClick={onOpenOwner}
                />
              </List>
            </>
          )}

          {showClaim && (
            <>
              <div className="v2-section-title">
                <span><Icon name="gift" size={14} /> Réclamation 30 %</span>
              </div>
              <Card>
                {reclaim.data?.can_reclaim ? (
                  <>
                    <div className="v2-h3">Réclamer 30 %</div>
                    <div style={{ marginTop: 8 }}>
                      <Hint icon="gift">Crédité sur {reclaim.data?.uq_profil2 || uq}</Hint>
                    </div>
                    {reclaim.data?.solde_borb !== undefined && (
                      <KeyValue
                        label="Solde de Profil 2"
                        value={toView(Number(reclaim.data.solde_borb))}
                      />
                    )}
                    <Button block icon="gift" style={{ marginTop: 12 }} onClick={openClaim}>
                      Réclamer 30 %
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="v2-h3">
                      {reclaimBlockedByThreshold ? 'Le solde est suffisant' : 'Réclamation indisponible'}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Hint icon={reclaimBlockedByThreshold ? 'check' : 'info'}>
                        {reclaimBlockedByThreshold
                          ? 'Pas besoin de réclamer'
                          : reclaimReason || 'Condition non remplie'}
                      </Hint>
                    </div>
                    {reclaim.data?.solde_borb !== undefined && (
                      <KeyValue
                        label="Solde actuel"
                        value={toView(Number(reclaim.data.solde_borb))}
                      />
                    )}
                  </>
                )}
              </Card>
            </>
          )}

          <div className="v2-section-title">
            <span><Icon name="lock" size={14} /> Sécurité</span>
          </div>
          <List>
            <Row
              icon="pin"
              iconTone={pinConfigured ? 'green' : 'amber'}
              title="Code PIN"
              subtitle={pinConfigured ? `Actif · ${pinLength} chiffres` : 'Non configuré'}
              chevron
              onClick={() => setSheet('security')}
            />
            <Row
              icon="shield"
              title="Intégrité de l’historique"
              subtitle="Vérifier la chaîne de tes opérations"
              chevron
              onClick={runIntegrity}
              right={busy ? <span className="v2-spinner" /> : undefined}
            />
            <Row
              icon="users"
              title="Bénéficiaires"
              subtitle="Retrouver un compte par son pseudo"
              chevron
              onClick={() => setSheet('send')}
            />
          </List>

          <div style={{ height: 8 }} />
        </div>
      ) : (
        <div className="v2-pad">
          <div style={{ marginBottom: 12 }}>
            <BalanceSeriesChart uq={uq} />
          </div>
          <div className="v2-scroll-x" style={{ marginBottom: 12 }}>
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              Tout
            </Chip>
            <Chip active={filter === 'in'} onClick={() => setFilter('in')}>
              Reçus
            </Chip>
            <Chip active={filter === 'out'} onClick={() => setFilter('out')}>
              Envoyés
            </Chip>
          </div>

          {wallet.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={20} width="62%" />
              <Skeleton height={20} width="48%" />
              <Skeleton height={20} width="56%" />
            </Card>
          ) : transactions.length === 0 ? (
            <Card>
              <EmptyState
                icon="receipt"
                title="Aucune opération"
                description={
                  filter === 'all'
                    ? 'Aucune opération.'
                    : 'Aucun résultat pour ce filtre.'
                }
              />
            </Card>
          ) : (
            <Card padded={false} className="v2-stagger" style={{ overflow: 'hidden' }}>
              <List plain>
                {transactions.map((tx) => {
                  const incoming = isIncomingTx(tx.type);
                  return (
                    <Row
                      key={`${tx.id}-${tx.timestamp}`}
                      icon={incoming ? 'arrowDownLeft' : 'arrowUpRight'}
                      iconTone={incoming ? 'green' : 'neutral'}
                      title={txLabel(tx.type)}
                      subtitle={`${formatDateTime(tx.timestamp)} · ${counterpartyLabel(tx.counterparty)}`}
                      value={`${incoming ? '+' : '−'}${toViewPoints(Math.abs(tx.amount))}`}
                      valueTone={incoming ? 'positive' : 'default'}
                      chevron
                      onClick={() => {
                        setSelectedTx(tx);
                        setSheet('tx');
                      }}
                    />
                  );
                })}
              </List>
            </Card>
          )}

          <div style={{ height: 8 }} />
        </div>
      )}

      {/* ---------------- Envoyer ---------------- */}
      <Sheet
        open={sheet === 'send'}
        onClose={closeSheet}
        title="Envoyer une devise"
        subtitle="Confirmé par PIN"
        footer={
          <Button
            block
            icon="lock"
            disabled={!pinConfigured && Boolean(pin.data)}
            onClick={requestSend}
          >
            Envoyer avec le PIN
          </Button>
        }
      >
        <div className="v2-stack">
          <Field label="Destinataire" hint="Pseudo du destinataire, ex. uq@destin">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  setRecipientName('');
                  setRecipientProfile(null);
                }}
                placeholder="uq@destin"
                autoCapitalize="none"
                inputMode="text"
                style={{ flex: 1 }}
              />
              <Button
                variant="secondary"
                icon="camera"
                aria-label="Scanner un QR"
                onClick={() => setScanOpen(true)}
              >
                Scanner
              </Button>
            </div>
            {recipientProfile ? (
              <Card style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <Avatar
                  label={String(recipientProfile.display || recipientProfile.pseudo || recipient)}
                  src={recipientProfile.avatar_url}
                  size={46}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 750 }}>
                    {String(recipientProfile.pseudo || recipient)}
                  </div>
                  <div className="v2-muted" style={{ fontSize: 12.5 }}>
                    {String(recipientProfile.name || 'Membre UQ')}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 3,
                      color: 'var(--v2-positive)',
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    <Icon name="check" size={13} />
                    Profil confirmé
                  </div>
                </div>
              </Card>
            ) : recipientName ? (
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                Destinataire vérifié : <strong>{recipientName}</strong>
              </div>
            ) : null}
          </Field>
          <Field label="Devise" hint="Devise convertie depuis le BORB">
            <select
              className="v2-input"
              value={sendCurrency}
              onChange={(event) => setSendCurrency(event.target.value)}
            >
              {sendCurrencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={`Montant (${sendCurrency || 'devise'})`}
            hint={
              hasConverted
                ? `Solde converti : ${formatNumber(sendAvailable, 2)} ${sendCurrency}`
                : 'Aucune devise convertie pour le moment'
            }
          >
            <Input
              value={sendAmount}
              onChange={(event) => setSendAmount(event.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Motif" hint="Optionnel, visible par le destinataire">
            <Textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="Ex. cotisation, achat, aide familiale"
              rows={2}
            />
          </Field>
          {sendError && (
            <div style={{ fontSize: 13, color: 'var(--v2-negative)', fontWeight: 600 }}>{sendError}</div>
          )}
          {!pinConfigured && pin.data && (
            <Card style={{ borderColor: 'var(--v2-warning)' }}>
              <div className="v2-h3">Code PIN requis</div>
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                Configure ton PIN pour envoyer.
              </div>
              {onOpenSecurity && (
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    closeSheet();
                    onOpenSecurity();
                  }}
                >
                  Ouvrir la sécurité
                </Button>
              )}
            </Card>
          )}
          <Hint icon="shield">BORB non transférable</Hint>
          <Hint icon="bank">Frais calculés côté serveur</Hint>
        </div>
      </Sheet>

      {/* ---------------- Scan QR destinataire ---------------- */}
      <Sheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Scanner un QR"
        subtitle="Le QR contient le pseudo et le nom public"
      >
        <div className="v2-stack">
          <div
            id="v2-scan-reader"
            style={{
              width: '100%',
              minHeight: 280,
              borderRadius: 18,
              overflow: 'hidden',
              background: '#000',
            }}
          />
          {scanError && (
            <div style={{ fontSize: 13, color: 'var(--v2-negative)', fontWeight: 600 }}>{scanError}</div>
          )}
          <Hint icon="camera">
            {scanStatus === 'verif'
              ? 'Vérification du compte…'
              : 'Place le QR de réception dans le cadre.'}
          </Hint>
        </div>
      </Sheet>

      {/* ---------------- Recevoir ---------------- */}
      <Sheet open={sheet === 'receive'} onClose={closeSheet} title="Recevoir" subtitle="Partage ce QR ou ton pseudo">
        <div className="v2-stack" style={{ alignItems: 'center' }}>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 22,
              background: '#fff',
              padding: 12,
              display: 'grid',
              placeItems: 'center',
              border: '1px solid var(--v2-line)',
            }}
          >
            {receiveImage && (
              <img src={receiveImage} alt="QR de réception" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <button className="v2-chip" onClick={copyUq} style={{ gap: 8 }}>
            <Icon name="copy" size={15} /> {pseudo ? `@${pseudo}` : 'Copier l’identifiant'}
          </button>
          <Hint icon="sparkles">Partage ton pseudo</Hint>
          <Field label="Devise de réception" hint="Modifiable depuis ton profil">
            <Input value={wallet.data.receiveCurrency} readOnly />
          </Field>
        </div>
      </Sheet>

      {/* ---------------- Convertir ---------------- */}
      <Sheet
        open={sheet === 'convert'}
        onClose={closeSheet}
        title="Convertir"
        subtitle="Conversion entre la réserve et une devise"
        footer={
          <Button
            block
            icon="lock"
            disabled={!pinConfigured && Boolean(pin.data)}
            onClick={() => {
              const amount = Number(convertAmount.replace(',', '.'));
              if (!Number.isFinite(amount) || amount <= 0) {
                setConvertError('Saisis un montant valide.');
                return;
              }
              setConvertError('');
              setPinOpen(true);
            }}
          >
            Confirmer avec le PIN
          </Button>
        }
      >
        <div className="v2-stack">
          <Segmented
            value={convertDirection}
            onChange={(value) => {
              setConvertDirection(value);
              setConvertError('');
            }}
            options={[
              { value: 'out', label: 'Réserve → devise' },
              { value: 'in', label: 'Devise → réserve' },
            ]}
          />

          <Field label="Devise">
            <select
              className="v2-input"
              value={convertCurrency}
              onChange={(event) => setConvertCurrency(event.target.value)}
            >
              {currencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>

          <Field label={convertDirection === 'out' ? 'Montant de la réserve (BORB)' : `Montant ${convertCurrency}`}>
            <Input
              value={convertAmount}
              onChange={(event) => setConvertAmount(event.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </Field>

          {convertEstimate !== null && (
            <Card>
              <KeyValue
                label="Estimation"
                value={
                  convertDirection === 'out'
                    ? `${formatNumber(convertEstimate, 2)} ${convertCurrency}`
                    : `${formatNumber(convertEstimate, 2)} BORB`
                }
              />
              <KeyValue label="Taux appliqué" value={`1 BORB ≈ ${formatNumber(unitRate, unitRate < 1 ? 6 : 2)} ${convertCurrency}`} />
            </Card>
          )}

          {!pinConfigured && pin.data && (
            <Card style={{ borderColor: 'var(--v2-warning)' }}>
              <div className="v2-h3">Code PIN requis</div>
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                Configure ton PIN pour convertir.
              </div>
              {onOpenSecurity && (
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    closeSheet();
                    onOpenSecurity();
                  }}
                >
                  Ouvrir la sécurité
                </Button>
              )}
            </Card>
          )}

          {convertError && (
            <div style={{ fontSize: 13, color: 'var(--v2-negative)', fontWeight: 600 }}>{convertError}</div>
          )}
        </div>
      </Sheet>

      {/* ---------------- UBI ---------------- */}
      <Sheet
        open={sheet === 'ubi'}
        onClose={closeSheet}
        title="Revenu universel"
        subtitle="UBI distribué par la trésorerie"
      >
        <div className="v2-stack">
          <Card>
            <div className="v2-muted" style={{ fontSize: 12 }}>
              Montant indicatif
            </div>
            <div className="v2-h2" style={{ color: 'var(--v2-accent)' }}>
              {(() => {
                const info = ubi.data as Record<string, unknown> | null;
                const amount = Number(
                  info?.daily_borb ?? info?.amount ?? info?.ubi_amount ?? info?.montant ?? 0,
                );
                return amount > 0 ? toView(amount) : 'Variable';
              })()}
            </div>
            <div style={{ marginTop: 6 }}>
              <Hint icon="coin">Dépend de la trésorerie</Hint>
            </div>
          </Card>
          <Hint icon="clock">1 réclamation par période</Hint>

          <Button block loading={busy} icon="gift" onClick={runUbi}>
            Réclamer
          </Button>
        </div>
      </Sheet>

      {/* ---------------- Devise d'affichage ---------------- */}
      <Sheet
        open={sheet === 'currency'}
        onClose={closeSheet}
        title="Voir en"
        subtitle={`Solde en ${viewCurrency}`}
      >
        <div className="v2-stack">
          <div className="v2-hero" style={{ padding: 16 }}>
            <div className="v2-hero-label">Équivalent disponible</div>
            <div className="v2-hero-amount" style={{ fontSize: 26 }}>
              {sansTaux ? '— taux indisponible' : formatCurrency(viewAmount, viewCurrency)}
            </div>
            <div className="v2-hero-meta">
              <span className="v2-hero-pill">
                <Icon name={wallet.data.taux.horsLigne ? 'alert' : 'globe'} size={13} />
                {' '}
                {tauxProvenanceLabel(wallet.data.taux, viewCurrency) ||
                  'Provenance des taux indisponible'}
              </span>
              {wallet.data.goldSource ? (
                <span className="v2-hero-pill">
                  <Icon name="shield" size={13} /> Or · {wallet.data.goldSource}
                </span>
              ) : null}
            </div>
          </div>

          <div className="v2-scroll-x" style={{ flexWrap: 'wrap' }}>
            {currencies.map((code) => (
              <Chip
                key={code}
                active={viewCurrency === code}
                onClick={() => {
                  if (!switchingCurrency) chooseCurrency(code);
                }}
              >
                {code}
              </Chip>
            ))}
          </div>

          {switchingCurrency && (
            <div className="v2-muted" style={{ fontSize: 12.5 }}>
              Enregistrement de la devise…
            </div>
          )}

          <div className="v2-muted" style={{ fontSize: 12 }}>
            La devise choisie est enregistrée sur ton compte et sert d’affichage partout dans l’app.
          </div>
        </div>
      </Sheet>

      {/* ---------------- Sécurité ---------------- */}
      <Sheet open={sheet === 'security'} onClose={closeSheet} title="Sécurité du coffre" subtitle="Protection des opérations">
        <div className="v2-stack">
          <Card>
            <KeyValue
              label="Code PIN"
              value={
                pin.loading
                  ? 'Vérification…'
                  : pinConfigured
                    ? `Actif (${pinLength} chiffres)`
                    : 'Non configuré'
              }
            />
            <KeyValue
              label="Transferts"
              value={pinConfigured ? 'PIN demandé à l’envoi et à la conversion' : 'PIN à configurer'}
            />
            <KeyValue label="Historique" value="Chaîne vérifiable" />
            {isOwner && wallet.data.borb > 0 && (
              <KeyValue
                label="Réserve de sécurité (BORB)"
                value={`${formatNumber(wallet.data.borb, 2)} BORB`}
              />
            )}
          </Card>

          <List>
            <Row
              icon="shield"
              title="Vérifier l’intégrité"
              subtitle="Contrôler la chaîne de l’historique"
              chevron
              onClick={runIntegrity}
            />
            {onOpenSecurity && (
              <Row
                icon="pin"
                title={pinConfigured ? 'Modifier le code PIN' : 'Configurer un code PIN'}
                subtitle="Depuis la sécurité du profil"
                chevron
                onClick={() => {
                  closeSheet();
                  onOpenSecurity();
                }}
              />
            )}
            <Row
              icon="receipt"
              title="Reçus d’opérations"
              subtitle="Disponibles depuis chaque ligne d’activité"
              onClick={() => {
                closeSheet();
                setTab('activity');
              }}
              chevron
            />
          </List>
        </div>
      </Sheet>

      {/* ---------------- Detail transaction ---------------- */}
      <Sheet
        open={sheet === 'tx' && Boolean(selectedTx)}
        onClose={closeSheet}
        title={selectedTx ? txLabel(selectedTx.type) : 'Opération'}
        subtitle={selectedTx ? formatDateTime(selectedTx.timestamp) : undefined}
        footer={
          selectedTx ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <a
                className="v2-btn v2-btn--secondary v2-btn--block"
                href={getReceiptUrl(uq, selectedTx.id)}
                download={`receipt-${selectedTx.id}.png`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="receipt" size={18} /> Télécharger le reçu
              </a>
              {selectedInvoice && (
                <Button
                  variant="secondary"
                  block
                  icon="file"
                  loading={invoiceBusy}
                  onClick={openInvoice}
                >
                  Voir la facture
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {selectedTx && (
          <div className="v2-stack">
            <div style={{ textAlign: 'center', padding: '6px 0 12px' }}>
              <div
                className="v2-h1"
                style={{
                  color: isIncomingTx(selectedTx.type) ? 'var(--v2-positive)' : 'var(--v2-ink)',
                }}
              >
                {isIncomingTx(selectedTx.type) ? '+' : '−'}
                {toViewPoints(Math.abs(selectedTx.amount))}
              </div>
              <span className="v2-badge" style={{ marginTop: 8 }}>
                {selectedTx.status || 'confirmé'}
              </span>
            </div>

            <Card>
              <KeyValue label="Contrepartie" value={counterpartyLabel(selectedTx.counterparty)} />
              <KeyValue label="Frais" value={toViewPoints(selectedTx.fee || 0)} />
              {selectedTx.block_number !== undefined && (
                <KeyValue label="Bloc" value={selectedTx.block_number} />
              )}
              <KeyValue label="Référence" value={`#${selectedTx.id}`} />
              <KeyValue label="Date" value={relativeDay(selectedTx.timestamp)} />
            </Card>
          </div>
        )}
      </Sheet>

      {/* ---------------- Réclamation 30 % (Profil 2) ---------------- */}
      <Sheet
        open={claimSheet}
        onClose={() => {
          if (!claimBusy) setClaimSheet(false);
        }}
        title="Réclamer 30 %"
        subtitle={`Code PIN propriétaire · ${claimReceiver || uq}`}
        footer={
          <Button
            block
            icon="gift"
            loading={claimBusy}
            disabled={claimPin.trim().length < PIN_MIN_LENGTH}
            onClick={submitClaim}
          >
            Confirmer la réclamation
          </Button>
        }
      >
        <div className="v2-stack">
          <div className="v2-muted" style={{ fontSize: 12.5 }}>
            Le PIN est vérifié par le backend (SHA-256 + sel) et n’est jamais conservé par
            l’application. Trois conditions : cadenas validé, lien au propriétaire, solde bas.
          </div>
          <Field
            label="Code PIN propriétaire"
            error={claimError}
            hint={`${PIN_MIN_LENGTH} à ${PIN_MAX_LENGTH} chiffres`}
          >
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={claimPin}
              onChange={(event) =>
                setClaimPin(event.target.value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))
              }
              placeholder="••••"
              style={{ letterSpacing: '0.4em', fontSize: 20, textAlign: 'center' }}
            />
          </Field>
        </div>
      </Sheet>

      {/* ---------------- Résultat de la réclamation ---------------- */}
      <Sheet
        open={Boolean(claimResult)}
        onClose={() => setClaimResult(null)}
        title="Réclamation réussie"
        subtitle={claimResult?.message}
      >
        <div className="v2-stack">
          <div className="v2-hero" style={{ padding: 16 }}>
            <div className="v2-hero-label">Montant reçu</div>
            <div className="v2-hero-amount" style={{ fontSize: 26 }}>
              {toView(Number(claimResult?.montant_borb) || 0)}
            </div>
          </div>
          <Card>
            <KeyValue label="Compte crédité" value={claimReceiver || uq} />
            {claimResult?.profil2_avant !== undefined && (
              <KeyValue
                label="Solde avant"
                value={toViewPoints(Number(claimResult.profil2_avant) || 0)}
              />
            )}
            {claimResult?.profil2_borb !== undefined && (
              <KeyValue
                label="Solde après"
                value={`${toView(Number(claimResult.profil2_borb) || 0)}`}
              />
            )}
          </Card>
          <Button block onClick={() => setClaimResult(null)}>
            Fermer
          </Button>
        </div>
      </Sheet>

      {/* ---------------- Retrait direct ---------------- */}
      <Sheet
        open={sheet === 'withdraw'}
        onClose={closeSheet}
        title="Retrait direct"
        subtitle="Vers un compte externe : mobile money ou banque"
        footer={
          <Button block icon="lock" onClick={requestWithdraw}>
            Confirmer avec le PIN
          </Button>
        }
      >
        <div className="v2-stack">
          <Hint icon="shield" tone="accent">
            Règle : seuls les devises détenues sont retirables — la réserve BORB n’est jamais retirable.
            Des frais de service s’appliquent (0,1 % fiat, 1 % crypto) et le retrait part en « pending »
            le temps du traitement externe.
          </Hint>

          {converted.length === 0 ? (
            <Card>
              <div className="v2-h3">Aucune devise retirable</div>
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                Convertis d’abord une part de ta réserve BORB vers une devise (USD, CDF…) pour pouvoir retirer.
              </div>
              <Button variant="secondary" size="sm" style={{ marginTop: 10 }} onClick={openReserveConversion}>
                Convertir la réserve
              </Button>
            </Card>
          ) : (
            <>
              <Field label="Devise à retirer">
                <select
                  className="v2-input"
                  value={withdrawCurrency}
                  onChange={(event) => {
                    setWithdrawCurrency(event.target.value);
                    setWithdrawError('');
                  }}
                >
                  <option value="">Choisir…</option>
                  {converted.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.code} — {formatNumber(Number(entry.balance), 2)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={`Montant ${withdrawCurrency || ''}`}>
                <Input
                  value={withdrawAmount}
                  onChange={(event) => {
                    setWithdrawAmount(event.target.value);
                    setWithdrawError('');
                  }}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </Field>

              <Field label="Destination">
                <Input
                  value={withdrawDestination}
                  onChange={(event) => {
                    setWithdrawDestination(event.target.value);
                    setWithdrawError('');
                  }}
                  placeholder="Numéro mobile money ou coordonnées bancaires"
                />
              </Field>

              <Hint icon="info" tone="neutral">
                Le retrait est enregistré puis traité : le montant + les frais sont réservés immédiatement,
                le net part vers ta destination après validation.
              </Hint>
            </>
          )}

          {!pinConfigured && pin.data && (
            <Card style={{ borderColor: 'var(--v2-warning)' }}>
              <div className="v2-h3">Code PIN requis</div>
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                Configure ton PIN pour retirer.
              </div>
              {onOpenSecurity && (
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    closeSheet();
                    onOpenSecurity();
                  }}
                >
                  Ouvrir la sécurité
                </Button>
              )}
            </Card>
          )}

          {withdrawError && (
            <div style={{ fontSize: 13, color: 'var(--v2-negative)', fontWeight: 600 }}>{withdrawError}</div>
          )}
        </div>
      </Sheet>

      {/* ---------------- Dépôt (bientôt disponible — P2P mobile UQ) ---------------- */}
      <Sheet
        open={sheet === 'deposit'}
        onClose={closeSheet}
        title="Déposer des fonds"
        subtitle="Le dépôt direct arrive — en attendant, passe par le P2P"
      >
        <div className="v2-stack">
          <Card>
            <div className="v2-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={15} /> Dépôt direct — bientôt disponible
            </div>
            <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.55 }}>
              Le dépôt par numéro mobile money (M-Pesa, Airtel, Orange, MTN…) avec validation
              propriétaire arrive prochainement. En attendant, tout dépôt se fait en{' '}
              <strong>P2P mobile UQ</strong> : un utilisateur UQ te paie en mobile money et les
              BORB arrivent dans ton coffre.
            </div>
          </Card>

          <Card>
            <div className="v2-h3">Acheter du BORB — canaux sécurisés</div>
            <div className="v2-stack" style={{ marginTop: 8 }}>
              <Hint icon="shield" tone="accent">
                <strong>P2P mobile UQ (recommandé)</strong> — paiement mobile money entre utilisateurs,
                séquestre et réputation UQ protègent les deux parties.
              </Hint>
              <Hint icon="info" tone="neutral">
                Le dépôt direct par numéro mobile money (déclaration + validation propriétaire) est en
                préparation — il apparaîtra ici.
              </Hint>
            </div>
          </Card>

          <Button
            block
            icon="trending"
            onClick={() => {
              closeSheet();
              onGoTrading?.();
            }}
          >
            Acheter du BORB en P2P mobile UQ
          </Button>
        </div>
      </Sheet>

      <PinSheet
        open={withdrawPinOpen}
        onClose={() => setWithdrawPinOpen(false)}
        title="Confirmer le retrait"
        subtitle={`${withdrawAmount || '0'} ${withdrawCurrency} → ${withdrawDestination || 'destination'}`}
        length={pinLength}
        onSubmit={submitWithdraw}
      />

      <PinSheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Confirmer la conversion"
        subtitle={
          convertDirection === 'out'
            ? `${convertAmount || '0'} BORB de réserve → ${convertCurrency}`
            : `${convertAmount || '0'} ${convertCurrency} → réserve`
        }
        length={pinLength}
        onSubmit={submitConvert}
      />

      <PinSheet
        open={sendPinOpen}
        onClose={() => setSendPinOpen(false)}
        title="Confirmer l’envoi"
        subtitle={`${sendAmount || '0'} ${sendCurrency} → ${recipient || 'destinataire'}`}
        length={pinLength}
        onSubmit={confirmSend}
      />

      <PinSheet
        open={reservePinOpen}
        onClose={() => setReservePinOpen(false)}
        title="Déverrouiller la réserve"
        subtitle="Le solde BORB reste masqué sans ton code PIN"
        length={pinLength}
        onSubmit={confirmReservePin}
      />
    </>
  );
}
