// ============================================================================
// PublicPages — pages publiques officielles UQ Platform
// ============================================================================
//
// Politiques & règles, FAQ et Aide — rendues dans l'identité cinématique
// de la vitrine (distincte de l'app UQZ). Accessibles via deep links :
//   ?ecran=politiques[&sujet=slug]   ?ecran=faq   ?ecran=aide
//
// Les contenus de politiques restent des « pages à compléter » — on
// n'invente pas de texte légal. La FAQ et l'Aide contiennent des réponses
// produit réelles.

import { useState } from 'react';
import { LogoUQ } from '../../components/ui/LogoUQ';
import { Icon } from '../components/Icon';
import { PARTIES, PARTIES_SYSTEME, trouverMatiere } from './PolitiquesScreen';
import '../styles/landing.css';

type PageId = 'menu' | 'politiques' | 'faq' | 'aide';
type Vue = { page: PageId; sujet?: string | null };

interface FaqItem {
  q: string;
  r: string;
}

interface AideArticle {
  titre: string;
  icon: string;
  etapes: string[];
}

const FAQ_PAR_THEME: { theme: string; items: FaqItem[] }[] = [
  {
    theme: 'Compte & accès',
    items: [
      {
        q: 'Comment créer un compte UQ ?',
        r: 'Sur uqplatform.com, cliquez « Créer un compte ». UQ Platform vous délivre un numéro UQ confidentiel et un PIN — conservez-les précieusement, ce sont vos identifiants de connexion.',
      },
      {
        q: 'Qu’est-ce que le numéro UQ ?',
        r: 'C’est votre identifiant confidentiel de connexion. Il n’est jamais public : vos interlocuteurs voient un pseudo ou une adresse publique, pas votre numéro UQ.',
      },
      {
        q: 'J’ai perdu mon PIN ou mon numéro UQ, que faire ?',
        r: 'Utilisez la procédure de récupération de compte depuis l’écran de connexion. Si vous avez activé la 2FA ou la phrase de récupération, suivez les étapes indiquées. Contactez le support en dernier recours.',
      },
      {
        q: 'Pourquoi une vérification humaine à la connexion ?',
        r: 'C’est une preuve que vous êtes un humain, pas un robot — elle est demandée une seule fois à la connexion (puis valable 24 h), jamais pendant vos opérations : envois, conversions, ordres.',
      },
    ],
  },
  {
    theme: 'Wallet BORB',
    items: [
      {
        q: 'Comment activer mon wallet BORB ?',
        r: 'Connectez-vous avec votre compte UQ : si aucun wallet n’existe, la phrase de sécurité 24 mots est générée automatiquement, puis cliquez « Activer mon BORB wallet ». La vérification humaine et la signature sécurisent l’activation.',
      },
      {
        q: 'Que faire de ma phrase de 24 mots ?',
        r: 'C’est la clé maître de votre wallet : notez-la hors ligne, ne la partagez jamais, ne la saisissez nulle part sauf pour restaurer votre wallet. UQ ne peut pas la récupérer.',
      },
      {
        q: 'Pourquoi le KYC est-il demandé ?',
        r: 'Le KYC (vérification d’identité) est requis pour utiliser UQZ et pour activer/déverrouiller le wallet BORB. Un simple compte UQ et UQ Mail n’en ont pas besoin.',
      },
      {
        q: 'Puis-je utiliser BORB sans connexion internet ?',
        r: 'Oui — le wallet fonctionne en mode local avec un défi de vérification local si le nœud est injoignable. Vos opérations signées sont rejouées lors de la resynchronisation.',
      },
    ],
  },
  {
    theme: 'Produits & services',
    items: [
      {
        q: 'Comment télécharger UQZ ?',
        r: 'Le lien « Télécharger l’APK » sur la page UQZ de uqplatform.com installe la super-app : fil social, messagerie, market P2P mobile, boutiques et Studio.',
      },
      {
        q: 'UQ Mail est-il disponible ?',
        r: 'UQ Mail est en préparation : boîte mail professionnelle adossée à votre identité UQ (Postfix/Dovecot côté serveur, interface UQ côté client). Vous serez informé à sa sortie.',
      },
      {
        q: 'Mon pseudo public est-il lié à mon numéro UQ ?',
        r: 'Non. Votre pseudo et votre prénom sont publics ; votre numéro UQ, votre PIN et votre phrase de récupération restent strictement confidentiels.',
      },
      {
        q: 'Comment signaler un problème ou un abus ?',
        r: 'Depuis l’écran de connexion, menu ⋮ → Politiques & règles, ou contactez le support via la page Contact / Support. Les signalements sont traités selon les politiques de modération.',
      },
    ],
  },
];

const AIDES: AideArticle[] = [
  {
    icon: 'user',
    titre: 'Créer et sécuriser son compte UQ',
    etapes: [
      'Allez sur uqplatform.com et cliquez « Créer un compte ».',
      'UQ Platform vous délivre votre numéro UQ confidentiel et votre PIN — notez-les en lieu sûr.',
      'Depuis l’écran de connexion, activez la 2FA si proposée.',
      'Votre pseudo public se règle dans votre profil — il est modifiable une fois tous les 7 jours.',
    ],
  },
  {
    icon: 'wallet',
    titre: 'Activer le wallet BORB',
    etapes: [
      'Connectez-vous à BORB avec votre compte UQ.',
      'La phrase de sécurité 24 mots s’affiche automatiquement — notez-la hors ligne.',
      'Cliquez « Activer mon BORB wallet » en bas de l’écran.',
      'Résolvez la vérification humaine : l’activation est signée et sécurisée.',
    ],
  },
  {
    icon: 'shield',
    titre: 'Passer la vérification KYC',
    etapes: [
      'Le KYC est requis pour UQZ et pour activer/déverrouiller le wallet BORB.',
      'Suivez les étapes de capture guidée dans l’écran KYC.',
      'Vos documents sont vérifiés côté serveur — comptez un délai de traitement.',
      'Un compte UQ simple et UQ Mail ne nécessitent pas de KYC.',
    ],
  },
  {
    icon: 'lock',
    titre: 'Récupérer l’accès à son compte',
    etapes: [
      'Utilisez « Mot de passe oublié » / récupération sur l’écran de connexion.',
      'Si vous avez votre phrase de 24 mots, elle permet de restaurer le wallet.',
      'La 2FA et les appareils enregistrés sécurisent la récupération.',
      'En dernier recours, contactez le support via la page Contact / Support.',
    ],
  },
  {
    icon: 'mail',
    titre: 'UQ Mail — boîte mail professionnelle',
    etapes: [
      'UQ Mail arrive bientôt : adresse @uq adossée à votre compte UQ.',
      'Envoi/réception gérés par une infrastructure mail dédiée (Postfix/Dovecot).',
      'La messagerie sera accessible depuis la plateforme et UQZ.',
      'Aucun KYC requis pour la messagerie standard.',
    ],
  },
];

function PubHead({ titre, sousTitre, onBack }: { titre: string; sousTitre?: string; onBack: () => void }) {
  return (
    <header className="uq-pub-head">
      <button type="button" className="uq-pub-back" onClick={onBack}>
        <Icon name="arrow-left" size={17} />
      </button>
      <div className="uq-pub-head-brand">
        <LogoUQ size={34} />
        <span>UQ Platform</span>
      </div>
      <div className="uq-pub-head-txt">
        <div className="uq-pub-head-title">{titre}</div>
        {sousTitre && <div className="uq-pub-head-sub">{sousTitre}</div>}
      </div>
    </header>
  );
}

function PubBg() {
  return (
    <div className="uq-land-bg" aria-hidden="true">
      <div className="uq-land-mesh">
        <div className="uq-land-blob uq-land-blob--1" />
        <div className="uq-land-blob uq-land-blob--2" />
        <div className="uq-land-blob uq-land-blob--3" />
      </div>
      <div className="uq-land-dots" />
      <svg className="uq-land-grain" aria-hidden="true">
        <filter id="uq-pub-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#uq-pub-noise)" />
      </svg>
    </div>
  );
}

export function PublicPages({
  pageInitial = 'menu',
  sujetInitial = null,
  onBack,
}: {
  pageInitial?: PageId;
  sujetInitial?: string | null;
  onBack: () => void;
}) {
  const [vue, setVue] = useState<Vue>({
    page: sujetInitial ? 'politiques' : pageInitial,
    sujet: sujetInitial,
  });
  const [faqOuvert, setFaqOuvert] = useState<number | null>(null);
  const [aideOuvert, setAideOuvert] = useState<number | null>(null);

  const ouvrir = (page: PageId, sujet?: string | null) =>
    setVue({ page, sujet: sujet ?? null });

  const totalPolitiques = PARTIES.reduce((n, p) => n + p.matieres.length, 0);

  // ---------------- Détail d'un sujet politique ----------------
  if (vue.page === 'politiques' && vue.sujet) {
    const courant = trouverMatiere(vue.sujet);
    if (courant) {
      const { matiere, partie } = courant;
      return (
        <div className="uq-land uq-pub">
          <PubBg />
          <div className="uq-pub-scroll">
            <PubHead titre={matiere.titre} sousTitre={partie} onBack={() => ouvrir('politiques')} />
            <main className="uq-pub-main">
              <article className="uq-pub-card">
                <div className="uq-pub-card-icon">
                  <Icon name={matiere.icon as never} size={20} />
                </div>
                <h1 className="uq-pub-card-title">{matiere.titre}</h1>
                <div className="uq-pub-card-partie">{partie}</div>
                <div className="uq-pub-card-body">
                  <h2>Contenu prévu</h2>
                  <p>{matiere.contenu}</p>
                  {matiere.inspire && (
                    <p className="uq-pub-card-ref">Référence produit : {matiere.inspire}</p>
                  )}
                </div>
                <div className="uq-pub-note">
                  <Icon name="info" size={15} />
                  Page en cours de rédaction — le contenu définitif arrive prochainement.
                </div>
              </article>
            </main>
          </div>
        </div>
      );
    }
  }

  // ---------------- Liste des politiques ----------------
  if (vue.page === 'politiques') {
    return (
      <div className="uq-land uq-pub">
        <PubBg />
        <div className="uq-pub-scroll">
          <PubHead
            titre="Politiques & règles"
            sousTitre={`${totalPolitiques} sujets — cadre légal, réputation, sanctions, marketplace`}
            onBack={vue.sujet ? () => ouvrir('menu') : onBack}
          />
          <main className="uq-pub-main">
            <div className="uq-pub-intro">
              <span className="uq-land-section-kicker">Cadre UQ</span>
              <h1 className="uq-pub-page-title">Politiques &amp; règles</h1>
              <p>
                Les règles qui encadrent UQZ, BORB, UQ AUTH et UQ Mail : compte,
                sécurité, réputation, modération et économie.
              </p>
            </div>

            {PARTIES.map((partie) => (
              <section key={partie.id} className="uq-pub-section">
                <h2 className="uq-pub-section-title">{partie.titre}</h2>
                <div className="uq-pub-list">
                  {partie.matieres.map((m) => (
                    <button
                      key={m.slug}
                      type="button"
                      className="uq-pub-item"
                      onClick={() => ouvrir('politiques', m.slug)}
                    >
                      <span className="uq-pub-item-icon">
                        <Icon name={m.icon as never} size={17} />
                      </span>
                      <span className="uq-pub-item-txt">
                        <span className="uq-pub-item-title">{m.titre}</span>
                        <span className="uq-pub-item-sub">{m.contenu}</span>
                      </span>
                      <Icon name="forward" size={16} className="uq-pub-item-chev" />
                    </button>
                  ))}
                </div>
              </section>
            ))}

            <section className="uq-pub-section">
              <h2 className="uq-pub-section-title">Les 17 parties du système</h2>
              <div className="uq-pub-card uq-pub-card--flat">
                <p className="uq-pub-systeme">{PARTIES_SYSTEME.join(' · ')}</p>
                <p className="uq-pub-card-ref">
                  Chaque partie pioche dans les matières ci-dessus selon ses besoins.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  // ---------------- FAQ ----------------
  if (vue.page === 'faq') {
    return (
      <div className="uq-land uq-pub">
        <PubBg />
        <div className="uq-pub-scroll">
          <PubHead titre="FAQ" sousTitre="Questions fréquentes — compte, wallet, produits" onBack={onBack} />
          <main className="uq-pub-main">
            <div className="uq-pub-intro">
              <span className="uq-land-section-kicker">Aide</span>
              <h1 className="uq-pub-page-title">Questions fréquentes</h1>
              <p>Les réponses essentielles pour démarrer avec l’écosystème UQ.</p>
            </div>
            {FAQ_PAR_THEME.map((theme) => (
              <section key={theme.theme} className="uq-pub-section">
                <h2 className="uq-pub-section-title">{theme.theme}</h2>
                <div className="uq-pub-list">
                  {theme.items.map((item, i) => {
                    const globalIdx = FAQ_PAR_THEME.slice(0, FAQ_PAR_THEME.indexOf(theme)).reduce((n, t) => n + t.items.length, 0) + i;
                    const open = faqOuvert === globalIdx;
                    return (
                      <div key={item.q} className={`uq-pub-acc ${open ? 'uq-pub-acc--open' : ''}`}>
                        <button
                          type="button"
                          className="uq-pub-acc-head"
                          onClick={() => setFaqOuvert(open ? null : globalIdx)}
                        >
                          <span>{item.q}</span>
                          <Icon name={open ? 'minus' : 'plus'} size={16} />
                        </button>
                        {open && <div className="uq-pub-acc-body">{item.r}</div>}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>
    );
  }

  // ---------------- Aide ----------------
  if (vue.page === 'aide') {
    return (
      <div className="uq-land uq-pub">
        <PubBg />
        <div className="uq-pub-scroll">
          <PubHead titre="Aide" sousTitre="Guides pas à pas — compte, wallet, KYC, récupération" onBack={onBack} />
          <main className="uq-pub-main">
            <div className="uq-pub-intro">
              <span className="uq-land-section-kicker">Guides</span>
              <h1 className="uq-pub-page-title">Aide &amp; guides</h1>
              <p>Pas à pas pour les gestes du quotidien dans l’écosystème UQ.</p>
            </div>
            <div className="uq-pub-list">
              {AIDES.map((a, i) => {
                const open = aideOuvert === i;
                return (
                  <div key={a.titre} className={`uq-pub-acc ${open ? 'uq-pub-acc--open' : ''}`}>
                    <button
                      type="button"
                      className="uq-pub-acc-head"
                      onClick={() => setAideOuvert(open ? null : i)}
                    >
                      <span className="uq-pub-item-icon">
                        <Icon name={a.icon as never} size={17} />
                      </span>
                      <span className="uq-pub-acc-title">{a.titre}</span>
                      <Icon name={open ? 'minus' : 'plus'} size={16} />
                    </button>
                    {open && (
                      <ol className="uq-pub-acc-body uq-pub-steps">
                        {a.etapes.map((e, j) => (
                          <li key={j}>{e}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ---------------- Menu d'accueil des pages publiques ----------------
  return (
    <div className="uq-land uq-pub">
      <PubBg />
      <div className="uq-pub-scroll">
        <PubHead titre="Centre d’aide" sousTitre="Politiques, FAQ et guides officiels UQ" onBack={onBack} />
        <main className="uq-pub-main">
          <div className="uq-pub-intro">
            <span className="uq-land-section-kicker">UQ Platform</span>
            <h1 className="uq-pub-page-title">Besoin d’aide ?</h1>
            <p>
              Politiques, questions fréquentes et guides pas à pas — tout ce
              qu’il faut savoir pour utiliser UQZ, BORB, UQ AUTH et UQ Mail.
            </p>
          </div>

          <div className="uq-pub-menu">
            <button type="button" className="uq-pub-menu-card" onClick={() => ouvrir('politiques')}>
              <span className="uq-pub-menu-icon"><Icon name="book" size={22} /></span>
              <span className="uq-pub-menu-title">Politiques &amp; règles</span>
              <span className="uq-pub-menu-sub">{totalPolitiques} sujets — cadre légal, réputation, sanctions</span>
              <Icon name="forward" size={18} className="uq-pub-menu-chev" />
            </button>
            <button type="button" className="uq-pub-menu-card" onClick={() => ouvrir('faq')}>
              <span className="uq-pub-menu-icon"><Icon name="message" size={22} /></span>
              <span className="uq-pub-menu-title">FAQ</span>
              <span className="uq-pub-menu-sub">Questions fréquentes — compte, wallet, produits</span>
              <Icon name="forward" size={18} className="uq-pub-menu-chev" />
            </button>
            <button type="button" className="uq-pub-menu-card" onClick={() => ouvrir('aide')}>
              <span className="uq-pub-menu-icon"><Icon name="tool" size={22} /></span>
              <span className="uq-pub-menu-title">Aide &amp; guides</span>
              <span className="uq-pub-menu-sub">Pas à pas : compte, BORB, KYC, récupération</span>
              <Icon name="forward" size={18} className="uq-pub-menu-chev" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
