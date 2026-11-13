// ====================
// TYPES — STUDIO UQ / ZANDO
// 30 types de mini-sites adaptés aux métiers de la vie réelle
// ====================

export type MetierType =
  // Commerce
  | 'vente_solo' | 'boutique' | 'hightech' | 'vehicule' | 'immobilier'
  // Services
  | 'atelier' | 'salon' | 'restaurant' | 'pharmacie' | 'labo' | 'hotel'
  // Transport
  | 'transport' | 'livreur' | 'aeroport' | 'port' | 'entrepot'
  // Communauté
  | 'eglise' | 'ecole' | 'administration'
  // Art
  | 'artiste' | 'musicien'
  // Tech
  | 'connexion' | 'informatique'
  // Agriculture
  | 'agriculteur' | 'eleveur'
  // Loisirs
  | 'bar' | 'cinema' | 'sport'
  // Construction & Industrie
  | 'btp' | 'usine'
  // Urgence
  | 'police';

export type CategorieMetier =
  | 'commerce' | 'service' | 'transport' | 'communaute'
  | 'art' | 'tech' | 'agriculture' | 'loisirs'
  | 'construction' | 'urgence';

export type StatutItem =
  | 'disponible'   // Disponible à l'achat
  | 'vendu'        // Vendu → disparaît du flux
  | 'en_cours'     // En cours (bateau en mer, etc.)
  | 'termine'      // Terminé → disparaît
  | 'epuise'       // Épuisé → disparaît
  | 'ferme'        // Fermé → disparaît
  | 'pause'        // En pause (temporairement indisponible)
  | 'brouillon';   // Brouillon non publié

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'price' | 'location' | 'image' | 'video' | 'list' | 'schedule';
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  helpText?: string;
  aiSuggested?: boolean; // L'IA peut pré-remplir ce champ
}

export interface TemplateSection {
  key: string;
  title: string;
  icon: string;
  type: 'products' | 'schedule' | 'employees' | 'menu' | 'rooms' | 'services' | 'events' | 'specs' | 'gallery' | 'reviews';
  fields?: TemplateField[];
}

export interface StudioTemplate {
  type: MetierType;
  categorie: CategorieMetier;
  nom: string;
  description: string;
  iconKey: string; // Référence à MetierIcons
  color: string;   // Couleur principale
  fields: TemplateField[];       // Champs du formulaire de création
  sections: TemplateSection[];   // Sections du mini-site
  statusFlow: StatutItem[];      // Cycle de vie
  actionButtons: string[];       // Boutons d'action
}

export interface ItemZando {
  id: string;
  type: MetierType;
  titre: string;
  sousTitre?: string;
  description: string;
  descriptionLongue?: string;
  prix?: number;
  devise: 'BORB';
  images: string[];
  videos?: string[];
  localisation: {
    adresse: string;
    lat: number;
    lng: number;
    distance?: number;
  };
  statut: StatutItem;
  vues: number;
  ventes: number;
  note: number;
  avis: number;
  createurId: string;
  createurNom: string;
  createdAt: string;
  updatedAt: string;
  dataSpecifique?: Record<string, any>; // Champs spécifiques au type
}
