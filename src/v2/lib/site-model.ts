// ============================================================================
// site-model.ts — Le modèle de données d'un mini-site
// Un mini-site = { nom, accroche, cat, couleur, medias, items, blocs, ... }
// Porté depuis la maquette .uq_studio_preview/studio-preview.html
// ============================================================================

export interface MediaItem {
  /** Type de média */
  type: 'photo' | 'video';
  /** Couleur du fond (fallback si pas d'image) */
  couleur: string;
  /** Libellé (ex. "vitrine", "rayon", "équipe") */
  label: string;
  /** Image réelle (URL ou data URI) quand elle existe. */
  url?: string;
}

/** Position et taille d'un objet dans le canevas de l'élément (en %). */
export interface FxObjet {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

/** Un sticker posé sur la photo de l'élément. */
export interface StickerPose extends FxObjet {
  id: string;
}

/**
 * Mise en page de l'élément : la photo, la légende et les stickers posés.
 * Visible dans l'aperçu, réglable dans le panneau Taille.
 */
export interface FxElement {
  media: FxObjet;
  cap: FxObjet;
  stk: StickerPose[];
}

export interface ElementItem {
  nom: string;
  pack: string;
  prix: number;
  stock: number;
  marque: string;
  modele: string;
  qualite: string;
  etat: string;
  /** Mise en page dans l'aperçu (photo, légende, stickers). */
  fx?: FxElement;
  /** Légende posée sur la photo. */
  cap?: string;
  /** Corps de la légende, en pixels. */
  capPx?: number;
  /** Alignement de la légende. */
  capAlign?: 'left' | 'center' | 'right';
  /** Couleur de la légende. */
  capCol?: string;
  /** Famille de police du titre et de la légende. */
  font?: string;
  /** Graisse du titre et de la légende, de 400 à 900. */
  weight?: number;
}

export interface BlocItem {
  titre: string;
  description: string;
  icone: string;
}

export interface Livraison {
  on: boolean;
  zone: string;
  tarif: number;
  delai: string;
}

export interface LienExterne {
  nom: string;
  url: string;
}

export interface MiniSite {
  nom: string;
  accroche: string;
  cat: string;
  couleur: string;
  /** Photo du logo (data URI) ; l'initiale sert quand elle manque. */
  logo?: string;
  distance: string;
  live: boolean;
  liveTitre: string;
  adresse: string;
  position: string;
  medias: MediaItem[];
  videoLieu: string;
  videoElt: string;
  son: string;
  blocs: BlocItem[];
  items: ElementItem[];
  sel: number;
  liv: Livraison;
  liens: LienExterne[];
  /** À 0, l'élément disparaît du mini-site. */
  hideout?: boolean;
  /** Seuil de l'alerte « bientôt épuisé ». */
  seuil?: number;
  stats: {
    score: string;
    vues: number;
    likes: number;
    com: number;
  };
  ms: {
    sujet: string;
    viewers: number;
    abon: number;
    reten: number;
    cols: number;
    suivre: boolean;
    showCart: boolean;
    showAddr: boolean;
    showStats: boolean;
    showSoc: boolean;
    showAbout: boolean;
    adresse: string;
    lives: Array<[string, number, string]>;
    about: string;
    likes: Record<number, number>;
    follow: Record<number, number>;
  };
}

/** Crée un mini-site vide (création libre) */
export function creerMiniSiteVide(nom = 'Ma boutique'): MiniSite {
  return {
    nom,
    accroche: '',
    cat: 'Commerce',
    couleur: '#0b9a63',
    distance: '',
    live: false,
    liveTitre: '',
    adresse: '',
    position: '',
    medias: [],
    videoLieu: '',
    videoElt: '',
    son: '',
    blocs: [],
    items: [],
    sel: 0,
    liv: { on: false, zone: '', tarif: 0, delai: '' },
    liens: [],
    hideout: true,
    seuil: 3,
    stats: { score: '—', vues: 0, likes: 0, com: 0 },
    ms: {
      sujet: '',
      viewers: 0,
      abon: 0,
      reten: 0,
      cols: 3,
      suivre: true,
      showCart: true,
      showAddr: true,
      showStats: true,
      showSoc: true,
      showAbout: true,
      adresse: '',
      lives: [],
      about: '',
      likes: {},
      follow: {},
    },
  };
}

/** Crée un mini-site à partir d'un métier (gabarit pré-rempli) */
export function creerMiniSiteDepuisMetier(
  nomMetier: string,
  famille: string,
  couleur: string,
  description: string
): MiniSite {
  const site = creerMiniSiteVide(nomMetier);
  site.cat = famille;
  site.couleur = couleur;
  site.accroche = description.split(' · ').slice(0, 3).join(' · ');
  return site;
}