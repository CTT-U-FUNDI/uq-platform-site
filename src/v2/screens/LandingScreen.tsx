// ============================================================================
// LandingScreen — page de rencontre officielle UQ Platform
// ============================================================================
//
// Vitine publique du groupe UFUNDI QUOTIDIEN / UQ : présentation des produits
// (UQZ super-app, BORB wallet, UQ AUTH, UQ Mail), création de compte UQ et
// liens de téléchargement. Page d'entrée affichée avant la connexion.
//
// Deep links : /?ecran=verification|politiques|creation (gérés par V2App)

import { LogoUQ } from '../../components/ui/LogoUQ';
import { Icon } from '../components/Icon';
import '../styles/landing.css';

interface Product {
  id: string;
  nom: string;
  badge: string;
  description: string;
  icon: string;
  tone: string;
  cta?: { label: string; href?: string; onClick?: () => void; externe?: boolean };
  details: string[];
}

const PRODUITS: Product[] = [
  {
    id: 'uqz',
    nom: 'UQZ',
    badge: 'Super-app',
    description:
      'L’application tout-en-un : fil social, messagerie, market P2P mobile, boutiques et Studio pour créer votre vitrine.',
    icon: 'users',
    tone: 'uqz',
    cta: { label: 'Télécharger l’APK', href: '/dl/uqz.apk' },
    details: ['Fil & stories', 'Chat & appels', 'Marché P2P mobile', 'Boutiques & Studio'],
  },
  {
    id: 'borb',
    nom: 'BORB',
    badge: 'Wallet & Nœud',
    description:
      'Portefeuille numérique et nœud financier : ledger, escrow, ordres P2P signés Ed25519 et réserves vérifiables.',
    icon: 'wallet',
    tone: 'borb',
    cta: {
      label: 'Ouvrir le wallet',
      href: 'https://uq-borb-node.onrender.com/wallet',
      externe: true,
    },
    details: ['Clés Ed25519', 'Escrow & ordres', 'Marché fiat', 'Preuves humaines'],
  },
  {
    id: 'uqauth',
    nom: 'UQ AUTH',
    badge: 'Identité',
    description:
      'Identité numérique UQ : création de compte, KYC, 2FA, récupération, sessions et appareils — la clé de tout l’écosystème.',
    icon: 'key',
    tone: 'auth',
    cta: { label: 'Créer un compte', onClick: undefined }, // branché via prop
    details: ['Compte UQ confidentiel', 'KYC vérifié', '2FA & appareils', 'Récupération sûre'],
  },
  {
    id: 'uqmail',
    nom: 'UQ Mail',
    badge: 'Messagerie',
    description:
      'Boîte mail professionnelle adossée à l’identité UQ : envoi et réception par Postfix/Dovecot, stockage et interface UQ.',
    icon: 'mail',
    tone: 'mail',
    cta: { label: 'Bientôt disponible' },
    details: ['Adresse @uq', 'Anti-spam DKIM', 'Interface UQ', 'Liée au compte UQ'],
  },
];

export function LandingScreen({
  onLogin,
  onCreateAccount,
}: {
  onLogin: () => void;
  onCreateAccount: () => void;
}) {
  return (
    <div className="uq-land">
      {/* Fond spatial : étoiles + nébuleuses */}
      <div className="uq-land-space" aria-hidden="true">
        <div className="uq-land-nebula uq-land-nebula--violet" />
        <div className="uq-land-nebula uq-land-nebula--bleu" />
        <div className="uq-land-nebula uq-land-nebula--rouge" />
        <div className="uq-land-stars" />
      </div>

      <div className="uq-land-scroll">
        {/* ---------- En-tête ---------- */}
        <header className="uq-land-head">
          <LogoUQ size={54} />
          <div className="uq-land-brand">
            <div className="uq-land-brand-name">UQ Platform</div>
            <div className="uq-land-brand-sub">par UFUNDI QUOTIDIEN</div>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section className="uq-land-hero">
          <div className="uq-land-hero-badge">
            <Icon name="sparkles" size={14} /> Groupe d’entrepreneurs — éditeurs de logiciels &amp; APK
          </div>
          <h1 className="uq-land-title">
            Une identité.
            <br />
            <span>Tout un écosystème.</span>
          </h1>
          <p className="uq-land-lead">
            UFUNDI QUOTIDIEN conçoit et publie des applications et services
            souverains : réseau social, wallet numérique, identité sécurisée
            et messagerie — un seul compte UQ pour tout relier.
          </p>

          <div className="uq-land-cta">
            <button type="button" className="uq-land-btn uq-land-btn--primary" onClick={onCreateAccount}>
              <Icon name="user" size={18} /> Créer un compte UQ
            </button>
            <button type="button" className="uq-land-btn uq-land-btn--ghost" onClick={onLogin}>
              <Icon name="lock" size={18} /> Se connecter
            </button>
          </div>
        </section>

        {/* ---------- Vitrine produits ---------- */}
        <section className="uq-land-produits">
          <div className="uq-land-section-title">
            <span>Nos produits</span>
            <span className="uq-land-section-line" />
          </div>

          <div className="uq-land-grid">
            {PRODUITS.map((p) => (
              <article key={p.id} className={`uq-land-card uq-land-card--${p.tone}`}>
                <div className="uq-land-card-top">
                  <div className="uq-land-card-icon">
                    <Icon name={p.icon as never} size={24} />
                  </div>
                  <div className="uq-land-card-badge">{p.badge}</div>
                </div>
                <h2 className="uq-land-card-nom">{p.nom}</h2>
                <p className="uq-land-card-desc">{p.description}</p>
                <ul className="uq-land-card-details">
                  {p.details.map((d) => (
                    <li key={d}>
                      <Icon name="check" size={13} /> {d}
                    </li>
                  ))}
                </ul>
                {p.id === 'uqauth' ? (
                  <button
                    type="button"
                    className="uq-land-card-cta"
                    onClick={onCreateAccount}
                  >
                    Créer un compte UQ <Icon name="forward" size={15} />
                  </button>
                ) : p.cta?.href ? (
                  <a
                    className="uq-land-card-cta"
                    href={p.cta.href}
                    {...(p.cta.externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {p.cta.label} <Icon name="external" size={15} />
                  </a>
                ) : (
                  <span className="uq-land-card-cta uq-land-card-cta--soon">
                    {p.cta?.label ?? 'Bientôt'}
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Manifeste ---------- */}
        <section className="uq-land-manifeste">
          <Icon name="building" size={30} />
          <p>
            <strong>UFUNDI QUOTIDIEN</strong> — groupe d’entrepreneurs et
            éditeurs de logiciels. Nous construisons des applications
            mobiles, des services web et des infrastructures qui appartiennent
            à leurs utilisateurs : vos données, vos clés, vos règles.
          </p>
        </section>

        {/* ---------- Pied ---------- */}
        <footer className="uq-land-foot">
          <div className="uq-land-foot-links">
            <button type="button" onClick={() => window.open('/?ecran=politiques&sujet=conditions-utilisation', '_blank', 'noopener')}>
              Conditions d’utilisation
            </button>
            <button type="button" onClick={() => window.open('/?ecran=politiques&sujet=confidentialite', '_blank', 'noopener')}>
              Politique de confidentialité
            </button>
            <button type="button" onClick={onLogin}>
              Espace membre
            </button>
          </div>
          <div className="uq-land-foot-copy">
            © {new Date().getFullYear()} UFUNDI QUOTIDIEN — UQ Platform. Tous droits réservés.
          </div>
        </footer>
      </div>
    </div>
  );
}
