import { useEffect, useMemo, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import {
  StudioBoutiqueIcon,
  StudioConnectIcon,
  StudioContentIcon,
  StudioOfferIcon,
  StudioSparkIcon,
} from '../components/StudioIcons';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBlock,
  Field,
  IconButton,
  Input,
  KeyValue,
  List,
  Proposal,
  Row,
  ScreenHeader,
  Sheet,
  Skeleton,
  Textarea,
} from '../components/Ui';
import { BoutiqueSite } from '../components/BoutiqueSite';
import { SiteEditor } from '../components/SiteEditor';
import { type MiniSite as MiniSiteVitrine } from '../lib/site-model';
import {
  normaliserVitrine,
  versApiSite,
  vitrineDepuisApi,
  vitrineDepuisBrouillon,
} from '../lib/vitrine-pont';
import { couleurFamille, FAMILLES, iconeFamille } from '../lib/studio-data';
import { BandeauConnexion } from '../components/BandeauConnexion';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { useHelp } from '../lib/help';
import { PinSheet } from '../components/PinSheet';
import {
  GALERIE_MAX,
  MEDIA_MAX_CHARS,
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  connexionsProches,
  createShop,
  createZandoCustomType,
  createZandoItem,
  deleteZandoItem,
  describeError,
  getPinStatus,
  getShop,
  getStudioSuggest,
  getStudioTypes,
  latestShopOf,
  listShops,
  listZandoCustomTypes,
  listZandoItems,
  maConnexion,
  marquerZandoVendu,
  pinIsConfigured,
  publierConnexion,
  publishZandoItem,
  renewShop,
  retirerConnexion,
  sqlStamp,
  updateShop,
  updateZandoItem,
  verifyPin,
  zandoOwner,
  zandoStamp,
  type ConnexionFiche,
  type ConnexionVendeur,
  type MiniSite,
  type ShopSection,
  type StudioFormat,
  type ZandoItem,
} from '../lib/api';
import { compressImageFile, dataUrlBytes, formatBytes, pickImageFile } from '../lib/image';
import {
  decrireMesure,
  ecrirePrixLocal,
  lirePrixLocal,
  lirePosition,
  mesurerLien,
  type PositionAppareil,
  type MesureLien,
} from '../lib/connexion';
import {
  estVitrineBoutique,
  firstImageUrl,
  formatDureeRestante,
  formatInt,
  parseMediaUrls,
  relativeDay,
} from '../lib/format';
import { useDisplayAmount } from '../lib/currency';
import { identityPseudo, useIdentity } from '../lib/identity';
import {
  ingestItems,
  suggestPriceUnits,
  suggestText,
  suggestTitle,
  useLearningRevision,
} from '../lib/learning';

/**
 * Studio UQ : boutique, offre, contenu lecteur et connexion.
 *
 * - Boutique/entreprise : POST /api/shop/create (la plus récente fait foi).
 * - Offre               : création, modification (POST /api/zando/item/{id}/update)
 *                         et publication (POST /api/zando/item/{id}/publish).
 * - Contenu lecteur     : même table, lien externe + prix à la seconde.
 * - Connexion           : fiche publiée par POST /api/connexion/publish ; le
 *                         prix par seconde reste dans le stockage local.
 *
 * Les libellés (formats, catégories) viennent des routes réelles ; aucune
 * adresse de route n'est affichée à l'utilisateur.
 */
type StudioMode = 'home' | 'shop' | 'offer' | 'reader' | 'connect';

/** Action retenue en attente de la vérification du PIN. */
type GatedAction =
  | { kind: 'offer' }
  | { kind: 'reader' }
  | { kind: 'edit' }
  | { kind: 'shop' }
  | { kind: 'renew' }
  | { kind: 'publish'; item: ZandoItem }
  | { kind: 'connect' };

const READER_STEPS = ['Contenu', 'Tarif'];
const SHOP_STEPS = ['Identité', 'Présentation', 'Galerie', 'Contenu'];

/** Règles de la vente solo : 2 modifications, verrou après 12 h, vidéo 15 s. */
const SOLO_EDIT_MS = 12 * 3600 * 1000;
const SOLO_EDITS_MAX = 2;
const SOLO_VIDEO_MAX_S = 15;

const TITRES_PIN: Record<GatedAction['kind'], { titre: string; legende: string }> = {
  offer: { titre: 'Confirmer la publication', legende: 'Ton code PIN est demandé avant toute mise en ligne' },
  reader: { titre: 'Confirmer la publication', legende: 'Ton code PIN est demandé avant toute mise en ligne' },
  edit: { titre: 'Confirmer la publication', legende: 'Ton code PIN est demandé avant toute mise en ligne' },
  shop: { titre: 'Confirmer la vitrine', legende: 'Ton code PIN est demandé avant de publier la boutique' },
  renew: {
    titre: 'Ouvrir le robinet de présence',
    legende: 'Le PIN autorise le prélèvement continu : rien n’est débité à ce geste',
  },
  publish: { titre: 'Confirmer la publication', legende: 'Ton code PIN est demandé avant toute mise en ligne' },
  connect: {
    titre: 'Confirmer la fiche de connexion',
    legende: 'Ton PIN confirme la mise en vente ; ton prix par seconde ne quitte pas l’appareil',
  },
};

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

/**
 * Tranches suggérées selon l'activité déclarée. Elles ne sont que des
 * point de départ : le vendeur garde la main sur chaque titre et peut en
 * ajouter ou supprimer à volonté.
 */
const SUGGESTIONS_SECTIONS: Array<{ mot: string; sections: Array<{ titre: string; type: string }> }> = [
  {
    mot: 'menuis',
    sections: [
      { titre: 'Nos réalisations sur mesure', type: 'gallerie' },
      { titre: 'Commander un meuble', type: 'contact' },
      { titre: 'Atelier et délais', type: 'texte' },
    ],
  },
  {
    mot: 'smartphone',
    sections: [
      { titre: 'Téléphones disponibles', type: 'produit' },
      { titre: 'Reprise et réparation', type: 'service' },
      { titre: 'Garantie et paiement', type: 'annonce' },
    ],
  },
  {
    mot: 'église',
    sections: [
      { titre: 'Cultes et horaires', type: 'horaire' },
      { titre: 'Panneaux et annonces', type: 'panneau' },
      { titre: 'Nous rejoindre', type: 'contact' },
    ],
  },
  {
    mot: 'école',
    sections: [
      { titre: 'Inscriptions ouvertes', type: 'annonce' },
      { titre: 'Cycle et horaires', type: 'horaire' },
      { titre: 'Nous joindre', type: 'contact' },
    ],
  },
  {
    mot: 'agence',
    sections: [
      { titre: 'Nos services', type: 'service' },
      { titre: 'Références clients', type: 'gallerie' },
      { titre: 'Prendre rendez-vous', type: 'contact' },
    ],
  },
  {
    mot: 'aéroport',
    sections: [
      { titre: 'Départs et arrivées', type: 'annonce' },
      { titre: 'Salons et services', type: 'service' },
      { titre: 'Accès et horaires', type: 'horaire' },
    ],
  },
  {
    mot: 'restaurant',
    sections: [
      { titre: 'Carte du jour', type: 'produit' },
      { titre: 'Réservations', type: 'contact' },
      { titre: 'Horaires d’ouverture', type: 'horaire' },
    ],
  },
];

const DEFAULT_SECTIONS = [
  { titre: 'Ce que nous proposons', type: 'service' },
  { titre: 'Annonce du moment', type: 'annonce' },
  { titre: 'Nous contacter', type: 'contact' },
];

const sectionsSuggernees = (activite: string) => {
  const cle = activite.trim().toLowerCase();
  const trouve = SUGGESTIONS_SECTIONS.find((entry) => cle.includes(entry.mot));
  return trouve ? trouve.sections : DEFAULT_SECTIONS;
};

/** Types de tranche proposés au vendeur ; le backend n'en impose aucun. */
const TYPES_SECTION = ['texte', 'annonce', 'panneau', 'produit', 'service', 'horaire', 'contact', 'gallerie'];

/** Formats du backend -> icônes SVG du Studio. */
const FORMAT_ICONS: Record<string, IconName> = {
  text: 'file',
  image: 'image',
  video: 'video',
  audio: 'music',
  document: 'file',
};

const formatIcon = (id: string): IconName => FORMAT_ICONS[id] || 'sparkles';

const initials = (label: string): string => label.trim().slice(0, 2).toUpperCase();

export function StudioScreen({
  onOpenItem,
  onBack,
  modeInitial = 'home',
  onOpenBoutiqueSysteme,
}: {
  onOpenItem: (item: ZandoItem) => void;
  onBack?: () => void;
  /** Écran ouvert à l'entrée : la boutique système y renvoie sur « connect ». */
  modeInitial?: StudioMode;
  /** La fiche publiée renvoie à la boutique système pour voir les voisins. */
  onOpenBoutiqueSysteme?: () => void;
}) {
  const { uq, toast } = useSession();
  const help = useHelp();
  const feed = useAsync(() => listZandoItems(), []);
  const formats = useAsync(() => getStudioTypes(), []);
  const suggest = useAsync(() => getStudioSuggest(), []);
  const categories = useAsync(() => listZandoCustomTypes(), []);
  const shops = useAsync(() => listShops(), []);
  const pin = useAsync(() => getPinStatus(uq), [uq], { enabled: Boolean(uq) });
  /** Les prix se saisissent et s'affichent en devise ; le BORB n'est qu'une garantie. */
  const money = useDisplayAmount();
  const identity = useIdentity(uq);
  const selfPseudo = identityPseudo(uq, identity);

  const [mode, setMode] = useState<StudioMode>(modeInitial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [menuItem, setMenuItem] = useState<ZandoItem | null>(null);
  const [miniSiteOpen, setMiniSiteOpen] = useState(false);

  // Vérification du PIN avant toute mise en ligne (offre, contenu, boutique, connexion).
  const [pinOpen, setPinOpen] = useState(false);
  const [gated, setGated] = useState<GatedAction | null>(null);

  // Champs communs aux publications Zando ; editingItem porte l'offre en cours de modification.
  const [editingItem, setEditingItem] = useState<ZandoItem | null>(null);
  const [format, setFormat] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState('');
  /** Vente solo : photo importée ou vidéo (lien) de 15 s maximum. */
  const [mediaKind, setMediaKind] = useState<'photo' | 'video'>('photo');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoSeconds, setVideoSeconds] = useState<number | null>(null);
  const [videoError, setVideoError] = useState('');
  const [link, setLink] = useState('');
  const [cover, setCover] = useState('');
  const [publishNow, setPublishNow] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  /** Médias déjà présents sur l'offre modifiée et absents du formulaire : conservés tels quels. */
  const [keptMedia, setKeptMedia] = useState<string[]>([]);

  // Boutique / entreprise.
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  /** Photo de couverture de la vitrine et URL de la vidéo de présentation. */
  const [shopPhoto, setShopPhoto] = useState('');
  const [shopVideo, setShopVideo] = useState('');
  /** Galerie du mini-site : GALERIE_MAX photos au plus, dans l'ordre choisi. */
  const [shopGallery, setShopGallery] = useState<string[]>([]);
  const [shopSections, setShopSections] = useState<ShopSection[]>([]);
  const [shopStep, setShopStep] = useState(0);
  const [shopJours, setShopJours] = useState(1);
  /** Mini-site édité (pages, médias, boutons) : projection héritée persistée via `site`. */
  const [shopSite, setShopSite] = useState<MiniSite | null>(null);
  /** Studio de vitrine (22 panneaux) : modèle complet persisté via `vitrine`. */
  const [vitrineSite, setVitrineSite] = useState<MiniSiteVitrine | null>(null);
  const [vitrineOpen, setVitrineOpen] = useState(false);

  // Vente de connexion : la fiche part au serveur, le prix reste ici.
  const [ficheNom, setFicheNom] = useState('');
  const [reseau, setReseau] = useState<'starlink' | 'mobile'>('mobile');
  const [photoFiche, setPhotoFiche] = useState('');
  const [prixSeconde, setPrixSeconde] = useState(() => {
    const lokal = lirePrixLocal(uq);
    return lokal === null ? '' : String(lokal);
  });
  const [position, setPosition] = useState<PositionAppareil | null>(null);
  const [mesure, setMesure] = useState<MesureLien | null>(null);
  const [enMesure, setEnMesure] = useState(false);
  const [ficheServeur, setFicheServeur] = useState<ConnexionFiche | null>(null);

  const maFiche = useAsync(() => maConnexion(), [], { enabled: mode === 'connect' });
  const region = useAsync(
    () => connexionsProches(position ? { latitude: position.latitude, longitude: position.longitude } : undefined),
    [position],
    { enabled: mode === 'connect' },
  );

  /**
   * La fiche déjà publiée se recharge dans le formulaire : personne ne retape
   * son nom ni ne rechoisit sa photo pour changer un mot. La position du
   * dernier règlement sert de point de départ au classement, le temps que le
   * GPS en donne une nouvelle.
   */
  useEffect(() => {
    const annonce = maFiche.data?.annonce;
    if (!annonce) return;
    setFicheServeur(annonce);
    setFicheNom(annonce.nom || '');
    setReseau(annonce.reseau === 'starlink' ? 'starlink' : 'mobile');
    setPhotoFiche(annonce.photo || '');
    if (Number.isFinite(annonce.latitude) && Number.isFinite(annonce.longitude)) {
      setPosition((actuelle) =>
        actuelle
          ? actuelle
          : {
              latitude: annonce.latitude,
              longitude: annonce.longitude,
              precision_m: 0,
              captee_a: annonce.maj_a || annonce.mesuree_a || 0,
            },
      );
    }
    // Seul le chargement de la fiche commande cette resaisie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maFiche.data]);

  const formatOptions = formats.data?.types || [];
  const suggestions = suggest.data?.suggestions || [];
  /** La vitrine n'est pas une publication modifiable : elle a son propre atelier. */
  const myItems = useMemo(
    () =>
      (feed.data?.items || []).filter(
        (item) => zandoOwner(item).toUpperCase() === uq.toUpperCase() && !estVitrineBoutique(item),
      ),
    [feed.data, uq],
  );

  /** Boutique courante : la fiche la plus récente du vendeur. */
  const myShop = useMemo(() => latestShopOf(shops.data || [], uq), [shops.data, uq]);

  /** Présence réelle de la vitrine : échéance et frais lus sur `/api/shop/{id}`. */
  const etatBoutique = useAsync(
    () => (myShop ? getShop(myShop.id) : Promise.resolve(null)),
    [myShop?.id],
    { enabled: Boolean(myShop) },
  );
  const fraisBoutique = etatBoutique.data?.frais;
  const secondesBoutique = etatBoutique.data?.secondes_restantes ?? 0;
  const boutiqueEnLigne = etatBoutique.data?.en_ligne ?? Boolean(myShop?.open);

  /** Catégories réelles : types créés par les utilisateurs + catégories du marché. */
  const categoryOptions = useMemo(() => {
    const found = new Set<string>();
    (categories.data?.types || []).forEach((entry) => {
      if (entry.name) found.add(entry.name);
    });
    (feed.data?.items || []).forEach((item) => {
      if (item.category && item.category !== 'general') found.add(item.category);
    });
    return Array.from(found).sort((a, b) => a.localeCompare(b));
  }, [categories.data, feed.data]);

  const effectiveFormat = format || formatOptions[0]?.id || '';
  const effectiveCategory = category || categoryOptions[0] || '';
  const publishedCount = myItems.filter((item) => item.published !== false).length;
  const totalValue = myItems.reduce((sum, item) => sum + (Number(item.price_borb) || 0), 0);

  // Suggestions issues des offres déjà vues (apprentissage local, silencieux).
  const learningRevision = useLearningRevision();
  const titleProposal = useMemo(
    () => suggestTitle({ category: effectiveCategory, seed: title }),
    [effectiveCategory, title, learningRevision],
  );
  const textProposal = useMemo(
    () =>
      description.trim()
        ? null
        : suggestText({ category: effectiveCategory, title }),
    [effectiveCategory, title, description, learningRevision],
  );
  const priceProposalUnits = useMemo(
    () => suggestPriceUnits({ category: effectiveCategory }),
    [effectiveCategory, learningRevision],
  );
  const priceProposalText =
    priceProposalUnits !== null && money.perUnit > 0
      ? String(Math.round(priceProposalUnits * money.perUnit * 100) / 100)
      : null;

  /** Le PIN se découvre ici, pas au dernier moment : longueur lue sur le compte. */
  const pinConfigured = pinIsConfigured(pin.data);
  const pinLength = Math.min(
    Math.max(Number(pin.data?.pin_length) || PIN_MIN_LENGTH, PIN_MIN_LENGTH),
    PIN_MAX_LENGTH,
  );

  const numeric = (value: string) => Number(value.replace(',', '.'));

  /**
   * Le champ prix est en devise d'affichage ; la route attend des unités
   * internes. -1 signale un taux pas encore chargé (aucun prix en dur).
   */
  const priceUnits = (raw: string) => {
    const amount = numeric(raw);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    if (!(money.perUnit > 0)) return -1;
    return Math.round(amount / money.perUnit);
  };

  /** Unités internes -> montant saisi en devise (préremplissage de l'édition). */
  const unitsToPrice = (units: number | string | undefined | null): string => {
    const value = Number(units) || 0;
    if (value <= 0 || !(money.perUnit > 0)) return '';
    return String(Math.round(value * money.perUnit * 100) / 100);
  };

  /** Une vente solo reste modifiable 2 fois, et seulement pendant 12 h. */
  const soloEditable = (item: ZandoItem | null): boolean => {
    if (!item) return true;
    if (item.sold) return false;
    if ((item.edit_count || 0) >= SOLO_EDITS_MAX) return false;
    const depart = sqlStamp(item.published_at);
    if (depart && Date.now() - depart >= SOLO_EDIT_MS) return false;
    return true;
  };

  /** Libellé de la pastille d'une vente solo : vendu, brouillon, expiré ou temps restant. */
  const soloStatut = (item: ZandoItem): { label: string; tone: string } => {
    if (item.sold) return { label: 'vendu', tone: 'v2-badge--positive' };
    const fin = sqlStamp(item.expires_at);
    if (item.published === false) {
      if (!item.published_at) return { label: 'brouillon', tone: 'v2-badge--warning' };
      if (fin && fin <= Date.now()) return { label: 'expiré', tone: 'v2-badge--warning' };
      return { label: 'hors ligne', tone: 'v2-badge--warning' };
    }
    if (fin && fin <= Date.now()) return { label: 'expiré', tone: 'v2-badge--warning' };
    const reste = fin ? Math.max(0, Math.round((fin - Date.now()) / 1000)) : 0;
    return { label: reste ? `48 h · ${formatDureeRestante(reste)}` : 'en ligne', tone: 'v2-badge--positive' };
  };

  /** Vérifie la durée d'une vidéo distante sans la télécharger en entier. */
  const verifierVideo = (url: string) => {
    setVideoError('');
    setVideoSeconds(null);
    const propre = url.trim();
    if (!propre) return;
    const sonde = document.createElement('video');
    sonde.preload = 'metadata';
    sonde.src = propre;
    sonde.onloadedmetadata = () => {
      const duree = sonde.duration;
      if (Number.isFinite(duree) && duree > 0) {
        setVideoSeconds(duree);
        if (duree > SOLO_VIDEO_MAX_S) {
          setVideoError(`La vidéo dure ${Math.ceil(duree)} s : ${SOLO_VIDEO_MAX_S} s maximum.`);
        }
      }
      sonde.remove();
    };
    sonde.onerror = () => {
      setVideoError('Durée non vérifiée : le lien doit pointer vers une vidéo lisible.');
      sonde.remove();
    };
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormat('');
    setTitle('');
    setSubtitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setPhoto('');
    setMediaKind('photo');
    setVideoUrl('');
    setVideoSeconds(null);
    setVideoError('');
    setLink('');
    setCover('');
    setKeptMedia([]);
    setPublishNow(true);
    setStep(0);
  };

  const openMode = (next: StudioMode) => {
    resetForm();
    setMode(next);
  };

  const goHome = () => {
    resetForm();
    setMode('home');
  };

  /** Reprendre une publication existante dans le formulaire d'offre. */
  const startEdit = (item: ZandoItem) => {
    setMenuItem(null);
    const media = parseMediaUrls(item.media_urls);
    const video = media.find((entry) => /\.(mp4|webm|mov|m4v|m3u8)(\?|#|$)/i.test(entry));
    const visuel = firstImageUrl(media);
    setEditingItem(item);
    setMode('offer');
    setStep(0);
    setFormat(item.type || '');
    setTitle(item.title || '');
    setSubtitle(item.subtitle || '');
    setDescription(item.description || '');
    setCategory(item.category && item.category !== 'general' ? item.category : '');
    setPhoto(video ? '' : visuel);
    setMediaKind(video ? 'video' : 'photo');
    setVideoUrl(video || '');
    setVideoSeconds(null);
    setVideoError('');
    setKeptMedia(media.filter((entry) => entry !== visuel && entry !== video));
    setPrice(unitsToPrice(item.price_borb));
    setPublishNow(item.published !== false);
  };

  const openShop = () => {
    resetForm();
    setShopStep(0);
    setShopName(myShop?.name || '');
    setShopDescription(myShop?.description || '');
    setShopCategory(myShop?.category && myShop.category !== 'general' ? myShop.category : '');
    setShopPhoto(myShop?.presentation_photo || '');
    setShopVideo(myShop?.presentation_video || '');
    setShopGallery((myShop?.gallery || []).filter((url) => Boolean(url)).slice(0, GALERIE_MAX));
    setShopSections(
      (myShop?.sections || [])
        .filter((section) => Boolean(section?.titre))
        .map((section, index) => ({
          id: section.id || `sec_${index + 1}`,
          titre: section.titre,
          type: section.type || 'texte',
          contenu: section.contenu || '',
          media: section.media || '',
        })),
    );
    setShopSite(myShop?.site || null);
    setVitrineSite(
      myShop?.vitrine
        ? normaliserVitrine(myShop.vitrine, myShop.name || shopName.trim() || 'Ma boutique')
        : null,
    );
    setMode('shop');
  };

  /**
   * Ouvre le studio de vitrine (22 panneaux) sur la boutique réelle.
   *
   * Ordre de lecture : le modèle publié (`vitrine`) fait foi ; sinon on
   * convertit l'ancien mini-site (`site.pages`) ; sinon on part du formulaire
   * et de la galerie. L'éditeur ne reçoit jamais un objet troué.
   */
  const ouvrirVitrine = () => {
    if (!vitrineSite) {
      const nom = shopName.trim() || myShop?.name || 'Ma boutique';
      const categorie = shopCategory || myShop?.category || '';
      let base: MiniSiteVitrine | null = null;

      if (myShop?.vitrine) {
        base = normaliserVitrine(myShop.vitrine, nom);
      } else {
        base = vitrineDepuisApi(myShop?.site, myShop);
      }

      if (!base) {
        base = vitrineDepuisBrouillon({
          nom,
          description: shopDescription.trim() || myShop?.description || '',
          categorie,
          photo: shopPhoto || myShop?.presentation_photo || '',
          video: shopVideo || myShop?.presentation_video || '',
          galerie: shopGallery.length ? shopGallery : myShop?.gallery || [],
          sections: shopSections.length ? shopSections : myShop?.sections || [],
        });
        base.cat = categorie || base.cat;
        base.couleur = categorie ? couleurFamille(categorie) : base.couleur;
      }

      setVitrineSite(base);
    }
    setVitrineOpen(true);
  };

  const setShopSection = (index: number, patch: Partial<ShopSection>) => {
    setShopSections((current) => current.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  };

  const ajouterSection = () => {
    setShopSections((current) => {
      if (current.length >= 20) return current;
      return [...current, { id: `sec_${current.length + 1}`, titre: '', type: 'texte', contenu: '', media: '' }];
    });
  };

  const retirerSection = (index: number) => {
    setShopSections((current) => current.filter((_, i) => i !== index));
  };

  /** Les suggestions suivent l'activité : elles ne remplacent jamais ce que le vendeur a écrit. */
  const appliquerSuggestions = () => {
    const manquantes = sectionsSuggernees(shopCategory).filter(
      (suggestion) =>
        !shopSections.some((section) => section.titre.trim().toLowerCase() === suggestion.titre.toLowerCase()),
    );
    if (manquantes.length === 0) {
      toast('Tes tranches couvrent déjà les suggestions.', 'success');
      return;
    }
    setShopSections((current) => [
      ...current,
      ...manquantes.map((suggestion, index) => ({
        id: `sec_${current.length + index + 1}`,
        titre: suggestion.titre,
        type: suggestion.type,
        contenu: '',
        media: '',
      })),
    ]);
    setShopStep(3);
  };

  const createCategory = async () => {
    const name = newCategory.trim();
    if (name.length < 2) {
      toast('Nom de catégorie trop court', 'error');
      return;
    }
    setBusy(true);
    try {
      const created = await createZandoCustomType({ owner_id: uq, name });
      if (created?.status !== 'success') throw new Error(created?.message || 'Création refusée');
      setCategory(name);
      if (mode === 'shop') setShopCategory(name);
      setNewCategory('');
      categories.reload();
      toast('Catégorie créée', 'success');
    } catch (error) {
      toast(describeError(error, 'Catégorie non créée.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Import d'une photo locale : le backend n'a pas de route d'upload, la
   * photo voyage donc en data URI dans `media_urls` (ou la galerie de la
   * boutique). Compression obligatoire pour rester sous le plafond mesuré
   * côté serveur.
   */
  const importMedia = async (
    target: 'offer' | 'reader' | 'vitrine' | 'galerie' | 'section',
    sectionIndex?: number,
  ) => {
    const file = await pickImageFile();
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressImageFile(file, {
        maxSide: 1280,
        maxChars: MEDIA_MAX_CHARS,
        type: 'image/webp',
        quality: 0.85,
      });
      if (target === 'offer') setPhoto(compressed.dataUrl);
      else if (target === 'reader') setCover(compressed.dataUrl);
      else if (target === 'vitrine') setShopPhoto(compressed.dataUrl);
      else if (target === 'galerie') {
        if (shopGallery.length >= GALERIE_MAX) {
          toast(`La galerie s'arrête à ${GALERIE_MAX} photos.`, 'error');
          return;
        }
        setShopGallery((current) => [...current, compressed.dataUrl]);
        if (!shopPhoto) setShopPhoto(compressed.dataUrl);
      } else {
        setShopSections((current) =>
          current.map((section, index) =>
            index === sectionIndex ? { ...section, media: compressed.dataUrl } : section,
          ),
        );
      }
      toast(
        `Photo prête · ${compressed.width}×${compressed.height} · ${formatBytes(
          dataUrlBytes(compressed.dataUrl),
        )}`,
        'success',
      );
    } catch (error) {
      toast(describeError(error, 'Import impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Toute mise en ligne (création, modification, boutique) est précédée du PIN. */
  const requirePin = (action: GatedAction) => {
    if (!pinConfigured) {
      toast('Configure un code PIN dans la sécurité du profil avant de publier', 'error');
      return;
    }
    setGated(action);
    setPinOpen(true);
  };

  const confirmPin = async (code: string): Promise<string | void> => {
    const check = await verifyPin(uq, code);
    if (check?.valid === false) return 'Code PIN incorrect';
    if (check?.pin_configured === false) return 'Aucun code PIN configuré sur ce compte';
    const action = gated;
    setPinOpen(false);
    setGated(null);
    if (action) await runGated(action, code);
  };

  const runGated = async (action: GatedAction, code: string) => {
    if (action.kind === 'offer' || action.kind === 'reader') {
      await createItem(action.kind, true);
      return;
    }
    if (action.kind === 'edit') {
      await saveEdition();
      return;
    }
    if (action.kind === 'shop') {
      await writeShop();
      return;
    }
    if (action.kind === 'renew') {
      await renewPresence(code);
      return;
    }
    if (action.kind === 'publish') {
      await publishItem(action.item);
      return;
    }
    await createConnection();
  };

  /** Publication d'une offre ou d'un contenu lecteur : même table, champs différents. */
  const submitZando = async (kind: 'offer' | 'reader') => {
    const priceValue = priceUnits(price);
    if (title.trim().length < 3) {
      toast('Le titre est trop court', 'error');
      return;
    }
    if (priceValue < 0) {
      toast('Taux indisponible, réessaie dans un instant.', 'error');
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      toast(kind === 'reader' ? 'Indique un prix par seconde' : 'Indique un prix', 'error');
      return;
    }
    if (kind === 'reader' && !isHttpUrl(link)) {
      toast('Le lien du contenu doit commencer par http(s)://', 'error');
      return;
    }
    if (kind === 'offer') {
      if (mediaKind === 'video') {
        if (!isHttpUrl(videoUrl)) {
          toast('Le lien de la vidéo doit commencer par http(s)://', 'error');
          return;
        }
        if (videoSeconds !== null && videoSeconds > SOLO_VIDEO_MAX_S) {
          toast(`La vidéo doit durer ${SOLO_VIDEO_MAX_S} s maximum.`, 'error');
          return;
        }
      } else if (!photo.trim()) {
        toast('Ajoute une photo ou une vidéo de 15 s maximum.', 'error');
        return;
      }
      if (!editingItem && !category.trim()) {
        toast('Choisis la famille de ton objet.', 'error');
        return;
      }
    }
    if (editingItem) {
      if (!soloEditable(editingItem)) {
        toast('Cet objet n’est plus modifiable : 2 modifications maximum, dans les 12 h.', 'error');
        return;
      }
      const enLigne = editingItem.published !== false;
      if (enLigne || publishNow) {
        requirePin({ kind: 'edit' });
      } else {
        await saveEdition();
      }
      return;
    }
    // Un brouillon ne publie rien : seul le passage en ligne demande le PIN.
    if (!publishNow) {
      await createItem(kind, false);
      return;
    }
    requirePin({ kind });
  };

  /** Écriture réelle d'un nouvel élément Zando (puis publication si demandée). */
  const createItem = async (kind: 'offer' | 'reader', publishFlag: boolean) => {
    const priceValue = Math.max(0, priceUnits(price));
    setBusy(true);
    try {
      const media = kind === 'reader'
        ? JSON.stringify([link.trim(), ...(cover.trim() ? [cover.trim()] : [])])
        : mediaKind === 'video'
          ? videoUrl.trim()
            ? JSON.stringify([videoUrl.trim()])
            : '[]'
          : photo.trim()
            ? JSON.stringify([photo.trim()])
            : '[]';
      const chosenCategory = kind === 'offer' ? category.trim() : effectiveCategory;
      const created = await createZandoItem({
        type: kind === 'offer' ? (mediaKind === 'video' ? 'video' : 'photo') : effectiveFormat || 'text',
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        price_borb: priceValue,
        price_usd: 0,
        media_urls: media,
        ...(chosenCategory ? { category: chosenCategory } : {}),
        commission_enabled: false,
        commission_rate: 0,
      });
      if (!created?.item_id) throw new Error(created?.message || 'Le serveur n’a pas confirmé la création.');
      if (publishFlag) await publishZandoItem(created.item_id);
      if (publishFlag) {
        ingestItems([
          {
            title: title.trim(),
            description: description.trim(),
            category: chosenCategory,
            price: priceValue,
            engagement: 0,
          },
        ]);
      }
      toast(publishFlag ? 'Publication en ligne' : 'Brouillon enregistré', 'success');
      feed.reload();
      goHome();
    } catch (error) {
      toast(describeError(error, 'Publication impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Sauvegarde des modifications d'une publication existante (route de mise à jour réelle). */
  const saveEdition = async () => {
    if (!editingItem) return;
    const priceValue = Math.max(0, priceUnits(price));
    const wasOnline = editingItem.published !== false;
    setBusy(true);
    try {
      const media = JSON.stringify(
        [
          mediaKind === 'video' ? videoUrl.trim() : photo.trim(),
          ...keptMedia,
        ].filter((entry) => entry && (!link.trim() || entry !== link.trim())),
      );
      await updateZandoItem(editingItem.id, {
        // Le titre, le sous-titre et la catégorie restent ceux d'origine :
        // seuls le prix, la description et le média changent.
        title: editingItem.title,
        subtitle: editingItem.subtitle || '',
        description: description.trim(),
        type: editingItem.type || effectiveFormat || 'text',
        price_borb: priceValue,
        media_urls: media,
        category: editingItem.category || 'general',
      });
      if (!wasOnline && publishNow) await publishZandoItem(editingItem.id);
      if (!wasOnline && publishNow) {
        ingestItems([
          {
            title: title.trim(),
            description: description.trim(),
            category: effectiveCategory,
            price: priceValue,
            engagement: 0,
          },
        ]);
      }
      toast(wasOnline ? 'Publication mise à jour' : publishNow ? 'Publication en ligne' : 'Brouillon enregistré', 'success');
      feed.reload();
      goHome();
    } catch (error) {
      toast(describeError(error, 'Modification impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Corps de la boutique : identité, présentation, galerie et tranches du mini-site. */
  const shopPayload = () => ({
    name: shopName.trim(),
    description: shopDescription.trim(),
    ...(shopCategory ? { category: shopCategory } : {}),
    presentation: {
      ...(shopPhoto ? { photo: shopPhoto } : {}),
      ...(shopVideo.trim() ? { video: shopVideo.trim() } : {}),
    },
    gallery: shopGallery.slice(0, GALERIE_MAX),
    sections: shopSections
      .filter((section) => section.titre.trim().length >= 2)
      .map((section, index) => ({
        id: section.id || `sec_${index + 1}`,
        titre: section.titre.trim(),
        type: section.type || 'texte',
        contenu: section.contenu || '',
        media: section.media || '',
      })),
    ...(shopSite ? { site: shopSite } : {}),
    ...(vitrineSite ? { vitrine: vitrineSite } : {}),
  });

  /** Écriture de la boutique : création ou modification de la fiche courante. */
  const writeShop = async () => {
    setBusy(true);
    try {
      const answer = myShop
        ? await updateShop(myShop.id, shopPayload())
        : await createShop({ owner: uq, ...shopPayload() });
      if (answer?.status !== 'success') throw new Error(answer?.message || 'Enregistrement refusé');
      shops.reload();
      etatBoutique.reload();
      toast(myShop ? 'Boutique mise à jour' : 'Boutique créée', 'success');
      goHome();
    } catch (error) {
      toast(describeError(error, 'Boutique non enregistrée.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Prolonger la présence : le PIN autorise le robinet, le tick prélève. */
  const renewPresence = async (code: string) => {
    if (!myShop) return;
    setBusy(true);
    try {
      const answer = await renewShop(myShop.id, { pin: code, uq_number: uq, jours: shopJours });
      if (answer?.status !== 'success') throw new Error(answer?.message || 'Prolongation refusée');
      toast(`Présence prolongée de ${shopJours} ${shopJours > 1 ? 'jours' : 'jour'} · robinet ouvert.`, 'success');
      shops.reload();
      etatBoutique.reload();
      feed.reload();
    } catch (error) {
      toast(describeError(error, 'Prolongation impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitShop = () => {
    if (shopName.trim().length < 3) {
      setShopStep(0);
      toast('Le nom de la boutique est trop court', 'error');
      return;
    }
    if (shopVideo.trim() && !isHttpUrl(shopVideo)) {
      setShopStep(1);
      toast('Le lien de la vidéo doit commencer par http(s)://', 'error');
      return;
    }
    if (shopSections.some((section) => section.titre.trim().length > 0 && section.titre.trim().length < 2)) {
      setShopStep(3);
      toast('Chaque tranche a besoin d’un titre.', 'error');
      return;
    }
    requirePin({ kind: 'shop' });
  };

  /**
   * Le studio plein écran renvoie la vitrine complète : on la garde telle
   * quelle (`vitrine`) et on en dérive l'ancienne projection `site`, puis on
   * publie sous PIN. La fiche acheteur lit `vitrine` en priorité.
   */
  const saveSiteFromEditor = (site: MiniSiteVitrine) => {
    setVitrineSite(site);
    setShopSite(versApiSite(site));
    setVitrineOpen(false);
    if (shopName.trim().length < 3) {
      setShopStep(0);
      toast('Nomme ta boutique avant de publier le mini-site.', 'error');
      return;
    }
    requirePin({ kind: 'shop' });
  };

  /**
   * Les deux gestes appareils avant de publier : où je suis, et ce que vaut
   * vraiment mon lien. Sans l'un des deux, la fiche serait une promesse vide.
   */
  const equiperAppareil = async () => {
    setEnMesure(true);
    try {
      const [fixe, mesureLien] = await Promise.all([lirePosition(), mesurerLien()]);
      setPosition(fixe);
      setMesure(mesureLien);
      toast(`Position à ±${fixe.precision_m} m · ${decrireMesure(mesureLien)}`, 'success');
    } catch (error) {
      toast(describeError(error, 'Position et mesure indisponibles sur cet appareil.'), 'error');
    } finally {
      setEnMesure(false);
    }
  };

  const choisirPhotoFiche = async () => {
    const fichier = await pickImageFile();
    if (!fichier) return;
    try {
      const compressee = await compressImageFile(fichier, {
        maxSide: 720,
        maxChars: MEDIA_MAX_CHARS,
        quality: 0.8,
      });
      setPhotoFiche(compressee.dataUrl);
      toast(`Photo de ${formatBytes(compressee.chars)}`, 'success');
    } catch (error) {
      toast(describeError(error, 'Photo illisible.'), 'error');
    }
  };

  /**
   * Publier une fiche. Le prix par seconde est écrit dans le stockage local
   * avant l'envoi - il ne fait pas partie du payload, et le serveur refuserait
   * une requête qui tente d'en porter un.
   */
  const submitConnection = () => {
    if (ficheNom.trim().length < 2) {
      toast('Le nom de ta fiche est trop court', 'error');
      return;
    }
    if (!position || !mesure) {
      toast('Capte ta position et mesure ton lien avant de publier.', 'error');
      return;
    }
    const tarif = Math.round(numeric(prixSeconde));
    ecrirePrixLocal(uq, Number.isFinite(tarif) && tarif > 0 ? tarif : null);
    requirePin({ kind: 'connect' });
  };

  const createConnection = async () => {
    if (!position || !mesure) {
      toast('Capte ta position et mesure ton lien avant de publier.', 'error');
      return;
    }
    setBusy(true);
    try {
      const reponse = await publierConnexion({
        nom: ficheNom.trim(),
        reseau,
        photo: photoFiche,
        latitude: position.latitude,
        longitude: position.longitude,
        signal: mesure.signal,
        debit_mbps: mesure.debit_mbps,
        latence_ms: mesure.latence_ms,
      });
      if (reponse?.status !== 'success') throw new Error(reponse?.message || 'Publication refusée');
      setFicheServeur(reponse.annonce ?? null);
      maFiche.reload();
      region.reload();
      toast('Fiche publiée : les appareils de ta région te voient.', 'success');
    } catch (error) {
      toast(describeError(error, 'Publication impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Retirer la fiche du flux. Pas de PIN : couper un flux ne se paie pas. */
  const retirerFiche = async () => {
    setBusy(true);
    try {
      const reponse = await retirerConnexion();
      if (reponse?.status !== 'success') throw new Error(reponse?.message || 'Retrait refusé');
      setFicheServeur(reponse.annonce ?? null);
      maFiche.reload();
      region.reload();
      toast('Fiche retirée : elle reste dans ton compte.', 'success');
    } catch (error) {
      toast(describeError(error, 'Retrait impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Passage en ligne d'un brouillon : demande le PIN. */
  const requestPublish = (item: ZandoItem) => {
    requirePin({ kind: 'publish', item });
  };

  const publishItem = async (item: ZandoItem) => {
    try {
      await publishZandoItem(item.id);
      toast('Publication en ligne', 'success');
      feed.reload();
    } catch (error) {
      toast(describeError(error, 'Publication impossible.'), 'error');
    } finally {
      setMenuItem(null);
    }
  };

  /** Confirme la vente : l'objet quitte le flux et rejoint l'historique privé. */
  const vendre = async (item: ZandoItem) => {
    try {
      await marquerZandoVendu(item.id);
      toast('Objet vendu · retiré du flux', 'success');
      feed.reload();
    } catch (error) {
      toast(describeError(error, 'Impossible de marquer cet objet vendu.'), 'error');
    } finally {
      setMenuItem(null);
    }
  };

  const remove = async (item: ZandoItem) => {
    try {
      await deleteZandoItem(item.id);
      toast('Publication supprimée', 'success');
      feed.reload();
    } catch (error) {
      toast(describeError(error, 'Suppression impossible.'), 'error');
    } finally {
      setMenuItem(null);
    }
  };

  const headerTitle =
    mode === 'shop'
      ? myShop ? 'Modifier ma boutique' : 'Créer ma boutique'
      : mode === 'offer'
        ? editingItem ? 'Modifier la publication' : 'Nouvelle offre'
        : mode === 'reader'
          ? 'Contenu lecteur'
          : mode === 'connect'
            ? 'Vendre ma connexion'
            : 'Studio UQ';
  const headerSubtitle =
    mode === 'shop'
      ? 'Ta vitrine sur le marché Zando'
      : mode === 'offer'
        ? editingItem ? 'Les acheteurs verront la version mise à jour' : 'Produit ou service du marché Zando'
        : mode === 'reader'
          ? 'Lien externe facturé à la seconde'
          : mode === 'connect'
            ? 'Partager sa connexion internet'
            : 'Boutique, offres, contenus et connexion';

  const editingOnline = Boolean(editingItem && editingItem.published !== false);

  return (
    <>
      <ScreenHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        onBack={mode === 'home' ? onBack : goHome}
        right={<>
          <IconButton name="info" label="Guide Zando" onClick={() => help.openHelp('zando')} />
          <IconButton
            name="refresh"
            label="Actualiser"
            onClick={() => { feed.reload(); categories.reload(); shops.reload(); maFiche.reload(); region.reload(); }}
          />
        </>}
      />

      {mode === 'home' && (
        <div className="v2-pad">
          <div className="v2-studio-hero">
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Ton marché commence ici
            </div>
            <div style={{ fontSize: 12.5, marginTop: 3, color: 'rgba(255,255,255,0.78)' }}>
              Une vitrine, des offres, des clients.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <HeroStat label="Publications" value={formatInt(myItems.length)} />
              <HeroStat label="En ligne" value={formatInt(publishedCount)} />
              <HeroStat label="Valeur" value={money.format(totalValue)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <span className="v2-studio-pin-chip">
              <Icon name="lock" size={13} />
              {pinConfigured ? `Publication protégée · PIN ${pinLength} chiffres` : 'PIN à configurer dans Profil › Sécurité'}
            </span>
            {myShop ? (
              <span className="v2-studio-pin-chip">
                <Icon name="market" size={13} />
                {boutiqueEnLigne
                  ? `Boutique en ligne · ${formatDureeRestante(secondesBoutique)}`
                  : `Boutique hors ligne · ${formatDureeRestante(secondesBoutique)}`}
              </span>
            ) : null}
          </div>

          {myShop ? (
            <Card
              className="v2-studio-card"
              style={{ marginTop: 12, cursor: 'pointer' }}
              onClick={() => setMiniSiteOpen(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="v2-studio-art v2-studio-art--sm">
                  <Icon name="market" size={19} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="v2-h3" style={{ fontSize: 15 }}>{myShop.name}</div>
                  <div className="v2-muted" style={{ fontSize: 12 }}>
                    {[
                      myShop.category && myShop.category !== 'general' ? myShop.category : null,
                      `${(myShop.gallery || []).length}/${GALERIE_MAX} photos`,
                      boutiqueEnLigne
                        ? `en ligne · ${formatDureeRestante(secondesBoutique)}`
                        : `hors ligne · ${formatDureeRestante(secondesBoutique)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => openShop()}>
                  Modifier
                </Button>
              </div>
            </Card>
          ) : null}

          <div className="v2-section-title">Que veux-tu créer ?</div>
          <div className="v2-studio-actions">
            <button type="button" className="v2-studio-action" onClick={() => openShop()}>
              <span className="v2-studio-art v2-studio-art--sm">
                <StudioBoutiqueIcon size={26} />
              </span>
              <span className="v2-h3" style={{ fontSize: 14 }}>
                {myShop ? 'Modifier ma boutique' : 'Créer une boutique'}
              </span>
              <small>Une vitrine qui rassemble toutes tes offres.</small>
            </button>

            <button type="button" className="v2-studio-action" onClick={() => openMode('offer')}>
              <span className="v2-studio-art v2-studio-art--sm">
                <StudioOfferIcon size={26} />
              </span>
              <span className="v2-h3" style={{ fontSize: 14 }}>Vendre un produit</span>
              <small>Un objet ou un service, en quelques clics.</small>
            </button>

            <button type="button" className="v2-studio-action" onClick={() => openMode('reader')}>
              <span className="v2-studio-art v2-studio-art--sm">
                <StudioContentIcon size={26} />
              </span>
              <span className="v2-h3" style={{ fontSize: 14 }}>Publier un contenu</span>
              <small>Une vidéo, un son, un doc : facturé à la seconde.</small>
            </button>

            <button type="button" className="v2-studio-action" onClick={() => openMode('connect')}>
              <span className="v2-studio-art v2-studio-art--sm">
                <StudioConnectIcon size={26} />
              </span>
              <span className="v2-h3" style={{ fontSize: 14 }}>Vendre ma connexion</span>
              <small>Partage ton réseau au prix du Mo.</small>
            </button>

            {/* Entrée temporaire du nouveau studio (étapes 8 à 22) : l'ancien éditeur reste en place. */}
            <button type="button" className="v2-studio-action" onClick={ouvrirVitrine}>
              <span className="v2-studio-art v2-studio-art--sm">
                <StudioSparkIcon size={26} />
              </span>
              <span className="v2-h3" style={{ fontSize: 14 }}>Studio de vitrine</span>
              <small>Aperçu Flux, Explorer et mini-site, avec les 22 panneaux.</small>
            </button>
          </div>

          <div className="v2-section-title">Mes publications</div>
          {feed.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={48} radius={14} />
              <Skeleton height={48} radius={14} />
            </Card>
          ) : feed.error ? (
            <ErrorBlock message={feed.error} onRetry={feed.reload} />
          ) : myItems.length === 0 ? (
            <Card>
              <EmptyState
                icon="market"
                title="Rien de publié"
                description="Une photo, un titre, un prix : ta première offre est à trois clics."
                action={
                  <Button size="sm" icon="plus" onClick={() => openMode('offer')}>
                    Créer une offre
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <List plain>
                {myItems.map((item) => {
                  const media = parseMediaUrls(item.media_urls);
                  const statut = soloStatut(item);
                  return (
                    <Row
                      key={item.id}
                      avatar={{ label: initials(item.title || 'UQ'), src: firstImageUrl(media) || undefined }}
                      title={item.title || 'Sans titre'}
                      subtitle={`${money.format(item.price_borb)}${item.subtitle ? ` · ${item.subtitle}` : ''}${zandoStamp(item) ? ` · ${relativeDay(zandoStamp(item))}` : ''}`}
                      right={<span className={`v2-badge ${statut.tone}`}>{statut.label}</span>}
                      chevron
                      onClick={() => setMenuItem(item)}
                    />
                  );
                })}
              </List>
            </Card>
          )}

          {suggestions.length > 0 && (
            <>
              <div className="v2-section-title">Conseils</div>
              <div className="v2-stack">
                {suggestions.slice(0, 3).map((entry, index) => (
                  <Card key={index} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span className="v2-studio-art v2-studio-art--sm" aria-hidden="true">
                      <StudioSparkIcon size={24} />
                    </span>
                    <div>
                      <div className="v2-h3">{entry.title}</div>
                      <div className="v2-muted" style={{ fontSize: 12.5 }}>{entry.description}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div style={{ height: 8 }} />
        </div>
      )}

      {mode === 'shop' && (
        <div className="v2-pad">
          <div className="v2-stack">
            <BuyerPreview
              avatar={identity?.avatar_url}
              author={selfPseudo}
              name={shopName.trim() || 'Nom de ta boutique'}
              title={shopDescription.trim() || 'Décris ici ton activité : ce que tu vends, où, comment.'}
              category={shopCategory || undefined}
              image={shopPhoto || shopGallery[0] || undefined}
            />

            <Progress steps={SHOP_STEPS} current={shopStep} />

            {myShop ? (
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="v2-studio-art v2-studio-art--sm">
                    <Icon name={boutiqueEnLigne ? 'eye' : 'lock'} size={18} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="v2-h3" style={{ fontSize: 14.5 }}>
                      {boutiqueEnLigne
                        ? `Dans le flux · ${formatDureeRestante(secondesBoutique)}`
                        : `Hors du flux · ${formatDureeRestante(secondesBoutique)}`}
                    </div>
                    <div className="v2-muted" style={{ fontSize: 12 }}>
                      {fraisBoutique
                        ? `${money.formatPoints(fraisBoutique.frais_24h_points)} pour 24 h · ${fraisBoutique.pourcent} % du catalogue`
                        : 'Frais de présence en calcul'}
                    </div>
                    {fraisBoutique && fraisBoutique.par_seconde_points > 0 ? (
                      <div className="v2-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {`Robinet ${fraisBoutique.robinet_ouvert ? 'ouvert' : 'à ouvrir'} · ${money.formatPoints(
                          fraisBoutique.par_seconde_points * 3600,
                        )} par heure, en continu`}
                      </div>
                    ) : null}
                    {(myShop.regle_points ?? 0) > 0 ? (
                      <div className="v2-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {`Déjà réglé : ${money.formatPoints(myShop.regle_points ?? 0)}`}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {[1, 2, 3, 5, 7].map((bloc) => (
                    <button
                      key={bloc}
                      type="button"
                      className="v2-feed-pill"
                      data-active={shopJours === bloc}
                      onClick={() => setShopJours(bloc)}
                      style={
                        shopJours === bloc
                          ? { background: 'var(--v2-accent)', borderColor: 'transparent' }
                          : undefined
                      }
                    >
                      {bloc} {bloc > 1 ? 'j' : 'jour'}
                    </button>
                  ))}
                </div>
                <Button
                  block
                  variant="secondary"
                  icon="wallet"
                  loading={busy}
                  onClick={() => requirePin({ kind: 'renew' })}
                  style={{ marginTop: 10 }}
                >
                  Prolonger de {shopJours} {shopJours > 1 ? 'jours' : 'jour'}
                </Button>
              </Card>
            ) : null}

            {shopStep === 0 && (
              <>
                <Field label="Nom de la boutique" hint="Le titre que les acheteurs verront en haut de ta vitrine">
                  <Input
                    value={shopName}
                    onChange={(event) => setShopName(event.target.value)}
                    placeholder="Ex. Chez Destin"
                  />
                </Field>

                <Field label="Activité" hint="Choisis une catégorie du marché ou crée la tienne">
                  <CategoryPicker
                    options={categoryOptions}
                    value={shopCategory}
                    onChange={setShopCategory}
                    newCategory={newCategory}
                    setNewCategory={setNewCategory}
                    onCreate={() => void createCategory()}
                    busy={busy}
                  />
                </Field>

                <Field label="Description" hint="Présente ton activité en quelques phrases">
                  <Textarea
                    value={shopDescription}
                    onChange={(event) => setShopDescription(event.target.value)}
                    rows={4}
                    placeholder="Ex. Atelier de menuiserie, livraison en ville, paiement UQ."
                  />
                </Field>
              </>
            )}

            {shopStep === 1 && (
              <>
                <div className="v2-muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                  C'est ce que les acheteurs voient défiler dans Zando : une photo de ton activité, et si tu l'as
                  filmée, le lien d'une vidéo courte.
                </div>

                <Field label="Photo de présentation" hint="Une image porte ta vitrine dans le flux">
                  {shopPhoto ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img
                        src={shopPhoto}
                        alt=""
                        style={{
                          width: 96,
                          height: 68,
                          objectFit: 'cover',
                          borderRadius: 12,
                          border: '1px solid var(--v2-line)',
                        }}
                      />
                      <Button size="sm" variant="secondary" icon="image" onClick={() => void importMedia('vitrine')}>
                        Changer
                      </Button>
                      <IconButton name="trash" label="Retirer la photo" onClick={() => setShopPhoto('')} />
                    </div>
                  ) : (
                    <Button variant="secondary" icon="image" loading={busy} onClick={() => void importMedia('vitrine')}>
                      Choisir une photo
                    </Button>
                  )}
                </Field>

                <Field label="Vidéo de présentation" hint="Lien direct d'un fichier .mp4 ou .webm de moins de 30 secondes">
                  <Input
                    value={shopVideo}
                    onChange={(event) => setShopVideo(event.target.value)}
                    placeholder="https://…"
                    inputMode="url"
                  />
                </Field>
              </>
            )}

            {shopStep === 2 && (
              <>
                <div className="v2-row-between">
                  <div className="v2-section-title" style={{ margin: 0 }}>
                    Galerie du mini-site
                  </div>
                  <span className="v2-badge">
                    {shopGallery.length}/{GALERIE_MAX}
                  </span>
                </div>
                <div className="v2-muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                  Jusqu'à {GALERIE_MAX} photos pour explorer la boutique : l'intérieur, les rayons, les panneaux,
                  les réalisations.
                </div>
                {shopGallery.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {shopGallery.map((url, index) => (
                      <div
                        key={`${url.slice(-24)}-${index}`}
                        style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}
                      >
                        <img
                          src={url}
                          alt=""
                          style={{ display: 'block', width: '100%', height: 76, objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          aria-label={`Retirer la photo ${index + 1}`}
                          onClick={() => setShopGallery((current) => current.filter((_, i) => i !== index))}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 24,
                            height: 24,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 999,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(6,10,16,0.72)',
                            color: '#fff',
                          }}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button
                  block
                  variant="secondary"
                  icon="plus"
                  loading={busy}
                  disabled={shopGallery.length >= GALERIE_MAX}
                  onClick={() => void importMedia('galerie')}
                >
                  {shopGallery.length >= GALERIE_MAX ? `Galerie complète · ${GALERIE_MAX} photos` : 'Ajouter une photo'}
                </Button>
              </>
            )}

            {shopStep === 3 && (
              <>
                <div className="v2-row-between">
                  <div className="v2-section-title" style={{ margin: 0 }}>
                    Contenu du mini-site
                  </div>
                  <Button size="sm" variant="secondary" icon="sparkles" onClick={appliquerSuggestions}>
                    Suggérer
                  </Button>
                </div>
                <div className="v2-muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                  {shopSections.length === 0
                    ? 'Une école affiche ses horaires, une église ses panneaux, une agence ses services : ajoute les tranches que veulent explorer tes visiteurs.'
                    : 'Chaque tranche devient une carte dans ta boutique. Titre obligatoire, reste libre.'}
                </div>

                <Card
                  className="v2-studio-card"
                  style={{ cursor: 'pointer' }}
                  onClick={ouvrirVitrine}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="v2-studio-art v2-studio-art--sm">
                      <Icon name="video" size={19} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="v2-h3" style={{ fontSize: 15 }}>Mini-site interactif</div>
                      <div className="v2-muted" style={{ fontSize: 12 }}>
                        {vitrineSite?.medias?.length
                          ? `${vitrineSite.medias.length} média${vitrineSite.medias.length > 1 ? 's' : ''} · ${vitrineSite.items.length} élément${vitrineSite.items.length > 1 ? 's' : ''} · studio 22 panneaux`
                          : 'Studio 22 panneaux : photos, vidéos, éléments, blocs, livraison, liens et réseaux'}
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" icon="edit" onClick={ouvrirVitrine}>
                      {vitrineSite ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </Card>

                {shopSections.map((section, index) => (
                  <Card key={section.id || index}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Input
                        value={section.titre}
                        onChange={(event) => setShopSection(index, { titre: event.target.value })}
                        placeholder="Titre de la tranche"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <IconButton name="trash" label={`Retirer ${section.titre || 'cette tranche'}`} onClick={() => retirerSection(index)} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {TYPES_SECTION.map((type) => (
                        <button
                          key={type}
                          type="button"
                          className="v2-feed-pill"
                          data-active={section.type === type}
                          onClick={() => setShopSection(index, { type })}
                          style={
                            section.type === type
                              ? { background: 'var(--v2-accent)', borderColor: 'transparent' }
                              : undefined
                          }
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={section.contenu}
                      onChange={(event) => setShopSection(index, { contenu: event.target.value })}
                      rows={3}
                      placeholder="Le texte de cette tranche (facultatif)"
                      style={{ marginTop: 10 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      {section.media ? (
                        <img
                          src={section.media}
                          alt=""
                          style={{
                            width: 64,
                            height: 48,
                            objectFit: 'cover',
                            borderRadius: 10,
                            border: '1px solid var(--v2-line)',
                          }}
                        />
                      ) : null}
                      <Button size="sm" variant="secondary" icon="image" onClick={() => void importMedia('section', index)}>
                        {section.media ? "Changer l'image" : 'Joindre une image'}
                      </Button>
                      {section.media ? (
                        <IconButton
                          name="trash"
                          label="Retirer l'image"
                          onClick={() => setShopSection(index, { media: '' })}
                        />
                      ) : null}
                    </div>
                  </Card>
                ))}

                <Button
                  block
                  variant="outline"
                  icon="plus"
                  onClick={ajouterSection}
                  disabled={shopSections.length >= 20}
                >
                  Ajouter une tranche
                </Button>
              </>
            )}

            <div className="v2-muted" style={{ fontSize: 12 }}>
              {myShop
                ? 'Enregistrer modifie ta boutique actuelle : galerie, tranches et compteur restent dans ton compte.'
                : 'La vitrine se crée avec ta boutique : sept jours de présence, puis le robinet prélève 5 % du catalogue toutes les 24 h.'}
            </div>
          </div>

          <div className="v2-studio-foot">
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              onClick={() => (shopStep > 0 ? setShopStep(shopStep - 1) : goHome())}
            >
              {shopStep > 0 ? 'Retour' : 'Annuler'}
            </Button>
            {shopStep < SHOP_STEPS.length - 1 ? (
              <Button style={{ flex: 2 }} icon="forward" onClick={() => setShopStep(shopStep + 1)}>
                Suivant
              </Button>
            ) : (
              <Button style={{ flex: 2 }} icon="check" loading={busy} onClick={submitShop}>
                {myShop ? 'Mettre à jour' : 'Créer ma boutique'}
              </Button>
            )}
          </div>
        </div>
      )}

      {mode === 'offer' && (
        <div className="v2-pad">
          <Card>
            <div className="v2-stack">
              <div className="v2-row-between">
                <div className="v2-h3">
                  {editingItem ? (editingOnline ? 'Objet en ligne' : 'Brouillon') : 'Vendre un objet'}
                </div>
                <span className="v2-badge v2-badge--accent">
                  {editingItem && soloStatut(editingItem).label !== 'en ligne'
                    ? soloStatut(editingItem).label
                    : '48 h'}
                </span>
              </div>

              <BuyerPreview
                avatar={identity?.avatar_url}
                author={selfPseudo}
                name={identity?.name || title || 'Titre de ton objet'}
                title={subtitle.trim() || description.trim() || 'Un objet simple, un prix clair.'}
                priceText={price ? `${price} ${money.currency}` : undefined}
                category={category || undefined}
                image={mediaKind === 'photo' ? photo || undefined : undefined}
              />

              <div className="v2-muted" style={{ fontSize: 12.5 }}>
                Une photo ou une vidéo de 15 s maximum. L’objet reste en ligne 48 h, puis sort du flux :
                tu peux le republier quand tu veux.
              </div>

              {editingItem ? (
                <div className="v2-badge v2-badge--warning" style={{ alignSelf: 'flex-start' }}>
                  {editingItem.sold
                    ? 'Vendu · historique privé'
                    : soloEditable(editingItem)
                      ? `Modifiable · ${Math.max(0, SOLO_EDITS_MAX - (editingItem.edit_count || 0))} modification(s) restante(s)`
                      : 'Verrouillé · 2 modifications ou 12 h atteintes'}
                </div>
              ) : null}

              <Field label="Média" hint="Une photo importée ou un lien vidéo de 15 s maximum">
                <div className="v2-stack" style={{ gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="sm"
                      variant={mediaKind === 'photo' ? 'primary' : 'secondary'}
                      icon="image"
                      onClick={() => setMediaKind('photo')}
                    >
                      Photo
                    </Button>
                    <Button
                      size="sm"
                      variant={mediaKind === 'video' ? 'primary' : 'secondary'}
                      icon="video"
                      onClick={() => setMediaKind('video')}
                    >
                      Vidéo 15 s
                    </Button>
                  </div>

                  {mediaKind === 'photo' ? (
                    <>
                      <Button variant="secondary" icon="image" loading={busy} onClick={() => importMedia('offer')}>
                        Importer une photo
                      </Button>
                      <Input
                        value={photo.startsWith('data:') ? '' : photo}
                        onChange={(event) => setPhoto(event.target.value)}
                        placeholder="https://… ou importe une photo"
                      />
                      {photo ? (
                        <img
                          src={photo}
                          alt="Aperçu de la photo"
                          style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 16 }}
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Input
                        value={videoUrl}
                        onChange={(event) => {
                          setVideoUrl(event.target.value);
                          setVideoSeconds(null);
                          setVideoError('');
                        }}
                        onBlur={(event) => verifierVideo(event.target.value)}
                        placeholder="https://…/video.mp4"
                      />
                      {videoSeconds !== null ? (
                        <div className="v2-muted" style={{ fontSize: 12 }}>
                          Durée détectée : {Math.round(videoSeconds)} s · {SOLO_VIDEO_MAX_S} s maximum
                        </div>
                      ) : null}
                      {videoError ? <ErrorBlock message={videoError} /> : null}
                      {isHttpUrl(videoUrl) && !videoError ? (
                        <video
                          src={videoUrl}
                          controls
                          style={{ width: '100%', maxHeight: 200, borderRadius: 16, background: '#000' }}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </Field>

              <Field
                label="Titre"
                hint={editingItem ? 'Verrouillé après publication' : 'Ce que les acheteurs voient en premier'}
              >
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex. Sac de riz 25 kg"
                  disabled={Boolean(editingItem)}
                />
              </Field>
              {!editingItem && titleProposal && (
                <Proposal label="Titre proposé" value={titleProposal} onUse={() => setTitle(titleProposal)} />
              )}

              <Field label="Sous-titre" hint="Une ligne pour préciser l’objet">
                <Input
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  placeholder="Ex. Neuf, livré à domicile"
                  maxLength={120}
                  disabled={Boolean(editingItem)}
                />
              </Field>

              <Field label="Description" hint="État, détails, lieu de remise">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Décris ton objet en quelques phrases."
                />
              </Field>
              {!editingItem && textProposal && (
                <Proposal label="Description proposée" value={textProposal} onUse={() => setDescription(textProposal)} />
              )}

              <Field label={`Prix (${money.currency})`} hint="Montant converti en unités internes à la publication">
                <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="0" />
              </Field>
              {priceProposalText && (
                <Proposal
                  label="Prix conseillé"
                  value={`${priceProposalText} ${money.currency}`}
                  onUse={() => setPrice(priceProposalText)}
                />
              )}

              <Field
                label="Catégorie"
                hint={editingItem ? 'Verrouillée après publication' : 'La famille de la vie quotidienne'}
              >
                <FamilleGrid value={category} onChange={setCategory} disabled={Boolean(editingItem)} />
              </Field>

              {!editingOnline ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={publishNow} onChange={(event) => setPublishNow(event.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--v2-accent)' }} />
                  Publier immédiatement dans le marché
                </label>
              ) : (
                <div className="v2-muted" style={{ fontSize: 12.5 }}>
                  Cet objet est en ligne : tes modifications remplacent la version visible par les acheteurs.
                </div>
              )}
              <div className="v2-muted" style={{ fontSize: 12 }}>
                {pinConfigured
                  ? `Un PIN (${pinLength} chiffres) te sera demandé avant la mise en ligne.`
                  : 'Configure d’abord un code PIN dans la sécurité du profil.'}
              </div>
            </div>
          </Card>

          <div className="v2-studio-foot" style={{ flexWrap: 'wrap' }}>
            <Button variant="secondary" style={{ flex: 1, minWidth: 100 }} onClick={goHome}>
              Annuler
            </Button>
            {editingOnline && !editingItem?.sold ? (
              <Button
                variant="secondary"
                style={{ flex: 1, minWidth: 120 }}
                icon="check"
                loading={busy}
                onClick={() => editingItem && void vendre(editingItem)}
              >
                Marquer vendu
              </Button>
            ) : null}
            <Button
              style={{ flex: 2, minWidth: 150 }}
              loading={busy}
              icon="check"
              disabled={Boolean(editingItem && !soloEditable(editingItem))}
              onClick={() => submitZando('offer')}
            >
              {editingItem
                ? editingOnline ? 'Enregistrer les modifications' : publishNow ? 'Publier l’objet' : 'Enregistrer le brouillon'
                : publishNow ? 'Publier l’objet' : 'Enregistrer le brouillon'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'reader' && (
        <div className="v2-pad">
          <Card>
            <div className="v2-stack">
              <div className="v2-row-between">
                <div className="v2-h3">Étape {step + 1} sur {READER_STEPS.length}</div>
                <span className="v2-badge v2-badge--accent">{READER_STEPS[step]}</span>
              </div>
              <Progress steps={READER_STEPS} current={step} />

              {step === 0 && (
                <>
                  <BuyerPreview
                    avatar={identity?.avatar_url}
                    author={selfPseudo}
                    name={title || 'Titre de ton contenu'}
                    title={description.trim() || 'Ce que le lecteur va trouver apparaîtra ici.'}
                    priceText={price ? `${price} ${money.currency} / s` : undefined}
                    image={cover || undefined}
                  />
                  <Field label="Format" hint="Le type de contenu que tu mets en lecture">
                    <FormatTiles options={formatOptions} value={effectiveFormat} onChange={setFormat} />
                  </Field>
                  <Field label="Titre du contenu">
                    <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Album live du dimanche" />
                  </Field>
                  {titleProposal && (
                    <Proposal label="Titre proposé" value={titleProposal} onUse={() => setTitle(titleProposal)} />
                  )}
                  <Field label="Description">
                    <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Ce que le lecteur va trouver." />
                  </Field>
                  <Field label="Lien du contenu" hint="Adresse externe ouverte par le Lecteur UQ">
                    <Input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://…" />
                  </Field>
                  <Field label="Photo de couverture" hint="Importe une image (PNG, JPEG, WebP) ou colle une URL">
                    <div className="v2-stack" style={{ gap: 8 }}>
                      <Button variant="secondary" icon="image" loading={busy} onClick={() => importMedia('reader')}>
                        Importer une couverture
                      </Button>
                      <Input value={cover.startsWith('data:') ? '' : cover} onChange={(event) => setCover(event.target.value)} placeholder="https://… ou importe une image" />
                    </div>
                  </Field>
                  {cover ? (
                    <img
                      src={cover}
                      alt="Aperçu de la couverture"
                      style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 16 }}
                    />
                  ) : null}
                  <Field label="Catégorie" hint="Optionnel">
                    <CategoryPicker
                      options={categoryOptions}
                      value={effectiveCategory}
                      onChange={setCategory}
                      newCategory={newCategory}
                      setNewCategory={setNewCategory}
                      onCreate={() => void createCategory()}
                      busy={busy}
                    />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <Field label={`Prix par seconde (${money.currency})`} hint="Facturé à chaque seconde de lecture">
                    <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="0" />
                  </Field>
                  <Card style={{ background: 'var(--v2-surface-2)' }}>
                    <div className="v2-row-between">
                      <span className="v2-muted">Titre</span>
                      <span style={{ fontWeight: 650, textAlign: 'right' }}>{title || '—'}</span>
                    </div>
                    <div className="v2-row-between" style={{ marginTop: 6 }}>
                      <span className="v2-muted">Format</span>
                      <span style={{ fontWeight: 650 }}>{formatOptions.find((option) => option.id === effectiveFormat)?.label || effectiveFormat || '—'}</span>
                    </div>
                    <div className="v2-row-between" style={{ marginTop: 6 }}>
                      <span className="v2-muted">Lien</span>
                      <span style={{ fontWeight: 650, textAlign: 'right', wordBreak: 'break-all', maxWidth: '60%' }}>{link || '—'}</span>
                    </div>
                  </Card>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={publishNow} onChange={(event) => setPublishNow(event.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--v2-accent)' }} />
                    Publier immédiatement dans le flux
                  </label>
                  <div className="v2-muted" style={{ fontSize: 12 }}>
                    Le contenu lecteur est enregistré comme une offre du marché : format, lien et prix à la
                    seconde. Le Lecteur UQ ouvre ce lien depuis la fiche de l’offre.
                  </div>
                </>
              )}
            </div>
          </Card>

          <div className="v2-studio-foot">
            {step > 0 && (
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>Précédent</Button>
            )}
            {step < READER_STEPS.length - 1 ? (
              <Button style={{ flex: 2 }} iconRight="forward" onClick={() => setStep(step + 1)}>Continuer</Button>
            ) : (
              <Button style={{ flex: 2 }} loading={busy} icon="check" onClick={() => submitZando('reader')}>
                {publishNow ? 'Publier le contenu' : 'Enregistrer le brouillon'}
              </Button>
            )}
          </div>
        </div>
      )}

      {mode === 'connect' && (
        <div className="v2-pad">
          <Card>
            <div className="v2-stack">
              <Field label="Nom de ta fiche" hint="Ce que lit le voisin — 60 caractères au plus">
                <Input
                  value={ficheNom}
                  onChange={(event) => setFicheNom(event.target.value)}
                  placeholder="Box du carrefour"
                  maxLength={60}
                />
              </Field>

              <Field label="Nature du lien" hint="Le classement ne retient que ce que l'appareil peut mesurer">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Chip active={reseau === 'mobile'} onClick={() => setReseau('mobile')}>
                    Réseau mobile
                  </Chip>
                  <Chip active={reseau === 'starlink'} onClick={() => setReseau('starlink')}>
                    Lien satellite
                  </Chip>
                </div>
              </Field>

              <Field label="Photo" hint="Facultative ; elle s'affiche sur la carte des voisins">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {photoFiche ? (
                    <img
                      src={photoFiche}
                      alt=""
                      style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="v2-muted" style={{ fontSize: 12.5 }}>
                      Aucune photo
                    </span>
                  )}
                  <Button variant="ghost" size="sm" icon="camera" onClick={() => void choisirPhotoFiche()}>
                    {photoFiche ? 'Changer' : 'Choisir'}
                  </Button>
                  {photoFiche ? (
                    <IconButton name="close" label="Retirer la photo" onClick={() => setPhotoFiche('')} />
                  ) : null}
                </div>
              </Field>

              <Field
                label="Prix par seconde"
                hint="Écrit sur cet appareil seulement : le serveur ne le reçoit pas, et ne peut donc pas le classer"
              >
                <Input
                  value={prixSeconde}
                  onChange={(event) => setPrixSeconde(event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </Field>
            </div>
          </Card>

          <Card style={{ marginTop: 12 }}>
            <div className="v2-row-between">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 650 }}>Position et mesure du lien</div>
                <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {position ? `à ±${position.precision_m} m du GPS` : 'Position non captée'}
                  {' · '}
                  {mesure ? decrireMesure(mesure) : 'lien non mesuré'}
                </div>
              </div>
              <Button variant="secondary" size="sm" icon="refresh" loading={enMesure} onClick={() => void equiperAppareil()}>
                {position && mesure ? 'Re-mesurer' : 'Capturer'}
              </Button>
            </div>
          </Card>

          {ficheServeur ? (
            <Card style={{ marginTop: 12, background: 'var(--v2-surface-2)' }}>
              <div className="v2-row-between">
                <span className="v2-muted">Ta fiche</span>
                <span className={`v2-badge${ficheServeur.publiee ? ' v2-badge--positive' : ''}`}>
                  {ficheServeur.publiee ? 'en ligne' : 'retirée'}
                </span>
              </div>
              <KeyValue label="Nom" value={ficheServeur.nom} />
              <KeyValue
                label="Lien"
                value={ficheServeur.reseau === 'starlink' ? 'Lien satellite' : 'Réseau mobile'}
              />
              <KeyValue
                label="Prix / seconde"
                value={
                  lirePrixLocal(uq) === null
                    ? 'non saisi sur cet appareil'
                    : `${formatInt(lirePrixLocal(uq) || 0)} · sur cet appareil`
                }
              />
            </Card>
          ) : null}

          <div className="v2-section-title">Connexion à proximité</div>
          {region.loading ? (
            <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
              <Skeleton height={44} radius={14} />
            </Card>
          ) : region.error ? (
            <ErrorBlock message={region.error} onRetry={region.reload} />
          ) : !(region.data?.total || 0) ? (
            <Card>
              <EmptyState
                icon="globe"
                title="Personne ne vend sa connexion près de toi"
                description={
                  position
                    ? `Aucun vendeur dans ${region.data?.rayon_km ?? 20} km autour de toi.`
                    : 'Capture ta position pour voir les vendeurs de ton quartier.'
                }
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <List plain>
                {[region.data?.en_avant, ...(region.data?.suivants || [])]
                  .filter((entry): entry is ConnexionVendeur => Boolean(entry))
                  .map((vendeur, index) => (
                    <Row
                      key={vendeur.id}
                      avatar={{ label: initials(vendeur.nom), src: vendeur.photo || undefined }}
                      title={`${index === 0 ? '★ ' : ''}${vendeur.nom}`}
                      subtitle={[
                        vendeur.reseau === 'starlink' ? 'Lien satellite' : 'Réseau mobile',
                        vendeur.debit_mbps > 0 ? `${vendeur.debit_mbps} Mb/s` : null,
                        vendeur.latence_ms > 0 ? `${vendeur.latence_ms} ms` : null,
                        `puissance ${Math.round((vendeur.puissance || 0) * 100)} %`,
                        vendeur.mesure_peu_fraiche ? 'mesure ancienne' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      right={
                        <span className="v2-badge">
                          {vendeur.distance_km === null || vendeur.distance_km === undefined
                            ? '—'
                            : `${vendeur.distance_km} km`}
                        </span>
                      }
                    />
                  ))}
              </List>
            </Card>
          )}

          <Card style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <span style={{ color: 'var(--v2-accent)', flex: 'none' }}>
              <Icon name="info" size={18} />
            </span>
            <div className="v2-muted" style={{ fontSize: 12.5 }}>
              Le serveur retient le nom, la photo, la nature du lien, la position et la mesure — jamais le prix.
              La connexion elle-même ne transite pas par lui : elle se demande, se devisse et se transfère de
              téléphone à téléphone.
            </div>
          </Card>

          {onOpenBoutiqueSysteme ? (
            <div style={{ marginTop: 14 }}>
              <BandeauConnexion onOpen={onOpenBoutiqueSysteme} />
            </div>
          ) : null}

          <div className="v2-studio-foot">
            <Button block style={{ flex: 1 }} icon="check" loading={busy} onClick={submitConnection}>
              {ficheServeur?.publiee ? 'Republier ma fiche' : 'Publier ma fiche'}
            </Button>
            {ficheServeur?.publiee ? (
              <Button variant="ghost" icon="stop" loading={busy} onClick={() => void retirerFiche()}>
                Retirer
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {/* Menu d'une publication : aperçu, modification, passage en ligne, suppression. */}
      <Sheet
        open={Boolean(menuItem)}
        onClose={() => setMenuItem(null)}
        title={menuItem?.title || 'Publication'}
        subtitle={menuItem ? `${money.format(menuItem.price_borb)}${menuItem.subtitle ? ` · ${menuItem.subtitle}` : ''}` : undefined}
        footer={
          menuItem ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" style={{ flex: 1, minWidth: 110 }} onClick={() => { setMenuItem(null); onOpenItem(menuItem); }}>
                Aperçu
              </Button>
              <Button
                style={{ flex: 1, minWidth: 110 }}
                icon="edit"
                disabled={!soloEditable(menuItem)}
                onClick={() => startEdit(menuItem)}
              >
                Modifier
              </Button>
              {menuItem.sold ? (
                <span className="v2-badge v2-badge--positive" style={{ alignSelf: 'center' }}>vendu</span>
              ) : (
                <>
                  {menuItem.published === false ? (
                    <Button style={{ flex: 1, minWidth: 110 }} icon="refresh" onClick={() => requestPublish(menuItem)}>
                      Republier
                    </Button>
                  ) : null}
                  <Button style={{ flex: 1, minWidth: 110 }} icon="check" onClick={() => void vendre(menuItem)}>
                    Marquer vendu
                  </Button>
                </>
              )}
              {!menuItem.sold ? (
                <IconButton name="trash" label="Supprimer" onClick={() => void remove(menuItem)} />
              ) : null}
            </div>
          ) : null
        }
      >
        {menuItem && (
          <div className="v2-stack">
            {firstImageUrl(parseMediaUrls(menuItem.media_urls)) ? (
              <img
                src={firstImageUrl(parseMediaUrls(menuItem.media_urls))}
                alt=""
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 18 }}
              />
            ) : null}
            <div className="v2-muted" style={{ fontSize: 13 }}>{menuItem.description || 'Aucune description.'}</div>
            <Card>
              <div className="v2-row-between">
                <span className="v2-muted">Statut</span>
                <span className={`v2-badge ${soloStatut(menuItem).tone}`}>{soloStatut(menuItem).label}</span>
              </div>
              <div className="v2-row-between" style={{ marginTop: 8 }}>
                <span className="v2-muted">Catégorie</span>
                <span className="v2-badge v2-badge--accent">{menuItem.category || '—'}</span>
              </div>
              <div className="v2-row-between" style={{ marginTop: 8 }}>
                <span className="v2-muted">Modifications</span>
                <span className="v2-badge">{menuItem.edit_count || 0} / {SOLO_EDITS_MAX}</span>
              </div>
              {menuItem.sold_at ? (
                <div className="v2-row-between" style={{ marginTop: 8 }}>
                  <span className="v2-muted">Vendu le</span>
                  <span className="v2-badge">{relativeDay(sqlStamp(menuItem.sold_at))}</span>
                </div>
              ) : null}
            </Card>
          </div>
        )}
      </Sheet>

      {/* Vérification du PIN avant toute mise en ligne */}
      <PinSheet
        open={pinOpen}
        onClose={() => {
          setPinOpen(false);
          setGated(null);
        }}
        title={TITRES_PIN[gated?.kind ?? 'publish'].titre}
        subtitle={TITRES_PIN[gated?.kind ?? 'publish'].legende}
        length={pinLength}
        onSubmit={confirmPin}
      />

      {/* Mini-site du vendeur : le Studio ouvre exactement la vitrine que les acheteurs voient. */}
      <BoutiqueSite
        seller={miniSiteOpen ? uq : ''}
        onClose={() => setMiniSiteOpen(false)}
        onOpenItem={(item) => {
          setMiniSiteOpen(false);
          onOpenItem(item);
        }}
      />

      {/* Studio de vitrine (22 panneaux) : le seul éditeur du mini-site.
          Publier écrit `vitrine` et sa projection `site`, sous PIN. */}
      {vitrineOpen ? (
        <SiteEditor
          initial={vitrineSite}
          shopName={shopName.trim() || myShop?.name || 'Ta boutique'}
          shopTagline={shopDescription.trim() || myShop?.description || ''}
          busy={busy}
          onClose={() => setVitrineOpen(false)}
          onSave={saveSiteFromEditor}
        />
      ) : null}
    </>
  );
}

/* ============================ Briques du Studio ============================ */

function Progress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="v2-studio-progress" aria-label={`Étape ${current + 1} sur ${steps.length}`}>
      {steps.map((label, index) => (
        <span key={label} data-done={index <= current} />
      ))}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 14,
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.16)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.75 }}>
        {label}
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function FormatTiles({
  options,
  value,
  onChange,
}: {
  options: StudioFormat[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (options.length === 0) {
    return <div className="v2-muted" style={{ fontSize: 12.5 }}>Formats indisponibles.</div>;
  }
  return (
    <div className="v2-studio-tiles" role="radiogroup" aria-label="Format">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          className="v2-studio-tile"
          data-active={option.id === value}
          onClick={() => onChange(option.id)}
        >
          <Icon name={formatIcon(option.id)} size={20} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CategoryPicker({
  options,
  value,
  onChange,
  newCategory,
  setNewCategory,
  onCreate,
  busy,
}: {
  options: string[];
  value: string;
  onChange: (name: string) => void;
  newCategory: string;
  setNewCategory: (name: string) => void;
  onCreate: () => void;
  busy: boolean;
}) {
  return (
    <div className="v2-stack" style={{ gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.length === 0 ? (
          <span className="v2-muted" style={{ fontSize: 12.5 }}>
            Aucune catégorie pour le moment — crée la première ci-dessous.
          </span>
        ) : (
          options.map((name) => (
            <Chip key={name} active={name === value} onClick={() => onChange(name)}>
              {name}
            </Chip>
          ))
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder="Nouvelle catégorie, ex. Boulangerie"
          style={{ flex: 1 }}
        />
        <Button variant="secondary" icon="plus" loading={busy} onClick={onCreate}>
          Créer
        </Button>
      </div>
    </div>
  );
}

/** Les 16 familles de la vie quotidienne : icône + texte, une seule page. */
function FamilleGrid({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Catégorie"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}
    >
      {FAMILLES.map((famille) => {
        const active = famille === value;
        const teinte = couleurFamille(famille);
        return (
          <button
            key={famille}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(famille)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 0,
              padding: '8px 3px',
              borderRadius: 12,
              cursor: disabled ? 'default' : 'pointer',
              border: active ? `1.5px solid ${teinte}` : '1px solid var(--v2-border)',
              background: active ? `${teinte}18` : 'var(--v2-surface-2)',
              color: active ? teinte : 'var(--v2-text)',
              opacity: disabled && !active ? 0.55 : 1,
            }}
          >
            <Icon name={iconeFamille(famille) as IconName} size={18} />
            <span style={{ fontSize: 10.5, fontWeight: 650, lineHeight: 1.1, textAlign: 'center' }}>
              {famille}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Aperçu fidèle : ce que l'acheteur verra dans le flux et le marché. */
function BuyerPreview({
  avatar,
  author,
  name,
  title,
  priceText,
  category,
  image,
  categoryChip,
}: {
  avatar?: string | null;
  author: string;
  name: string;
  title: string;
  priceText?: string;
  category?: string;
  image?: string;
  categoryChip?: boolean;
}) {
  const showCategory = categoryChip !== false && category;
  return (
    <div className="v2-studio-preview">
      <span className="v2-studio-preview-tag">Aperçu acheteur</span>
      {image ? <img src={image} alt="" /> : null}
      <div className="v2-studio-preview-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 30,
              height: 30,
              borderRadius: 999,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: 11,
              fontWeight: 800,
              flex: 'none',
            }}
          >
            {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(author || 'UQ')}
          </span>
          <span style={{ fontSize: 13, fontWeight: 750 }}>
            {name}
            {author ? <span style={{ fontWeight: 500, opacity: 0.75 }}> @{author}</span> : null}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 15.5,
            fontWeight: 800,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {priceText ? (
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-gold)', fontVariantNumeric: 'tabular-nums' }}>
              {priceText}
            </span>
          ) : null}
          {showCategory ? (
            <span className="v2-badge" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>
              <Icon name="market" size={12} /> {category}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
