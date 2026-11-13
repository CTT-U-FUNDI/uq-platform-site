import type { IconName } from '../components/Icon';

/**
 * Contenu des guides.
 *
 * Objectif d'interface : les écrans ne portent plus que des libellés courts et
 * des pictos ; la prose vit ici, dans des pages d'aide consultables à la demande.
 * Chaque étape décrit un comportement réel de la plateforme (aucune promesse).
 */

export type GuideTopic = 'trading' | 'p2p' | 'coffre' | 'kyc' | 'zando' | 'chat' | 'securite';

export interface GuideStep {
  icon: IconName;
  title: string;
  text: string;
}

export interface Guide {
  topic: GuideTopic;
  icon: IconName;
  title: string;
  tagline: string;
  steps: GuideStep[];
  note?: string;
}

export const GUIDES: Guide[] = [
  {
    topic: 'trading',
    icon: 'trendUp',
    title: 'Trading',
    tagline: 'Devises, oracle et ordres',
    steps: [
      {
        icon: 'globe',
        title: 'Le prix vient de l’oracle',
        text: 'Chaque paire est cotée à partir des taux publiés par la plateforme.',
      },
      {
        icon: 'arrowUpRight',
        title: 'Ordre au marché',
        text: 'Exécution immédiate au prix de l’oracle : la devise est débitée ou créditée tout de suite.',
      },
      {
        icon: 'clock',
        title: 'Ordre limite',
        text: 'Les fonds sont réservés à ton prix. L’ordre ne se déclenche pas seul : annule-le pour récupérer les fonds.',
      },
      {
        icon: 'keypad',
        title: 'Confirmation par PIN',
        text: 'Chaque ordre est signé avec ton code PIN, comme dans le coffre.',
      },
      {
        icon: 'shield',
        title: 'Réserve BORB',
        text: 'C’est la réserve de sécurité de la plateforme : jamais cotée au carnet d’ordres, mais vendable en P2P mobile et convertible en devise virtuelle pour transférer.',
      },
    ],
  },
  {
    topic: 'p2p',
    icon: 'users',
    title: 'P2P mobile',
    tagline: 'Vends du BORB, reçois en devise',
    steps: [
      {
        icon: 'receipt',
        title: 'Publier une offre',
        text: 'Tu vends du BORB : choisis la devise de réception, ton taux local (1 USD = X devise) et les bornes. Le numéro mobile money de ton profil sert de contact.',
      },
      {
        icon: 'lock',
        title: 'Prise en séquestre',
        text: 'Dès qu’une offre est prise, les BORB du vendeur sont bloqués : rien ne circule avant le paiement.',
      },
      {
        icon: 'camera',
        title: 'La preuve de paiement',
        text: 'L’acheteur joint la capture du mobile money et recopie montant, devise, numéro et nom. Le moteur lit l’image avant d’ouvrir « J’ai payé ».',
      },
      {
        icon: 'alert',
        title: 'Verdict et doute assumé',
        text: 'Capture conforme → le bouton s’active. En cas de doute, l’acheteur peut continuer en cochant « J’assume le doute » : le vendeur voit la déclaration et garde le dernier mot.',
      },
      {
        icon: 'check',
        title: 'Libération',
        text: 'Le vendeur contrôle sa recette — et peut joindre sa propre capture — puis libère : les BORB entrent dans le coffre de l’acheteur, vendables en Trading et convertibles en devise virtuelle pour transférer.',
      },
      {
        icon: 'chat',
        title: 'Canal automatique',
        text: 'Une discussion privée s’ouvre dans UQ chat pour chaque commande P2P.',
      },
    ],
    note: 'Sans numéro mobile money dans le profil, publier et prendre une offre sont bloqués. Chaque analyse et chaque issue (validée ou en litige) entraînent le moteur.',
  },
  {
    topic: 'coffre',
    icon: 'wallet',
    title: 'Coffre',
    tagline: 'Soldes, envois et conversions',
    steps: [
      {
        icon: 'coin',
        title: 'Un solde par devise',
        text: 'Chaque devise a son propre solde ; les totaux sont convertis dans ta devise d’affichage.',
      },
      {
        icon: 'shield',
        title: 'Réserve de sécurité',
        text: 'Ta part BORB reste verrouillée : elle garantit la plateforme et ne se trade pas.',
      },
      {
        icon: 'send',
        title: 'Envoyer',
        text: 'Transfert vers un identifiant UQ, confirmé par ton code PIN.',
      },
      {
        icon: 'qr',
        title: 'Recevoir',
        text: 'Partage ton identifiant ou ton QR code pour être crédité.',
      },
      {
        icon: 'swap',
        title: 'Convertir',
        text: 'Le taux appliqué est celui de l’oracle au moment de l’opération.',
      },
    ],
  },
  {
    topic: 'kyc',
    icon: 'shield',
    title: 'Vérification KYC',
    tagline: 'Identité et accès au coffre',
    steps: [
      {
        icon: 'file',
        title: 'Déposer le dossier',
        text: 'Nom, prénom, pays, numéro de pièce et une photo lisible du document.',
      },
      {
        icon: 'clock',
        title: 'Dossier en examen',
        text: 'Un opérateur vérifie ; tu peux continuer à utiliser ton compte pendant l’attente.',
      },
      {
        icon: 'lock',
        title: 'Coffre déverrouillé',
        text: 'Une fois validé, ton coffre s’ouvre et tes plafonds sont relevés.',
      },
      {
        icon: 'alert',
        title: 'Dossier refusé',
        text: 'Corrige les informations, renvoie une photo plus nette, puis renvoie le dossier.',
      },
    ],
  },
  {
    topic: 'zando',
    icon: 'market',
    title: 'Zando',
    tagline: 'Publier et suivre ses annonces',
    steps: [
      {
        icon: 'image',
        title: 'Publier',
        text: 'Un titre, une photo et un prix dans ta devise d’affichage suffisent pour commencer.',
      },
      {
        icon: 'market',
        title: 'Mes annonces',
        text: 'Tes publications apparaissent dans le flux Zando et dans le studio.',
      },
      {
        icon: 'keypad',
        title: 'PIN requis',
        text: 'La mise en ligne est signée avec ton code PIN.',
      },
    ],
  },
  {
    topic: 'chat',
    icon: 'chat',
    title: 'Chat',
    tagline: 'Discussions et canaux',
    steps: [
      {
        icon: 'users',
        title: 'Groupes',
        text: 'Discussions de ta communauté et canaux d’alerte (trésorerie, réseau).',
      },
      {
        icon: 'send',
        title: 'Messages',
        text: 'Le pseudo s’affiche à l’écran ; l’identifiant technique reste utilisé pour l’envoi.',
      },
      {
        icon: 'bell',
        title: 'Notifications',
        text: 'Les nouveaux messages remontent dans la cloche et sur l’onglet Chat.',
      },
    ],
  },
  {
    topic: 'securite',
    icon: 'lock',
    title: 'Sécurité',
    tagline: 'PIN, appareils et profils',
    steps: [
      {
        icon: 'keypad',
        title: 'Code PIN',
        text: 'Il confirme les opérations sensibles : envoi, ordre, publication.',
      },
      {
        icon: 'device',
        title: 'Appareils connectés',
        text: 'La liste des sessions ouvertes, avec la possibilité de les fermer.',
      },
      {
        icon: 'user',
        title: 'Profils',
        text: 'Bascule entre profil personnel et coffre propriétaire selon ton rôle.',
      },
    ],
  },
];

export function guideOf(topic: GuideTopic | null): Guide | undefined {
  if (!topic) return undefined;
  return GUIDES.find((entry) => entry.topic === topic);
}
