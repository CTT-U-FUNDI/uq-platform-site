import { useState } from 'react';
import { Icon } from '../components/Icon';
import {
  Button,
  Card,
  ErrorBlock,
  Field,
  IconButton,
  Input,
  KeyValue,
  List,
  Row,
  ScreenHeader,
  Skeleton,
  UqInput,
} from '../components/Ui';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import {
  autoValidateKyc,
  describeError,
  getDistributionDelis,
  getDistributionTreasury,
  getGuardianToken,
  getRepartitionStatus,
  getTreasury1mStatus,
  getTreasuryWallets,
  guardianLogin,
  guardianLogout,
  rechargeTreasury1m,
  setGuardianToken,
  type Treasury1mState,
} from '../lib/api';
import { formatInt, formatNumber } from '../lib/format';

const UQ_PATTERN = /^UQ-\d+$/i;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Cle brute du backend -> libelle lisible ("stock_borb" -> "Stock (BORB)"). */
const labelize = (key: string) => {
  const text = key.replace(/_borb$/i, '').replace(/_/g, ' ').trim();
  const human = text.charAt(0).toUpperCase() + text.slice(1);
  return /_borb$/i.test(key) ? `${human} (BORB)` : human;
};

/**
 * Coffre proprietaire. Deux portes d'entree :
 *  1. le JWT de session porte deja le role "guardian" (connexion proprietaire
 *     via /api/secure/* ou /api/guardian/login) ;
 *  2. sinon une session gardien dediee, ouverte avec /api/guardian/login.
 * Ici, et seulement ici, le BORB est affiche en clair : tresor 1M BORB,
 * repartition 70/30, Profil 1/Profil 2, portefeuilles et validation KYC.
 */
export function OwnerVaultScreen({
  onBack,
  onOpenPersonal,
}: {
  onBack?: () => void;
  onOpenPersonal?: () => void;
}) {
  const { uq, email, role, isGuardian, toast } = useSession();

  const [guardianToken, setGuardianTokenState] = useState<string | null>(getGuardianToken());
  const access = isGuardian || Boolean(guardianToken);

  const [form, setForm] = useState({ number: uq, email: '', password: '' });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rechargeBusy, setRechargeBusy] = useState(false);

  // Validation KYC automatique par le proprietaire.
  const [kycTarget, setKycTarget] = useState('');
  const [kycEmail, setKycEmail] = useState('');
  const [kycOwnerEmail, setKycOwnerEmail] = useState('');
  const [kycBusy, setKycBusy] = useState(false);
  const [kycResult, setKycResult] = useState<{ ok: boolean; message: string } | null>(null);

  const data = useAsync(
    async () => {
      const [treasury, repartition, delis, treasuryP1, wallets] = await Promise.all([
        getTreasury1mStatus().catch(() => null),
        getRepartitionStatus().catch(() => null),
        getDistributionDelis().catch(() => null),
        getDistributionTreasury().catch(() => null),
        getTreasuryWallets().catch(() => null),
      ]);
      return { treasury, repartition, delis, treasuryP1, wallets };
    },
    [access, guardianToken],
    { enabled: access },
  );

  const model = data.data?.treasury as Treasury1mState | null | undefined;
  const tresor = model?.tresor_1m;
  const delis = (data.data?.delis || null) as Record<string, unknown> | null;
  const treasuryP1 = (data.data?.treasuryP1 || null) as Record<string, unknown> | null;
  const wallets = data.data?.wallets?.wallets || [];

  const target = Number(tresor?.cible_borb || 0);
  const balance = Number(tresor?.solde_borb || 0);
  const progress = target > 0 ? Math.min(100, (balance / target) * 100) : 0;

  const ownerEmail = email || kycOwnerEmail;

  const submitLogin = async () => {
    if (!form.number.trim() || !form.email.trim() || !form.password) {
      setLoginError('Renseigne l’identifiant, l’email et le mot de passe du gardien.');
      return;
    }
    setLoginBusy(true);
    setLoginError('');
    try {
      const result = await guardianLogin({
        number: form.number.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      if (result?.token) {
        setGuardianToken(result.token);
        setGuardianTokenState(result.token);
        setForm((current) => ({ ...current, password: '' }));
        toast('Session gardien ouverte', 'success');
      } else {
        // Le backend cite les tentatives restantes : on n'affiche qu'un texte neutre.
        setLoginError('Identifiants incorrects.');
      }
    } catch (error) {
      setLoginError(describeError(error, 'Connexion gardien impossible.'));
    } finally {
      setLoginBusy(false);
    }
  };

  const signOutGuardian = async () => {
    // La route de deconnexion exige la cle terminal : on efface le jeton local,
    // qui expire de lui-meme cote backend (24 h).
    await guardianLogout();
    setGuardianToken(null);
    setGuardianTokenState(null);
  };

  const recharge = async () => {
    setRechargeBusy(true);
    try {
      const result = await rechargeTreasury1m(true);
      toast(
        (result as { recharged?: boolean })?.recharged === false
          ? 'Aucune recharge nécessaire'
          : 'Trésor rechargé',
        'success',
      );
      data.reload();
    } catch (error) {
      toast(describeError(error, 'Recharge impossible.'), 'error');
    } finally {
      setRechargeBusy(false);
    }
  };

  /**
   * POST /api/distribution/auto-validate-kyc
   * L'owner est identifie par son propre UQ + son email (verifies en base),
   * la cible par le couple UQ + email saisi ici.
   */
  const validateKyc = async () => {
    const target = kycTarget.trim().toUpperCase();
    const targetEmail = kycEmail.trim();
    const owner = uq.trim().toUpperCase();

    if (!UQ_PATTERN.test(target)) {
      setKycResult({ ok: false, message: 'Format UQ invalide.' });
      return;
    }
    if (!EMAIL_PATTERN.test(targetEmail)) {
      setKycResult({ ok: false, message: 'Format email invalide.' });
      return;
    }
    if (target === owner) {
      setKycResult({ ok: false, message: 'Impossible de valider le compte propriétaire.' });
      return;
    }
    if (!owner || !ownerEmail) {
      setKycResult({ ok: false, message: 'Email du propriétaire requis.' });
      return;
    }

    setKycBusy(true);
    setKycResult(null);
    try {
      const result = await autoValidateKyc({
        owner_uq: owner,
        owner_email: ownerEmail.trim(),
        target_uq: target,
        target_email: targetEmail,
      });
      const message = result?.message || `KYC de ${target} validé.`;
      setKycResult({ ok: true, message });
      setKycTarget('');
      setKycEmail('');
      toast(message, 'success');
    } catch (error) {
      setKycResult({ ok: false, message: describeError(error, 'Validation KYC impossible.') });
    } finally {
      setKycBusy(false);
    }
  };

  /** Rend une valeur venue du backend sans inventer d'unité. */
  const renderValue = (value: unknown) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return formatNumber(value, 2);
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderStats = (stats: Record<string, unknown> | null) => {
    if (!stats) return null;
    return Object.entries(stats).map(([key, value]) => (
      <KeyValue key={key} label={labelize(key)} value={renderValue(value)} />
    ));
  };

  if (!access) {
    return (
      <>
        <ScreenHeader title="Coffre propriétaire" subtitle="Accès gardien" onBack={onBack} />
        <div className="v2-pad">
          <Card>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: 'var(--v2-gold)', flex: 'none' }}>
                <Icon name="lock" size={22} />
              </span>
              <div>
                <div className="v2-h3">Réservé au propriétaire</div>
                <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  Ta session n’a pas le rôle gardien. Connecte-toi avec le compte propriétaire,
                  ou ouvre une session gardien ci-dessous. Trois échecs verrouillent le terminal.
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ marginTop: 12 }}>
            <div className="v2-stack">
              <Field label="Identifiant">
                <UqInput
                  value={form.number}
                  onChange={(number) => setForm({ ...form, number })}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="gardien@exemple.com"
                />
              </Field>
              <Field label="Mot de passe">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="••••••••"
                />
              </Field>
              {loginError && (
                <div style={{ fontSize: 13, color: 'var(--v2-negative)', fontWeight: 600 }}>
                  {loginError}
                </div>
              )}
              <Button block icon="lock" loading={loginBusy} onClick={submitLogin}>
                Ouvrir le coffre
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <ScreenHeader
        title="Coffre propriétaire"
        subtitle={`Rôle ${role} · trésor et répartition`}
        onBack={onBack}
        right={
          guardianToken ? (
            <IconButton name="logout" label="Fermer la session gardien" onClick={signOutGuardian} />
          ) : undefined
        }
      />

      {data.loading ? (
        <div className="v2-pad">
          <Skeleton height={170} radius={26} />
          <div style={{ height: 12 }} />
          <Skeleton height={120} radius={20} />
        </div>
      ) : data.error ? (
        <div className="v2-pad">
          <ErrorBlock message={data.error} onRetry={data.reload} />
        </div>
      ) : (
        <div className="v2-pad">
          <div className="v2-hero">
            <div className="v2-row-between" style={{ alignItems: 'flex-start' }}>
              <span className="v2-hero-label">Réserve de sécurité · {tresor?.profil || 'profil 1'}</span>
              <span className="v2-hero-pill" style={{ color: '#fff' }}>
                <Icon name="shield" size={13} /> BORB
              </span>
            </div>
            <div className="v2-hero-amount">
              {formatInt(balance)}
              <span style={{ fontSize: 15, marginLeft: 8, opacity: 0.85 }}>
                / {formatInt(target)} BORB
              </span>
            </div>
            <div className="v2-hero-meta">
              <span className="v2-hero-pill">{formatNumber(progress, 1)} % de la cible</span>
              {tresor?.transferable === false && <span style={{ opacity: 0.85 }}>non transférable</span>}
            </div>
          </div>

          {tresor && (
            <Card style={{ marginTop: 12 }}>
              <KeyValue label="Source" value={tresor.source || '—'} />
              <KeyValue label="Seuil de recharge" value={`${formatInt(tresor.seuil_recharge_borb || 0)} BORB`} />
              <KeyValue
                label="Recharge nécessaire"
                value={tresor.recharge_necessaire ? 'Oui' : 'Non'}
              />
              <KeyValue label="Réserve océanique" value={`${formatInt(model?.ocean_borb || 0)} BORB`} />
              {model?.invariant_ok !== undefined && (
                <KeyValue label="Invariant du système" value={model.invariant_ok ? 'Valide' : 'Rompue'} />
              )}
              {tresor.note && (
                <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                  {tresor.note}
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon="refresh"
                loading={rechargeBusy}
                style={{ marginTop: 12 }}
                onClick={recharge}
              >
                Recharger le trésor
              </Button>
            </Card>
          )}

          <div className="v2-section-title">Répartition 70 / 30</div>
          <Card>
            <KeyValue
              label="Déjà réparti"
              value={data.data?.repartition?.deja_reparti ? 'Oui' : 'Non'}
            />
            {renderStats(treasuryP1)}
          </Card>

          <div className="v2-section-title">Profil 2 · Delis</div>
          <Card>
            {delis && Object.keys(delis).length > 0 ? (
              renderStats(delis)
            ) : (
              <div className="v2-muted">Aucune donnée.</div>
            )}
          </Card>

          <div className="v2-section-title">Validation KYC</div>
          <Card>
            <div className="v2-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
              Valider le KYC d’un utilisateur avec son identifiant UQ et l’email du compte.
              Le backend vérifie d’abord l’identité du propriétaire.
            </div>
            <div className="v2-stack">
              <Field label="UQ de l’utilisateur">
                <UqInput value={kycTarget} onChange={setKycTarget} placeholder="000000000" />
              </Field>
              <Field label="Email de l’utilisateur">
                <Input
                  type="email"
                  value={kycEmail}
                  onChange={(event) => setKycEmail(event.target.value)}
                  placeholder="utilisateur@exemple.com"
                  autoComplete="off"
                />
              </Field>
              {!email && (
                <Field
                  label="Email du propriétaire"
                  hint="Requis quand la session ne le fournit pas"
                >
                  <Input
                    type="email"
                    value={kycOwnerEmail}
                    onChange={(event) => setKycOwnerEmail(event.target.value)}
                    placeholder="proprietaire@exemple.com"
                    autoComplete="off"
                  />
                </Field>
              )}

              {kycResult && (
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: kycResult.ok ? 'var(--v2-positive)' : 'var(--v2-negative)',
                  }}
                >
                  {kycResult.message}
                </div>
              )}

              <Button
                block
                icon="shield"
                loading={kycBusy}
                disabled={!kycTarget.trim() || !kycEmail.trim()}
                onClick={validateKyc}
              >
                Valider KYC
              </Button>
            </div>
          </Card>

          <div className="v2-section-title">Portefeuilles de trésorerie</div>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {wallets.length === 0 ? (
              <div className="v2-muted" style={{ padding: 16 }}>
                Aucun portefeuille configuré.
              </div>
            ) : (
              <List plain>
                {wallets.map((wallet) => (
                  <Row
                    key={`${wallet.crypto_type}-${wallet.wallet_address}`}
                    icon="wallet"
                    title={wallet.label || wallet.crypto_type || 'Portefeuille'}
                    subtitle={wallet.wallet_address || '—'}
                    right={
                      wallet.is_default ? <span className="v2-badge v2-badge--accent">défaut</span> : undefined
                    }
                  />
                ))}
              </List>
            )}
          </Card>

          {onOpenPersonal && (
            <Button
              block
              variant="secondary"
              icon="wallet"
              style={{ marginTop: 12 }}
              onClick={onOpenPersonal}
            >
              Ouvrir mon coffre personnel
            </Button>
          )}

          <div style={{ height: 8 }} />
        </div>
      )}
    </>
  );
}
