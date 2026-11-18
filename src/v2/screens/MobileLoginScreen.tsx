import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Icon } from '../components/Icon';
import { LogoUQ } from '../../components/ui/LogoUQ';
import { Sheet } from '../components/Ui';
import { AuthAiSheet } from '../components/AuthAiSheet';
import { useSession } from '../lib/session';
import { lireCleAppareil } from '../lib/webauthn';
import {
  authFinalize,
  authLoginPin,
  authStep1,
  authStep2,
} from '../lib/api';
import '../styles/auth-cine.css';

type Etape = 'numero' | 'password' | 'code_owner' | 'succes';

interface Props {
  onCreateAccount: () => void;
}

/**
 * MobileLoginScreen — ecran de connexion UQZ 100% mobile.
 * Etape 1 : numero UQ seul. Etape 2 : mot de passe.
 * L'email est resolu en arriere-plan par le serveur (jamais affiche).
 * Owner : etape code de login (ex: 3543) avant le JWT.
 * Menu 3 points : creer un compte, visiter uqplatform.com, wallet offline,
 * politique de confidentialite. Icone IA conservee en haut.
 */
export const CHECK_URL = 'https://uqplatform.com/version.json';
const CURRENT = '1.0.36';
const plusRecente = (a: string, b: string) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0;
  }
  return false;
};

export function MobileLoginScreen({ onCreateAccount }: Props) {
  const { completeLogin, toast } = useSession();

  const [etape, setEtape] = useState<Etape>('numero');
  const [uq, setUq] = useState('UQ-');
  const [password, setPassword] = useState('');
  const [codeOwner, setCodeOwner] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [popupNumero, setPopupNumero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [majStatus, setMajStatus] = useState('');
  const [dlPct, setDlPct] = useState<number | null>(null);

  // Etat de session serveur (transporte entre les etapes)
  const [sessionId, setSessionId] = useState('');
  const [tfaToken, setTfaToken] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [tentativesOk, setTentativesOk] = useState(0);

  // Permissions materiel : demandees a l'ouverture (pas a l'install)
  const [permInfo, setPermInfo] = useState(false);
  const [consent, setConsent] = useState<boolean>(() => {
    try { return localStorage.getItem('uq_consent_v1') === '1'; } catch { return false; }
  });
  const demanderPermissions = () => {
    if (!Capacitor.isNativePlatform()) return;
    import('@capacitor/core').then(async ({ registerPlugin }) => {
      const UqUpdater = registerPlugin<any>('UqUpdater');
      try {
        const r: any = await UqUpdater.requestPermissions();
        setPermInfo(!r?.allGranted);
      } catch { setPermInfo(true); }
    });
  };

  const accepterConsentement = () => {
    try { localStorage.setItem('uq_consent_v1', '1'); } catch {}
    setConsent(true);
    demanderPermissions();
  };

  // Pont OTA : verifie version.json sur uqplatform.com — si plus recent, propose l'APK.
  useEffect(() => {

    const verifier = () => {
      fetch(CHECK_URL, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((v) => {
          if (v?.apk && v?.version && plusRecente(v.version, CURRENT)) setApkUrl(v.apk);
        })
        .catch(() => undefined);
    };
    verifier();
    // Ecoute le serveur : re-verifie toutes les 60s (nouveau patch -> bouton MAJ)
    const timer = setInterval(verifier, 60000);
    return () => clearInterval(timer);
  }, []);

  /** Telecharge l'APK dans l'app (progression) puis ouvre l'installateur. */
  const telechargerEtInstaller = async (url: string) => {
    if (dlPct !== null) return;
    if (!Capacitor.isNativePlatform()) {
      window.open(url, '_blank');
      return;
    }
    setDlPct(0);
    try {
      const listener = await Filesystem.addListener('progress', (p) => {
        const total = (p as { contentLength?: number }).contentLength || 0;
        const bytes = (p as { bytes?: number }).bytes || 0;
        if (total > 0) setDlPct(Math.min(99, Math.round((bytes / total) * 100)));
      });
      const dl = await Filesystem.downloadFile({
        url,
        path: 'uqz-update.apk',
        directory: Directory.Cache,
        progress: true,
      }).finally(() => listener.remove());
      setDlPct(100);
      // Chemin reel du fichier dans le cache de l'app
      const uri = (dl as { path?: string; uri?: string }).path
        || (dl as { uri?: string }).uri || '';
      const { registerPlugin } = await import('@capacitor/core');
      const updater = registerPlugin<{ installApk(o: { path: string }): Promise<void> }>('UqUpdater');
      // uri peut etre file://... — on convertit en chemin absolu
      let abs = uri.replace(/^file:\/\//, '');
      if (abs.startsWith('/')) abs = abs;
      await updater.installApk({ path: abs });
      setDlPct(null);
    } catch (e) {
      setDlPct(null);
      setError("Telechargement impossible — reessaie ou visite uqplatform.com.");
    }
  };

  const normalizeUq = (v: string) => v.trim().toUpperCase();
  const numeroValide = /^UQ-\d{8,15}$/.test(uq);

  const soumettreNumero = async () => {
    if (busy) return;
    const value = normalizeUq(uq);
    if (!value) {
      setError('Entre ton numero UQ.');
      return;
    }
    setBusy(true);
    setError('');
    setPopupNumero(false);
    try {
      const res = await authStep1(value);
      if (res.httpStatus !== 200 || !res.session_id || !res.tfa_token) {
        // Compte inexistant ou refuse -> popup clair
        setPopupNumero(true);
        return;
      }
      setSessionId(res.session_id);
      setTfaToken(res.tfa_token);
      setIsOwner(Boolean(res.is_owner));
      setEtape('password');
    } catch {
      setError('Serveur injoignable. Verifie ta connexion et reessaie.');
    } finally {
      setBusy(false);
    }
  };

  const finaliser = async (owner: boolean, token?: string) => {
    const data = await authFinalize(owner, sessionId, token || tfaToken, lireCleAppareil());
    if (data.status !== 'success' || !data.token) {
      setError('Connexion refusee. Reessaie.');
      setEtape('password');
      setPassword('');
      return;
    }
    localStorage.setItem('uq_number', data.uq_number || uq);
    if (data.uq_email) localStorage.setItem('uq_email', data.uq_email);
    if (data.uq_pseudo) localStorage.setItem('uq_pseudo', data.uq_pseudo);
    if (owner) localStorage.setItem('uq_is_owner', 'true');
    setEtape('succes');
    await new Promise((r) => setTimeout(r, 900));
    await completeLogin(data.token);
    toast('Connexion reussie', 'success');
  };

  const soumettrePassword = async () => {
    if (busy) return;
    if (!password) {
      setError('Entre ton mot de passe.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // email volontairement vide : le serveur le resout depuis le UQ
      const res = await authStep2(sessionId, tfaToken, '', password);
      if (res.status === 'attempt_required') {
        // Owner : confirmation intermédiaire -> on recree une etape propre
        setTentativesOk((res.attempts_ok as number) || tentativesOk + 1);
        setError(`Confirmation ${tentativesOk + 1}/3 — re-saisis ton mot de passe.`);
        setPassword('');
        return;
      }
      if (res.status !== 'step_required' && res.status !== 'success') {
        setError('Identifiants incorrects.');
        setPassword('');
        return;
      }
      const owner = res.is_owner !== undefined ? Boolean(res.is_owner) : isOwner;
      setIsOwner(owner);
      if (res.tfa_token) setTfaToken(res.tfa_token);
      if (owner && res.step === 3) {
        // Owner : code de login (ex: 3543) en etape dediee
        if (res.tfa_token) setTfaToken(res.tfa_token);
        setEtape('code_owner');
        return;
      }
      await finaliser(owner, res.tfa_token || undefined);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Serveur injoignable — reessaie.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  const soumettreCodeOwner = async () => {
    if (busy) return;
    if (!codeOwner) {
      setError('Entre le code de login.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await authLoginPin(sessionId, tfaToken, codeOwner);
      if (res.status !== 'step_required' && res.status !== 'success') {
        setError('Code incorrect.');
        setCodeOwner('');
        return;
      }
      const nouveauToken = res.tfa_token || tfaToken;
      if (res.tfa_token) setTfaToken(res.tfa_token);
      await finaliser(true, nouveauToken);
    } finally {
      setBusy(false);
    }
  };

  const menuItems = [
    { label: 'Créer un compte', action: onCreateAccount },
    { label: 'Visiter uqplatform.com', action: () => window.open('https://uqplatform.com', '_blank') },
    { label: 'Wallet offline', action: () => window.open('https://uqplatform.com', '_blank') },
    {
      label: 'Politique de confidentialité',
      action: () => window.open('https://uqplatform.com', '_blank'),
    },
  ];

  // ===== Ecran consentement (premier lancement) =====
  if (!consent) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: 'radial-gradient(120% 120% at 50% 0%, #0a0f1c 0%, #060a12 55%, #03050a 100%)',
      }}>
        <div style={{
          width: '100%', maxWidth: 340, borderRadius: 22, padding: '28px 22px',
          background: 'rgba(13,20,35,0.9)', border: '1px solid rgba(76,194,255,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', textAlign: 'center', color: '#eaf2ff',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Bienvenue sur UQZ</div>
          <p style={{ fontSize: 13, color: '#9fb8d8', lineHeight: 1.6, margin: '0 0 18px' }}>
            UQZ a besoin de tes autorisations (position, caméra, micro, stockage)
            pour toutes ses fonctions. Tes données servent uniquement à améliorer ton expérience.
          </p>
          <button
            type="button"
            onClick={() => window.open('https://uqplatform.com', '_blank')}
            style={{
              display: 'block', width: '100%', marginBottom: 10, padding: '12px',
              borderRadius: 12, border: '1px solid rgba(76,194,255,0.4)',
              background: 'rgba(0,164,239,0.08)', color: '#7fd4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Lire les conditions d'utilisation UQZ
          </button>
          <button
            type="button"
            onClick={accepterConsentement}
            style={{
              display: 'block', width: '100%', padding: '13px', borderRadius: 12,
              border: 'none', background: 'linear-gradient(135deg,#0067C0,#00A4EF)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            OK — Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="v2-auth"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        position: 'relative',
        background: 'radial-gradient(120% 120% at 50% 0%, #0a0f1c 0%, #060a12 55%, #03050a 100%)',
        color: '#eaf2ff',
      }}
    >
      {/* Bouton retour — etape precedente, champs reinitialises */}
      {(etape === 'password' || etape === 'code_owner') && (
        <button
          type="button"
          aria-label="Retour"
          onClick={() => {
            if (etape === 'code_owner') { setCodeOwner(''); setEtape('password'); }
            else { setPassword(''); setError(''); setEtape('numero'); }
          }}
          style={{
            position: 'absolute', top: 14, left: 16, zIndex: 30,
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: '#eaf2ff', fontSize: 18,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          ‹
        </button>
      )}
      {/* Entete : logo + menu 3 points + IA */}
      {/* Logo UQ — identique a l'ancien ecran de connexion */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <LogoUQ size={80} className="v2-auth-logo" />
          <span style={{
            position: 'absolute', right: 2, top: 2, zIndex: 2,
            color: '#FFFFFF', fontWeight: 900, fontSize: 13,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}>Z</span>
        </div>
      </div>
      {/* Carte de connexion */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(18px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '28px 22px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {etape === 'numero' ? 'Bienvenue dans la famille' : 'UQZ'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
            {etape === 'password' && 'Entrez votre mot de passe'}
            {etape === 'code_owner' && 'Code de login proprietaire'}
            {etape === 'succes' && 'Connexion…'}
            {etape === 'numero' && 'Entre ton numero UQ'}
          </div>
        </div>

        {etape === 'numero' && (
          <>
            
            <input
              value={uq}
              onChange={(e) => {
                // Prefixe UQ- impose : le client ne tape que les chiffres.
                const digits = e.target.value.replace(/[^0-9]/g, '');
                setUq('UQ-' + digits);
              }}
              placeholder="UQ-00000000"
              inputMode="numeric"
              autoComplete="username"
              style={{ ...inputStyle, ...(glassInput), textAlign: 'center', letterSpacing: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && soumettreNumero()}
            />
            <button
              type="button"
              onClick={soumettreNumero}
              disabled={busy || !/^UQ-\d{8,15}$/.test(uq)}
              style={{
                ...primaryBtn,
                ...(numeroValide ? {} : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'not-allowed' }),
              }}
            >
              {busy ? 'Verification…' : 'Continuer'}
            </button>
          </>
        )}

        {etape === 'password' && (
          <>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 48 }}
                onKeyDown={(e) => e.key === 'Enter' && soumettrePassword()}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
                onClick={() => setShowPassword((v) => !v)}
                style={{ ...iconBtn, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            <button type="button" onClick={soumettrePassword} disabled={busy} style={primaryBtn}>
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
          </>
        )}

        {etape === 'code_owner' && (
          <>
            <label style={labelStyle}>Code de login</label>
            <input
              type="password"
              inputMode="numeric"
              value={codeOwner}
              onChange={(e) => setCodeOwner(e.target.value)}
              placeholder="••••"
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && soumettreCodeOwner()}
            />
            <button type="button" onClick={soumettreCodeOwner} disabled={busy} style={primaryBtn}>
              {busy ? 'Verification…' : 'Valider'}
            </button>
          </>
        )}

        {etape === 'succes' && (
          <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 15 }}>
            <Icon name="check" size={40} />
            <div style={{ marginTop: 12 }}>Bienvenue sur UQZ</div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              fontSize: 13,
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Popup : numero non associe */}
      {popupNumero && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 20,
          }}
          onClick={() => setPopupNumero(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#16161c',
              borderRadius: 18,
              padding: 24,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="alert" size={36} />
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 16 }}>
              Numero introuvable
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6, lineHeight: 1.5 }}>
              Ce numero n'existe pas sur UQ. Contacte l'aide pour retrouver votre numero.
            </div>
            <button type="button" onClick={() => setPopupNumero(false)} style={{ ...primaryBtn, marginTop: 18 }}>
              Compris
            </button>
          </div>
        </div>
      )}

      {/* Menu 3 points — popup centre glassmorphique */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 320,
              borderRadius: 20, padding: '20px 16px',
              background: 'rgba(13,20,35,0.85)',
              border: '1px solid rgba(76,194,255,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,164,239,0.12)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, letterSpacing: 1, color: '#7fd4ff', marginBottom: 14, textTransform: 'uppercase' }}>
              Options
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    item.action();
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(76,194,255,0.18)',
                    background: 'rgba(0,164,239,0.07)',
                    color: '#eaf2ff',
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Petits boutons centres sous la carte */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          marginTop: 20,
        }}
      >
        <button
          type="button"
          aria-label="Aide IA"
          onClick={() => setAiOpen(true)}
          style={iconBtn}
        >
          <Icon name="sparkles" size={18} />
        </button>
        <button
          type="button"
          aria-label="Options"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            ...iconBtn,
            width: 34,
            height: 34,
            border: 'none',
            background: 'transparent',
            opacity: 0.55,
          }}
        >
          <Icon name={menuOpen ? 'close' : 'more'} size={18} />
        </button>
      </div>

      <AuthAiSheet open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  opacity: 0.55,
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  color: 'inherit',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 18,
  padding: '15px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'linear-gradient(135deg, rgba(0,103,192,0.9), rgba(0,164,239,0.9))',
  backdropFilter: 'blur(14px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
  boxShadow: '0 6px 24px rgba(0,164,239,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
};

const glassInput: React.CSSProperties = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.2)',
};

const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
