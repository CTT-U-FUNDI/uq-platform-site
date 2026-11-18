// ============================================================================
// SmsScreen — UQ SMS : numéro relais UQ + messages reçus (OTP)
// ============================================================================
//
// UQ SMS protège le vrai numéro : le compte reçoit un numéro relais UQ.
// Les SMS entrants (dont les OTP) arrivent via la SIM du pool.
// GET /api/sms/status|messages — lecture seule.
// Attribution/libération/mark-read : POST signés Ed25519 (UQ_SMS_V1),
// clé de l'appareil via le plugin natif — Android uniquement.

import { useState } from 'react';
import { Button, Card, Hint, List, Loader, Row, ScreenHeader, SectionTitle } from '../components/Ui';
import { Icon } from '../components/Icon';
import { useSession } from '../lib/session';
import { useAsync, usePolling } from '../lib/hooks';
import { cryptoAppareilDisponible } from '../../lib/deviceKey';
import { assignerSms, getSmsStatus, libererSms, listerSms, marquerSmsLu } from '../lib/comms';

function formatDate(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SmsScreen({ onBack }: { onBack?: () => void }) {
  const { uq, toast } = useSession();
  const [actionEnCours, setActionEnCours] = useState(false);
  const status = useAsync(() => getSmsStatus(uq), [uq], { enabled: Boolean(uq) });
  const boite = useAsync(() => listerSms(uq), [uq], { enabled: Boolean(uq) });
  usePolling(() => boite.reload(), 10000, Boolean(uq));
  const cryptoOk = cryptoAppareilDisponible();

  const messages = boite.data?.messages ?? [];
  const nonLus = boite.data?.otp_non_lus ?? status.data?.otp_non_lus ?? 0;
  const aUnNumero = Boolean(status.data?.relay_number);

  const executer = async (action: () => Promise<unknown>, succes: string) => {
    if (!uq || actionEnCours) return;
    setActionEnCours(true);
    try {
      await action();
      toast(succes, 'success');
      await Promise.all([status.reload(), boite.reload()]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    } finally {
      setActionEnCours(false);
    }
  };

  return (
    <div className="v2-pad">
      <ScreenHeader title="UQ SMS" onBack={onBack} />

      <Card style={{ marginBottom: 14 }}>
        <div className="v2-muted" style={{ fontSize: 12, marginBottom: 4 }}>
          Votre numéro relais UQ
        </div>
        {status.loading ? (
          <Loader label="Chargement…" />
        ) : status.data?.relay_number ? (
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>
            {status.data.relay_number}
          </div>
        ) : (
          <div className="v2-muted" style={{ fontSize: 13 }}>
            Aucun numéro relais attribué pour le moment.
          </div>
        )}
        <div className="v2-muted" style={{ fontSize: 12, marginTop: 8 }}>
          Donne ce numéro à tes contacts : ton vrai numéro reste privé.
          {nonLus > 0 && ` · ${nonLus} OTP non lu${nonLus > 1 ? 's' : ''}`}
        </div>
        {cryptoOk && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!aUnNumero ? (
              <Button
                size="sm"
                loading={actionEnCours}
                onClick={() => void executer(() => assignerSms(uq), 'Numéro relais attribué.')}
              >
                <Icon name="phone" size={15} /> Attribuer un numéro
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                loading={actionEnCours}
                onClick={() => void executer(() => libererSms(uq), 'Numéro relais libéré.')}
              >
                Libérer le numéro
              </Button>
            )}
          </div>
        )}
        {!cryptoOk && (
          <div className="v2-muted" style={{ fontSize: 12, marginTop: 8 }}>
            L'attribution d'un numéro nécessite l'app Android.
          </div>
        )}
      </Card>

      {boite.loading && <Loader label="Chargement des SMS…" />}
      {boite.error && <Hint tone="warning">Messagerie SMS injoignable — réessaie.</Hint>}

      {boite.data && messages.length === 0 && !boite.loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '18px 8px' }}>
            <Icon name="phone" size={30} style={{ color: 'var(--v2-ink-3)' }} />
            <div className="v2-muted" style={{ marginTop: 8, fontSize: 13 }}>
              Aucun SMS reçu pour le moment.
            </div>
          </div>
        </Card>
      )}

      {messages.length > 0 && (
        <>
          <SectionTitle>Messages reçus</SectionTitle>
          <List>
            {messages.map((s) => (
              <Row
                key={s.id}
                icon="phone"
                iconTone={s.otp_code ? 'accent' : 'neutral'}
                title={s.otp_code ? `Code ${s.otp_code}` : s.text.slice(0, 60)}
                subtitle={`${s.from_addr} · ${formatDate(s.date)}`}
                right={
                  <span className="v2-muted" style={{ fontSize: 11 }}>
                    {formatDate(s.date).split(' ').slice(-1)[0]}
                  </span>
                }
                onClick={() => {
                  if (!cryptoOk) return;
                  void marquerSmsLu(uq, s.id)
                    .then(() => boite.reload())
                    .catch(() => {});
                }}
              />
            ))}
          </List>
        </>
      )}
    </div>
  );
}
