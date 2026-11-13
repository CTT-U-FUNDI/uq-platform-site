import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { AvatarCropSheet } from '../components/AvatarCropSheet';
import {
  Avatar,
  Button,
  Card,
  ErrorBlock,
  Field,
  Hint,
  Input,
  KeyValue,
  List,
  Row,
  ScreenHeader,
  Segmented,
  Sheet,
  Skeleton,
  Stat,
  Textarea, Loader} from '../components/Ui';
import { useAsync, usePolling } from '../lib/hooks';
import { ReputationTable } from '../components/ReputationTable';
import { useSession } from '../lib/session';
import { useHelp } from '../lib/help';
import { ProfileSwitchSheet } from '../components/ProfileSwitchSheet';
import { devisesFiat, storeDisplayCurrency } from '../lib/currency';
import { useNotifications } from '../lib/notifications';
import {
  AVATAR_MAX_CHARS,
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  changePassword,
  checkPhone,
  confirmOtp,
  describeError,
  getAccountInfos,
  getAvatar,
  getDevices,
  getFiatRates,
  getKycStatut,
  getMe,
  listZandoItems,
  zandoOwner,
  type ZandoItem,
  getPinStatus,
  getProfileStats,
  getPreferences,
  pinIsConfigured,
  removePin,
  requestOtp,
  revokeDevice,
  setAvatar,
  setCurrencyPreferences,
  setPreferences,
  setPin,
  updateProfile,
  updateRecoveryContacts,
  type Preferences,
} from '../lib/api';
import { compressImageFile, dataUrlBytes, formatBytes, pickImageFile } from '../lib/image';
import { formatDate, formatDateTime, formatCount, formatNumber, initials } from '../lib/format';
import {
  exportLearning,
  learningSnapshot,
  resetLearning,
  setLearningEnabled,
  syncLearning,
  useLearningRevision,
} from '../lib/learning';

type ProfileSheet = 'edit' | 'security' | 'devices' | 'learning' | 'about' | 'recovery' | 'mesAnnonces' | null;

/** Poids maximal d'image derive du plafond backend (base64 = 4/3 des octets). */
const AVATAR_MAX_BYTES = Math.round((AVATAR_MAX_CHARS * 3) / 4);
type PrivacyPreferenceKey =
  | 'privacy_real_name'
  | 'privacy_description'
  | 'privacy_city'
  | 'privacy_origin_city'
  | 'privacy_occupation'
  | 'privacy_marital_status'
  | 'privacy_mobile_money_number'
  | 'privacy_trading_currency';
type NotificationPreferenceKey =
  | 'notify_chat'
  | 'notify_wallet'
  | 'notify_trading'
  | 'mesAnnonces'
  | 'notify_zando'
  | 'notify_system';
const PRIVACY_FIELDS: { key: PrivacyPreferenceKey; label: string }[] = [
  { key: 'privacy_real_name', label: 'Nom et identité affichés' },
  { key: 'privacy_description', label: 'Description du profil' },
  { key: 'privacy_city', label: 'Ville actuelle' },
  { key: 'privacy_origin_city', label: 'Ville d’origine' },
  { key: 'privacy_occupation', label: 'Profession' },
  { key: 'privacy_marital_status', label: 'Situation familiale' },
  { key: 'privacy_mobile_money_number', label: 'Numéro mobile money' },
  { key: 'privacy_trading_currency', label: 'Devise utilisée en trading' },
];
const NOTIFICATION_PREFERENCES: { key: NotificationPreferenceKey; label: string }[] = [
  { key: 'notify_chat', label: 'Messages et conversations' },
  { key: 'notify_wallet', label: 'Coffre et portefeuille' },
  { key: 'notify_trading', label: 'Trading et ordres' },
  { key: 'notify_zando', label: 'Zando et publications' },
  { key: 'notify_system', label: 'Sécurité et système' },
];


export function ProfileScreen({
  onGoKyc,
  onGoStudio,
  onEditZando,
  onCreateZando,
  onGoPlayer,
  onGoOwner,
  onGoAnalytics,
  onGoPolitiques,
  onGoMail,
  onGoSms,
  onBack,
}: {
  onGoKyc: () => void;
  onGoStudio: () => void;
  onEditZando?: (item: ZandoItem) => void;
  onCreateZando?: () => void;
  onGoPlayer: () => void;
  onGoOwner?: () => void;
  onGoAnalytics: () => void;
  onGoPolitiques?: () => void;
  onGoMail?: () => void;
  onGoSms?: () => void;
  onBack?: () => void;
}) {
  const {
    uq,
    pseudo,
    email,
    displayName,
    isOwner,
    isGuardian,
    toast,
    signOut,
    refreshProfile,
    themePreference,
    setThemePreference,
    fontScale,
    setFontScale,
  } = useSession();
  const notifications = useNotifications();
  const help = useHelp();

  const me = useAsync(() => getMe(), []);
  const avatar = useAsync(() => getAvatar(uq), [uq], { enabled: Boolean(uq) });
  const pin = useAsync(() => getPinStatus(uq), [uq], { enabled: Boolean(uq) });
  const rates = useAsync(() => getFiatRates(), []);
  const kyc = useAsync(() => getKycStatut(uq), [uq], { enabled: Boolean(uq) });
  const devices = useAsync(() => getDevices(uq), [uq], { enabled: Boolean(uq) });
  /** Compteurs publics du compte : les mêmes que ceux vus par les autres membres. */
  const statsPubliques = useAsync(() => getProfileStats(uq), [uq], { enabled: Boolean(uq) });
  usePolling(() => statsPubliques.reload(), 10000, Boolean(uq));
  /** Identité privée : numéro UQ, mail UQ, code promo et contacts de récupération. */
  const infos = useAsync(() => getAccountInfos(uq), [uq], { enabled: Boolean(uq) });
  const savedPreferences = useAsync(() => getPreferences(uq), [uq], { enabled: Boolean(uq) });

  const [sheet, setSheet] = useState<ProfileSheet>(null);
  const [reputationTableOpen, setReputationTableOpen] = useState(false);
  const mesAnnonces = useAsync(() => listZandoItems(), [sheet === 'mesAnnonces'], { enabled: sheet === 'mesAnnonces' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountPreferences, setAccountPreferences] = useState<Preferences>({});
  const [busy, setBusy] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Bascule possible : le proprietaire peut descendre vers le profil rattache ;
  // un profil rattache ne peut remonter que si le terminal connait son proprietaire.
  const switchedFrom = localStorage.getItem('uq_switched_from') || '';
  const linkedOwner = localStorage.getItem('uq_linked_owner') || switchedFrom;
  const switchTarget: 'owner' | 'profil2' | null = isGuardian
    ? 'profil2'
    : linkedOwner
      ? 'owner'
      : null;

  // Edition du profil
  const [form, setForm] = useState({
    ville_provenance: '',
    ville_actuelle: '',
    statut_marital: '',
    emploi: '',
    description: '',
    photo_url: '',
    mobile_money_number: '',
    mobile_money_operator: '',
  });

  // Securite
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinPassword, setPinPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');

  // Identite privee : rien ne se montre avant qu'on le revele.
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState('');

  // Contacts de recuperation (email externe + telephone verifie par code).
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recNumero, setRecNumero] = useState<{ valide?: boolean; e164?: string | null; pays?: string | null; operateur?: string | null } | null>(null);
  const [recJeton, setRecJeton] = useState('');
  const [recCode, setRecCode] = useState('');
  const [recPreuve, setRecPreuve] = useState('');
  const [recBusy, setRecBusy] = useState(false);
  const [recMessage, setRecMessage] = useState('');
  const [recError, setRecError] = useState('');

  // Import d'image : apercu immediat avant enregistrement backend.
  const [avatarPreview, setAvatarPreview] = useState('');

  const [currency, setCurrency] = useState('CDF');

  useEffect(() => {
    if (savedPreferences.data?.preferences) {
      setAccountPreferences(savedPreferences.data.preferences);
    }
  }, [savedPreferences.data?.preferences]);

  // Suggestions locales : etat lu a chaque apprentissage.
  const [confirmClearLearning, setConfirmClearLearning] = useState(false);
  const learningRevision = useLearningRevision();
  const learning = useMemo(() => learningSnapshot(), [learningRevision]);

  /** Devises proposees : la liste fiat de l'oracle, meme source que le coffre. */
  const currencyOptions = useMemo(() => {
    const keys = devisesFiat(rates.data).sort();
    return keys.length > 0 ? keys : [currency];
  }, [rates.data, currency]);

  useEffect(() => {
    const current = me.data?.me;
    if (!current) return;
    setForm({
      ville_provenance: current.ville_provenance || '',
      ville_actuelle: current.ville_actuelle || '',
      statut_marital: current.statut_marital || '',
      emploi: current.emploi || '',
      description: current.description || '',
      photo_url: current.photo_url || '',
      mobile_money_number: current.mobile_money_number || '',
      mobile_money_operator: current.mobile_money_operator || '',
    });
  }, [me.data]);

  const pinConfigured = pinIsConfigured(pin.data);
  // Longueur reelle lue par l'API : jamais 4 ou 6 en dur.
  const pinLength =
    Math.min(Math.max(Number(pin.data?.pin_length) || PIN_MIN_LENGTH, PIN_MIN_LENGTH), PIN_MAX_LENGTH);
  const kycStatut = String((kyc.data as { statut?: string } | null)?.statut || 'AUCUN').toUpperCase();
  const kycVerified = kycStatut === 'VALIDE' || kycStatut === 'VALIDE_AUTO' || kycStatut === 'VERIFIE';
  const photo = avatarPreview || avatar.data?.avatar_url || form.photo_url || '';
  const pseudoLabel = pseudo || me.data?.me?.pseudo || '';
  // api_me n'expose pas de display_name : on compose a partir de l'identite.
  const identityName =
    [me.data?.identity?.prenom, me.data?.identity?.nom]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ') ||
    displayName ||
    '';
  const nameLabel = identityName;
  const identityTitle = nameLabel || pseudoLabel;
  const identitySubtitle = pseudoLabel ? `@${pseudoLabel}` : email || 'Membre UQ';

  const saveProfile = async () => {
    setBusy(true);
    try {
      await updateProfile({ uq_number: uq, ...form });
      toast('Profil mis à jour', 'success');
      setSheet(null);
      me.reload();
      await refreshProfile();
    } catch (error) {
      toast(describeError(error, 'Mise à jour impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveAvatar = async () => {
    setBusy(true);
    try {
      await setAvatar(uq, form.photo_url.trim());
      toast('Photo enregistrée', 'success');
      setAvatarPreview('');
      avatar.reload();
    } catch (error) {
      toast(describeError(error, 'Enregistrement impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Import d'une image locale : compression canvas puis envoi en data URI.
   * Le seul point d'entree backend est /api/account/avatar/set (plafond
   * AVATAR_MAX_CHARS), il accepte une URL comme une chaine base64.
   */
  const importAvatar = async () => {
    const file = await pickImageFile();
    if (!file) return;
    setAvatarFile(file);
  };

  const saveCroppedAvatar = async (file: File) => {
    setBusy(true);
    try {
      const compressed = await compressImageFile(file, {
        maxSide: 512,
        maxChars: AVATAR_MAX_CHARS,
        type: 'image/webp',
        quality: 0.85,
      });
      await setAvatar(uq, compressed.dataUrl);
      setAvatarPreview(compressed.dataUrl);
      setForm((current) => ({ ...current, photo_url: '' }));
      setAvatarFile(null);
      toast(`Photo enregistrée · ${formatBytes(dataUrlBytes(compressed.dataUrl))}`, 'success');
      avatar.reload();
      await refreshProfile();
    } catch (error) {
      toast(describeError(error, 'Import impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Changement de PIN : ancien PIN (si un PIN existe), nouveau PIN,
   * confirmation et mot de passe du compte. Le backend remplace le PIN via
   * /api/account/pin/set des que old_pin + password sont fournis.
   */
  const savePin = async () => {
    if (pinConfigured && oldPin.length !== pinLength) {
      toast(`L'ancien PIN doit contenir ${pinLength} chiffres`, 'error');
      return;
    }
    if (!pinConfigured && oldPin) {
      toast('Aucun ancien PIN à saisir sur ce compte', 'error');
      return;
    }
    if (
      newPin.length < PIN_MIN_LENGTH ||
      newPin.length > PIN_MAX_LENGTH ||
      !/^\d+$/.test(newPin)
    ) {
      toast(`Le nouveau PIN doit contenir ${PIN_MIN_LENGTH} à ${PIN_MAX_LENGTH} chiffres`, 'error');
      return;
    }
    if (newPin !== confirmPin) {
      toast('Les deux PIN ne correspondent pas', 'error');
      return;
    }
    if (!pinPassword) {
      toast('Le mot de passe est requis', 'error');
      return;
    }
    setBusy(true);
    try {
      await setPin({
        uq_number: uq,
        pin: newPin,
        password: pinPassword,
        old_pin: pinConfigured ? oldPin : undefined,
      });
      toast(pinConfigured ? 'Code PIN modifié' : 'Code PIN enregistré', 'success');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setPinPassword('');
      pin.reload();
    } catch (error) {
      toast(describeError(error, 'Enregistrement impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const deletePin = async () => {
    setBusy(true);
    try {
      await removePin(uq, pinPassword || undefined);
      toast('Code PIN supprimé', 'success');
      setPinPassword('');
      pin.reload();
    } catch (error) {
      toast(describeError(error, 'Suppression impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (nextPassword.length < 6) {
      toast('Le nouveau mot de passe est trop court', 'error');
      return;
    }
    setBusy(true);
    try {
      await changePassword({ uq_number: uq, old_password: oldPassword, new_password: nextPassword });
      toast('Mot de passe modifié', 'success');
      setOldPassword('');
      setNextPassword('');
    } catch (error) {
      toast(describeError(error, 'Modification impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  // ====================
  // IDENTITE PRIVEE — le numero UQ, le mail UQ et le code promo ne sortent
  // jamais a l'ecran sans qu'on les revele ; seul le pseudo est public.
  // ====================
  const reveiller = (cle: string) => setReveal((courant) => ({ ...courant, [cle]: !courant[cle] }));

  const copier = async (cle: string, valeur: string) => {
    if (!valeur) return;
    try {
      await navigator.clipboard.writeText(valeur);
      setCopiedKey(cle);
      window.setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      toast('Copie impossible sur cet appareil', 'error');
    }
  };

  // Les contacts enregistres cote backend servent de valeurs par defaut.
  useEffect(() => {
    if (!infos.data) return;
    setRecEmail(String(infos.data.recovery_email || ''));
    setRecPhone(String(infos.data.recovery_phone || ''));
  }, [infos.data]);

  const ouvrirRecuperation = () => {
    setRecError('');
    setRecMessage('');
    setRecJeton('');
    setRecCode('');
    setRecPreuve('');
    setRecNumero(null);
    setSheet('recovery');
  };

  const envoyerCodeRecuperation = async () => {
    setRecBusy(true);
    setRecError('');
    setRecMessage('');
    try {
      const saisi = recPhone.replace(/[\s.-]/g, '');
      const analyse = await checkPhone(saisi);
      setRecNumero(analyse);
      if (!analyse.valide || !analyse.e164) {
        setRecError('Numéro non reconnu : vérifie l’indicatif et le nombre de chiffres.');
        return;
      }
      const code = await requestOtp('telephone', analyse.e164);
      if (code.status !== 'success' || !code.jeton) {
        setRecError(code.message || 'Envoi du code impossible.');
        return;
      }
      setRecJeton(code.jeton);
      setRecMessage(
        code.mode === 'reel'
          ? `Code envoyé au ${code.cible}.`
          : 'Réseau SMS non configuré : le numéro est enregistré, à confirmer plus tard.',
      );
    } catch {
      setRecError('Connexion au serveur impossible.');
    } finally {
      setRecBusy(false);
    }
  };

  const validerCodeRecuperation = async () => {
    if (!recJeton || recCode.length !== 6) return;
    setRecBusy(true);
    setRecError('');
    try {
      const data = await confirmOtp(recJeton, recCode);
      if (data.status !== 'success' || !data.jeton_verifie) {
        setRecError(data.message || 'Code incorrect.');
        return;
      }
      setRecPreuve(data.jeton_verifie);
      setRecPhone(String(data.valeur || recPhone));
      toast('Numéro vérifié', 'success');
    } catch {
      setRecError('Connexion au serveur impossible.');
    } finally {
      setRecBusy(false);
    }
  };

  const saveRecovery = async () => {
    setRecBusy(true);
    setRecError('');
    try {
      const data = await updateRecoveryContacts({
        uq_number: uq,
        recovery_email: recEmail.trim().toLowerCase(),
        recovery_phone: recPhone.trim(),
        verification_telephone: recPreuve || undefined,
      });
      if (data.status !== 'success') {
        setRecError(data.message || 'Enregistrement impossible.');
        return;
      }
      toast('Contacts de récupération enregistrés', 'success');
      setRecPreuve('');
      setRecJeton('');
      setRecCode('');
      infos.reload();
      setSheet(null);
    } catch (error) {
      setRecError(describeError(error, 'Enregistrement impossible.'));
    } finally {
      setRecBusy(false);
    }
  };

  const saveCurrency = async (code: string) => {
    setCurrency(code);
    try {
      await setCurrencyPreferences({ uq_number: uq, display_currency: code, receive_currency: code });
      // La preférence de l'appareil suit le choix du compte : les écrans qui ne
      // lisent pas le coffre (lecteur, trading) tombaient sur l'ancienne devise.
      storeDisplayCurrency(code);
      toast(`Devise d’affichage : ${code}`, 'success');
    } catch (error) {
      toast(describeError(error, 'Préférence non enregistrée.'), 'error');
    }
  };

  const saveAccountPreferences = async (changes: Partial<Preferences>) => {
    try {
      await setPreferences({ uq_number: uq, ...changes });
      setAccountPreferences((current) => ({ ...current, ...changes }));
      savedPreferences.reload();
      window.dispatchEvent(new Event('uq-notification-preferences-updated'));
      toast('Paramètres enregistrés', 'success');
    } catch (error) {
      toast(describeError(error, 'Paramètres non enregistrés.'), 'error');
    }
  };

  const preferenceEnabled = (value: boolean | string | undefined) =>
    value !== false && value !== 'false';

  /**
   * Le robinet n'est pas une préférence d'affichage : le couper arrête une
   * facturation en cours. La réponse du serveur dit quelles vitrines sont
   * passées hors ligne, et c'est ce qu'on affiche — pas un message générique.
   */
  const enregistrerRobinet = async (valeur: boolean) => {
    try {
      const reponse = await setPreferences({ uq_number: uq, robinet_vitrine: valeur });
      setAccountPreferences((current) => ({ ...current, robinet_vitrine: valeur }));
      savedPreferences.reload();
      const suspendues: unknown = (reponse as { boutiques_suspendues?: unknown })
        ?.boutiques_suspendues;
      const nombre = Array.isArray(suspendues) ? suspendues.length : 0;
      toast(
        valeur
          ? 'Robinet ouvert : rien ne sort sans un geste PIN'
          : nombre > 0
            ? `Robinet coupé : ${nombre} vitrine(s) passée(s) hors ligne`
            : 'Robinet coupé : plus aucun prélèvement continu',
        'success',
      );
    } catch (error) {
      toast(describeError(error, 'Robinet non enregistré.'), 'error');
    }
  };

  /** `device` est le nom renvoye par /api/account/devices/{uq}. */
  const revoke = async (device: string) => {    setRevokeBusy(true);
    try {
      await revokeDevice(uq, device);
      toast('Appareil déconnecté', 'success');
      setPendingRevoke(null);
      devices.reload();
    } catch (error) {
      toast(describeError(error, 'Action impossible.'), 'error');
    } finally {
      setRevokeBusy(false);
    }
  };

  const toggleLearning = () => {
    const next = !learning.enabled;
    setLearningEnabled(next);
    toast(next ? 'Suggestions activées' : 'Suggestions désactivées');
    if (next) void syncLearning(uq);
  };

  const exportLearningFile = () => {
    try {
      const blob = new Blob([exportLearning()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'uq-suggestions.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Export impossible sur cet appareil.', 'error');
    }
  };

  const clearLearningData = () => {
    resetLearning();
    setConfirmClearLearning(false);
    toast('Données de suggestions supprimées', 'success');
  };

  return (
    <>
      <ScreenHeader
        title={settingsOpen ? 'Paramètres' : 'Profil'}
        subtitle={
          settingsOpen
            ? 'Profil · confidentialité · services · notifications'
            : isOwner
              ? 'Compte propriétaire'
              : 'Compte membre'
        }
        onBack={settingsOpen ? () => setSettingsOpen(false) : onBack}
        right={
          settingsOpen ? undefined : (
            <button
              type="button"
              className="v2-icon-btn"
              aria-label="Ouvrir les paramètres"
              onClick={() => setSettingsOpen(true)}
            >
              <Icon name="settings" size={21} />
            </button>
          )
        }
      />

      {!settingsOpen && (
      <div className="v2-pad">
        <Card style={{ marginTop: 4, padding: 0, overflow: 'hidden' }}>
          <div
            aria-hidden="true"
            style={{
              height: 112,
              background:
                'radial-gradient(circle at 85% 20%, rgba(255,255,255,.35), transparent 34%), linear-gradient(120deg, #7d2632, #e63946 52%, #583c7b)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 16px', marginTop: -38 }}>
            <button
              type="button"
              aria-label="Remplacer la photo de profil"
              disabled={busy}
              onClick={importAvatar}
              style={{
                position: 'relative',
                display: 'grid',
                flex: 'none',
                padding: 0,
                borderRadius: '50%',
                opacity: busy ? 0.65 : 1,
                border: '4px solid var(--v2-surface)',
              }}
            >
              <Avatar label={initials(identityTitle || pseudoLabel)} src={photo || undefined} size={84} />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: -3,
                  bottom: -3,
                  display: 'grid',
                  placeItems: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  color: 'white',
                  background: 'var(--v2-accent)',
                  border: '3px solid var(--v2-surface)',
                }}
              >
                <Icon name="camera" size={13} />
              </span>
            </button>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <div className="v2-h3" style={{ fontSize: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nameLabel || identityTitle || identitySubtitle}
              </div>
              <div className="v2-muted" style={{ fontSize: 12.5 }}>
                {pseudoLabel ? identitySubtitle : email || 'Membre UQ'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {kycVerified ? (
                  <span className="v2-badge v2-badge--positive">
                    <Icon name="shield" size={13} /> Identité vérifiée
                  </span>
                ) : (
                  <button
                    type="button"
                    className="v2-badge v2-badge--warning"
                    onClick={onGoKyc}
                    style={{ border: 0, cursor: 'pointer' }}
                  >
                    <Icon name="shield" size={13} /> Compléter la vérification
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="v2-divider" style={{ margin: '14px 16px 10px' }} />
          {statsPubliques.loading && !statsPubliques.data ? (
            <div style={{ padding: '0 16px 16px' }}>
              <Skeleton height={48} radius={12} />
            </div>
          ) : statsPubliques.error && !statsPubliques.data ? (
            <div style={{ padding: '0 16px 16px' }}>
              <ErrorBlock message={statsPubliques.error} onRetry={statsPubliques.reload} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, padding: '0 16px 16px' }}>
              <Stat
                icon="users"
                label="Réseaux"
                value={formatCount(statsPubliques.data?.stats.total_abonnes ?? 0)}
              />
              <Stat
                icon="sparkles"
                label="Likes"
                value={formatCount(statsPubliques.data?.stats.total_likes_recus ?? 0)}
              />
              <Stat
                icon="shield"
                label="Confiance"
                value={`${formatNumber(statsPubliques.data?.score_confiance.total ?? 0, 0)}/100`}
              />
            
                <button
                  type="button"
                  onClick={() => setReputationTableOpen(true)}
                  aria-label="Voir le detail de la reputation"
                  style={{
                    marginLeft: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    border: '1px solid var(--v2-line)',
                    background: 'var(--v2-surface-2)',
                    color: 'var(--v2-ink-2)',
                    fontSize: 13,
                    fontWeight: 750,
                    cursor: 'pointer',
                    flex: 'none',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  i
                </button></div>
          )}
          {me.data?.me.description?.trim() ? (
            <div style={{ padding: '0 16px 16px', fontSize: 13, lineHeight: 1.45 }}>
              {me.data.me.description}
            </div>
          ) : null}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>À propos</div>
          <div className="v2-stack" style={{ gap: 8 }}>
            {me.data?.me.emploi?.trim() ? (
              <div className="v2-row-between">
                <span className="v2-muted">Profession</span>
                <span style={{ fontWeight: 650, textAlign: 'right' }}>{me.data.me.emploi}</span>
              </div>
            ) : null}
            {me.data?.me.ville_actuelle?.trim() ? (
              <div className="v2-row-between">
                <span className="v2-muted">Réside à</span>
                <span style={{ fontWeight: 650, textAlign: 'right' }}>{me.data.me.ville_actuelle}</span>
              </div>
            ) : null}
            {me.data?.me.ville_provenance?.trim() ? (
              <div className="v2-row-between">
                <span className="v2-muted">Originaire de</span>
                <span style={{ fontWeight: 650, textAlign: 'right' }}>{me.data.me.ville_provenance}</span>
              </div>
            ) : null}
            {me.data?.me.statut_marital?.trim() ? (
              <div className="v2-row-between">
                <span className="v2-muted">Situation</span>
                <span style={{ fontWeight: 650, textAlign: 'right' }}>{me.data.me.statut_marital}</span>
              </div>
            ) : null}
            {me.data?.me.created_at ? (
              <div className="v2-row-between">
                <span className="v2-muted">Membre depuis</span>
                <span style={{ fontWeight: 650, textAlign: 'right' }}>
                  {formatDate(me.data.me.created_at)}
                </span>
              </div>
            ) : null}
            {!me.data?.me.emploi?.trim() &&
            !me.data?.me.ville_actuelle?.trim() &&
            !me.data?.me.ville_provenance?.trim() &&
            !me.data?.me.statut_marital?.trim() &&
            !me.data?.me.created_at &&
            !me.data?.me.description?.trim() ? (
              <div className="v2-muted" style={{ fontSize: 12.5 }}>
                Complète ta présentation pour enrichir ton profil.
              </div>
            ) : null}
          </div>
        </Card>

        <Card onClick={onGoAnalytics} style={{ marginTop: 14, cursor: 'pointer' }}>
          <div className="v2-row-between" style={{ gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 42,
                  height: 42,
                  flex: 'none',
                  borderRadius: 14,
                  color: 'var(--v2-accent)',
                  background: 'var(--v2-accent-soft)',
                }}
              >
                <Icon name="trendUp" size={21} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 15 }}>
                  Ouvrir mon tableau analytique
                </span>
                <span className="v2-muted" style={{ display: 'block', fontSize: 12 }}>
                  Mouvements du coffre, visibilité Zando et résultats trading
                </span>
              </span>
            </div>
            <Icon name="forward" size={18} style={{ flex: 'none', color: 'var(--v2-ink-3)' }} />
          </div>
        </Card>
        {switchTarget && (
          <>
            <button
              type="button"
              className="v2-switch-btn"
              style={{ marginTop: 14 }}
              onClick={() => setSwitchOpen(true)}
            >
              <Icon name="swap" size={20} />
              <span style={{ flex: 1 }}>
                Basculer vers {switchTarget === 'profil2' ? 'Profil 2' : 'Profil 1'}
              </span>
              <Icon name="forward" size={18} />
            </button>
            <div className="v2-switch-btn-sub">
              {switchTarget === 'profil2'
                ? 'Coffre Propriétaire → Coffre Personnel'
                : 'Coffre Personnel → Coffre Propriétaire'}
            </div>
          </>
        )}
      </div>
      )}

      {settingsOpen && (
      <div className="v2-pad">
        <div className="v2-section-title">Compte</div>
        <List>
          <Row
            icon="user"
            iconTone="accent"
            title="Pseudo public"
            subtitle={pseudoLabel || 'Non défini'}
            right={<span className="v2-muted" style={{ fontSize: 12 }}>Seule identité visible des autres</span>}
          />
          <Row
            icon="edit"
            title="Modifier mon profil"
            subtitle="Photo, présentation et informations personnelles"
            chevron
            onClick={() => setSheet('edit')}
          />
          {!kycVerified && (
            <Row
              icon="shield"
              title="Vérification d’identité"
              subtitle="Compléter ou reprendre mon KYC"
              chevron
              onClick={onGoKyc}
            />
          )}
          <Row
            icon="lock"
            title="Sécurité du compte"
            subtitle={pinConfigured ? `PIN actif · ${pinLength} chiffres` : 'Configurer un code PIN'}
            chevron
            onClick={() => setSheet('security')}
          />
          <Row
            icon="key"
            title="Récupération du compte"
            subtitle={
              infos.data?.phone_verified
                ? 'Numéro vérifié'
                : infos.data?.recovery_phone
                  ? 'Numéro enregistré, non vérifié'
                  : 'Ajouter un téléphone de secours'
            }
            chevron
            onClick={ouvrirRecuperation}
          />
          <Row
            icon="device"
            title="Appareils connectés"
            subtitle={devices.loading ? 'Chargement…' : `${(devices.data?.devices || []).length} appareil(s)`}
            chevron
            onClick={() => setSheet('devices')}
          />
          <Row
            icon="market"
            title="Mes offres Zando"
            subtitle="Publier et gérer mes annonces"
            chevron
            onClick={() => setSheet('mesAnnonces')}
          />
          <Row
            icon="play"
            title="Lecteur UQ"
            subtitle="Suivi du temps et des gains"
            chevron
            onClick={onGoPlayer}
          />
          {onGoMail && (
            <Row
              icon="mail"
              title="UQ Mail"
              subtitle="Boîte mail @votre-domaine — réception et OTP"
              chevron
              onClick={onGoMail}
            />
          )}
          {onGoSms && (
            <Row
              icon="phone"
              title="UQ SMS"
              subtitle="Numéro relais UQ — ton vrai numéro reste privé"
              chevron
              onClick={onGoSms}
            />
          )}
          {isOwner && onGoOwner && (
            <Row
              icon="lock"
              iconTone="amber"
              title="Coffre propriétaire"
              subtitle="Réserve de sécurité et répartition"
              chevron
              onClick={onGoOwner}
            />
          )}
        </List>

        <div className="v2-section-title">Confidentialité</div>
        <Card>
          <div className="v2-muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Choisis qui peut consulter chaque information sur ton profil. « Amis » signifie que vous
            vous suivez mutuellement. Les compteurs publics restent visibles par tous.
          </div>
          <div className="v2-stack" style={{ gap: 12 }}>
            {PRIVACY_FIELDS.map(({ key, label }) => (
              <label
                key={key}
                className="v2-row-between"
                style={{ gap: 12, fontSize: 12.5, fontWeight: 600 }}
              >
                <span>{label}</span>
                <select
                  className="v2-input"
                  aria-label={`Visibilité : ${label}`}
                  value={accountPreferences[key] || 'private'}
                  onChange={(event) =>
                    void saveAccountPreferences({ [key]: event.target.value as Preferences[typeof key] })
                  }
                  style={{ width: 140, minHeight: 38, padding: '4px 8px' }}
                >
                  <option value="private">Moi uniquement</option>
                  <option value="friends">Amis</option>
                  <option value="public">Public</option>
                </select>
              </label>
            ))}
          </div>
        </Card>

        <div className="v2-section-title">Mon identité UQ</div>
        <Hint>
          Le numéro UQ et l’email de connexion restent privés. Le pseudo est public; le nom affiché
          suit le réglage de confidentialité ci-dessus.
        </Hint>
        <List>
          {[
            {
              cle: 'numero',
              icone: 'qr' as const,
              titre: 'Numéro UQ',
              aide: 'Sert à te connecter',
              valeur: String(infos.data?.uq_number || uq || ''),
            },
            {
              cle: 'email',
              icone: 'mail' as const,
              titre: 'Email UQ',
              aide: 'Sert aussi à te connecter',
              valeur: String(infos.data?.email || email || ''),
            },
            {
              cle: 'promo',
              icone: 'gift' as const,
              titre: 'Code promo',
              aide: 'Partage-le pour parrainer un proche',
              valeur: String(infos.data?.code_promo || ''),
            },
          ].map((champ) => (
            <Row
              key={champ.cle}
              icon={champ.icone}
              title={champ.titre}
              subtitle={champ.aide}
              right={
                <span className="v2-private">
                  <span className="v2-private-value" data-cache={!reveal[champ.cle]}>
                    {infos.loading
                      ? '…'
                      : reveal[champ.cle]
                        ? champ.valeur || '—'
                        : '••••••••'}
                  </span>
                  <button
                    type="button"
                    className="v2-icon-btn"
                    aria-label={reveal[champ.cle] ? `Masquer ${champ.titre}` : `Afficher ${champ.titre}`}
                    onClick={() => reveiller(champ.cle)}
                    disabled={!champ.valeur}
                  >
                    <Icon name={reveal[champ.cle] ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                  <button
                    type="button"
                    className="v2-icon-btn"
                    aria-label={`Copier ${champ.titre}`}
                    onClick={() => void copier(champ.cle, champ.valeur)}
                    disabled={!champ.valeur}
                  >
                    <Icon name={copiedKey === champ.cle ? 'check' : 'copy'} size={16} />
                  </button>
                </span>
              }
            />
          ))}
        </List>

        <div className="v2-section-title">Préférences</div>
        <Card>
          <div className="v2-label">Apparence</div>
          <div style={{ marginTop: 8 }}>
            <Segmented
              value={themePreference}
              onChange={setThemePreference}
              options={[
                { value: 'light', label: 'Clair' },
                { value: 'dark', label: 'Sombre' },
                { value: 'auto', label: 'Auto' },
              ]}
            />
          </div>

          <div className="v2-label" style={{ marginTop: 16 }}>
            Taille du texte
          </div>
          <div style={{ marginTop: 8 }}>
            <Segmented
              value={fontScale}
              onChange={setFontScale}
              options={[
                { value: 'small', label: 'Petit' },
                { value: 'medium', label: 'Normal' },
                { value: 'large', label: 'Grand' },
                { value: 'xlarge', label: 'XL' },
              ]}
            />
          </div>

          <div className="v2-label" style={{ marginTop: 16 }}>
            Devise d’affichage
          </div>
          <div style={{ marginTop: 8 }}>
            <select
              className="v2-input"
              value={currency}
              onChange={(event) => saveCurrency(event.target.value)}
            >
              {currencyOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <div className="v2-section-title">Notifications</div>
        <List>
          {NOTIFICATION_PREFERENCES.map(({ key, label }) => (
            <Row
              key={key}
              icon={key === 'notify_chat' ? 'chat' : key === 'notify_wallet' ? 'wallet' : key === 'notify_trading' ? 'trendUp' : key === 'notify_zando' ? 'market' : 'shield'}
              title={label}
              right={
                <input
                  type="checkbox"
                  aria-label={`Notifications : ${label}`}
                  checked={preferenceEnabled(accountPreferences[key])}
                  onChange={(event) => void saveAccountPreferences({ [key]: event.target.checked })}
                />
              }
            />
          ))}
          <Row
            icon="bell"
            title="Sons de notification"
            subtitle={notifications.soundEnabled ? 'Activés sur cet appareil' : 'Désactivés sur cet appareil'}
            right={
              <input
                type="checkbox"
                aria-label="Sons de notification"
                checked={notifications.soundEnabled}
                onChange={notifications.toggleSound}
              />
            }
          />
        </List>

        <div className="v2-section-title">Robinet</div>
        <List>
          <Row
            icon="market"
            title="Présence de mes boutiques"
            subtitle={
              preferenceEnabled(accountPreferences.robinet_vitrine)
                ? 'Autorisé à couler, seconde par seconde'
                : 'Coupé : plus aucun prélèvement continu'
            }
            right={
              <input
                type="checkbox"
                aria-label="Robinet : présence de mes boutiques"
                checked={preferenceEnabled(accountPreferences.robinet_vitrine)}
                onChange={(event) => void enregistrerRobinet(event.target.checked)}
              />
            }
          />
        </List>
        <Card>
          <div className="v2-muted">
            Le frais de présence sort du coffre en continu, à partir de la valeur du catalogue
            publié de tes boutiques. Le pourcentage exact s’affiche sur la fiche de présence de
            chaque boutique, dans le Studio. En coupant ce robinet, la facturation s’arrête
            immédiatement et les vitrines passent hors ligne : elles restent dans ton compte,
            rien n’est effacé. Rien ne repart sans un geste PIN — prolonger une présence est
            justement ce geste.
          </div>
        </Card>

        <div className="v2-section-title">Informations</div>
        <Card>
          {me.loading ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <Skeleton height={16} width="55%" />
              <Skeleton height={16} width="42%" />
            </div>
          ) : (
            <>
              <KeyValue label="Membre depuis" value={me.data?.me?.created_at ? formatDate(me.data.me.created_at) : '—'} />
              <KeyValue label="Pseudo" value={pseudo || '—'} />
              <KeyValue label="Emploi" value={form.emploi || '—'} />
              <KeyValue label="Ville" value={form.ville_actuelle || form.ville_provenance || '—'} />
              <KeyValue label="Mobile money" value={form.mobile_money_number || '—'} />
            </>
          )}
        </Card>

        <div className="v2-section-title">Données et suggestions</div>
        <List>
          <Row
            icon="sparkles"
            iconTone="accent"
            title="Suggestions et confidentialité"
            subtitle="Apprentissage local, export et suppression"
            chevron
            onClick={() => setSheet('learning')}
          />
        </List>

        {onGoPolitiques && (
          <>
            <div className="v2-section-title">Légal & règles</div>
            <List>
              <Row
                icon="file"
                iconTone="accent"
                title="Politiques & règles UQ"
                subtitle="23 sujets — conditions, réputation, sanctions, marketplace, hors UQ"
                chevron
                onClick={onGoPolitiques}
              />
            </List>
          </>
        )}

        <div className="v2-section-title">Session</div>
        <List>
          <Row
            icon="sparkles"
            iconTone="accent"
            title="Guide & aide"
            subtitle="Trading · P2P · Coffre · KYC"
            chevron
            onClick={() => help.openHelp()}
          />
          <Row icon="info" title="À propos de UQ" subtitle="Version, réseau et blockchain" chevron onClick={() => setSheet('about')} />
          <Row
            icon="logout"
            title="Se déconnecter"
            subtitle="Fermer la session sur cet appareil"
            chevron
            onClick={() => {
              signOut();
              toast('Session fermée');
            }}
          />
        </List>

        <div style={{ height: 12 }} />
      </div>
      )}

      {/* ---------------- Mes annonces Zando ---------------- */}
      <Sheet
        open={sheet === 'mesAnnonces'}
        onClose={() => setSheet(null)}
        title="Mes annonces Zando"
        subtitle="Tes annonces publiees et brouillons"
        footer={
          onCreateZando ? (
            <Button block icon="plus" onClick={onCreateZando}>
              Nouvelle annonce
            </Button>
          ) : undefined
        }
      >
        {mesAnnonces.loading ? (
          <Loader label="Chargement des annonces..." />
        ) : (
          (() => {
            const items = (mesAnnonces.data?.items || []).filter(
              (it) => zandoOwner(it) === uq,
            );
            if (items.length === 0) {
              return (
                <div className="v2-muted" style={{ textAlign: 'center', padding: 20 }}>
                  Aucune annonce pour l'instant.
                  {onCreateZando && (
                    <div style={{ marginTop: 12 }}>
                      <Button size="sm" icon="plus" onClick={onCreateZando}>
                        Creer ma premiere annonce
                      </Button>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item) => {
                  const peutEditer = (item.edit_count || 0) < 2 && !item.sold;
                  const statut = item.sold
                    ? 'Vendu'
                    : !item.published
                    ? 'Brouillon'
                    : 'Publie';
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: 12,
                        background: 'var(--v2-surface-2)',
                        borderRadius: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          background: item.media_urls
                            ? `url(${item.media_urls}) center/cover`
                            : 'var(--v2-surface-3)',
                          flex: 'none',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 650, fontSize: 14 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--v2-ink-3)' }}>
                          {statut} · {item.price_borb} FC
                        </div>
                        {item.edit_count !== undefined && (
                          <div style={{ fontSize: 11, color: 'var(--v2-ink-3)' }}>
                            Modifications : {item.edit_count}/2
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon="edit"
                          disabled={!peutEditer || !onEditZando}
                          onClick={() => onEditZando && onEditZando(item)}
                        >
                          Modifier
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </Sheet>

      {/* ---------------- Modifier le profil ---------------- */}
      <Sheet
        open={sheet === 'edit'}
        onClose={() => setSheet(null)}
        title="Modifier mon profil"
        subtitle="La visibilité de tes informations se règle dans Confidentialité"
        footer={
          <Button block loading={busy} icon="check" onClick={saveProfile}>
            Enregistrer
          </Button>
        }
      >
        <div className="v2-stack">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar label={initials(identityTitle || pseudoLabel)} src={photo || undefined} size={56} />
            <Button variant="secondary" size="sm" loading={busy} icon="camera" onClick={importAvatar}>
              Importer une image
            </Button>
          </div>
          <div className="v2-muted" style={{ fontSize: 12 }}>
            PNG, JPEG ou WebP · compressée sur l’appareil (max {formatBytes(AVATAR_MAX_BYTES)}).
          </div>

          <Field label="Ou coller une URL d’image" hint="Lien http(s) vers le visuel">
            <Input
              value={form.photo_url}
              onChange={(event) => setForm({ ...form, photo_url: event.target.value })}
              placeholder="https://…"
            />
          </Field>
          <Button variant="secondary" size="sm" loading={busy} onClick={saveAvatar} icon="check">
            Enregistrer cette URL
          </Button>

          <Field label="Emploi">
            <Input
              value={form.emploi}
              onChange={(event) => setForm({ ...form, emploi: event.target.value })}
              placeholder="Ex. commerçant, enseignant…"
            />
          </Field>
          <Field label="Ville de résidence">
            <Input
              value={form.ville_actuelle}
              onChange={(event) => setForm({ ...form, ville_actuelle: event.target.value })}
              placeholder="Ex. Kinshasa"
            />
          </Field>
          <Field label="Ville d’origine">
            <Input
              value={form.ville_provenance}
              onChange={(event) => setForm({ ...form, ville_provenance: event.target.value })}
              placeholder="Ex. Lubumbashi"
            />
          </Field>
          <Field label="Situation maritale">
            <select
              className="v2-input"
              value={form.statut_marital}
              onChange={(event) => setForm({ ...form, statut_marital: event.target.value })}
            >
              <option value="">Non précisé</option>
              <option value="celibataire">Célibataire</option>
              <option value="marie">Marié(e)</option>
              <option value="divorce">Divorcé(e)</option>
              <option value="veuf">Veuf/Veuve</option>
            </select>
          </Field>
          <Field label="Mobile money">
            <Input
              value={form.mobile_money_number}
              onChange={(event) => setForm({ ...form, mobile_money_number: event.target.value })}
              placeholder="+243…"
              inputMode="tel"
            />
          </Field>
          <Field label="Opérateur">
            <Input
              value={form.mobile_money_operator}
              onChange={(event) => setForm({ ...form, mobile_money_operator: event.target.value })}
              placeholder="M-Pesa, Orange Money, Airtel…"
            />
          </Field>
          <Field label="Présentation" hint="Quelques mots sur toi">
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              placeholder="Ce que tu fais, ce que tu proposes…"
            />
          </Field>
        </div>
      </Sheet>

      {/* ---------------- Sécurité ---------------- */}
      <Sheet
        open={sheet === 'security'}
        onClose={() => setSheet(null)}
        title="Sécurité"
        subtitle="PIN et mot de passe"
      >
        <div className="v2-stack">
          <Card>
            <KeyValue label="Code PIN" value={pinConfigured ? `Actif (${pinLength} chiffres)` : 'Non configuré'} />
            <KeyValue label="Longueur autorisée" value={`${PIN_MIN_LENGTH} à ${PIN_MAX_LENGTH} chiffres`} />
          </Card>

          {pinConfigured && (
            <Field label="Ancien code PIN" hint={`${pinLength} chiffres`}>
              <Input
                value={oldPin}
                onChange={(event) => setOldPin(event.target.value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))}
                inputMode="numeric"
                type="password"
                autoComplete="one-time-code"
                placeholder="••••"
              />
            </Field>
          )}
          <Field
            label={pinConfigured ? 'Nouveau code PIN' : 'Créer un code PIN'}
            hint={`${PIN_MIN_LENGTH} à ${PIN_MAX_LENGTH} chiffres`}
          >
            <Input
              value={newPin}
              onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              placeholder="••••"
            />
          </Field>
          <Field label="Confirmer le nouveau code PIN">
            <Input
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH))}
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              placeholder="••••"
            />
          </Field>
          <Field label="Mot de passe du compte" hint="Requis par le backend pour modifier le PIN">
            <Input
              value={pinPassword}
              onChange={(event) => setPinPassword(event.target.value)}
              type="password"
              placeholder="••••••••"
            />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button loading={busy} onClick={savePin} icon="check" style={{ flex: 1 }}>
              {pinConfigured ? 'Modifier le PIN' : 'Enregistrer le PIN'}
            </Button>
            {pinConfigured && (
              <Button variant="danger" onClick={deletePin} icon="trash">
                Retirer
              </Button>
            )}
          </div>

          <div className="v2-divider" />

          <Field label="Mot de passe actuel">
            <Input
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              type="password"
            />
          </Field>
          <Field label="Nouveau mot de passe" hint="6 caractères minimum">
            <Input
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              type="password"
            />
          </Field>
          <Button variant="secondary" loading={busy} onClick={savePassword} icon="lock">
            Modifier le mot de passe
          </Button>
        </div>
      </Sheet>

      {/* ---------------- Récupération du compte ---------------- */}
      <Sheet
        open={sheet === 'recovery'}
        onClose={() => setSheet(null)}
        title="Récupération du compte"
        subtitle="Les secours utilisés si tu perds ton mot de passe"
        footer={
          <Button block loading={recBusy} icon="check" onClick={() => void saveRecovery()}>
            Enregistrer
          </Button>
        }
      >
        <div className="v2-stack">
          <Card>
            <KeyValue
              label="Téléphone"
              value={
                infos.data?.recovery_phone
                  ? `${infos.data.recovery_phone}${infos.data.phone_verified ? ' · vérifié' : ' · non vérifié'}`
                  : 'Aucun'
              }
            />
            <KeyValue
              label="Email de secours"
              value={
                infos.data?.recovery_email
                  ? `${infos.data.recovery_email}${infos.data.email_verified ? ' · vérifié' : ' · non vérifié'}`
                  : 'Aucun'
              }
            />
          </Card>

          <Field label="Téléphone de récupération" hint="Format international, ex. +243 81 000 0000">
            <Input
              value={recPhone}
              onChange={(event) => {
                setRecPhone(event.target.value);
                setRecNumero(null);
                setRecJeton('');
                setRecPreuve('');
                setRecCode('');
              }}
              inputMode="tel"
              autoComplete="tel"
              placeholder="+243 81 000 0000"
            />
          </Field>

          {recNumero && (
            <Hint>
              {recNumero.valide
                ? `${recNumero.pays || ''}${recNumero.operateur ? ` · ${recNumero.operateur}` : ''} — ${recNumero.e164}`
                : 'Numéro non reconnu : indicatif ou longueur d’abonné inconnue.'}
            </Hint>
          )}

          {recNumero?.valide && !recPreuve && (
            <Button variant="secondary" loading={recBusy} icon="send" onClick={() => void envoyerCodeRecuperation()}>
              {recJeton ? 'Code déjà demandé' : 'Recevoir le code par SMS'}
            </Button>
          )}

          {recJeton && !recPreuve && (
            <>
              <Field label="Code reçu" hint="6 chiffres">
                <Input
                  value={recCode}
                  onChange={(event) => setRecCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                />
              </Field>
              <Button
                variant="secondary"
                loading={recBusy}
                icon="shield"
                onClick={() => void validerCodeRecuperation()}
                disabled={recCode.length !== 6}
              >
                Vérifier le code
              </Button>
            </>
          )}

          {recPreuve && (
            <div className="v2-auth-verified">
              <Icon name="check" size={18} />
              Numéro vérifié : {recPhone}
            </div>
          )}

          {recMessage && <Hint>{recMessage}</Hint>}
          {recError && <Hint tone="warning" icon="alert">{recError}</Hint>}

          <Field
            label="Email de récupération"
            hint="Uniquement pour prouver que le compte est le tien. Il ne remplace jamais ton email UQ."
          >
            <Input
              value={recEmail}
              onChange={(event) => setRecEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="vous@gmail.com"
            />
          </Field>
        </div>
      </Sheet>

      {/* ---------------- Appareils ---------------- */}
      <Sheet
        open={sheet === 'devices'}
        onClose={() => setSheet(null)}
        title="Appareils connectés"
        subtitle="Révoque un accès que tu ne reconnais pas"
      >
        {devices.loading ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <Skeleton height={44} radius={14} />
            <Skeleton height={44} radius={14} />
          </div>
        ) : devices.error ? (
          <ErrorBlock message={devices.error} onRetry={devices.reload} />
        ) : (devices.data?.devices || []).length === 0 ? (
          <div className="v2-muted" style={{ fontSize: 13 }}>
            Aucun appareil enregistré pour ce compte.
          </div>
        ) : (
          <List plain>
            {(devices.data?.devices || []).map((device) => {
              const name = device.device?.trim() || 'Appareil inconnu';
              return (
                <Row
                  key={name}
                  icon="device"
                  title={name}
                  subtitle={`${device.ip || 'IP inconnue'} · Dernière activité : ${
                    device.last_seen ? formatDate(Number(device.last_seen)) : '—'
                  }`}
                  right={
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!device.device}
                      onClick={() => setPendingRevoke(device.device)}
                    >
                      Déconnecter
                    </Button>
                  }
                />
              );
            })}
          </List>
        )}
      </Sheet>

      {/* ---------------- Confirmation de révocation ---------------- */}
      <Sheet
        open={Boolean(pendingRevoke)}
        onClose={() => {
          if (!revokeBusy) setPendingRevoke(null);
        }}
        title="Déconnecter cet appareil ?"
        subtitle={pendingRevoke || undefined}
      >
        <div className="v2-stack">
          <div className="v2-muted" style={{ fontSize: 13 }}>
            Toutes les sessions de cet appareil seront fermées. Tu pourras te reconnecter avec ton
            pseudo et ton mot de passe.
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Button
              variant="danger"
              block
              icon="logout"
              loading={revokeBusy}
              onClick={() => pendingRevoke && revoke(pendingRevoke)}
            >
              Déconnecter
            </Button>
            <Button
              variant="secondary"
              block
              disabled={revokeBusy}
              onClick={() => setPendingRevoke(null)}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Sheet>

      {/* ---------------- Suggestions et confidentialite ---------------- */}
      <Sheet
        open={sheet === 'learning'}
        onClose={() => {
          setSheet(null);
          setConfirmClearLearning(false);
        }}
        title="Suggestions et confidentialité"
        subtitle="Tout reste sur cet appareil"
      >
        <div className="v2-stack">
          <Card>
            <div className="v2-row-between" style={{ alignItems: 'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div className="v2-h3">Suggestions personnalisées</div>
                <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  Titres, descriptions, prix et recherches s’affinent à partir des offres et
                  publications consultées.
                </div>
              </div>
              <input
                type="checkbox"
                checked={learning.enabled}
                onChange={toggleLearning}
                aria-label="Activer les suggestions personnalisées"
                style={{ width: 20, height: 20, accentColor: 'var(--v2-accent)', flex: 'none' }}
              />
            </div>
          </Card>

          <Card>
            <KeyValue label="Publications lues" value={formatNumber(learning.sources.publications, 0)} />
            <KeyValue label="Offres lues" value={formatNumber(learning.sources.items, 0)} />
            <KeyValue label="Offres P2P lues" value={formatNumber(learning.sources.offers, 0)} />
            <KeyValue label="Recherches" value={formatNumber(learning.sources.searches, 0)} />
            {learning.lastSync > 0 && (
              <KeyValue label="Dernière lecture" value={formatDateTime(learning.lastSync)} />
            )}
          </Card>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" block icon="file" onClick={exportLearningFile}>
              Exporter
            </Button>
            {confirmClearLearning ? (
              <Button variant="danger" block icon="trash" onClick={clearLearningData}>
                Confirmer
              </Button>
            ) : (
              <Button
                variant="secondary"
                block
                icon="trash"
                onClick={() => setConfirmClearLearning(true)}
              >
                Supprimer
              </Button>
            )}
          </div>

          {confirmClearLearning && (
            <div className="v2-muted" style={{ fontSize: 12.5 }}>
              La suppression efface les statistiques et le cache local utilisés par les suggestions.
            </div>
          )}

          <Hint icon="shield">Aucune donnée n’est envoyée à un serveur externe.</Hint>
        </div>
      </Sheet>

      {/* ---------------- À propos ---------------- */}
      <Sheet open={sheet === 'about'} onClose={() => setSheet(null)} title="À propos" subtitle="UQ Platform">
        <div className="v2-stack">
          <Card>
            <KeyValue label="Application" value="UQ" />
            <KeyValue label="Canal" value="PWA / Web" />
            {/* Le numero UQ n'apparait pas : seuls le pseudo et le nom sont publics. */}
            <KeyValue label="Pseudo" value={pseudoLabel ? `@${pseudoLabel}` : '—'} />
            <KeyValue label="Statut KYC" value={kycStatut} />
          </Card>
          <div className="v2-muted" style={{ fontSize: 12.5 }}>
            UQ réunit le coffre, le marché Zando et les échanges communautaires dans une seule
            application. Toutes les opérations sont horodatées et vérifiables.
          </div>
        

      <ReputationTable
        open={reputationTableOpen}
        onClose={() => setReputationTableOpen(false)}
        pseudo={pseudoLabel || 'Membre UQ'}
        data={(me.data?.me as any)?.reputation || (statsPubliques.data as any)?.reputation || null}
        confiance={statsPubliques.data?.score_confiance?.total}
        noteMoyenne={statsPubliques.data?.stats?.note_moyenne}
        nbAvis={statsPubliques.data?.stats?.nb_avis}
      />
</div>
      </Sheet>

      {switchTarget && (
        <ProfileSwitchSheet
          open={switchOpen}
          target={switchTarget}
          onClose={() => setSwitchOpen(false)}
          onDone={(destination) => {
            setSwitchOpen(false);
            toast(
              destination === 'profil2' ? 'Basculé vers Profil 2' : 'Basculé vers Profil 1',
              'success',
            );
          }}
        />
      )}
      <AvatarCropSheet
        file={avatarFile}
        busy={busy}
        onClose={() => {
          if (!busy) setAvatarFile(null);
        }}
        onConfirm={saveCroppedAvatar}
      />
    </>
  );
}