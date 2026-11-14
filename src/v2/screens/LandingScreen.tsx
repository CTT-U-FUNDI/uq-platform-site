// ============================================================================
// LandingScreen — vitrine officielle UQ Platform / UFUNDI QUOTIDIEN
// ============================================================================
//
// Site vitrine professionnel : hero, applications, vision, technologie,
// équipe, actualités, contact, footer. Identité cinématique (mesh, dot-grid,
// grain SVG, or) distincte de l'app UQZ.
//
// Deep links : /?ecran=verification|politiques|faq|aide|creation

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LogoUQ } from '../../components/ui/LogoUQ';
import { Icon } from '../components/Icon';
import '../styles/landing.css';

interface Application {
  nom: string;
  role: string;
  statut: 'Disponible' | 'En développement' | 'À venir';
  icon: string;
  accent: string;
  lien?: { label: string; href?: string; externe?: boolean };
}

const APPLICATIONS: Application[] = [
  {
    nom: 'UQZ',
    role: 'La super-app : identité, social, trading, chat, Zando — le hub central.',
    statut: 'En développement',
    icon: 'users',
    accent: '#fb7185',
    lien: { label: 'Télécharger l’APK', href: '/dl/uqz.apk' },
  },
  {
    nom: 'UQ Chat',
    role: 'Messagerie P2P, statuts et échanges sécurisés entre membres.',
    statut: 'En développement',
    icon: 'chat',
    accent: '#60a5fa',
  },
  {
    nom: 'UQ Studio',
    role: 'Publication solo, mini-sites et boutiques en ligne.',
    statut: 'En développement',
    icon: 'palette',
    accent: '#c084fc',
  },
  {
    nom: 'BORB',
    role: 'Wallet virtuel et nœud financier : ledger, escrow, ordres signés Ed25519.',
    statut: 'En développement',
    icon: 'wallet',
    accent: '#34d399',
    lien: {
      label: 'Ouvrir le wallet',
      href: 'https://uq-borb-node.onrender.com/wallet',
      externe: true,
    },
  },
  {
    nom: 'UQ Trading',
    role: 'Carnet d’ordres P2P, conversion BORB, marché fiat.',
    statut: 'En développement',
    icon: 'coin',
    accent: '#fbbf24',
  },
  {
    nom: 'UQ Learn',
    role: 'Formation, tutoriels et certification.',
    statut: 'À venir',
    icon: 'book',
    accent: '#38bdf8',
  },
  {
    nom: 'UQ Health',
    role: 'Santé, rendez-vous et téléconsultation.',
    statut: 'À venir',
    icon: 'heart',
    accent: '#f472b6',
  },
  {
    nom: 'UQ Gov',
    role: 'Services publics et démarches administratives.',
    statut: 'À venir',
    icon: 'building',
    accent: '#a78bfa',
  },
];

const PILIERS = [
  {
    icon: 'shield',
    titre: 'Souveraineté',
    texte: 'Tes données t’appartiennent. Ton identité est protégée. Ton argent est sécurisé.',
  },
  {
    icon: 'bolt',
    titre: 'Portabilité',
    texte: 'Fonctionne sur tous les appareils, même sans internet. Du smartphone au serveur.',
  },
  {
    icon: 'users',
    titre: 'Communauté',
    texte: 'Une plateforme construite avec et pour les Africains.',
  },
];

const TECHNOS = [
  {
    icon: 'shield',
    titre: 'BORB',
    texte: 'Notre score de sécurisation de la monnaie : une réserve invisible, stable et vérifiable.',
  },
  {
    icon: 'rng',
    titre: 'Blockchain légère',
    texte: 'Une chaîne cryptographique portable (50 Mo max) qui ne grossit jamais.',
  },
  {
    icon: 'phone',
    titre: 'Mode offline',
    texte: 'Fonctionne sans internet et se synchronise à la reconnexion.',
  },
  {
    icon: 'lock',
    titre: 'Sécurité',
    texte: 'Chiffrement, PIN, signatures Ed25519, KYC et vérification humaine.',
  },
];

const ACTUS = [
  {
    date: 'Nov. 2025',
    tag: 'Produit',
    titre: 'UQZ entre en bêta fermée',
    texte: 'Le hub social, la messagerie et le market P2P mobile sont testés en conditions réelles.',
  },
  {
    date: 'Oct. 2025',
    tag: 'Infrastructure',
    titre: 'Nœud BORB : escrow et ordres signés',
    texte: 'Le moteur d’ordres P2P est déployé avec signatures Ed25519 et réserves vérifiables.',
  },
  {
    date: 'Oct. 2025',
    tag: 'Produit',
    titre: 'UQ Mail : l’architecture est arrêtée',
    texte: 'Boîte mail professionnelle adossée à l’identité UQ — Postfix/Dovecot côté serveur.',
  },
];

const STATUT_STYLE: Record<Application['statut'], string> = {
  'Disponible': 'uq-land-statut--live',
  'En développement': 'uq-land-statut--dev',
  'À venir': 'uq-land-statut--soon',
};

export function LandingScreen({
  onLogin,
  onCreateAccount,
}: {
  onLogin: () => void;
  onCreateAccount: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [contact, setContact] = useState({ nom: '', email: '', message: '' });
  const [contactEtat, setContactEtat] = useState<'repos' | 'envoi' | 'envoye' | 'erreur'>('repos');

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
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const envoyerContact = async (e: FormEvent) => {
    e.preventDefault();
    if (contactEtat === 'envoi') return;
    setContactEtat('envoi');
    const api = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
    try {
      const r = await fetch(`${api}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (r.ok) {
        setContact({ nom: '', email: '', message: '' });
        setContactEtat('envoye');
        return;
      }
    } catch {
      /* API injoignable → fallback mailto */
    }
    // Fallback : ouvre le client mail pré-rempli
    const sujet = encodeURIComponent(`Contact site — ${contact.nom || 'visiteur'}`);
    const corps = encodeURIComponent(
      `Nom : ${contact.nom}\nEmail : ${contact.email}\n\n${contact.message}`
    );
    window.location.href = `mailto:contact@uqplatform.com?subject=${sujet}&body=${corps}`;
    setContactEtat('repos');
  };

  const scrollVers = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
            <a href="#applications" onClick={(e) => { e.preventDefault(); scrollVers('applications'); }}>Applications</a>
            <a href="#vision" onClick={(e) => { e.preventDefault(); scrollVers('vision'); }}>Vision</a>
            <a href="#technologie" onClick={(e) => { e.preventDefault(); scrollVers('technologie'); }}>Technologie</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollVers('contact'); }}>Contact</a>
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
          <div className="uq-land-hero-inner">
            <div className="uq-land-hero-copy uq-land-reveal">
              <div className="uq-land-hero-eyebrow">
                <span className="uq-land-eyebrow-dot" />
                Groupe d’entrepreneurs — éditeurs de logiciels &amp; APK
              </div>
              <h1 className="uq-land-title">
                Une plateforme,
                <br />
                des <em>applications</em>,
                <br />
                une vision.
              </h1>
              <p className="uq-land-lead">
                UQ Platform édite des logiciels et applications mobiles pensés
                pour l’Afrique. Sécurité, portabilité, innovation — un seul
                compte UQ pour tout relier.
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
                  onClick={() => scrollVers('applications')}
                >
                  Découvrir nos applications
                </button>
              </div>
              <div className="uq-land-hero-meta">
                <span><strong>08</strong> applications</span>
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
                <Icon name="chat" size={15} /> UQ Chat
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
                <span>UQ CHAT</span><i />
                <span>UQ STUDIO</span><i />
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Applications ---------- */}
        <section className="uq-land-produits" id="applications">
          <div className="uq-land-section-head uq-land-reveal">
            <span className="uq-land-section-kicker">Nos applications</span>
            <h2 className="uq-land-section-title">
              Chaque fonctionnalité
              <br />
              est une application à part entière.
            </h2>
            <p className="uq-land-section-sub">
              UQZ est le hub central — mais chaque brique (chat, studio, wallet,
              trading, learn, health, gov) est une application indépendante,
              développée avec soin.
            </p>
          </div>

          <div className="uq-land-grid uq-land-grid--apps">
            {APPLICATIONS.map((p, i) => (
              <article
                key={p.nom}
                className="uq-land-card uq-land-card--app uq-land-reveal"
                style={{ ['--reveal-delay' as never]: `${(i % 4) * 80}ms` }}
              >
                <div className="uq-land-card-top">
                  <span
                    className="uq-land-app-icon"
                    style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent}88)` }}
                  >
                    <Icon name={p.icon as never} size={20} />
                  </span>
                  <span className={`uq-land-statut ${STATUT_STYLE[p.statut]}`}>{p.statut}</span>
                </div>
                <h3 className="uq-land-card-nom">{p.nom}</h3>
                <p className="uq-land-card-desc">{p.role}</p>
                {p.lien?.href ? (
                  <a
                    className="uq-land-card-cta"
                    href={p.lien.href}
                    {...(p.lien.externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {p.lien.label} <Icon name="external" size={14} />
                  </a>
                ) : (
                  <span className="uq-land-card-cta uq-land-card-cta--soon">
                    {p.statut === 'À venir' ? 'Bientôt disponible' : 'En savoir plus'}
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Vision ---------- */}
        <section className="uq-land-groupe" id="vision">
          <div className="uq-land-groupe-inner">
            <div className="uq-land-groupe-intro uq-land-reveal">
              <span className="uq-land-section-kicker uq-land-section-kicker--light">
                Notre vision
              </span>
              <h2 className="uq-land-groupe-title">
                En Afrique, le numérique
                <br />
                est fragmenté. Nous changeons ça.
              </h2>
              <p className="uq-land-groupe-texte">
                Les solutions numériques sont souvent fragmentées, coûteuses et
                peu adaptées aux réalités locales. UQ Platform construit une
                super-app qui regroupe identité, argent, commerce, éducation et
                santé — chaque fonctionnalité étant une application indépendante,
                pensée pour fonctionner même sans internet.
              </p>
            </div>
            <div className="uq-land-valeurs">
              {PILIERS.map((v, i) => (
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

        {/* ---------- Technologie ---------- */}
        <section className="uq-land-produits uq-land-produits--tech" id="technologie">
          <div className="uq-land-section-head uq-land-reveal">
            <span className="uq-land-section-kicker">Notre technologie</span>
            <h2 className="uq-land-section-title">
              UQ n’est pas une app de plus.
              <br />
              C’est une infrastructure.
            </h2>
          </div>
          <div className="uq-land-tech-grid">
            {TECHNOS.map((t, i) => (
              <div
                key={t.titre}
                className="uq-land-tech uq-land-reveal"
                style={{ ['--reveal-delay' as never]: `${i * 90}ms` }}
              >
                <span className="uq-land-tech-icon">
                  <Icon name={t.icon as never} size={20} />
                </span>
                <h3>{t.titre}</h3>
                <p>{t.texte}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Équipe ---------- */}
        <section className="uq-land-equipe">
          <div className="uq-land-equipe-inner uq-land-reveal">
            <div className="uq-land-equipe-avatar">EN</div>
            <div className="uq-land-equipe-info">
              <span className="uq-land-section-kicker">L’équipe</span>
              <h2 className="uq-land-equipe-nom">Eliezer Nsarhaza</h2>
              <div className="uq-land-equipe-role">Fondateur &amp; CEO — UFUNDI QUOTIDIEN</div>
              <p className="uq-land-equipe-bio">
                Développeur et entrepreneur congolais, passionné par
                l’innovation et la souveraineté numérique. UQ Platform est son
                projet : bâtir des outils qui appartiennent à leurs utilisateurs.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Actualités ---------- */}
        <section className="uq-land-produits uq-land-produits--actu">
          <div className="uq-land-section-head uq-land-reveal">
            <span className="uq-land-section-kicker">Actualités</span>
            <h2 className="uq-land-section-title">
              UQ est vivant,
              <br />
              actif et transparent.
            </h2>
          </div>
          <div className="uq-land-actu-grid">
            {ACTUS.map((a, i) => (
              <article
                key={a.titre}
                className="uq-land-actu uq-land-reveal"
                style={{ ['--reveal-delay' as never]: `${i * 100}ms` }}
              >
                <div className="uq-land-actu-meta">
                  <span className="uq-land-actu-tag">{a.tag}</span>
                  <span className="uq-land-actu-date">{a.date}</span>
                </div>
                <h3>{a.titre}</h3>
                <p>{a.texte}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Contact ---------- */}
        <section className="uq-land-contact" id="contact">
          <div className="uq-land-contact-inner">
            <div className="uq-land-contact-info uq-land-reveal">
              <span className="uq-land-section-kicker uq-land-section-kicker--light">Contact</span>
              <h2 className="uq-land-groupe-title">
                Parlons de
                <br />
                <em>votre projet.</em>
              </h2>
              <p className="uq-land-groupe-texte">
                Investisseurs, partenaires, médias ou utilisateurs : nous
                lisons chaque message.
              </p>
              <div className="uq-land-contact-mail">
                <Icon name="mail" size={18} />
                <a href="mailto:contact@uqplatform.com">contact@uqplatform.com</a>
              </div>
            </div>
            {contactEtat === 'envoye' ? (
              <div className="uq-land-contact-ok">
                <Icon name="check" size={22} />
                <div>
                  <strong>Message envoyé.</strong>
                  <span>Nous vous répondons sous 48 h à l’adresse indiquée.</span>
                </div>
              </div>
            ) : (
            <form
              className="uq-land-contact-form uq-land-reveal"
              onSubmit={envoyerContact}
            >
              <input
                type="text"
                placeholder="Votre nom"
                value={contact.nom}
                onChange={(e) => setContact({ ...contact, nom: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Votre email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                required
              />
              <textarea
                placeholder="Votre message"
                rows={4}
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
                required
              />
              <button
                type="submit"
                className="uq-land-btn uq-land-btn--primary uq-land-btn--lg"
                disabled={contactEtat === 'envoi'}
              >
                {contactEtat === 'envoi' ? 'Envoi…' : 'Envoyer le message'} <Icon name="send" size={16} />
              </button>
            </form>
            )}
          </div>
        </section>

        {/* ---------- Pied ---------- */}
        <footer className="uq-land-foot">
          <div className="uq-land-foot-cols">
            <div className="uq-land-foot-brand">
              <LogoUQ size={34} />
              <div>
                <div className="uq-land-brand-name">UQ Platform</div>
                <div className="uq-land-brand-sub">par UFUNDI QUOTIDIEN</div>
              </div>
            </div>
            <nav className="uq-land-foot-nav">
              <a href="#applications" onClick={(e) => { e.preventDefault(); scrollVers('applications'); }}>Applications</a>
              <a href="#vision" onClick={(e) => { e.preventDefault(); scrollVers('vision'); }}>Vision</a>
              <a href="#technologie" onClick={(e) => { e.preventDefault(); scrollVers('technologie'); }}>Technologie</a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); scrollVers('contact'); }}>Contact</a>
            </nav>
          </div>
          <div className="uq-land-foot-links">
            <button type="button" onClick={() => window.open('/?ecran=politiques&sujet=conditions-utilisation', '_blank', 'noopener')}>
              Conditions d’utilisation
            </button>
            <button type="button" onClick={() => window.open('/?ecran=politiques&sujet=confidentialite', '_blank', 'noopener')}>
              Politique de confidentialité
            </button>
            <button type="button" onClick={() => window.open('/?ecran=faq', '_blank', 'noopener')}>
              FAQ
            </button>
            <button type="button" onClick={() => window.open('/?ecran=aide', '_blank', 'noopener')}>
              Aide &amp; guides
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
