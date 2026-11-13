// ============================================================================
// ReputationPolicySheet.tsx — Politique de réputation UQ (texte intégral)
// ============================================================================

import type { CSSProperties, ReactNode } from 'react';
import { Sheet } from './Ui';
import { Icon } from './Icon';

interface ReputationPolicySheetProps {
  open: boolean;
  onClose: () => void;
}

function Titre({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 15,
        fontWeight: 750,
        letterSpacing: '-0.01em',
        margin: '18px 0 8px',
      }}
    >
      {children}
    </div>
  );
}

function SousTitre({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 13.5, fontWeight: 700, margin: '14px 0 6px' }}>{children}</div>
  );
}

function P({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--v2-ink-2)', margin: '0 0 8px', ...style }}>
      {children}
    </p>
  );
}

function Ul({ children }: { children: ReactNode }) {
  return (
    <ul style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--v2-ink-2)', margin: '0 0 8px', paddingLeft: 18 }}>
      {children}
    </ul>
  );
}

function Couleur({
  emoji,
  titre,
  children,
}: {
  emoji: string;
  titre: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        background: 'var(--v2-surface-2)',
        border: '1px solid var(--v2-line)',
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1.3, flex: 'none' }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 750, marginBottom: 6 }}>{titre}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--v2-ink-2)' }}>{children}</div>
      </div>
    </div>
  );
}

const COULEURS: Array<{ emoji: string; titre: string; children: ReactNode }> = [
  {
    emoji: '🟢',
    titre: 'Vert — Confiance active',
    children: (
      <>
        <p style={{ margin: '0 0 6px' }}>
          <b>Ce que c'est :</b> votre capital confiance actuel. C'est le score qui reflète vos
          actions réelles sur la plateforme.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Comment il augmente :</b> à chaque opération réussie, sans exception :
        </p>
        <Ul>
          <li>Vente dans votre boutique UQ</li>
          <li>Vente d'un élément seul sur Zando</li>
          <li>Service payant rendu sur UQ</li>
          <li>Transaction réussie (dépôt, retrait, transfert)</li>
          <li>Opération P2P mobile réussie (achat, pas la création d'ordre)</li>
          <li>Échange de monnaie UQ réussi</li>
          <li>Toute activité liée aux échanges monétaires, réussie</li>
        </Ul>
        <p style={{ margin: '0 0 6px' }}>
          <b>Plafond :</b> aucun. Le vert peut monter à l'infini.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Affichage :</b> au-delà de 1 000, l'affichage indique <code>1K+</code>, avec le
          détail des fautes en dessous, du type <code>− 10</code>, pour ne jamais cacher les
          fautes dans un grand nombre.
        </p>
        <p style={{ margin: 0 }}>
          <b>Comment il baisse :</b> chaque faute reconnue par jugement public retire{' '}
          <b>10 verts</b>. Si vous avez moins de 10 verts au moment de la sanction, votre solde
          tombe à <b>0</b> — jamais en dessous.
        </p>
      </>
    ),
  },
  {
    emoji: '⚪',
    titre: 'Blanc — Mémoire de vos réussites',
    children: (
      <>
        <p style={{ margin: '0 0 6px' }}>
          <b>Ce que c'est :</b> la mémoire de votre plus haut niveau de verts atteint. C'est votre
          historique de confiance.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Comment il évolue :</b>
        </p>
        <Ul>
          <li>Il <b>monte</b> à chaque action réussie, tant que vous n'êtes pas en sanction</li>
          <li>Il <b>ne baisse jamais</b>, même après une sanction</li>
          <li>Il est <b>temporairement figé</b> pendant une sanction</li>
          <li>Il <b>reprend</b> dès que vous avez retrouvé votre niveau de verts d'avant la faute</li>
        </Ul>
        <p style={{ margin: '0 0 6px' }}>
          <b>Exemple concret :</b>
        </p>
        <Ul>
          <li>Vous avez 25 verts, 25 blancs, 0 rouge.</li>
          <li>
            Vous commettez une faute → rouge +1, vert −10 → vous avez 15 verts, 25 blancs, 1
            rouge. <b>Le blanc est figé.</b>
          </li>
          <li>
            Vous refaites 10 actions réussies → vert +10, retour à 25 verts,{' '}
            <code>vert_depuis_rouge</code> = 10, le rouge est effacé. <b>Le blanc est débloqué.</b>
          </li>
          <li>Votre prochaine action réussie fait monter le blanc.</li>
        </Ul>
        <p style={{ margin: 0 }}>
          <b>Résultat :</b> le blanc reflète toujours votre meilleur niveau historique. Un membre
          avec <code>blanc &gt; vert</code> est un membre qui a déjà été sanctionné dans le passé
          mais qui s'est racheté — c'est un bon signal.
        </p>
      </>
    ),
  },
  {
    emoji: '🟠',
    titre: 'Orange — Suspect',
    children: (
      <>
        <p style={{ margin: '0 0 6px' }}>
          <b>Ce que c'est :</b> un signal d'avertissement temporaire. Il indique qu'un
          comportement douteux a été détecté automatiquement.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Comment il apparaît :</b>
        </p>
        <Ul>
          <li>
            Quand vous signalez un autre membre <b>sans historique commun valide</b> (accusation
            abusive)
          </li>
          <li>
            Quand deux membres ont un historique commun avec des opérations <b>en cours ou en
            échec</b>, <b>datant de moins de 7 jours</b>
          </li>
        </Ul>
        <p style={{ margin: '0 0 6px' }}>
          <b>Comment il disparaît :</b> si le dossier est rejeté par jugement public, l'orange
          temporaire est retiré.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Conséquence :</b> un cumul d'oranges peut entraîner des restrictions sur votre
          compte (blocage temporaire de certaines fonctionnalités).
        </p>
        <p style={{ margin: 0 }}>
          <b>Ce qu'il ne fait pas :</b> l'orange ne bloque pas immédiatement. Il n'est pas une
          sanction définitive. C'est un signal, pas une condamnation.
        </p>
      </>
    ),
  },
  {
    emoji: '🔴',
    titre: 'Rouge — Faute actuelle',
    children: (
      <>
        <p style={{ margin: '0 0 6px' }}>
          <b>Ce que c'est :</b> une faute reconnue par jugement public. C'est la conséquence d'un
          dossier où la communauté a voté en faveur de la sanction.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Comment il apparaît :</b> uniquement par jugement public, à l'issue des trois jours
          de consultation. Jamais manuellement, jamais arbitrairement.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Conséquence immédiate :</b>
        </p>
        <Ul>
          <li>
            <code>rouge +1</code> sur votre compteur
          </li>
          <li>
            <code>noir +1</code> (mémoire permanente, voir ci-dessous)
          </li>
          <li>
            <code>vert −10</code> (plancher 0)
          </li>
          <li>
            Blocage selon le type de litige :
            <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
              <li>
                <b>P2P</b> → <code>p2p_blocked</code> (vente et création d'offre bloquées)
              </li>
              <li>
                <b>Zando</b> → <code>zando_blocked</code> (publication et vente bloquées,
                boutique dépubliée)
              </li>
              <li>
                <b>Autre</b> → <code>retrait_blocked</code> (retrait bloqué)
              </li>
            </ul>
          </li>
        </Ul>
        <p style={{ margin: '0 0 6px' }}>
          <b>Comment il disparaît :</b> il est <b>rachetable</b>. Chaque action réussie ajoute{' '}
          <code>+1 vert_depuis_rouge</code>. Quand <code>vert_depuis_rouge</code> atteint{' '}
          <b>10</b>, un rouge est effacé et le compteur se remet à zéro. Ce cycle se répète autant
          de fois qu'il y a de rouges.
        </p>
        <p style={{ margin: 0 }}>
          <b>Quand tous les rouges sont effacés</b> (<code>rouge = 0</code>) :
        </p>
        <Ul>
          <li>Les blocages <code>p2p</code>, <code>zando</code>, <code>retrait</code> sont automatiquement levés</li>
          <li>Le seuil de sanction est remis à zéro</li>
          <li>Le blanc reprend sa progression</li>
        </Ul>
      </>
    ),
  },
  {
    emoji: '⬛',
    titre: 'Noir — Mémoire des fautes',
    children: (
      <>
        <p style={{ margin: '0 0 6px' }}>
          <b>Ce que c'est :</b> la mémoire de <b>tous les rouges jamais reçus</b>, qu'ils aient
          été rachetés ou non.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <b>Comment il évolue :</b>
        </p>
        <Ul>
          <li>
            <code>+1</code> à chaque rouge prononcé
          </li>
          <li>
            <b>Ne baisse jamais</b>, même quand le rouge est racheté
          </li>
        </Ul>
        <p style={{ margin: '0 0 6px' }}>
          <b>Ce qu'il ne fait pas :</b> le noir <b>ne bloque rien</b>. Il est purement informatif.
          Il informe les autres membres de votre historique réel — c'est la transparence de la
          plateforme.
        </p>
        <p style={{ margin: 0 }}>
          <b>Exemple :</b> un membre qui a reçu 3 rouges au cours de sa vie a un{' '}
          <code>noir = 3</code>, même s'il a racheté tous ses rouges et que son{' '}
          <code>rouge</code> actuel est 0.
        </p>
      </>
    ),
  },
];

export function ReputationPolicySheet({ open, onClose }: ReputationPolicySheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Politique de réputation">
      <div>
        {/* Principe fondateur */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            background: 'var(--v2-accent-soft)',
            border: '1px solid var(--v2-accent)',
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="shield" size={18} />
            <span style={{ fontSize: 14, fontWeight: 750 }}>
              Principe fondateur : la confiance zéro
            </span>
          </div>
          <P>
            UQ fonctionne sur un principe de <b>confiance zéro</b>. Aucun membre n'est présumé
            digne de confiance par défaut.
          </P>
          <P>
            Avant toute opération avec un autre utilisateur — achat, vente, service, échange de
            monnaie, transaction P2P — il est de votre responsabilité de consulter son graphique
            de réputation publique. Le bouton <b>« i »</b> sur son profil vous donne accès au
            détail complet : les cinq couleurs, l'historique des jugements, et les avis reçus.
          </P>
          <P style={{ marginBottom: 0 }}>
            <b>
              UQ n'est pas responsable des opérations réalisées avec un autre utilisateur sans
              consultation préalable de sa réputation.
            </b>{' '}
            La plateforme fournit les outils de vérification ; à vous de les utiliser.
          </P>
        </div>

        <Titre>Les cinq indicateurs</Titre>
        <P>
          Chaque membre UQ possède une réputation composée de cinq indicateurs indépendants, mis à
          jour automatiquement par le backend. Chaque indicateur a un rôle précis et ne peut pas
          être manipulé.
        </P>

        {COULEURS.map((c) => (
          <Couleur key={c.titre} emoji={c.emoji} titre={c.titre}>
            {c.children}
          </Couleur>
        ))}

        {/* Jugement public */}
        <Titre>Le jugement public</Titre>

        <SousTitre>1. Le signalement</SousTitre>
        <P>
          Un membre signale un autre membre pour une infraction. Le signalement doit être{' '}
          <b>crédible</b> : il faut un historique commun entre les deux parties, avec des
          opérations <b>en cours ou en échec</b>, <b>datant de moins de 7 jours</b>.
        </P>

        <SousTitre>2. La règle des 7 jours</SousTitre>
        <P>
          <b>UQ n'est pas responsable des opérations qui durent plus de 7 jours.</b> Une
          opération de plus de 7 jours ne peut pas servir de base à un signalement. Elle est
          classée comme <b>« accusation non fondée »</b> et reste sans suite.
        </P>
        <P>
          Si vous tentez de signaler un innocent en vous basant sur une opération de plus de 7
          jours, ou sans historique commun valide, vous risquez des restrictions : votre compteur
          orange augmente, et un cumul peut entraîner un blocage temporaire.
        </P>

        <SousTitre>3. Le dossier public</SousTitre>
        <P>
          Si le signalement est crédible, un <b>dossier public</b> est ouvert. Pendant{' '}
          <b>trois jours</b>, la communauté peut :
        </P>
        <Ul>
          <li>
            <b>Consulter</b> le dossier (les deux versions, les historiques)
          </li>
          <li>
            <b>Voter</b> : j'aime / j'aime inversé (tous les membres)
          </li>
          <li>
            <b>Commenter</b> : uniquement les membres ayant un historique commun avec
            l'accusateur ou l'accusé
          </li>
        </Ul>

        <SousTitre>4. La décision</SousTitre>
        <P>
          À l'issue des trois jours, le backend analyse :
        </P>
        <Ul>
          <li>
            Les <b>votes</b> (j'aime / j'aime inversé)
          </li>
          <li>
            Les <b>commentaires</b> : chaque commentateur est classé <b>positif</b> (
            <code>rouge = 0</code> et <code>noir = 0</code>) ou <b>litigieux</b> (
            <code>rouge &gt; 0</code> ou <code>noir &gt; 0</code>)
          </li>
        </Ul>
        <P>
          <b>Règle de décision :</b>
        </P>
        <Ul>
          <li>
            Si <code>litigieux &gt; positifs</code> <b>OU</b>{' '}
            <code>likes_inverses &gt; likes</code> → <b>sanction</b>
          </li>
          <li>Sinon → <b>rejet</b></li>
        </Ul>

        <SousTitre>5. Application</SousTitre>
        <P>
          <b>Si sanction :</b>
        </P>
        <Ul>
          <li>
            L'accusé reçoit <code>rouge +1</code>, <code>noir +1</code>,{' '}
            <code>vert −10</code> (plancher 0)
          </li>
          <li>Blocage selon le type de litige (P2P, Zando, retrait)</li>
          <li>Le seuil de sanction est mémorisé</li>
        </Ul>
        <P>
          <b>Si rejet :</b>
        </P>
        <Ul>
          <li>L'orange temporaire de l'accusé est retiré (<code>orange −1</code>)</li>
          <li>Aucune autre conséquence</li>
        </Ul>

        <SousTitre>6. Purge</SousTitre>
        <P>
          Les dossiers sont ensuite <b>purgés</b> : votes, commentaires et dossier supprimés.
          Aucune donnée personnelle n'est conservée au-delà du jugement.
        </P>

        {/* Rachat */}
        <Titre>Le rachat</Titre>
        <P>
          Un rouge s'efface après <b>10 actions réussies consécutives</b>. Le compteur de rachat (
          <code>vert_depuis_rouge</code>) se remet à zéro à chaque nouveau rouge.
        </P>
        <P>
          Le noir, lui, <b>reste pour toujours</b> : il est la mémoire honnête de votre parcours.
        </P>
        <P>
          <b>Ce que ça implique :</b> un membre peut toujours se racheter et retrouver toutes ses
          fonctionnalités. Mais son historique reste visible. C'est la transparence de la
          plateforme.
        </P>

        {/* Conseil */}
        <Titre>Conseil avant toute opération</Titre>
        <P>
          Avant d'effectuer une opération avec un autre membre UQ,{' '}
          <b>consultez son graphique de réputation publique</b>. Le bouton <b>« i »</b> sur son
          profil donne accès au détail complet : les cinq couleurs et l'historique.
        </P>
        <P>
          Les politiques de réputation sont justes et <b>ne peuvent pas être manipulées</b>. Toute
          tentative de manipulation entraîne le <b>bannissement définitif</b> du compte.
        </P>

        {/* Un seul compte */}
        <Titre>Un seul compte par personne</Titre>
        <P>
          Chaque personne ne peut posséder qu'<b>un seul compte UQ</b>. Des techniques avancées
          sont utilisées pour détecter toute tentative de création d'un second compte.
        </P>
        <P>
          Si vous tentez de créer un second compte, vous risquez de <b>sévères restrictions</b> sur
          votre compte principal. Il est demandé de conserver précieusement votre compte, car il
          n'est <b>pas possible</b> de posséder deux comptes par personne.
        </P>

        {/* Ce que voit le public */}
        <Titre>Ce que voit le public sur votre profil</Titre>
        <P>Sur votre profil public, les autres membres voient :</P>
        <Ul>
          <li>La <b>couleur de votre anneau</b> (état actuel : rouge, orange, vert ou blanc)</li>
          <li>
            Vos <b>trois compteurs publics</b> : vert, blanc, noir
          </li>
          <li>Vos <b>avis</b> (note moyenne sur 5)</li>
          <li>
            Votre bloc <b>« À propos »</b> (selon vos réglages de confidentialité)
          </li>
        </Ul>
        <P>
          Le bouton <b>« i »</b> ouvre le détail complet : les cinq couleurs et l'historique.
        </P>

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--v2-line)',
            fontSize: 11.5,
            color: 'var(--v2-ink-3)',
            textAlign: 'center',
          }}
        >
          Dernière mise à jour : novembre 2026.
        </div>
      </div>
    </Sheet>
  );
}
