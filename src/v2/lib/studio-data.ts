// ============================================================================
// studio-data.ts — Données statiques du studio de vitrine
// 16 familles, ~93 métiers, couleurs et icônes
// ============================================================================

export type Famille =
  | 'Santé' | 'Alimentation' | 'Commerce' | 'Artisanat'
  | 'Beauté' | 'Transport' | 'Logement' | 'Éducation'
  | 'Agriculture' | 'Art & scène' | 'Créateurs' | 'Fêtes & culte'
  | 'Services' | 'Infra & finance' | 'Numérique' | 'Auto & moto';

export const FAMILLE_COULEUR: Record<Famille, string> = {
  Santé: '#0b9a63', Alimentation: '#d97706', Commerce: '#b5378c', Artisanat: '#8a5a2b',
  Beauté: '#e0479e', Transport: '#2e86de', Logement: '#7b5ea7', Éducation: '#c9a227',
  Agriculture: '#4c9a2a', 'Art & scène': '#7d3cff', Créateurs: '#e63946', 'Fêtes & culte': '#b54708',
  Services: '#0f766e', 'Infra & finance': '#0e7490', Numérique: '#475569', 'Auto & moto': '#dc2626',
};

export const FAMILLE_ICONE: Record<Famille, string> = {
  Santé: 'steth', Alimentation: 'fork', Commerce: 'cart', Artisanat: 'wrench',
  Beauté: 'scissors', Transport: 'car', Logement: 'home', Éducation: 'grad',
  Agriculture: 'plant', 'Art & scène': 'music', Créateurs: 'play', 'Fêtes & culte': 'church',
  Services: 'tool', 'Infra & finance': 'wallet', Numérique: 'phone', 'Auto & moto': 'parking',
};

export interface Metier {
  nom: string;
  famille: Famille;
  icone: string;
  description: string;
}

export const METIERS: Metier[] = [
  { nom: 'Pharmacie', famille: 'Santé', icone: 'pill', description: '4 services · 12 prix · garde de nuit' },
  { nom: 'Médecin', famille: 'Santé', icone: 'steth', description: 'spécialité · créneaux · tarif consultation' },
  { nom: 'Infirmier', famille: 'Santé', icone: 'cross', description: 'actes · zone · déplacement' },
  { nom: 'Hôpital', famille: 'Santé', icone: 'bed', description: 'urgences · services · RDV' },
  { nom: "Laboratoire d'analyses", famille: 'Santé', icone: 'drop', description: 'tests · résultats · file' },
  { nom: 'Opticien', famille: 'Santé', icone: 'shoe', description: 'verres · montures · mesure' },
  { nom: 'Dentiste', famille: 'Santé', icone: 'cross', description: 'soins · prothèses · RDV' },
  { nom: 'Vétérinaire', famille: 'Santé', icone: 'egg', description: 'consultation · vaccins · animaux' },
  { nom: 'Restaurant', famille: 'Alimentation', icone: 'fork', description: 'menu · horaires · livraison' },
  { nom: 'Primeur', famille: 'Alimentation', icone: 'leaf', description: 'prix du jour · panier' },
  { nom: 'Boucherie', famille: 'Alimentation', icone: 'fish', description: 'au kilo · découpe · réserve' },
  { nom: 'Boulangerie', famille: 'Alimentation', icone: 'bread', description: 'fournée · commande' },
  { nom: 'Épicerie', famille: 'Alimentation', icone: 'cart', description: 'rayons · liste · livraison' },
  { nom: 'Cuisine à domicile', famille: 'Alimentation', icone: 'fork', description: 'formule · nombre de plats · déplacement' },
  { nom: 'Bar & snack', famille: 'Alimentation', icone: 'drop', description: 'carte · happy hour · musique' },
  { nom: 'Vêtements', famille: 'Commerce', icone: 'shirt', description: 'tailles · couleurs · stock' },
  { nom: 'Chaussures', famille: 'Commerce', icone: 'shoe', description: 'pointures · essayage · stock' },
  { nom: 'Sac & maroquinerie', famille: 'Commerce', icone: 'box', description: 'modèles · matière · stock' },
  { nom: 'Cosmétique', famille: 'Commerce', icone: 'drop', description: 'marques · échantillons · prix' },
  { nom: 'Boutique électronique', famille: 'Commerce', icone: 'phone', description: 'appareils · garantie · état' },
  { nom: 'Librairie & papeterie', famille: 'Commerce', icone: 'book', description: 'titres · fournitures · commande' },
  { nom: 'Fleuriste', famille: 'Commerce', icone: 'leaf', description: 'bouquets · livraison · événement' },
  { nom: 'Marché / étal', famille: 'Commerce', icone: 'cart', description: 'prix du jour · emplacement · photo' },
  { nom: 'Couturier / tailleur', famille: 'Artisanat', icone: 'shirt', description: 'mesures · délai · tissu' },
  { nom: 'Menuisier', famille: 'Artisanat', icone: 'wrench', description: 'meubles · essence · devis' },
  { nom: 'Maçon', famille: 'Artisanat', icone: 'tool', description: 'chantier · jour · matériel' },
  { nom: 'Électricien', famille: 'Artisanat', icone: 'tool', description: 'dépannage · forfait · urgence' },
  { nom: 'Plombier', famille: 'Artisanat', icone: 'tool', description: 'fuite · forfait · déplacement' },
  { nom: 'Peintre en bâtiment', famille: 'Artisanat', icone: 'drop', description: 'm² · finition · devis' },
  { nom: 'Serrurier', famille: 'Artisanat', icone: 'wrench', description: 'ouverture · clé · urgence' },
  { nom: 'Cordonnier', famille: 'Artisanat', icone: 'shoe', description: 'ressemelage · réparation · délai' },
  { nom: 'Soudeur', famille: 'Artisanat', icone: 'tool', description: 'type · kg · atelier' },
  { nom: "Ébéniste d'art", famille: 'Artisanat', icone: 'home', description: 'pièce unique · photo · prix' },
  { nom: 'Coiffure', famille: 'Beauté', icone: 'scissors', description: 'prestations · durée · RDV' },
  { nom: 'Barbier', famille: 'Beauté', icone: 'scissors', description: 'coupe · rasage · RDV' },
  { nom: 'Esthétique & ongles', famille: 'Beauté', icone: 'drop', description: 'soins · forfait · produits' },
  { nom: 'Maquilleuse', famille: 'Beauté', icone: 'scissors', description: 'maquillage · déplacement · formule' },
  { nom: 'Tatoueur', famille: 'Beauté', icone: 'tool', description: 'dimension · zone · dessin' },
  { nom: 'Coiffeur à domicile', famille: 'Beauté', icone: 'scissors', description: 'zone · déplacement · créneau' },
  { nom: 'Taxi', famille: 'Transport', icone: 'car', description: 'course · trajet · tarif' },
  { nom: 'Moto-taxi', famille: 'Transport', icone: 'car', description: 'course · zone · tarif' },
  { nom: 'Navette / bus', famille: 'Transport', icone: 'parking', description: 'lignes · horaires · place' },
  { nom: 'Livreur de colis', famille: 'Transport', icone: 'box', description: 'poids · trajet · option' },
  { nom: 'Déménagement', famille: 'Transport', icone: 'home', description: 'volume · camion · équipe' },
  { nom: 'Ambulance', famille: 'Transport', icone: 'car', description: 'urgence · distance · nuit' },
  { nom: 'Chauffeur privé', famille: 'Transport', icone: 'car', description: 'heure · jour · véhicule' },
  { nom: 'Parking', famille: 'Transport', icone: 'parking', description: 'places · durée · véhicule' },
  { nom: 'Agence de voyage', famille: 'Transport', icone: 'plane', description: 'destinations · forfait · visa' },
  { nom: 'Immobilier', famille: 'Logement', icone: 'home', description: 'biens · visite · surface' },
  { nom: 'Hôtel', famille: 'Logement', icone: 'hotel', description: 'chambres · la nuit · petit-déj' },
  { nom: 'Meublé & chambre', famille: 'Logement', icone: 'bed', description: 'nuit · semaine · équipements' },
  { nom: 'Quincaillerie', famille: 'Logement', icone: 'wrench', description: 'matériaux · devis · chantier' },
  { nom: 'Gardiennage', famille: 'Logement', icone: 'home', description: 'tour · zone · effectif' },
  { nom: 'Ménage & nettoyage', famille: 'Logement', icone: 'drop', description: 'fréquence · surface · produit' },
  { nom: 'École', famille: 'Éducation', icone: 'grad', description: 'classes · frais · horaires' },
  { nom: 'Cours en ligne', famille: 'Éducation', icone: 'book', description: 'modules · LIVE · certificat' },
  { nom: 'Soutien scolaire', famille: 'Éducation', icone: 'book', description: 'niveau · heure · groupe' },
  { nom: 'Crèche & garderie', famille: 'Éducation', icone: 'egg', description: 'âge · journée · repas' },
  { nom: 'Auto-école', famille: 'Éducation', icone: 'car', description: 'leçons · permis · tarif' },
  { nom: 'École de langue', famille: 'Éducation', icone: 'txt', description: 'langue · niveau · session' },
  { nom: 'Université & formation pro', famille: 'Éducation', icone: 'grad', description: 'filières · inscription · diplôme' },
  { nom: 'Ferme', famille: 'Agriculture', icone: 'plant', description: 'parcelles · récolte · vente' },
  { nom: 'Poulailler', famille: 'Agriculture', icone: 'egg', description: 'poussins · œufs · aliments' },
  { nom: 'Élevage', famille: 'Agriculture', icone: 'fish', description: 'espèces · poids · disponibilité' },
  { nom: 'Champ & culture', famille: 'Agriculture', icone: 'leaf', description: 'surface · saison · rendement' },
  { nom: 'Pêche & aquaculture', famille: 'Agriculture', icone: 'fish', description: 'poisson · kg · étang' },
  { nom: 'Laiterie', famille: 'Agriculture', icone: 'drop', description: 'lait · litres · livraison' },
  { nom: 'Jardin & pépinière', famille: 'Agriculture', icone: 'plant', description: 'plants · taille · aménagement' },
  { nom: 'Bois & charbon', famille: 'Agriculture', icone: 'wrench', description: 'essence · stère · livraison' },
  { nom: 'Musicien', famille: 'Art & scène', icone: 'music', description: 'set · durée · formation · LIVE' },
  { nom: 'Chanteur / artiste', famille: 'Art & scène', icone: 'music', description: 'titre · clip · scène · cachet' },
  { nom: 'DJ', famille: 'Art & scène', icone: 'music', description: 'set · matériel · soirée' },
  { nom: 'Danse & troupe', famille: 'Art & scène', icone: 'party', description: 'prestation · nombre de danseurs' },
  { nom: 'Acteur / humoriste', famille: 'Art & scène', icone: 'play', description: 'scène · texte · soirée' },
  { nom: 'Peintre & plasticien', famille: 'Art & scène', icone: 'drop', description: 'œuvre · dimension · tirage' },
  { nom: 'Styliste', famille: 'Art & scène', icone: 'shirt', description: 'collection · sur-mesure · délai' },
  { nom: 'Photographe', famille: 'Art & scène', icone: 'cam', description: 'séance · livraison des fichiers · studio' },
  { nom: 'Écrivain & slameur', famille: 'Art & scène', icone: 'book', description: 'ouvrage · lecture · dédicace' },
  { nom: 'Créateur de bijoux', famille: 'Art & scène', icone: 'shoe', description: 'pièce · matière · stock' },
  { nom: 'Créateur TikTok', famille: 'Créateurs', icone: 'play', description: 'format · vues · commande vidéo' },
  { nom: 'YouTubeur', famille: 'Créateurs', icone: 'play', description: 'chaîne · abonnement · placement' },
  { nom: 'Streamer', famille: 'Créateurs', icone: 'play', description: 'direct · horaire · don' },
  { nom: 'Podcast', famille: 'Créateurs', icone: 'music', description: 'épisodes · durée · sponsor' },
  { nom: 'Influenceur', famille: 'Créateurs', icone: 'drop', description: 'audience · rate-card · ville' },
  { nom: 'Monteur vidéo', famille: 'Créateurs', icone: 'cam', description: 'minutée · délai · option' },
  { nom: 'Community manager', famille: 'Créateurs', icone: 'txt', description: 'réseaux · forfait mensuel' },
  { nom: 'Graphiste', famille: 'Créateurs', icone: 'drop', description: 'logo · charte · livraison' },
  { nom: 'Église', famille: 'Fêtes & culte', icone: 'church', description: 'cultes · LIVE · prières' },
  { nom: 'Mosquée / paroisse', famille: 'Fêtes & culte', icone: 'church', description: 'horaires · fête · annonce' },
  { nom: 'Salle de fête', famille: 'Fêtes & culte', icone: 'party', description: 'dispo · formule · devis' },
  { nom: 'Événementiel', famille: 'Fêtes & culte', icone: 'play', description: 'type · prestataires · devis' },
  { nom: 'Traiteur', famille: 'Fêtes & culte', icone: 'fork', description: 'couverts · menu · livraison' },
  { nom: 'Sono & lumière', famille: 'Fêtes & culte', icone: 'music', description: 'matériel · journée · technicien' },
  { nom: 'Maison funéraire', famille: 'Fêtes & culte', icone: 'home', description: 'service · cercueil · transport' },
  { nom: 'Pronostics sportifs', famille: 'Services', icone: 'ball', description: 'matchs · grilles · LIVE' },
  { nom: 'Avocat', famille: 'Services', icone: 'book', description: 'dossier · consultation · urgence' },
  { nom: 'Notaire', famille: 'Services', icone: 'txt', description: 'acte · délai · frais' },
  { nom: 'Comptable', famille: 'Services', icone: 'wallet', description: 'bilan · mensualité · déclaration' },
  { nom: "Agence d'emploi", famille: 'Services', icone: 'grad', description: 'postes · contrat · zone' },
  { nom: "Garde d'enfants", famille: 'Services', icone: 'egg', description: 'âge · heures · référence' },
  { nom: 'Aide à domicile', famille: 'Services', icone: 'home', description: 'visite · actes · fréquence' },
  { nom: 'Sécurité / gardien', famille: 'Services', icone: 'tool', description: 'tour · effectif · nuit' },
  { nom: 'Blanchisserie', famille: 'Services', icone: 'drop', description: 'kg · délai · enlèvement' },
  { nom: "Réparateur d'objets", famille: 'Services', icone: 'wrench', description: 'objet · panne · devis' },
  { nom: 'Aéroport', famille: 'Infra & finance', icone: 'plane', description: 'vols · destination · tarif' },
  { nom: 'Port', famille: 'Infra & finance', icone: 'ship', description: 'conteneurs · suivi · trajet' },
  { nom: 'Mobile money', famille: 'Infra & finance', icone: 'wallet', description: 'taux · commission · horaires' },
  { nom: 'Banque & microfinance', famille: 'Infra & finance', icone: 'wallet', description: 'comptes · crédit · agence' },
  { nom: 'Assurance', famille: 'Infra & finance', icone: 'home', description: 'police · garantie · sinistre' },
  { nom: 'Station carburant', famille: 'Infra & finance', icone: 'car', description: 'prix · service · 24h' },
  { nom: 'Énergie & panneau solaire', famille: 'Infra & finance', icone: 'tool', description: 'kit · puissance · installation' },
  { nom: 'Adduction & eau', famille: 'Infra & finance', icone: 'drop', description: 'forfait · citerne · branchement' },
  { nom: 'Réparation téléphone', famille: 'Numérique', icone: 'phone', description: 'modèle · panne · garantie' },
  { nom: 'Réparation ordinateur', famille: 'Numérique', icone: 'txt', description: 'diagnostic · pièce · délai' },
  { nom: 'Cyber & impression', famille: 'Numérique', icone: 'book', description: 'pages · format · heure' },
  { nom: 'Développeur web', famille: 'Numérique', icone: 'txt', description: 'site · délai · maintenance' },
  { nom: 'Vente de connexion', famille: 'Numérique', icone: 'phone', description: 'forfait · Go · opérateur' },
  { nom: 'Électronique & pièces', famille: 'Numérique', icone: 'tool', description: 'composant · référence · stock' },
  { nom: 'Mécanicien', famille: 'Auto & moto', icone: 'wrench', description: "panne · pièce · main-d'œuvre" },
  { nom: 'Vente de véhicule', famille: 'Auto & moto', icone: 'car', description: 'modèle · année · état · km' },
  { nom: 'Pièces détachées', famille: 'Auto & moto', icone: 'tool', description: 'référence · marque · garantie' },
  { nom: 'Lavage & detailing', famille: 'Auto & moto', icone: 'drop', description: 'formule · véhicule · durée' },
  { nom: 'Garage & dépannage', famille: 'Auto & moto', icone: 'car', description: 'remorquage · urgence · zone' },
];

export const FAMILLES: Famille[] = [
  'Santé', 'Alimentation', 'Commerce', 'Artisanat', 'Beauté', 'Transport', 'Logement', 'Éducation',
  'Agriculture', 'Art & scène', 'Créateurs', 'Fêtes & culte', 'Services', 'Infra & finance', 'Numérique', 'Auto & moto',
];

export function compterMetiers(famille: Famille): number {
  return METIERS.filter((m) => m.famille === famille).length;
}

export function metiersDe(famille: Famille): Metier[] {
  return METIERS.filter((m) => m.famille === famille);
}

export function trouverMetier(nom: string): Metier | undefined {
  return METIERS.find((m) => m.nom === nom);
}

export function couleurFamille(famille: string): string {
  return FAMILLE_COULEUR[famille as Famille] ?? '#0b9a63';
}

export function iconeFamille(famille: string): string {
  return FAMILLE_ICONE[famille as Famille] ?? 'grid';
}

/** Catalogue des stickers du studio, groupé en catégories (30 stickers). */
export interface CategorieStickers {
  nom: string;
  icones: string[];
}

export const STICKERS: CategorieStickers[] = [
  { nom: 'Fêtes', icones: ['party', 'star', 'spark', 'ball'] },
  { nom: 'Argent', icones: ['wallet', 'cart', 'box', 'shop'] },
  { nom: 'Goût', icones: ['fork', 'bread', 'egg', 'fish', 'drop'] },
  { nom: 'Vie', icones: ['home', 'hotel', 'bed', 'plant', 'shirt', 'shoe'] },
  { nom: 'Pro', icones: ['tool', 'wrench', 'grad', 'book', 'scissors'] },
  { nom: 'Route', icones: ['car', 'plane', 'ship', 'pin', 'route', 'parking'] },
];