// ====================
// ASSISTANT BORB — BASE DE CONNAISSANCES FRANÇAISE
// ====================

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  category: 'borb' | 'guide' | 'policy' | 'security' | 'faq' | 'support';
  icon: string;
  response: {
    title: string;
    content: string;
    suggestions?: string[];
  };
}

export const KNOWLEDGE_FR: KnowledgeEntry[] = [
  // ===== BORB — VUE D'ENSEMBLE =====
  {
    id: 'borb_overview',
    keywords: ['borb', 'c\'est quoi', 'quest ce que', 'borb', 'monnaie', 'presentation', 'introduction'],
    category: 'borb',
    icon: '💰',
    response: {
      title: 'Qu\'est-ce que le BORB ?',
      content: 'Le BORB (BORB) est la monnaie numérique décentralisée de la plateforme UQ.\n\n• Masse fixe : 40 milliards BORB (jamais créés, jamais brûlés)\n• Adossé à l\'or : le prix de référence suit le cours de l\'once capté par le moteur\n• Le prix courant n\'est pas écrit dans l\'application : il vient du régulateur et de la capture marché, et le coffre affiche sa source ainsi que son âge\n\nC\'est à la fois un moyen de paiement quotidien ET une réserve de valeur intergénérationnelle.',
      suggestions: ['Les 6 unités', 'Les 6 cases', 'Les bulles', 'La sécurité'],
    },
  },

  // ===== LES 6 UNITÉS =====
  {
    id: 'borb_units',
    keywords: ['unités', 'unites', 'fractal', 'borb', 'mborb', 'nborb', 'pborb', 'fborb', 'micro', 'nano', 'pico', 'femto', 'fractions'],
    category: 'borb',
    icon: '💱',
    response: {
      title: 'Les 6 unités fractales',
      content: 'Le BORB se divise en 6 unités de plus en plus petites :\n\n1. BORB (entier) = 1\n2. borb (FIXO) = 0.0001\n3. mborb (MICRO) = 0.000001\n4. nborb (NANO) = 0.00000001\n5. pborb (PICO) = 0.0000000001\n6. fborb (FEMTO) = 0.000000000001\n\n1 BORB = 1 000 000 000 000 fborb (1 billion)\n\nL\'extension fractale est AUTOMATIQUE quand fborb > 0.001 USD.',
      suggestions: ['Les 6 cases', 'Les bulles', 'Le prix'],
    },
  },

  // ===== LES 6 CASES =====
  {
    id: 'borb_cases',
    keywords: ['cases', 'trésor', 'tresor', 'frais', 'récompenses', 'recompenses', 'épargne', 'epargne', 'crédit', 'credit', 'bouclier', 'répartition', 'repartition'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'Les 6 Cases économiques',
      content: 'Les 40 milliards de BORB sont répartis en 6 cases :\n\n💰 Trésor : 77.8% → Distribution UBI\n💸 Frais : 5.6% → Infrastructure\n🏆 Récompenses : 5.6% → Motivation\n❄️ Épargne : 5.6% → Gel des fonds\n💳 Crédit : 3.3% → Prêts\n🛡️ Bouclier : 2.2% → Protection\n\nLe cycle est INFINI : Trésor distribue → utilisateurs dépensent → frais reçus → Trésor rechargé.',
      suggestions: ['Les bulles', 'Le recyclage', 'La sécurité'],
    },
  },

  // ===== LES BULLES =====
  {
    id: 'borb_bubbles',
    keywords: ['bulles', 'bubble', 'travail', 'activité', 'activite', 'points', 'gagner', 'conversion'],
    category: 'borb',
    icon: '🫧',
    response: {
      title: 'Les Bulles — Le pont travail→monnaie',
      content: 'Les bulles sont gagnées par l\'ACTIVITÉ RÉELLE :\n\n• 1 bulle = 1 point d\'activité\n• 100 bulles = 1 borb\n• 10 000 bulles = 1 BORB\n\nLes bulles sont le PONT entre le travail réel et la monnaie. L\'activité soutient le prix du BORB.',
      suggestions: ['Comment gagner', 'Les 6 cases'],
    },
  },

  // ===== COMMENT GAGNER DES BORB =====
  {
    id: 'borb_earn',
    keywords: ['gagner', 'revenus', 'sources', 'comment gagner', 'ubi', 'ventes', 'lecteur', 'connexion', 'livraison', 'parrainage'],
    category: 'borb',
    icon: '🌾',
    response: {
      title: 'Comment gagner des BORB',
      content: 'Tu peux gagner des BORB par :\n\n🌾 UBI (2 points/jour d\'activité)\n🫧 Bulles (activité → conversion)\n💰 Ventes (marketplace, services)\n🎵 Lecteur UQ (90% au créateur)\n📡 Vente de connexion (Starlink/4G)\n🚗 Livraison (livreurs payés)\n🏆 Récompenses (parrainage, défis)\n💳 Crédit (emprunts)',
      suggestions: ['Comment dépenser', 'Les bulles'],
    },
  },

  // ===== COMMENT DÉPENSER =====
  {
    id: 'borb_spend',
    keywords: ['dépenser', 'depenser', 'acheter', 'payer', 'marketplace', 'restaurant', 'service', 'transport'],
    category: 'borb',
    icon: '🛒',
    response: {
      title: 'Comment dépenser des BORB',
      content: 'Tu peux dépenser des BORB pour :\n\n🏪 Marketplace (produits)\n🍽️ Restaurants (plats)\n🔧 Services (mécaniciens, couturiers)\n🎵 Lecteur UQ (contenus)\n📡 Connexion (Starlink/4G)\n🚗 Transport (livraisons)\n💸 Frais de transaction (0.1%)\n❄️ Épargne (gel)\n💳 Remboursement de prêt',
      suggestions: ['Comment gagner', 'Les frais'],
    },
  },

  // ===== SÉCURITÉ =====
  {
    id: 'borb_security',
    keywords: ['sécurité', 'securite', 'protection', 'blackkey', 'shamir', '2fa', 'vault', 'p2p', 'clé', 'cle'],
    category: 'borb',
    icon: '🛡️',
    response: {
      title: 'Sécurité du BORB',
      content: 'Le BORB est protégé par 5 niveaux :\n\n1. UQ BLACK KEY (512 bits)\n2. vTEE (Trusted Execution Environment)\n3. 2FA (Double authentification + biométrie)\n4. VAULT (Shamir 3/5 fragments)\n5. STOCKAGE P2P (données distribuées)\n\nTon compte est INVIOLABLE.',
      suggestions: ['Shamir', 'Le 2FA'],
    },
  },

  // ===== SHAMIR =====
  {
    id: 'borb_shamir',
    keywords: ['shamir', 'fragments', 'guardians', 'récupération', 'recuperation', 'perdu', 'clé perdue'],
    category: 'borb',
    icon: '🔐',
    response: {
      title: 'Shamir Secret Sharing (3/5)',
      content: 'Ta clé privée est divisée en 5 fragments :\n\n• 3 fragments suffisent à la reconstituer\n• 5 guardians de confiance détiennent chacun 1 fragment\n\nSi tu perds ta clé :\n✅ Récupération avec 3 guardians\n✅ Vérification d\'authenticité\n✅ Détection de compromission',
      suggestions: ['La sécurité', 'Le 2FA'],
    },
  },

  // ===== RECYCLAGE =====
  {
    id: 'borb_recycle',
    keywords: ['recyclage', 'inactifs', 'inactivité', 'inactivite', '5 ans', '10 ans', '50 ans', 'grâce', 'grace'],
    category: 'borb',
    icon: '🔄',
    response: {
      title: 'Recyclage des comptes inactifs',
      content: 'Le BORB dure POUR TOUJOURS (zéro brûlage) :\n\n• 0-5 ans : Grâce (aucun frais)\n• 5-10 ans : 0.1%/an (frais de registre)\n• 10 ans : 50% au Trésor\n• 50 ans : 100% au Trésor\n\n✅ Réactivation INSTANTANÉE si tu reviens.\n\nCe n\'est PAS du brûlage : c\'est du GEL.',
      suggestions: ['Les 6 cases', 'Le prix'],
    },
  },

  // ===== PRIX =====
  {
    id: 'borb_price',
    keywords: ['prix', 'valeur', 'trajectoire', 'combien', 'usd', 'or', 'once', 'combien vaut'],
    category: 'borb',
    icon: '📈',
    response: {
      title: 'Trajectoire du prix BORB',
      content: 'Le prix du BORB n\'est pas une promesse : c\'est une mesure.\n\n• Le régulateur fixe le prix à partir de la demande réelle sur la masse en circulation.\n• Le moteur capte le cours de l\'or et des devises chez ses sources, calcule une médiane et écarte les valeurs farfelues.\n• Le coffre affiche le prix courant avec sa source et depuis quand il a été capté ; hors-ligne, c\'est la dernière valeur reçue qui est resservie, et l\'app le dit.\n\nPersonne ne peut garantir un prix futur : les chiffres qui circulent (« 10 USD en 2030 », « 100 USD en 2040 ») ne sont pas une donnée de la plateforme. Ils ont été retirés d\'ici parce qu\'aucun moteur ne les produit.',
      suggestions: ['Les 6 unités', 'Pourquoi garder'],
    },
  },

  // ===== FRAIS =====
  {
    id: 'borb_fees',
    keywords: ['frais', 'commission', 'fee', '0.1%', 'transaction', 'coût', 'cout'],
    category: 'borb',
    icon: '💸',
    response: {
      title: 'Frais de transaction',
      content: 'Les frais sont de 0.1% par transaction.\n\nRépartition automatique :\n• 30% au Trésor\n• 15% aux Frais\n• 15% aux Récompenses\n• 10% à l\'Épargne\n• 15% au Crédit\n• 15% au Bouclier\n\nLes frais financent l\'infrastructure et les validateurs.',
      suggestions: ['Les 6 cases', 'Comment gagner'],
    },
  },
  // ===== GUIDE — DEVENIR RICHE =====
  {
    id: 'how_to_get_rich',
    keywords: ['riche', 'richesse', 'argent', 'fortune', 'prosperer', 'reussir', 'gagner beaucoup', 'devenir riche'],
    category: 'guide',
    icon: '🏆',
    response: {
      title: 'Comment devenir riche avec UQ',
      content: 'Pour devenir riche avec UQ, voici les 4 stratégies :\n\n1. 🏪 DÉBUTANT (10 BORB/mois)\n   → UBI quotidien + vendre 1 produit/semaine\n\n2. 💼 INTERMÉDIAIRE (100 BORB/mois)\n   → Studio + 10 produits + contenu + parrainage\n\n3. 🏢 ENTREPRENEUR (1 000 BORB/mois)\n   → Entreprise + employés + production en série\n\n4. 💰 INVESTISSEUR (10 000 BORB/mois)\n   → Épargne + prêts + trading + entreprises\n\n💡 COMMENCE PETIT, RÉGULIER, PATIENT.\nLa richesse vient avec le temps.',
      suggestions: ['Les 12 méthodes', 'Créer du contenu', 'Faire du trading', 'Trajectoire de richesse'],
    },
  },

  {
    id: 'twelve_methods_earn',
    keywords: ['12 methodes', 'gagner borb', 'gagner borb', 'sources revenus', 'comment gagner', '12 facons'],
    category: 'guide',
    icon: '💰',
    response: {
      title: 'Les 12 méthodes pour gagner des BORB',
      content: '1. 🌾 UBI quotidien (2 points/jour)\n2. 🏪 Vendre des produits (Zando)\n3. 🔧 Proposer des services\n4. 🎵 Créer du contenu (Lecteur UQ)\n5. 📡 Vendre ta connexion (Starlink/4G)\n6. 🚗 Devenir livreur\n7. 🤝 Parrainer des amis\n8. 💱 Trader (P2P Exchange)\n9. 💳 Devenir Marketer\n10. 🏢 Créer une entreprise\n11. 🏆 Relever les défis\n12. 💤 Épargner intelligemment\n\n💡 COMMENCE PAR L\'UBI (facile)\nPUIS VENDS UN PRODUIT (rapide)\nPUIS CRÉE DU CONTENU (passif)\nPUIS INVESTIS (long terme)',
      suggestions: ['Comment créer du contenu', 'Comment faire du trading', 'Devenir Marketer'],
    },
  },

  {
    id: 'create_content',
    keywords: ['contenu', 'creer contenu', 'musique', 'video', 'cours', 'livre', 'podcast', 'creer musique', 'creer video'],
    category: 'guide',
    icon: '🎨',
    response: {
      title: 'Comment créer du contenu',
      content: '4 types de contenu à créer :\n\n1. 🎵 MUSIQUE\n   → Enregistre ta chanson\n   → Publie sur le Lecteur UQ\n   → Fixe ton prix par seconde\n   → 90% pour toi !\n\n2. 🎬 VIDÉOS\n   → Tourne ta vidéo\n   → Publie sur le Lecteur UQ\n   → Paiement à la seconde\n\n3. 📚 COURS\n   → Prépare ton cours\n   → Publie sur le Lecteur UQ\n   → 90% pour toi\n\n4. 📖 LIVRES\n   → Écris ton livre\n   → Format PDF/EPUB\n   → 90% pour toi\n\n💰 EXEMPLE :\n1 chanson = 180 borb\n1 000 écoutes = 16.2 BORB\n10 000 écoutes = 162 BORB',
      suggestions: ['Comment gagner des BORB', 'Faire du trading', 'Devenir riche'],
    },
  },

  {
    id: 'trading_guide',
    keywords: ['trading', 'trader', 'acheter bas', 'vendre haut', 'exchange', 'p2p', 'strategie trading', 'arbitrage', 'hodl', 'day trading'],
    category: 'guide',
    icon: '💱',
    response: {
      title: 'Comment faire du trading',
      content: 'Trader sur UQ se fait avec des paires USD / devise, alimentées par l\'oracle.\n\n📈 DANS TRADING\n• Onglet Marché : chaque ligne affiche la paire, le prix « 1 USD en devise » et les transactions sur 24 h\n• Choisis Acheter ou Vendre, puis le type :\n   → Au marché : exécution immédiate au prix de l\'oracle\n   → Limite : ton prix, avec fonds immobilisés jusqu\'à exécution\n• Confirme avec ton code PIN\n• Onglet Ordres : un ordre limite encore ouvert peut être annulé, les fonds immobilisés reviennent\n\n🔄 P2P MOBILE\nÉchange de devise contre mobile money entre utilisateurs : les fonds sont réservés, l\'acheteur paie puis confirme, le vendeur vérifie et libère.\n\n⛔ Le BORB et le BORB ne sont pas des paires de trading. La réserve BORB s\'échange dans le Coffre ; la devise obtenue peut ensuite se vendre.\n\n⚠️ Le prix vient de l\'oracle et bouge en direct : commence petit et ne risque que ce que tu peux perdre.',
      suggestions: ['Comment repérer le marché vite ?', 'Comment vendre en P2P ?', 'Comment vendre du BORB ?', 'Quelles devises puis-je utiliser ?'],
    },
  },

  {
    id: 'richness_trajectory',
    keywords: ['trajectoire', 'richesse', 'evolution prix', 'prix futur', 'combien vaut', 'projection'],
    category: 'guide',
    icon: '📈',
    response: {
      title: 'Trajectoire de richesse UQ',
      content: 'Ce que la plateforme sait mesurer, et ce qu\'elle ne promet pas.\n\n✅ RÉEL :\n• Le prix courant du BORB, publié par le régulateur et la capture or\n• Les frais réellement appliqués à chaque mouvement\n• L\'UBI, les gains d\'épargne et les revenus Zando, tous calculés par le moteur\n\n❌ NON GARANTI :\n• Aucun prix futur. Les tableaux « année 1 : 1 USD, année 5 : 10 USD, année 20 : 1 000 USD » n\'ont jamais été produits par un calcul de la plateforme.\n\nLa seule richesse certaine ici, c\'est l\'usage : envoyer, convertir, vendre. Le prix suit l\'usage, il ne le précède pas.',
      suggestions: ['Comment devenir riche', 'Épargner intelligemment', 'Faire du trading'],
    },
  },

  {
    id: 'become_marketer',
    keywords: ['marketer', 'ambassadeur', 'compte business', 'formation uq', '9 conditions', 'devenir marketer'],
    category: 'guide',
    icon: '💳',
    response: {
      title: 'Devenir Marketer UQ',
      content: 'Le statut Marketer n\'est pas encore ouvert dans l\'application : aucun écran, aucun bouton et aucune route ne permet de le demander aujourd\'hui.\n\n📋 CE QUE LE BACKEND PRÉVOIT\n• Identité vérifiée, ancienneté du compte, transactions réussies\n• Réputation suffisante et réserve de sécurité\n• Aucun litige ni sanction en cours\n• Téléphone vérifié et engagement signé\n\n⚠️ Ces conditions existent dans le code, mais l\'activation n\'est pas exposée : aucun avantage Marketer n\'est actif aujourd\'hui. Méfie-toi des promesses contraires.\n\n✅ LE VRAI CHEMIN POUR MONTER :\n1. Profil complet (pseudo, numéro mobile money, opérateur)\n2. Code PIN configuré\n3. Dossier d\'identité vérifié\n4. Coffre déverrouillé\n\n💡 Ensuite, fais vivre ton compte : offre Zando en ligne, interactions, historique de commandes.',
      suggestions: ['Comment vérifier mon identité ?', 'Comment monter de niveau ?', 'Comment trader sur UQ ?', 'Comment gagner des BORB ?'],
    },
  },

  {
    id: 'saving_guide',
    keywords: ['epargner', 'epargne', 'interet', 'rendement', 'geler', 'placer', 'investir'],
    category: 'guide',
    icon: '💤',
    response: {
      title: 'Épargner intelligemment',
      content: '📊 DURÉES ET RENDEMENTS :\n\n• 3 mois : 1%/an\n• 1 an : 2%/an\n• 3 ans : 3%/an\n• 5 ans : 4%/an\n• 10 ans : 5%/an\n• 50 ans : 6%/an\n\n💰 COMMENT :\n1. Ouvre le Coffre 💼\n2. Clique [ GELER ]\n3. Choisis le montant\n4. Choisis la durée\n5. Confirme\n\n📈 EXEMPLE :\n100 BORB sur 10 ans à 5%/an\n→ Valeur finale : 162 BORB\n+ La valeur du BORB qui monte\n\n💡 Plus tu épargnes longtemps, plus tu gagnes.',
      suggestions: ['Trajectoire de richesse', 'Devenir riche', 'Comment gagner des BORB'],
    },
  },
  // ===== LES 6 CASES — DÉTAIL COMPLET =====
  {
    id: 'cases_overview',
    keywords: ['6 cases', 'six cases', 'les cases', 'cases economiques', 'repartition', 'tresor frais recompenses', 'vue ensemble cases'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'Les 6 Cases économiques — Vue d\'ensemble',
      content: 'Les 40 milliards de BORB sont répartis en 6 Cases :\n\n💰 Trésor : 77.8% → UBI + conversion bulles\n💸 Frais : 5.6% → Infrastructure\n🏆 Récompenses : 5.6% → Motivation\n❄️ Épargne : 5.6% → Gel + rareté\n💳 Crédit : 3.3% → Prêts\n🛡️ Bouclier : 2.2% → Protection\n\n🔄 CYCLE ÉTERNEL :\nTrésor distribue → utilisateurs dépensent → Frais reviennent → Trésor se recharge → RIEN n\'est perdu.\n\nPose-moi une question sur une case précise !',
      suggestions: ['Le Trésor', 'Les Frais', 'Les Récompenses', 'L\'Épargne', 'Le Crédit', 'Le Bouclier'],
    },
  },

  {
    id: 'case_treasury',
    keywords: ['tresor', 'trésor', 'case 1', 'ubi', 'distribution', 'revenu de base', 'conversion bulles'],
    category: 'borb',
    icon: '💰',
    response: {
      title: '💰 Le Trésor (77.8% — 31 120 000 000 BORB)',
      content: 'Le Trésor est le CŒUR du système.\n\n📋 RÔLE :\n• Distribue l\'UBI (2 points/jour d\'activité)\n• Convertit les Bulles en BORB (100 bulles = 1 borb)\n• Reçoit les BORB recyclés (comptes inactifs)\n• Alimente les autres cases si besoin\n\n⚠️ PLANCHER DE SÉCURITÉ : 6 MILLIARDS BORB\nSi le Trésor descend sous 6 Mrd :\n→ L\'UBI est mis en pause\n→ Les frais sont réorientés à 80% vers le Trésor\n→ Le système se RÉTABLIT automatiquement\n\n💡 Sans le Trésor : pas d\'UBI, pas de conversion, l\'économie s\'effondre.',
      suggestions: ['Les Frais', 'Les Récompenses', 'Comment gagner des BORB'],
    },
  },

  {
    id: 'case_fees',
    keywords: ['frais', 'case 2', 'commission', 'fee', 'infrastructure', 'validateurs', 'relais'],
    category: 'borb',
    icon: '💸',
    response: {
      title: '💸 Les Frais (5.6% — 2 240 000 000 BORB)',
      content: 'Les Frais alimentent le système.\n\n📋 RÔLE :\n• Récupèrent 0.1% de chaque transaction\n• Rechargent les 6 Cases\n• Rémunèrent les validateurs et relais\n\n📊 TAUX PAR TYPE :\n• Transfert BORB : 0.1%\n• Marketplace : 1%\n• Lecteur UQ : 10%\n• Starlink : 10%\n• Prêts : 2%\n\n🔄 DISTRIBUTION :\n• 30% → Trésor\n• 40% → Validateurs\n• 30% → Relais P2P\n• 0% → JAMAIS BRÛLÉ\n\n⚠️ SEUIL CRITIQUE : 224 MILLIONS BORB (10%)\nSi les Frais baissent sous 224M → Le Trésor renfloue automatiquement.',
      suggestions: ['Le Trésor', 'Le Crédit', 'Comment gagner des BORB'],
    },
  },

  {
    id: 'case_rewards',
    keywords: ['recompenses', 'récompenses', 'case 3', 'motivation', 'parrainage', 'defis', 'createurs', 'badges'],
    category: 'borb',
    icon: '🏆',
    response: {
      title: '🏆 Les Récompenses (5.6% — 2 240 000 000 BORB)',
      content: 'Les Récompenses motivent l\'activité.\n\n📋 TYPES :\n\n🤝 PARRAINAGE :\n• 1 BORB par filleul actif\n• 0.5 BORB par filleul de filleul\n• Récompense en cascade (3 niveaux)\n\n🏆 DÉFIS DE QUARTIER :\n• "100 transactions ce mois" → 10 BORB\n• "10 nouvelles boutiques" → 5 BORB par boutique\n\n🎨 CRÉATEURS :\n• Musiciens : 90% des gains du Lecteur UQ\n• Vendeurs : badges et réputation\n• Formateurs : récompenses de transmission\n\n🫧 BULLES :\n• Activité quotidienne → bulles\n• Bulles converties en BORB\n\n🔄 ADAPTATION AUTOMATIQUE :\n• Si activité baisse → récompenses AUGMENTENT\n• Si activité forte → récompenses RÉDUISENT',
      suggestions: ['Le Trésor', 'Comment gagner des BORB', 'Parrainer des amis'],
    },
  },

  {
    id: 'case_savings',
    keywords: ['epargne', 'épargne', 'case 4', 'gel', 'rareté', 'contrat', 'interet', 'rendement'],
    category: 'borb',
    icon: '❄️',
    response: {
      title: '❄️ L\'Épargne (5.6% — 2 240 000 000 BORB)',
      content: 'L\'Épargne gèle les BORB.\n\n📋 RÔLE :\n• Retire les BORB de la circulation\n• Crée la rareté (prix monte)\n• Récompense les épargnants\n• Protège les fortunes\n\n📊 CONTRATS :\n• 3 mois : 1%/an\n• 1 an : 2%/an\n• 3 ans : 3%/an\n• 5 ans : 4%/an\n• 10 ans : 5%/an\n• 50 ans : 6%/an (transmission)\n\n❄️ GEL PROGRESSIF DES INACTIFS :\n• 1 an : rappel (0% touché)\n• 2 ans : 10% gelés\n• 5 ans : 50% gelés\n• 10 ans : 50% au Trésor\n• 50 ans : 100% au Trésor\n\n💡 RENDEMENT :\nRendement = intérêts du crédit / total épargne\nPas de création monétaire — l\'économie réelle finance.',
      suggestions: ['Le Crédit', 'Épargner intelligemment', 'Le Trésor'],
    },
  },

  {
    id: 'case_credit',
    keywords: ['credit', 'crédit', 'case 5', 'pret', 'prêt', 'micro-credit', 'dette', 'emprunt', 'decouvert'],
    category: 'borb',
    icon: '💳',
    response: {
      title: '💳 Le Crédit (3.3% — 1 320 000 000 BORB)',
      content: 'Le Crédit prête.\n\n📋 TYPES DE PRÊTS :\n\n🔹 MICRO-CRÉDIT :\n• 1-50 BORB\n• Durée : 1-6 mois\n• Taux : 2-5%\n\n🔹 CRÉDIT ENTREPRISE :\n• 50-500 BORB\n• Durée : 6-24 mois\n• Garantie requise\n\n🔹 CRÉDIT COMMUNAUTAIRE :\n• Les voisins garantissent\n• Réputation collective\n• Taux réduit (2%)\n\n⚠️ LE BORB NÉGATIF (DETTES) :\nQuand on emprunte, le solde devient négatif :\n• Découvert normal : -5 BORB\n• Découvert Marketer : -50 BORB\n• Prélèvement AUTOMATIQUE sur les revenus\n• Garanties nanties (épargne bloquée)\n• Pardon via le Bouclier (50 ans)\n\n🛡️ GARANTIES :\n• Caution : 50 bulles gelées\n• Garantie : biens enregistrés\n• Fonds de garantie : 10% des frais',
      suggestions: ['Emprunter', 'Le Bouclier', 'L\'Épargne'],
    },
  },

  {
    id: 'case_shield',
    keywords: ['bouclier', 'case 6', 'protection', 'urgence', 'aide', 'pardon', 'cle perdue', 'solidarite'],
    category: 'borb',
    icon: '🛡️',
    response: {
      title: '🛡️ Le Bouclier (2.2% — 840 000 000 BORB)',
      content: 'Le Bouclier protège.\n\n📋 TYPES DE PROTECTION :\n\n🔐 CLÉ PERDUE :\n• Vérification identité renforcée\n• Récupération via Shamir (3/5)\n• Aide jusqu\'à 50% du solde\n\n🚨 URGENCE :\n• Maladie grave → aide immédiate\n• Catastrophe → aide collective\n• Le quartier contribue\n\n🤝 ENTRAIDE :\n• Déclaration de besoin\n• Vote de la communauté\n• Distribution si approuvé\n\n🛡️ PROTECTION SOCIALE :\n• Personnes âgées\n• Familles en difficulté\n• Priorité aux plus vulnérables\n\n💚 PARDON DES DETTES :\n• Après 50 ans d\'impossibilité de rembourser\n• Le Bouclier PARDONNE la dette\n• L\'utilisateur est LIBÉRÉ\n• Personne n\'est ÉCRASÉ',
      suggestions: ['Utiliser le Bouclier', 'Le Crédit', 'La Sécurité'],
    },
  },

  {
    id: 'case_cycle',
    keywords: ['cycle', 'boucle', 'circulation', 'comment ca marche', '6 cases cycle', 'passerelles'],
    category: 'borb',
    icon: '🔄',
    response: {
      title: '🔄 Le cycle éternel des 6 Cases',
      content: 'COMMENT LES 6 CASES SE NOURRISSENT :\n\n1. 💰 Trésor distribue (UBI, bulles)\n2. 👥 Utilisateurs dépensent\n3. 💸 Frais reviennent (30% au Trésor)\n4. ❄️ Épargne gèle (rareté → prix ↑)\n5. 💳 Crédit prête (intérêts → épargne)\n6. 🛡️ Bouclier protège (confiance)\n7. 🔄 Recyclage (10/50 ans → Trésor)\n\n🔗 PASSERELLES :\n• Trésor → Frais : si Frais < 224M\n• Trésor → Bouclier : si épuisé\n• Trésor → Crédit : si défauts\n• Épargne → Crédit : liquidité\n• Frais → Fonds de garantie (10%)\n\n♾️ LE CYCLE EST INFINI :\nDistribution → Dépense → Frais → Retour → Gèle → Prêt → Protection → Recyclage → Distribution → ∞\n\n💡 RIEN N\'EST JAMAIS DÉTRUIT. Zéro brûlage.',
      suggestions: ['Le Trésor', 'Le Recyclage', 'Comment gagner des BORB'],
    },
  },
  // ===== FAQ — COMPTE =====
  {
    id: 'faq_create_account',
    keywords: ['creer un compte', 'créer un compte', 'comment creer', 'inscription', 'ouvrir un compte', 'nouveau compte'],
    category: 'faq',
    icon: '👤',
    response: {
      title: 'Comment créer un compte UQ',
      content: '1. Ouvre l\'application\n2. Remplis le formulaire :\n   • Prénom, Nom\n   • Date de naissance\n   • Pays, Adresse\n   • Téléphone\n   • Mot de passe\n3. Vérifie ton téléphone par SMS\n4. Reçois ton pseudo UQ (uq@jean), ton numéro (UQ-00000001) et ton email (jean@ufundi.uq)\n\n🎁 Bienvenue dans la famille UQ !',
      suggestions: ['Se connecter', 'Oubli mot de passe', 'Supprimer compte'],
    },
  },
  {
    id: 'faq_forgot_password',
    keywords: ['oubli mot de passe', 'oublié mot de passe', 'mot de passe perdu', 'recuperer mot de passe', 'reinitialiser'],
    category: 'faq',
    icon: '🔑',
    response: {
      title: 'J\'ai oublié mon mot de passe',
      content: 'Utilise la récupération Shamir 3/5 :\n\n→ 3 fragments sur 5 suffisent\n→ Contacte tes guardians\n→ Ou utilise ta biométrie\n\n💡 La biométrie est la méthode la plus rapide si elle est activée.',
      suggestions: ['Shamir 3/5', 'Biométrie', 'Contacter support'],
    },
  },
  {
    id: 'faq_lost_2fa',
    keywords: ['perdu 2fa', '2fa perdu', 'code 2fa', 'recuperer 2fa', '2fa perdue'],
    category: 'faq',
    icon: '🔐',
    response: {
      title: 'J\'ai perdu mon 2FA',
      content: 'Utilise la récupération de compte :\n\n1. Vérification d\'identité renforcée\n2. Biométrie\n3. Contacte le support\n\n📧 support@ufundi.uq\n⏱️ Délai : 24-48h',
      suggestions: ['Contacter support', 'Biométrie', 'Sécurité'],
    },
  },
  {
    id: 'faq_change_pseudo',
    keywords: ['changer pseudo', 'modifier pseudo', 'changer nom', 'pseudo uq', 'changer identifiant'],
    category: 'faq',
    icon: '✏️',
    response: {
      title: 'Comment changer mon pseudo UQ',
      content: 'Le pseudo UQ est UNIQUE et PERMANENT.\n\n→ Impossible de le changer\n→ Crée un nouveau compte si nécessaire\n\n💡 Ton pseudo fait partie de ton identité UQ.',
      suggestions: ['Créer un compte', 'Supprimer compte'],
    },
  },
  {
    id: 'faq_multiple_accounts',
    keywords: ['plusieurs comptes', 'multi comptes', 'deux comptes', 'double compte'],
    category: 'faq',
    icon: '🚫',
    response: {
      title: 'Puis-je avoir plusieurs comptes ?',
      content: 'NON, un seul compte par personne.\n\n→ Un compte = une identité\n→ C\'est pour la sécurité de tous\n→ Le double compte entraîne la fermeture',
      suggestions: ['Sécurité', 'Conditions'],
    },
  },
  {
    id: 'faq_delete_account',
    keywords: ['supprimer compte', 'fermer compte', 'effacer compte', 'delete account'],
    category: 'faq',
    icon: '🗑️',
    response: {
      title: 'Comment supprimer mon compte',
      content: 'Paramètres → Compte → Supprimer\n\n⚠️ CONSÉQUENCES :\n• Les fonds sont retournés au Trésor\n• Les données sont conservées 30 jours\n• Puis effacement définitif\n• Impossible de recréer avec les mêmes infos',
      suggestions: ['Conditions', 'Fermeture de compte'],
    },
  },

  // ===== FAQ — SÉCURITÉ =====
  {
    id: 'faq_activate_pin',
    keywords: ['activer pin', 'configurer pin', 'code pin', 'pin securite'],
    category: 'faq',
    icon: '🔢',
    response: {
      title: 'Comment activer le PIN',
      content: 'Paramètres → Sécurité → PIN\n\n1. Choisis un code à 4-6 chiffres\n2. Confirme\n3. Le PIN protège tes transactions\n\n⚠️ N\'utilise PAS :\n• Ta date de naissance\n• 123456\n• Des chiffres répétés',
      suggestions: ['Biométrie', '2FA', 'Sécurité'],
    },
  },
  {
    id: 'faq_phone_stolen',
    keywords: ['telephone vole', 'tel vole', 'vole mon tel', 'perdu telephone', 'stolen phone'],
    category: 'faq',
    icon: '🚨',
    response: {
      title: 'Mon téléphone a été volé',
      content: 'URGENCE ! Fais ces 4 étapes :\n\n1. Connecte-toi depuis un autre appareil\n2. Change IMMÉDIATEMENT ton mot de passe\n3. Révoque toutes les sessions\n4. Contacte le support\n\n📧 urgences@ufundi.uq (délai 2h)\n\n🛡️ Tes fonds peuvent être gelés temporairement.',
      suggestions: ['Contacter support', 'Sécurité', 'Biométrie'],
    },
  },
  {
    id: 'faq_activate_biometric',
    keywords: ['activer biometrie', 'biométrie', 'empreinte', 'reconnaissance faciale', 'face id'],
    category: 'faq',
    icon: '🫆',
    response: {
      title: 'Comment activer la biométrie',
      content: 'Paramètres → Sécurité → Biométrie\n\n1. Empreinte digitale OU reconnaissance faciale\n2. Scanne ton doigt ou ton visage\n3. Confirme\n\n✅ Utilisation :\n• À la connexion\n• Pour les transactions importantes\n• Pour la récupération',
      suggestions: ['PIN', '2FA', 'Sécurité'],
    },
  },
  {
    id: 'faq_private_conversations',
    keywords: ['conversations privees', 'messages prives', 'uq voit messages', 'chiffrement', 'prive'],
    category: 'faq',
    icon: '🔒',
    response: {
      title: 'UQ peut-il voir mes conversations ?',
      content: 'NON. Tes conversations privées restent PRIVÉES.\n\n✅ Chiffrement de bout en bout\n✅ Personne ne peut les lire\n✅ Même pas UQ\n✅ Restent privées',
      suggestions: ['Sécurité', 'Confidentialité', 'Vie privée'],
    },
  },
  {
    id: 'faq_activate_2fa',
    keywords: ['activer 2fa', '2fa', 'double authentification', 'two factor'],
    category: 'faq',
    icon: '🔐',
    response: {
      title: 'Comment activer la 2FA',
      content: 'Paramètres → Sécurité → 2FA\n\n1. Email UQ\n2. Mot de passe 2FA\n3. Code de vérification\n4. Confirme\n\n✅ Utilisation :\n• À chaque connexion\n• Code auto-généré\n• Valable 30 secondes',
      suggestions: ['PIN', 'Biométrie', 'Sécurité'],
    },
  },

  // ===== FAQ — BORB =====
  {
    id: 'faq_borb_value',
    keywords: ['combien vaut', 'valeur borb', 'prix borb', 'cours borb', '1 borb'],
    category: 'faq',
    icon: '💰',
    response: {
      title: 'Combien vaut 1 BORB ?',
      content: '1 BORB vaut le prix que le moteur publie à la seconde où tu poses la question — pas une valeur écrite dans l\'application.\n\n📈 D\'OÙ VIENT CE PRIX :\n• Le régulateur, à partir de la demande réelle sur la masse en circulation\n• La capture du cours de l\'or chez les sources interrogées\n\n📊 OÙ LE LIRE :\n• Le coffre affiche le prix courant, sa source et son âge\n• Si le réseau est coupé, la dernière valeur captée reste appliquée et l\'app le signale\n\nLes anciennes « trajectoires » (1 USD, puis 10, puis 100) étaient des fantasmes marketing : elles ne venaient d\'aucun calcul et ont été supprimées.',
      suggestions: ['Comment gagner', 'Trajectoire de richesse', 'Les 6 unités'],
    },
  },
  {
    id: 'faq_earn_borb',
    keywords: ['gagner borb', 'gagner borb', 'comment gagner', 'sources revenus', 'faire de l argent'],
    category: 'faq',
    icon: '🌾',
    response: {
      title: 'Comment gagner des BORB',
      content: 'Plusieurs façons :\n\n🌾 UBI quotidien (2 points/jour)\n🏪 Vendre des produits\n🔧 Proposer des services\n🎵 Créer du contenu (Lecteur UQ)\n📡 Vendre ta connexion\n🚗 Devenir livreur\n🤝 Parrainer des amis\n💱 Trader\n💳 Devenir Marketer\n💤 Épargner',
      suggestions: ['Les 12 méthodes', 'Devenir riche', 'Créer du contenu'],
    },
  },
  {
    id: 'faq_why_40_billion',
    keywords: ['pourquoi 40 milliards', '40 milliards', 'masse fixe', 'total borb'],
    category: 'faq',
    icon: '💎',
    response: {
      title: 'Pourquoi 40 milliards ?',
      content: 'C\'est la masse FIXE pour l\'éternité.\n\n✅ JAMAIS créé\n✅ JAMAIS brûlé\n✅ JAMAIS modifié\n✅ 40 milliards POUR TOUJOURS\n\n💡 Assez pour couvrir la dépense mondiale (~40 Mrd USD/jour)\nAssez rare pour prendre de la valeur',
      suggestions: ['Les 6 unités', 'Les 6 cases', 'Le prix'],
    },
  },
  {
    id: 'faq_borb_disappear',
    keywords: ['borb disparait', 'disparaitre borb', 'perdu borb', 'brulage borb', 'destroyed'],
    category: 'faq',
    icon: '♾️',
    response: {
      title: 'Le BORB peut-il disparaître ?',
      content: 'NON, JAMAIS.\n\n✅ Il tourne dans les 6 Cases\n✅ Zéro brûlage\n✅ Éternel\n✅ Rien ne se perd\n\n💡 Le recyclage ramène les BORB inactifs au Trésor (pas de destruction).',
      suggestions: ['Les 6 cases', 'Recyclage', 'Pourquoi 40 milliards'],
    },
  },
  {
    id: 'faq_convert_units',
    keywords: ['convertir unites', 'conversion', 'changer unite', 'borb borb', 'micro nano'],
    category: 'faq',
    icon: '🔄',
    response: {
      title: 'Comment convertir entre unités',
      content: 'C\'est AUTOMATIQUE.\n\n→ Le système convertit tout seul\n→ Tu vois le montant dans la bonne unité\n→ Pas de calcul manuel\n\n📊 6 UNITÉS :\n• BORB (entier)\n• borb (centime)\n• mborb (micro)\n• nborb (nano)\n• pborb (pico)\n• fborb (femto)',
      suggestions: ['Les 6 unités', 'Les 6 cases'],
    },
  },
  {
    id: 'faq_6_units',
    keywords: ['6 unites', 'six unites', 'les unites', 'borb borb mborb', 'unites fractales'],
    category: 'faq',
    icon: '💱',
    response: {
      title: 'Quelles sont les 6 unités ?',
      content: '1. BORB (BORB) : l\'entier = 1\n2. borb (FIXO) : le centime = 0.0001\n3. mborb (MICRO) : le micro = 0.000001\n4. nborb (NANO) : le nano = 0.00000001\n5. pborb (PICO) : le pico = 0.0000000001\n6. fborb (FEMTO) : le femto = 0.000000000001\n\n💡 1 BORB = 1 billion de fborb\n\n🧬 EXTENSION FRACTALE automatique quand fborb > 0.001 USD',
      suggestions: ['Convertir', 'Les 6 cases'],
    },
  },

  // ===== FAQ — TRANSACTIONS =====
  {
    id: 'faq_fees',
    keywords: ['frais', 'frais transaction', 'commission', 'combien de frais', 'fee'],
    category: 'faq',
    icon: '💸',
    response: {
      title: 'Quels sont les frais ?',
      content: '0.1% par transaction.\n\n📊 EXEMPLE :\n• 5 BORB → 0.005 BORB de frais\n• 100 BORB → 0.1 BORB de frais\n\n🔄 DISTRIBUTION :\n• 30% Trésor\n• 40% Validateurs\n• 30% Relais P2P\n• 0% Brûlé',
      suggestions: ['Les Frais', 'Transactions', 'Vitesse'],
    },
  },
  {
    id: 'faq_transfer_speed',
    keywords: ['vitesse transfert', 'combien de temps', 'duree transaction', 'delai transfert', 'instantane'],
    category: 'faq',
    icon: '⚡',
    response: {
      title: 'Combien de temps prend un transfert ?',
      content: 'INSTANTANÉ (moins de 1 seconde).\n\n✅ Transaction immédiate\n✅ Pas de délai\n✅ Confirmation instantanée\n✅ Notification immédiate au destinataire',
      suggestions: ['Envoyer BORB', 'Frais', 'Transactions'],
    },
  },
  {
    id: 'faq_cancel_transaction',
    keywords: ['annuler transaction', 'annulation', 'annuler envoi', 'reverse', 'cancel'],
    category: 'faq',
    icon: '🚫',
    response: {
      title: 'Puis-je annuler une transaction ?',
      content: 'NON, une fois confirmée, elle est DÉFINITIVE.\n\n⚠️ Vérifie AVANT de confirmer :\n• Le destinataire\n• Le montant\n• Le message\n\n💡 En cas d\'erreur, contacte directement le destinataire.',
      suggestions: ['Erreur destinataire', 'Envoyer BORB'],
    },
  },
  {
    id: 'faq_wrong_recipient',
    keywords: ['erreur destinataire', 'mauvais destinataire', 'trompe destinataire', 'wrong recipient'],
    category: 'faq',
    icon: '❓',
    response: {
      title: 'Que faire si je me trompe de destinataire ?',
      content: 'Contacte la personne.\n\n1. Si elle accepte → elle peut te renvoyer les BORB\n2. Sinon → contacte le support\n\n📧 support@ufundi.uq\n⏱️ Délai : 24-48h',
      suggestions: ['Contacter support', 'Envoyer BORB'],
    },
  },
  {
    id: 'faq_limits',
    keywords: ['limites transaction', 'plafond', 'limite envoi', 'max transfert', 'limite journaliere'],
    category: 'faq',
    icon: '📊',
    response: {
      title: 'Y a-t-il des limites ?',
      content: 'Oui, selon ton KYC.\n\n📊 LIMITES :\n• Limites journalières\n• Limites par transaction\n• Selon ton niveau de vérification\n\n💡 Plus ton KYC est élevé, plus tes limites sont hautes.',
      suggestions: ['KYC', 'Transactions', 'Sécurité'],
    },
  },
  {
    id: 'faq_history',
    keywords: ['historique', 'voir transactions', 'historique transactions', 'mes envois', 'history'],
    category: 'faq',
    icon: '📜',
    response: {
      title: 'Comment voir mon historique',
      content: '1. Ouvre le Coffre 💼\n2. Clique [ TRANSACTIONS ]\n\n📊 TU VOIS :\n• Date et heure\n• Type (envoi/reçu)\n• Montant\n• Destinataire/Expéditeur\n• Statut\n\n💡 Filtrable par date et type.',
      suggestions: ['Envoyer BORB', 'Recevoir BORB'],
    },
  },

  // ===== FAQ — ZANDO =====
  {
    id: 'faq_sell_zando',
    keywords: ['vendre zando', 'comment vendre', 'publier produit', 'mettre en vente', 'sell'],
    category: 'faq',
    icon: '🏪',
    response: {
      title: 'Comment vendre sur Zando',
      content: '1. Clique sur ➕ (Studio UQ)\n2. Choisis "Je vends"\n3. Remplis le formulaire\n4. L\'IA pré-remplit tout\n5. Publie en 1 clic\n\n✅ Publication immédiate\n✅ Apparition dans le flux\n✅ Notification aux proches',
      suggestions: ['Acheter', 'Booster studio', 'Durée publication'],
    },
  },
  {
    id: 'faq_publication_duration',
    keywords: ['duree publication', 'combien de temps publication', 'expiration', 'renouveler publication'],
    category: 'faq',
    icon: '📅',
    response: {
      title: 'Combien de temps reste une publication ?',
      content: '30 JOURS par défaut.\n\n✅ Renouvelable\n✅ Relance automatique\n✅ Notification avant expiration\n\n💡 Renouvelle pour rester visible.',
      suggestions: ['Publier Zando', 'Booster'],
    },
  },
  {
    id: 'faq_boost_studio',
    keywords: ['booster studio', 'boost', 'mettre en avant', 'promouvoir', 'visibilite'],
    category: 'faq',
    icon: '⚡',
    response: {
      title: 'Comment booster mon studio',
      content: 'Paie en BORB pour le mettre en avant.\n\n⏱️ Durée : 24h\n📍 Rayon : défini\n🎯 Résultat : +visibilité\n\n💡 Le boost place ton studio en haut du flux pour les utilisateurs proches.',
      suggestions: ['Publier Zando', 'Vendre'],
    },
  },
  {
    id: 'faq_buy_zando',
    keywords: ['acheter', 'comment acheter', 'achat', 'commander', 'buy'],
    category: 'faq',
    icon: '🛒',
    response: {
      title: 'Comment acheter sur Zando',
      content: '1. Parcours le flux\n2. Vois un produit qui te plaît\n3. Clique [ ACHETER ]\n4. Paie en BORB (0% commission)\n   OU en Mobile Money (5%)\n5. Reçois le produit\n\n🔒 Escrow automatique : les fonds sont bloqués jusqu\'à la livraison.',
      suggestions: ['Escrow', 'Vendre', 'P2P'],
    },
  },
  {
    id: 'faq_escrow',
    keywords: ['escrow', 'sequence', 'sequestre', 'fonds bloques', 'protection achat'],
    category: 'faq',
    icon: '🔒',
    response: {
      title: 'Qu\'est-ce que l\'escrow ?',
      content: 'C\'est un SÉQUESTRE.\n\n✅ Les fonds sont BLOQUÉS\n✅ Libérés à la livraison\n✅ Remboursés si problème\n✅ Arbitrage si litige\n\n💡 Protection pour l\'acheteur ET le vendeur.',
      suggestions: ['Acheter', 'Litiges', 'Conditions'],
    },
  },

  // ===== FAQ — P2P =====
  {
    id: 'faq_find_peers',
    keywords: ['trouver pairs', 'pairs p2p', 'scanner peers', 'd2d', 'connexion directe'],
    category: 'faq',
    icon: '📡',
    response: {
      title: 'Comment trouver des pairs',
      content: 'Active le scan D2D.\n\n📡 TECHNOLOGIES :\n• WiFi Direct (200m)\n• Bluetooth (100m)\n• LTE Direct (500m)\n• Mesh (10 sauts)\n\n💡 Fonctionne SANS Internet.',
      suggestions: ['P2P sécurité', 'Sans Internet'],
    },
  },
  {
    id: 'faq_p2p_security',
    keywords: ['p2p securise', 'securite p2p', 'chiffrement p2p', 'securite reseau'],
    category: 'faq',
    icon: '🔐',
    response: {
      title: 'Le P2P est-il sécurisé ?',
      content: 'OUI, chiffrement de bout en bout.\n\n🔐 UqBlackKey (512 bits)\n🛡️ vTEE (environnement isolé)\n🔒 Signature Ed25519\n\n✅ Personne ne peut intercepter\n✅ Anonymat préservé',
      suggestions: ['UqBlackKey', 'Sécurité'],
    },
  },
  {
    id: 'faq_sell_connection',
    keywords: ['vendre connexion', 'partage connexion', 'starlink', '4g', 'point chaud'],
    category: 'faq',
    icon: '🌐',
    response: {
      title: 'Comment vendre ma connexion',
      content: '1. Clique sur ➕\n2. Choisis "Je propose"\n3. Type : Connexion\n4. Fixe ton prix par Mo\n5. Publie\n\n💰 EXEMPLE :\n• 100 Mo = 2 BORB\n• 1 Go = 15 BORB\n• 10 clients/jour = 150 BORB/jour\n\n💡 Avec Starlink ou 4G partagé.',
      suggestions: ['Vendre', 'Comment gagner BORB'],
    },
  },
  {
    id: 'faq_offline',
    keywords: ['sans internet', 'offline', 'hors ligne', 'sans reseau', 'no internet'],
    category: 'faq',
    icon: '📴',
    response: {
      title: 'Puis-je utiliser UQ sans Internet ?',
      content: 'OUI, grâce au P2P.\n\n✅ D2D (direct)\n✅ Mesh (multi-sauts, 10 max)\n✅ Synchronisation hors ligne\n\n💡 Tu peux envoyer des BORB et des messages sans connexion Internet, tant que tu es proche d\'un pair.',
      suggestions: ['Trouver pairs', 'P2P sécurité'],
    },
  },

  // ===== FAQ — RECYCLAGE =====
  {
    id: 'faq_inactive_3_years',
    keywords: ['inactif 3 ans', 'inactif depuis 3 ans', 'compte inactif', 'inactivite'],
    category: 'faq',
    icon: '💤',
    response: {
      title: 'Mon compte est inactif depuis 3 ans',
      content: 'RIEN, la grâce est de 5 ans.\n\n✅ Aucun frais avant 5 ans\n✅ Ton solde est conservé\n✅ Ton compte est actif\n\n💤 RECYCLAGE :\n• 0-5 ans : Grâce (0%)\n• 5-10 ans : 0.1%/an\n• 10 ans : 50% au Trésor\n• 50 ans : 100% au Trésor',
      suggestions: ['Recyclage', 'Récupérer compte'],
    },
  },
  {
    id: 'faq_recover_account',
    keywords: ['recuperer compte', 'reconnecter', 'reactiver compte', 'compte suspendu', 'recover'],
    category: 'faq',
    icon: '🔄',
    response: {
      title: 'Comment récupérer mon compte',
      content: 'Reconnecte-toi.\n\n✅ Réactivation INSTANTANÉE\n✅ Aucune pénalité\n✅ Solde conservé\n✅ Historique préservé\n\n💡 Même après 50 ans d\'inactivité, contacte le support.',
      suggestions: ['Recyclage', 'Se connecter'],
    },
  },
  {
    id: 'faq_after_10_years',
    keywords: ['apres 10 ans', '10 ans inactif', '10 ans', 'recyclage 10 ans'],
    category: 'faq',
    icon: '⏰',
    response: {
      title: 'Que se passe-t-il après 10 ans d\'inactivité ?',
      content: '50% des BORB retournent au Trésor.\n\n📊 DÉTAIL :\n• 50% vont au Trésor\n• 50% restent gelés\n• Tu peux les récupérer en te reconnectant\n\n💡 Réactivation instantanée si tu reviens.',
      suggestions: ['Recyclage', 'Récupérer compte'],
    },
  },
  {
    id: 'faq_after_50_years',
    keywords: ['apres 50 ans', '50 ans inactif', '50 ans', 'cloture compte'],
    category: 'faq',
    icon: '⌛',
    response: {
      title: 'Après 50 ans d\'inactivité ?',
      content: '100% des BORB retournent au Trésor.\n\n⚠️ CONSÉQUENCES :\n• Le compte est clôturé\n• Impossible de récupérer\n• Les BORB sont dans le Trésor\n\n💡 Le Trésor les redistribue via l\'UBI aux utilisateurs actifs.',
      suggestions: ['Recyclage', 'Le Trésor'],
    },
  },

  // ===== FAQ — DETTES =====
  {
    id: 'faq_overdraft',
    keywords: ['decouvert', 'overdraft', 'solde negatif', 'negatif', 'decouvert autorise'],
    category: 'faq',
    icon: '💳',
    response: {
      title: 'Puis-je avoir un découvert ?',
      content: 'OUI, limité.\n\n📊 LIMITES :\n• Normal : -5 BORB\n• Marketer : -50 BORB\n\n⚠️ TON SOLDE DEVIENT NÉGATIF\n→ C\'est une dette envers le Crédit\n→ Prélèvement automatique sur les revenus',
      suggestions: ['Rembourser', 'Le Crédit', 'Emprunter'],
    },
  },
  {
    id: 'faq_repay',
    keywords: ['rembourser', 'remboursement', 'payer dette', 'regler dette', 'repay'],
    category: 'faq',
    icon: '💰',
    response: {
      title: 'Comment rembourser ?',
      content: 'AUTOMATIQUEMENT sur tes revenus.\n\n✅ Dès que tu reçois des BORB\n✅ La dette est prélevée\n✅ Pas d\'action manuelle\n\n💡 Exemple :\nSi tu as -3 BORB de dette\nEt tu reçois 5 BORB\n→ Dette payée, solde = +2 BORB',
      suggestions: ['Découvert', 'Le Crédit'],
    },
  },
  {
    id: 'faq_no_repay',
    keywords: ['pas rembourser', 'dette impayee', 'defaut', 'ne pas payer', 'default'],
    category: 'faq',
    icon: '⚠️',
    response: {
      title: 'Si je ne rembourse pas ?',
      content: 'CONSÉQUENCES :\n\n1. ⚠️ Ta réputation BAISSE\n2. 🔒 Tes garanties sont SAISIES\n3. 💰 Ta caution est CONFISQUÉE\n4. 🛡️ Le Bouclier peut pardonner après 50 ans\n\n💡 Évite le défaut : rembourse dès que possible.',
      suggestions: ['Le Bouclier', 'Réputation', 'Le Crédit'],
    },
  },

  // ===== FAQ — LECTEUR UQ =====
  {
    id: 'faq_reader_principle',
    keywords: ['lecteur uq', 'lecteur', 'comment marche lecteur', 'streaming', 'contenu payant'],
    category: 'faq',
    icon: '🎵',
    response: {
      title: 'Comment fonctionne le Lecteur UQ',
      content: 'Paiement PAR SECONDE.\n\n✅ Le créateur FIXE son prix\n✅ 90% AU CRÉATEUR\n✅ 10% AUX 6 CASES\n\n⏱️ 1 seconde = 1 dernière unité existante\n→ Le créateur est payé en TEMPS RÉEL\n→ Tu paies ce que tu consommes',
      suggestions: ['Créer du contenu', 'Combien gagner'],
    },
  },
  {
    id: 'faq_create_content',
    keywords: ['creer contenu', 'créer du contenu', 'publier contenu', 'musique', 'video', 'cours'],
    category: 'faq',
    icon: '🎨',
    response: {
      title: 'Comment créer du contenu',
      content: '1. Crée ton contenu (musique, vidéo, cours)\n2. Ouvre le Lecteur UQ\n3. Clique sur ➕\n4. Choisis "Créer un contenu"\n5. Télécharge ton fichier\n6. Fixe ton prix par seconde\n7. Publie\n\n💰 TU GAGNES 90%\n📊 Exemple : 1 chanson (3min) = 180 borb par écoute complète',
      suggestions: ['Combien gagner', 'Lecteur UQ'],
    },
  },
  {
    id: 'faq_how_much_earn',
    keywords: ['combien gagner contenu', 'gains createur', 'revenus createur', 'combien puis je gagner'],
    category: 'faq',
    icon: '💰',
    response: {
      title: 'Combien puis-je gagner ?',
      content: 'EXEMPLE AVEC 1 CHANSON (3 min) :\n\n• 1 écoute complète = 180 borb = 0.018 BORB\n• 1 000 écoutes = 16.2 BORB\n• 10 000 écoutes = 162 BORB\n• 100 000 écoutes = 1 620 BORB\n\n💰 90% pour toi, 10% aux 6 Cases\n🚀 Plus ton audience grandit, plus tu gagnes',
      suggestions: ['Créer du contenu', 'Devenir riche'],
    },
  },

  // ===== FAQ — UBI =====
  {
    id: 'faq_ubi',
    keywords: ['ubi', 'revenu de base', 'revenu universel', 'ubi c est quoi', 'base income'],
    category: 'faq',
    icon: '🌾',
    response: {
      title: 'Qu\'est-ce que l\'UBI ?',
      content: 'REVENU DE BASE UNIVERSEL.\n\n✅ 2 points par jour d\'activité\n✅ Converti en BORB\n✅ Revenu de base GARANTI\n✅ Distribué par le Trésor\n\n💡 Pour être éligible, tu dois être ACTIF :\n• Transactions\n• Publications\n• Services',
      suggestions: ['Réclamer UBI', 'Pas éligible'],
    },
  },
  {
    id: 'faq_claim_ubi',
    keywords: ['reclamer ubi', 'claim ubi', 'recevoir ubi', 'demander ubi'],
    category: 'faq',
    icon: '🎁',
    response: {
      title: 'Comment réclamer mon UBI',
      content: '1. Ouvre le Coffre 💼\n2. Clique [ RÉCLAMER UBI ]\n3. Si éligible → animation de succès\n4. L\'UBI est crédité instantanément\n\n⚠️ Tu dois avoir été actif dans les dernières 24h.',
      suggestions: ['Pourquoi pas éligible', 'UBI'],
    },
  },
  {
    id: 'faq_not_eligible_ubi',
    keywords: ['pas eligible ubi', 'pourquoi pas eligible', 'ubi refuse', 'can t claim ubi'],
    category: 'faq',
    icon: '❓',
    response: {
      title: 'Pourquoi je ne peux pas réclamer',
      content: 'Tu dois être ACTIF.\n\n✅ Fais des transactions\n✅ Publie du contenu\n✅ Propose des services\n✅ Achète ou vends\n\n💡 L\'activité est OBLIGATOIRE pour l\'UBI.\nLe Trésor récompense ceux qui participent.',
      suggestions: ['UBI', 'Comment gagner BORB'],
    },
  },

  // ===== FAQ — MARKETER =====
  {
    id: 'faq_marketer',
    keywords: ['marketer', 'c est quoi marketer', 'ambassadeur', 'devenir marketer'],
    category: 'faq',
    icon: '🏆',
    response: {
      title: 'Qu\'est-ce qu\'un Marketer ?',
      content: 'Le Marketer est l\'ambassadeur UQ, mais le statut n\'est pas encore ouvert dans l\'application : aucun écran ni bouton ne permet de le demander aujourd\'hui.\n\n📋 LE BACKEND PRÉVOIT DES CONDITIONS\n• Identité vérifiée, ancienneté du compte, transactions réussies\n• Réputation suffisante et réserve de sécurité\n• Aucun litige ni sanction en cours\n• Téléphone vérifié et engagement signé\n\n⚠️ Tant que l\'activation n\'est pas exposée, aucun privilège Marketer n\'est actif. Méfie-toi des promesses contraires.\n\n✅ EN ATTENDANT, LE CHEMIN UTILE :\nProfil complet, code PIN, identité vérifiée, coffre déverrouillé.',
      suggestions: ['Comment monter de niveau ?', 'Comment vérifier mon identité ?', 'Comment gagner des BORB ?'],
    },
  },
  {
    id: 'faq_become_marketer',
    keywords: ['devenir marketer', 'comment devenir', 'formation uq', '9 conditions'],
    category: 'faq',
    icon: '💳',
    response: {
      title: 'Comment devenir Marketer',
      content: 'Devenir Marketer n\'est pas encore possible dans l\'application : aucune route ni aucun écran ne permet d\'envoyer une demande.\n\n✅ CE QUI EXISTE DÉJÀ ET QUI COMPTE :\n1. Profil complet (pseudo, numéro mobile money, opérateur)\n2. Code PIN configuré\n3. Dossier d\'identité vérifié\n4. Coffre déverrouillé\n\n💡 Ces étapes débloquent déjà le coffre et les plafonds. Aucun avantage Marketer n\'est actif aujourd\'hui.',
      suggestions: ['Comment vérifier mon identité ?', 'Comment monter de niveau ?', 'Comment trader sur UQ ?'],
    },
  },
  {
    id: 'faq_marketer_advantages',
    keywords: ['avantages marketer', 'privileges marketer', 'benefices marketer'],
    category: 'faq',
    icon: '🎁',
    response: {
      title: 'Quels sont les avantages ?',
      content: 'Aucun avantage Marketer n\'est actif aujourd\'hui : le statut n\'est pas encore ouvert dans l\'application.\n\n⚠️ Les listes d\'avantages qui circulent (boutique jour 1, Starlink jour 1, UBI jour 1, bonus de réputation, réduction de frais) ne sont pas disponibles.\n\n✅ CE QUI EST RÉELLEMENT ACCESSIBLE : identité vérifiée, coffre déverrouillé, trading USD / devise, P2P mobile, Studio et marché Zando.\n\n💡 Concentre-toi sur ces fonctions réelles.',
      suggestions: ['Comment vérifier mon identité ?', 'Comment monter de niveau ?', 'Comment vendre sur Zando ?'],
    },
  },
  // ===== CONNEXION =====
  {
    id: 'login_flow',
    keywords: ['connexion', 'se connecter', 'comment se connecter', 'login', 'sign in', 'connexion compte'],
    category: 'guide',
    icon: '🔐',
    response: {
      title: 'Comment se connecter à UQ',
      content: 'La connexion se fait en 7 étapes :\n\n1. 📛 Saisis ton NUMÉRO UQ (UQ-XXXXXXXX)\n2. 🔑 Si tu es propriétaire → code de déblocage 4 chiffres\n3. 📧 Entre ton EMAIL UQ + MOT DE PASSE\n4. 🔢 Code 2FA auto-généré (tu n\'as rien à faire)\n5. 🫆 Biométrie (empreinte ou visage)\n6. ✅ Connexion réussie\n7. 🤖 UQ AI te salue et te montre 5 infos importantes\n\n💡 Pas de nom d\'utilisateur, pas de CAPTCHA, juste ton numéro UQ.',
      suggestions: ['Numéro UQ', 'Code de déblocage', '2FA', 'Biométrie'],
    },
  },
  {
    id: 'login_number',
    keywords: ['numero uq', 'numéro uq', 'mon numero', 'identifiant', 'numero connexion'],
    category: 'guide',
    icon: '📛',
    response: {
      title: 'Ton Numéro UQ',
      content: 'Ton numéro UQ t\'a été donné à la création du compte.\n\n📛 Format : UQ-XXXXXXXX\nExemple : UQ-00000001\n\n💡 C\'est ton SEUL identifiant de connexion.\nPas besoin de nom d\'utilisateur.\n\n📍 Où le trouver ?\n• Email de bienvenue\n• Dans ton profil UQ\n• Ton certificat de création',
      suggestions: ['Se connecter', 'Créer un compte', 'Mot de passe oublié'],
    },
  },
  {
    id: 'login_unlock',
    keywords: ['code deblocage', 'code déblocage', 'code 4 chiffres', 'debloquer', 'unlock', 'proprietaire'],
    category: 'guide',
    icon: '🔑',
    response: {
      title: 'Code de déblocage',
      content: 'Le code de déblocage est RÉSERVÉ au PROPRIÉTAIRE du terminal (UQ-00000001).\n\n🔑 CODE : 4 CHIFFRES\n🔒 CONFIDENTIEL\n\n⚠️ Ce code :\n• Débloque le terminal\n• N\'est demandé qu\'au propriétaire\n• Ne doit JAMAIS être partagé\n\n💡 Si tu es un utilisateur normal, tu passes DIRECTEMENT à l\'étape 2FA.',
      suggestions: ['Se connecter', 'Sécurité', '2FA'],
    },
  },
  {
    id: 'login_2fa',
    keywords: ['2fa', 'email uq', 'mot de passe', 'verification 2fa', 'double authentification'],
    category: 'guide',
    icon: '📧',
    response: {
      title: 'Vérification 2FA',
      content: 'L\'étape 2FA demande :\n\n📧 EMAIL UQ\n→ Celui reçu à la création\n→ Format : tonpseudo@zando.uq ou jean@ufundi.uq\n\n🔑 MOT DE PASSE\n→ Celui créé à l\'inscription\n→ Minimum 8 caractères\n\n⚠️ Si erreur :\n• La bordure devient ROUGE\n• Le tiroir fait un shake\n• Tu peux réessayer\n\n💡 Pas de code SMS — c\'est automatique.',
      suggestions: ['Mot de passe oublié', 'Code 2FA', 'Biométrie'],
    },
  },
  {
    id: 'login_code_auto',
    keywords: ['code 2fa', 'code auto', 'code auto-genere', 'code verification', 'code 6 chiffres'],
    category: 'guide',
    icon: '🔢',
    response: {
      title: 'Code 2FA auto-généré',
      content: 'Après la validation 2FA, un code apparaît SOUS ton numéro UQ.\n\n🔢 CODE : 6 chiffres\n✨ GÉNÉRÉ AUTOMATIQUEMENT\n\n✅ Tu n\'as RIEN à taper\n✅ Le code est déjà rempli\n✅ Tu cliques juste [ VÉRIFIER ]\n\n💡 Des étincelles entourent le code.\nC\'est l\'IA qui génère le code en arrière-plan.',
      suggestions: ['Biométrie', 'Se connecter', '2FA'],
    },
  },
  {
    id: 'login_biometric',
    keywords: ['biometrie', 'biométrie', 'empreinte', 'visage', 'face id', 'fingerprint', 'scanner'],
    category: 'guide',
    icon: '🫆',
    response: {
      title: 'Confirmation biométrique',
      content: 'Dernière étape : la BIOMÉTRIE.\n\n🫆 EMPREINTE DIGITALE\nOU\n👁️ RECONNAISSANCE FACIALE\n\n💡 "Ta touche personnelle suffit."\n\n✅ L\'IA vérifie automatiquement :\n• Anti-fraude\n• Détection de vivacité\n\n💚 Succès → sourire 😊 ou soleil ☀️\nAucun bouton à cliquer.',
      suggestions: ['Se connecter', 'Sécurité', 'Code 2FA'],
    },
  },
  {
    id: 'login_success',
    keywords: ['connexion reussie', 'connecter reussi', 'apres connexion', 'bonjour', 'infos importantes'],
    category: 'guide',
    icon: '✅',
    response: {
      title: 'Connexion réussie',
      content: 'Après la biométrie, tu vois :\n\n✅ IDENTITÉ CONFIRMÉE\n🔮 "Bonjour [Ton prénom]..."\n\n📊 5 INFORMATIONS IMPORTANTES :\n• 💰 Ventes en cours\n• 🐔 Opportunités proches\n• 👤 Demandes de BORB\n• 🎂 Événements à venir\n• ⛽ Alertes locales\n\n[ ENTRER DANS L\'APPLICATION ]\n\n💡 L\'IA te montre ce qui compte pour toi.',
      suggestions: ['Coffre', 'Comment gagner des BORB', 'UQ AI'],
    },
  },
  {
    id: 'login_menu',
    keywords: ['menu', '3 points', 'trois points', 'menu connexion', 'aide connexion', 'politique'],
    category: 'guide',
    icon: '⋮',
    response: {
      title: 'Menu ⋮ de connexion',
      content: 'Le menu (⋮) sur la page de connexion propose :\n\n🧠 UQ AI — Besoin d\'aide ?\n❓ Aide\n📜 Politique de confidentialité\n➕ Créer un compte\n\n💡 Clique sur ⋮ en bas de l\'écran.',
      suggestions: ['Créer un compte', 'UQ AI', 'Aide'],
    },
  },
  {
    id: 'login_forgot',
    keywords: ['mot de passe oublie', 'oubli mot de passe', 'recuperer mot de passe', 'mot de passe perdu connexion'],
    category: 'guide',
    icon: '🔓',
    response: {
      title: 'Mot de passe oublié ?',
      content: 'Pas de panique ! Plusieurs solutions :\n\n1. 🫆 BIOMÉTRIE (si activée)\n   → Utilise ton empreinte ou visage\n\n2. 🧩 SHAMIR 3/5\n   → 3 fragments sur 5\n   → Contacte tes guardians\n\n3. 📧 CONTACTE LE SUPPORT\n   → support@ufundi.uq\n   → Vérification d\'identité renforcée\n\n💡 Le mot de passe ne peut PAS être réinitialisé par email seul.',
      suggestions: ['Shamir 3/5', 'Biométrie', 'Contacter support'],
    },
  },
  {
    id: 'login_security',
    keywords: ['securite connexion', 'connexion securisee', 'securite login', 'protection connexion'],
    category: 'guide',
    icon: '🛡️',
    response: {
      title: 'Sécurité de la connexion',
      content: 'Ta connexion est protégée par 5 niveaux :\n\n🔑 CODE DE DÉBLOCAGE (propriétaire)\n📧 2FA (email + mot de passe)\n🔢 CODE VISUEL auto-généré\n🫆 BIOMÉTRIE (empreinte/visage)\n🔐 UqBlackKey (en arrière-plan)\n\n✅ Chiffrement de bout en bout\n✅ Détection de fraude\n✅ Anti-spoofing biométrique\n\n💡 Ta connexion est INVIOLABLE.',
      suggestions: ['UqBlackKey', '2FA', 'Biométrie'],
    },
  },
  // ===== CONFIDENTIALITE =====
  {
    id: 'privacy_data_collected',
    keywords: ['confidentialite', 'confidentialité', 'donnees collectees', 'données collectées', 'vie privee', 'privacy', 'rgpd'],
    category: 'faq',
    icon: '📜',
    response: {
      title: 'Politique de confidentialité — Données collectées',
      content: 'Voici les données que UQ collecte :\n\n👤 DONNÉES PERSONNELLES :\n• Prénom, Nom\n• Date de naissance\n• Pays, Adresse\n• Téléphone\n• Email UQ\n• Pseudo UQ\n\n💻 DONNÉES TECHNIQUES :\n• Adresse IP\n• Type d\'appareil\n• Version de l\'OS\n• Logs de connexion\n\n💰 DONNÉES FINANCIÈRES :\n• Solde BORB\n• Historique des transactions\n• Prêts et dettes\n• Réputation\n\n💡 Tu peux consulter, modifier ou supprimer tes données à tout moment depuis les Paramètres.',
      suggestions: ['Utilisation des données', 'Mes droits', 'Vie privée', 'Âge minimum'],
    },
  },
  {
    id: 'privacy_data_usage',
    keywords: ['utilisation donnees', 'pourquoi collecte', 'usage donnees', 'a quoi servent'],
    category: 'faq',
    icon: '🎯',
    response: {
      title: 'Utilisation des données',
      content: 'POURQUOI ON COLLECTE :\n\n✅ Fournir le service\n✅ Vérifier l\'identité\n✅ Prévenir la fraude\n✅ Améliorer l\'expérience\n✅ Respecter la loi\n\n❌ CE QU\'ON NE FAIT PAS :\n• Vendre tes données\n• Partager sans consentement\n• Utiliser pour la publicité ciblée\n• Transférer à des tiers non autorisés',
      suggestions: ['Données collectées', 'Mes droits', 'Vie privée'],
    },
  },
  {
    id: 'privacy_rights',
    keywords: ['mes droits', 'droits donnees', 'supprimer donnees', 'exporter donnees', 'acces donnees'],
    category: 'faq',
    icon: '⚖️',
    response: {
      title: 'Tes droits sur tes données',
      content: 'TU AS LE DROIT DE :\n\n✅ Accéder à tes données\n✅ Corriger tes données\n✅ Supprimer tes données\n✅ Exporter tes données\n✅ Retirer ton consentement\n✅ Porter plainte\n\n📧 COMMENT :\n• Via les Paramètres\n• Par email : privacy@ufundi.uq\n• Délai de réponse : 30 jours',
      suggestions: ['Données collectées', 'Utilisation', 'Contact support'],
    },
  },
  {
    id: 'privacy_private_life',
    keywords: ['vie privee', 'conversations privees', 'localisation', 'messages prives', 'chiffrement'],
    category: 'faq',
    icon: '🔒',
    response: {
      title: 'Ta vie privée est protégée',
      content: '🔒 TES CONVERSATIONS :\n• Chiffrées de bout en bout\n• Personne ne peut les lire\n• Même pas UQ\n• Restent privées\n\n📍 TA LOCALISATION :\n• Utilisée pour te montrer ce qui est proche\n• Jamais partagée sans ton accord\n• Tu peux la désactiver\n\n💡 Ta vie privée est notre priorité.',
      suggestions: ['Données collectées', 'Mes droits', 'Sécurité'],
    },
  },
  {
    id: 'privacy_min_age',
    keywords: ['age minimum', 'age requis', 'quel age', 'mineur', '18 ans'],
    category: 'faq',
    icon: '👤',
    response: {
      title: 'Âge minimum requis',
      content: 'ÂGE REQUIS : 18 ANS\n\nPOURQUOI :\n• Responsabilité légale\n• Protection des mineurs\n• Conformité réglementaire\n\nVÉRIFICATION :\n• Date de naissance\n• Vérification automatique\n\n⚠️ Si tu as moins de 18 ans, tu ne peux pas créer de compte UQ.',
      suggestions: ['Créer un compte', 'Conditions', 'Données collectées'],
    },
  },
  // ===== CONFIDENTIALITE =====
  {
    id: 'privacy_data_collected',
    keywords: ['confidentialite', 'confidentialité', 'donnees collectees', 'données collectées', 'vie privee', 'privacy'],
    category: 'faq',
    icon: '📜',
    response: {
      title: 'Politique de confidentialité — Données collectées',
      content: 'Voici les données que UQ collecte :\n\n👤 DONNÉES PERSONNELLES :\n• Prénom, Nom\n• Date de naissance\n• Pays, Adresse\n• Téléphone\n• Email UQ\n• Pseudo UQ\n\n💻 DONNÉES TECHNIQUES :\n• Adresse IP\n• Type d appareil\n• Version de l OS\n• Logs de connexion\n\n💰 DONNÉES FINANCIÈRES :\n• Solde BORB\n• Historique des transactions\n• Prêts et dettes\n• Réputation\n\n💡 Tu peux consulter, modifier ou supprimer tes données à tout moment depuis les Paramètres.',
      suggestions: ['Utilisation des données', 'Mes droits', 'Vie privée', 'Âge minimum'],
    },
  },
  {
    id: 'privacy_data_usage',
    keywords: ['utilisation donnees', 'pourquoi collecte', 'usage donnees'],
    category: 'faq',
    icon: '🎯',
    response: {
      title: 'Utilisation des données',
      content: 'POURQUOI ON COLLECTE :\n\n✅ Fournir le service\n✅ Vérifier l identité\n✅ Prévenir la fraude\n✅ Améliorer l expérience\n✅ Respecter la loi\n\n❌ CE QU ON NE FAIT PAS :\n• Vendre tes données\n• Partager sans consentement\n• Utiliser pour la publicité ciblée\n• Transférer à des tiers',
      suggestions: ['Données collectées', 'Mes droits'],
    },
  },
  {
    id: 'privacy_rights',
    keywords: ['mes droits', 'droits donnees', 'supprimer donnees', 'exporter donnees'],
    category: 'faq',
    icon: '⚖️',
    response: {
      title: 'Tes droits sur tes données',
      content: 'TU AS LE DROIT DE :\n\n✅ Accéder à tes données\n✅ Corriger tes données\n✅ Supprimer tes données\n✅ Exporter tes données\n✅ Retirer ton consentement\n✅ Porter plainte\n\n📧 COMMENT :\n• Via les Paramètres\n• Par email : privacy@ufundi.uq\n• Délai : 30 jours',
      suggestions: ['Données collectées', 'Utilisation', 'Contact support'],
    },
  },
  {
    id: 'privacy_private_life',
    keywords: ['vie privee', 'conversations privees', 'localisation', 'messages prives'],
    category: 'faq',
    icon: '🔒',
    response: {
      title: 'Ta vie privée est protégée',
      content: '🔒 TES CONVERSATIONS :\n• Chiffrées de bout en bout\n• Personne ne peut les lire\n• Même pas UQ\n• Restent privées\n\n📍 TA LOCALISATION :\n• Utilisée pour te montrer ce qui est proche\n• Jamais partagée sans ton accord\n• Tu peux la désactiver',
      suggestions: ['Données collectées', 'Mes droits', 'Sécurité'],
    },
  },
  {
    id: 'privacy_min_age',
    keywords: ['age minimum', 'age requis', 'quel age', 'mineur'],
    category: 'faq',
    icon: '👤',
    response: {
      title: 'Âge minimum requis',
      content: 'ÂGE REQUIS : 18 ANS\n\nPOURQUOI :\n• Responsabilité légale\n• Protection des mineurs\n• Conformité réglementaire\n\n⚠️ Si tu as moins de 18 ans, tu ne peux pas créer de compte UQ.',
      suggestions: ['Créer un compte', 'Conditions'],
    },
  },
  

  // UQ - ORGANISME MONETAIRE VIVANT
  {
    id: 'uq_organisme_vivant',
    keywords: ['organisme', 'vivant', 'uq vivant', 'monnaie vivante'],
    category: 'borb',
    icon: 'UQ',
    response: {
      title: 'UQ - L Organisme Monetaire Vivant',
      content: 'UQ n est pas une simple blockchain. C est un ORGANISME MONETAIRE VIVANT.\n\nCerveau : Compteur et Calculateur\nCoeur : Tresor\nPoumons : Frais\nHormones : Recompenses\nGraisse : Epargne\nMuscles : Credit\nImmunite : Bouclier\nSang : BORB\nADN : Blockchain\nSysteme nerveux : P2P\n\nUQ est autonome a 75%.',
      suggestions: ['Les 6 Cases', 'Le Compteur', 'L autonomie 75%', 'L invariant'],
    },
  },
  {
    id: 'uq_compteur',
    keywords: ['compteur', 'calculateur', '7eme organe', 'cerveau uq'],
    category: 'borb',
    icon: 'CALC',
    response: {
      title: 'Le Compteur et Calculateur',
      content: 'Le Compteur est le CERVEAU de UQ.\n\nCOMPTE :\n- Nombre d utilisateurs\n- Somme totale des BORB\n- Precision (femto -> infini)\n\nCALCULE :\n- Flux en temps reel\n- Frais de chaque transaction\n- Droits de chaque Case\n\nDISTRIBUE :\n- Tresor : 30%\n- Frais : 40%\n- Recompenses : 15%\n- Epargne : 10%\n- Credit : 5%\n\nVERIFIE :\n- Somme(6 Cases) + Compteur = 40 Mrd',
      suggestions: ['Les 6 Cases', 'L invariant', 'L autonomie'],
    },
  },
  {
    id: 'uq_autonomie_75',
    keywords: ['autonomie', '75%', 'autonome'],
    category: 'borb',
    icon: 'IA',
    response: {
      title: 'L autonomie 75% de UQ',
      content: 'UQ est autonome a 75%.\n\nAUTONOME (100%) :\n- 6 Cases\n- Distribution UBI\n- Frais\n- Passerelles\n- Recyclage\n- Taux\n- Compteur\n\nSEMI-AUTONOME (50%) :\n- Annonces Zando\n- Trading P2P\n\nMANUEL (0%) :\n- KYC\n- Support\n\n75% automatise, 25% manuel.',
      suggestions: ['Le Compteur', 'Les 6 Cases', 'Le proprietaire'],
    },
  },
  {
    id: 'uq_anti_inflation',
    keywords: ['anti inflation', 'inflation', 'prix monte'],
    category: 'borb',
    icon: 'UP',
    response: {
      title: 'Anti-inflation UQ',
      content: 'QUAND LE PRIX MONTE TROP :\n\nSI Inflation > 5% :\n- Augmenter l Epargne (geler plus)\n- Reduire l UBI\n- Augmenter les frais\n-> Prix redescend\n\nLe Compteur detecte et ajuste automatiquement.',
      suggestions: ['Anti-deflation', 'Le Compteur', 'Les 6 Cases'],
    },
  },
  {
    id: 'uq_anti_deflation',
    keywords: ['anti deflation', 'deflation', 'prix baisse'],
    category: 'borb',
    icon: 'DOWN',
    response: {
      title: 'Anti-deflation UQ',
      content: 'QUAND LE PRIX BAISSE TROP :\n\nSI Deflation > 5% :\n- Reduire l Epargne (liberer)\n- Augmenter l UBI\n- Reduire les frais\n-> Prix remonte\n\nLe Compteur detecte et ajuste automatiquement.',
      suggestions: ['Anti-inflation', 'Le Compteur', 'Les 6 Cases'],
    },
  },
  {
    id: 'uq_precision_infinie',
    keywords: ['precision', 'infinie', 'femto', 'fractal'],
    category: 'borb',
    icon: 'PREC',
    response: {
      title: 'La precision infinie du BORB',
      content: 'Le BORB a une precision INFINIE.\n\nNIVEAUX :\n- 1 BORB = 1\n- 1 borb = 0.0001 BORB\n- 1 mborb = 0.000001 BORB\n- 1 nborb = 0.00000001 BORB\n- 1 pborb = 0.0000000001 BORB\n- 1 fborb = 0.000000000001 BORB\n- ... (extension fractale)\n- infini\n\nAucune perte de valeur possible.',
      suggestions: ['Les 6 unites', 'Extension fractale', 'Le taux dynamique'],
    },
  },
  {
    id: 'uq_taux_dynamique',
    keywords: ['taux dynamique', 'taux', 'oracle', 'prediction'],
    category: 'borb',
    icon: 'TAUX',
    response: {
      title: 'Le taux dynamique UQ',
      content: 'Le taux UQ est DYNAMIQUE.\n\nEQUATION :\nTaux(T) = Taux_base x Facteur_demande x Facteur_rarete x Facteur_velocite\n\nLe Compteur peut PREDIRE le taux.\nPrecision : plus que femtonale.',
      suggestions: ['Le Compteur', 'Precision infinie', 'Les 6 Cases'],
    },
  },
  {
    id: 'uq_invariant_40_mrd',
    keywords: ['invariant', '40 milliards', '40 mrd'],
    category: 'borb',
    icon: 'OK',
    response: {
      title: 'L invariant - 40 milliards',
      content: 'L invariant UQ est SIMPLE :\n\nSomme(6 Cases) + Compteur = 40 000 000 000 BORB\n\nVerifie a CHAQUE transaction.\n\nSI different :\n- ALERTE\n- BLOCAGE des transactions\n- Identification de la fuite\n- Correction automatique\n- Reprise\n\nAucune fuite possible.',
      suggestions: ['Les 6 Cases', 'Le Compteur', 'Anti-fuite'],
    },
  },
  {
    id: 'uq_comparaison_blockchains',
    keywords: ['comparaison', 'bitcoin', 'ethereum', 'xrp'],
    category: 'borb',
    icon: 'VS',
    response: {
      title: 'UQ vs autres blockchains',
      content: 'Ce qui rend UQ unique :\n\n- Masse fixe : UQ OUI / Autres NON\n- Indexation or : UQ OUI / Autres NON\n- 6 Cases : UQ OUI / Autres NON\n- Compteur : UQ OUI / Autres NON\n- Precision infinie : UQ OUI / Autres NON\n- Autonomie 75% : UQ OUI / Autres NON\n- Anti-inflation : UQ OUI / Autres NON\n- Taux dynamique : UQ OUI / Autres NON\n\nUQ est une INNOVATION MONDIALE.',
      suggestions: ['L organisme vivant', 'Le Compteur', 'L innovation'],
    },
  },
  {
    id: 'uq_innovation_mondiale',
    keywords: ['innovation', 'unique', 'mondiale'],
    category: 'borb',
    icon: 'MONDE',
    response: {
      title: 'UQ - Innovation mondiale',
      content: 'UQ est une INNOVATION MONDIALE.\n\nCE QUI REND UQ UNIQUE :\n1. 6 Cases economiques\n2. Compteur central\n3. Precision infinie\n4. Autonomie 75%\n5. Anti-inflation/deflation\n6. Taux dynamique\n7. Invariant simple\n8. Organisme vivant\n\nAucune autre blockchain n a ca.',
      suggestions: ['Comparaison', 'Le Compteur', 'L organisme vivant'],
    },
  },];

export default KNOWLEDGE_FR;







