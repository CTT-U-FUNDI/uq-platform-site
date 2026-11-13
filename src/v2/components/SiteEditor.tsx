// ============================================================================
// SiteEditor.tsx — Le studio de vitrine (22 panneaux)
// Structure : Stage (haut) + PvSheet (milieu) + Dock (bas)
// Parties 1-4/5 : structure, aperçus, dock, sous-menus et panneaux
// ============================================================================

import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { FAMILLES, STICKERS, couleurFamille, iconeFamille } from '../lib/studio-data';
import {
  creerMiniSiteVide,
  type ElementItem,
  type FxElement,
  type FxObjet,
  type MiniSite,
} from '../lib/site-model';
import { MEDIA_MAX_CHARS } from '../lib/api';
import { compressImageFile, pickImageFile } from '../lib/image';
import { useDisplayAmount } from '../lib/currency';
import './SiteEditor.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PvMode = 'flux' | 'explorer' | 'mini';
export type MenuId =
  | 'element' | 'texte' | 'police' | 'stickers' | 'taille' | 'couleur'
  | 'minisite' | 'medias' | 'blocs' | 'stock' | 'livraison' | 'liens'
  | 'live' | 'identite';

export type PanneauId =
  | 'id' | 'media' | 'bloc' | 'elt' | 'stock' | 'liv' | 'liens'
  | 'taille' | 'cap' | 'font' | 'weight' | 'capsize' | 'align' | 'capcolor'
  | `stk:${string}`
  | 'ms_head' | 'ms_lives' | 'ms_grid' | 'ms_side' | 'ms_stats' | 'ms_soc'
  | 'live';

interface SiteEditorProps {
  initial: MiniSite | null;
  shopName: string;
  shopTagline?: string;
  onClose: () => void;
  onSave: (site: MiniSite) => void;
  busy?: boolean;
}

// ---------------------------------------------------------------------------
// État local
// ---------------------------------------------------------------------------

interface EditorState {
  site: MiniSite;
  mode: PvMode;
  menuOuvert: MenuId | null;
  /** Index du sous-menu ouvert dans `menuOuvert`, ou null sur la liste. */
  sousMenu: number | null;
  panneau: PanneauId;
  /** Objet réglé dans le panneau Taille : `media`, `cap` ou `stk:<index>`. */
  objet: string;
  recherche: string;
  dirty: boolean;
  busy: boolean;
}

type Action =
  | { type: 'SET_SITE'; site: MiniSite }
  | { type: 'SET_MODE'; mode: PvMode }
  | { type: 'OUVRIR_MENU'; menu: MenuId; panneau: PanneauId }
  | { type: 'OUVRIR_SOUS'; index: number; panneau: PanneauId }
  | { type: 'RETOUR_SHEET' }
  | { type: 'FERMER_MENU' }
  | { type: 'SET_OBJET'; objet: string }
  | { type: 'SET_RECHERCHE'; recherche: string }
  | { type: 'SET_DIRTY'; dirty: boolean }
  | { type: 'SET_BUSY'; busy: boolean };

/** Ouvre un panneau qui vit dans le mini-site : on bascule l'aperçu avec. */
function modeDuPanneau(panneau: PanneauId, mode: PvMode): PvMode {
  return panneau.startsWith('ms_') ? 'mini' : mode;
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_SITE':
      return { ...state, site: action.site, dirty: true };
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'OUVRIR_MENU':
      return {
        ...state,
        menuOuvert: action.menu,
        sousMenu: null,
        panneau: action.panneau,
        recherche: '',
        mode: modeDuPanneau(action.panneau, state.mode),
      };
    case 'OUVRIR_SOUS':
      return {
        ...state,
        sousMenu: action.index,
        panneau: action.panneau,
        recherche: '',
        mode: modeDuPanneau(action.panneau, state.mode),
      };
    case 'RETOUR_SHEET':
      return { ...state, sousMenu: null, recherche: '' };
    case 'FERMER_MENU':
      return { ...state, menuOuvert: null, sousMenu: null, recherche: '' };
    case 'SET_OBJET':
      return { ...state, objet: action.objet };
    case 'SET_RECHERCHE':
      return { ...state, recherche: action.recherche };
    case 'SET_DIRTY':
      return { ...state, dirty: action.dirty };
    case 'SET_BUSY':
      return { ...state, busy: action.busy };
    default:
      return state;
  }
}

function creerStateInitial(initial: MiniSite | null, shopName: string): EditorState {
  const site = initial ?? creerMiniSiteVide(shopName || 'Ma boutique');
  return {
    site,
    mode: 'flux',
    menuOuvert: null,
    sousMenu: null,
    panneau: 'id',
    objet: 'media',
    recherche: '',
    dirty: false,
    busy: false,
  };
}

// ---------------------------------------------------------------------------
// Les 14 menus du dock et leurs sous-menus (maquette `MENUS`)
// ---------------------------------------------------------------------------

interface SousMenu {
  titre: string;
  description: string;
  icone: IconName;
  panneau: PanneauId;
}

interface EntreeMenu {
  id: MenuId;
  titre: string;
  icone: IconName;
  /** Panneau direct pour les menus sans sous-menu. */
  panneau?: PanneauId;
  sousMenus?: SousMenu[];
}

const MENUS: EntreeMenu[] = [
  { id: 'element', titre: 'Élément', icone: 'cart', panneau: 'elt' },
  {
    id: 'texte',
    titre: 'Texte',
    icone: 'txt',
    sousMenus: [
      { titre: 'Légende sur l’image', description: 'le texte posé sur la photo', icone: 'cap', panneau: 'cap' },
      { titre: 'Titre de l’élément', description: 'nom, conditionnement, marque', icone: 'txt', panneau: 'elt' },
      { titre: 'Accroche de la boutique', description: 'la ligne lue dans le flux', icone: 'txt', panneau: 'id' },
      { titre: 'Prix affiché', description: 'montant demandé au Coffre', icone: 'cart', panneau: 'elt' },
    ],
  },
  {
    id: 'police',
    titre: 'Police',
    icone: 'font',
    sousMenus: [
      { titre: 'Famille', description: '9 polices du système', icone: 'font', panneau: 'font' },
      { titre: 'Graisse', description: 'de 400 à 900', icone: 'txt', panneau: 'weight' },
      { titre: 'Corps du texte', description: 'taille en pixels', icone: 'rng', panneau: 'capsize' },
      { titre: 'Alignement', description: 'gauche, centre, droite', icone: 'grip', panneau: 'align' },
      { titre: 'Couleur du texte', description: 'sur la légende', icone: 'drop', panneau: 'capcolor' },
    ],
  },
  {
    id: 'stickers',
    titre: 'Stickers',
    icone: 'stk',
    sousMenus: STICKERS.map((categorie) => ({
      titre: categorie.nom,
      description: `${categorie.icones.length} stickers`,
      icone: 'stk' as IconName,
      panneau: `stk:${categorie.nom}` as PanneauId,
    })),
  },
  { id: 'taille', titre: 'Taille', icone: 'rng', panneau: 'taille' },
  {
    id: 'couleur',
    titre: 'Couleur',
    icone: 'drop',
    sousMenus: [
      { titre: 'Couleur du logo', description: 'reprise dans tout le mini-site', icone: 'drop', panneau: 'id' },
      { titre: 'Couleur du texte', description: 'la légende sur l’image', icone: 'drop', panneau: 'capcolor' },
    ],
  },
  {
    id: 'minisite',
    titre: 'Mini-site',
    icone: 'shop',
    sousMenus: [
      { titre: 'Entête du mini-site', description: 'live en direct, accroche, abonnés', icone: 'banner', panneau: 'ms_head' },
      { titre: 'Historique des lives', description: 'sujets des vignettes, en ligne ou non', icone: 'live', panneau: 'ms_lives' },
      { titre: 'Grille des produits', description: 'colonnes, panier, suivre le produit', icone: 'grid', panneau: 'ms_grid' },
      { titre: 'Panier & adresse', description: 'ce que le visiteur voit de lui', icone: 'cart', panneau: 'ms_side' },
      { titre: 'Statistiques publiques', description: 'vues, avis, confiance, likes', icone: 'eye', panneau: 'ms_stats' },
      { titre: 'Réseaux & à-propos', description: 'les petites icônes du bas de page', icone: 'share', panneau: 'ms_soc' },
    ],
  },
  { id: 'medias', titre: 'Médias', icone: 'cam', panneau: 'media' },
  { id: 'blocs', titre: 'Blocs', icone: 'grip', panneau: 'bloc' },
  { id: 'stock', titre: 'Stock', icone: 'box', panneau: 'stock' },
  { id: 'livraison', titre: 'Livraison', icone: 'car', panneau: 'liv' },
  { id: 'liens', titre: 'Liens', icone: 'plane', panneau: 'liens' },
  { id: 'live', titre: 'Live', icone: 'play', panneau: 'live' },
  { id: 'identite', titre: 'Identité', icone: 'txt', panneau: 'id' },
];

const normaliser = (texte: string): string =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// ---------------------------------------------------------------------------
// Données des panneaux (maquette `COULEURS`, `TYPES_BLOC`, `FONTS`…)
// ---------------------------------------------------------------------------

const COULEURS = ['#0b9a63', '#e63946', '#2e86de', '#c9a227', '#7b5ea7', '#0b1220'];

const TYPES_BLOC: Array<[string, IconName]> = [
  ['Texte', 'txt'],
  ['Photo', 'cam'],
  ['Vidéo', 'play'],
  ['Son', 'music'],
  ['Service', 'cross'],
  ['Prix', 'cart'],
  ['Horaire', 'home'],
  ['Contact', 'phone'],
  ['Lien externe', 'plane'],
];

const QUALITES = ['Neuf scellé', 'Grade A', 'Grade B', 'Occasion vérifié'];
const ETATS = ['Neuf', 'Occasion', 'Reconditionné'];

const LINKS: Array<[string, IconName]> = [
  ['Site', 'globe'],
  ['WhatsApp', 'phone'],
  ['TikTok', 'music'],
  ['YouTube', 'play'],
  ['Instagram', 'cam'],
  ['X', 'txt'],
];

const FONTS: Array<[string, string]> = [
  ['Système', 'inherit'],
  ['Moderne', '"Trebuchet MS", sans-serif'],
  ['Serif', 'Georgia, serif'],
  ['Journal', '"Times New Roman", serif'],
  ['Machine', '"Courier New", monospace'],
  ['Titre', 'Impact, sans-serif'],
  ['Noir', '"Arial Black", sans-serif'],
  ['Manuscrit', 'cursive'],
  ['Arrondi', '"Comic Sans MS", cursive'],
];

const GRAISSES = [400, 500, 600, 700, 800, 900];

const ALIGNS: Array<[string, 'left' | 'center' | 'right']> = [
  ['Gauche', 'left'],
  ['Centre', 'center'],
  ['Droite', 'right'],
];

const CAP_COLS: Array<[string, string]> = [
  ['Blanc', '#ffffff'],
  ['Noir', '#0b1220'],
  ['Rouge UQ', '#e63946'],
  ['Or', '#c9a227'],
  ['Cyan', '#2e86de'],
  ['Vert', '#0b9a63'],
];

/** Icône d'un lien selon son nom, comme `socIc` dans la maquette. */
function iconeLien(nom: string): IconName {
  if (nom === 'Site') return 'globe';
  if (nom === 'WhatsApp') return 'phone';
  if (nom === 'Instagram') return 'cam';
  if (nom === 'YouTube') return 'play';
  if (nom === 'TikTok') return 'music';
  return 'txt';
}

// ---------------------------------------------------------------------------
// Mise en page et copies immuables des panneaux
// ---------------------------------------------------------------------------

/** Valeurs de départ de la maquette (`FX_DEF`). */
function fxDefaut(): FxElement {
  return {
    media: { x: 5, y: 6, w: 90, h: 72, r: 0 },
    cap: { x: 5, y: 80, w: 90, h: 15, r: 0 },
    stk: [],
  };
}

const borne = (valeur: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, valeur));

function clonerFx(fx?: FxElement): FxElement {
  const base = fx ?? fxDefaut();
  return {
    media: { ...base.media },
    cap: { ...base.cap },
    stk: base.stk.map((sticker) => ({ ...sticker })),
  };
}

/** Copie profonde du mini-site pour que le reducer reste immuable. */
function clonerSite(site: MiniSite): MiniSite {
  return {
    ...site,
    stats: { ...site.stats },
    liv: { ...site.liv },
    medias: site.medias.map((media) => ({ ...media })),
    blocs: site.blocs.map((bloc) => ({ ...bloc })),
    liens: site.liens.map((lien) => ({ ...lien })),
    items: site.items.map((item) => ({
      ...item,
      fx: item.fx ? clonerFx(item.fx) : undefined,
    })),
    ms: {
      ...site.ms,
      lives: site.ms.lives.map((live) => [...live] as [string, number, string]),
      likes: { ...site.ms.likes },
      follow: { ...site.ms.follow },
    },
  };
}

const itemSelectionne = (site: MiniSite): ElementItem | null =>
  site.items[site.sel] ?? site.items[0] ?? null;

function fxDe(item: ElementItem | null): FxElement | null {
  return item ? item.fx ?? fxDefaut() : null;
}

/** L'objet réglé par le panneau Taille, dans une copie de `fx`. */
function objetDeFx(fx: FxElement, kind: string): FxObjet | null {
  if (kind.startsWith('stk:')) {
    return fx.stk[Number(kind.slice(4))] ?? null;
  }
  return kind === 'cap' ? fx.cap : fx.media;
}

/** Ramène un objet dans le canevas après un changement de taille. */
function cadrerObjet(objet: FxObjet): void {
  objet.w = borne(objet.w, 10, 100);
  objet.h = borne(objet.h, 10, 100);
  objet.x = borne(objet.x, 0, 100 - objet.w);
  objet.y = borne(objet.y, 0, 100 - objet.h);
}

/** Applique un ratio (largeur / hauteur) au centre du canevas. */
function formatObjet(objet: FxObjet, ratio: number, canevas = 356 / 196): void {
  let largeur = 92;
  let hauteur = (largeur * canevas) / ratio;
  if (hauteur > 92) {
    hauteur = 92;
    largeur = (hauteur * ratio) / canevas;
  }
  if (largeur > 92) {
    largeur = 92;
    hauteur = (largeur * canevas) / ratio;
  }
  objet.w = Number(largeur.toFixed(1));
  objet.h = Number(hauteur.toFixed(1));
  objet.x = Number(((100 - objet.w) / 2).toFixed(1));
  objet.y = Number(((100 - objet.h) / 2).toFixed(1));
  objet.r = 0;
}

function libelleObjet(kind: string, objet: FxObjet | null): string {
  if (kind.startsWith('stk:')) {
    return `sticker ${objet && 'id' in objet ? String((objet as { id?: string }).id ?? '') : ''} (n°${Number(kind.slice(4)) + 1})`;
  }
  return kind === 'cap' ? 'légende sur l’image' : 'photo de l’élément';
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function SiteEditor({
  initial,
  shopName,
  onClose,
  onSave,
  busy,
}: SiteEditorProps) {
  const [state, dispatch] = useReducer(
    reducer,
    creerStateInitial(initial, shopName)
  );
  /** Les prix du modèle sont en unités internes, comme le reste de l'app. */
  const money = useDisplayAmount();
  /** Toujours la dernière version du site, même entre deux rendus. */
  const siteRef = useRef(state.site);
  siteRef.current = state.site;
  const bodyRef = useRef<HTMLDivElement>(null);

  // --- Actions ---
  const majSite = useCallback((maj: (site: MiniSite) => void) => {
    const site = clonerSite(siteRef.current);
    maj(site);
    dispatch({ type: 'SET_SITE', site });
  }, []);

  const setMode = useCallback((mode: PvMode) => {
    dispatch({ type: 'SET_MODE', mode });
  }, []);

  const ouvrirMenu = useCallback(
    (entree: EntreeMenu) => {
      dispatch({
        type: 'OUVRIR_MENU',
        menu: entree.id,
        // Un menu à sous-menus n'a pas de panneau par défaut : on garde le
        // dernier ouvert jusqu'au choix de l'utilisateur.
        panneau: entree.panneau ?? state.panneau,
      });
    },
    [state.panneau],
  );

  const ouvrirSous = useCallback((entree: EntreeMenu, index: number) => {
    const sous = entree.sousMenus?.[index];
    if (!sous) return;
    dispatch({ type: 'OUVRIR_SOUS', index, panneau: sous.panneau });
  }, []);

  const retourSheet = useCallback(() => {
    dispatch({ type: 'RETOUR_SHEET' });
  }, []);

  const fermerMenu = useCallback(() => {
    dispatch({ type: 'FERMER_MENU' });
  }, []);

  const setRecherche = useCallback((recherche: string) => {
    dispatch({ type: 'SET_RECHERCHE', recherche });
  }, []);

  const sauvegarder = useCallback(() => {
    if (state.busy) return;
    dispatch({ type: 'SET_BUSY', busy: true });
    onSave(state.site);
    dispatch({ type: 'SET_DIRTY', dirty: false });
    dispatch({ type: 'SET_BUSY', busy: false });
  }, [state.busy, state.site, onSave]);

  // --- Menu et sous-menu courants ---
  const menuActif = state.menuOuvert
    ? MENUS.find((menu) => menu.id === state.menuOuvert) ?? null
    : null;
  const sousActif =
    menuActif && state.sousMenu !== null
      ? menuActif.sousMenus?.[state.sousMenu] ?? null
      : null;
  const requete = normaliser(state.recherche.trim());
  const sousFiltres =
    menuActif?.sousMenus
      ?.map((sous, index) => ({ sous, index }))
      .filter(
        ({ sous }) =>
          !requete || normaliser(`${sous.titre} ${sous.description}`).includes(requete)
      ) ?? [];

  /** Un panneau est affiché (par opposition à la liste des sous-menus). */
  const panneauAffiche = !(menuActif?.sousMenus && !sousActif);

  /**
   * Recherche dans un panneau : la maquette masque les réglages dont le texte
   * ne correspond pas. On fait la même chose sur les enfants directs du corps,
   * sans toucher aux champs eux-mêmes.
   */
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !panneauAffiche) return;
    const enfants = Array.from(body.children).filter(
      (enfant): enfant is HTMLElement =>
        enfant instanceof HTMLElement && enfant.dataset.filtre !== 'message'
    );
    body.querySelectorAll('[data-filtre="message"]').forEach((noeud) => noeud.remove());
    if (!requete) {
      enfants.forEach((enfant) => {
        enfant.style.display = '';
      });
      return;
    }
    let visibles = 0;
    enfants.forEach((enfant) => {
      const correspond = normaliser(enfant.textContent ?? '').includes(requete);
      enfant.style.display = correspond ? '' : 'none';
      if (correspond) visibles += 1;
    });
    if (visibles === 0) {
      const message = document.createElement('div');
      message.className = 'site-editor__vide';
      message.dataset.filtre = 'message';
      message.textContent = `Rien ne correspond à « ${state.recherche} » dans ce panneau.`;
      body.appendChild(message);
    }
  }, [requete, state.recherche, state.panneau, state.menuOuvert, state.sousMenu, panneauAffiche]);

  const setObjet = useCallback((objet: string) => {
    dispatch({ type: 'SET_OBJET', objet });
  }, []);

  // --- Rendu (parties 4-5 à compléter) ---
  return (
    <div className="site-editor">
      {/* PARTIE 2 — Stage */}
      <div className="site-editor__stage">
        <div className="site-editor__barre">
          <button
            type="button"
            className="site-editor__back"
            onClick={onClose}
            aria-label="Retour"
          >
            <Icon name="arrow-left" size={16} />
          </button>
          <div className="site-editor__seg">
            <button
              type="button"
              data-on={state.mode === 'flux' ? 'true' : 'false'}
              onClick={() => setMode('flux')}
            >
              Flux
            </button>
            <button
              type="button"
              data-on={state.mode === 'explorer' ? 'true' : 'false'}
              onClick={() => setMode('explorer')}
            >
              Explorer
            </button>
            <button
              type="button"
              data-on={state.mode === 'mini' ? 'true' : 'false'}
              onClick={() => setMode('mini')}
            >
              Mini-site
            </button>
          </div>
          <span className="site-editor__dirty">
            {state.dirty ? 'Modifications non publiées' : 'Rien de modifié'}
          </span>
          <button
            type="button"
            className="site-editor__save"
            onClick={sauvegarder}
            disabled={state.busy || !state.dirty}
          >
            {state.busy ? 'Enregistrement…' : 'Publier'}
          </button>
        </div>
        <div className="site-editor__preview" key={state.mode}>
          {state.mode === 'flux' ? (
            <PreviewFlux
              site={state.site}
              money={money}
              objet={state.objet}
              onObjet={setObjet}
            />
          ) : state.mode === 'explorer' ? (
            <PreviewExplorer
              site={state.site}
              money={money}
              objet={state.objet}
              onObjet={setObjet}
            />
          ) : (
            <PreviewMini
              site={state.site}
              money={money}
              objet={state.objet}
              onObjet={setObjet}
            />
          )}
        </div>
      </div>

      {/* PARTIE 3 — PvSheet : menu, sous-menus, fil d'Ariane */}
      {menuActif && (
        <div className="site-editor__sheet">
          <div className="site-editor__sheet-head">
            <div className="site-editor__sheet-ttl">
              <b>{sousActif ? sousActif.titre : menuActif.titre}</b>
              <span>{sousActif ? menuActif.titre : 'Menu du studio'}</span>
            </div>
            {sousActif ? (
              <button type="button" onClick={retourSheet} aria-label="Menu précédent">
                <Icon name="chevronUp" size={15} />
              </button>
            ) : null}
            <button type="button" onClick={fermerMenu} aria-label="Fermer le menu">
              <Icon name="x" size={14} />
            </button>
          </div>
          <div className="site-editor__search">
            <Icon name="search" size={14} />
            <input
              type="search"
              value={state.recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder={
                menuActif.sousMenus && !sousActif
                  ? `Rechercher dans « ${menuActif.titre} »…`
                  : 'Rechercher un réglage…'
              }
              aria-label="Rechercher dans ce menu"
              autoComplete="off"
            />
          </div>
          <div className="site-editor__sheet-body" ref={bodyRef}>
            {menuActif.sousMenus && !sousActif ? (
              sousFiltres.length === 0 ? (
                <div className="site-editor__sheet-vide">
                  Rien ne correspond à « {state.recherche} » dans ce menu.
                </div>
              ) : (
                <div className="site-editor__menulist">
                  {sousFiltres.map(({ sous, index }) => (
                    <button
                      key={`${sous.titre}-${index}`}
                      type="button"
                      className="site-editor__mrow"
                      onClick={() => ouvrirSous(menuActif, index)}
                    >
                      <span className="site-editor__mi">
                        <Icon name={sous.icone} size={15} />
                      </span>
                      <span className="site-editor__mt">
                        <b>{sous.titre}</b>
                        <span>{sous.description}</span>
                      </span>
                      <span className="site-editor__chev">
                        <Icon name="forward" size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              /* PARTIE 4 : les 22 panneaux */
              <PanneauVitrine
                key={state.panneau}
                panneau={state.panneau}
                site={state.site}
                money={money}
                objet={state.objet}
                onObjet={setObjet}
                maj={majSite}
              />
            )}
          </div>
        </div>
      )}

      {/* PARTIE 3 — Dock */}
      <div className="site-editor__dock">
        {MENUS.map((menu) => (
          <button
            key={menu.id}
            type="button"
            data-on={state.menuOuvert === menu.id ? 'true' : 'false'}
            onClick={() =>
              state.menuOuvert === menu.id ? fermerMenu() : ouvrirMenu(menu)
            }
            aria-label={menu.titre}
          >
            <Icon name={menu.icone} size={17} />
            <span>{menu.titre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partie 4/5 — Les 22 panneaux du studio
// ---------------------------------------------------------------------------

interface PanneauProps {
  panneau: PanneauId;
  site: MiniSite;
  money: Argent;
  objet: string;
  onObjet: (objet: string) => void;
  maj: (maj: (site: MiniSite) => void) => void;
}

/** Le libellé d'un champ : minuscule accentuée, icône fixe. */
function Champ({
  label,
  icone,
  children,
  compteur,
}: {
  label: string;
  icone: IconName;
  children: ReactNode;
  compteur?: string;
}) {
  return (
    <div className="site-editor__fld">
      <label>
        <Icon name={icone} size={11} />
        <span>{label}</span>
      </label>
      {children}
      {compteur ? <div className="site-editor__cnt">{compteur}</div> : null}
    </div>
  );
}

function ChampTexte({
  label,
  icone,
  valeur,
  onChange,
  maxLength,
  zone,
  placeholder,
}: {
  label: string;
  icone: IconName;
  valeur: string;
  onChange: (valeur: string) => void;
  maxLength?: number;
  zone?: boolean;
  placeholder?: string;
}) {
  return (
    <Champ
      label={label}
      icone={icone}
      compteur={maxLength ? `${valeur.length}/${maxLength}` : undefined}
    >
      {zone ? (
        <textarea
          className="site-editor__in"
          rows={2}
          maxLength={maxLength}
          value={valeur}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="site-editor__in"
          type="text"
          maxLength={maxLength}
          value={valeur}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Champ>
  );
}

function ChampNombre({
  label,
  icone,
  valeur,
  onChange,
  min = 0,
  step = 1,
}: {
  label: string;
  icone: IconName;
  valeur: number;
  onChange: (valeur: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <Champ label={label} icone={icone}>
      <input
        className="site-editor__in"
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(valeur) ? valeur : min}
        onChange={(event) =>
          onChange(event.target.value === '' ? min : Number(event.target.value))
        }
      />
    </Champ>
  );
}

function Plage({
  label,
  icone,
  valeur,
  min,
  max,
  step = 1,
  unite = '',
  onChange,
}: {
  label: string;
  icone: IconName;
  valeur: number;
  min: number;
  max: number;
  step?: number;
  unite?: string;
  onChange: (valeur: number) => void;
}) {
  return (
    <div className="site-editor__rng">
      <span className="site-editor__rng-ic">
        <Icon name={icone} size={12} />
      </span>
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valeur}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="site-editor__rng-v">
        {valeur}
        {unite}
      </span>
    </div>
  );
}

function Bascule({
  icone,
  titre,
  texte,
  actif,
  onChange,
}: {
  icone: IconName;
  titre: string;
  texte: string;
  actif: boolean;
  onChange: (actif: boolean) => void;
}) {
  return (
    <div className="site-editor__swwrap">
      <span className="site-editor__swi">
        <Icon name={icone} size={13} />
      </span>
      <span className="site-editor__sw-txt">
        <b>{titre}</b>
        <span>{texte}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={titre}
        className="site-editor__switch"
        data-on={actif ? 'true' : 'false'}
        onClick={() => onChange(!actif)}
      />
    </div>
  );
}

function Couleurs({
  label,
  valeurs,
  actif,
  onChange,
}: {
  label: string;
  valeurs: Array<[string, string]>;
  actif: string;
  onChange: (couleur: string) => void;
}) {
  return (
    <Champ label={label} icone="drop">
      <div className="site-editor__sw">
        {valeurs.map(([nom, couleur]) => (
          <button
            key={couleur}
            type="button"
            style={{ background: couleur }}
            data-on={couleur === actif ? 'true' : 'false'}
            aria-label={nom}
            title={nom}
            onClick={() => onChange(couleur)}
          />
        ))}
      </div>
    </Champ>
  );
}

const COULEURS_SW: Array<[string, string]> = COULEURS.map((couleur) => [couleur, couleur]);

function PanneauVitrine({ panneau, site, money, objet, onObjet, maj }: PanneauProps) {
  const [erreur, setErreur] = useState('');
  const index = site.items[site.sel] ? site.sel : 0;
  const item = site.items[index] ?? null;
  const fx = fxDe(item);
  const devise = money.currency || 'FC';

  /** Le champ prix se saisit dans la devise d'affichage, le modèle reste interne. */
  const prixAffiche = (unites: number) =>
    money.perUnit > 0 ? Math.round(unites * money.perUnit) : Math.round(unites);
  const prixSaisi = (valeur: number) =>
    money.perUnit > 0 ? Math.round(valeur / money.perUnit) : Math.round(valeur);

  const majItem = (majItem: (item: ElementItem) => void) => {
    maj((draft) => {
      const cible = draft.items[draft.sel];
      if (cible) majItem(cible);
    });
  };

  const majObjet = (majObjet: (objet: FxObjet) => void) => {
    maj((draft) => {
      const cible = draft.items[draft.sel];
      if (!cible) return;
      const copie = clonerFx(cible.fx);
      const objetCible = objetDeFx(copie, objet);
      if (!objetCible) return;
      majObjet(objetCible);
      cadrerObjet(objetCible);
      cible.fx = copie;
    });
  };

  const ajouterElement = () => {
    maj((draft) => {
      draft.items.push({
        nom: 'Nouvel élément',
        pack: 'à nommer',
        prix: 0,
        stock: 1,
        marque: '—',
        modele: '—',
        qualite: 'Grade A',
        etat: 'Neuf',
      });
      draft.sel = draft.items.length - 1;
    });
  };

  const poserSticker = (id: string) => {
    let position = -1;
    maj((draft) => {
      const cible = draft.items[draft.sel];
      if (!cible) return;
      const copie = clonerFx(cible.fx);
      const largeur = 22;
      const hauteur = 22;
      copie.stk.push({
        id,
        w: largeur,
        h: hauteur,
        x: Number(((100 - largeur) / 2).toFixed(1)),
        y: Number(((100 - hauteur) / 2).toFixed(1)),
        r: 0,
      });
      cible.fx = copie;
      position = copie.stk.length - 1;
    });
    if (position >= 0) onObjet(`stk:${position}`);
  };

  const retirerSticker = (position: number) => {
    maj((draft) => {
      const cible = draft.items[draft.sel];
      if (!cible) return;
      const copie = clonerFx(cible.fx);
      copie.stk.splice(position, 1);
      cible.fx = copie;
    });
    if (objet.startsWith('stk:')) onObjet('media');
  };

  const choisirImage = async (destination: 'logo' | 'galerie') => {
    setErreur('');
    try {
      const fichier = await pickImageFile();
      if (!fichier) return;
      const image = await compressImageFile(fichier, {
        maxChars: MEDIA_MAX_CHARS,
        maxSide: 1024,
      });
      maj((draft) => {
        if (destination === 'logo') {
          draft.logo = image.dataUrl;
          return;
        }
        if (draft.medias.length >= 10) return;
        draft.medias.push({
          type: 'photo',
          couleur: draft.couleur || '#46536a',
          label: `photo ${draft.medias.length + 1}`,
          url: image.dataUrl,
        });
      });
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Image illisible.');
    }
  };

  const erreurNode = erreur ? (
    <div className="site-editor__erreur">{erreur}</div>
  ) : null;

  // --- Identité -----------------------------------------------------------
  if (panneau === 'id') {
    return (
      <>
        {erreurNode}
        <ChampTexte
          label="Nom de la boutique"
          icone="txt"
          valeur={site.nom}
          maxLength={34}
          onChange={(nom) => maj((draft) => { draft.nom = nom; })}
        />
        <ChampTexte
          label="Accroche — lue dans le flux"
          icone="txt"
          valeur={site.accroche}
          maxLength={70}
          zone
          onChange={(accroche) => maj((draft) => { draft.accroche = accroche; })}
        />
        <Champ label="Famille" icone="grid">
          <div className="site-editor__strip">
            {FAMILLES.map((famille) => (
              <button
                key={famille}
                type="button"
                className="site-editor__chip"
                data-active={famille === site.cat ? 'true' : 'false'}
                onClick={() => maj((draft) => { draft.cat = famille; })}
              >
                <Icon name={iconeFamille(famille) as IconName} size={11} />
                {famille}
              </button>
            ))}
          </div>
        </Champ>
        <ChampTexte
          label="Adresse exacte"
          icone="pin"
          valeur={site.adresse}
          onChange={(adresse) => maj((draft) => { draft.adresse = adresse; })}
        />
        <ChampTexte
          label="Position sur la carte"
          icone="pin"
          valeur={site.position}
          onChange={(position) => maj((draft) => { draft.position = position; })}
        />
        <ChampTexte
          label="Distance affichée"
          icone="route"
          valeur={site.distance}
          onChange={(distance) => maj((draft) => { draft.distance = distance; })}
        />
        <Couleurs
          label="Couleur du logo"
          valeurs={COULEURS_SW}
          actif={site.couleur}
          onChange={(couleur) => maj((draft) => { draft.couleur = couleur; })}
        />
      </>
    );
  }

  // --- Médias -------------------------------------------------------------
  if (panneau === 'media') {
    return (
      <>
        {erreurNode}
        <Champ label="Logo" icone="cam">
          <div className="site-editor__medias">
            <div
              className="site-editor__mthumb site-editor__mthumb--logo"
              style={site.logo ? undefined : { background: site.couleur || '#46536a' }}
            >
              {site.logo ? (
                <img src={site.logo} alt="" />
              ) : (
                initialesDe(site.nom)
              )}
            </div>
            <button
              type="button"
              className="site-editor__mthumb site-editor__mthumb--add"
              onClick={() => void choisirImage('logo')}
              aria-label="photo du logo"
            >
              <Icon name="plus" size={18} />
            </button>
            <span className="site-editor__muted">initiale, ou une photo</span>
          </div>
        </Champ>

        <Champ label={`Galerie — ${site.medias.length}/10`} icone="cam">
          <div className="site-editor__medias">
            {site.medias.map((media, position) => (
              <div
                key={`${media.label}-${position}`}
                className="site-editor__mthumb"
                style={
                  media.url
                    ? {
                        backgroundImage: `url("${media.url}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : { background: `linear-gradient(150deg, ${media.couleur}, ${media.couleur}99)` }
                }
              >
                <span className="site-editor__mthumb-tag">{media.label}</span>
                <button
                  type="button"
                  className="site-editor__mthumb-x"
                  onClick={() => maj((draft) => { draft.medias.splice(position, 1); })}
                  aria-label="retirer"
                >
                  <Icon name="x" size={10} />
                </button>
              </div>
            ))}
            {site.medias.length < 10 ? (
              <button
                type="button"
                className="site-editor__mthumb site-editor__mthumb--add"
                onClick={() => void choisirImage('galerie')}
                aria-label="ajouter une photo"
              >
                <Icon name="plus" size={18} />
              </button>
            ) : null}
          </div>
          <div className="site-editor__muted">
            La 1re photo doit montrer l’endroit réel : c’est elle qui prouve la position.
          </div>
        </Champ>

        <Champ label="Vidéo du lieu (présentation)" icone="play">
          <div className="site-editor__medias">
            <div
              className="site-editor__mthumb site-editor__mthumb--video"
              style={{ background: 'linear-gradient(150deg, #0b1220, #46536a)' }}
            >
              <Icon name="play" size={22} />
              <input
                className="site-editor__mtag"
                value={site.videoLieu}
                placeholder="0:24"
                aria-label="Vidéo du lieu"
                onChange={(event) => maj((draft) => { draft.videoLieu = event.target.value; })}
              />
            </div>
          </div>
          <div className="site-editor__muted">
            Obligatoire si tu actives la localisation exacte.
          </div>
        </Champ>

        <Champ label="Vidéo de l’élément (flux)" icone="play">
          <div className="site-editor__medias">
            <div
              className="site-editor__mthumb site-editor__mthumb--video"
              style={{ background: `linear-gradient(150deg, ${site.couleur}, #0b1220)` }}
            >
              <Icon name="play" size={22} />
              <input
                className="site-editor__mtag"
                value={site.videoElt}
                placeholder="0:19"
                aria-label="Vidéo de l’élément"
                onChange={(event) => maj((draft) => { draft.videoElt = event.target.value; })}
              />
            </div>
          </div>
          <div className="site-editor__muted">
            Moins de 30 s, propre, sur l’élément exact : c’est ce qui monte vues, likes et confiance.
          </div>
        </Champ>

        <Champ label="Son d’accueil" icone="music">
          <div className="site-editor__blk">
            <span className="site-editor__gl" style={{ background: '#b5378c' }}>
              <Icon name="music" size={14} />
            </span>
            <span className="site-editor__gr">
              <b>{site.son || 'Aucun son'}</b>
              <span>12 s en tête de fiche, coupé dès que le client scrolle</span>
            </span>
            <button
              type="button"
              className="site-editor__up"
              onClick={() =>
                maj((draft) => { draft.son = draft.son ? '' : 'Annonce d’accueil · 0:12'; })
              }
            >
              <Icon name={site.son ? 'x' : 'plus'} size={11} />
              {site.son ? 'retirer' : 'ajouter'}
            </button>
          </div>
          <div className="site-editor__muted">
            À créer : les 9 types de bloc actuels n’ont pas d’audio.
          </div>
        </Champ>
      </>
    );
  }

  // --- Blocs --------------------------------------------------------------
  if (panneau === 'bloc') {
    return (
      <>
        <div className="site-editor__muted">
          L’ordre du bas = l’ordre de la fiche. Le haut de l’écran, lui, reste ton aperçu.
        </div>
        {site.blocs.map((bloc, position) => (
          <div className="site-editor__blk" key={`${bloc.titre}-${position}`}>
            <span className="site-editor__hd">
              <Icon name="grip" size={14} />
            </span>
            <span className="site-editor__gl" style={{ background: site.couleur || '#46536a' }}>
              <Icon name={(bloc.icone as IconName) || 'grid'} size={14} />
            </span>
            <span className="site-editor__gr">
              <b>{bloc.titre}</b>
              <span>{bloc.description || 'à décrire'}</span>
            </span>
            <button
              type="button"
              className="site-editor__up"
              disabled={position === 0}
              aria-label="monter"
              onClick={() =>
                maj((draft) => {
                  const [retire] = draft.blocs.splice(position, 1);
                  draft.blocs.splice(position - 1, 0, retire);
                })
              }
            >
              <Icon name="up" size={12} />
            </button>
            <button
              type="button"
              className="site-editor__up"
              disabled={position === site.blocs.length - 1}
              aria-label="descendre"
              onClick={() =>
                maj((draft) => {
                  const [retire] = draft.blocs.splice(position, 1);
                  draft.blocs.splice(position + 1, 0, retire);
                })
              }
            >
              <Icon name="down" size={12} />
            </button>
          </div>
        ))}
        <Champ label="Ajouter un bloc" icone="grid">
          <div className="site-editor__addblk">
            {TYPES_BLOC.map(([titre, icone]) => (
              <button
                key={titre}
                type="button"
                onClick={() =>
                  maj((draft) => {
                    draft.blocs.push({
                      titre,
                      description: `${titre.toLowerCase()} · à remplir`,
                      icone,
                    });
                  })
                }
              >
                <Icon name={icone} size={13} />
                {titre}
              </button>
            ))}
          </div>
        </Champ>
      </>
    );
  }

  // --- Élément ------------------------------------------------------------
  if (panneau === 'elt') {
    return (
      <>
        <Champ label={`Élément sélectionné (${site.items.length})`} icone="grid">
          <div className="site-editor__strip">
            {site.items.map((element, position) => (
              <button
                key={`${element.nom}-${position}`}
                type="button"
                className="site-editor__chip"
                data-active={position === index ? 'true' : 'false'}
                onClick={() => maj((draft) => { draft.sel = position; })}
              >
                <Icon name="cart" size={11} />
                {element.nom || 'Sans nom'}
              </button>
            ))}
            <button type="button" className="site-editor__chip" onClick={ajouterElement}>
              <Icon name="plus" size={11} />
              élément
            </button>
          </div>
        </Champ>
        {item ? (
          <>
            <ChampTexte
              label="Nom de l’élément"
              icone="txt"
              valeur={item.nom}
              maxLength={40}
              onChange={(nom) => majItem((cible) => { cible.nom = nom; })}
            />
            <ChampTexte
              label="Conditionnement"
              icone="box"
              valeur={item.pack}
              onChange={(pack) => majItem((cible) => { cible.pack = pack; })}
            />
            <ChampTexte
              label="Marque"
              icone="txt"
              valeur={item.marque}
              onChange={(marque) => majItem((cible) => { cible.marque = marque; })}
            />
            <ChampTexte
              label="Modèle"
              icone="txt"
              valeur={item.modele}
              onChange={(modele) => majItem((cible) => { cible.modele = modele; })}
            />
            <Champ label="Qualité" icone="star">
              <div className="site-editor__strip">
                {QUALITES.map((qualite) => (
                  <button
                    key={qualite}
                    type="button"
                    className="site-editor__chip"
                    data-active={qualite === item.qualite ? 'true' : 'false'}
                    onClick={() => majItem((cible) => { cible.qualite = qualite; })}
                  >
                    <Icon name="star" size={11} />
                    {qualite}
                  </button>
                ))}
              </div>
            </Champ>
            <Champ label="État" icone="spark">
              <div className="site-editor__strip">
                {ETATS.map((etat) => (
                  <button
                    key={etat}
                    type="button"
                    className="site-editor__chip"
                    data-active={etat === item.etat ? 'true' : 'false'}
                    onClick={() => majItem((cible) => { cible.etat = etat; })}
                  >
                    <Icon name="spark" size={11} />
                    {etat}
                  </button>
                ))}
              </div>
            </Champ>
            <ChampNombre
              label={`Prix affiché (${devise})`}
              icone="money"
              valeur={prixAffiche(item.prix)}
              step={50}
              onChange={(valeur) => majItem((cible) => { cible.prix = prixSaisi(valeur); })}
            />
          </>
        ) : (
          <div className="site-editor__vide">Aucun élément. Ajoute-en un.</div>
        )}
      </>
    );
  }

  // --- Stock --------------------------------------------------------------
  if (panneau === 'stock') {
    if (!item) return <div className="site-editor__vide">Aucun élément.</div>;
    return (
      <>
        <ChampNombre
          label="Nombre restant"
          icone="box"
          valeur={item.stock}
          step={1}
          onChange={(stock) => majItem((cible) => { cible.stock = stock; })}
        />
        <Bascule
          icone="offline"
          titre="À 0, l’élément disparaît"
          texte="sinon il reste affiché, marqué « épuisé »"
          actif={site.hideout ?? true}
          onChange={(hideout) => maj((draft) => { draft.hideout = hideout; })}
        />
        <Champ label="Alerte « bientôt épuisé » dès" icone="bolt">
          <div className="site-editor__strip">
            {[1, 3, 5, 10].map((seuil) => (
              <button
                key={seuil}
                type="button"
                className="site-editor__chip"
                data-active={(site.seuil ?? 3) === seuil ? 'true' : 'false'}
                onClick={() => maj((draft) => { draft.seuil = seuil; })}
              >
                <Icon name="bolt" size={11} />
                {seuil}
              </button>
            ))}
          </div>
        </Champ>
        <div className="site-editor__muted">
          Un achat diminue le stock ici, et la carte du flux suit.
        </div>
      </>
    );
  }

  // --- Livraison ----------------------------------------------------------
  if (panneau === 'liv') {
    return (
      <>
        <Bascule
          icone="car"
          titre="Livraison disponible"
          texte="le client la demande après le payement"
          actif={site.liv.on}
          onChange={(on) => maj((draft) => { draft.liv.on = on; })}
        />
        {site.liv.on ? (
          <>
            <ChampTexte
              label="Zone"
              icone="pin"
              valeur={site.liv.zone}
              onChange={(zone) => maj((draft) => { draft.liv.zone = zone; })}
            />
            <ChampNombre
              label={`Tarif (${devise})`}
              icone="money"
              valeur={prixAffiche(site.liv.tarif)}
              step={100}
              onChange={(valeur) => maj((draft) => { draft.liv.tarif = prixSaisi(valeur); })}
            />
            <ChampTexte
              label="Délai"
              icone="clock"
              valeur={site.liv.delai}
              onChange={(delai) => maj((draft) => { draft.liv.delai = delai; })}
            />
            <div className="site-editor__muted">
              La livraison fait partie de la personnalisation du mini-site : elle s’affiche
              sous ton adresse dans l’explorer. Le client la demande après le payement.
            </div>
          </>
        ) : (
          <div className="site-editor__muted">
            Désactivée : le client convient de la remise en main propre par chat.
          </div>
        )}
      </>
    );
  }

  // --- Liens --------------------------------------------------------------
  if (panneau === 'liens') {
    return (
      <>
        <div className="site-editor__muted">
          Ces liens apparaissent en bas de l’explorer de l’élément.
        </div>
        {site.liens.map((lien, position) => (
          <div className="site-editor__blk" key={`${lien.nom}-${position}`}>
            <span className="site-editor__gl" style={{ background: '#475569' }}>
              <Icon name={iconeLien(lien.nom)} size={13} />
            </span>
            <input
              className="site-editor__in site-editor__in--nu"
              value={lien.url}
              placeholder="adresse du lien"
              aria-label={`Lien ${lien.nom}`}
              onChange={(event) =>
                maj((draft) => { draft.liens[position].url = event.target.value; })
              }
            />
            <button
              type="button"
              className="site-editor__up"
              aria-label="retirer"
              onClick={() => maj((draft) => { draft.liens.splice(position, 1); })}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
        <Champ label="Ajouter" icone="share">
          <div className="site-editor__addblk">
            {LINKS.map(([nom, icone]) => (
              <button
                key={nom}
                type="button"
                onClick={() => maj((draft) => { draft.liens.push({ nom, url: '' }); })}
              >
                <Icon name={icone} size={12} />
                {nom}
              </button>
            ))}
          </div>
        </Champ>
      </>
    );
  }

  // --- Taille -------------------------------------------------------------
  if (panneau === 'taille') {
    const objetRegle = fx ? objetDeFx(fx, objet) : null;
    if (!item) return <div className="site-editor__vide">Aucun élément.</div>;
    if (!objetRegle) {
      return (
        <div className="site-editor__vide">
          Aucun objet sélectionné. Choisis un sticker dans le menu Stickers, ou règle la
          photo de l’élément.
        </div>
      );
    }
    return (
      <>
        <div className="site-editor__muted">
          Objet réglé : <b>{libelleObjet(objet, objetRegle)}</b>. Glisse-le dans l’aperçu,
          ou mets des valeurs ici.
        </div>
        <Plage
          label="Largeur"
          icone="rng"
          valeur={Math.round(objetRegle.w)}
          min={10}
          max={100}
          unite="%"
          onChange={(valeur) => majObjet((cible) => { cible.w = valeur; })}
        />
        <Plage
          label="Hauteur"
          icone="rng"
          valeur={Math.round(objetRegle.h)}
          min={10}
          max={100}
          unite="%"
          onChange={(valeur) => majObjet((cible) => { cible.h = valeur; })}
        />
        <Plage
          label="Position X"
          icone="rng"
          valeur={Math.round(objetRegle.x)}
          min={0}
          max={100}
          unite="%"
          onChange={(valeur) => majObjet((cible) => { cible.x = valeur; })}
        />
        <Plage
          label="Position Y"
          icone="rng"
          valeur={Math.round(objetRegle.y)}
          min={0}
          max={100}
          unite="%"
          onChange={(valeur) => majObjet((cible) => { cible.y = valeur; })}
        />
        <Plage
          label="Rotation"
          icone="route"
          valeur={Math.round(objetRegle.r)}
          min={-180}
          max={180}
          unite="°"
          onChange={(valeur) => majObjet((cible) => { cible.r = valeur; })}
        />
        <Champ label="Format" icone="r11">
          <div className="site-editor__addblk">
            <button type="button" onClick={() => majObjet((cible) => formatObjet(cible, 1))}>
              <Icon name="r11" size={12} />
              Carré
            </button>
            <button type="button" onClick={() => majObjet((cible) => formatObjet(cible, 0.5625))}>
              <Icon name="r916" size={12} />
              9:16
            </button>
            <button type="button" onClick={() => majObjet((cible) => formatObjet(cible, 1.3333))}>
              <Icon name="r43" size={12} />
              4:3
            </button>
            <button type="button" onClick={() => majObjet((cible) => formatObjet(cible, 1.7778))}>
              <Icon name="r169" size={12} />
              16:9
            </button>
          </div>
        </Champ>
        <Champ label="Cadre" icone="sliders">
          <div className="site-editor__addblk">
            <button
              type="button"
              onClick={() =>
                majObjet((cible) => {
                  const facteur = 1.15;
                  const largeur = cible.w * facteur;
                  const hauteur = cible.h * facteur;
                  if (largeur > 100 || hauteur > 100) return;
                  cible.x = borne(cible.x - (largeur - cible.w) / 2, 0, 100 - largeur);
                  cible.y = borne(cible.y - (hauteur - cible.h) / 2, 0, 100 - hauteur);
                  cible.w = largeur;
                  cible.h = hauteur;
                })
              }
            >
              <Icon name="expand" size={12} />
              Agrandir
            </button>
            <button
              type="button"
              onClick={() =>
                majObjet((cible) => {
                  const facteur = 0.87;
                  const largeur = cible.w * facteur;
                  const hauteur = cible.h * facteur;
                  if (largeur < 10 || hauteur < 10) return;
                  cible.x = borne(cible.x + (cible.w - largeur) / 2, 0, 100 - largeur);
                  cible.y = borne(cible.y + (cible.h - hauteur) / 2, 0, 100 - hauteur);
                  cible.w = largeur;
                  cible.h = hauteur;
                })
              }
            >
              <Icon name="shrink" size={12} />
              Réduire
            </button>
            <button
              type="button"
              onClick={() =>
                majObjet((cible) => {
                  cible.x = Number(((100 - cible.w) / 2).toFixed(1));
                  cible.y = Number(((100 - cible.h) / 2).toFixed(1));
                })
              }
            >
              <Icon name="center" size={12} />
              Centrer
            </button>
            <button
              type="button"
              onClick={() => {
                maj((draft) => {
                  const cible = draft.items[draft.sel];
                  if (cible) cible.fx = fxDefaut();
                });
                onObjet('media');
              }}
            >
              <Icon name="undo" size={12} />
              Réinitialiser
            </button>
          </div>
        </Champ>
        <div className="site-editor__muted">
          Les poignées blanches dans l’aperçu font la même chose, à la main.
        </div>
      </>
    );
  }

  // --- Légende et typographie --------------------------------------------
  if (panneau === 'cap' || panneau === 'capsize' || panneau === 'align' ||
      panneau === 'capcolor' || panneau === 'font' || panneau === 'weight') {
    if (!item) return <div className="site-editor__vide">Aucun élément.</div>;
    if (panneau === 'font') {
      const policeActive = item.font ?? FONTS[0][1];
      return (
        <>
          {FONTS.map(([nom, police]) => (
            <button
              key={nom}
              type="button"
              className="site-editor__frow"
              data-on={police === policeActive ? 'true' : 'false'}
              onClick={() => majItem((cible) => { cible.font = police; })}
            >
              <span className="site-editor__fx" style={{ fontFamily: police }}>
                Aa {item.nom || 'élément'}
              </span>
              <span className="site-editor__fn">{nom}</span>
            </button>
          ))}
          <div className="site-editor__muted">
            Polices du système, rien à télécharger. Dans l’app : les familles embarquées.
          </div>
        </>
      );
    }
    if (panneau === 'weight') {
      return (
        <>
          <Champ label="Graisse" icone="bold">
            <div className="site-editor__strip">
              {GRAISSES.map((graisse) => (
                <button
                  key={graisse}
                  type="button"
                  className="site-editor__chip"
                  data-active={(item.weight ?? 700) === graisse ? 'true' : 'false'}
                  onClick={() => majItem((cible) => { cible.weight = graisse; })}
                >
                  <Icon name="bold" size={11} />
                  {graisse}
                </button>
              ))}
            </div>
          </Champ>
          <div className="site-editor__muted">
            {item.weight ?? 700} appliqué à la légende et au titre de l’élément.
          </div>
        </>
      );
    }
    if (panneau === 'capsize') {
      return (
        <>
          <Plage
            label="Corps du texte"
            icone="rng"
            valeur={item.capPx ?? 17}
            min={10}
            max={44}
            unite="px"
            onChange={(valeur) => majItem((cible) => { cible.capPx = valeur; })}
          />
          <div className="site-editor__muted">
            Le corps se règle aussi dans le menu Texte.
          </div>
        </>
      );
    }
    if (panneau === 'align') {
      return (
        <>
          <Champ label="Alignement" icone="alignC">
            <div className="site-editor__strip">
              {ALIGNS.map(([label, valeur]) => (
                <button
                  key={valeur}
                  type="button"
                  className="site-editor__chip"
                  data-active={(item.capAlign ?? 'center') === valeur ? 'true' : 'false'}
                  onClick={() => majItem((cible) => { cible.capAlign = valeur; })}
                >
                  <Icon
                    name={valeur === 'left' ? 'alignL' : valeur === 'right' ? 'alignR' : 'alignC'}
                    size={11}
                  />
                  {label}
                </button>
              ))}
            </div>
          </Champ>
          <div className="site-editor__muted">
            Centre = le plus lisible sur une photo.
          </div>
        </>
      );
    }
    if (panneau === 'capcolor') {
      return (
        <>
          <Couleurs
            label="Couleur du texte"
            valeurs={CAP_COLS}
            actif={item.capCol ?? '#ffffff'}
            onChange={(couleur) => majItem((cible) => { cible.capCol = couleur; })}
          />
          <div className="site-editor__muted">
            Teste blanc et noir sur TA photo : c’est ce qui reste lisible dans le flux.
          </div>
        </>
      );
    }
    return (
      <>
        <ChampTexte
          label="Texte de la légende"
          icone="cap"
          valeur={item.cap ?? ''}
          maxLength={60}
          zone
          onChange={(cap) => majItem((cible) => { cible.cap = cap; })}
        />
        <Champ label="Alignement" icone="alignC">
          <div className="site-editor__strip">
            {ALIGNS.map(([label, valeur]) => (
              <button
                key={valeur}
                type="button"
                className="site-editor__chip"
                data-active={(item.capAlign ?? 'center') === valeur ? 'true' : 'false'}
                onClick={() => majItem((cible) => { cible.capAlign = valeur; })}
              >
                <Icon
                  name={valeur === 'left' ? 'alignL' : valeur === 'right' ? 'alignR' : 'alignC'}
                  size={11}
                />
                {label}
              </button>
            ))}
          </div>
        </Champ>
        <Plage
          label="Corps du texte"
          icone="rng"
          valeur={item.capPx ?? 17}
          min={10}
          max={44}
          unite="px"
          onChange={(valeur) => majItem((cible) => { cible.capPx = valeur; })}
        />
        <div className="site-editor__muted">
          Vide = aucune légende sur l’image. Écris le texte, il se pose dans l’aperçu.
        </div>
      </>
    );
  }

  // --- Stickers -----------------------------------------------------------
  if (panneau.startsWith('stk:')) {
    const categorie = panneau.slice(4);
    const liste = STICKERS.find((entree) => entree.nom === categorie)?.icones ?? [];
    const poses = fx?.stk ?? [];
    return (
      <>
        <Champ label={`${categorie} · ${liste.length} stickers`} icone="stk">
          <div className="site-editor__mgrid">
            {liste.map((icone) => (
              <button
                key={icone}
                type="button"
                aria-label={icone}
                disabled={!item}
                onClick={() => poserSticker(icone)}
              >
                <Icon name={icone as IconName} size={24} />
              </button>
            ))}
          </div>
        </Champ>
        {poses.length > 0 ? (
          <Champ label={`Posés sur l’élément (${poses.length})`} icone="stk">
            {poses.map((sticker, position) => (
              <div className="site-editor__blk" key={`${sticker.id}-${position}`}>
                <span className="site-editor__gl" style={{ background: site.couleur || '#46536a' }}>
                  <Icon name={sticker.id as IconName} size={14} />
                </span>
                <span className="site-editor__gr">
                  <b>{sticker.id}</b>
                  <span>
                    {Math.round(sticker.w)}% × {Math.round(sticker.h)}% · {sticker.r}°
                  </span>
                </span>
                <button
                  type="button"
                  className="site-editor__up"
                  disabled={objet === `stk:${position}`}
                  onClick={() => onObjet(`stk:${position}`)}
                >
                  <Icon name="grip" size={11} />
                  {objet === `stk:${position}` ? 'choisi' : 'choisir'}
                </button>
                <button
                  type="button"
                  className="site-editor__up"
                  aria-label="retirer"
                  onClick={() => retirerSticker(position)}
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </Champ>
        ) : null}
        <div className="site-editor__muted">
          {item
            ? 'Un sticker posé devient un objet : il se règle dans Taille (position, taille, rotation).'
            : 'Ajoute d’abord un élément dans le menu Élément.'}
        </div>
      </>
    );
  }

  // --- Mini-site ----------------------------------------------------------
  if (panneau === 'ms_head') {
    return (
      <>
        <Bascule
          icone="live"
          titre="La boutique est en direct"
          texte="l’entête du mini-site devient un bandeau de live"
          actif={site.live}
          onChange={(live) => maj((draft) => { draft.live = live; })}
        />
        {site.live ? (
          <ChampTexte
            label="Sujet du live"
            icone="live"
            valeur={site.ms.sujet}
            maxLength={52}
            onChange={(sujet) => maj((draft) => { draft.ms.sujet = sujet; })}
          />
        ) : (
          <ChampTexte
            label="Accroche du mini-site"
            icone="txt"
            valeur={site.accroche}
            maxLength={70}
            zone
            onChange={(accroche) => maj((draft) => { draft.accroche = accroche; })}
          />
        )}
        <ChampNombre
          label="Spectateurs affichés"
          icone="eye"
          valeur={site.ms.viewers}
          step={10}
          onChange={(viewers) => maj((draft) => { draft.ms.viewers = viewers; })}
        />
        <ChampNombre
          label="Abonnés affichés"
          icone="users"
          valeur={site.ms.abon}
          step={20}
          onChange={(abon) => maj((draft) => { draft.ms.abon = abon; })}
        />
        <div className="site-editor__muted">
          Le bandeau de live se place en tête du mini-site, comme sur YouTube ou Instagram :
          titre du direct, spectateurs, bouton pour entrer.
        </div>
      </>
    );
  }

  if (panneau === 'ms_lives') {
    const lives = site.ms.lives;
    const reten = site.ms.reten ?? 0;
    return (
      <>
        {lives.length > 0 ? (
          <>
            <Plage
              label="Vignettes en ligne"
              icone="live"
              valeur={reten}
              min={0}
              max={lives.length}
              onChange={(valeur) => maj((draft) => { draft.ms.reten = valeur; })}
            />
            <div className="site-editor__muted">
              Les plus récents restent lisibles, les plus anciens passent « hors ligne ».
              Une vignette = le sujet du live, pas une vidéo.
            </div>
          </>
        ) : (
          <div className="site-editor__muted">
            Aucun live dans l’historique : les vignettes apparaîtront après le premier direct.
          </div>
        )}
        {lives.map((live, position) => {
          const enLigne = position < reten;
          return (
            <div className="site-editor__blk" key={`${live[0]}-${position}`}>
              <span
                className="site-editor__gl"
                style={{ background: enLigne ? site.couleur || '#46536a' : '#46536a' }}
              >
                <Icon name={enLigne ? 'live' : 'offline'} size={14} />
              </span>
              <span className="site-editor__gr">
                <b>{live[0]}</b>
                <span>
                  {enLigne ? 'en ligne' : 'hors ligne'} · {live[2]} · {nf.format(live[1])} vues
                </span>
              </span>
              <input
                className="site-editor__in site-editor__in--nu"
                value={live[0]}
                maxLength={46}
                aria-label="sujet du live"
                onChange={(event) =>
                  maj((draft) => { draft.ms.lives[position][0] = event.target.value; })
                }
              />
            </div>
          );
        })}
      </>
    );
  }

  if (panneau === 'ms_grid') {
    const colonnes = site.ms.cols || 3;
    return (
      <>
        <Champ label="Colonnes de la grille" icone="grid">
          <div className="site-editor__strip">
            {[1, 2, 3, 4].map((nombre) => (
              <button
                key={nombre}
                type="button"
                className="site-editor__chip"
                data-active={colonnes === nombre ? 'true' : 'false'}
                onClick={() => maj((draft) => { draft.ms.cols = nombre; })}
              >
                <Icon
                  name={
                    nombre === 1 ? 'r11' : nombre === 2 ? 'r43' : nombre === 3 ? 'r916' : 'r169'
                  }
                  size={11}
                />
                {nombre}
              </button>
            ))}
          </div>
        </Champ>
        <Bascule
          icone="heart"
          titre="Bouton « suivre le produit »"
          texte="à côté de l’ajout au panier, sur chaque vignette"
          actif={site.ms.suivre}
          onChange={(suivre) => maj((draft) => { draft.ms.suivre = suivre; })}
        />
        {item ? (
          <div className="site-editor__muted">
            Tuile choisie : <b>{item.nom}</b> · {prixDe(item.prix, money)} · stock{' '}
            {item.stock}. Le prix vient du menu Élément, le stock du menu Stock.
          </div>
        ) : (
          <div className="site-editor__vide">Aucun élément.</div>
        )}
        <div className="site-editor__muted">
          « Suivre » garde l’alerte prix sur l’élément ; « Panier » ajoute l’article au panier
          réel, celui du Coffre.
        </div>
      </>
    );
  }

  if (panneau === 'ms_side') {
    return (
      <>
        <Bascule
          icone="cart"
          titre="Mon panier"
          texte="le visiteur voit son panier et son total"
          actif={site.ms.showCart}
          onChange={(showCart) => maj((draft) => { draft.ms.showCart = showCart; })}
        />
        <Bascule
          icone="pin"
          titre="Mon adresse"
          texte="adresse du visiteur + les conditions de livraison"
          actif={site.ms.showAddr}
          onChange={(showAddr) => maj((draft) => { draft.ms.showAddr = showAddr; })}
        />
        <div className="site-editor__blk">
          <span className="site-editor__gl" style={{ background: site.couleur || '#46536a' }}>
            <Icon name="cart" size={14} />
          </span>
          <span className="site-editor__gr">
            <b>panier vide</b>
            <span>Le panier réel vit dans le Coffre, PIN avant le débit.</span>
          </span>
          <button type="button" className="site-editor__up" disabled aria-label="vider">
            <Icon name="trash" size={11} />
            vider
          </button>
        </div>
        <ChampTexte
          label="Adresse du visiteur"
          icone="pin"
          valeur={site.ms.adresse}
          onChange={(adresse) => maj((draft) => { draft.ms.adresse = adresse; })}
        />
        <div className="site-editor__muted">
          L’adresse de la boutique se règle dans Identité, la livraison dans Livraison.
        </div>
      </>
    );
  }

  if (panneau === 'ms_stats') {
    const likes = site.items.reduce(
      (total, _element, position) =>
        total + 48 + ((position * 61) % 163) + (site.ms.likes[position] === 1 ? 1 : 0),
      0
    );
    return (
      <>
        <Bascule
          icone="eye"
          titre="Bloc statistiques publiques"
          texte="vues, avis, confiance, likes — ce que tout le monde voit"
          actif={site.ms.showStats}
          onChange={(showStats) => maj((draft) => { draft.ms.showStats = showStats; })}
        />
        <ChampNombre
          label="Vues du mini-site"
          icone="eye"
          valeur={site.stats.vues}
          step={50}
          onChange={(vues) => maj((draft) => { draft.stats.vues = vues; })}
        />
        <ChampNombre
          label="Avis · commentaires"
          icone="chat"
          valeur={site.stats.com}
          step={1}
          onChange={(com) => maj((draft) => { draft.stats.com = com; })}
        />
        <ChampTexte
          label="Confiance affichée"
          icone="shield"
          valeur={site.stats.score}
          onChange={(score) => maj((draft) => { draft.stats.score = score; })}
        />
        <div className="site-editor__blk">
          <span className="site-editor__gl" style={{ background: '#e95474' }}>
            <Icon name="heart" size={14} />
          </span>
          <span className="site-editor__gr">
            <b>{nf.format(likes)} likes</b>
            <span>
              la somme des likes des {site.items.length} éléments, chacun visible sur sa tuile
            </span>
          </span>
        </div>
        <div className="site-editor__muted">
          Les likes par élément se touchent dans l’aperçu : le compteur change et il reste
          quand tu reviens.
        </div>
      </>
    );
  }

  if (panneau === 'ms_soc') {
    return (
      <>
        <Bascule
          icone="share"
          titre="Icônes des réseaux"
          texte="toutes petites, en bas de page"
          actif={site.ms.showSoc}
          onChange={(showSoc) => maj((draft) => { draft.ms.showSoc = showSoc; })}
        />
        <Bascule
          icone="info"
          titre="À propos de la boutique"
          texte="le paragraphe sous les icônes"
          actif={site.ms.showAbout}
          onChange={(showAbout) => maj((draft) => { draft.ms.showAbout = showAbout; })}
        />
        <ChampTexte
          label="À propos"
          icone="info"
          valeur={site.ms.about}
          maxLength={180}
          zone
          onChange={(about) => maj((draft) => { draft.ms.about = about; })}
        />
        <Champ label={`Les liens affichés (${site.liens.length})`} icone="share">
          {site.liens.map((lien, position) => (
            <div className="site-editor__blk" key={`${lien.nom}-${position}`}>
              <span className="site-editor__gl" style={{ background: '#475569' }}>
                <Icon name={iconeLien(lien.nom)} size={14} />
              </span>
              <span className="site-editor__gr">
                <b>{lien.nom}</b>
                <span>{lien.url || 'adresse à coller'}</span>
              </span>
              <button
                type="button"
                className="site-editor__up"
                aria-label="retirer"
                onClick={() => maj((draft) => { draft.liens.splice(position, 1); })}
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          ))}
          <div className="site-editor__addblk">
            {LINKS.map(([nom, icone]) => (
              <button
                key={nom}
                type="button"
                onClick={() => maj((draft) => { draft.liens.push({ nom, url: '' }); })}
              >
                <Icon name={icone} size={12} />
                {nom}
              </button>
            ))}
          </div>
        </Champ>
        <div className="site-editor__muted">
          Dans l’explorer, ces liens prennent une ligne complète ; ici ils ne sont que des
          icônes.
        </div>
      </>
    );
  }

  if (panneau === 'live') {
    return (
      <>
        <Bascule
          icone="live"
          titre="Je suis en live"
          texte="le direct va sur ma fiche, pas dans le flux ; la carte porte un badge"
          actif={site.live}
          onChange={(live) => maj((draft) => { draft.live = live; })}
        />
        {site.live ? (
          <div className="site-editor__muted">
            Dans le flux : petit symbole Live sur ta carte. Dans l’explorer : le direct
            s’affiche en haut, tes éléments en dessous, alignés.
          </div>
        ) : null}
        <ChampTexte
          label="Accroche du direct"
          icone="txt"
          valeur={site.liveTitre}
          onChange={(liveTitre) => maj((draft) => { draft.liveTitre = liveTitre; })}
        />
        <div className="site-editor__muted">
          Le live consomme la présence à la seconde (robinet). Il s’arrête si le solde du
          vendeur tombe à zéro.
        </div>
      </>
    );
  }

  return <div className="site-editor__vide">Panneau inconnu.</div>;
}

// ---------------------------------------------------------------------------
// Partie 2/5 — Les trois aperçus (flux, explorer, mini-site)
// ---------------------------------------------------------------------------

type Argent = ReturnType<typeof useDisplayAmount>;

const nf = new Intl.NumberFormat('fr-FR');

function initialesDe(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

const couleurDe = (site: MiniSite) => site.couleur || couleurFamille(site.cat);

const prixDe = (prix: number, money: Argent) => {
  if (!Number.isFinite(prix) || prix <= 0) return 'à définir';
  // Tant que la table de change n'est pas chargée, `format` renvoie « - » :
  // on garde alors le nombre brut pour que l'aperçu reste lisible.
  const rendu = money.format(prix);
  if (rendu && rendu !== '-') return rendu;
  return `${nf.format(prix)} ${money.currency}`.trim();
};

/** La carte telle qu'elle apparaît dans le flux Zando. */
function CarteFlux({
  nom,
  couleur,
  texte,
  kind,
  visuel,
  image,
  logo,
}: {
  nom: string;
  couleur: string;
  texte: string;
  kind: 'solo' | 'boutique' | 'live';
  visuel: string;
  image?: string;
  logo?: string;
}) {
  return (
    <div className="site-editor__fc">
      <div
        className="site-editor__fc-ph"
        style={{ background: `linear-gradient(150deg, ${couleur}33, ${couleur}0d)` }}
      >
        {image ? <img src={image} alt="" /> : <span>{visuel}</span>}
        {kind === 'live' ? (
          <span className="site-editor__live">
            <i />
            Live
          </span>
        ) : null}
      </div>
      <div className="site-editor__fc-in">
        <span
          className="site-editor__fc-av"
          style={logo ? undefined : { background: couleur }}
        >
          {logo ? <img src={logo} alt="" /> : initialesDe(nom)}
        </span>
        <span className="site-editor__fc-who">
          <b>{nom}</b>
          <span>{texte}</span>
        </span>
        {kind !== 'solo' ? <span className="site-editor__fc-exp">Explorer</span> : null}
      </div>
    </div>
  );
}

function PreviewFlux({
  site,
  money,
  objet,
  onObjet,
}: {
  site: MiniSite;
  money: Argent;
  objet: string;
  onObjet: (objet: string) => void;
}) {
  const couleur = couleurDe(site);
  const premier = site.medias[0];
  const sel = site.items[site.sel] ?? site.items[0] ?? null;
  const detail = [
    site.cat,
    site.items.length
      ? `${site.items.length} article${site.items.length > 1 ? 's' : ''}`
      : null,
    site.distance || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="site-editor__flux">
      <CanevasElement site={site} item={sel} objet={objet} onObjet={onObjet} />
      <div className="site-editor__lab">Ta carte dans le flux</div>
      <CarteFlux
        nom={site.nom || 'Ma boutique'}
        couleur={couleur}
        texte={detail || 'Boutique Zando'}
        kind={site.live ? 'live' : 'boutique'}
        visuel={premier ? premier.label : 'visuel de la vitrine'}
        image={premier?.url}
        logo={site.logo}
      />

      <div className="site-editor__lab">Les autres formats</div>
      <CarteFlux
        nom="Kabelo M."
        couleur="#46536a"
        texte="iPhone 13 Pro Max · main à main"
        kind="solo"
        visuel="photo de l’objet"
      />
      <CarteFlux
        nom="Pharmacie du Marché"
        couleur="#0b9a63"
        texte="Boutique · Paracétamol 500 mg · à 1,2 km"
        kind="live"
        visuel="visuel de la vitrine"
      />

      <div className="site-editor__note">
        Le flux ne montre qu’une carte par vendeur : la vente solo n’a ni badge Live ni
        bouton Explorer.
      </div>
    </div>
  );
}

/** Une ligne de prix, partagée par Explorer et le mini-site. */
function LignePrix({
  item,
  couleur,
  money,
}: {
  item: ElementItem;
  couleur: string;
  money: Argent;
}) {
  const sous =
    [item.marque, item.modele, item.etat].filter(Boolean).join(' · ') ||
    item.pack ||
    'prix affiché';
  return (
    <div className="site-editor__item">
      <span className="site-editor__thumb" style={{ background: couleur }}>
        <Icon name="market" size={15} />
      </span>
      <span className="site-editor__item-txt">
        <b>{item.nom}</b>
        <span>{sous}</span>
      </span>
      <span className="site-editor__prix">{prixDe(item.prix, money)}</span>
      <span className="site-editor__add" aria-hidden="true">
        <Icon name="plus" size={12} />
      </span>
    </div>
  );
}

/** Les positions du modèle sont en pourcentage du canevas. */
function styleObjet(objet: FxObjet) {
  return {
    left: `${objet.x}%`,
    top: `${objet.y}%`,
    width: `${objet.w}%`,
    height: `${objet.h}%`,
    transform: `rotate(${objet.r}deg)`,
  };
}

/**
 * Le canevas de l'élément : la photo, la légende et les stickers posés.
 * Toucher un objet le choisit pour le panneau Taille.
 */
function CanevasElement({
  site,
  item,
  objet,
  onObjet,
}: {
  site: MiniSite;
  item: ElementItem | null;
  objet: string;
  onObjet: (objet: string) => void;
}) {
  const couleur = couleurDe(site);
  const fx = fxDe(item);
  const legende = item?.cap?.trim() ?? '';

  if (!item || !fx) {
    return (
      <div className="site-editor__canvas">
        <div className="site-editor__canvas-bg">visuel de la vitrine</div>
        {site.live ? (
          <span className="site-editor__canvas-live">
            <Icon name="live" size={8} />
            Live
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="site-editor__canvas">
      <div className="site-editor__canvas-bg" />

      <button
        type="button"
        className="site-editor__tbox"
        data-kind="media"
        data-sel={objet === 'media' ? 'true' : 'false'}
        style={{
          ...styleObjet(fx.media),
          background: `linear-gradient(150deg, ${couleur}, rgba(11, 18, 32, 0.5))`,
        }}
        onClick={() => onObjet('media')}
        aria-label="Choisir la photo de l’élément"
      >
        <span className="site-editor__tbox-g">{item.nom || 'photo de l’élément'}</span>
        {site.videoElt ? (
          <span className="site-editor__tbox-vid">
            <Icon name="play" size={9} />
            {site.videoElt}
          </span>
        ) : null}
      </button>

      {fx.stk.map((sticker, position) => (
        <button
          key={`${sticker.id}-${position}`}
          type="button"
          className="site-editor__tbox"
          data-kind="stk"
          data-sel={objet === `stk:${position}` ? 'true' : 'false'}
          style={styleObjet(sticker)}
          onClick={() => onObjet(`stk:${position}`)}
          aria-label={`Choisir le sticker ${sticker.id}`}
        >
          <Icon name={sticker.id as IconName} size={24} />
        </button>
      ))}

      {legende ? (
        <button
          type="button"
          className="site-editor__tbox"
          data-kind="cap"
          data-sel={objet === 'cap' ? 'true' : 'false'}
          style={styleObjet(fx.cap)}
          onClick={() => onObjet('cap')}
          aria-label="Choisir la légende"
        >
          <span
            className="site-editor__tbox-cap"
            style={{
              fontFamily: item.font ?? 'inherit',
              fontWeight: item.weight ?? 700,
              fontSize: `${item.capPx ?? 17}px`,
              textAlign: item.capAlign ?? 'center',
              color: item.capCol ?? '#ffffff',
            }}
          >
            {legende}
          </span>
        </button>
      ) : null}

      {site.live ? (
        <span className="site-editor__canvas-live">
          <Icon name="live" size={8} />
          Live
        </span>
      ) : null}
    </div>
  );
}

function PreviewExplorer({
  site,
  money,
  objet,
  onObjet,
}: {
  site: MiniSite;
  money: Argent;
  objet: string;
  onObjet: (objet: string) => void;
}) {
  const couleur = couleurDe(site);
  const sel = site.items[site.sel] ?? site.items[0] ?? null;

  return (
    <div className="site-editor__explorer">
      <CanevasElement site={site} item={sel} objet={objet} onObjet={onObjet} />

      <div className="site-editor__id">
        <span
          className="site-editor__logo"
          style={site.logo ? undefined : { background: couleur }}
        >
          {site.logo ? <img src={site.logo} alt="" /> : initialesDe(site.nom)}
        </span>
        <span className="site-editor__id-txt">
          <b>{site.nom || 'Ma boutique'}</b>
          <span>
            {[site.cat, `${nf.format(site.ms.abon)} abonnés`, site.distance]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <span className="site-editor__retour">Flux</span>
      </div>

      <div className="site-editor__sec">
        Ses autres services <span>{site.items.length}</span>
      </div>
      {site.items.length === 0 ? (
        <div className="site-editor__empty">
          <Icon name="market" size={22} />
          <b>Aucun prix publié</b>
          <span>Le panneau Élément ajoutera le premier.</span>
        </div>
      ) : (
        <div className="site-editor__list">
          {site.items.map((item, index) => (
            <LignePrix
              key={`${item.nom}-${index}`}
              item={item}
              couleur={couleur}
              money={money}
            />
          ))}
        </div>
      )}

      <div className="site-editor__note">
        Mêmes gouttières et même largeur que le bloc live.
      </div>
    </div>
  );
}

function PreviewMini({
  site,
  money,
  objet,
  onObjet,
}: {
  site: MiniSite;
  money: Argent;
  objet: string;
  onObjet: (objet: string) => void;
}) {
  const couleur = couleurDe(site);
  const sel = site.items[site.sel] ?? site.items[0] ?? null;

  return (
    <div className="site-editor__mini">
      <div className="site-editor__mini-head">
        <span
          className="site-editor__logo"
          style={site.logo ? undefined : { background: couleur }}
        >
          {site.logo ? <img src={site.logo} alt="" /> : initialesDe(site.nom)}
        </span>
        <span className="site-editor__id-txt">
          <b>{site.nom || 'Ma boutique'}</b>
          <span>
            {[site.cat, `${nf.format(site.ms.abon)} abonnés`]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        {site.stats.score && site.stats.score !== '—' ? (
          <span className="site-editor__score">{site.stats.score}</span>
        ) : null}
      </div>

      <div className="site-editor__pills">
        {site.live ? (
          <span className="site-editor__pill site-editor__pill--live">
            ● {site.liveTitre || 'En direct'}
          </span>
        ) : null}
        <span className="site-editor__pill">
          <Icon name="pin" size={10} />
          {site.distance || 'distance à régler'}
        </span>
        <span className="site-editor__pill">
          <Icon name="eye" size={10} />
          {nf.format(site.stats.vues)}
        </span>
        <span className="site-editor__pill">
          <Icon name="heart" size={10} />
          {nf.format(site.stats.likes)}
        </span>
      </div>

      <CanevasElement site={site} item={sel} objet={objet} onObjet={onObjet} />

      <div className="site-editor__sec">
        Photos <span>organiser</span>
      </div>
      <div className="site-editor__gal">
        {site.medias.length === 0
          ? [0, 1, 2].map((index) => (
              <div key={index} className="site-editor__slot site-editor__slot--empty">
                photo
                <br />
                à ajouter
              </div>
            ))
          : site.medias.map((media, index) => (
              <div
                key={index}
                className="site-editor__slot"
                style={
                  media.url
                    ? undefined
                    : { background: `linear-gradient(150deg, ${media.couleur}, ${couleur})` }
                }
              >
                {media.url ? <img src={media.url} alt="" /> : null}
                <span className="site-editor__slot-tag">{media.label}</span>
              </div>
            ))}
      </div>

      <div className="site-editor__sec">
        Services <span>+ ajouter</span>
      </div>
      {site.blocs.length === 0 ? (
        <div className="site-editor__note">
          Aucun service : le panneau Blocs les décrit.
        </div>
      ) : (
        <div className="site-editor__svc">
          {site.blocs.map((bloc, index) => (
            <div key={`${bloc.titre}-${index}`}>
              <span className="site-editor__svc-ic" style={{ background: couleur }}>
                <Icon name={(bloc.icone as IconName) || 'sparkles'} size={13} />
              </span>
              <span>{bloc.titre}</span>
            </div>
          ))}
        </div>
      )}

      <div className="site-editor__sec">
        Prix{' '}
        <span>
          {site.items.length} tarif{site.items.length > 1 ? 's' : ''}
        </span>
      </div>
      {site.items.length === 0 ? (
        <div className="site-editor__note">
          Aucun prix : le panneau Élément ouvre la liste.
        </div>
      ) : (
        <div className="site-editor__list">
          {site.items.map((item, index) => (
            <LignePrix
              key={`${item.nom}-${index}`}
              item={item}
              couleur={couleur}
              money={money}
            />
          ))}
        </div>
      )}

      {site.liv.on ? (
        <>
          <div className="site-editor__sec">Livraison</div>
          <div className="site-editor__card">
            {[site.liv.zone, site.liv.delai, prixDe(site.liv.tarif, money)]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </>
      ) : null}

      <div className="site-editor__sec">Contact</div>
      <div className="site-editor__card">
        <Icon name="pin" size={14} />
        <span>{site.adresse || site.ms.adresse || 'Adresse à renseigner'}</span>
      </div>

      {site.liens.length > 0 ? (
        <div className="site-editor__links">
          {site.liens.map((lien, index) => (
            <span key={`${lien.nom}-${index}`} className="site-editor__link">
              <Icon name="external" size={10} />
              {lien.nom}
            </span>
          ))}
        </div>
      ) : null}

      <div className="site-editor__mini-foot">
        Présence facturée à la seconde · robinet ouvert
      </div>
    </div>
  );
}