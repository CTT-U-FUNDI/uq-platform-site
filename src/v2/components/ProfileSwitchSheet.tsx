import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { Sheet, UqInput } from './Ui';
import { authFinalize, authStep1, authStep2, resolveProfileUq } from '../lib/api';
import { useSession } from '../lib/session';

interface ProfileSwitchSheetProps {
  open: boolean;
  onClose: () => void;
  /** Profil vise par la bascule. */
  target: 'owner' | 'profil2';
  /** Appele apres la bascule, une fois le JWT remplace. */
  onDone: (target: 'owner' | 'profil2') => void;
}

const MAX_CONFIRMATIONS = 3;
const GENERIC_ERROR = 'Identifiants incorrects.';

/** Numero du proprietaire, retenu des qu'une session proprietaire est ouverte. */
const OWNER_UQ_KEY = 'uq_linked_owner';
/** Numero du profil rattache, retenu des qu'une bascule vers lui a reussi. */
const PROFIL2_UQ_KEY = 'uq_linked_p2';
/** Emails deja saisis, par numero : memoire de saisie, jamais une autorite. */
const EMAILS_KEY = 'uq_switch_emails';

function lireEmails(): Record<string, string> {
  try {
    const brut = typeof window === 'undefined' ? '' : localStorage.getItem(EMAILS_KEY);
    const objet = JSON.parse(brut || '{}') as Record<string, unknown>;
    const propre: Record<string, string> = {};
    Object.entries(objet).forEach(([cle, valeur]) => {
      if (typeof valeur === 'string' && valeur) propre[cle.toUpperCase()] = valeur;
    });
    return propre;
  } catch {
    return {};
  }
}

/**
 * Bascule entre le profil proprietaire et le profil rattache.
 *
 * Le controle est le meme qu'a la connexion : le serveur compare l'email a
 * celui du compte avant de tester le mot de passe (validate_step2). L'email
 * et le numero du profil vise viennent de l'API owner (/distribution/delis
 * et /distribution/treasury exposent `uq` + `email`) ; le terminal ne garde
 * que le mot de passe a saisir.
 *
 * Le numero du profil vise vient de l'API (`uq` de /distribution/delis pour le
 * profil rattache, /distribution/treasury pour le proprietaire) et, a defaut, du
 * numero deja memorise par le terminal lors d'une bascule precedente. Aucun
 * numero n'est ecrit en dur.
 *
 * Le mot de passe n'est jamais conserve. Le jeton courant est remplace par
 * celui du profil vise : le backend ne delivre une session a un compte
 * rattache que si la demande vient du proprietaire (en-tete X-Switch-From),
 * d'ou l'envoi du numero de session courant.
 */
export function ProfileSwitchSheet({ open, onClose, target, onDone }: ProfileSwitchSheetProps) {
  const { uq, completeLogin } = useSession();

  const [targetUq, setTargetUq] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  /** Repli exceptionnel : saisie du numero quand ni l'API ni le terminal ne le connaissent. */
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const read = (key: string) => (typeof window === 'undefined' ? '' : localStorage.getItem(key) || '');

  /** Numero deja connu pour le profil vise ('' si le terminal ne le connait pas). */
  const recallTarget = () =>
    (target === 'owner'
      ? read(OWNER_UQ_KEY) || read('uq_switched_from')
      : read(PROFIL2_UQ_KEY)
    ).toUpperCase();

  useEffect(() => {
    if (!open) return;
    let alive = true;

    const memoKey = target === 'owner' ? OWNER_UQ_KEY : PROFIL2_UQ_KEY;
    const known = recallTarget();
    // L'email n'est rappelé que pour le numéro visé : les deux profils n'ont pas
    // le même, et pré-remplir celui d'un autre compte ferait échouer la bascule.
    const knownEmail = known ? lireEmails()[known] || '' : '';

    setPassword('');
    setEmail(knownEmail);
    setShowPassword(false);
    setError('');
    setShake(false);
    setBusy(false);
    setManual(false);

    // Le numero connu du terminal s'affiche tout de suite, mais l'API reste
    // l'autorite : elle renvoie le UQ et l'email reels du profil vise, ce qui
    // corrige les memoires perimees ou absentes.
    setTargetUq(known);
    setResolving(true);
    void resolveProfileUq(target)
      .then((found) => {
        if (!alive) return;
        const uq = found.uq || known;
        if (!uq) return;
        setTargetUq(uq);
        setEmail(
          (current) =>
            found.email ||
            current ||
            lireEmails()[uq.toUpperCase()] ||
            '',
        );
        localStorage.setItem(memoKey, uq);
        if (found.email) {
          localStorage.setItem(
            EMAILS_KEY,
            JSON.stringify({ ...lireEmails(), [uq.toUpperCase()]: found.email }),
          );
        }
      })
      .finally(() => {
        if (alive) setResolving(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  const fail = () => {
    setPassword('');
    setError(GENERIC_ERROR);
    setShake(true);
    window.setTimeout(() => setShake(false), 480);
  };

  const switchProfile = async () => {
    if (busy) return;
    const destination = (targetUq || recallTarget()).trim().toUpperCase();
    const adresse = email.trim();
    if (!destination || !adresse || !password) {
      fail();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const origin = (uq || localStorage.getItem('uq_number') || '').toUpperCase();
      let session = '';
      let tfa = '';
      let owner: boolean | null = null;

      // Le proprietaire confirme son mot de passe trois fois : chaque
      // confirmation abandonne la session, on en recree donc une aussitot.
      for (let round = 0; round < MAX_CONFIRMATIONS; round += 1) {
        const first = await authStep1(destination, origin);
        if (first.httpStatus !== 200 || !first.session_id || !first.tfa_token) break;
        owner = Boolean(first.is_owner);
        const second = await authStep2(first.session_id, first.tfa_token, adresse, password);
        const nextTfa = second.tfa_token || first.tfa_token;
        if (second.status === 'attempt_required') continue;
        if (second.status !== 'step_required' && second.status !== 'success') break;
        if (second.is_owner !== undefined) owner = Boolean(second.is_owner);
        session = first.session_id;
        tfa = nextTfa;
        break;
      }

      if (!session || owner === null) {
        fail();
        return;
      }

      const data = await authFinalize(owner, session, tfa);
      if (data.status !== 'success' || !data.token) {
        fail();
        return;
      }

      // Memorisation des deux numeros et de l'email du profil vise : la bascule
      // suivante ne redemande que le mot de passe, dans un sens comme dans l'autre.
      localStorage.setItem(
        EMAILS_KEY,
        JSON.stringify({ ...lireEmails(), [destination]: adresse }),
      );
      if (owner) {
        localStorage.setItem(OWNER_UQ_KEY, destination);
        localStorage.removeItem('uq_switched_from');
      } else {
        localStorage.setItem(PROFIL2_UQ_KEY, destination);
        localStorage.setItem(OWNER_UQ_KEY, origin);
        localStorage.setItem('uq_switched_from', origin);
      }

      await completeLogin(data.token);
      onDone(owner ? 'owner' : 'profil2');
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  };

  const directionLabel = target === 'profil2' ? 'Profil 2' : 'Profil 1';

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={`Basculer vers ${directionLabel}`}
      subtitle={`Confirme le mot de passe de ${directionLabel}`}
    >
      <div className={shake ? 'v2-shake' : undefined} style={{ display: 'grid', gap: 12 }}>
        {/* L'email du profil vise est repris de la memoire du terminal
            (sauvegarde a chaque bascule reussie) : il n'est redemande a
            l'ecran que si le terminal ne le connait pas encore. */}
        {!email.trim() && (
          <label className="v2-field">
            <span className="v2-label">Email</span>
            <div className="v2-input-group">
              <Icon name="mail" size={18} style={{ color: 'var(--v2-ink-3)', flex: 'none' }} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                disabled={busy}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void switchProfile();
                }}
              />
            </div>
          </label>
        )}

        <label className="v2-field">
          <span className="v2-label">Mot de passe</span>
          <div className="v2-input-group">
            <Icon name="lock" size={18} style={{ color: 'var(--v2-ink-3)', flex: 'none' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              disabled={busy}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void switchProfile();
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              style={{ display: 'grid', placeItems: 'center', color: 'var(--v2-ink-3)' }}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          </div>
        </label>

        {/* Repli exceptionnel : le numero n'est demande que si l'API et le
            terminal l'ignorent tous les deux. */}
        {!resolving && !targetUq && !manual && (
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="v2-muted" style={{ fontSize: 12 }}>
              Le numero du {directionLabel} n'est pas disponible sur ce terminal.
            </span>
            <button
              type="button"
              className="v2-btn v2-btn--secondary"
              onClick={() => setManual(true)}
              disabled={busy}
            >
              Associer ce terminal
            </button>
          </div>
        )}

        {!resolving && manual && (
          <label className="v2-field">
            <span className="v2-label">Numero UQ de {directionLabel}</span>
            <UqInput value={targetUq} onChange={setTargetUq} disabled={busy} />
            <span className="v2-muted" style={{ fontSize: 12 }}>
              Le backend ne fournit pas ce numero : saisissez-le une seule fois, il ne sera
              plus demande ensuite sur ce terminal.
            </span>
          </label>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v2-negative)', fontSize: 13, fontWeight: 600 }}>
            <Icon name="alert" size={16} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="v2-btn v2-btn--secondary"
            style={{ flex: 1 }}
            onClick={() => {
              if (!busy) onClose();
            }}
            disabled={busy}
          >
            Annuler
          </button>
          <button
            type="button"
            className="v2-auth-cta"
            style={{ flex: 1, minHeight: 48 }}
            onClick={() => void switchProfile()}
            disabled={busy || resolving || !password || !targetUq || !email.trim()}
          >
            {busy ? <span className="v2-spinner" /> : null}
            Confirmer
          </button>
        </div>
      </div>
    </Sheet>
  );
}
