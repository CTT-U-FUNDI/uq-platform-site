import { useEffect, useState } from 'react';
import { Avatar, Button, Card, ErrorBlock, Sheet, Skeleton } from './Ui';
import { Icon } from './Icon';
import { useAsync, usePolling } from '../lib/hooks';
import { useSession } from '../lib/session';
import { describeError, followUser, getProfileStats, unfollowUser } from '../lib/api';
import { formatCount } from '../lib/format';
import { ReputationTable } from './ReputationTable';
import { ReputationPolicySheet } from './ReputationPolicySheet';
import { NetworkRequestSheet } from './NetworkRequestSheet';

/**
 * Profil public d'un membre : identité, trois compteurs publics et actions.
 * Les valeurs affichées proviennent du endpoint de statistiques du profil.
 */
export function PublicProfileSheet({
  pseudo,
  onClose,
  onContact,
}: {
  pseudo: string;
  onClose: () => void;
  onContact?: (pseudo: string) => void;
}) {
  const { toast } = useSession();
  const profil = useAsync(() => getProfileStats(pseudo), [pseudo], { enabled: Boolean(pseudo) });

  usePolling(() => profil.reload(), 8000, Boolean(pseudo));

  const [suiviBusy, setSuiviBusy] = useState(false);

  // L'état « suivi » vient du backend ; on le garde localement le temps de l'appel.
  const [suit, setSuit] = useState<boolean | null>(null);
  const [reputationTableOpen, setReputationTableOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [networkSheetOpen, setNetworkSheetOpen] = useState(false);
  useEffect(() => {
    setSuit(null);
  }, [pseudo]);
  const suitMaintenant = suit ?? Boolean(profil.data?.vous_suivez_deja);

  const basculerSuivi = async () => {
    if (suiviBusy) return;
    setSuiviBusy(true);
    const cible = profil.data?.pseudo || pseudo;
    try {
      if (suitMaintenant) {
        const resultat = await unfollowUser(cible);
        setSuit(false);
        profil.setData(
          profil.data
            ? {
                ...profil.data,
                vous_suivez_deja: false,
                stats: { ...profil.data.stats, total_abonnes: resultat.total_abonnes },
              }
            : profil.data,
        );
      } else {
        const resultat = await followUser(cible);
        setSuit(true);
        profil.setData(
          profil.data
            ? {
                ...profil.data,
                vous_suivez_deja: true,
                stats: { ...profil.data.stats, total_abonnes: resultat.total_abonnes },
              }
            : profil.data,
        );
      }
    } catch (error) {
      toast(describeError(error, 'Action impossible.'), 'error');
    } finally {
      setSuiviBusy(false);
    }
  };

  const data = profil.data;
  const stats = data?.stats;
  const score = data?.score_confiance;
  /** Le pseudo du backend s'affiche partout ; l'identifiant technique reste invisible. */
  const pseudoAffiche = data?.pseudo || 'Membre UQ';
  /** Pastilles de réputation sous le compteur Confiance (vert/blanc/orange/rouge/noir). */
  const reputation = stats?.reputation;
  const pastillesReputation = reputation
    ? ([
        ['vert', '#22c55e'],
        ['blanc', '#e5e7eb'],
        ['orange', '#f97316'],
        ['rouge', '#ef4444'],
        ['noir', '#111827'],
      ] as const).filter(([key]) => (reputation[key] ?? 0) > 0)
    : [];
  /** Anneau coloré autour de l'avatar : couleur dominante calculée par le backend. */
  const couleurAnneau = data?.couleur_anneau;
  /** Contact réservé aux amis : `est_ami` = amitié mutuelle acceptée côté backend. */
  const estAmi = data?.est_ami;
  const nbReseaux = formatCount(stats?.total_reseaux ?? stats?.total_abonnes ?? 0);

  return (
    <Sheet
      open={Boolean(pseudo)}
      onClose={onClose}
      title="Profil public"
    >
      <div className="v2-stack">
        {profil.loading && !data ? (
          <>
            <Skeleton height={112} radius={16} />
            <Skeleton height={64} radius={14} />
          </>
        ) : profil.error && !data ? (
          <ErrorBlock message={profil.error} onRetry={profil.reload} />
        ) : (
          <>
            <Card>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    borderRadius: '50%',
                    border: couleurAnneau ? `3px solid ${couleurAnneau}` : '3px solid transparent',
                    lineHeight: 0,
                  }}
                >
                  <Avatar label={pseudoAffiche} src={data?.avatar_url} size={96} />
                </div>
                <div style={{ minWidth: 0, marginTop: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em' }}>
                    {data?.name || 'Membre UQ'}
                  </div>
                  <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {pseudoAffiche.replace(/^@+/, '')}
                  </div>
                  {stats?.kyc_verifie ? (
                    <span className="v2-badge v2-badge--positive" style={{ marginTop: 7 }}>
                      <Icon name="shield" size={13} /> Identité vérifiée
                    </span>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--v2-line)',
                  display: 'flex',
                }}
              >
                {(
                  [
                    {
                      icon: 'heart' as const,
                      value: formatCount(stats?.total_likes_recus ?? 0),
                      label: 'Mentions J’aime',
                    },
                    {
                      icon: 'users' as const,
                      value: nbReseaux,
                      label: 'Réseaux',
                    },
                    {
                      icon: 'shield' as const,
                      value: `${score?.total ?? 0}%`,
                      label: 'Confiance',
                      pastilles: pastillesReputation,
                    },
                  ] as const
                ).map((item) => (
                  <div key={item.label} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      <Icon name={item.icon} size={15} />
                      {item.value}
                    </div>
                    <div className="v2-muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {item.label}
                    </div>
                    {'pastilles' in item && item.pastilles.length > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 4 }}>
                        {item.pastilles.map(([key, couleur]) => (
                          <span
                            key={key}
                            title={key}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: couleur,
                              border: key === 'blanc' ? '1px solid #9ca3af' : 'none',
                              display: 'inline-block',
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setReputationTableOpen(true)}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: '8px 0',
                  border: 0,
                  borderTop: '1px solid var(--v2-line)',
                  background: 'transparent',
                  color: 'var(--v2-ink-2)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Avis : {(stats?.note_moyenne ?? 0).toFixed(1)}/5 ({stats?.nb_avis ?? 0} avis)
              </button>
            </Card>

            {data?.public_profile && Object.values(data.public_profile).some(Boolean) ? (
              <Card>
                <div style={{ fontWeight: 750, fontSize: 14, marginBottom: 8 }}>À propos</div>
                {data.public_profile.description ? (
                  <>
                    <div style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>
                      {data.public_profile.description}
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid var(--v2-line)',
                        margin: '0 -16px 10px',
                      }}
                    />
                  </>
                ) : null}
                <div className="v2-stack" style={{ gap: 8 }}>
                  {(
                    [
                      ['Profession', data.public_profile.occupation],
                      ['Situation familiale', data.public_profile.marital_status],
                      ['Ville', data.public_profile.city],
                      ['Mobile money', data.public_profile.mobile_money_number],
                      ['Originaire de', data.public_profile.origin_city],
                      ['Devise de trading', data.public_profile.trading_currency],
                    ] as Array<[string, string | undefined]>
                  )
                    .filter((entry): entry is [string, string] => Boolean(entry[1]))
                    .map(([label, value]) => (
                      <div className="v2-row-between" key={label}>
                        <span className="v2-muted">{label}</span>
                        <span style={{ fontWeight: 650, textAlign: 'right' }}>{value}</span>
                      </div>
                    ))}
                </div>
              </Card>
            ) : null}

            <button
              type="button"
              onClick={() => setLegendOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '11px 0',
                borderRadius: 12,
                border: '1px solid var(--v2-line)',
                background: 'var(--v2-surface-2)',
                color: 'var(--v2-ink)',
                fontSize: 13.5,
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              <Icon name="book" size={16} /> Politique de réputation
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant={suitMaintenant ? 'secondary' : 'primary'}
                block
                loading={suiviBusy}
                onClick={basculerSuivi}
                icon="user"
                style={{ flex: 1 }}
              >
                {suitMaintenant ? 'Suivi' : 'Suivre'}
              </Button>
              <Button
                variant="secondary"
                block
                onClick={() => setNetworkSheetOpen(true)}
                icon="users"
                style={{ flex: 1 }}
              >
                Construire
              </Button>
            </div>
            {onContact && estAmi !== false ? (
              <Button
                variant="outline"
                block
                icon="chat"
                onClick={() => onContact(data?.pseudo || pseudo)}
              >
                Contacter
              </Button>
            ) : null}
          </>
        )}
      </div>
      <ReputationPolicySheet open={legendOpen} onClose={() => setLegendOpen(false)} />

      <ReputationTable
        open={reputationTableOpen}
        onClose={() => setReputationTableOpen(false)}
        pseudo={pseudoAffiche}
        data={stats?.reputation ?? null}
        confiance={score?.total}
        noteMoyenne={stats?.note_moyenne}
        nbAvis={stats?.nb_avis}
      />

      <NetworkRequestSheet
        open={networkSheetOpen}
        onClose={() => setNetworkSheetOpen(false)}
        destinataire={pseudo}
        pseudo={pseudoAffiche}
        onSuccess={() => {
          setNetworkSheetOpen(false);
          profil.reload();
        }}
      />
    </Sheet>
  );
}
