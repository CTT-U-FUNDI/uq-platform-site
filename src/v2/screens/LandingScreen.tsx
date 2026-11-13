// ============================================================================
// LandingScreen — vitrine officielle UQ Platform / UFUNDI QUOTIDIEN
// ============================================================================
//
// Design « cinématique » : hero plein écran avec mesh dégradé animé,
// dot-grid, reveal au scroll, marquee, visuels produits (Unsplash libre).
// Identité distincte de l'app UQZ.
//
// Deep links : /?ecran=verification|politiques|creation (gérés par V2App)

import { useEffect, useRef } from 'react';
import { LogoUQ } from '../../components/ui/LogoUQ';
import { Icon } from '../components/Icon';
import '../styles/landing.css';

interface Product {
  id: string;
  nom: string;
  badge: string;
  description: string;
  icon: string;
  image: string;
  accent: string;
  cta?: { label: string; href?: string; externe?: boolean };
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
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70',
    accent: '#ff6b6b',
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
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=70',
    accent: '#2ee6a8',
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
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=70',
    accent: '#a78bfa',
    details: ['Compte UQ confidentiel', 'KYC vérifié', '2FA & appareils', 'Récupération sûre'],
  },
  {
    id: 'uqmail',
    nom: 'UQ Mail',
    badge: 'Messagerie',
    description:
      'Boîte mail professionnelle adossée à l’identité UQ : envoi et réception par Postfix/Dovecot, stockage et interface UQ.',
    icon: 'mail',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=70',
    accent: '#5ab0ff',
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
  const rootRef = useRef<HTMLDivElement>(null);

  // Reveal au scroll (IntersectionObserver)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.uq-land-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('uq-land-reveal--in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="uq-land" ref={rootRef}>
      {/* ---------- Fond : mesh dégradé + dot-grid + grain SVG ---------- */}
      <div className="uq-land-bg" aria-hidden="true">
        <div className="uq-land-mesh">
          <div className="uq-land-blob uq-land-blob--1" />
          <div className="uq-land-blob uq-land-blob--2" />
          <div className="uq-land-blob uq-land-blob--3" />
          <div className="uq-land-blob uq-land-blob--4" />
        </div>
        <div className="uq-land-dots" />
        <svg className="uq-land-grain" aria-hidden="true">
          <filter id="uq-land-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#uq-land-noise)" />
        </svg>
      </div>

      <div className="uq-land-scroll">
        {/* ---------- En-tête ---------- */}
        <header className="uq-land-head">
          <div className="uq-land-brand">
            <LogoUQ size={42} />
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

        {/* ---------- Hero plein écran ---------- */}
        <section className="uq-land-hero">
          <div className="uq-land-hero-inner">
            <div className="uq-land-hero-copy uq-land-reveal">
              <div className="uq-land-hero-eyebrow">
                <span className="uq-land-eyebrow-dot" />
                Groupe d’entrepreneurs — éditeurs de logiciels &amp; APK
              </div>
              <h1 className="uq-land-title">
                Des outils numériques
                <br />
                <em>qui appartiennent</em>
                <br />
                à leurs utilisateurs.
              </h1>
              <p className="uq-land-lead">
                UFUNDI QUOTIDIEN conçoit et publie des applications et services
                souverains : réseau social, wallet numérique, identité
                sécurisée et messagerie — un seul compte UQ pour tout relier.
              </p>
              <div className="uq-land-hero-cta">
                <button
                  type="button"
                  className="uq-land-btn uq-land-btn--primary uq-land-btn--lg"
                  onClick={onCreateAccount}
                >
                  Créer un compte UQ <Icon name="forward" size={17} />
                </button>
                <button
                  type="button"
                  className="uq-land-btn uq-land-btn--ghost uq-land-btn--lg"
                  onClick={onLogin}
                >
                  Se connecter
                </button>
              </div>
              <div className="uq-land-hero-meta">
                <span><strong>04</strong> produits</span>
                <span className="uq-land-meta-sep" />
                <span><strong>01</strong> identité UQ</span>
                <span className="uq-land-meta-sep" />
                <span><strong>100%</strong> auto-hébergé</span>
              </div>
            </div>

            {/* Visuel hero : téléphone stylisé + chips flottantes */}
            <div className="uq-land-hero-visual uq-land-reveal" aria-hidden="true">
              <div className="uq-land-phone">
                <div className="uq-land-phone-screen">
                  <div className="uq-land-phone-notch" />
                  <div className="uq-land-phone-ui">
                    <div className="uq-land-phone-bar" />
                    <div className="uq-land-phone-card uq-land-phone-card--a" />
                    <div className="uq-land-phone-card uq-land-phone-card--b" />
                    <div className="uq-land-phone-card uq-land-phone-card--c" />
                  </div>
                </div>
              </div>
              <div className="uq-land-chip uq-land-chip--1">
                <Icon name="wallet" size={15} /> BORB wallet
              </div>
              <div className="uq-land-chip uq-land-chip--2">
                <Icon name="shield" size={15} /> KYC &amp; 2FA
              </div>
              <div className="uq-land-chip uq-land-chip--3">
                <Icon name="mail" size={15} /> UQ Mail
              </div>
            </div>
          </div>
          <div className="uq-land-scroll-hint" aria-hidden="true">
            <span />
          </div>
        </section>

        {/* ---------- Marquee ---------- */}
        <div className="uq-land-ribbon" aria-hidden="true">
          <div className="uq-land-ribbon-track">
            {Array.from({ length: 2 }).map((_, k) => (
              <div className="uq-land-ribbon-group" key={k}>
                <span>UQZ</span><i />
                <span>BORB</span><i />
                <span>UQ AUTH</span><i />
                <span>UQ MAIL</span><i />
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Bandeau confiance ---------- */}
        <section className="uq-land-trust">
          <div className="uq-land-trust-inner">
            <span className="uq-land-trust-label">Conçu pour la confiance</span>
            <div className="uq-land-trust-items">
              <span className="uq-land-trust-item"><Icon name="shield" size={15} /> Chiffrement Ed25519</span>
              <span className="uq-land-trust-item"><Icon name="lock" size={15} /> Sessions &amp; 2FA</span>
              <span className="uq-land-trust-item"><Icon name="globe" size={15} /> Auto-hébergé</span>
              <span className="uq-land-trust-item"><Icon name="check" size={15} /> Vérification humaine</span>
            </div>
          </div>
        </section>

        {/* ---------- Produits ---------- */}
        <section className="uq-land-produits" id="produits">
          <div className="uq-land-section-head uq-land-reveal">
            <span className="uq-land-section-kicker">Nos produits</span>
            <h2 className="uq-land-section-title">
              Un écosystème,
              <br />
              quatre expériences.
            </h2>
          </div>

          <div className="uq-land-grid">
            {PRODUITS.map((p, i) => (
              <article
                key={p.id}
                className="uq-land-card uq-land-reveal"
                style={{ ['--reveal-delay' as never]: `${i * 90}ms` }}
              >
                <div className="uq-land-card-media">
                  <img src={p.image} alt={p.nom} loading="lazy" />
                  <div className="uq-land-card-media-fade" />
                  <span className="uq-land-card-badge">{p.badge}</span>
                  <span className="uq-land-card-icon">
                    <Icon name={p.icon as never} size={18} />
                  </span>
                </div>
                <div className="uq-land-card-body">
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
                </div>
                <span
                  className="uq-land-card-accent"
                  style={{ background: p.accent }}
                  aria-hidden="true"
                />
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Le groupe ---------- */}
        <section className="uq-land-groupe" id="groupe">
          <div className="uq-land-groupe-bg" aria-hidden="true">
            <div className="uq-land-blob uq-land-blob--5" />
          </div>
          <div className="uq-land-groupe-inner">
            <div className="uq-land-groupe-intro uq-land-reveal">
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
              {VALEURS.map((v, i) => (
                <div
                  key={v.titre}
                  className="uq-land-valeur uq-land-reveal"
                  style={{ ['--reveal-delay' as never]: `${i * 110}ms` }}
                >
                  <div className="uq-land-valeur-icon">
                    <Icon name={v.icon as never} size={19} />
                  </div>
                  <div>
                    <h3>{v.titre}</h3>
                    <p>{v.texte}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA final ---------- */}
        <section className="uq-land-final">
          <div className="uq-land-final-inner uq-land-reveal">
            <h2 className="uq-land-final-title">
              Prêt à entrer
              <br />
              <em>dans l’écosystème ?</em>
            </h2>
            <p>
              Créez votre compte UQ en quelques minutes — une seule identité
              pour UQZ, BORB, UQ AUTH et UQ Mail.
            </p>
            <div className="uq-land-hero-cta">
              <button
                type="button"
                className="uq-land-btn uq-land-btn--primary uq-land-btn--lg"
                onClick={onCreateAccount}
              >
                Créer un compte UQ <Icon name="forward" size={17} />
              </button>
              <button
                type="button"
                className="uq-land-btn uq-land-btn--ghost uq-land-btn--lg"
                onClick={onLogin}
              >
                Se connecter
              </button>
            </div>
          </div>
        </section>

        {/* ---------- Pied ---------- */}
        <footer className="uq-land-foot">
          <div className="uq-land-foot-brand">
            <LogoUQ size={34} />
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
