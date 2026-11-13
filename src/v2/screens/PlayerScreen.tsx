import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  Button,
  Card,
  EmptyState,
  ErrorBlock,
  Field,
  IconButton,
  Input,
  KeyValue,
  Row,
  ScreenHeader,
  Skeleton,
} from '../components/Ui';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import {
  describeError,
  getAssetHistory,
  listZandoItems,
  playerStart,
  playerStats,
  playerStop,
  playerTick,
  zandoOwner,
  type ZandoItem,
} from '../lib/api';
import {
  estVitrineBoutique,
  firstContentUrl,
  firstImageUrl,
  formatInt,
  formatNumber,
  parseMediaUrls,
} from '../lib/format';
import { identityLabel, useIdentities } from '../lib/identity';
import { useDisplayAmount } from '../lib/currency';

interface PlayerStats {
  total_sessions?: number;
  total_seconds?: number;
  total_paid?: number;
  cached_contents?: number;
}

const mmss = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
};

/** Une image ne se lit pas a la seconde : seul un lien non-image est lisible. */
const contentSource = (media: string[]): string => firstContentUrl(media);

/** Visuel de la ligne (couverture du contenu ou photo de l'offre). */
const coverImage = (media: string[]): string | undefined => firstImageUrl(media) || media[0];

export function PlayerScreen({
  onBack,
  initialItem,
}: { onBack?: () => void; initialItem?: ZandoItem | null } = {}) {
  const { toast } = useSession();
  const stats = useAsync<PlayerStats>(() => playerStats(), []);
  const feed = useAsync(() => listZandoItems(), []);
  const rates = useAsync(() => getAssetHistory('btc'), []);
  /** Les prix se lisent en devise : le BORB n'est qu'une garantie. */
  const money = useDisplayAmount();

  const [contentUrl, setContentUrl] = useState('');
  const [pricePerSecond, setPricePerSecond] = useState('1');
  const [maxDuration, setMaxDuration] = useState('600');
  const [running, setRunning] = useState(false);
  /** Contenu effectivement facture : c'est lui qui est marque comme paye a l'arret. */
  const [activeUrl, setActiveUrl] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    tickRef.current += 1;
    if (tickRef.current % 5 !== 0) return;
    playerTick().catch(() => undefined);
  }, [elapsed, running]);

  useEffect(() => {
    if (!initialItem) return;
    const source = firstContentUrl(parseMediaUrls(initialItem.media_urls));
    if (!source) {
      toast('Ce contenu n’a pas de lien lisible', 'error');
      return;
    }
    setContentUrl(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItem?.id]);

  /**
   * Le prix fixe par le createur est en unites internes : il s'affiche en
   * devise des que le taux de l'oracle est disponible. Aucun taux en dur.
   */
  useEffect(() => {
    if (!initialItem || !(money.perUnit > 0)) return;
    const units = Number(initialItem.price_borb);
    if (units <= 0) return;
    setPricePerSecond(String(Number((units * money.perUnit).toFixed(2))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItem?.id, money.perUnit]);

  const start = async () => {
    const price = Number(pricePerSecond.replace(',', '.'));
    const duration = Number(maxDuration.replace(',', '.'));
    if (!contentUrl.trim()) {
      toast('Indique l’adresse du contenu', 'error');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast('Prix par seconde invalide', 'error');
      return;
    }
    if (!(money.perUnit > 0)) {
      toast('Taux indisponible, réessaie dans un instant.', 'error');
      return;
    }
    if (!(money.pointsParBorb > 0)) {
      toast('Parité du grand livre indisponible, réessaie dans un instant.', 'error');
      return;
    }
    setBusy(true);
    try {
      // Le champ saisi est dans la devise d'affichage ; la route attend des
      // points. Les deux facteurs viennent de l'oracle, aucun n'est écrit ici.
      const answer = await playerStart({
        content_url: contentUrl.trim(),
        price_per_second: Math.max(1, Math.round((price / money.perUnit) * money.pointsParBorb)),
        max_duration_s: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 600,
      });
      if (answer?.status !== 'success') throw new Error(answer?.message || 'Lecture refusée');
      if (answer?.cached) {
        toast('Contenu déjà payé : aucune nouvelle facturation.', 'success');
        setActiveUrl('');
        return;
      }
      tickRef.current = 0;
      setElapsed(0);
      setActiveUrl(contentUrl.trim());
      setRunning(true);
      toast('Lecture démarrée', 'success');
    } catch (error) {
      toast(describeError(error, 'Démarrage impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      const result = await playerStop(activeUrl);
      if (result?.status === 'error') {
        toast(result.message || 'Arrêt impossible', 'error');
      } else {
        const pointsPayes = Number(result?.total_points_paid || 0);
        toast(
          pointsPayes > 0
            ? `Session terminée · ${money.formatPoints(pointsPayes)}`
            : 'Session terminée',
          'success',
        );
      }
      setRunning(false);
      setActiveUrl('');
      setElapsed(0);
      stats.reload();
    } catch (error) {
      toast(describeError(error, 'Arrêt impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const contents = (feed.data?.items || [])
    .filter((item) => item.published !== false)
    .filter((item) => !estVitrineBoutique(item))
    .filter((item) => contentSource(parseMediaUrls(item.media_urls)))
    .slice(0, 6);

  /** Auteur du contenu : son pseudo, jamais son numero UQ. */
  const authors = useIdentities(contents.map((item) => zandoOwner(item)));
  const pointsPayes = Number(stats.data?.total_paid || 0);
  const price = Number(pricePerSecond.replace(',', '.')) || 0;
  const estimate = price * elapsed;
  /** Montant deja exprime en devise : on n'applique aucun second taux. */
  const view = (amount: number) =>
    `${formatNumber(amount, amount >= 1000 ? 0 : 2)} ${money.currency}`;

  return (
    <>
      <ScreenHeader
        title="Lecteur"
        subtitle="Sessions de contenu payantes"
        onBack={onBack}
        right={
          <>
            <IconButton name="refresh" label="Actualiser" onClick={() => { stats.reload(); feed.reload(); }} />
            <IconButton name="info" label="Aide" onClick={() => toast('Chaque seconde consommée est facturée au prix choisi.')} />
          </>
        }
      />

      <div className="v2-pad">
        <Card>
          <div className="v2-row-between">
            <div>
              <div className="v2-muted" style={{ fontSize: 12 }}>
                Session en cours
              </div>
              <div className="v2-amount" style={{ fontSize: 30, fontWeight: 780, letterSpacing: -0.5 }}>
                {mmss(elapsed)}
              </div>
            </div>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 58,
                height: 58,
                borderRadius: 999,
                background: running ? 'var(--v2-positive-soft)' : 'var(--v2-surface-2)',
                color: running ? 'var(--v2-positive)' : 'var(--v2-ink-3)',
              }}
            >
              <Icon name={running ? 'pause' : 'play'} size={26} />
            </span>
          </div>

          {running ? (
            <Button variant="danger" block icon="stop" loading={busy} onClick={stop} style={{ marginTop: 12 }}>
              Terminer la session
            </Button>
          ) : (
            <Button block icon="play" loading={busy} onClick={start} style={{ marginTop: 12 }}>
              Démarrer la lecture
            </Button>
          )}

          {running && (
            <div className="v2-muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Coût estimé : {view(estimate)} ({view(price)}/seconde)
            </div>
          )}
        </Card>
      </div>

      <div className="v2-pad">
        <div className="v2-stack">
          <Field label="Adresse du contenu" hint="URL lue par le lecteur">
            <Input
              value={contentUrl}
              onChange={(event) => setContentUrl(event.target.value)}
              placeholder="https://…"
              disabled={running}
            />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label={`Prix par seconde (${money.currency})`} hint="Facturé à chaque seconde de lecture">
              <Input
                value={pricePerSecond}
                onChange={(event) => setPricePerSecond(event.target.value)}
                inputMode="numeric"
                disabled={running}
              />
            </Field>
            <Field label="Durée max (s)">
              <Input
                value={maxDuration}
                onChange={(event) => setMaxDuration(event.target.value)}
                inputMode="numeric"
                disabled={running}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="v2-pad">
        <div className="v2-section-title">Statistiques</div>
        <Card>
          {stats.loading ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <Skeleton height={18} width="60%" />
              <Skeleton height={18} width="45%" />
            </div>
          ) : stats.error ? (
            <ErrorBlock message={stats.error} onRetry={stats.reload} />
          ) : (
            <>
              <KeyValue label="Sessions" value={formatInt(stats.data?.total_sessions || 0)} />
              <KeyValue label="Temps total" value={mmss(Number(stats.data?.total_seconds || 0))} />
              <KeyValue label="Total payé" value={money.formatPoints(pointsPayes)} />
              <KeyValue label="Contenus en cache" value={formatInt(stats.data?.cached_contents || 0)} />
            </>
          )}
        </Card>

        <div className="v2-section-title">Contenus du marché</div>
        {feed.loading ? (
          <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
            <Skeleton height={42} radius={14} />
            <Skeleton height={42} radius={14} />
          </Card>
        ) : contents.length === 0 ? (
          <Card>
            <EmptyState
              icon="play"
              title="Aucun contenu"
              description="Les offres Zando se lisent ici."
            />
          </Card>
        ) : (
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {contents.map((item: ZandoItem) => {
              const media = parseMediaUrls(item.media_urls);
              return (
                <Row
                  key={item.id}
                  avatar={{ label: (item.title || 'UQ').slice(0, 2).toUpperCase(), src: coverImage(media) }}
                  title={item.title || 'Contenu'}
                  subtitle={`${money.format(item.price_borb)}/s · ${
                    identityLabel(zandoOwner(item), authors[zandoOwner(item).toUpperCase()]) || 'Zando'
                  }`}
                  right={<Icon name="play" size={18} style={{ color: 'var(--v2-accent)' }} />}
                  onClick={() => {
                    if (running) {
                      toast('Termine la session en cours d’abord', 'error');
                      return;
                    }
                    const source = contentSource(media);
                    if (!source) {
                      toast('Ce contenu n’a pas de lien lisible', 'error');
                      return;
                    }
                    setContentUrl(source);
                    // Prix du createur en unites internes, affiche en devise.
                    if (Number(item.price_borb) > 0 && money.perUnit > 0) {
                      setPricePerSecond(String(Number((Number(item.price_borb) * money.perUnit).toFixed(2))));
                    }
                    toast('Contenu sélectionné');
                  }}
                />
              );
            })}
          </Card>
        )}

        <Card style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <span style={{ color: 'var(--v2-accent)', flex: 'none' }}>
            <Icon name="info" size={18} />
          </span>
          <div className="v2-muted" style={{ fontSize: 12.5 }}>
            Le lecteur facture à la seconde. Le backend enregistre chaque session et conserve les contenus
            déjà payés pour éviter une double facturation.
            {rates.data?.change_pct !== undefined
              ? ` Marché BTC : ${formatNumber(rates.data.change_pct, 2)} % sur 24 h.`
              : ''}
          </div>
        </Card>

        <div style={{ height: 8 }} />
      </div>
    </>
  );
}
