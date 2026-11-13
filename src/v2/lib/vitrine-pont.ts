// ============================================================================
// vitrine-pont.ts — Passerelle entre le studio de vitrine (22 panneaux) et la
// boutique persistée.
//
// Le studio travaille sur `MiniSite` (site-model.ts) : médias, éléments, blocs,
// livraison, liens, statistiques. Le backend garde ce modèle tel quel dans
// `shop.vitrine` ; `shop.site` (pages + médias calibrés) reste la projection
// héritée lue par les anciennes fiches.
//
// Ce fichier ne fait aucun appel réseau : il convertit dans les deux sens et
// complète un modèle incomplet (boutique héritée, JSON plus ancien) avec les
// valeurs par défaut, pour que l'éditeur ne reçoive jamais un objet troué.
// ============================================================================

import type {
  MediaAdjust,
  MiniSite as ApiSite,
  ShopRecord,
  SiteButton,
  SiteMedia,
  SitePage,
  SiteSocial,
} from './api';
import {
  creerMiniSiteVide,
  type BlocItem,
  type ElementItem,
  type LienExterne,
  type MediaItem,
  type MiniSite as VitrineSite,
} from './site-model';

/** Réglages colorimétriques neutres : le rendu hérité n'en applique aucun. */
const ADJUST_NEUTRE: MediaAdjust = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  highlights: 0,
  shadows: 0,
  sharp: 0,
  warmth: 0,
  hue: 0,
  vignette: 0,
};

/** Ce que le formulaire de boutique sait déjà : sert de base à un site vide. */
export interface BrouillonBoutique {
  nom: string;
  description?: string;
  categorie?: string;
  photo?: string;
  video?: string;
  galerie?: string[];
  sections?: Array<{ titre?: string; type?: string; contenu?: string; media?: string }>;
}

const texte = (valeur: unknown, defaut = ''): string =>
  typeof valeur === 'string' ? valeur : defaut;

const nombre = (valeur: unknown, defaut = 0): number =>
  typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : defaut;

/** Un lien sans URL ne mène nulle part : on ne le garde pas. */
function liensValides(liens: unknown): LienExterne[] {
  if (!Array.isArray(liens)) return [];
  const vus = new Set<string>();
  return liens
    .map((lien) => ({
      nom: texte((lien as LienExterne)?.nom, 'Lien'),
      url: texte((lien as LienExterne)?.url),
    }))
    .filter((lien) => {
      if (!lien.url.trim() || vus.has(lien.url)) return false;
      vus.add(lien.url);
      return true;
    });
}

function mediasValides(medias: unknown, couleur: string): MediaItem[] {
  if (!Array.isArray(medias)) return [];
  return medias
    .map((media) => {
      const m = media as MediaItem;
      return {
        type: m?.type === 'video' ? ('video' as const) : ('photo' as const),
        couleur: texte(m?.couleur, couleur),
        label: texte(m?.label),
        url: texte(m?.url) || undefined,
      };
    })
    .filter((media) => Boolean(media.url));
}

function blocsValides(blocs: unknown): BlocItem[] {
  if (!Array.isArray(blocs)) return [];
  return blocs
    .map((bloc) => {
      const b = bloc as BlocItem;
      return {
        titre: texte(b?.titre),
        description: texte(b?.description),
        icone: texte(b?.icone, 'tool'),
      };
    })
    .filter((bloc) => Boolean(bloc.titre.trim()));
}

function itemsValides(items: unknown): ElementItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const i = item as ElementItem;
      return {
        nom: texte(i?.nom),
        pack: texte(i?.pack),
        prix: nombre(i?.prix),
        stock: nombre(i?.stock),
        marque: texte(i?.marque),
        modele: texte(i?.modele),
        qualite: texte(i?.qualite),
        etat: texte(i?.etat),
        fx: i?.fx,
        cap: typeof i?.cap === 'string' ? i.cap : undefined,
        capPx: typeof i?.capPx === 'number' ? i.capPx : undefined,
        capAlign: i?.capAlign,
        capCol: typeof i?.capCol === 'string' ? i.capCol : undefined,
        font: typeof i?.font === 'string' ? i.font : undefined,
        weight: typeof i?.weight === 'number' ? i.weight : undefined,
      };
    })
    .filter((item) => Boolean(item.nom.trim()));
}

/**
 * Complète un mini-site venu du serveur avec les valeurs par défaut du modèle.
 * Un JSON plus ancien (ou partiel) reste ouvrable dans les 22 panneaux.
 */
export function normaliserVitrine(brut: unknown, nom: string): VitrineSite {
  const base = creerMiniSiteVide(nom || 'Ma boutique');
  if (!brut || typeof brut !== 'object') return base;
  const v = brut as Partial<VitrineSite>;
  const couleur = texte(v.couleur, base.couleur);
  const ms = (v.ms ?? {}) as Partial<VitrineSite['ms']>;
  const stats = (v.stats ?? {}) as Partial<VitrineSite['stats']>;
  const liv = (v.liv ?? {}) as Partial<VitrineSite['liv']>;
  const items = itemsValides(v.items);

  return {
    ...base,
    ...v,
    nom: texte(v.nom, base.nom),
    accroche: texte(v.accroche, base.accroche),
    cat: texte(v.cat, base.cat),
    couleur,
    logo: texte(v.logo) || undefined,
    distance: texte(v.distance, base.distance),
    live: Boolean(v.live),
    liveTitre: texte(v.liveTitre, base.liveTitre),
    adresse: texte(v.adresse, base.adresse),
    position: texte(v.position, base.position),
    medias: mediasValides(v.medias, couleur),
    videoLieu: texte(v.videoLieu, base.videoLieu),
    videoElt: texte(v.videoElt, base.videoElt),
    son: texte(v.son, base.son),
    blocs: blocsValides(v.blocs),
    items,
    sel: items.length ? Math.min(Math.max(nombre(v.sel), 0), items.length - 1) : 0,
    liv: {
      on: Boolean(liv.on),
      zone: texte(liv.zone, base.liv.zone),
      tarif: nombre(liv.tarif, base.liv.tarif),
      delai: texte(liv.delai, base.liv.delai),
    },
    liens: liensValides(v.liens),
    hideout: typeof v.hideout === 'boolean' ? v.hideout : base.hideout,
    seuil: nombre(v.seuil, base.seuil),
    stats: {
      score: texte(stats.score, base.stats.score),
      vues: nombre(stats.vues, base.stats.vues),
      likes: nombre(stats.likes, base.stats.likes),
      com: nombre(stats.com, base.stats.com),
    },
    ms: {
      ...base.ms,
      ...ms,
      sujet: texte(ms.sujet, base.ms.sujet),
      viewers: nombre(ms.viewers, base.ms.viewers),
      abon: nombre(ms.abon, base.ms.abon),
      reten: nombre(ms.reten, base.ms.reten),
      cols: nombre(ms.cols, base.ms.cols),
      suivre: typeof ms.suivre === 'boolean' ? ms.suivre : base.ms.suivre,
      showCart: typeof ms.showCart === 'boolean' ? ms.showCart : base.ms.showCart,
      showAddr: typeof ms.showAddr === 'boolean' ? ms.showAddr : base.ms.showAddr,
      showStats: typeof ms.showStats === 'boolean' ? ms.showStats : base.ms.showStats,
      showSoc: typeof ms.showSoc === 'boolean' ? ms.showSoc : base.ms.showSoc,
      showAbout: typeof ms.showAbout === 'boolean' ? ms.showAbout : base.ms.showAbout,
      adresse: texte(ms.adresse, base.ms.adresse),
      lives: Array.isArray(ms.lives) ? ms.lives : base.ms.lives,
      about: texte(ms.about, base.ms.about),
      likes: (ms.likes ?? {}) as Record<number, number>,
      follow: (ms.follow ?? {}) as Record<number, number>,
    },
  };
}

/**
 * Construit un mini-site à partir du formulaire de boutique : couverture,
 * galerie, tranches et produits. C'est le point de départ quand rien n'a
 * encore été publié dans le studio.
 */
export function vitrineDepuisBrouillon(brouillon: BrouillonBoutique): VitrineSite {
  const base = creerMiniSiteVide(brouillon.nom.trim() || 'Ma boutique');
  const categorie = texte(brouillon.categorie).trim();
  if (categorie && categorie !== 'general') base.cat = categorie;
  base.accroche = texte(brouillon.description).trim();

  const couverture = texte(brouillon.photo);
  const galerie = (brouillon.galerie ?? []).filter((url): url is string => Boolean(url));
  const visuels = [couverture, ...galerie].filter(Boolean).slice(0, 8);
  base.medias = visuels.map((url, index) => ({
    type: 'photo' as const,
    couleur: base.couleur,
    label: index === 0 ? 'vitrine' : 'rayon',
    url,
  }));

  const video = texte(brouillon.video).trim();
  if (/^https?:\/\//i.test(video)) base.videoLieu = video;

  const sections = (brouillon.sections ?? []).filter(
    (section) => texte(section?.titre).trim().length > 0,
  );
  base.blocs = sections
    .filter((section) => (section.type || '') !== 'produit')
    .slice(0, 6)
    .map((section) => ({
      titre: texte(section.titre).trim(),
      description: texte(section.contenu),
      icone: 'tool',
    }));
  base.items = sections
    .filter((section) => section.type === 'produit')
    .slice(0, 8)
    .map((section) => ({
      nom: texte(section.titre).trim(),
      pack: 'produit',
      prix: 0,
      stock: 0,
      marque: '',
      modele: '',
      qualite: '',
      etat: '',
    }));

  return base;
}

/** Construit un mini-site depuis une fiche boutique du serveur. */
export function vitrineDepuisShop(shop: ShopRecord | null | undefined, nom?: string): VitrineSite {
  return vitrineDepuisBrouillon({
    nom: nom || shop?.name || 'Ma boutique',
    description: shop?.description || '',
    categorie: shop?.category || '',
    photo: shop?.presentation_photo || '',
    video: shop?.presentation_video || '',
    galerie: shop?.gallery || [],
    sections: shop?.sections || [],
  });
}

/**
 * Convertit l'ancien mini-site persisté (`pages`) vers le modèle du studio.
 * Les pages fournissent les médias, la vidéo et les réseaux ; la galerie et les
 * tranches de la boutique complètent ce qui manque.
 */
export function vitrineDepuisApi(
  site: ApiSite | null | undefined,
  shop?: ShopRecord | null,
): VitrineSite | null {
  if (!site?.pages?.length) return null;
  const base = vitrineDepuisShop(shop);

  const medias: MediaItem[] = [];
  const liens: LienExterne[] = [];
  let video = '';
  for (const page of site.pages) {
    for (const media of page.medias ?? []) {
      if (!media?.src) continue;
      medias.push({
        type: media.type === 'video' ? 'video' : 'photo',
        couleur: base.couleur,
        label: texte(media.label) || texte(page.name),
        url: media.src,
      });
    }
    for (const reseau of page.social ?? []) {
      if (reseau?.url) liens.push({ nom: texte(reseau.name, 'Lien'), url: reseau.url });
    }
    if (!video && page.video) video = page.video.src || page.video.url || '';
  }

  if (medias.length) base.medias = medias.slice(0, 12);
  if (liens.length) base.liens = liensValides(liens);
  if (video) base.videoLieu = video;
  if (site.pages[0]?.name) {
    base.ms.sujet = site.pages[0].name;
    if (!base.accroche) base.accroche = site.pages[0].name;
  }

  return base;
}

/**
 * Projette le studio vers l'ancien format `pages` : 2 médias par page, 3 pages
 * au plus (les mêmes limites que le serveur). Les boutons et réseaux restent
 * sur la première page, comme dans l'éditeur historique.
 */
export function versApiSite(vitrine: VitrineSite): ApiSite {
  const visuels = vitrine.medias.filter((media) => Boolean(media.url));
  const social: SiteSocial[] = vitrine.liens
    .filter((lien) => Boolean(lien.url))
    .map((lien) => ({ name: lien.nom || 'Lien', url: lien.url }));

  const buttons: SiteButton[] = [];
  if (vitrine.ms.showCart && vitrine.items.length) {
    buttons.push({ label: 'Acheter', kind: 'achat' });
  }
  buttons.push({ label: 'Contacter', kind: 'contact' });

  const videoLieu = texte(vitrine.videoLieu).trim();
  const video =
    videoLieu && /^https?:\/\//i.test(videoLieu)
      ? { url: videoLieu, title: vitrine.liveTitre || vitrine.nom, src: videoLieu }
      : null;

  const pages: SitePage[] = [];
  const MEDIAS_PAR_PAGE = 2;
  const PAGES_MAX = 3;
  const nbPages = Math.min(PAGES_MAX, Math.ceil(visuels.length / MEDIAS_PAR_PAGE));

  for (let index = 0; index < nbPages; index += 1) {
    const medias: SiteMedia[] = visuels
      .slice(index * MEDIAS_PAR_PAGE, index * MEDIAS_PAR_PAGE + MEDIAS_PAR_PAGE)
      .map((media) => ({
        type: media.type,
        src: media.url as string,
        label: media.label,
        dur: 0,
        adj: { ...ADJUST_NEUTRE },
        speed: 1,
        crop: 0,
        overlays: [],
        sound: null,
        segs: [],
      }));
    pages.push({
      name: index === 0 ? vitrine.nom || 'Accueil' : `Page ${index + 1}`,
      medias,
      buttons: index === 0 ? buttons : [],
      video: index === 0 ? video : null,
      social: index === 0 ? social : [],
    });
  }

  // Aucun visuel mais des réseaux ou une vidéo : une page suffit à les porter.
  if (pages.length === 0 && (video || social.length > 0 || buttons.length > 0)) {
    pages.push({
      name: vitrine.nom || 'Accueil',
      medias: [],
      buttons,
      video,
      social,
    });
  }

  return { pages };
}
