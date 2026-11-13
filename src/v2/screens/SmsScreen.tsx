// ============================================================================
// SmsScreen — UQ SMS : numéro relais UQ + messages reçus (OTP)
// ============================================================================
//
// UQ SMS protège le vrai numéro : le compte reçoit un numéro relais UQ.
// Les SMS entrants (dont les OTP) arrivent via la SIM du pool.
// GET /api/sms/status/{uq} et /api/sms/messages/{uq} — lecture seule.

import { Card, Hint, List, Loader, Row, ScreenHeader, SectionTitle } from '../components/Ui';
import { Icon } from '../components/Icon';
import { useSession } from '../lib/session';
import { useAsync, usePolling } from '../lib/hooks';
import { getSmsStatus, listerSms } from '../lib/comms';

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
  const { uq } = useSession();
  const status = useAsync(() => getSmsStatus(uq), [uq], { enabled: Boolean(uq) });
  const boite = useAsync(() => listerSms(uq), [uq], { enabled: Boolean(uq) });
  usePolling(() => boite.reload(), 10000, Boolean(uq));

  const messages = boite.data?.messages ?? [];
  const nonLus = boite.data?.otp_non_lus ?? status.data?.otp_non_lus ?? 0;

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
              />
            ))}
          </List>
        </>
      )}
    </div>
  );
}
