// ============================================================================
// PolitiquesScreen — Menu des politiques et règles UQ
// ============================================================================
//
// Tableau des matières UQ : 23 sujets regroupés en 6 parties.
// Chaque sujet ouvre une page dédiée. Les contenus sont des pages « à compléter »
// remplies au fur et à mesure de la rédaction — ne pas inventer de texte légal.

import { useState } from 'react';
import { Card, Hint, IconTile, List, Row, ScreenHeader, SectionTitle } from '../components/Ui';
import type { IconName } from '../components/Icon';

interface Matiere {
  slug: string;
  titre: string;
  icon: IconName;
  /** Résumé du contenu prévu (table des matières) — pas le texte final. */
  contenu: string;
  /** Référence d'inspiration produit, affichée pour contexte. */
  inspire?: string;
}

interface PartiePolitiques {
  id: string;
  titre: string;
  matieres: Matiere[];
}

const PARTIES: PartiePolitiques[] = [
  {
    id: 'cadre',
    titre: 'Cadre légal et fondamentaux',
    matieres: [
      {
        slug: 'conditions-utilisation',
        titre: 'Conditions d’utilisation',
        icon: 'file',
        contenu:
          'Ce que l’utilisateur accepte, ce que UQ garantit, ce que UQ ne garantit pas, responsabilités.',
        inspire: 'Wave, TikTok',
      },
      {
        slug: 'confidentialite',
        titre: 'Politique de confidentialité',
        icon: 'eyeOff',
        contenu:
          'Données collectées (GPS, transactions, messages, KYC), durée de conservation, droits, transmission aux autorités.',
        inspire: 'PayPal, TikTok',
      },
      {
        slug: 'mentions-legales',
        titre: 'Mentions légales',
        icon: 'info',
        contenu: 'Éditeur, hébergeur, siège social, contact.',
      },
      {
        slug: 'cookies',
        titre: 'Politique cookies',
        icon: 'settings',
        contenu: 'Traceurs, consentement, finalité.',
      },
    ],
  },
  {
    id: 'compte',
    titre: 'Compte et sécurité',
    matieres: [
      {
        slug: 'securite-compte',
        titre: 'Politique de sécurité',
        icon: 'shield',
        contenu:
          'PIN, 2FA, protection du compte, signalement de compromission, bonnes pratiques.',
        inspire: 'PayPal',
      },
      {
        slug: 'contact-support',
        titre: 'Contact / Support',
        icon: 'mail',
        contenu: 'Comment joindre l’équipe, délais de réponse, voies de recours.',
      },
    ],
  },
  {
    id: 'reputation',
    titre: 'Réputation et sanctions',
    matieres: [
      {
        slug: 'reputation',
        titre: 'Politique de réputation',
        icon: 'star',
        contenu:
          '5 couleurs (vert, blanc, orange, rouge, noir), jugement public, rachat, règle des 7 jours, confiance zéro.',
        inspire: 'TikTok Community Principles',
      },
      {
        slug: 'sanctions',
        titre: 'Politique de sanctions',
        icon: 'alert',
        contenu:
          '7 niveaux de gel (financier léger → définitif), fautes très graves, signalement autorités, contestation publique.',
        inspire: 'TikTok (bans, violations)',
      },
      {
        slug: 'remboursement',
        titre: 'Politique de remboursement',
        icon: 'receipt',
        contenu:
          'Séquestre, code jetable, litige, annulation, acompte, frais.',
        inspire: 'Wave, Lightspeed',
      },
    ],
  },
  {
    id: 'moderation',
    titre: 'Modération et contenu',
    matieres: [
      {
        slug: 'contenu-interdit',
        titre: 'Politique de contenu interdit',
        icon: 'alert',
        contenu:
          'Alcool, tabac, drogues, armes, sexe, mineurs, politique, violence, contrefaçon, médicaments.',
        inspire: 'TikTok (Restricted / Unsupported Products)',
      },
      {
        slug: 'anti-fraude',
        titre: 'Politique anti-fraude',
        icon: 'shield',
        contenu:
          'Faux documents, usurpation d’identité, faux comptes, blanchiment.',
        inspire: 'TikTok (fraud)',
      },
      {
        slug: 'anti-arnaque',
        titre: 'Politique anti-arnaque',
        icon: 'alert',
        contenu:
          'Faux produits, fausses annonces, arnaque au paiement, faux livreur, double vente.',
        inspire: 'TikTok (counterfeit)',
      },
      {
        slug: 'anti-manipulation',
        titre: 'Politique anti-manipulation',
        icon: 'users',
        contenu:
          'Faux avis, faux votes, bots, échange d’avis, achat de réputation, manipulation GPS.',
        inspire: 'TikTok (fake engagement)',
      },
      {
        slug: 'mineurs',
        titre: 'Politique de protection des mineurs',
        icon: 'user',
        contenu:
          'Contenu impliquant des mineurs, sécurité, âge minimum (13 ans), signalement NCMEC/autorités.',
        inspire: 'TikTok (Youth Safety)',
      },
      {
        slug: 'moderation',
        titre: 'Politique de modération',
        icon: 'settings',
        contenu: 'Comment signaler, comment traiter, délais, recours.',
        inspire: 'TikTok (enforcement)',
      },
      {
        slug: 'charte-communautaire',
        titre: 'Charte communautaire',
        icon: 'users',
        contenu:
          'Comportement attendu, respect, inclusivité, non-discrimination.',
        inspire: 'TikTok (Community Principles)',
      },
    ],
  },
  {
    id: 'support',
    titre: 'Support utilisateur',
    matieres: [
      {
        slug: 'aide',
        titre: 'Aide',
        icon: 'book',
        contenu:
          'Comment faire (pas à pas) : créer un compte, publier, acheter, vendre, payer, suivre, litiger.',
        inspire: 'TikTok Help Center',
      },
      {
        slug: 'faq',
        titre: 'FAQ',
        icon: 'chat',
        contenu:
          '10-15 questions/réponses par partie (réputation, marketplace, hors UQ, livreur, etc.).',
      },
      {
        slug: 'guide',
        titre: 'Guide',
        icon: 'book',
        contenu:
          'Tutoriel complet par rôle : acheteur, vendeur, livreur, débutant.',
        inspire: 'TikTok Playbook',
      },
    ],
  },
  {
    id: 'uq',
    titre: 'Spécifique UQ',
    matieres: [
      {
        slug: 'paiement-hors-uq',
        titre: 'Politique de paiement hors UQ',
        icon: 'money',
        contenu:
          'Mode déclaré, 1 % par partie, code jetable, réputation alimentée, historique non enregistré, sanctions.',
        inspire: 'PayPal (paiement)',
      },
      {
        slug: 'marketplace',
        titre: 'Politique marketplace',
        icon: 'market',
        contenu:
          '7 types de produits, séquestre, créneaux, assurance, livreur de confiance.',
        inspire: 'TikTok Shop',
      },
      {
        slug: 'zando',
        titre: 'Politique Zando',
        icon: 'market',
        contenu: 'Spécifique à Zando (produits, enchères, agents, ventes).',
        inspire: 'TikTok Shop',
      },
      {
        slug: 'contestation',
        titre: 'Politique de contestation publique',
        icon: 'users',
        contenu:
          'Gratuité, fonds exposé, commentaires (positif gratuit / négatif payé par le fautif), ratio, déblocage progressif, disparition, relance.',
        inspire: 'TikTok (appeals)',
      },
    ],
  },
];

/** Les 17 parties du système — référence, pas des pages à part. */
const PARTIES_SYSTEME = [
  'UQ',
  'ZANDO',
  'UQ STUDIO',
  'UQ PAY',
  'UQ P2P MOBILE',
  'UQ LECTEUR',
  'UQ COMPTE',
  'UQ CHAT',
  'UQ BOUTIQUE',
  'UQ MINI SITE',
  'UQ WALLET',
  'UQ TRADING',
  'BORB',
  'NUMÉRO UQ',
  'MAIL UQ',
  'CODE PROMO UQ',
  'FRAIS UQ',
];

function trouverMatiere(slug: string): { matiere: Matiere; partie: string } | null {
  for (const partie of PARTIES) {
    const matiere = partie.matieres.find((m) => m.slug === slug);
    if (matiere) return { matiere, partie: partie.titre };
  }
  return null;
}

export function PolitiquesScreen({
  onBack,
  sujetInitial,
}: {
  onBack?: () => void;
  /** Slug optionnel pour ouvrir directement une page (lien profond). */
  sujetInitial?: string | null;
}) {
  const [sujet, setSujet] = useState<string | null>(sujetInitial || null);
  const courant = sujet ? trouverMatiere(sujet) : null;

  // ---------------- Vue détail d'un sujet ----------------
  if (courant) {
    const { matiere, partie } = courant;
    return (
      <div className="v2-screen">
        <ScreenHeader
          title={matiere.titre}
          subtitle={partie}
          onBack={() => setSujet(null)}
        />
        <div className="v2-pad">
          <Card>
            <div className="v2-row-between" style={{ gap: 12 }}>
              <IconTile name={matiere.icon} tone="accent" />
              <div>
                <div className="v2-h3" style={{ fontSize: 17 }}>{matiere.titre}</div>
                <div className="v2-muted" style={{ fontSize: 12 }}>{partie}</div>
              </div>
            </div>
          </Card>

          <div style={{ marginTop: 14 }}>
            <SectionTitle>Contenu prévu</SectionTitle>
            <Card>
              <div className="v2-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                {matiere.contenu}
              </div>
              {matiere.inspire && (
                <div className="v2-muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Référence : {matiere.inspire}
                </div>
              )}
            </Card>
          </div>

          <div style={{ marginTop: 14 }}>
            <Hint icon="info" tone="warning">
              Page en cours de rédaction — le contenu définitif arrive prochainement.
            </Hint>
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    );
  }

  // ---------------- Vue liste (le menu) ----------------
  const total = PARTIES.reduce((n, p) => n + p.matieres.length, 0);
  return (
    <div className="v2-screen">
      <ScreenHeader
        title="Politiques & règles"
        subtitle={`${total} sujets — cadre légal, réputation, sanctions, marketplace`}
        onBack={onBack}
      />
      <div className="v2-pad">
        {PARTIES.map((partie) => (
          <div key={partie.id}>
            <SectionTitle>{partie.titre}</SectionTitle>
            <List>
              {partie.matieres.map((matiere) => (
                <Row
                  key={matiere.slug}
                  icon={matiere.icon}
                  iconTone="accent"
                  title={matiere.titre}
                  subtitle={matiere.contenu}
                  chevron
                  onClick={() => setSujet(matiere.slug)}
                />
              ))}
            </List>
          </div>
        ))}

        <div style={{ marginTop: 18 }}>
          <SectionTitle>Les 17 parties du système</SectionTitle>
          <Card>
            <div className="v2-muted" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
              {PARTIES_SYSTEME.join(' · ')}
            </div>
          </Card>
          <div style={{ marginTop: 10 }}>
            <Hint icon="info">
              Chaque partie pioche dans les matières ci-dessus selon ses besoins.
            </Hint>
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
