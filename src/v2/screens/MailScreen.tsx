// ============================================================================
// MailScreen — UQ Mail : boîte de réception, envoyés, brouillons
// ============================================================================
//
// Lit les routes /api/mail/* de la plateforme. L'envoi est signé Ed25519
// (domaine UQ_MAIL_V1) par la clé de l'appareil — plugin natif UqCrypto,
// donc disponible sur Android uniquement ; sur web l'envoi reste désactivé.

import { useState } from 'react';
import {
  Card,
  Field,
  Hint,
  Input,
  List,
  Loader,
  Row,
  ScreenHeader,
  SectionTitle,
  Sheet,
  Textarea,
  Button,
} from '../components/Ui';
import { Icon } from '../components/Icon';
import { useSession } from '../lib/session';
import { useAsync, usePolling } from '../lib/hooks';
import { cryptoAppareilDisponible } from '../../lib/deviceKey';
import {
  envoyerMail,
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
  const { uq, toast } = useSession();
  const [dossier, setDossier] = useState<Dossier>('inbox');
  const [ouvert, setOuvert] = useState<MailComplet | null>(null);
  const [composition, setComposition] = useState(false);
  const [envoi, setEnvoi] = useState({ to: '', subject: '', body: '' });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const cryptoOk = cryptoAppareilDisponible();

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

  const envoyer = async () => {
    if (!uq || envoiEnCours) return;
    setEnvoiEnCours(true);
    try {
      await envoyerMail(uq, envoi);
      toast('Message envoyé.', 'success');
      setEnvoi({ to: '', subject: '', body: '' });
      setComposition(false);
      if (dossier === 'sent') void boite.reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Envoi impossible.', 'error');
    } finally {
      setEnvoiEnCours(false);
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
        <Button
          disabled={!cryptoOk}
          title={
            cryptoOk
              ? undefined
              : 'L\u2019envoi signé nécessite l\u2019app Android (clé de l\u2019appareil)'
          }
          onClick={() => setComposition(true)}
        >
          <Icon name="send" size={17} /> Écrire un message
        </Button>
        <div className="v2-muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {cryptoOk
            ? 'L\u2019envoi est signé Ed25519 par la clé de cet appareil.'
            : 'L\u2019envoi est disponible dans l\u2019app Android.'}
        </div>
      </div>

      <Sheet
        open={composition}
        onClose={() => setComposition(false)}
        title="Nouveau message"
        subtitle={adresse.data?.adresse || undefined}
        footer={
          <Button
            block
            loading={envoiEnCours}
            disabled={!envoi.to.trim() || !envoi.subject.trim() || !envoi.body.trim()}
            onClick={envoyer}
          >
            <Icon name="send" size={17} /> Envoyer
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Destinataire">
            <Input
              value={envoi.to}
              onChange={(e) => setEnvoi({ ...envoi, to: e.target.value })}
              placeholder="destinataire@domaine"
            />
          </Field>
          <Field label="Objet">
            <Input
              value={envoi.subject}
              onChange={(e) => setEnvoi({ ...envoi, subject: e.target.value })}
            />
          </Field>
          <Field label="Message">
            <Textarea
              value={envoi.body}
              onChange={(e) => setEnvoi({ ...envoi, body: e.target.value })}
              rows={7}
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
