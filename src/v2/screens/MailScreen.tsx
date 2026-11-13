// ============================================================================
// MailScreen — UQ Mail : boîte de réception, envoyés, brouillons
// ============================================================================
//
// Lit les routes /api/mail/* de la plateforme. L'envoi et le marquage « lu »
// exigent une signature Ed25519 (clé du wallet BORB) — le formulaire de
// composition est affiché mais l'envoi reste désactivé tant que le pont de
// signature n'est pas branché côté client.

import { useState } from 'react';
import { Card, Hint, List, Loader, Row, ScreenHeader, SectionTitle, Button } from '../components/Ui';
import { Icon } from '../components/Icon';
import { useSession } from '../lib/session';
import { useAsync, usePolling } from '../lib/hooks';
import {
  getMailAdresse,
  lireMail,
  listerMails,
  type MailComplet,
  type MailResume,
} from '../lib/comms';

type Dossier = 'inbox' | 'sent' | 'drafts' | 'spam';

const DOSSIERS: { id: Dossier; label: string; icon: 'mail' | 'send' | 'edit' | 'alert' }[] = [
  { id: 'inbox', label: 'Boîte de réception', icon: 'mail' },
  { id: 'sent', label: 'Envoyés', icon: 'send' },
  { id: 'drafts', label: 'Brouillons', icon: 'edit' },
  { id: 'spam', label: 'Indésirables', icon: 'alert' },
];

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

export function MailScreen({ onBack }: { onBack?: () => void }) {
  const { uq } = useSession();
  const [dossier, setDossier] = useState<Dossier>('inbox');
  const [ouvert, setOuvert] = useState<MailComplet | null>(null);

  const adresse = useAsync(() => getMailAdresse(uq), [uq], { enabled: Boolean(uq) });
  const boite = useAsync(() => listerMails(uq, dossier), [uq, dossier], { enabled: Boolean(uq) });
  usePolling(() => boite.reload(), 15000, Boolean(uq) && !ouvert);

  const ouvrir = async (m: MailResume) => {
    try {
      const complet = await lireMail(uq, m.id);
      setOuvert(complet);
    } catch {
      setOuvert({ ...m, folder: dossier, body_text: '' });
    }
  };

  if (ouvert) {
    return (
      <div className="v2-pad">
        <ScreenHeader title={ouvert.subject || '(sans objet)'} onBack={() => setOuvert(null)} />
        <Card>
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>{ouvert.from_name || ouvert.from_addr}</div>
            <div className="v2-muted" style={{ fontSize: 12 }}>
              {ouvert.from_addr} → {ouvert.to_addr} · {formatDate(ouvert.date)}
            </div>
          </div>
          {ouvert.otp_code && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 12,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 4,
                color: 'var(--v2-accent)',
                background: 'var(--v2-accent-soft)',
              }}
            >
              {ouvert.otp_code}
            </div>
          )}
          <pre
            style={{
              marginTop: 12,
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {ouvert.body_text || '(message vide)'}
          </pre>
        </Card>
      </div>
    );
  }

  return (
    <div className="v2-pad">
      <ScreenHeader title="UQ Mail" onBack={onBack} />

      {adresse.data?.adresse && (
        <Card style={{ marginBottom: 14 }}>
          <div className="v2-muted" style={{ fontSize: 12, marginBottom: 4 }}>
            Votre adresse UQ Mail
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, wordBreak: 'break-all' }}>
            {adresse.data.adresse}
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {DOSSIERS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDossier(d.id)}
            className="v2-chip"
            data-active={dossier === d.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid var(--v2-line)',
              background: dossier === d.id ? 'var(--v2-accent-soft)' : 'transparent',
              color: dossier === d.id ? 'var(--v2-accent)' : 'var(--v2-ink-2)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              flex: 'none',
            }}
          >
            <Icon name={d.icon} size={15} />
            {d.label}
            {d.id === 'inbox' && (boite.data?.non_lus ?? 0) > 0 && (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 999,
                  background: 'var(--v2-accent)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {boite.data!.non_lus > 9 ? '9+' : boite.data!.non_lus}
              </span>
            )}
          </button>
        ))}
      </div>

      {boite.loading && <Loader label="Chargement de la boîte…" />}
      {boite.error && (
        <Hint tone="warning">Boîte injoignable — réessaie dans un instant.</Hint>
      )}

      {boite.data && boite.data.messages.length === 0 && !boite.loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '18px 8px' }}>
            <Icon name="mail" size={30} style={{ color: 'var(--v2-ink-3)' }} />
            <div className="v2-muted" style={{ marginTop: 8, fontSize: 13 }}>
              Aucun message dans ce dossier.
            </div>
          </div>
        </Card>
      )}

      {boite.data && boite.data.messages.length > 0 && (
        <List>
          {boite.data.messages.map((m) => (
            <Row
              key={m.id}
              icon={m.is_read ? 'mail' : 'mail'}
              iconTone={m.is_read ? 'neutral' : 'accent'}
              title={m.subject || '(sans objet)'}
              subtitle={`${m.from_name || m.from_addr} · ${formatDate(m.date)}`}
              right={
                <div style={{ textAlign: 'right' }}>
                  {!m.is_read && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: 'var(--v2-accent)',
                        marginBottom: 4,
                      }}
                    />
                  )}
                  <div className="v2-muted" style={{ fontSize: 11, maxWidth: 140 }}>
                    {m.otp_code ? `OTP ${m.otp_code}` : m.apercu.slice(0, 60)}
                  </div>
                </div>
              }
              chevron
              onClick={() => ouvrir(m)}
            />
          ))}
        </List>
      )}

      <div style={{ marginTop: 16 }}>
        <Button disabled title="L'envoi requiert la signature du wallet — bientôt disponible">
          <Icon name="send" size={17} /> Écrire un message
        </Button>
        <div className="v2-muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          L'envoi sera activé avec la clé du wallet BORB.
        </div>
      </div>
    </div>
  );
}
