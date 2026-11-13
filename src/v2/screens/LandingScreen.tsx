// ============================================================================
// LandingScreen — vitrine officielle UQ Platform / UFUNDI QUOTIDIEN
// ============================================================================
//
// Page de rencontre du groupe : présentation des produits (UQZ, BORB,
// UQ AUTH, UQ Mail), création de compte UQ et liens de téléchargement.
// Identité « institutionnelle » — distincte de l'app UQZ.
//
// Deep links : /?ecran=verification|politiques|creation (gérés par V2App)

import { LogoUQ } from '../../components/ui/LogoUQ';
import { Icon } from '../components/Icon';
import '../styles/landing.css';

interface Product {
  id: string;
  nom: string;
  index: string;
  badge: string;
  description: string;
  icon: string;
  cta?: { label: string; href?: string; externe?: boolean };
  details: string[];
}

const PRODUITS: Product[] = [
  {
    id: 'uqz',
    nom: 'UQZ',
    index: '01',
    badge: 'Super-app',
    description:
      'L’application tout-en-un : fil social, messagerie, market P2P mobile, boutiques et Studio pour créer votre vitrine.',
    icon: 'users',
    cta: { label: 'Télécharger l’APK', href: '/dl/uqz.apk' },
    details: ['Fil & stories', 'Chat & appels', 'Marché P2P mobile', 'Boutiques & Studio'],
  },
  {
    id: 'borb',
    nom: 'BORB',
    index: '02',
    badge: 'Wallet & Nœud',
    description:
      'Portefeuille numérique et nœud financier : ledger, escrow, ordres P2P signés Ed25519 et réserves vérifiables.',
    icon: 'wallet',
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
    index: '03',
    badge: 'Identité',
    description:
      'Identité numérique UQ : création de compte, KYC, 2FA, récupération, sessions et appareils — la clé de tout l’écosystème.',
    icon: 'key',
    details: ['Compte UQ confidentiel', 'KYC vérifié', '2FA & appareils', 'Récupération sûre'],
  },
  {
    id: 'uqmail',
    nom: 'UQ Mail',
    index: '04',
    badge: 'Messagerie',
    description:
      'Boîte mail professionnelle adossée à l’identité UQ : envoi et réception par Postfix/Dovecot, stockage et interface UQ.',
    icon: 'mail',
    details: ['Adresse @uq', 'Anti-spam DKIM', 'Interface UQ', 'Liée au compte UQ'],
  },
];

const VALEURS = [
  {
    icon: 'shield',
    titre: 'Souveraineté',
    texte: 'Vos données, vos clés, vos règles. Chaque service est conçu pour que l’utilisateur garde le contrôle.',
  },
  {
    icon: 'lock',
    titre: 'Sécurité d’abord',
    texte: 'Signatures Ed25519, KYC, 2FA, preuves humaines et audit : la confiance se construit, elle ne se décrète pas.',
  },
  {
    icon: 'building',
    titre: 'Proximité',
    texte: 'Un groupe d’entrepreneurs éditeurs, à l’écoute des marchés locaux et des usages réels du quotidien.',
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
      <div className="uq-land-scroll">
        {/* ---------- En-tête ---------- */}
        <header className="uq-land-head">
          <div className="uq-land-brand">
            <LogoUQ size={44} />
            <div>
              <div className="uq-land-brand-name">UQ Platform</div>
              <div className="uq-land-brand-sub">UFUNDI QUOTIDIEN</div>
            </div>
          </div>
          <nav className="uq-land-nav">
            <a href="#produits">Produits</a>
            <a href="#groupe">Le groupe</a>
          </nav>
          <div className="uq-land-head-actions">
            <button type="button" className="uq-land-link" onClick={onLogin}>
              Se connecter
            </button>
            <button
              type="button"
              className="uq-land-btn uq-land-btn--primary"
              onClick={onCreateAccount}
            >
              Créer un compte
            </button>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section className="uq-land-hero">
          <div className="uq-land-hero-eyebrow">
            <span className="uq-land-eyebrow-dot" />
            Groupe d’entrepreneurs — éditeurs de logiciels &amp; APK
          </div>
          <h1 className="uq-land-title">
            Des outils numériques
            <br />
            <em>qui appartiennent</em> à leurs utilisateurs.
          </h1>
          <p className="uq-land-lead">
            UFUNDI QUOTIDIEN conçoit et publie des applications et services
            souverains : réseau social, wallet numérique, identité sécurisée
            et messagerie — un seul compte UQ pour tout relier.
          </p>
          <div className="uq-land-hero-meta">
            <span><strong>04</strong> produits</span>
            <span className="uq-land-meta-sep" />
            <span><strong>01</strong> identité UQ</span>
            <span className="uq-land-meta-sep" />
            <span><strong>100%</strong> auto-hébergé</span>
          </div>
        </section>

        {/* ---------- Ruban produits ---------- */}
        <div className="uq-land-ribbon" aria-hidden="true">
          <span>UQZ</span><i />
          <span>BORB</span><i />
          <span>UQ AUTH</span><i />
          <span>UQ MAIL</span><i />
          <span>UQZ</span><i />
          <span>BORB</span><i />
          <span>UQ AUTH</span><i />
          <span>UQ MAIL</span><i />
        </div>

        {/* ---------- Produits ---------- */}
        <section className="uq-land-produits" id="produits">
          <div className="uq-land-section-head">
            <span className="uq-land-section-kicker">Nos produits</span>
            <h2 className="uq-land-section-title">
              Un écosystème, quatre expériences.
            </h2>
          </div>

          <div className="uq-land-grid">
            {PRODUITS.map((p) => (
              <article key={p.id} className="uq-land-card">
                <div className="uq-land-card-top">
                  <span className="uq-land-card-index">{p.index}</span>
                  <span className="uq-land-card-badge">{p.badge}</span>
                </div>
                <div className="uq-land-card-icon">
                  <Icon name={p.icon as never} size={22} />
                </div>
                <h3 className="uq-land-card-nom">{p.nom}</h3>
                <p className="uq-land-card-desc">{p.description}</p>
                <ul className="uq-land-card-details">
                  {p.details.map((d) => (
                    <li key={d}>
                      <Icon name="check" size={12} /> {d}
                    </li>
                  ))}
                </ul>
                {p.id === 'uqauth' ? (
                  <button
                    type="button"
                    className="uq-land-card-cta"
                    onClick={onCreateAccount}
                  >
                    Créer un compte UQ <Icon name="forward" size={14} />
                  </button>
                ) : p.cta?.href ? (
                  <a
                    className="uq-land-card-cta"
                    href={p.cta.href}
                    {...(p.cta.externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {p.cta.label} <Icon name="external" size={14} />
                  </a>
                ) : (
                  <span className="uq-land-card-cta uq-land-card-cta--soon">
                    Bientôt disponible
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Le groupe ---------- */}
        <section className="uq-land-groupe" id="groupe">
          <div className="uq-land-groupe-inner">
            <div className="uq-land-groupe-intro">
              <span className="uq-land-section-kicker uq-land-section-kicker--light">
                Le groupe
              </span>
              <h2 className="uq-land-groupe-title">
                UFUNDI QUOTIDIEN,
                <br />
                éditeurs du quotidien.
              </h2>
              <p className="uq-land-groupe-texte">
                Nous sommes un groupe d’entrepreneurs et d’éditeurs de
                logiciels. Nous construisons des applications mobiles, des
                services web et des infrastructures qui appartiennent à leurs
                utilisateurs — la technologie au service des personnes, pas
                l’inverse.
              </p>
            </div>
            <div className="uq-land-valeurs">
              {VALEURS.map((v) => (
                <div key={v.titre} className="uq-land-valeur">
                  <Icon name={v.icon as never} size={20} />
                  <h3>{v.titre}</h3>
                  <p>{v.texte}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Pied ---------- */}
        <footer className="uq-land-foot">
          <div className="uq-land-foot-brand">
            <LogoUQ size={36} />
            <div>
              <div className="uq-land-brand-name">UQ Platform</div>
              <div className="uq-land-brand-sub">par UFUNDI QUOTIDIEN</div>
            </div>
          </div>
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
