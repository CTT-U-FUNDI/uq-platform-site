// ====================
// UQ AI — STRUCTURE DU MENU DÉROULANT
// ====================

import { Lang } from './knowledgeIndex';

export interface SubCategory {
  icon: string;
  label: Record<Lang, string>;
  entryIds: string[];
}

export interface MenuCategory {
  id: string;
  icon: string;
  label: Record<Lang, string>;
  subCategories: SubCategory[];
}

export const MENU_CATEGORIES: MenuCategory[] = [
  // ===== 1. GUIDE D'UTILISATION =====
  {
    id: 'guide',
    icon: '📖',
    label: { fr: 'GUIDE D\'UTILISATION', en: 'USER GUIDE', es: 'GUÍA DE USUARIO', sw: 'MWONGOZO' },
    subCategories: [
      {
        icon: '👤',
        label: { fr: 'Compte', en: 'Account', es: 'Cuenta', sw: 'Akaunti' },
        entryIds: ['faq_create_account', 'faq_forgot_password', 'faq_change_pseudo', 'faq_delete_account'],
      },
      {
        icon: '🔑',
        label: { fr: 'Connexion', en: 'Sign in', es: 'Iniciar sesión', sw: 'Kuingia' },
        entryIds: ['faq_lost_2fa', 'faq_activate_2fa', 'faq_activate_biometric', 'faq_activate_pin'],
      },
      {
        icon: '💸',
        label: { fr: 'Transactions', en: 'Transactions', es: 'Transacciones', sw: 'Miamala' },
        entryIds: ['faq_transfer_speed', 'faq_cancel_transaction', 'faq_wrong_recipient', 'faq_fees', 'faq_history'],
      },
      {
        icon: '🌾',
        label: { fr: 'UBI', en: 'UBI', es: 'UBI', sw: 'UBI' },
        entryIds: ['faq_ubi', 'faq_claim_ubi', 'faq_not_eligible_ubi'],
      },
      {
        icon: '🏪',
        label: { fr: 'Zando', en: 'Zando', es: 'Zando', sw: 'Zando' },
        entryIds: ['faq_sell_zando', 'faq_buy_zando', 'faq_escrow', 'faq_boost_studio'],
      },
      {
        icon: '🎵',
        label: { fr: 'Lecteur UQ', en: 'UQ Reader', es: 'Lector UQ', sw: 'Lector UQ' },
        entryIds: ['faq_reader_principle', 'faq_create_content', 'faq_how_much_earn'],
      },
    ],
  },

  // ===== 2. FAQ =====
  {
    id: 'faq',
    icon: '❓',
    label: { fr: 'FAQ', en: 'FAQ', es: 'FAQ', sw: 'MASWALI' },
    subCategories: [
      {
        icon: '📱',
        label: { fr: 'Compte', en: 'Account', es: 'Cuenta', sw: 'Akaunti' },
        entryIds: ['faq_create_account', 'faq_multiple_accounts', 'faq_change_pseudo', 'faq_delete_account'],
      },
      {
        icon: '🔐',
        label: { fr: 'Sécurité', en: 'Security', es: 'Seguridad', sw: 'Usalama' },
        entryIds: ['faq_activate_pin', 'faq_phone_stolen', 'faq_private_conversations'],
      },
      {
        icon: '💰',
        label: { fr: 'BORB', en: 'BORB', es: 'BORB', sw: 'BORB' },
        entryIds: ['faq_borb_value', 'faq_earn_borb', 'faq_why_40_billion', 'faq_borb_disappear', 'faq_6_units'],
      },
      {
        icon: '💸',
        label: { fr: 'Transactions', en: 'Transactions', es: 'Transacciones', sw: 'Miamala' },
        entryIds: ['faq_fees', 'faq_transfer_speed', 'faq_cancel_transaction', 'faq_limits'],
      },
      {
        icon: '💤',
        label: { fr: 'Recyclage', en: 'Recycling', es: 'Reciclaje', sw: 'Usindikaji' },
        entryIds: ['faq_inactive_3_years', 'faq_recover_account', 'faq_after_10_years', 'faq_after_50_years'],
      },
      {
        icon: '💳',
        label: { fr: 'Dettes', en: 'Debts', es: 'Deudas', sw: 'Madeni' },
        entryIds: ['faq_overdraft', 'faq_repay', 'faq_no_repay'],
      },
    ],
  },

  // ===== 3. SÉCURITÉ =====
  {
    id: 'security',
    icon: '🔐',
    label: { fr: 'SÉCURITÉ', en: 'SECURITY', es: 'SEGURIDAD', sw: 'USALAMA' },
    subCategories: [
      {
        icon: '🛡️',
        label: { fr: 'Principe', en: 'Principle', es: 'Principio', sw: 'Kanuni' },
        entryIds: ['security_fundamental'],
      },
      {
        icon: '🔑',
        label: { fr: 'UqBlackKey', en: 'UqBlackKey', es: 'UqBlackKey', sw: 'UqBlackKey' },
        entryIds: ['security_blackkey'],
      },
      {
        icon: '🧩',
        label: { fr: 'Shamir 3/5', en: 'Shamir 3/5', es: 'Shamir 3/5', sw: 'Shamir 3/5' },
        entryIds: ['security_shamir'],
      },
      {
        icon: '🔐',
        label: { fr: '2FA', en: '2FA', es: '2FA', sw: '2FA' },
        entryIds: ['security_2fa'],
      },
      {
        icon: '🫆',
        label: { fr: 'Biométrie', en: 'Biometrics', es: 'Biometría', sw: 'Biometria' },
        entryIds: ['security_biometric'],
      },
      {
        icon: '⚠️',
        label: { fr: 'Bonnes pratiques', en: 'Best practices', es: 'Buenas prácticas', sw: 'Mazoea bora' },
        entryIds: ['security_best_practices'],
      },
      {
        icon: '🚨',
        label: { fr: 'Piratage', en: 'Hacking', es: 'Pirateo', sw: 'Udakuzi' },
        entryIds: ['security_hacked'],
      },
    ],
  },

  // ===== 4. CONFIDENTIALITÉ =====
  {
    id: 'privacy',
    icon: '📜',
    label: { fr: 'CONFIDENTIALITÉ', en: 'PRIVACY', es: 'CONFIDENCIALIDAD', sw: 'FARAGHA' },
    subCategories: [
      {
        icon: '📋',
        label: { fr: 'Données collectées', en: 'Data collected', es: 'Datos recopilados', sw: 'Data iliyokusanywa' },
        entryIds: ['privacy_data_collected'],
      },
      {
        icon: '🎯',
        label: { fr: 'Utilisation', en: 'Usage', es: 'Uso', sw: 'Matumizi' },
        entryIds: ['privacy_data_usage'],
      },
      {
        icon: '⚖️',
        label: { fr: 'Tes droits', en: 'Your rights', es: 'Tus derechos', sw: 'Haki zako' },
        entryIds: ['privacy_rights'],
      },
      {
        icon: '🔒',
        label: { fr: 'Vie privée', en: 'Privacy', es: 'Vida privada', sw: 'Faragha' },
        entryIds: ['privacy_private_life'],
      },
      {
        icon: '👤',
        label: { fr: 'Âge minimum', en: 'Minimum age', es: 'Edad mínima', sw: 'Umri wa chini' },
        entryIds: ['privacy_min_age'],
      },
    ],
  },

  // ===== 5. CONDITIONS =====
  {
    id: 'terms',
    icon: '⚖️',
    label: { fr: 'CONDITIONS', en: 'TERMS', es: 'TÉRMINOS', sw: 'MASHARTI' },
    subCategories: [
      {
        icon: '🏛️',
        label: { fr: 'Principe', en: 'Principle', es: 'Principio', sw: 'Kanuni' },
        entryIds: ['terms_fundamental'],
      },
      {
        icon: '🤝',
        label: { fr: 'Règles', en: 'Rules', es: 'Reglas', sw: 'Kanuni' },
        entryIds: ['terms_conduct'],
      },
      {
        icon: '📸',
        label: { fr: 'Contenus', en: 'Content', es: 'Contenido', sw: 'Maudhui' },
        entryIds: ['terms_content'],
      },
      {
        icon: '⚠️',
        label: { fr: 'Sanctions', en: 'Sanctions', es: 'Sanciones', sw: 'Adhabu' },
        entryIds: ['terms_sanctions'],
      },
      {
        icon: '🛡️',
        label: { fr: 'Sécurité collective', en: 'Collective security', es: 'Seguridad colectiva', sw: 'Usalama wa pamoja' },
        entryIds: ['terms_collective'],
      },
      {
        icon: '🚪',
        label: { fr: 'Fermeture', en: 'Closure', es: 'Cierre', sw: 'Kufunga' },
        entryIds: ['terms_closure'],
      },
      {
        icon: '⚖️',
        label: { fr: 'Litiges', en: 'Disputes', es: 'Disputas', sw: 'Migogoro' },
        entryIds: ['terms_disputes'],
      },
    ],
  },

  // ===== 6. SUPPORT =====
  {
    id: 'support',
    icon: '📞',
    label: { fr: 'SUPPORT', en: 'SUPPORT', es: 'SOPORTE', sw: 'MSAADA' },
    subCategories: [
      {
        icon: '👥',
        label: { fr: 'Qui sont-ils', en: 'Who are they', es: 'Quiénes son', sw: 'Wao ni nani' },
        entryIds: ['support_who', 'support_why'],
      },
      {
        icon: '📱',
        label: { fr: 'Contacter', en: 'Contact', es: 'Contactar', sw: 'Wasiliana' },
        entryIds: ['support_channels'],
      },
      {
        icon: '🐛',
        label: { fr: 'Signaler', en: 'Report', es: 'Reportar', sw: 'Ripoti' },
        entryIds: ['support_report_bug', 'support_report_user'],
      },
      {
        icon: '🚨',
        label: { fr: 'Urgences', en: 'Emergencies', es: 'Emergencias', sw: 'Dharura' },
        entryIds: ['support_emergency'],
      },
      {
        icon: '🎓',
        label: { fr: 'Devenir support', en: 'Become support', es: 'Ser soporte', sw: 'Kuwa msaada' },
        entryIds: ['support_become'],
      },
    ],
  },

  // ===== 7. GAGNER DES BORB =====
  {
    id: 'earn',
    icon: '💰',
    label: { fr: 'GAGNER DES BORB', en: 'EARN BORB', es: 'GANAR BORB', sw: 'PATA BORB' },
    subCategories: [
      {
        icon: '🌾',
        label: { fr: 'UBI', en: 'UBI', es: 'UBI', sw: 'UBI' },
        entryIds: ['faq_ubi', 'faq_claim_ubi'],
      },
      {
        icon: '🏪',
        label: { fr: 'Vendre', en: 'Sell', es: 'Vender', sw: 'Uza' },
        entryIds: ['faq_sell_zando', 'how_to_get_rich'],
      },
      {
        icon: '🔧',
        label: { fr: 'Services', en: 'Services', es: 'Servicios', sw: 'Huduma' },
        entryIds: ['twelve_methods_earn'],
      },
      {
        icon: '🤝',
        label: { fr: 'Parrainage', en: 'Referral', es: 'Referidos', sw: 'Rufaa' },
        entryIds: ['case_rewards'],
      },
      {
        icon: '💤',
        label: { fr: 'Épargne', en: 'Savings', es: 'Ahorro', sw: 'Akiba' },
        entryIds: ['saving_guide', 'case_savings'],
      },
    ],
  },

  // ===== 8. CRÉER DU CONTENU =====
  {
    id: 'content',
    icon: '🎨',
    label: { fr: 'CRÉER DU CONTENU', en: 'CREATE CONTENT', es: 'CREAR CONTENIDO', sw: 'UNDA MAUDHUI' },
    subCategories: [
      {
        icon: '🎵',
        label: { fr: 'Musique', en: 'Music', es: 'Música', sw: 'Muziki' },
        entryIds: ['create_content', 'faq_how_much_earn'],
      },
      {
        icon: '🎬',
        label: { fr: 'Vidéos', en: 'Videos', es: 'Vídeos', sw: 'Video' },
        entryIds: ['create_content'],
      },
      {
        icon: '📚',
        label: { fr: 'Cours', en: 'Courses', es: 'Cursos', sw: 'Kozi' },
        entryIds: ['create_content'],
      },
      {
        icon: '📖',
        label: { fr: 'Livres', en: 'Books', es: 'Libros', sw: 'Vitabu' },
        entryIds: ['create_content'],
      },
    ],
  },

  // ===== 9. FAIRE DU TRADING =====
  {
    id: 'trading',
    icon: '💱',
    label: { fr: 'FAIRE DU TRADING', en: 'TRADING', es: 'TRADING', sw: 'UZAJI' },
    subCategories: [
      {
        icon: '📊',
        label: { fr: 'Bases', en: 'Basics', es: 'Básicos', sw: 'Misingi' },
        entryIds: ['trading_guide'],
      },
      {
        icon: '🔄',
        label: { fr: 'Stratégies', en: 'Strategies', es: 'Estrategias', sw: 'Mikakati' },
        entryIds: ['trading_guide'],
      },
      {
        icon: '🎯',
        label: { fr: 'Conseils', en: 'Tips', es: 'Consejos', sw: 'Vidokezo' },
        entryIds: ['trading_guide'],
      },
    ],
  },

  // ===== 10. DEVENIR RICHE =====
  {
    id: 'rich',
    icon: '🏆',
    label: { fr: 'DEVENIR RICHE', en: 'GET RICH', es: 'HACERSE RICO', sw: 'KUWA TAJIRI' },
    subCategories: [
      {
        icon: '🏆',
        label: { fr: 'Stratégies', en: 'Strategies', es: 'Estrategias', sw: 'Mikakati' },
        entryIds: ['how_to_get_rich'],
      },
      {
        icon: '💰',
        label: { fr: '12 méthodes', en: '12 methods', es: '12 métodos', sw: 'Njia 12' },
        entryIds: ['twelve_methods_earn'],
      },
      {
        icon: '💳',
        label: { fr: 'Marketer', en: 'Marketer', es: 'Marketer', sw: 'Marketer' },
        entryIds: ['become_marketer', 'faq_marketer', 'faq_become_marketer'],
      },
      {
        icon: '📈',
        label: { fr: 'Trajectoire', en: 'Trajectory', es: 'Trayectoria', sw: 'Mwelekeo' },
        entryIds: ['richness_trajectory'],
      },
    ],
  },
];

export function getCategory(id: string): MenuCategory | undefined {
  return MENU_CATEGORIES.find(c => c.id === id);
}
