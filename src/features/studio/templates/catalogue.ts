import { StudioTemplate } from './types';

// ====================
// CATALOGUE DES 30 TEMPLATES — STUDIO UQ
// Chaque template définit les champs et sections du mini-site
// ====================

export const TEMPLATES: Record<string, StudioTemplate> = {

  // ===== 🛍️ COMMERCE =====

  vente_solo: {
    type: 'vente_solo',
    categorie: 'commerce',
    nom: 'Vente Solo',
    description: 'Vendre un iPhone, parcelle, maison, etc.',
    iconKey: 'IconVenteSolo',
    color: '#FBBF24',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'titre', label: 'Titre', type: 'text', required: true, placeholder: 'Ex: iPhone 13 Pro 256 Go', aiSuggested: true },
      { key: 'description', label: 'Description', type: 'textarea', maxLength: 200, placeholder: 'Décris ton article en quelques mots', aiSuggested: true },
      { key: 'prix', label: 'Prix', type: 'price', required: true, aiSuggested: true },
      { key: 'localisation', label: 'Emplacement', type: 'location', required: true },
    ],
    sections: [
      { key: 'specs', title: 'Détails', icon: '📋', type: 'specs' },
    ],
    statusFlow: ['disponible', 'vendu'],
    actionButtons: ['acheter', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  boutique: {
    type: 'boutique',
    categorie: 'commerce',
    nom: 'Boutique',
    description: 'Épicerie, magasin, commerce de quartier',
    iconKey: 'IconBoutique',
    color: '#8B5CF6',
    fields: [
      { key: 'photo', label: 'Photo de la boutique', type: 'image', required: true },
      { key: 'nom', label: 'Nom de la boutique', type: 'text', required: true, aiSuggested: true },
      { key: 'description', label: 'Description', type: 'textarea', maxLength: 300, aiSuggested: true },
      { key: 'horaires', label: 'Horaires', type: 'text', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'produits', title: 'Produits', icon: '🛍️', type: 'products' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['acheter', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  hightech: {
    type: 'hightech',
    categorie: 'commerce',
    nom: 'High-Tech',
    description: 'Téléphones, ordinateurs, accessoires',
    iconKey: 'IconHighTech',
    color: '#4A9EFF',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'titre', label: 'Titre', type: 'text', required: true, aiSuggested: true },
      { key: 'prix', label: 'Prix', type: 'price', required: true, aiSuggested: true },
      { key: 'etat', label: 'État', type: 'text', aiSuggested: true },
      { key: 'specifications', label: 'Spécifications', type: 'textarea' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'specs', title: 'Spécifications', icon: '📋', type: 'specs' },
    ],
    statusFlow: ['disponible', 'vendu'],
    actionButtons: ['acheter', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  vehicule: {
    type: 'vehicule',
    categorie: 'commerce',
    nom: 'Véhicule',
    description: 'Moto, voiture, vélo',
    iconKey: 'IconVehicule',
    color: '#FACC15',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'titre', label: 'Titre', type: 'text', required: true, aiSuggested: true },
      { key: 'prix', label: 'Prix', type: 'price', required: true, aiSuggested: true },
      { key: 'annee', label: 'Année', type: 'number', aiSuggested: true },
      { key: 'kilometrage', label: 'Kilométrage', type: 'number', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'specs', title: 'Spécifications', icon: '📋', type: 'specs' },
    ],
    statusFlow: ['disponible', 'vendu'],
    actionButtons: ['acheter', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  immobilier: {
    type: 'immobilier',
    categorie: 'commerce',
    nom: 'Immobilier',
    description: 'Terrain, maison, appartement',
    iconKey: 'IconImmobilier',
    color: '#4ADE80',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'titre', label: 'Titre', type: 'text', required: true, aiSuggested: true },
      { key: 'prix', label: 'Prix', type: 'price', required: true, aiSuggested: true },
      { key: 'superficie', label: 'Superficie (m²)', type: 'number', aiSuggested: true },
      { key: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'specs', title: 'Détails', icon: '📋', type: 'specs' },
      { key: 'gallery', title: 'Photos', icon: '📸', type: 'gallery' },
    ],
    statusFlow: ['disponible', 'vendu'],
    actionButtons: ['visiter', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  // ===== 🔧 SERVICES =====

  atelier: {
    type: 'atelier',
    categorie: 'service',
    nom: 'Atelier',
    description: 'Menuiserie, mécanique, soudure',
    iconKey: 'IconAtelier',
    color: '#EF4444',
    fields: [
      { key: 'photo', label: 'Photo de l\'atelier', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true, aiSuggested: true },
      { key: 'description', label: 'Description', type: 'textarea', aiSuggested: true },
      { key: 'services', label: 'Services', type: 'list', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '🛠️', type: 'services' },
      { key: 'employees', title: 'Employés', icon: '👥', type: 'employees' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['contacter', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  salon: {
    type: 'salon',
    categorie: 'service',
    nom: 'Salon de coiffure',
    description: 'Coiffure, esthétique, tresses',
    iconKey: 'IconSalon',
    color: '#E879F9',
    fields: [
      { key: 'photo', label: 'Photo du salon', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true, aiSuggested: true },
      { key: 'services', label: 'Services', type: 'list', aiSuggested: true },
      { key: 'horaires', label: 'Horaires', type: 'schedule', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '💇', type: 'services' },
      { key: 'schedule', title: 'Horaires', icon: '⏰', type: 'schedule' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['rendezvous', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  restaurant: {
    type: 'restaurant',
    categorie: 'service',
    nom: 'Restaurant',
    description: 'Cuisine, menu, réservations',
    iconKey: 'IconRestaurant',
    color: '#FB923C',
    fields: [
      { key: 'photo', label: 'Photo du restaurant', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true, aiSuggested: true },
      { key: 'menu', label: 'Menu du jour', type: 'list', aiSuggested: true },
      { key: 'horaires', label: 'Horaires', type: 'schedule', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'menu', title: 'Menu', icon: '🍽️', type: 'menu' },
      { key: 'schedule', title: 'Horaires', icon: '⏰', type: 'schedule' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['commander', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  pharmacie: {
    type: 'pharmacie',
    categorie: 'service',
    nom: 'Pharmacie',
    description: 'Médicaments, consultation',
    iconKey: 'IconPharmacie',
    color: '#22C55E',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'medicaments', label: 'Médicaments disponibles', type: 'list' },
      { key: 'horaires', label: 'Horaires', type: 'text', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'products', title: 'Médicaments', icon: '💊', type: 'products' },
      { key: 'services', title: 'Services', icon: '🏥', type: 'services' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['commander', 'appeler', 'commenter', 'lire'],
  },

  labo: {
    type: 'labo',
    categorie: 'service',
    nom: 'Laboratoire',
    description: 'Analyses médicales',
    iconKey: 'IconLabo',
    color: '#06B6D4',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom du labo', type: 'text', required: true },
      { key: 'analyses', label: 'Analyses proposées', type: 'list' },
      { key: 'horaires', label: 'Horaires', type: 'schedule' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Analyses', icon: '🧪', type: 'services' },
      { key: 'schedule', title: 'Horaires', icon: '⏰', type: 'schedule' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['rendezvous', 'appeler', 'commenter', 'lire'],
  },

  hotel: {
    type: 'hotel',
    categorie: 'service',
    nom: 'Hôtel',
    description: 'Chambres, réservations',
    iconKey: 'IconHotel',
    color: '#A78BFA',
    fields: [
      { key: 'photo', label: 'Photo de l\'hôtel', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'chambres', label: 'Chambres', type: 'list', aiSuggested: true },
      { key: 'services', label: 'Services', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'rooms', title: 'Chambres', icon: '🛏️', type: 'rooms' },
      { key: 'services', title: 'Services', icon: '⭐', type: 'services' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['reserver', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  // ===== 🚗 TRANSPORT =====

  transport: {
    type: 'transport',
    categorie: 'transport',
    nom: 'Transport',
    description: 'Bus, taxi, moto-taxi',
    iconKey: 'IconTransport',
    color: '#F59E0B',
    fields: [
      { key: 'photo', label: 'Photo du véhicule', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'trajets', label: 'Trajets', type: 'list', aiSuggested: true },
      { key: 'horaires', label: 'Départs', type: 'schedule', aiSuggested: true },
      { key: 'localisation', label: 'Point de départ', type: 'location', required: true },
    ],
    sections: [
      { key: 'schedule', title: 'Départs', icon: '📅', type: 'schedule' },
      { key: 'services', title: 'Tarifs', icon: '💰', type: 'services' },
    ],
    statusFlow: ['disponible', 'en_cours', 'termine'],
    actionButtons: ['reserver', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  livreur: {
    type: 'livreur',
    categorie: 'transport',
    nom: 'Livreur',
    description: 'Livraison rapide, courses',
    iconKey: 'IconLivreur',
    color: '#10B981',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'tarifs', label: 'Tarifs', type: 'list', aiSuggested: true },
      { key: 'zone', label: 'Zone de livraison', type: 'text', aiSuggested: true },
      { key: 'localisation', label: 'Position actuelle', type: 'location' },
    ],
    sections: [
      { key: 'services', title: 'Tarifs', icon: '💰', type: 'services' },
    ],
    statusFlow: ['disponible', 'en_cours'],
    actionButtons: ['commander', 'aimer', 'commenter', 'lire'],
  },

  aeroport: {
    type: 'aeroport',
    categorie: 'transport',
    nom: 'Aéroport',
    description: 'Vols, cargo, passagers',
    iconKey: 'IconAeroport',
    color: '#0EA5E9',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom de l\'aéroport', type: 'text', required: true },
      { key: 'vols', label: 'Vols', type: 'schedule' },
      { key: 'tarifs', label: 'Tarifs', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'schedule', title: 'Vols du jour', icon: '✈️', type: 'schedule' },
      { key: 'services', title: 'Tarifs', icon: '💰', type: 'services' },
    ],
    statusFlow: ['disponible', 'en_cours'],
    actionButtons: ['reserver', 'appeler', 'commenter', 'lire'],
  },

  port: {
    type: 'port',
    categorie: 'transport',
    nom: 'Port',
    description: 'Bateaux, départs, arrivées',
    iconKey: 'IconPort',
    color: '#3B82F6',
    fields: [
      { key: 'photo', label: 'Photo du port', type: 'image', required: true },
      { key: 'nom', label: 'Nom du port', type: 'text', required: true },
      { key: 'bateaux', label: 'Bateaux', type: 'schedule' },
      { key: 'tarifs', label: 'Tarifs', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'schedule', title: 'Bateaux du jour', icon: '🚢', type: 'schedule' },
      { key: 'services', title: 'Tarifs', icon: '💰', type: 'services' },
    ],
    statusFlow: ['disponible', 'en_cours'],
    actionButtons: ['reserver', 'appeler', 'commenter', 'lire'],
  },

  entrepot: {
    type: 'entrepot',
    categorie: 'transport',
    nom: 'Entrepôt',
    description: 'Stockage, distribution',
    iconKey: 'IconEntrepot',
    color: '#78716C',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'capacites', label: 'Capacités', type: 'list' },
      { key: 'tarifs', label: 'Tarifs', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '📦', type: 'services' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['reserver', 'appeler', 'commenter', 'lire'],
  },

  // ===== ⛪ COMMUNAUTÉ =====

  eglise: {
    type: 'eglise',
    categorie: 'communaute',
    nom: 'Église',
    description: 'Messes, événements spirituels',
    iconKey: 'IconEglise',
    color: '#FCD34D',
    fields: [
      { key: 'photo', label: 'Photo de l\'église', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'confession', label: 'Confession', type: 'text', aiSuggested: true },
      { key: 'evenements', label: 'Événements', type: 'schedule' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'events', title: 'Événements', icon: '📅', type: 'events' },
      { key: 'services', title: 'Services', icon: '🕊️', type: 'services' },
    ],
    statusFlow: ['disponible', 'termine'],
    actionButtons: ['abonner', 'aimer', 'commenter', 'don', 'lire'],
  },

  ecole: {
    type: 'ecole',
    categorie: 'communaute',
    nom: 'École',
    description: 'Primaire, secondaire, université',
    iconKey: 'IconEcole',
    color: '#8B5CF6',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'classes', label: 'Classes', type: 'list' },
      { key: 'frais', label: 'Frais de scolarité', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Classes', icon: '📚', type: 'services' },
      { key: 'schedule', title: 'Horaires', icon: '⏰', type: 'schedule' },
    ],
    statusFlow: ['disponible', 'termine'],
    actionButtons: ['inscrire', 'appeler', 'commenter', 'lire'],
  },

  administration: {
    type: 'administration',
    categorie: 'communaute',
    nom: 'Administration',
    description: 'Mairie, impôts, actes',
    iconKey: 'IconAdministration',
    color: '#64748B',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'services', label: 'Services', type: 'list' },
      { key: 'horaires', label: 'Horaires', type: 'text' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '📋', type: 'services' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['rendezvous', 'appeler', 'lire'],
  },

  // ===== 🎨 ART =====

  artiste: {
    type: 'artiste',
    categorie: 'art',
    nom: 'Artiste',
    description: 'Peinture, sculpture, art',
    iconKey: 'IconArtiste',
    color: '#EC4899',
    fields: [
      { key: 'photo', label: 'Photo de l\'artiste', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'specialite', label: 'Spécialité', type: 'text', aiSuggested: true },
      { key: 'oeuvres', label: 'Œuvres', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location' },
    ],
    sections: [
      { key: 'gallery', title: 'Œuvres', icon: '🎨', type: 'gallery' },
      { key: 'services', title: 'Services', icon: '💰', type: 'services' },
    ],
    statusFlow: ['disponible', 'termine'],
    actionButtons: ['commander', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  musicien: {
    type: 'musicien',
    categorie: 'art',
    nom: 'Musicien',
    description: 'Concerts, studio, cours',
    iconKey: 'IconMusicien',
    color: '#A855F7',
    fields: [
      { key: 'photo', label: 'Photo du groupe', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'style', label: 'Style musical', type: 'text', aiSuggested: true },
      { key: 'services', label: 'Services', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location' },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '🎵', type: 'services' },
    ],
    statusFlow: ['disponible', 'en_cours', 'termine'],
    actionButtons: ['reserver', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  // ===== 📡 TECH =====

  connexion: {
    type: 'connexion',
    categorie: 'tech',
    nom: 'Connexion Internet',
    description: 'Partage de connexion 4G/5G',
    iconKey: 'IconConnexion',
    color: '#06B6D4',
    fields: [
      { key: 'photo', label: 'Photo de l\'antenne', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'forfaits', label: 'Forfaits', type: 'list', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'products', title: 'Forfaits', icon: '📡', type: 'products' },
    ],
    statusFlow: ['disponible', 'epuise'],
    actionButtons: ['acheter', 'aimer', 'commenter', 'lire'],
  },

  informatique: {
    type: 'informatique',
    categorie: 'tech',
    nom: 'Services informatiques',
    description: 'Réparation PC, formation',
    iconKey: 'IconInformatique',
    color: '#3B82F6',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'services', label: 'Services', type: 'list', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location' },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '💻', type: 'services' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['contacter', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  // ===== 🌾 AGRICULTURE =====

  agriculteur: {
    type: 'agriculteur',
    categorie: 'agriculture',
    nom: 'Agriculteur',
    description: 'Ferme, produits frais',
    iconKey: 'IconAgriculteur',
    color: '#65A30D',
    fields: [
      { key: 'photo', label: 'Photo de la ferme', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'produits', label: 'Produits', type: 'list', aiSuggested: true },
      { key: 'prix', label: 'Prix', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'products', title: 'Produits', icon: '🌾', type: 'products' },
    ],
    statusFlow: ['disponible', 'epuise'],
    actionButtons: ['acheter', 'livraison', 'commenter', 'lire'],
  },

  eleveur: {
    type: 'eleveur',
    categorie: 'agriculture',
    nom: 'Éleveur',
    description: 'Poules, œufs, porcs',
    iconKey: 'IconEleveur',
    color: '#CA8A04',
    fields: [
      { key: 'photo', label: 'Photo de l\'élevage', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'produits', label: 'Produits', type: 'list', aiSuggested: true },
      { key: 'prix', label: 'Prix', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'products', title: 'Produits', icon: '🐔', type: 'products' },
    ],
    statusFlow: ['disponible', 'epuise'],
    actionButtons: ['acheter', 'livraison', 'commenter', 'lire'],
  },

  // ===== 🍺 LOISIRS =====

  bar: {
    type: 'bar',
    categorie: 'loisirs',
    nom: 'Bar',
    description: 'Boissons, ambiance, musique',
    iconKey: 'IconBar',
    color: '#F97316',
    fields: [
      { key: 'photo', label: 'Photo du bar', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'boissons', label: 'Boissons', type: 'list' },
      { key: 'evenements', label: 'Événements', type: 'schedule' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'menu', title: 'Boissons', icon: '🍺', type: 'menu' },
      { key: 'events', title: 'Événements', icon: '🎵', type: 'events' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['commander', 'aimer', 'commenter', 'lire'],
  },

  cinema: {
    type: 'cinema',
    categorie: 'loisirs',
    nom: 'Cinéma / Salle de fête',
    description: 'Films, location salle',
    iconKey: 'IconCinema',
    color: '#DB2777',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'seances', label: 'Séances', type: 'schedule' },
      { key: 'tarifs', label: 'Tarifs', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'events', title: 'Séances', icon: '🎬', type: 'events' },
      { key: 'services', title: 'Location', icon: '💰', type: 'services' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['reserver', 'aimer', 'commenter', 'lire'],
  },

  sport: {
    type: 'sport',
    categorie: 'loisirs',
    nom: 'Terrain de sport',
    description: 'Location terrain, matchs',
    iconKey: 'IconSport',
    color: '#16A34A',
    fields: [
      { key: 'photo', label: 'Photo du terrain', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'services', label: 'Services', type: 'list' },
      { key: 'tarifs', label: 'Tarifs', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Location', icon: '⚽', type: 'services' },
      { key: 'events', title: 'Matchs', icon: '📅', type: 'events' },
    ],
    statusFlow: ['disponible', 'ferme'],
    actionButtons: ['reserver', 'aimer', 'commenter', 'lire'],
  },

  // ===== 🏗️ CONSTRUCTION & INDUSTRIE =====

  btp: {
    type: 'btp',
    categorie: 'construction',
    nom: 'BTP',
    description: 'Maçon, plombier, électricien',
    iconKey: 'IconBTP',
    color: '#F59E0B',
    fields: [
      { key: 'photo', label: 'Photo du chantier', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'services', label: 'Services', type: 'list', aiSuggested: true },
      { key: 'localisation', label: 'Localisation', type: 'location' },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '🏗️', type: 'services' },
    ],
    statusFlow: ['disponible', 'termine'],
    actionButtons: ['devis', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  usine: {
    type: 'usine',
    categorie: 'construction',
    nom: 'Usine / Fabrique',
    description: 'Production, vente en gros',
    iconKey: 'IconUsine',
    color: '#71717A',
    fields: [
      { key: 'photo', label: 'Photo de la fabrique', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'produits', label: 'Produits', type: 'list', aiSuggested: true },
      { key: 'prix', label: 'Prix', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'products', title: 'Produits', icon: '📦', type: 'products' },
    ],
    statusFlow: ['disponible', 'epuise'],
    actionButtons: ['commander', 'aimer', 'commenter', 'commissionnaire', 'lire'],
  },

  // ===== 🚨 URGENCE =====

  police: {
    type: 'police',
    categorie: 'urgence',
    nom: 'Police / Pompiers',
    description: 'Urgences, sécurité',
    iconKey: 'IconPolice',
    color: '#DC2626',
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', required: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'services', label: 'Services', type: 'list' },
      { key: 'localisation', label: 'Localisation', type: 'location', required: true },
    ],
    sections: [
      { key: 'services', title: 'Services', icon: '🚨', type: 'services' },
    ],
    statusFlow: ['disponible'],
    actionButtons: ['urgence', 'appeler', 'signaler', 'lire'],
  },
};

// ===== Helpers =====

export const ALL_TEMPLATES = Object.values(TEMPLATES);

export const TEMPLATES_BY_CATEGORIE = ALL_TEMPLATES.reduce((acc, t) => {
  if (!acc[t.categorie]) acc[t.categorie] = [];
  acc[t.categorie].push(t);
  return acc;
}, {} as Record<string, StudioTemplate[]>);

export const CATEGORIE_INFO: Record<string, { nom: string; icon: string }> = {
  commerce: { nom: 'Commerce', icon: '🛍️' },
  service: { nom: 'Services', icon: '🔧' },
  transport: { nom: 'Transport', icon: '🚗' },
  communaute: { nom: 'Communauté', icon: '⛪' },
  art: { nom: 'Art & Culture', icon: '🎨' },
  tech: { nom: 'Technologie', icon: '📡' },
  agriculture: { nom: 'Agriculture', icon: '🌾' },
  loisirs: { nom: 'Loisirs', icon: '🍺' },
  construction: { nom: 'Construction', icon: '🏗️' },
  urgence: { nom: 'Urgence', icon: '🚨' },
};

export function getTemplate(type: string): StudioTemplate | undefined {
  return TEMPLATES[type];
}


