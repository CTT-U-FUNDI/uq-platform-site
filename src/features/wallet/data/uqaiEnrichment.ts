// ============================================================================
// UQ AI — ENRICHISSEMENT MANUEL (questions naturelles, fautes, intentions)
// ----------------------------------------------------------------------------
// COMMENT AJOUTER UNE QUESTION (manualisation) :
//   1. Trouve l'id de la fiche dans borbContent.*.ts.
//   2. Ajoute la formulation naturelle + les fautes fréquentes dans ALIAS_GROUPS.
//   3. Pour une réponse entièrement nouvelle, ajoute une entrée dans MANUAL_ANSWERS
//      avec les formulations et la réponse dans les 4 langues.
//   4. Enregistre. Aucun autre fichier à modifier.
//
// Principe : on ne devine pas au hasard. On normalise, on tolère les fautes,
// on compare le sens, puis on répond naturellement — même si la question est
// mal écrite ou semble hors sujet.
// ============================================================================

export type Lang = 'fr' | 'en' | 'es' | 'sw';

export const ALL_LANGS: Lang[] = ['fr', 'en', 'es', 'sw'];

export type AliasSet = Record<Lang, string[]>;

/** Petit helper pour garder le corpus lisible : al(fr, en, es, sw). */
export const al = (
  fr: string[],
  en: string[],
  es: string[],
  sw: string[]
): AliasSet => ({ fr, en, es, sw });

// ============================================================================
// 1. ÉQUIVALENCES D'IDS ENTRE LANGUES
// Certaines fiches ont un id différent selon la langue. On les regroupe sous
// un "topic" commun pour pouvoir répondre dans la langue de l'utilisateur.
// ============================================================================

export const TOPIC_EQUIVALENTS: Record<string, string> = {
  uq_organisme_vivant: 'uq_organism',
  uq_organism: 'uq_organism',
  uq_compteur: 'uq_counter',
  uq_counter: 'uq_counter',
  uq_autonomie_75: 'uq_autonomy_75',
  uq_autonomy_75: 'uq_autonomy_75',
  uq_precision_infinie: 'uq_infinite_precision',
  uq_infinite_precision: 'uq_infinite_precision',
  uq_taux_dynamique: 'uq_dynamic_rate',
  uq_dynamic_rate: 'uq_dynamic_rate',
  uq_invariant_40_mrd: 'uq_invariant_40_bn',
  uq_invariant_40_bn: 'uq_invariant_40_bn',
  uq_comparaison_blockchains: 'uq_blockchain_comparison',
  uq_blockchain_comparison: 'uq_blockchain_comparison',
  uq_innovation_mondiale: 'uq_worldwide_innovation',
  uq_worldwide_innovation: 'uq_worldwide_innovation',
  borb_fees: 'faq_fees',
  faq_fees: 'faq_fees',
};

// ============================================================================
// 2. ALIAS NATURELS + FAUTES FRÉQUENTES
// Chaque groupe pointe vers un topic. Les alias sont volontairement écrits
// comme des gens parlent (sans ponctuation, avec des fautes, en abrégé).
// ============================================================================

export interface AliasGroup {
  topic: string;
  aliases: AliasSet;
}

export const ALIAS_GROUPS: AliasGroup[] = [
  {
    topic: 'borb_overview',
    aliases: al(
      ["c est quoi le borb", "keske le borb", "cest koi le borb", "le borb c est quoi", "explique moi le borb", "parle moi du borb"],
      ["what is borb", "wat is borb", "whats borb", "explain borb", "tell me about borb", "borb meaning"],
      ["que es borb", "que es el borb", "explicame borb", "para que sirve el borb"],
      ["borb ni nini", "borb ni nini", "nijuze kuhusu borb", "borb ni kitu gani"]
    ),
  },
  {
    topic: 'borb_units',
    aliases: al(
      ["les unites du borb", "c est quoi femto", "unites fractales", "comment marche les unites", "1 borb egale combien de fborb"],
      ["borb units", "what is femto", "fractional units", "how many fborb in 1 borb"],
      ["unidades del borb", "que es femto", "unidades fractales"],
      ["vipimo vya borb", "femto ni nini", "vipimo vya fractal"]
    ),
  },
  {
    topic: 'borb_cases',
    aliases: al(
      ["les 6 cases", "c est quoi les cases", "comment sont repartis les 40 milliards", "repartition du borb", "keske les cases"],
      ["6 cases", "what are the cases", "how is borb divided", "distribution of borb"],
      ["las 6 cases", "que son las cases", "como se reparte el borb"],
      ["kesi 6", "kesi ni nini", "borb inagawanywaje"]
    ),
  },
  {
    topic: 'borb_bubbles',
    aliases: al(
      ["c est quoi les bulles", "comment gagner des bulles", "bulles en borb", "1 bulle egale combien", "keske les bulles"],
      ["what are bubbles", "how to earn bubbles", "bubbles to borb", "convert bubbles"],
      ["que son las burbujas", "como ganar burbujas", "burbujas a borb"],
      ["mapovu ni nini", "jinsi ya kupata mapovu", "mapovu kwa borb"]
    ),
  },
  {
    topic: 'borb_earn',
    aliases: al(
      ["comment gagner des borb", "comment gagner de l argent", "sources de revenus", "je veux gagner des borb", "comment avoir des borb", "gagner de l argent sur uq"],
      ["how to earn borb", "how to make money", "ways to earn", "how do i get borb", "earn money on uq"],
      ["como ganar borb", "como ganar dinero", "formas de ganar", "como consigo borb"],
      ["jinsi ya kupata borb", "jinsi ya kupata pesa", "njia za kupata", "nipate borb vipi"]
    ),
  },
  {
    topic: 'borb_spend',
    aliases: al(
      ["comment depenser", "ou depenser mes borb", "payer avec borb", "acheter avec borb", "a quoi sert le borb"],
      ["how to spend borb", "where can i spend", "pay with borb", "buy with borb"],
      ["como gastar borb", "donde gastar", "pagar con borb"],
      ["jinsi ya kutumia borb", "natumia borb wapi", "kulipa kwa borb"]
    ),
  },
  {
    topic: 'borb_security',
    aliases: al(
      ["la securite du borb", "mon compte est il securise", "comment uq protege mon argent", "securite borb", "uq est inviolable"],
      ["borb security", "is my account safe", "how is uq protected", "security of borb"],
      ["seguridad de borb", "mi cuenta es segura", "como protege uq", "seguridad borb"],
      ["usalama wa borb", "akaunti yangu ni salama", "uq inalinda vipi", "usalama borb"]
    ),
  },
  {
    topic: 'borb_shamir',
    aliases: al(
      ["c est quoi shamir", "j ai perdu ma cle", "recuperer ma cle privee", "3 sur 5", "cle perdue", "fragments de la cle"],
      ["what is shamir", "lost my key", "recover private key", "3 of 5", "lost key"],
      ["que es shamir", "perdi mi clave", "recuperar clave privada", "3 de 5"],
      ["shamir ni nini", "nimepoteza ufunguo", "kurejesha ufunguo", "3 kati ya 5"]
    ),
  },
  {
    topic: 'borb_recycle',
    aliases: al(
      ["compte inactif", "recyclage des comptes", "que devient mon compte si je ne l utilise pas", "3 ans sans connexion"],
      ["inactive account", "account recycling", "what happens if i dont use my account", "3 years inactive"],
      ["cuenta inactiva", "reciclaje de cuentas", "que pasa si no uso mi cuenta", "3 anos inactivo"],
      ["akaunti isiyotumika", "urejelezaji wa akaunti", "nikikosa kutumia akaunti", "miaka 3 bila kuingia"]
    ),
  },
  {
    topic: 'borb_price',
    aliases: al(
      ["le prix du borb va monter", "trajectoire du prix", "combien vaudra le borb", "evolution du borb", "le borb va prendre de la valeur"],
      ["borb price prediction", "will borb go up", "price trajectory", "borb future price"],
      ["precio del borb subira", "trayectoria del precio", "cuanto valdra borb"],
      ["bei ya borb itapanda", "mwelekeo wa bei", "borb itakuwa ngapi"]
    ),
  },
  {
    topic: 'borb_fees',
    aliases: al(
      ["les frais de transaction", "combien de frais", "0.1 pourcent", "frais de transfert", "combien je paie de frais"],
      ["transaction fees", "how much are fees", "transfer fee", "0.1 percent"],
      ["comisiones", "cuanto son las comisiones", "tarifa de transferencia"],
      ["ada za muamala", "ada ni ngapi", "ada ya uhamisho"]
    ),
  },
  {
    topic: 'how_to_get_rich',
    aliases: al(
      ["comment devenir riche", "devenir riche avec uq", "gagner beaucoup d argent", "strategie pour etre riche"],
      ["how to get rich", "become rich with uq", "make a lot of money", "rich strategy"],
      ["como hacerme rico", "hacerse rico con uq", "ganar mucho dinero"],
      ["kuwa tajiri", "nifanyeje niwe tajiri", "kupata pesa nyingi"]
    ),
  },
  {
    topic: 'twelve_methods_earn',
    aliases: al(
      ["les 12 methodes", "12 facons de gagner", "toutes les methodes pour gagner", "douze methodes"],
      ["12 methods", "12 ways to earn", "all earning methods", "twelve methods"],
      ["12 metodos", "12 formas de ganar", "todos los metodos"],
      ["njia 12", "njia 12 za kupata", "njia zote za kupata"]
    ),
  },
  {
    topic: 'create_content',
    aliases: al(
      ["comment creer du contenu", "gagner avec la musique", "publier une video", "creer un cours", "devenir createur"],
      ["create content", "earn with music", "post a video", "create a course", "become a creator"],
      ["crear contenido", "ganar con musica", "publicar video", "crear curso"],
      ["unda maudhui", "pata pesa kwa muziki", "weka video", "unda kozi"]
    ),
  },
  {
    topic: 'trading_guide',
    aliases: al(
      ["comment faire du trading", "acheter et vendre borb", "trading uq", "bourse borb", "speculer sur le borb"],
      ["how to trade", "buy and sell borb", "uq trading", "borb trading"],
      ["como hacer trading", "comprar y vender borb", "trading uq"],
      ["jinsi ya kufanya biashara", "kubadilisha borb", "biashara ya borb"]
    ),
  },
  {
    topic: 'saving_guide',
    aliases: al(
      ["comment epargner", "economiser des borb", "mettre de l argent de cote", "epargne intelligente", "geler mes borb"],
      ["how to save", "save borb", "put money aside", "smart savings", "freeze my borb"],
      ["como ahorrar", "ahorrar borb", "guardar dinero", "congelar borb"],
      ["jinsi ya kuweka akiba", "weka akiba", "tunza pesa", "gandisha borb"]
    ),
  },
  {
    topic: 'cases_overview',
    aliases: al(
      ["vue d ensemble des cases", "resume des 6 cases", "comment fonctionne les cases"],
      ["cases overview", "summary of 6 cases", "how cases work"],
      ["resumen de las cases", "como funcionan las cases"],
      ["muhtasari wa kesi", "kesi zinafanya kazi vipi"]
    ),
  },
  {
    topic: 'case_treasury',
    aliases: al(
      ["le tresor", "c est quoi le tresor", "role du tresor", "kesi ya hazina"],
      ["the treasury", "what is treasury", "treasury role"],
      ["el tesoro", "que es el tesoro"],
      ["hazina", "hazina ni nini", "kazi ya hazina"]
    ),
  },
  {
    topic: 'case_fees',
    aliases: al(
      ["la case des frais", "ou vont les frais", "kesi ya ada"],
      ["fees case", "where do fees go"],
      ["case de comisiones", "a donde van las comisiones"],
      ["kesi ya ada", "ada zinaenda wapi"]
    ),
  },
  {
    topic: 'case_rewards',
    aliases: al(
      ["les recompenses", "parrainage", "defis", "comment gagner des recompenses"],
      ["rewards", "referral", "challenges", "earn rewards"],
      ["recompensas", "referidos", "desafios"],
      ["zawadi", "rufaa", "changamoto"]
    ),
  },
  {
    topic: 'case_savings',
    aliases: al(
      ["la case epargne", "le gel des fonds", "kesi ya akiba"],
      ["savings case", "frozen funds"],
      ["case de ahorro", "fondos congelados"],
      ["kesi ya akiba", "fedha zilizogandishwa"]
    ),
  },
  {
    topic: 'case_credit',
    aliases: al(
      ["la case credit", "comment obtenir un pret", "kesi ya mkopo"],
      ["credit case", "how to get a loan"],
      ["case de credito", "como obtener un prestamo"],
      ["kesi ya mkopo", "nipate mkopo vipi"]
    ),
  },
  {
    topic: 'case_shield',
    aliases: al(
      ["le bouclier", "la case protection", "kesi ya ngao"],
      ["shield case", "protection case"],
      ["case de escudo", "proteccion"],
      ["ngao", "kesi ya ngao"]
    ),
  },
  {
    topic: 'case_cycle',
    aliases: al(
      ["le cycle des cases", "cycle eternel", "comment circule le borb"],
      ["case cycle", "eternal cycle", "how borb circulates"],
      ["ciclo de las cases", "ciclo eterno"],
      ["mzunguko wa kesi", "mzunguko wa milele"]
    ),
  },
  {
    topic: 'faq_create_account',
    aliases: al(
      ["comment creer un compte", "comen creer un conte", "ouvrir un compte", "je veux m inscrire", "creer un compte uq", "inscription uq"],
      ["create account", "how 2 create acount", "sign up", "register", "open a uq account"],
      ["crear cuenta", "abrir cuenta", "como me registro", "registrarme en uq", "como creo una cuenta", "como puedo crear una cuenta"],
      ["kufungua akaunti", "nifunguaje akaunti", "kujisajili", "nataka akaunti", "fungua akaunti"]
    ),
  },
  {
    topic: 'faq_forgot_password',
    aliases: al(
      ["j ai oublie mon mot de passe", "oubli mot de passe", "je ne retrouve pas mon mot de passe", "mdp oublie", "connexion impossible"],
      ["forgot password", "i forgot my password", "lost password", "cant remember password", "cant login"],
      ["olvide mi contrasena", "no recuerdo mi contrasena", "no puedo entrar"],
      ["nimesahau neno la siri", "sikumbuki neno la siri", "siwezi kuingia"]
    ),
  },
  {
    topic: 'faq_lost_2fa',
    aliases: al(
      ["j ai perdu mon 2fa", "2fa perdu", "je n ai plus mon 2fa", "code 2fa perdu", "telephone pour 2fa perdu"],
      ["lost my 2fa", "lost 2fa", "no access to 2fa", "2fa code lost", "lost my authenticator"],
      ["perdi mi 2fa", "perdi el 2fa", "no tengo acceso al 2fa", "perdi el codigo 2fa"],
      ["nimepoteza 2fa", "sina 2fa", "nimepoteza msimbo wa 2fa", "2fa imepotea"]
    ),
  },
  {
    topic: 'faq_change_pseudo',
    aliases: al(
      ["changer mon pseudo", "modifier mon nom d utilisateur", "changer mon nom uq"],
      ["change my username", "change pseudo", "edit my uq name"],
      ["cambiar mi pseudo", "cambiar nombre de usuario"],
      ["kubadilisha jina langu", "badilisha jina la uq"]
    ),
  },
  {
    topic: 'faq_multiple_accounts',
    aliases: al(
      ["plusieurs comptes", "deux comptes", "compte en double"],
      ["multiple accounts", "two accounts", "duplicate account"],
      ["varias cuentas", "dos cuentas"],
      ["akaunti nyingi", "akaunti mbili"]
    ),
  },
  {
    topic: 'faq_delete_account',
    aliases: al(
      ["supprimer mon compte", "fermer mon compte", "effacer mon compte"],
      ["delete my account", "close my account", "remove account"],
      ["eliminar mi cuenta", "cerrar mi cuenta"],
      ["kufuta akaunti", "funga akaunti"]
    ),
  },
  {
    topic: 'faq_activate_pin',
    aliases: al(
      ["activer le pin", "code pin", "ou est mon pin", "pin oublie", "code a 4 chiffres"],
      ["activate pin", "pin code", "where is my pin", "forgot pin", "4 digit code"],
      ["activar pin", "codigo pin", "olvide mi pin"],
      ["wezesha pin", "msimbo wa pin", "nimesahau pin"]
    ),
  },
  {
    topic: 'faq_phone_stolen',
    aliases: al(
      ["mon telephone a ete vole", "on m a vole mon telephone", "telephone vole", "portable vole", "sim volee", "telephone perdu"],
      ["my phone was stolen", "phone stolen", "lost my phone", "sim stolen", "phone lost"],
      ["me robaron el telefono", "telefono robado", "perdi mi telefono", "sim robada"],
      ["simu yangu imeibiwa", "simu imeibiwa", "nimepoteza simu", "sim imeibiwa"]
    ),
  },
  {
    topic: 'faq_activate_biometric',
    aliases: al(
      ["activer la biometrie", "empreinte digitale", "reconnaissance faciale", "face id"],
      ["enable biometrics", "fingerprint", "face id", "face recognition"],
      ["activar biometria", "huella digital", "reconocimiento facial"],
      ["wezesha biometria", "alama za vidole", "uso"]
    ),
  },
  {
    topic: 'faq_private_conversations',
    aliases: al(
      ["uq peut voir mes messages", "mes conversations sont elles privees", "chiffrement des messages"],
      ["can uq read my messages", "are my chats private", "message encryption"],
      ["uq puede leer mis mensajes", "mis chats son privados"],
      ["uq inaweza kuona ujumbe wangu", "ujumbe wangu ni wa faragha"]
    ),
  },
  {
    topic: 'faq_activate_2fa',
    aliases: al(
      ["activer la 2fa", "double authentification", "comment activer 2fa", "code 2fa", "activer double authentification"],
      ["enable 2fa", "two factor", "activate 2fa", "2fa code"],
      ["activar 2fa", "doble autenticacion", "codigo 2fa"],
      ["wezesha 2fa", "uthibitishaji mara mbili", "msimbo wa 2fa"]
    ),
  },
  {
    topic: 'faq_borb_value',
    aliases: al(
      ["combien vaut 1 borb", "combien vo 1 borb", "valeur du borb", "1 borb en dollar", "prix du borb aujourd hui", "le borb vaut combien"],
      ["how much is 1 borb", "borb value", "borb to usd", "price of borb", "how much does borb cost"],
      ["cuanto vale 1 borb", "valor del borb", "borb a dolares", "precio del borb"],
      ["borb 1 ni ngapi", "thamani ya borb", "borb kwa dola", "bei ya borb"]
    ),
  },
  {
    topic: 'faq_earn_borb',
    aliases: al(
      ["comment gagner des borb", "comment gagner du borb", "comment faire des borb"],
      ["how to earn borb", "how do i earn borb", "make borb"],
      ["como ganar borb", "como consigo borb", "como gano borb", "como puedo ganar borb", "komo gano borb", "komo ganar borb"],
      ["jinsi ya kupata borb", "nipate borb vipi"]
    ),
  },
  {
    topic: 'faq_why_40_billion',
    aliases: al(
      ["pourquoi 40 milliards", "masse fixe", "pourquoi pas plus de borb", "40 milliards de borb"],
      ["why 40 billion", "fixed supply", "why not more borb"],
      ["por que 40 mil millones", "suministro fijo"],
      ["kwa nini bilioni 40", "kiasi maalum"]
    ),
  },
  {
    topic: 'faq_borb_disappear',
    aliases: al(
      ["le borb peut disparaitre", "les borb sont brules", "perte de borb"],
      ["can borb disappear", "are borb burned", "lost borb"],
      ["el borb puede desaparecer", "se queman borb"],
      ["borb inaweza kutoweka", "borb inachomwa"]
    ),
  },
  {
    topic: 'faq_convert_units',
    aliases: al(
      ["convertir borb en mborb", "conversion des unites", "combien de fborb dans 1 borb"],
      ["convert borb to mborb", "unit conversion", "how many fborb in 1 borb"],
      ["convertir borb", "conversion de unidades"],
      ["kubadilisha vipimo", "vipimo vya borb"]
    ),
  },
  {
    topic: 'faq_6_units',
    aliases: al(
      ["les 6 unites", "quelles sont les unites", "borb mborb nborb", "six unites"],
      ["6 units", "what are the units", "six units"],
      ["6 unidades", "cuales son las unidades"],
      ["vipimo 6", "vipimo ni vipi"]
    ),
  },
  {
    topic: 'faq_fees',
    aliases: al(
      ["quels sont les frais", "combien de frais", "frais 0.1", "commission uq"],
      ["what are the fees", "how much are the fees", "uq fees", "commission"],
      ["cuales son las comisiones", "cuanto son las comisiones", "komisiones", "komision"],
      ["ada ni ngapi", "ada za uq"]
    ),
  },
  {
    topic: 'faq_transfer_speed',
    aliases: al(
      ["combien de temps prend un transfert", "delai de transfert", "transfert instantane", "envoi instantane"],
      ["how long does a transfer take", "transfer time", "instant transfer", "send time"],
      ["cuanto tarda una transferencia", "tiempo de transferencia"],
      ["uhamisho unachukua muda gani", "muda wa uhamisho"]
    ),
  },
  {
    topic: 'faq_cancel_transaction',
    aliases: al(
      ["annuler une transaction", "annuler un envoi", "je me suis trompe", "annuler un paiement"],
      ["cancel a transaction", "cancel a transfer", "undo transaction", "cancel payment"],
      ["cancelar una transaccion", "anular envio", "cancelar pago"],
      ["kughairi muamala", "kufuta uhamisho", "ghairi malipo"]
    ),
  },
  {
    topic: 'faq_wrong_recipient',
    aliases: al(
      ["je me suis trompe de destinataire", "envoye au mauvais numero", "mauvais compte", "mauvais destinataire"],
      ["sent to wrong person", "wrong recipient", "wrong number", "wrong account"],
      ["envie a la persona equivocada", "destinatario equivocado"],
      ["nimetuma kwa mtu asiye sahihi", "nambari isiyo sahihi"]
    ),
  },
  {
    topic: 'faq_limits',
    aliases: al(
      ["limites de transaction", "plafond", "combien puis je envoyer", "limite journaliere"],
      ["transaction limits", "limit", "how much can i send", "daily limit"],
      ["limites de transaccion", "limite", "cuanto puedo enviar"],
      ["mipaka ya muamala", "kiwango cha juu", "naweza kutuma kiasi gani"]
    ),
  },
  {
    topic: 'faq_history',
    aliases: al(
      ["voir mon historique", "historique des transactions", "mes paiements", "mes envois"],
      ["transaction history", "see my history", "my payments", "my transfers"],
      ["historial de transacciones", "ver mi historial", "mis pagos"],
      ["historia ya miamala", "ona historia yangu", "malipo yangu"]
    ),
  },
  {
    topic: 'faq_sell_zando',
    aliases: al(
      ["comment vendre sur zando", "mettre un produit en vente", "vendre un article", "publier un produit"],
      ["how to sell on zando", "list a product", "sell an item", "post a product"],
      ["como vender en zando", "publicar un producto", "vender un articulo"],
      ["jinsi ya kuuza zando", "weka bidhaa", "uza kitu"]
    ),
  },
  {
    topic: 'faq_buy_zando',
    aliases: al(
      ["comment acheter sur zando", "acheter un produit", "commander sur zando"],
      ["how to buy on zando", "buy a product", "order on zando"],
      ["como comprar en zando", "comprar producto"],
      ["jinsi ya kununua zando", "nunua bidhaa"]
    ),
  },
  {
    topic: 'faq_escrow',
    aliases: al(
      ["c est quoi escrow", "paiement securise", "argent bloque", "sequestre"],
      ["what is escrow", "secure payment", "held funds", "escrow"],
      ["que es escrow", "pago seguro", "fondos retenidos"],
      ["escrow ni nini", "malipo salama", "fedha zilizozuiliwa"]
    ),
  },
  {
    topic: 'faq_boost_studio',
    aliases: al(
      ["booster mon studio", "promouvoir mon produit", "publicite zando", "mettre en avant"],
      ["boost my studio", "promote my product", "zando ads", "boost"],
      ["impulsar mi studio", "promocionar producto", "anuncio zando"],
      ["kuza studio yangu", "tangaza bidhaa", "boosti"]
    ),
  },
  {
    topic: 'faq_publication_duration',
    aliases: al(
      ["combien de temps reste une publication", "duree d une annonce", "publication expire quand"],
      ["how long does a listing stay", "publication duration", "when does a listing expire"],
      ["cuanto dura una publicacion", "duracion del anuncio"],
      ["tangazo linadumu muda gani", "tangazo linaisha lini"]
    ),
  },
  {
    topic: 'faq_find_peers',
    aliases: al(
      ["trouver des pairs", "trouver un vendeur", "acheter en p2p", "scanner des pairs"],
      ["find peers", "find a seller", "p2p", "scan peers"],
      ["encontrar pares", "encontrar vendedor", "p2p"],
      ["tafuta wenzako", "pata muuzaji", "p2p"]
    ),
  },
  {
    topic: 'faq_p2p_security',
    aliases: al(
      ["le p2p est il securise", "p2p arnaque", "securite p2p"],
      ["is p2p safe", "p2p scam", "p2p security"],
      ["p2p es seguro", "estafa p2p", "seguridad p2p"],
      ["p2p ni salama", "utapeli p2p", "usalama p2p"]
    ),
  },
  {
    topic: 'faq_sell_connection',
    aliases: al(
      ["vendre ma connexion", "vendre internet", "starlink", "partager ma connexion"],
      ["sell my connection", "sell internet", "starlink", "share my connection"],
      ["vender mi conexion", "vender internet", "starlink"],
      ["uza muunganisho", "uza internet", "starlink"]
    ),
  },
  {
    topic: 'faq_offline',
    aliases: al(
      ["uq sans internet", "hors ligne", "mode hors ligne", "sans reseau"],
      ["uq without internet", "offline mode", "work offline", "no network"],
      ["uq sin internet", "modo sin conexion", "sin red"],
      ["uq bila internet", "nje ya mtandao", "bila mtandao"]
    ),
  },
  {
    topic: 'faq_inactive_3_years',
    aliases: al(
      ["inactif depuis 3 ans", "compte inactif 3 ans", "3 ans sans utiliser mon compte"],
      ["inactive for 3 years", "3 years inactive", "inactive account 3 years"],
      ["inactivo 3 anos", "cuenta inactiva 3 anos"],
      ["miaka 3 bila kutumika", "akaunti imekaa miaka 3"]
    ),
  },
  {
    topic: 'faq_recover_account',
    aliases: al(
      ["recuperer mon compte", "compte perdu", "je n ai plus acces a mon compte", "compte suspendu"],
      ["recover my account", "lost account", "cant access my account", "account suspended"],
      ["recuperar mi cuenta", "perdi mi cuenta", "no tengo acceso a mi cuenta"],
      ["kurejesha akaunti", "nimepoteza akaunti", "siwezi kufikia akaunti"]
    ),
  },
  {
    topic: 'faq_after_10_years',
    aliases: al(
      ["apres 10 ans", "10 ans d inactivite", "dix ans inactif"],
      ["after 10 years", "10 years inactive", "ten years inactive"],
      ["despues de 10 anos", "10 anos inactivo"],
      ["baada ya miaka 10", "miaka 10 bila kutumika"]
    ),
  },
  {
    topic: 'faq_after_50_years',
    aliases: al(
      ["apres 50 ans", "50 ans d inactivite", "cinquante ans inactif"],
      ["after 50 years", "50 years inactive", "fifty years inactive"],
      ["despues de 50 anos", "50 anos inactivo"],
      ["baada ya miaka 50", "miaka 50 bila kutumika"]
    ),
  },
  {
    topic: 'faq_overdraft',
    aliases: al(
      ["decouvert", "solde negatif", "emprunter plus que mon solde", "decouvert autorise"],
      ["overdraft", "negative balance", "borrow more than my balance"],
      ["descubierto", "saldo negativo", "prestar mas de mi saldo"],
      ["deni la ziada", "salio hasi", "kukopa zaidi ya salio"]
    ),
  },
  {
    topic: 'faq_repay',
    aliases: al(
      ["rembourser mon pret", "comment rembourser", "payer mon credit", "rembourser un emprunt"],
      ["repay my loan", "pay back", "repay credit", "pay my loan"],
      ["pagar mi prestamo", "devolver credito", "pagar el credito"],
      ["kurejesha mkopo", "lipa mkopo", "rudisha mkopo"]
    ),
  },
  {
    topic: 'faq_no_repay',
    aliases: al(
      ["si je ne rembourse pas", "je ne peux pas payer", "defaut de paiement"],
      ["what if i dont repay", "cant pay loan", "default on loan"],
      ["si no pago", "no puedo pagar", "impago"],
      ["nikikosa kurejesha", "siwezi kulipa", "kushindwa kulipa"]
    ),
  },
  {
    topic: 'faq_reader_principle',
    aliases: al(
      ["comment marche le lecteur uq", "ecouter de la musique", "lecteur uq", "gagner avec le lecteur"],
      ["how does uq reader work", "listen to music", "uq player", "earn from reader"],
      ["como funciona el lector uq", "escuchar musica", "lector uq"],
      ["lector uq inafanya kazi vipi", "sikiliza muziki", "lector uq"]
    ),
  },
  {
    topic: 'faq_create_content',
    aliases: al(
      ["comment creer du contenu", "publier ma musique", "creer une video", "ecrire un livre"],
      ["how to create content", "publish my music", "create a video", "write a book"],
      ["como crear contenido", "publicar mi musica", "crear video", "escribir un libro"],
      ["jinsi ya kuunda maudhui", "weka muziki wangu", "unda video", "andika kitabu"]
    ),
  },
  {
    topic: 'faq_how_much_earn',
    aliases: al(
      ["combien puis je gagner", "combien rapporte le lecteur", "revenus createur", "combien gagne un createur"],
      ["how much can i earn", "creator earnings", "reader payout", "how much do creators earn"],
      ["cuanto puedo ganar", "ganancias de creador", "pago del lector"],
      ["naweza kupata kiasi gani", "mapato ya mbunifu", "malipo ya lector"]
    ),
  },
  {
    topic: 'faq_ubi',
    aliases: al(
      ["c est quoi l ubi", "revenu universel", "ubi de base", "revenu de base", "keske l ubi"],
      ["what is ubi", "universal income", "basic income", "ubi meaning"],
      ["que es ubi", "ingreso universal", "renta basica"],
      ["ubi ni nini", "kipato cha msingi", "mapato ya msingi"]
    ),
  },
  {
    topic: 'faq_claim_ubi',
    aliases: al(
      ["comment reclamer mon ubi", "recevoir l ubi", "claim ubi", "recuperer mon ubi", "je n ai pas recu mon ubi"],
      ["how to claim ubi", "get my ubi", "claim my ubi", "didnt receive ubi"],
      ["como reclamar ubi", "recibir ubi", "no recibi mi ubi"],
      ["kudai ubi", "jinsi ya kudai ubi", "sikupata ubi"]
    ),
  },
  {
    topic: 'faq_not_eligible_ubi',
    aliases: al(
      ["pourquoi je ne peux pas reclamer", "pas eligible ubi", "ubi bloque", "je ne suis pas eligible"],
      ["why cant i claim", "not eligible for ubi", "ubi blocked", "im not eligible"],
      ["por que no puedo reclamar", "no soy elegible", "ubi bloqueado"],
      ["kwa nini siwezi kudai", "sistahili ubi", "ubi imezuiwa"]
    ),
  },
  {
    topic: 'faq_marketer',
    aliases: al(
      ["c est quoi un marketer", "role du marketer", "ambassadeur uq"],
      ["what is a marketer", "marketer role", "uq ambassador"],
      ["que es un marketer", "rol del marketer", "embajador uq"],
      ["marketer ni nini", "kazi ya marketer", "balozi wa uq"]
    ),
  },
  {
    topic: 'faq_become_marketer',
    aliases: al(
      ["comment devenir marketer", "devenir commercial uq", "formation marketer"],
      ["become a marketer", "how to be marketer", "marketer training"],
      ["como ser marketer", "hacerme marketer", "formacion marketer"],
      ["kuwa marketer", "jinsi ya kuwa marketer", "mafunzo ya marketer"]
    ),
  },
  {
    topic: 'faq_marketer_advantages',
    aliases: al(
      ["avantages marketer", "combien gagne un marketer", "privileges marketer"],
      ["marketer benefits", "how much do marketers earn", "marketer privileges"],
      ["ventajas de marketer", "cuanto gana un marketer", "privilegios marketer"],
      ["faida za marketer", "marketer anapata ngapi", "haki za marketer"]
    ),
  },
  {
    topic: 'login_flow',
    aliases: al(
      ["comment me connecter", "connexion uq", "je n arrive pas a me connecter", "login uq", "comment se connecter"],
      ["how to log in", "sign in uq", "cant login", "login uq", "how to sign in"],
      ["como iniciar sesion", "no puedo entrar", "login uq", "como entrar"],
      ["jinsi ya kuingia", "siwezi kuingia", "ingia uq", "kuingia akaunti"]
    ),
  },
  {
    topic: 'login_number',
    aliases: al(
      ["mon numero uq", "ou trouver mon numero uq", "numero de compte uq"],
      ["my uq number", "where is my uq number", "uq account number"],
      ["mi numero uq", "donde esta mi numero uq"],
      ["namba yangu ya uq", "namba ya uq iko wapi"]
    ),
  },
  {
    topic: 'login_unlock',
    aliases: al(
      ["code de deblocage", "code a 4 chiffres", "mot de passe de connexion"],
      ["unlock code", "4 digit code", "login code"],
      ["codigo de desbloqueo", "codigo de 4 digitos"],
      ["msimbo wa kufungua", "namba 4 za kufungua"]
    ),
  },
  {
    topic: 'login_2fa',
    aliases: al(
      ["verification 2fa", "code 2fa connexion", "2fa a la connexion"],
      ["2fa verification", "login 2fa code", "2fa at login"],
      ["verificacion 2fa", "codigo 2fa de inicio"],
      ["uthibitishaji 2fa", "msimbo wa 2fa wa kuingia"]
    ),
  },
  {
    topic: 'login_biometric',
    aliases: al(
      ["connexion biometrie", "empreinte pour se connecter", "connexion par visage"],
      ["biometric login", "fingerprint login", "face login"],
      ["inicio con biometria", "huella para entrar", "entrar con la cara"],
      ["kuingia kwa biometria", "alama za vidole kuingia", "kuingia kwa uso"]
    ),
  },
  {
    topic: 'login_forgot',
    aliases: al(
      ["mot de passe oublie connexion", "je ne retrouve pas mon mot de passe", "je ne peux pas me connecter"],
      ["forgot my login password", "cant remember password", "cannot sign in"],
      ["olvide mi contrasena de acceso", "no recuerdo mi contrasena", "no puedo iniciar sesion"],
      ["nimesahau neno la siri la kuingia", "sikumbuki neno la siri", "siwezi kuingia"]
    ),
  },
  {
    topic: 'login_security',
    aliases: al(
      ["connexion securisee", "securite du login", "connexion protegee"],
      ["secure login", "login security", "protected login"],
      ["inicio de sesion seguro", "seguridad de login"],
      ["kuingia kwa usalama", "usalama wa kuingia"]
    ),
  },
  {
    topic: 'privacy_data_collected',
    aliases: al(
      ["quelles donnees collectez vous", "mes donnees personnelles", "rgpd uq", "donnees collectees"],
      ["what data do you collect", "my personal data", "gdpr uq", "collected data"],
      ["que datos recogen", "mis datos personales", "datos recopilados"],
      ["mnakusanya data gani", "data yangu binafsi", "data iliyokusanywa"]
    ),
  },
  {
    topic: 'privacy_data_usage',
    aliases: al(
      ["a quoi servent mes donnees", "pourquoi collecter mes donnees", "utilisation des donnees"],
      ["how do you use my data", "why collect data", "data usage"],
      ["para que usan mis datos", "por que recogen datos", "uso de datos"],
      ["mnatumia data yangu vipi", "kwa nini mnakusanya data", "matumizi ya data"]
    ),
  },
  {
    topic: 'privacy_rights',
    aliases: al(
      ["mes droits sur mes donnees", "supprimer mes donnees", "exporter mes donnees", "acceder a mes donnees"],
      ["my data rights", "delete my data", "export my data", "access my data"],
      ["mis derechos de datos", "eliminar mis datos", "exportar mis datos"],
      ["haki zangu za data", "futa data yangu", "toa data yangu"]
    ),
  },
  {
    topic: 'privacy_private_life',
    aliases: al(
      ["ma vie privee", "mes messages sont ils prives", "localisation uq"],
      ["my privacy", "are my messages private", "location uq"],
      ["mi privacidad", "mis mensajes son privados", "ubicacion uq"],
      ["faragha yangu", "ujumbe wangu ni wa faragha", "mahali nilipo uq"]
    ),
  },
  {
    topic: 'privacy_min_age',
    aliases: al(
      ["quel age minimum", "age pour uq", "18 ans obligatoire", "age requis"],
      ["minimum age", "how old to use uq", "18 years", "age requirement"],
      ["edad minima", "cuantos anos para uq", "18 anos"],
      ["umri wa chini", "miaka ngapi kwa uq", "miaka 18"]
    ),
  },
  {
    topic: 'uq_organism',
    aliases: al(
      ["uq est un organisme vivant", "c est quoi uq", "uq vivant", "monnaie vivante"],
      ["uq living organism", "what is uq", "living currency", "uq organism"],
      ["uq organismo vivo", "que es uq", "moneda viva"],
      ["uq ni kiumbe hai", "uq ni nini", "sarafu hai"]
    ),
  },
  {
    topic: 'uq_counter',
    aliases: al(
      ["le compteur", "c est quoi le compteur", "calculateur uq"],
      ["the counter", "what is the counter", "uq calculator"],
      ["el contador", "que es el contador", "calculador uq"],
      ["kihesabu", "compteur ni nini", "kikokotoo cha uq"]
    ),
  },
  {
    topic: 'uq_autonomy_75',
    aliases: al(
      ["autonomie 75", "uq est autonome a combien", "75 pourcent autonome"],
      ["75 autonomy", "how autonomous is uq", "75 percent autonomous"],
      ["autonomia 75", "que tan autonomo es uq"],
      ["uhuru wa 75", "uq inajitegemea kiasi gani"]
    ),
  },
  {
    topic: 'uq_anti_inflation',
    aliases: al(
      ["anti inflation", "inflation uq", "le prix monte trop"],
      ["anti inflation", "uq inflation", "price rises too much"],
      ["anti inflacion", "inflacion uq", "el precio sube demasiado"],
      ["kupambana na mfumuko wa bei", "mfumuko wa bei", "bei inapanda sana"]
    ),
  },
  {
    topic: 'uq_anti_deflation',
    aliases: al(
      ["anti deflation", "deflation uq", "le prix baisse trop"],
      ["anti deflation", "uq deflation", "price drops too much"],
      ["anti deflacion", "deflacion uq", "el precio baja demasiado"],
      ["kupambana na kushuka kwa bei", "kushuka kwa bei", "bei inashuka sana"]
    ),
  },
  {
    topic: 'uq_precision_infinie',
    aliases: al(
      ["precision infinie", "pourquoi infinie", "femtonale"],
      ["infinite precision", "why infinite", "femtonal"],
      ["precision infinita", "por que infinita"],
      ["usahihi usio na kikomo", "kwa nini usio na kikomo"]
    ),
  },
  {
    topic: 'uq_taux_dynamique',
    aliases: al(
      ["taux dynamique", "comment est calcule le taux", "oracle uq"],
      ["dynamic rate", "how is the rate calculated", "uq oracle"],
      ["tasa dinamica", "como se calcula la tasa"],
      ["kiwango cha kubadilika", "kiwango kinahesabiwa vipi"]
    ),
  },
  {
    topic: 'uq_invariant_40_mrd',
    aliases: al(
      ["l invariant", "somme des cases", "40 milliards invariant"],
      ["the invariant", "sum of cases", "40 billion invariant"],
      ["el invariante", "suma de cases"],
      ["kanuni ya jumla", "jumla ya kesi"]
    ),
  },
  {
    topic: 'uq_comparaison_blockchains',
    aliases: al(
      ["uq vs bitcoin", "difference avec bitcoin", "uq vs ethereum", "difference avec ethereum"],
      ["uq vs bitcoin", "difference with bitcoin", "uq vs ethereum"],
      ["uq vs bitcoin", "diferencia con bitcoin", "uq vs ethereum"],
      ["uq vs bitcoin", "tofauti na bitcoin", "uq vs ethereum"]
    ),
  },
  {
    topic: 'uq_innovation_mondiale',
    aliases: al(
      ["pourquoi uq est unique", "innovation mondiale", "ce qui rend uq unique"],
      ["why is uq unique", "world innovation", "what makes uq unique"],
      ["por que uq es unico", "innovacion mundial"],
      ["kwa nini uq ni ya kipekee", "uvumbuzi wa dunia"]
    ),
  },
];

// ============================================================================
// 3. RÉPONSES MANUELLES (conversation + sujets à couvrir dans les 4 langues)
// ============================================================================

export interface ManualText {
  title: string;
  content: string;
  suggestions: string[];
}

export interface ManualEntry {
  id: string;
  /**
   * chat   : petite phrase de conversation (salutation, merci...)
   * topic  : sujet UQ à réponse manuelle (support, UBI, Zando...)
   * safety : sécurité/confiance, priorité haute
   */
  kind: 'chat' | 'topic' | 'safety';
  patterns: AliasSet;
  answers: Record<Lang, ManualText>;
}

const MANUAL = (
  id: string,
  kind: ManualEntry['kind'],
  patterns: AliasSet,
  answers: Record<Lang, ManualText>
): ManualEntry => ({ id, kind, patterns, answers });

export const MANUAL_ANSWERS: ManualEntry[] = [
  MANUAL(
    'chat_greeting',
    'chat',
    al(
      ['bonjour', 'salut', 'bonsoir', 'coucou', 'hello', 'yo', 'bonjour uq', 'salut uq', 'bjr', 'slt', 'bonjour a toi', 'cc cv', 'cc', 'bonjour tout le monde', 'salut tout le monde', 'bonsoir tout le monde', 'hello tout le monde', 'bonjour a tous', 'salut a tous', 'coucou toi', 'yop'],
      ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'morning', 'hi there', 'hey there', 'greetings', 'yo', 'hello uq', 'hii', 'hiii', 'heyy', 'helo'],
      ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'buen dia', 'que tal', 'hola uq', 'ola', 'ola uq', 'hola a todos', 'buenas a todos', 'hola amigo'],
      ['habari', 'mambo', 'jambo', 'hujambo', 'sijambo', 'habari yako', 'habari za asubuhi', 'habari za mchana', 'habari za jioni', 'karibu', 'salama', 'mambo vipi']
    ),
    {
      fr: {
        title: 'Bonjour ! 👋',
        content:
          "Ravi de te voir. Je suis UQ AI, ton assistant sur la plateforme.\n\nJe peux t'aider sur le BORB, les 6 Cases, la sécurité, les paiements, Zando, le Lecteur UQ, l'UBI et les moyens de gagner des BORB.\n\nÉcris comme tu veux, même avec des fautes : je ferai de mon mieux pour comprendre ton intention.\n\nPar quoi veux-tu commencer ?",
        suggestions: ["C'est quoi UQ ?", 'Comment créer un compte ?', 'Comment gagner des BORB ?', 'Comment activer la 2FA ?'],
      },
      en: {
        title: 'Hello! 👋',
        content:
          "Great to see you. I'm UQ AI, your assistant on the platform.\n\nI can help with BORB, the 6 Cases, security, payments, Zando, the UQ Reader, UBI and ways to earn BORB.\n\nWrite naturally, typos are fine — I'll do my best to understand your intent.\n\nWhere would you like to start?",
        suggestions: ['What is UQ?', 'How to create an account?', 'How to earn BORB?', 'How to enable 2FA?'],
      },
      es: {
        title: '¡Hola! 👋',
        content:
          'Encantado de verte. Soy UQ AI, tu asistente en la plataforma.\n\nPuedo ayudarte con BORB, las 6 Cases, la seguridad, los pagos, Zando, el Lector UQ, el UBI y las formas de ganar BORB.\n\nEscribe con naturalidad, aunque tengas faltas: haré lo posible por entender tu intención.\n\n¿Por dónde quieres empezar?',
        suggestions: ['¿Qué es UQ?', '¿Cómo crear una cuenta?', '¿Cómo ganar BORB?', '¿Cómo activar 2FA?'],
      },
      sw: {
        title: 'Habari! 👋',
        content:
          'Nafurahi kukuona. Mimi ni UQ AI, msaidizi wako kwenye jukwaa.\n\nNinaweza kukusaidia kuhusu BORB, Kesi 6, usalama, malipo, Zando, Lector UQ, UBI na njia za kupata BORB.\n\nAndika kawaida, hata ukiwa na makosa — nitajitahidi kuelewa nia yako.\n\nUnataka kuanza wapi?',
        suggestions: ['UQ ni nini?', 'Jinsi ya kufungua akaunti?', 'Jinsi ya kupata BORB?', 'Jinsi ya kuwezesha 2FA?'],
      },
    }
  ),

  MANUAL(
    'chat_how_are_you',
    'chat',
    al(
      ['ca va', 'comment vas tu', 'comment tu vas', 'tu vas bien', 'comment ca va', 'cv', 'la forme', 'ca va bien', 'ca va et toi', 'et toi ca va', 'comment se passe ta journee', 'quoi de neuf'],
      ['how are you', 'how r u', 'hows it going', 'how is it going', 'how are things', 'how are you doing', 'you ok', 'how do you feel', 'what is up', 'whats up', 'sup', 'how have you been'],
      ['como estas', 'que tal', 'como te va', 'estas bien', 'como andas', 'como estas hoy', 'que hay', 'como va todo', 'que tal todo'],
      ['habari yako', 'u hali gani', 'unaendelea je', 'unaendeleaje', 'hali gani', 'hujambo', 'mambo vipi', 'habari za siku', 'vipi', 'mambo sawa']
    ),
    {
      fr: {
        title: 'Je vais très bien 🙂',
        content:
          "Merci de demander ! Je suis prêt à t'aider.\n\nEt toi ? Si tu as une question sur UQ, dis-la-moi simplement — même mal écrite, je m'occupe de comprendre.",
        suggestions: ['Comment créer un compte ?', "C'est quoi le BORB ?", 'Comment gagner des BORB ?'],
      },
      en: {
        title: 'I’m doing great 🙂',
        content:
          "Thanks for asking! I'm ready to help.\n\nHow about you? If you have a UQ question, just tell me — even with typos, I'll figure out what you mean.",
        suggestions: ['How to create an account?', 'What is BORB?', 'How to earn BORB?'],
      },
      es: {
        title: 'Estoy muy bien 🙂',
        content:
          'Gracias por preguntar. Estoy listo para ayudarte.\n\n¿Y tú? Si tienes una pregunta sobre UQ, dímela tal cual — aunque tenga faltas, intentaré entenderte.',
        suggestions: ['¿Cómo crear una cuenta?', '¿Qué es BORB?', '¿Cómo ganar BORB?'],
      },
      sw: {
        title: 'Niko vizuri 🙂',
        content:
          'Asante kwa kuuliza! Niko tayari kukusaidia.\n\nNa wewe? Kama una swali kuhusu UQ, niambie tu — hata ukiwa na makosa, nitaelewa.',
        suggestions: ['Jinsi ya kufungua akaunti?', 'BORB ni nini?', 'Jinsi ya kupata BORB?'],
      },
    }
  ),

  MANUAL(
    'chat_thanks',
    'chat',
    al(
      ['merci', 'merci beaucoup', 'mci', 'c est gentil', 'super merci', 'merci a toi'],
      ['thanks', 'thank you', 'thx', 'ty', 'appreciate it', 'great thanks'],
      ['gracias', 'muchas gracias', 'grax', 'te agradezco'],
      ['asante', 'asante sana', 'ahsante', 'nashukuru', 'shukrani']
    ),
    {
      fr: {
        title: 'Avec plaisir ! 🙌',
        content:
          "Si tu veux, je peux détailler une autre partie de UQ : compte, sécurité, paiements, Zando, UBI ou épargne.",
        suggestions: ['Sécuriser mon compte', 'Comment gagner des BORB ?', 'Comment vendre sur Zando ?'],
      },
      en: {
        title: 'You’re welcome! 🙌',
        content:
          "If you want, I can walk you through another part of UQ: account, security, payments, Zando, UBI or savings.",
        suggestions: ['Secure my account', 'How to earn BORB?', 'How to sell on Zando?'],
      },
      es: {
        title: '¡Con gusto! 🙌',
        content:
          'Si quieres, puedo explicarte otra parte de UQ: cuenta, seguridad, pagos, Zando, UBI o ahorro.',
        suggestions: ['Proteger mi cuenta', '¿Cómo ganar BORB?', '¿Cómo vender en Zando?'],
      },
      sw: {
        title: 'Karibu sana! 🙌',
        content:
          'Ukitaka, ninaweza kukueleza sehemu nyingine ya UQ: akaunti, usalama, malipo, Zando, UBI au akiba.',
        suggestions: ['Linda akaunti yangu', 'Jinsi ya kupata BORB?', 'Jinsi ya kuuza Zando?'],
      },
    }
  ),

  MANUAL(
    'chat_farewell',
    'chat',
    al(
      ['au revoir', 'a plus', 'a bientot', 'bye', 'ciao', 'bonne journee', 'bonne soiree', 'a la prochaine'],
      ['goodbye', 'bye', 'see you', 'see ya', 'good night', 'later', 'take care'],
      ['adios', 'hasta luego', 'chao', 'nos vemos', 'buenas noches', 'hasta pronto'],
      ['kwaheri', 'baadaye', 'tutaonana', 'usiku mwema', 'kwa heri']
    ),
    {
      fr: {
        title: 'À bientôt ! 👋',
        content:
          'Tu peux revenir quand tu veux. Si tu as une dernière question, je suis encore là.',
        suggestions: ['Comment gagner des BORB ?', 'Sécuriser mon compte', 'Contacter le support'],
      },
      en: {
        title: 'See you soon! 👋',
        content:
          "You can come back anytime. If you have one last question, I'm still here.",
        suggestions: ['How to earn BORB?', 'Secure my account', 'Contact support'],
      },
      es: {
        title: '¡Hasta pronto! 👋',
        content:
          'Puedes volver cuando quieras. Si tienes una última pregunta, aquí estoy.',
        suggestions: ['¿Cómo ganar BORB?', 'Proteger mi cuenta', 'Contactar soporte'],
      },
      sw: {
        title: 'Tutaonana! 👋',
        content:
          'Unaweza kurudi wakati wowote. Kama una swali la mwisho, nipo hapa.',
        suggestions: ['Jinsi ya kupata BORB?', 'Linda akaunti yangu', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_identity',
    'chat',
    al(
      ['qui es tu', 'tu es qui', 'c est quoi uq ai', 'qui est uq ai', 'tu es un robot', 'tu es une ia', 'tu es une intelligence artificielle', 'qui parle', 'presente toi', 'ton nom', 'quel est ton nom', 'c est quoi ton nom', 'comment tu t appelles', 'comment t appelles tu', 'tu t appelles comment', 'tu es humain', 'es tu humain', 'qui t a cree', 'qui ta cree'],
      ['who are you', 'what are you', 'are you a robot', 'who is uq ai', 'what is uq ai', 'introduce yourself', 'what s your name', 'whats your name', 'your name', 'are you human', 'are you an ai', 'are you artificial intelligence', 'who made you', 'who created you', 'what should i call you'],
      ['quien eres', 'que eres', 'eres un robot', 'quien es uq ai', 'presentate', 'como te llamas', 'tu nombre', 'cual es tu nombre', 'eres humano', 'eres una ia', 'quien te creo', 'quien te hizo'],
      ['wewe ni nani', 'wewe ni nini', 'wewe ni robot', 'uq ai ni nani', 'jieleze', 'jina lako nani', 'unaitwa nani', 'jina lako ni nini', 'wewe ni binadamu', 'wewe ni akili bandia', 'nani aliyekutengeneza', 'nani aliyekuunda']
    ),
    {
      fr: {
        title: 'Qui suis-je ?',
        content:
          "Je suis UQ AI, l'assistant intégré à la plateforme UQ.\n\nJe ne suis pas un humain : je m'appuie sur une base de connaissances UQ vérifiée. Quand je ne suis pas sûr, je te le dis clairement et je propose des pistes au lieu d'inventer.\n\nJe peux t'aider sur le BORB, la sécurité, les paiements, Zando, l'UBI, l'épargne, le crédit et le trading.",
        suggestions: ['Que peux-tu faire ?', "C'est quoi UQ ?", 'Comment gagner des BORB ?', 'Contacter le support'],
      },
      en: {
        title: 'Who am I?',
        content:
          "I'm UQ AI, the assistant built into the UQ platform.\n\nI'm not a human: I rely on a verified UQ knowledge base. When I'm unsure, I say so clearly and offer leads instead of inventing an answer.\n\nI can help with BORB, security, payments, Zando, UBI, savings, credit and trading.",
        suggestions: ['What can you do?', 'What is UQ?', 'How to earn BORB?', 'Contact support'],
      },
      es: {
        title: '¿Quién soy?',
        content:
          'Soy UQ AI, el asistente integrado en la plataforma UQ.\n\nNo soy una persona: me apoyo en una base de conocimientos UQ verificada. Cuando no estoy seguro, lo digo claramente y te ofrezco pistas en lugar de inventar.\n\nPuedo ayudarte con BORB, seguridad, pagos, Zando, UBI, ahorro, crédito y trading.',
        suggestions: ['¿Qué puedes hacer?', '¿Qué es UQ?', '¿Cómo ganar BORB?', 'Contactar soporte'],
      },
      sw: {
        title: 'Mimi ni nani?',
        content:
          'Mimi ni UQ AI, msaidizi aliye ndani ya jukwaa la UQ.\n\nMimi si mtu: nategemea hifadhidata ya maarifa ya UQ iliyothibitishwa. Nisipokuwa na uhakika, nakwambia wazi na kukupa mwelekeo badala ya kubuni jibu.\n\nNinaweza kukusaidia kuhusu BORB, usalama, malipo, Zando, UBI, akiba, mkopo na biashara.',
        suggestions: ['Unaweza kufanya nini?', 'UQ ni nini?', 'Jinsi ya kupata BORB?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_nice_to_meet',
    'chat',
    al(
      ['enchanté', 'enchantee', 'ravi de te rencontrer', 'ravie de te rencontrer', 'content de te parler', 'contente de te parler', 'au plaisir'],
      ['nice to meet you', 'pleased to meet you', 'good to meet you', 'nice talking to you', 'great to talk to you', 'glad to meet you'],
      ['mucho gusto', 'encantado', 'encantada', 'un placer', 'gusto en conocerte', 'encantado de conocerte', 'encantada de conocerte'],
      ['nimefurahi kukutana nawe', 'nimefurahi kukujua', 'nafurahi kukutana nawe', 'nafurahi kukujua', 'vizuri kukutana nawe']
    ),
    {
      fr: {
        title: 'Enchanté 🙂',
        content:
          "Enchanté, moi c'est UQ AI.\n\nJe suis là pour t'aider sur la plateforme UQ : compte, BORB, réserve de sécurité, paiements, devises, Zando, UBI, épargne et crédit.\n\nDis-moi simplement ce que tu veux faire, même si tu l'écris vite ou avec des fautes.",
        suggestions: ['Que peux-tu faire ?', "C'est quoi UQ ?", 'Comment envoyer de l’argent ?', 'Comment acheter de la réserve BORB ?'],
      },
      en: {
        title: 'Nice to meet you 🙂',
        content:
          "Nice to meet you — I'm UQ AI.\n\nI'm here to help you with the UQ platform: account, BORB, security reserve, payments, currencies, Zando, UBI, savings and credit.\n\nJust tell me what you want to do, even if you type quickly or make mistakes.",
        suggestions: ['What can you do?', 'What is UQ?', 'How to send money?', 'How to buy BORB reserve?'],
      },
      es: {
        title: 'Mucho gusto 🙂',
        content:
          'Mucho gusto, soy UQ AI.\n\nEstoy aquí para ayudarte con la plataforma UQ: cuenta, BORB, reserva de seguridad, pagos, divisas, Zando, UBI, ahorro y crédito.\n\nDime qué quieres hacer, aunque escribas rápido o con faltas.',
        suggestions: ['¿Qué puedes hacer?', '¿Qué es UQ?', '¿Cómo enviar dinero?', '¿Cómo comprar reserva BORB?'],
      },
      sw: {
        title: 'Nimefurahi kukutana nawe 🙂',
        content:
          'Nimefurahi kukutana nawe, mimi ni UQ AI.\n\nNipo hapa kukusaidia kuhusu jukwaa la UQ: akaunti, BORB, akiba ya usalama, malipo, sarafu, Zando, UBI, akiba na mkopo.\n\nNiambie unataka kufanya nini, hata ukiandika haraka au kwa makosa.',
        suggestions: ['Unaweza kufanya nini?', 'UQ ni nini?', 'Jinsi ya kutuma pesa?', 'Jinsi ya kununua akiba ya BORB?'],
      },
    }
  ),

  MANUAL(
    'chat_introduce_user',
    'topic',
    al(
      ['je m appelle', 'mon nom est', 'moi c est', 'je me presente', 'je suis nouveau', 'je suis nouvelle', 'nouvel utilisateur', 'nouvelle utilisatrice', 'je debarque', 'je viens de m inscrire'],
      ['my name is', 'im called', 'i am called', 'call me', 'i am new here', 'im new here', 'just joined', 'i just signed up', 'new user here'],
      ['me llamo', 'mi nombre es', 'soy nuevo', 'soy nueva', 'usuario nuevo', 'usuaria nueva', 'acabo de registrarme', 'recien llegado', 'recien llegada'],
      ['naitwa', 'jina langu ni', 'mimi ni mpya', 'mimi ni mgeni', 'nimefungua akaunti jipya', 'mtumiaji mpya']
    ),
    {
      fr: {
        title: 'Bienvenue sur UQ 👋',
        content:
          "Ravi de faire ta connaissance !\n\nSi tu débutes, voici les trois premiers pas utiles :\n1️⃣ Sécuriser ton compte (PIN, 2FA, biométrie)\n2️⃣ Comprendre ta réserve de sécurité BORB\n3️⃣ Échanger une part de ta réserve en devise pour envoyer de l'argent\n\nDis-moi ton prénom ou ce qui t'amène, et je t'oriente précisément.",
        suggestions: ['Comment créer un compte ?', 'Sécuriser mon compte', 'Comment envoyer de l’argent ?', 'Que peux-tu faire ?'],
      },
      en: {
        title: 'Welcome to UQ 👋',
        content:
          "Great to meet you!\n\nIf you're just starting, here are three useful first steps:\n1️⃣ Secure your account (PIN, 2FA, biometrics)\n2️⃣ Understand your BORB security reserve\n3️⃣ Exchange part of your reserve into currency to send money\n\nTell me your name or what brings you here, and I'll point you precisely.",
        suggestions: ['How to create an account?', 'Secure my account', 'How to send money?', 'What can you do?'],
      },
      es: {
        title: 'Bienvenido a UQ 👋',
        content:
          '¡Encantado de conocerte!\n\nSi estás empezando, estos son los tres primeros pasos útiles:\n1️⃣ Proteger tu cuenta (PIN, 2FA, biometría)\n2️⃣ Entender tu reserva de seguridad BORB\n3️⃣ Cambiar parte de tu reserva a divisa para enviar dinero\n\nDime tu nombre o qué te trae por aquí y te oriento con precisión.',
        suggestions: ['¿Cómo crear una cuenta?', 'Proteger mi cuenta', '¿Cómo enviar dinero?', '¿Qué puedes hacer?'],
      },
      sw: {
        title: 'Karibu UQ 👋',
        content:
          'Nimefurahi kukujua!\n\nKama unaanza, hizi ni hatua tatu za kwanza muhimu:\n1️⃣ Linda akaunti yako (PIN, 2FA, biometria)\n2️⃣ Elewa akiba yako ya usalama ya BORB\n3️⃣ Badilisha sehemu ya akiba yako kuwa sarafu ili kutuma pesa\n\nNiambie jina lako au kilichokuleta, nikutoelekeze kwa usahihi.',
        suggestions: ['Jinsi ya kufungua akaunti?', 'Linda akaunti yangu', 'Jinsi ya kutuma pesa?', 'Unaweza kufanya nini?'],
      },
    }
  ),

  MANUAL(
    'chat_apology',
    'chat',
    al(
      ['desole', 'desolee', 'je suis desole', 'je suis desolee', 'pardon', 'excuse moi', 'toutes mes excuses', 'mea culpa', 'au temps pour moi'],
      ['sorry', 'im sorry', 'i am sorry', 'my bad', 'apologies', 'my apologies', 'excuse me', 'pardon me'],
      ['perdon', 'lo siento', 'disculpa', 'disculpe', 'mis disculpas', 'perdoname', 'te pido perdon'],
      ['samahani', 'naomba msamaha', 'nisamehe', 'samahani sana', 'naomba radhi']
    ),
    {
      fr: {
        title: 'Aucun souci 🙂',
        content:
          "Aucun souci, ça arrive à tout le monde.\n\nOn reprend quand tu veux. Je peux t'aider sur le compte, la sécurité, le BORB, la réserve BORB, les paiements, les devises, Zando, l'UBI, l'épargne ou le crédit.",
        suggestions: ['Que peux-tu faire ?', 'Comment envoyer de l’argent ?', 'Sécuriser mon compte', 'Contacter le support'],
      },
      en: {
        title: 'No worries 🙂',
        content:
          "No worries, it happens to everyone.\n\nWe can pick up whenever you like. I can help with your account, security, BORB, BORB reserve, payments, currencies, Zando, UBI, savings or credit.",
        suggestions: ['What can you do?', 'How to send money?', 'Secure my account', 'Contact support'],
      },
      es: {
        title: 'No pasa nada 🙂',
        content:
          'No pasa nada, le pasa a todo el mundo.\n\nRetomamos cuando quieras. Puedo ayudarte con la cuenta, la seguridad, BORB, la reserva BORB, los pagos, las divisas, Zando, el UBI, el ahorro o el crédito.',
        suggestions: ['¿Qué puedes hacer?', '¿Cómo enviar dinero?', 'Proteger mi cuenta', 'Contactar soporte'],
      },
      sw: {
        title: 'Hakuna shida 🙂',
        content:
          'Hakuna shida, hutokea kwa kila mtu.\n\nTunaweza kuendelea wakati wowote. Ninaweza kukusaidia kuhusu akaunti, usalama, BORB, akiba ya BORB, malipo, sarafu, Zando, UBI, akiba au mkopo.',
        suggestions: ['Unaweza kufanya nini?', 'Jinsi ya kutuma pesa?', 'Linda akaunti yangu', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_compliment',
    'chat',
    al(
      ['tu es genial', 'tu es super', 'tu es top', 'tu es fort', 'tu es intelligente', 'tu es sympa', 'bravo', 'bien joue', 't es genial', 'tres bonne reponse', 'bonne reponse'],
      ['you are great', 'youre great', 'you are awesome', 'youre awesome', 'you are smart', 'youre smart', 'well done', 'good job', 'great answer', 'nice one', 'you rock'],
      ['eres genial', 'eres bueno', 'eres inteligente', 'eres simpatico', 'bien hecho', 'buen trabajo', 'buena respuesta', 'muy bien'],
      ['wewe ni mzuri', 'wewe ni hodari', 'umefanya vizuri', 'kazi imefanikiwa', 'jibu zuri', 'asante kwa jibu', 'wewe ni smart']
    ),
    {
      fr: {
        title: 'Merci beaucoup 🙌',
        content:
          "Merci beaucoup, ça fait plaisir !\n\nSi tu veux, on peut avancer sur autre chose : comprendre le BORB, gérer ta réserve de sécurité, envoyer une devise, acheter de la réserve BORB ou sécuriser ton compte.",
        suggestions: ['Que peux-tu faire ?', "C'est quoi le BORB ?", 'Comment gagner des BORB ?', 'Contacter le support'],
      },
      en: {
        title: 'Thank you 🙌',
        content:
          "Thank you, that's kind of you!\n\nIf you'd like, we can move on to something else: understanding BORB, managing your security reserve, sending a currency, buying BORB reserve or securing your account.",
        suggestions: ['What can you do?', 'What is BORB?', 'How to earn BORB?', 'Contact support'],
      },
      es: {
        title: 'Gracias 🙌',
        content:
          '¡Muchas gracias, me alegra!\n\nSi quieres, podemos seguir con otra cosa: entender BORB, gestionar tu reserva de seguridad, enviar una divisa, comprar reserva BORB o proteger tu cuenta.',
        suggestions: ['¿Qué puedes hacer?', '¿Qué es el BORB?', '¿Cómo ganar BORB?', 'Contactar soporte'],
      },
      sw: {
        title: 'Asante sana 🙌',
        content:
          'Asante sana, nimefurahi!\n\nKama unataka, tunaweza kuendelea na jambo lingine: kuelewa BORB, kusimamia akiba yako ya usalama, kutuma sarafu, kununua akiba ya BORB au kulinda akaunti yako.',
        suggestions: ['Unaweza kufanya nini?', 'BORB ni nini?', 'Jinsi ya kupata BORB?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_capabilities',
    'chat',
    al(
      ['que peux tu faire', 'tu peux m aider', 'tu sers a quoi', 'j ai besoin d aide', 'comment tu marches', 'tu fais quoi', 'aide moi'],
      ['what can you do', 'can you help me', 'what do you do', 'help me', 'how do you work', 'what are you able to do'],
      ['que puedes hacer', 'puedes ayudarme', 'para que sirves', 'ayudame', 'como funcionas'],
      ['unaweza kufanya nini', 'nisaidie', 'unaweza kunisaidia', 'unafanya kazi gani', 'nisaidie tafadhali']
    ),
    {
      fr: {
        title: 'Ce que je peux faire',
        content:
          "Voici ce que je sais faire :\n\n💰 Expliquer le BORB, les 6 unités et les 6 Cases\n🔐 Guider sur la sécurité : PIN, 2FA, biométrie, Shamir, BlackKey\n💸 Aider sur les paiements, frais, transferts et historique\n🏪 T'aider à acheter ou vendre sur Zando, et comprendre l'escrow\n🌾 Expliquer l'UBI, les bulles et les façons de gagner des BORB\n💤 T'expliquer l'épargne, le crédit et le trading\n📞 Te diriger vers le support humain si nécessaire\n\nDis-moi simplement ce qui te bloque.",
        suggestions: ['Comment créer un compte ?', 'Comment sécuriser mon compte ?', 'Comment gagner des BORB ?', 'Contacter le support'],
      },
      en: {
        title: 'What I can do',
        content:
          "Here's what I can help with:\n\n💰 Explain BORB, the 6 units and the 6 Cases\n🔐 Guide you on security: PIN, 2FA, biometrics, Shamir, BlackKey\n💸 Help with payments, fees, transfers and history\n🏪 Buy or sell on Zando and understand escrow\n🌾 Explain UBI, bubbles and ways to earn BORB\n💤 Explain savings, credit and trading\n📞 Point you to human support when needed\n\nJust tell me what's blocking you.",
        suggestions: ['How to create an account?', 'How to secure my account?', 'How to earn BORB?', 'Contact support'],
      },
      es: {
        title: 'Lo que puedo hacer',
        content:
          'Esto es lo que puedo hacer:\n\n💰 Explicar BORB, las 6 unidades y las 6 Cases\n🔐 Guiarte en seguridad: PIN, 2FA, biometría, Shamir, BlackKey\n💸 Ayudar con pagos, comisiones, transferencias e historial\n🏪 Comprar o vender en Zando y entender el escrow\n🌾 Explicar el UBI, las burbujas y las formas de ganar BORB\n💤 Explicar ahorro, crédito y trading\n📞 Dirigirte al soporte humano si hace falta\n\nDime qué te bloquea.',
        suggestions: ['¿Cómo crear una cuenta?', '¿Cómo proteger mi cuenta?', '¿Cómo ganar BORB?', 'Contactar soporte'],
      },
      sw: {
        title: 'Ninachoweza kufanya',
        content:
          'Hivi ndivyo ninavyoweza kukusaidia:\n\n💰 Kueleza BORB, vipimo 6 na Kesi 6\n🔐 Kukuongoza kuhusu usalama: PIN, 2FA, biometria, Shamir, BlackKey\n💸 Kukusaidia kuhusu malipo, ada, uhamisho na historia\n🏪 Kununua au kuuza Zando na kuelewa escrow\n🌾 Kueleza UBI, mapovu na njia za kupata BORB\n💤 Kueleza akiba, mkopo na biashara\n📞 Kukuelekeza kwa msaada wa binadamu inapohitajika\n\nNiambie kinachokuzuia.',
        suggestions: ['Jinsi ya kufungua akaunti?', 'Jinsi ya kulinda akaunti?', 'Jinsi ya kupata BORB?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_confusion',
    'chat',
    al(
      ['je comprends pas', 'je ne comprends pas', 'j ai pas compris', 'explique moi', 'plus simple', 'je suis perdu', 'je capte rien', 'tu es clair', 'reformule', 'c est pas clair', 'je ne sais pas quoi faire'],
      ['i dont understand', 'i do not understand', 'explain again', 'simpler', 'i am lost', 'what do you mean', 'not clear', 'i dont get it', 'help me understand'],
      ['no entiendo', 'no comprendo', 'explicame', 'mas simple', 'estoy perdido', 'no me queda claro', 'no entiendo nada'],
      ['sielewi', 'sijaelewa', 'nieleze', 'kwa urahisi', 'nimepotea', 'maana gani', 'si wazi', 'sielewi vizuri']
    ),
    {
      fr: {
        title: 'On va simplifier 🙂',
        content:
          "Pas de problème, on va simplifier.\n\nDis-moi juste ce que tu cherches :\n• créer ou sécuriser ton compte\n• comprendre le BORB\n• gagner des BORB\n• payer ou transférer\n• acheter ou vendre sur Zando\n• contacter le support\n\nTu peux aussi copier-coller ta question telle quelle, même mal écrite.",
        suggestions: ['Comment créer un compte ?', "C'est quoi le BORB ?", 'Comment gagner des BORB ?', 'Contacter le support'],
      },
      en: {
        title: 'Let’s simplify 🙂',
        content:
          "No problem, let's simplify.\n\nJust tell me what you're looking for:\n• create or secure your account\n• understand BORB\n• earn BORB\n• pay or transfer\n• buy or sell on Zando\n• contact support\n\nYou can also paste your question as it is, even with mistakes.",
        suggestions: ['How to create an account?', 'What is BORB?', 'How to earn BORB?', 'Contact support'],
      },
      es: {
        title: 'Vamos a simplificar 🙂',
        content:
          'Sin problema, vamos a simplificar.\n\nDime qué buscas:\n• crear o proteger tu cuenta\n• entender el BORB\n• ganar BORB\n• pagar o transferir\n• comprar o vender en Zando\n• contactar soporte\n\nTambién puedes pegar tu pregunta tal cual, aunque tenga faltas.',
        suggestions: ['¿Cómo crear una cuenta?', '¿Qué es el BORB?', '¿Cómo ganar BORB?', 'Contactar soporte'],
      },
      sw: {
        title: 'Turahisishe 🙂',
        content:
          'Hakuna shida, turahisishe.\n\nNiambie unatafuta nini:\n• kufungua au kulinda akaunti\n• kuelewa BORB\n• kupata BORB\n• kulipa au kuhamisha\n• kununua au kuuza Zando\n• kuwasiliana na msaada\n\nUnaweza pia kunakili swali lako kama lilivyo, hata likiwa na makosa.',
        suggestions: ['Jinsi ya kufungua akaunti?', 'BORB ni nini?', 'Jinsi ya kupata BORB?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_frustration',
    'chat',
    al(
      ['ca marche pas', 'ca ne marche pas', 'rien ne marche', 'c est nul', 'je suis bloque', 'impossible', 'erreur', 'probleme', 'j en ai marre', 'c est frustrant', 'je n y arrive pas'],
      ['it doesnt work', 'nothing works', 'this is bad', 'im stuck', 'error', 'bug', 'problem', 'frustrating', 'useless', 'i cant do it'],
      ['no funciona', 'nada funciona', 'esto es malo', 'estoy bloqueado', 'error', 'problema', 'es frustrante', 'no puedo'],
      ['haifanyi kazi', 'hakuna kinachofanya kazi', 'nimekwama', 'kosa', 'tatizo', 'inachosha', 'siwezi']
    ),
    {
      fr: {
        title: 'Je comprends 🙏',
        content:
          "Je comprends que ce soit frustrant. Je ne veux pas te faire perdre de temps.\n\nDis-moi précisément ce qui ne marche pas : connexion, 2FA, paiement, Zando, application lente... Je te donnerai les étapes concrètes.\n\nSi ton compte est bloqué ou si des fonds sont en jeu, le support humain peut intervenir : support@ufundi.uq.\n\n⚠️ Ne partage jamais ta clé privée, ton PIN ou ton code 2FA.",
        suggestions: ['Je n’arrive pas à me connecter', 'J’ai perdu mon 2FA', 'Problème de paiement', 'Contacter le support'],
      },
      en: {
        title: 'I understand 🙏',
        content:
          "I get that this is frustrating. I don't want to waste your time.\n\nTell me exactly what's failing: login, 2FA, payment, Zando, slow app... I'll give you concrete steps.\n\nIf your account is blocked or funds are involved, human support can step in: support@ufundi.uq.\n\n⚠️ Never share your private key, PIN or 2FA code.",
        suggestions: ['I can’t log in', 'I lost my 2FA', 'Payment problem', 'Contact support'],
      },
      es: {
        title: 'Te entiendo 🙏',
        content:
          'Entiendo que sea frustrante. No quiero hacerte perder tiempo.\n\nDime exactamente qué falla: inicio de sesión, 2FA, pago, Zando, app lenta... Te daré pasos concretos.\n\nSi tu cuenta está bloqueada o hay fondos en juego, el soporte humano puede intervenir: support@ufundi.uq.\n\n⚠️ Nunca compartas tu clave privada, tu PIN ni tu código 2FA.',
        suggestions: ['No puedo iniciar sesión', 'Perdí mi 2FA', 'Problema de pago', 'Contactar soporte'],
      },
      sw: {
        title: 'Nakuelewa 🙏',
        content:
          'Naelewa kuwa hii inachosha. Sitaki kukupotezea muda.\n\nNiambie hasa kitu gani hakifanyi kazi: kuingia, 2FA, malipo, Zando, programu polepole... nitakupa hatua halisi.\n\nKama akaunti yako imezuiwa au kuna fedha, msaada wa binadamu unaweza kuingilia: support@ufundi.uq.\n\n⚠️ Usitoe ufunguo wako wa siri, PIN au msimbo wa 2FA kwa mtu yeyote.',
        suggestions: ['Siwezi kuingia', 'Nimepoteza 2FA', 'Tatizo la malipo', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_ack',
    'chat',
    al(
      ['ok', 'okay', 'd accord', 'oui', 'non', 'compris', 'c est bon', 'parfait', 'super', 'bien', 'tres bien'],
      ['ok', 'okay', 'yes', 'no', 'got it', 'i see', 'perfect', 'great', 'fine', 'alright'],
      ['ok', 'vale', 'si', 'no', 'entendido', 'perfecto', 'bien', 'de acuerdo'],
      ['sawa', 'ndiyo', 'hapana', 'nimeelewa', 'vizuri', 'poa', 'sawa sawa']
    ),
    {
      fr: {
        title: 'Parfait 👍',
        content:
          'Dis-moi sur quoi tu veux avancer : compte, BORB, sécurité, paiements, Zando, UBI ou épargne.',
        suggestions: ['Comment créer un compte ?', 'Comment gagner des BORB ?', 'Sécuriser mon compte', 'Comment vendre sur Zando ?'],
      },
      en: {
        title: 'Perfect 👍',
        content:
          'Tell me what you want to move forward with: account, BORB, security, payments, Zando, UBI or savings.',
        suggestions: ['How to create an account?', 'How to earn BORB?', 'Secure my account', 'How to sell on Zando?'],
      },
      es: {
        title: 'Perfecto 👍',
        content:
          'Dime con qué quieres avanzar: cuenta, BORB, seguridad, pagos, Zando, UBI o ahorro.',
        suggestions: ['¿Cómo crear una cuenta?', '¿Cómo ganar BORB?', 'Proteger mi cuenta', '¿Cómo vender en Zando?'],
      },
      sw: {
        title: 'Sawa 👍',
        content:
          'Niambie unataka kuendelea na nini: akaunti, BORB, usalama, malipo, Zando, UBI au akiba.',
        suggestions: ['Jinsi ya kufungua akaunti?', 'Jinsi ya kupata BORB?', 'Linda akaunti yangu', 'Jinsi ya kuuza Zando?'],
      },
    }
  ),

  MANUAL(
    'chat_test',
    'chat',
    al(
      ['test', 'testing', 'tu me recois', 'tu es la', 'ping', 'essai', 'tu m entends'],
      ['test', 'testing', 'can you hear me', 'are you there', 'ping', 'test test'],
      ['prueba', 'test', 'me escuchas', 'estas ahi', 'ping'],
      ['jaribio', 'test', 'unanisikia', 'upo', 'ping']
    ),
    {
      fr: {
        title: 'Bien reçu ✅',
        content:
          'Je te lis parfaitement. Tu peux maintenant me poser une vraie question : compte, BORB, sécurité, paiements, Zando, UBI...',
        suggestions: ['Comment créer un compte ?', "C'est quoi le BORB ?", 'Comment gagner des BORB ?', 'Contacter le support'],
      },
      en: {
        title: 'Got it ✅',
        content:
          'I read you perfectly. Now ask me a real question: account, BORB, security, payments, Zando, UBI...',
        suggestions: ['How to create an account?', 'What is BORB?', 'How to earn BORB?', 'Contact support'],
      },
      es: {
        title: 'Recibido ✅',
        content:
          'Te leo perfectamente. Ahora hazme una pregunta real: cuenta, BORB, seguridad, pagos, Zando, UBI...',
        suggestions: ['¿Cómo crear una cuenta?', '¿Qué es BORB?', '¿Cómo ganar BORB?', 'Contactar soporte'],
      },
      sw: {
        title: 'Nimekusikia ✅',
        content:
          'Nakusikia vizuri. Sasa niulize swali halisi: akaunti, BORB, usalama, malipo, Zando, UBI...',
        suggestions: ['Jinsi ya kufungua akaunti?', 'BORB ni nini?', 'Jinsi ya kupata BORB?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'chat_language',
    'chat',
    al(
      ['parle anglais', 'parle en anglais', 'reponds en anglais', 'parle espagnol', 'parle swahili', 'change de langue', 'autre langue', 'en anglais svp', 'tu parles anglais'],
      ['speak french', 'answer in french', 'speak spanish', 'speak swahili', 'change language', 'another language', 'in english please', 'do you speak french'],
      ['habla frances', 'habla ingles', 'habla swahili', 'cambiar idioma', 'otro idioma', 'en ingles por favor'],
      ['zungumza kiingereza', 'zungumza kifaransa', 'zungumza kihispania', 'badilisha lugha', 'lugha nyingine', 'kwa kiingereza tafadhali']
    ),
    {
      fr: {
        title: 'Langues disponibles',
        content:
          "Bien sûr. Je peux répondre en français, anglais, espagnol et kiswahili.\n\nÉcris simplement dans la langue que tu préfères, même avec des fautes. Tu peux aussi changer la langue avec le bouton en haut à droite de l'assistant.",
        suggestions: ['Comment créer un compte ?', 'Comment gagner des BORB ?', 'Parler à un humain', 'La sécurité'],
      },
      en: {
        title: 'Available languages',
        content:
          "Of course. I can answer in French, English, Spanish and Swahili.\n\nJust write in the language you prefer, typos are fine. You can also change the language with the button at the top right of the assistant.",
        suggestions: ['How to create an account?', 'How to earn BORB?', 'Talk to a human', 'Security'],
      },
      es: {
        title: 'Idiomas disponibles',
        content:
          'Claro. Puedo responder en francés, inglés, español y suajili.\n\nEscribe en el idioma que prefieras, aunque tengas faltas. También puedes cambiar el idioma con el botón de arriba a la derecha del asistente.',
        suggestions: ['¿Cómo crear una cuenta?', '¿Cómo ganar BORB?', 'Hablar con una persona', 'Seguridad'],
      },
      sw: {
        title: 'Lugha zinazopatikana',
        content:
          'Bila shaka. Ninaweza kujibu kwa Kifaransa, Kiingereza, Kihispania na Kiswahili.\n\nAndika kwa lugha unayopendelea, hata ukiwa na makosa. Unaweza pia kubadilisha lugha kwa kitufe kilicho juu kulia kwenye msaidizi.',
        suggestions: ['Jinsi ya kufungua akaunti?', 'Jinsi ya kupata BORB?', 'Zungumza na mtu', 'Usalama'],
      },
    }
  ),

  MANUAL(
    'topic_start',
    'topic',
    al(
      ['par ou commencer', 'je debute', 'comment utiliser uq', 'comment marche l application', 'c est quoi uq', 'presente moi uq', 'je viens de creer mon compte', 'premiers pas', 'guide de demarrage', 'je suis nouveau'],
      ['where do i start', 'im new', 'how to use uq', 'how does the app work', 'what is uq', 'getting started', 'first steps', 'i just created my account'],
      ['por donde empiezo', 'soy nuevo', 'como usar uq', 'como funciona la app', 'que es uq', 'primeros pasos', 'acabo de crear mi cuenta'],
      ['nianze wapi', 'mimi ni mpya', 'jinsi ya kutumia uq', 'programu inafanya kazi vipi', 'uq ni nini', 'hatua za kwanza', 'nimefungua akaunti mpya']
    ),
    {
      fr: {
        title: 'Bienvenue dans UQ 👋',
        content:
          "Voici le chemin le plus simple pour commencer :\n\n1. 👤 Crée ton compte et vérifie ton identité.\n2. 🔐 Active ton PIN, la 2FA et la biométrie.\n3. 🌾 Réclame ton UBI et gagne des bulles par ton activité.\n4. 💸 Paie, transfère, épargne ou emprunte en BORB.\n5. 🏪 Vends sur Zando ou publie du contenu dans le Lecteur UQ.\n\nMon conseil : sécurise d'abord ton compte, puis explore une fonction à la fois.\n\nTu veux commencer par quoi ?",
        suggestions: ['Comment créer un compte ?', 'Comment activer la 2FA ?', "Qu'est-ce que l'UBI ?", 'Comment vendre sur Zando ?'],
      },
      en: {
        title: 'Welcome to UQ 👋',
        content:
          "Here's the simplest way to start:\n\n1. 👤 Create your account and verify your identity.\n2. 🔐 Enable your PIN, 2FA and biometrics.\n3. 🌾 Claim your UBI and earn bubbles through activity.\n4. 💸 Pay, transfer, save or borrow in BORB.\n5. 🏪 Sell on Zando or publish content in the UQ Reader.\n\nMy advice: secure your account first, then explore one feature at a time.\n\nWhere would you like to start?",
        suggestions: ['How to create an account?', 'How to enable 2FA?', 'What is UBI?', 'How to sell on Zando?'],
      },
      es: {
        title: 'Bienvenido a UQ 👋',
        content:
          'Este es el camino más simple para empezar:\n\n1. 👤 Crea tu cuenta y verifica tu identidad.\n2. 🔐 Activa tu PIN, 2FA y biometría.\n3. 🌾 Reclama tu UBI y gana burbujas con tu actividad.\n4. 💸 Paga, transfiere, ahorra o pide un préstamo en BORB.\n5. 🏪 Vende en Zando o publica contenido en el Lector UQ.\n\nMi consejo: primero protege tu cuenta, luego explora una función a la vez.\n\n¿Por dónde quieres empezar?',
        suggestions: ['¿Cómo crear una cuenta?', '¿Cómo activar 2FA?', '¿Qué es el UBI?', '¿Cómo vender en Zando?'],
      },
      sw: {
        title: 'Karibu UQ 👋',
        content:
          'Hii ni njia rahisi ya kuanza:\n\n1. 👤 Fungua akaunti na thibitisha utambulisho wako.\n2. 🔐 Wezesha PIN, 2FA na biometria.\n3. 🌾 Dai UBI yako na pata mapovu kwa shughuli zako.\n4. 💸 Lipa, hamisha, weka akiba au kopa kwa BORB.\n5. 🏪 Uza Zando au weka maudhui kwenye Lector UQ.\n\nUshauri wangu: linda akaunti kwanza, kisha chunguza kipengele kimoja kwa mara.\n\nUnataka kuanza wapi?',
        suggestions: ['Jinsi ya kufungua akaunti?', 'Jinsi ya kuwezesha 2FA?', 'UBI ni nini?', 'Jinsi ya kuuza Zando?'],
      },
    }
  ),

  MANUAL(
    'topic_trust',
    'safety',
    al(
      ['c est une arnaque', 'est ce fiable', 'uq est fiable', 'c est sur', 'est ce que je peux faire confiance', 'on m a dit que c est une arnaque', 'arnaque', 'escroquerie', 'fiable', 'confiance', 'uq est une arnaque', 'eske c fiable', 'esque c fiable', 'c fiable', 'eske c sur'],
      ['is this a scam', 'is uq legit', 'is it safe', 'can i trust uq', 'scam', 'fraud', 'trustworthy', 'is uq a scam'],
      ['es una estafa', 'es confiable', 'es seguro', 'puedo confiar', 'estafa', 'fraude', 'uq es una estafa'],
      ['hii ni utapeli', 'uq ni ya kuaminika', 'ni salama', 'naweza kuamini', 'utapeli', 'ulaghai', 'uq ni utapeli']
    ),
    {
      fr: {
        title: 'UQ est-il fiable ?',
        content:
          "Bonne question — c'est normal de vérifier. Voici des faits concrets, pas des promesses :\n\n• Masse fixe : 40 milliards BORB, jamais créés ni brûlés.\n• Chaque transaction est vérifiée par l'invariant : somme des 6 Cases + Compteur = 40 milliards.\n• Sécurité : UqBlackKey 512 bits, Shamir 3/5, 2FA, biométrie, stockage P2P.\n• Support humain joignable : support@ufundi.uq.\n• Aucun rendement garanti n'est promis : les gains viennent de l'activité réelle (UBI, ventes, contenu, services).\n\n⚠️ Personne ne doit te demander ta clé privée, ton code 2FA ou ton PIN. Si on te le demande, c'est une tentative de fraude.",
        suggestions: ['La sécurité de mon compte', 'Shamir 3/5', 'Comment gagner des BORB ?', 'Contacter le support'],
      },
      en: {
        title: 'Is UQ trustworthy?',
        content:
          "Good question — it's normal to check. Here are concrete facts, not promises:\n\n• Fixed supply: 40 billion BORB, never created or burned.\n• Every transaction is checked by the invariant: sum of the 6 Cases + Counter = 40 billion.\n• Security: 512-bit UqBlackKey, Shamir 3/5, 2FA, biometrics, P2P storage.\n• Human support is reachable: support@ufundi.uq.\n• No guaranteed return is promised: earnings come from real activity (UBI, sales, content, services).\n\n⚠️ Nobody should ask for your private key, 2FA code or PIN. If they do, it's a fraud attempt.",
        suggestions: ['My account security', 'Shamir 3/5', 'How to earn BORB?', 'Contact support'],
      },
      es: {
        title: '¿UQ es confiable?',
        content:
          'Buena pregunta — es normal verificar. Aquí tienes hechos concretos, no promesas:\n\n• Suministro fijo: 40 mil millones de BORB, nunca creados ni quemados.\n• Cada transacción se verifica con el invariante: suma de las 6 Cases + Contador = 40 mil millones.\n• Seguridad: UqBlackKey de 512 bits, Shamir 3/5, 2FA, biometría, almacenamiento P2P.\n• Soporte humano disponible: support@ufundi.uq.\n• No se promete rendimiento garantizado: las ganancias vienen de actividad real (UBI, ventas, contenido, servicios).\n\n⚠️ Nadie debe pedirte tu clave privada, tu código 2FA o tu PIN. Si lo hacen, es un intento de fraude.',
        suggestions: ['Seguridad de mi cuenta', 'Shamir 3/5', '¿Cómo ganar BORB?', 'Contactar soporte'],
      },
      sw: {
        title: 'UQ inaaminika?',
        content:
          'Swali zuri — ni kawaida kuhakiki. Hapa kuna ukweli halisi, si ahadi:\n\n• Kiasi maalum: BORB bilioni 40, hazijawahi kuundwa au kuchomwa.\n• Kila muamala unahakikiwa kwa kanuni: jumla ya Kesi 6 + Kihesabu = bilioni 40.\n• Usalama: UqBlackKey ya biti 512, Shamir 3/5, 2FA, biometria, hifadhi ya P2P.\n• Msaada wa binadamu unapatikana: support@ufundi.uq.\n• Hakuna faida iliyohakikishwa: mapato yanatoka kwenye shughuli halisi (UBI, mauzo, maudhui, huduma).\n\n⚠️ Hakuna mtu anayepaswa kukuomba ufunguo wako wa siri, msimbo wa 2FA au PIN. Akikuomba, ni jaribio la ulaghai.',
        suggestions: ['Usalama wa akaunti yangu', 'Shamir 3/5', 'Jinsi ya kupata BORB?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_support',
    'topic',
    al(
      ['parler a un humain', 'contacter le support', 'service client', 'support uq', 'contacter un agent', 'assistance', 'j ai besoin d un humain', 'mail support', 'numero support', 'support'],
      ['talk to a human', 'contact support', 'customer service', 'support uq', 'speak to an agent', 'help desk', 'support email', 'support number', 'support'],
      ['hablar con una persona', 'contactar soporte', 'servicio al cliente', 'soporte uq', 'hablar con un agente', 'correo de soporte', 'soporte'],
      ['kuzungumza na mtu', 'wasiliana na msaada', 'huduma kwa wateja', 'msaada wa uq', 'msaada wa binadamu', 'barua pepe ya msaada', 'msaada']
    ),
    {
      fr: {
        title: 'Parler à un humain',
        content:
          "Bien sûr. Le support UQ est humain :\n\n📧 support@ufundi.uq\n🔒 Pour les données personnelles : privacy@ufundi.uq\n\nPour aller plus vite, précise : ton pseudo UQ, le problème (connexion, paiement, 2FA, Zando...) et ce que tu as déjà essayé.\n\n⚠️ Ne partage jamais ta clé privée, ton PIN ou ton code 2FA.",
        suggestions: ['J’ai perdu mon 2FA', 'Mon téléphone a été volé', 'Signaler un bug', 'La sécurité'],
      },
      en: {
        title: 'Talk to a human',
        content:
          "Of course. UQ support is human:\n\n📧 support@ufundi.uq\n🔒 For personal data: privacy@ufundi.uq\n\nTo get help faster, include: your UQ username, the problem (login, payment, 2FA, Zando...) and what you already tried.\n\n⚠️ Never share your private key, PIN or 2FA code.",
        suggestions: ['I lost my 2FA', 'My phone was stolen', 'Report a bug', 'Security'],
      },
      es: {
        title: 'Hablar con una persona',
        content:
          'Claro. El soporte de UQ es humano:\n\n📧 support@ufundi.uq\n🔒 Para datos personales: privacy@ufundi.uq\n\nPara ir más rápido, indica: tu usuario UQ, el problema (inicio de sesión, pago, 2FA, Zando...) y lo que ya intentaste.\n\n⚠️ Nunca compartas tu clave privada, tu PIN ni tu código 2FA.',
        suggestions: ['Perdí mi 2FA', 'Me robaron el teléfono', 'Reportar un error', 'Seguridad'],
      },
      sw: {
        title: 'Zungumza na mtu',
        content:
          'Bila shaka. Msaada wa UQ ni wa binadamu:\n\n📧 support@ufundi.uq\n🔒 Kwa data binafsi: privacy@ufundi.uq\n\nIli upate msaada haraka, eleza: jina lako la UQ, tatizo (kuingia, malipo, 2FA, Zando...) na ulichojaribu.\n\n⚠️ Usitoe ufunguo wako wa siri, PIN au msimbo wa 2FA.',
        suggestions: ['Nimepoteza 2FA', 'Simu yangu imeibiwa', 'Ripoti hitilafu', 'Usalama'],
      },
    }
  ),

  MANUAL(
    'topic_report_bug',
    'topic',
    al(
      ['signaler un bug', 'rapporter un bug', 'j ai trouve un bug', 'il y a un bug', 'signaler une erreur', 'probleme technique', 'l application plante', 'ca plante'],
      ['report a bug', 'found a bug', 'report an error', 'technical problem', 'app crashes', 'app is broken'],
      ['reportar un error', 'encontre un bug', 'problema tecnico', 'la app se cierra', 'informar de un problema'],
      ['ripoti hitilafu', 'nimepata hitilafu', 'tatizo la kiufundi', 'programu inaanguka', 'ripoti kosa']
    ),
    {
      fr: {
        title: 'Signaler un bug',
        content:
          "Merci de vouloir améliorer UQ. Pour un bug :\n\n1. Décris ce que tu faisais.\n2. Note le message d'erreur exact.\n3. Indique l'heure et ton appareil.\n4. Envoie le tout à support@ufundi.uq.\n\nSi c'est urgent (compte bloqué, fonds en jeu), dis-le clairement dans l'objet du message.",
        suggestions: ['Contacter le support', 'J’ai perdu mon 2FA', 'Mon téléphone a été volé', 'La sécurité'],
      },
      en: {
        title: 'Report a bug',
        content:
          "Thanks for helping improve UQ. For a bug:\n\n1. Describe what you were doing.\n2. Copy the exact error message.\n3. Note the time and your device.\n4. Send everything to support@ufundi.uq.\n\nIf it's urgent (blocked account, funds involved), say so clearly in the subject line.",
        suggestions: ['Contact support', 'I lost my 2FA', 'My phone was stolen', 'Security'],
      },
      es: {
        title: 'Reportar un error',
        content:
          'Gracias por ayudar a mejorar UQ. Para un error:\n\n1. Describe qué estabas haciendo.\n2. Copia el mensaje de error exacto.\n3. Indica la hora y tu dispositivo.\n4. Envía todo a support@ufundi.uq.\n\nSi es urgente (cuenta bloqueada, fondos en juego), dilo claramente en el asunto.',
        suggestions: ['Contactar soporte', 'Perdí mi 2FA', 'Me robaron el teléfono', 'Seguridad'],
      },
      sw: {
        title: 'Ripoti hitilafu',
        content:
          'Asante kwa kusaidia kuboresha UQ. Kwa hitilafu:\n\n1. Eleza ulichokuwa unafanya.\n2. Nakili ujumbe wa kosa halisi.\n3. Eleza muda na kifaa chako.\n4. Tuma kila kitu kwa support@ufundi.uq.\n\nKama ni dharura (akaunti imezuiwa, fedha zimo), eleza wazi kwenye kichwa cha ujumbe.',
        suggestions: ['Wasiliana na msaada', 'Nimepoteza 2FA', 'Simu yangu imeibiwa', 'Usalama'],
      },
    }
  ),

  MANUAL(
    'topic_security',
    'safety',
    al(
      ['securite de mon compte', 'comment securiser mon compte', 'proteger mon compte', 'securite uq', 'blackkey', 'qu est ce que blackkey', 'niveau de securite', 'securiser', 'securite'],
      ['account security', 'secure my account', 'protect my account', 'uq security', 'what is blackkey', 'security levels', 'keep my account safe', 'security'],
      ['seguridad de mi cuenta', 'proteger mi cuenta', 'seguridad uq', 'que es blackkey', 'niveles de seguridad', 'seguridad'],
      ['usalama wa akaunti', 'linda akaunti yangu', 'usalama wa uq', 'blackkey ni nini', 'ngazi za usalama', 'usalama']
    ),
    {
      fr: {
        title: 'La sécurité de ton compte',
        content:
          "Ta sécurité repose sur 5 niveaux :\n\n1. 🔑 UqBlackKey (512 bits)\n2. 🛡️ vTEE (environnement isolé)\n3. 🔐 2FA (double authentification)\n4. 🧩 Shamir 3/5 (5 fragments, 3 suffisent)\n5. 📡 Stockage P2P chiffré\n\nLes bons réflexes :\n• Active la 2FA et la biométrie\n• Ne partage jamais ta clé privée, ton PIN ou tes codes\n• Méfie-toi de toute personne qui te demande ces informations\n• Vérifie le destinataire avant chaque envoi\n\nTu veux que je t'explique un niveau en particulier ?",
        suggestions: ['Comment activer la 2FA ?', 'Shamir 3/5', 'Que faire si mon téléphone est volé ?', 'J’ai perdu mon 2FA'],
      },
      en: {
        title: 'Your account security',
        content:
          "Your security has 5 layers:\n\n1. 🔑 UqBlackKey (512 bits)\n2. 🛡️ vTEE (isolated environment)\n3. 🔐 2FA (two-factor authentication)\n4. 🧩 Shamir 3/5 (5 fragments, any 3 are enough)\n5. 📡 Encrypted P2P storage\n\nBest practices:\n• Enable 2FA and biometrics\n• Never share your private key, PIN or codes\n• Be suspicious of anyone asking for them\n• Check the recipient before every transfer\n\nWant me to explain a specific layer?",
        suggestions: ['How to enable 2FA?', 'Shamir 3/5', 'What if my phone is stolen?', 'I lost my 2FA'],
      },
      es: {
        title: 'La seguridad de tu cuenta',
        content:
          'Tu seguridad tiene 5 niveles:\n\n1. 🔑 UqBlackKey (512 bits)\n2. 🛡️ vTEE (entorno aislado)\n3. 🔐 2FA (doble autenticación)\n4. 🧩 Shamir 3/5 (5 fragmentos, bastan 3)\n5. 📡 Almacenamiento P2P cifrado\n\nBuenas prácticas:\n• Activa 2FA y biometría\n• Nunca compartas tu clave privada, tu PIN ni tus códigos\n• Desconfía de quien te los pida\n• Verifica el destinatario antes de cada envío\n\n¿Quieres que te explique un nivel en concreto?',
        suggestions: ['¿Cómo activar 2FA?', 'Shamir 3/5', '¿Qué hago si me roban el teléfono?', 'Perdí mi 2FA'],
      },
      sw: {
        title: 'Usalama wa akaunti yako',
        content:
          'Usalama wako una ngazi 5:\n\n1. 🔑 UqBlackKey (biti 512)\n2. 🛡️ vTEE (mazingira yaliyotengwa)\n3. 🔐 2FA (uthibitishaji mara mbili)\n4. 🧩 Shamir 3/5 (vipande 5, vitatu vinatosha)\n5. 📡 Hifadhi ya P2P iliyosimbwa\n\nMazoea bora:\n• Wezesha 2FA na biometria\n• Usitoe ufunguo wako wa siri, PIN au misimbo\n• Kuwa mwangalifu kwa yeyote anayekuomba hivyo\n• Hakiki mpokeaji kabla ya kila uhamisho\n\nUnataka nikueleze ngazi fulani?',
        suggestions: ['Jinsi ya kuwezesha 2FA?', 'Shamir 3/5', 'Nikibiwa simu nifanye nini?', 'Nimepoteza 2FA'],
      },
    }
  ),

  MANUAL(
    'topic_lost_2fa',
    'topic',
    al(
      ['j ai perdu mon 2fa', '2fa perdu', 'je n ai plus mon 2fa', 'code 2fa perdu', 'telephone pour 2fa perdu', 'j ai perdu mon code 2fa'],
      ['lost my 2fa', 'lost 2fa', 'no access to 2fa', '2fa code lost', 'lost my authenticator'],
      ['perdi mi 2fa', 'perdi el 2fa', 'no tengo acceso al 2fa', 'perdi el codigo 2fa'],
      ['nimepoteza 2fa', 'sina 2fa', 'nimepoteza msimbo wa 2fa', '2fa imepotea']
    ),
    {
      fr: {
        title: '2FA perdu : que faire ?',
        content:
          "Pas de panique. Voici les solutions, dans l'ordre :\n\n1. 🫆 Biométrie : si elle est activée, utilise ton empreinte ou ton visage pour te connecter.\n2. 🧩 Shamir 3/5 : contacte tes guardians ; 3 fragments sur 5 suffisent.\n3. 📧 Support : écris à support@ufundi.uq avec une vérification d'identité renforcée.\n\n⚠️ Ne donne jamais ton code 2FA à quelqu'un qui prétend t'aider. Le support ne te le demandera jamais.",
        suggestions: ['Comment activer la 2FA ?', 'Shamir 3/5', 'Contacter le support', 'Mon téléphone a été volé'],
      },
      en: {
        title: 'Lost 2FA: what to do',
        content:
          "Don't panic. Here are the solutions, in order:\n\n1. 🫆 Biometrics: if enabled, use your fingerprint or face to sign in.\n2. 🧩 Shamir 3/5: contact your guardians; 3 out of 5 fragments are enough.\n3. 📧 Support: email support@ufundi.uq with enhanced identity verification.\n\n⚠️ Never give your 2FA code to anyone claiming to help. Support will never ask for it.",
        suggestions: ['How to enable 2FA?', 'Shamir 3/5', 'Contact support', 'My phone was stolen'],
      },
      es: {
        title: 'Perdí el 2FA: qué hacer',
        content:
          'No entres en pánico. Soluciones, en orden:\n\n1. 🫆 Biometría: si está activada, usa tu huella o tu cara para entrar.\n2. 🧩 Shamir 3/5: contacta a tus guardianes; bastan 3 de 5 fragmentos.\n3. 📧 Soporte: escribe a support@ufundi.uq con verificación de identidad reforzada.\n\n⚠️ Nunca des tu código 2FA a quien dice ayudarte. El soporte nunca te lo pedirá.',
        suggestions: ['¿Cómo activar 2FA?', 'Shamir 3/5', 'Contactar soporte', 'Me robaron el teléfono'],
      },
      sw: {
        title: 'Umepoteza 2FA: nifanye nini',
        content:
          'Usiwe na wasiwasi. Suluhisho, kwa mpangilio:\n\n1. 🫆 Biometria: ikiwa imewezeshwa, tumia alama za vidole au uso kuingia.\n2. 🧩 Shamir 3/5: wasiliana na walinzi wako; vipande 3 kati ya 5 vinatosha.\n3. 📧 Msaada: andika support@ufundi.uq na uthibitisho wa utambulisho ulioimarishwa.\n\n⚠️ Usitoe msimbo wako wa 2FA kwa mtu anayedai kukusaidia. Msaada hautakuomba kamwe.',
        suggestions: ['Jinsi ya kuwezesha 2FA?', 'Shamir 3/5', 'Wasiliana na msaada', 'Simu yangu imeibiwa'],
      },
    }
  ),

  MANUAL(
    'topic_phone_stolen',
    'safety',
    al(
      ['mon telephone a ete vole', 'on m a vole mon telephone', 'telephone vole', 'portable vole', 'sim volee', 'telephone perdu'],
      ['my phone was stolen', 'phone stolen', 'lost my phone', 'sim stolen', 'phone lost'],
      ['me robaron el telefono', 'telefono robado', 'perdi mi telefono', 'sim robada'],
      ['simu yangu imeibiwa', 'simu imeibiwa', 'nimepoteza simu', 'sim imeibiwa']
    ),
    {
      fr: {
        title: 'Téléphone volé : agis vite',
        content:
          "Agis vite, dans cet ordre :\n\n1. 📱 Fais bloquer ta carte SIM auprès de ton opérateur.\n2. 🔐 Change ton mot de passe UQ depuis un autre appareil si possible.\n3. 🫆 Si la biométrie ou la 2FA est compromise, contacte le support.\n4. 💸 Vérifie tes transactions récentes et signale toute opération suspecte.\n5. 📧 Écris à support@ufundi.uq en précisant « téléphone volé ».\n\n⚠️ Ne communique jamais ta clé privée, ton PIN ou tes codes, même à quelqu'un qui se présente comme le support.",
        suggestions: ['J’ai perdu mon 2FA', 'Contacter le support', 'La sécurité', 'Comment changer mon mot de passe ?'],
      },
      en: {
        title: 'Phone stolen: act fast',
        content:
          "Act quickly, in this order:\n\n1. 📱 Ask your carrier to block your SIM card.\n2. 🔐 Change your UQ password from another device if possible.\n3. 🫆 If biometrics or 2FA is compromised, contact support.\n4. 💸 Check recent transactions and report anything suspicious.\n5. 📧 Email support@ufundi.uq with “phone stolen” in the subject.\n\n⚠️ Never share your private key, PIN or codes, even with someone claiming to be support.",
        suggestions: ['I lost my 2FA', 'Contact support', 'Security', 'How to change my password?'],
      },
      es: {
        title: 'Teléfono robado: actúa rápido',
        content:
          'Actúa rápido, en este orden:\n\n1. 📱 Pide a tu operador que bloquee la tarjeta SIM.\n2. 🔐 Cambia tu contraseña de UQ desde otro dispositivo si es posible.\n3. 🫆 Si la biometría o el 2FA están comprometidos, contacta soporte.\n4. 💸 Revisa tus transacciones recientes y reporta cualquier operación sospechosa.\n5. 📧 Escribe a support@ufundi.uq con «teléfono robado» en el asunto.\n\n⚠️ Nunca compartas tu clave privada, tu PIN ni tus códigos, aunque alguien diga ser del soporte.',
        suggestions: ['Perdí mi 2FA', 'Contactar soporte', 'Seguridad', '¿Cómo cambio mi contraseña?'],
      },
      sw: {
        title: 'Simu imeibiwa: chukua hatua haraka',
        content:
          'Chukua hatua haraka, kwa mpangilio huu:\n\n1. 📱 Omba mtoa huduma wako azuie kadi yako ya SIM.\n2. 🔐 Badilisha neno la siri la UQ kutoka kifaa kingine ikiwezekana.\n3. 🫆 Ikiwa biometria au 2FA imeathirika, wasiliana na msaada.\n4. 💸 Angalia miamala ya hivi karibuni na ripoti yoyote ya kutiliwa shaka.\n5. 📧 Andika support@ufundi.uq ukiweka «simu imeibiwa» kwenye kichwa.\n\n⚠️ Usitoe ufunguo wako wa siri, PIN au misimbo, hata kwa mtu anayedai kuwa msaada.',
        suggestions: ['Nimepoteza 2FA', 'Wasiliana na msaada', 'Usalama', 'Nabadilisha neno la siri vipi?'],
      },
    }
  ),

  MANUAL(
    'topic_ubi',
    'topic',
    al(
      ['c est quoi l ubi', 'comment avoir l ubi', 'ubi quotidien', 'revenu de base', 'comment reclamer l ubi', 'je n ai pas recu mon ubi', 'keske l ubi', 'ca veut dire quoi l ubi', 'ubi'],
      ['what is ubi', 'how to get ubi', 'daily ubi', 'basic income', 'claim ubi', 'didnt receive ubi', 'what does ubi mean', 'ubi'],
      ['que es ubi', 'como obtener ubi', 'ubi diario', 'ingreso basico', 'reclamar ubi', 'no recibi mi ubi', 'que significa ubi', 'ubi'],
      ['ubi ni nini', 'jinsi ya kupata ubi', 'ubi ya kila siku', 'kipato cha msingi', 'kudai ubi', 'sikupata ubi', 'maana ya ubi', 'ubi']
    ),
    {
      fr: {
        title: "L'UBI en pratique",
        content:
          "L'UBI est le revenu de base universel de UQ.\n\n🌾 2 points par jour d'activité, convertis en BORB\n💰 Distribué par le Trésor\n✅ Garanti pour les comptes actifs\n\nPour le réclamer :\n1. Ouvre le Coffre 💼\n2. Clique [ RÉCLAMER UBI ]\n3. Le montant est crédité instantanément\n\n⚠️ Tu dois avoir été actif dans les dernières 24h (transaction, publication, service, achat ou vente). Si tu n'es pas éligible, fais une petite activité puis réessaie.",
        suggestions: ['Pourquoi je ne peux pas réclamer ?', 'Comment gagner des BORB ?', 'Les bulles', 'Le Trésor'],
      },
      en: {
        title: 'UBI in practice',
        content:
          "UBI is UQ's universal basic income.\n\n🌾 2 points per day of activity, converted to BORB\n💰 Distributed by the Treasury\n✅ Guaranteed for active accounts\n\nHow to claim:\n1. Open the Vault 💼\n2. Tap [ CLAIM UBI ]\n3. The amount is credited instantly\n\n⚠️ You must have been active in the last 24h (transaction, publication, service, purchase or sale). If you're not eligible, do a small activity and try again.",
        suggestions: ['Why can’t I claim?', 'How to earn BORB?', 'Bubbles', 'The Treasury'],
      },
      es: {
        title: 'El UBI en la práctica',
        content:
          'El UBI es la renta básica universal de UQ.\n\n🌾 2 puntos por día de actividad, convertidos en BORB\n💰 Distribuido por el Tesoro\n✅ Garantizado para cuentas activas\n\nCómo reclamarlo:\n1. Abre el Cofre 💼\n2. Toca [ RECLAMAR UBI ]\n3. El monto se acredita al instante\n\n⚠️ Debes haber estado activo en las últimas 24 h (transacción, publicación, servicio, compra o venta). Si no eres elegible, haz una pequeña actividad y vuelve a intentarlo.',
        suggestions: ['¿Por qué no puedo reclamar?', '¿Cómo ganar BORB?', 'Las burbujas', 'El Tesoro'],
      },
      sw: {
        title: 'UBI kwa vitendo',
        content:
          'UBI ni kipato cha msingi cha UQ kwa wote.\n\n🌾 Pointi 2 kwa siku za shughuli, zinabadilishwa kuwa BORB\n💰 Inagawiwa na Hazina\n✅ Imethibitishwa kwa akaunti zinazotumika\n\nJinsi ya kudai:\n1. Fungua Coffre 💼\n2. Bonyeza [ DAI UBI ]\n3. Kiasi kinawekwa papo hapo\n\n⚠️ Lazima uwe umefanya shughuli katika saa 24 zilizopita (muamala, uchapishaji, huduma, ununuzi au mauzo). Usipostahili, fanya shughuli ndogo kisha ujaribu tena.',
        suggestions: ['Kwa nini siwezi kudai?', 'Jinsi ya kupata BORB?', 'Mapovu', 'Hazina'],
      },
    }
  ),

  MANUAL(
    'topic_savings_credit',
    'topic',
    al(
      ['epargne et credit', 'comment epargner', 'comment emprunter', 'epargner ou emprunter', 'rendement epargne', 'interet epargne', 'pret uq', 'comment economiser', 'mettre de l argent de cote', 'comment sauver de l argent', 'epargne', 'economies'],
      ['savings and credit', 'how to save', 'how to borrow', 'save or borrow', 'savings yield', 'savings interest', 'uq loan', 'how to save money', 'how do i save', 'save money', 'how can i save', 'savings', 'loan'],
      ['ahorro y credito', 'como ahorrar', 'como pedir prestamo', 'ahorrar o prestar', 'rendimiento del ahorro', 'prestamo uq', 'como ahorro dinero', 'como puedo ahorrar', 'ahorrar dinero', 'ahorro', 'prestamo'],
      ['akiba na mkopo', 'jinsi ya kuweka akiba', 'jinsi ya kukopa', 'akiba au mkopo', 'riba ya akiba', 'mkopo wa uq', 'ninawezaje kuweka akiba', 'kuweka pesa akiba', 'akiba', 'mkopo']
    ),
    {
      fr: {
        title: 'Épargne et crédit',
        content:
          "Deux outils différents :\n\n❄️ ÉPARGNE (Coffre → Geler)\n• Tu bloques des BORB pour une durée\n• Rendement : 1%/an sur 3 mois → jusqu'à 6%/an sur 50 ans\n• Exemple : 100 BORB sur 10 ans à 5%/an ≈ 162 BORB\n\n💳 CRÉDIT (emprunt)\n• Le Crédit prête des BORB selon ton profil\n• Découvert possible : -5 BORB (normal) ou -50 BORB (Marketer)\n• Remboursement automatique sur tes revenus\n\nMon conseil : commence par épargner une petite somme, puis emprunte seulement si tu peux rembourser.",
        suggestions: ['Comment épargner ?', 'Comment rembourser un prêt ?', 'Le Crédit', 'Devenir riche avec UQ'],
      },
      en: {
        title: 'Savings and credit',
        content:
          "Two different tools:\n\n❄️ SAVINGS (Vault → Freeze)\n• You lock BORB for a set period\n• Yield: 1%/year for 3 months → up to 6%/year for 50 years\n• Example: 100 BORB for 10 years at 5%/year ≈ 162 BORB\n\n💳 CREDIT (loan)\n• Credit lends BORB based on your profile\n• Overdraft: -5 BORB (standard) or -50 BORB (Marketer)\n• Automatic repayment from your income\n\nMy advice: start by saving a small amount, then borrow only if you can repay.",
        suggestions: ['How to save?', 'How to repay a loan?', 'Credit', 'Get rich with UQ'],
      },
      es: {
        title: 'Ahorro y crédito',
        content:
          'Dos herramientas diferentes:\n\n❄️ AHORRO (Cofre → Congelar)\n• Bloqueas BORB durante un período\n• Rendimiento: 1%/año a 3 meses → hasta 6%/año a 50 años\n• Ejemplo: 100 BORB a 10 años al 5%/año ≈ 162 BORB\n\n💳 CRÉDITO (préstamo)\n• El Crédito presta BORB según tu perfil\n• Descubierto: -5 BORB (normal) o -50 BORB (Marketer)\n• Pago automático con tus ingresos\n\nMi consejo: empieza ahorrando una pequeña cantidad y pide un préstamo solo si puedes devolverlo.',
        suggestions: ['¿Cómo ahorrar?', '¿Cómo pagar un préstamo?', 'El Crédito', 'Hacerse rico con UQ'],
      },
      sw: {
        title: 'Akiba na mkopo',
        content:
          'Zana mbili tofauti:\n\n❄️ AKIBA (Coffre → Gandisha)\n• Unafunga BORB kwa muda fulani\n• Riba: 1%/mwaka kwa miezi 3 → hadi 6%/mwaka kwa miaka 50\n• Mfano: BORB 100 kwa miaka 10 kwa 5%/mwaka ≈ BORB 162\n\n💳 MKOPO\n• Mkopo unatoa BORB kulingana na wasifu wako\n• Deni la ziada: -5 BORB (kawaida) au -50 BORB (Marketer)\n• Urejeshaji wa kiotomatiki kutoka mapato yako\n\nUshauri wangu: anza kuweka akiba ndogo, kisha kopa tu ikiwa unaweza kurejesha.',
        suggestions: ['Jinsi ya kuweka akiba?', 'Jinsi ya kurejesha mkopo?', 'Mkopo', 'Kuwa tajiri na UQ'],
      },
    }
  ),

  MANUAL(
    'topic_zando',
    'topic',
    al(
      ['comment vendre sur zando', 'comment acheter sur zando', 'vendre sur zando', 'acheter sur zando', 'zando', 'booster mon studio', 'produit sur zando'],
      ['sell on zando', 'buy on zando', 'zando', 'boost my studio', 'product on zando'],
      ['vender en zando', 'comprar en zando', 'zando', 'impulsar mi studio', 'producto en zando'],
      ['kuuza zando', 'kununua zando', 'zando', 'kuza studio', 'bidhaa zando']
    ),
    {
      fr: {
        title: 'Acheter et vendre sur Zando',
        content:
          "Zando, c'est le marché de UQ. Deux espaces :\n\n🏪 VENDRE — Studio UQ\n• « Vendre un produit ou un service » : l'offre apparaît dans le marché Zando\n• « Publier un contenu lecteur » : lien externe, facturé à la seconde\n• Une publication peut rester en brouillon avant d'être mise en ligne\n\n🛒 ACHETER\n• Marché Zando : recherche par titre, vendeur ou catégorie, tri Récents / Prix ↑ / Prix ↓\n• Ouvre une offre : tu peux l'Enregistrer, écrire au vendeur (Message) ou Lire le contenu s'il s'agit d'un contenu lecteur\n\n🔐 Toute mise en ligne demande ton code PIN. Un brouillon, non.\n\n💡 Une offre claire — titre précis, photo nette, prix juste — se vend mieux.",
        suggestions: ['Comment créer un élément ?', 'Comment publier un contenu lecteur ?', 'Comment vendre une devise en P2P ?', 'Comment vérifier mon identité ?'],
      },
      en: {
        title: 'Buy and sell on Zando',
        content:
          "Zando is UQ's marketplace. Two spaces:\n\n🏪 SELL — UQ Studio\n• “Sell a product or a service”: the offer appears in the Zando market\n• “Publish reader content”: external link, billed by the second\n• A publication can stay as a draft before going live\n\n🛒 BUY\n• Zando Market: search by title, seller or category, sort Recent / Price ↑ / Price ↓\n• Open an offer: you can Save it, message the seller, or Play the content if it is reader content\n\n🔐 Every publication requires your PIN. A draft does not.\n\n💡 A clear offer — precise title, sharp photo, fair price — sells better.",
        suggestions: ['How to create an item?', 'How to publish reader content?', 'How to sell a currency on P2P?', 'How to verify my identity?'],
      },
      es: {
        title: 'Comprar y vender en Zando',
        content:
          'Zando es el mercado de UQ. Dos espacios:\n\n🏪 VENDER — Studio UQ\n• «Vender un producto o un servicio»: la oferta aparece en el mercado Zando\n• «Publicar un contenido lector»: enlace externo, facturado por segundo\n• Una publicación puede quedar en borrador antes de publicarse\n\n🛒 COMPRAR\n• Mercado Zando: busca por título, vendedor o categoría, ordena Recientes / Precio ↑ / Precio ↓\n• Abre una oferta: puedes Guardarla, escribir al vendedor (Mensaje) o Leer el contenido si es contenido lector\n\n🔐 Toda publicación exige tu PIN. Un borrador, no.\n\n💡 Una oferta clara — título preciso, foto nítida, precio justo — se vende mejor.',
        suggestions: ['¿Cómo crear un elemento?', '¿Cómo publicar un contenido lector?', '¿Cómo vender una divisa en P2P?', '¿Cómo verificar mi identidad?'],
      },
      sw: {
        title: 'Nunua na uza Zando',
        content:
          'Zando ni soko la UQ. Sehemu mbili:\n\n🏪 KUUZA — Studio UQ\n• «Uza bidhaa au huduma»: ofa inaonekana kwenye soko la Zando\n• «Chapisha maudhui ya msomaji»: kiungo cha nje, kinatozwa kwa sekunde\n• Chapisho linaweza kubaki rasimu kabla ya kuwekwa hewani\n\n🛒 KUNUNUA\n• Soko la Zando: tafuta kwa kichwa, muuzaji au kategoria, panga Mpya / Bei ↑ / Bei ↓\n• Fungua ofa: unaweza Kuihifadhi, kumwandikia muuzaji (Ujumbe) au Kusoma maudhui ikiwa ni maudhui ya msomaji\n\n🔐 Kila uchapishaji unahitaji PIN yako. Rasimu haihitaji.\n\n💡 Ofa iliyo wazi — kichwa sahihi, picha safi, bei nzuri — inauzwa haraka.',
        suggestions: ['Jinsi ya kuunda kipengee?', 'Jinsi ya kuchapisha maudhui ya msomaji?', 'Jinsi ya kuuza sarafu P2P?', 'Jinsi ya kuthibitisha utambulisho?'],
      },
    }
  ),

  MANUAL(
    'topic_privacy',
    'topic',
    al(
      ['confidentialite', 'mes donnees personnelles', 'vie privee', 'rgpd', 'donnees collectees', 'mes droits sur mes donnees', 'uq voit mes messages'],
      ['privacy', 'my personal data', 'gdpr', 'data collected', 'my data rights', 'can uq read my messages'],
      ['privacidad', 'mis datos personales', 'datos recopilados', 'mis derechos de datos', 'uq lee mis mensajes'],
      ['faragha', 'data yangu binafsi', 'data iliyokusanywa', 'haki zangu za data', 'uq inaona ujumbe wangu']
    ),
    {
      fr: {
        title: 'Ta vie privée chez UQ',
        content:
          "UQ collecte le minimum nécessaire :\n\n👤 Identité : prénom, nom, date de naissance, pays, adresse, téléphone, email UQ, pseudo\n💻 Technique : IP, appareil, OS, logs de connexion\n💰 Financier : solde, historique, prêts, réputation\n\nCe n'est ni revendu ni utilisé pour de la publicité ciblée.\n\nTes droits : accéder, corriger, supprimer, exporter, retirer ton consentement.\n📧 privacy@ufundi.uq — réponse sous 30 jours.\n\n🔒 Tes conversations sont chiffrées de bout en bout : même UQ ne peut pas les lire.",
        suggestions: ['Quelles données collectez-vous ?', 'Supprimer mes données', 'Mes conversations sont-elles privées ?', 'Contact privacy'],
      },
      en: {
        title: 'Your privacy at UQ',
        content:
          "UQ collects only what is necessary:\n\n👤 Identity: first name, last name, date of birth, country, address, phone, UQ email, username\n💻 Technical: IP, device, OS, connection logs\n💰 Financial: balance, history, loans, reputation\n\nIt is not sold and not used for targeted advertising.\n\nYour rights: access, correct, delete, export, withdraw consent.\n📧 privacy@ufundi.uq — reply within 30 days.\n\n🔒 Your conversations are end-to-end encrypted: even UQ cannot read them.",
        suggestions: ['What data do you collect?', 'Delete my data', 'Are my chats private?', 'Contact privacy'],
      },
      es: {
        title: 'Tu privacidad en UQ',
        content:
          'UQ recoge solo lo necesario:\n\n👤 Identidad: nombre, apellido, fecha de nacimiento, país, dirección, teléfono, email UQ, usuario\n💻 Técnico: IP, dispositivo, SO, registros de conexión\n💰 Financiero: saldo, historial, préstamos, reputación\n\nNo se vende ni se usa para publicidad dirigida.\n\nTus derechos: acceder, corregir, eliminar, exportar, retirar tu consentimiento.\n📧 privacy@ufundi.uq — respuesta en 30 días.\n\n🔒 Tus conversaciones están cifradas de extremo a extremo: ni UQ puede leerlas.',
        suggestions: ['¿Qué datos recogen?', 'Eliminar mis datos', '¿Mis chats son privados?', 'Contactar privacidad'],
      },
      sw: {
        title: 'Faragha yako UQ',
        content:
          'UQ inakusanya kile kinachohitajika tu:\n\n👤 Utambulisho: jina la kwanza, jina la mwisho, tarehe ya kuzaliwa, nchi, anwani, simu, barua pepe ya UQ, jina la mtumiaji\n💻 Kiufundi: IP, kifaa, OS, kumbukumbu za kuingia\n💰 Fedha: salio, historia, mikopo, sifa\n\nHaijawahi kuuzwa wala kutumiwa kwa matangazo lengwa.\n\nHaki zako: kufikia, kusahihisha, kufuta, kuhamisha, kuondoa idhini.\n📧 privacy@ufundi.uq — jibu ndani ya siku 30.\n\n🔒 Mazungumzo yako yamesimbwa mwanzo hadi mwisho: hata UQ haiwezi kuyasoma.',
        suggestions: ['Mnakusanya data gani?', 'Futa data yangu', 'Ujumbe wangu ni wa faragha?', 'Wasiliana na faragha'],
      },
    }
  ),

  MANUAL(
    'topic_fees_value',
    'topic',
    al(
      ['valeur du borb et frais', 'combien vaut le borb et les frais', 'prix du borb et frais', 'frais et valeur', 'combien coute une transaction'],
      ['borb value and fees', 'price and fees', 'fees and value', 'how much does a transaction cost'],
      ['valor del borb y comisiones', 'precio y comisiones', 'comisiones y valor', 'cuanto cuesta una transaccion'],
      ['thamani ya borb na ada', 'bei na ada', 'ada na thamani', 'muamala unagharimu kiasi gani']
    ),
    {
      fr: {
        title: 'Valeur du BORB et frais',
        content:
          "Deux choses à distinguer :\n\n💱 VALEUR DU BORB\n• Le prix vient du moteur : régulateur + capture du cours de l'or, jamais un chiffre écrit dans l'app\n• Le coffre affiche la valeur courante, sa source et depuis quand elle a été captée\n• Le prix évolue avec la demande réelle (aucune trajectoire n'est garantie)\n\n💸 FRAIS\n• 0,1% par transaction\n• Exemple : 100 BORB → 0,1 BORB de frais\n• Répartition : 30% Trésor, 40% validateurs, 30% relais P2P, 0% brûlé\n\n⚠️ Aucun rendement n'est garanti : la valeur dépend de l'usage réel et de la demande.",
        suggestions: ['Combien vaut 1 BORB ?', 'Quels sont les frais ?', 'Le prix du BORB va monter ?', 'Les 6 Cases'],
      },
      en: {
        title: 'BORB value and fees',
        content:
          "Two things to distinguish:\n\n💱 BORB VALUE\n• The price comes from the engine: regulator plus live gold capture, never a figure hard-coded in the app\n• The wallet shows the current value, its source and how long ago it was captured\n• Price moves with real demand (no trajectory is guaranteed)\n\n💸 FEES\n• 0.1% per transaction\n• Example: 100 BORB → 0.1 BORB fee\n• Split: 30% Treasury, 40% validators, 30% P2P relays, 0% burned\n\n⚠️ No return is guaranteed: value depends on real usage and demand.",
        suggestions: ['How much is 1 BORB?', 'What are the fees?', 'Will BORB go up?', 'The 6 Cases'],
      },
      es: {
        title: 'Valor del BORB y comisiones',
        content:
          'Dos cosas que distinguir:\n\n💱 VALOR DEL BORB\n• El precio viene del motor: regulador más captura en vivo del oro, nunca una cifra escrita en la app\n• La billetera muestra el valor actual, su fuente y cuánto tiempo hace que fue captado\n• El precio evoluciona con la demanda real (ninguna trayectoria está garantizada)\n\n💸 COMISIONES\n• 0,1% por transacción\n• Ejemplo: 100 BORB → 0,1 BORB de comisión\n• Reparto: 30% Tesoro, 40% validadores, 30% relays P2P, 0% quemado\n\n⚠️ No se garantiza ningún rendimiento: el valor depende del uso real y de la demanda.',
        suggestions: ['¿Cuánto vale 1 BORB?', '¿Cuáles son las comisiones?', '¿El BORB subirá?', 'Las 6 Cases'],
      },
      sw: {
        title: 'Thamani ya BORB na ada',
        content:
          'Mambo mawili tofauti:\n\n💱 THAMANI YA BORB\n• Bei inatoka kwa injini: kidhibiti-bei pamoja na urekodi wa moja kwa moja wa dhahabu, si namba iliyowekwa kwenye app\n• Pouchi huonyesha thamani ya sasa, chanzo chake na muda uliopita tangu irekodiwe\n• Bei inabadilika kulingana na hitaji halisi (hakuna mwelekeo uliohakikishwa)\n\n💸 ADA\n• 0.1% kwa muamala\n• Mfano: BORB 100 → ada ya BORB 0.1\n• Mgawanyo: 30% Hazina, 40% wathibitishaji, 30% relay P2P, 0% kuchomwa\n\n⚠️ Hakuna faida iliyohakikishwa: thamani inategemea matumizi halisi na mahitaji.',
        suggestions: ['BORB 1 ni ngapi?', 'Ada ni ngapi?', 'Bei ya BORB itapanda?', 'Kesi 6'],
      },
    }
  ),

  MANUAL(
    'topic_content_earn',
    'topic',
    al(
      ['gagner avec le lecteur uq', 'creer du contenu et gagner', 'combien rapporte un contenu', 'gagner avec ma musique', 'revenus createur'],
      ['earn with uq reader', 'create content and earn', 'how much does content pay', 'earn with my music', 'creator income'],
      ['ganar con el lector uq', 'crear contenido y ganar', 'cuanto paga el contenido', 'ganar con mi musica', 'ingresos de creador'],
      ['pata pesa kwa lector uq', 'unda maudhui na upate', 'maudhui yanalipa kiasi gani', 'pata pesa kwa muziki wangu', 'mapato ya mbunifu']
    ),
    {
      fr: {
        title: 'Gagner avec le Lecteur UQ',
        content:
          "Le Lecteur UQ rémunère la création :\n\n🎵 Musique, 🎬 vidéos, 📚 cours, 📖 livres\n💰 90% des revenus vont au créateur\n📡 Diffusion via le Lecteur UQ\n\nComment commencer :\n1. ➕ → crée ton contenu\n2. Publie dans le Lecteur UQ\n3. Partage à ton audience\n4. Suis tes gains dans le Coffre\n\nTu peux aussi vendre des produits ou services sur Zando, ou vendre ta connexion (Starlink/4G).",
        suggestions: ['Comment créer du contenu ?', 'Combien puis-je gagner ?', 'Comment vendre sur Zando ?', 'Vendre ma connexion'],
      },
      en: {
        title: 'Earn with the UQ Reader',
        content:
          "The UQ Reader rewards creators:\n\n🎵 Music, 🎬 videos, 📚 courses, 📖 books\n💰 90% of revenue goes to the creator\n📡 Distributed via the UQ Reader\n\nHow to start:\n1. ➕ → create your content\n2. Publish in the UQ Reader\n3. Share with your audience\n4. Track earnings in the Vault\n\nYou can also sell products or services on Zando, or sell your connection (Starlink/4G).",
        suggestions: ['How to create content?', 'How much can I earn?', 'How to sell on Zando?', 'Sell my connection'],
      },
      es: {
        title: 'Ganar con el Lector UQ',
        content:
          'El Lector UQ recompensa a los creadores:\n\n🎵 Música, 🎬 vídeos, 📚 cursos, 📖 libros\n💰 90% de los ingresos van al creador\n📡 Distribuido por el Lector UQ\n\nCómo empezar:\n1. ➕ → crea tu contenido\n2. Publica en el Lector UQ\n3. Comparte con tu audiencia\n4. Sigue tus ganancias en el Cofre\n\nTambién puedes vender productos o servicios en Zando, o vender tu conexión (Starlink/4G).',
        suggestions: ['¿Cómo crear contenido?', '¿Cuánto puedo ganar?', '¿Cómo vender en Zando?', 'Vender mi conexión'],
      },
      sw: {
        title: 'Pata pesa na Lector UQ',
        content:
          'Lector UQ huwalipa wabunifu:\n\n🎵 Muziki, 🎬 video, 📚 kozi, 📖 vitabu\n💰 90% ya mapato yanakwenda kwa mbunifu\n📡 Inasambazwa kupitia Lector UQ\n\nJinsi ya kuanza:\n1. ➕ → unda maudhui yako\n2. Chapisha kwenye Lector UQ\n3. Shiriki na hadhira yako\n4. Fuatilia mapato kwenye Coffre\n\nUnaweza pia kuuza bidhaa au huduma Zando, au kuuza muunganisho wako (Starlink/4G).',
        suggestions: ['Jinsi ya kuunda maudhui?', 'Naweza kupata kiasi gani?', 'Jinsi ya kuuza Zando?', 'Uza muunganisho wangu'],
      },
    }
  ),

  MANUAL(
    'topic_login',
    'topic',
    al(
      ['comment me connecter', 'je n arrive pas a me connecter', 'connexion uq', 'login uq', 'code de deblocage', 'mot de passe oublie connexion', 'je ne peux pas me connecter', 'mon compte est bloque', 'compte bloque', 'compte suspendu'],
      ['how to log in', 'cant login', 'sign in uq', 'login uq', 'unlock code', 'forgot login password', 'cannot sign in', 'my account is locked', 'account blocked', 'account locked'],
      ['como iniciar sesion', 'no puedo entrar', 'login uq', 'codigo de desbloqueo', 'olvide mi contrasena', 'no puedo iniciar sesion', 'mi cuenta esta bloqueada', 'cuenta bloqueada'],
      ['jinsi ya kuingia', 'siwezi kuingia', 'ingia uq', 'msimbo wa kufungua', 'nimesahau neno la siri', 'siwezi kuingia akaunti', 'akaunti yangu imezuiwa', 'akaunti imefungwa']
    ),
    {
      fr: {
        title: 'Se connecter à UQ',
        content:
          "Voici comment te connecter :\n\n1. 📛 Ton numéro UQ (UQ-XXXXXXXX)\n2. 🔑 Ton code de déblocage (4 chiffres) si tu es propriétaire\n3. 📧 Email UQ + mot de passe\n4. 🔢 Code 2FA auto-généré (valable 30 secondes)\n5. 🫆 Biométrie (empreinte ou visage)\n\nSi tu as oublié ton mot de passe :\n• Biométrie si activée\n• Shamir 3/5 avec tes guardians\n• Support : support@ufundi.uq (vérification d'identité renforcée)\n\n⚠️ Le mot de passe ne peut pas être réinitialisé par simple email.",
        suggestions: ['J’ai oublié mon mot de passe', 'J’ai perdu mon 2FA', 'Mon téléphone a été volé', 'Contacter le support'],
      },
      en: {
        title: 'Signing in to UQ',
        content:
          "Here's how to sign in:\n\n1. 📛 Your UQ number (UQ-XXXXXXXX)\n2. 🔑 Your unlock code (4 digits) if you're the owner\n3. 📧 UQ email + password\n4. 🔢 Auto-generated 2FA code (valid 30 seconds)\n5. 🫆 Biometrics (fingerprint or face)\n\nIf you forgot your password:\n• Biometrics if enabled\n• Shamir 3/5 with your guardians\n• Support: support@ufundi.uq (enhanced identity verification)\n\n⚠️ The password cannot be reset by email alone.",
        suggestions: ['I forgot my password', 'I lost my 2FA', 'My phone was stolen', 'Contact support'],
      },
      es: {
        title: 'Iniciar sesión en UQ',
        content:
          'Así se inicia sesión:\n\n1. 📛 Tu número UQ (UQ-XXXXXXXX)\n2. 🔑 Tu código de desbloqueo (4 dígitos) si eres el propietario\n3. 📧 Email UQ + contraseña\n4. 🔢 Código 2FA autogenerado (válido 30 segundos)\n5. 🫆 Biometría (huella o cara)\n\nSi olvidaste tu contraseña:\n• Biometría si está activada\n• Shamir 3/5 con tus guardianes\n• Soporte: support@ufundi.uq (verificación de identidad reforzada)\n\n⚠️ La contraseña no se puede restablecer solo por email.',
        suggestions: ['Olvidé mi contraseña', 'Perdí mi 2FA', 'Me robaron el teléfono', 'Contactar soporte'],
      },
      sw: {
        title: 'Kuingia UQ',
        content:
          'Hivi ndivyo unavyoingia:\n\n1. 📛 Namba yako ya UQ (UQ-XXXXXXXX)\n2. 🔑 Msimbo wako wa kufungua (namba 4) ikiwa wewe ni mmiliki\n3. 📧 Barua pepe ya UQ + neno la siri\n4. 🔢 Msimbo wa 2FA unaojizalisha (unadumu sekunde 30)\n5. 🫆 Biometria (alama za vidole au uso)\n\nUmesahau neno la siri:\n• Biometria ikiwa imewezeshwa\n• Shamir 3/5 na walinzi wako\n• Msaada: support@ufundi.uq (uthibitisho wa utambulisho ulioimarishwa)\n\n⚠️ Neno la siri haliwezi kubadilishwa kwa barua pepe pekee.',
        suggestions: ['Nimesahau neno la siri', 'Nimepoteza 2FA', 'Simu yangu imeibiwa', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_2fa_setup',
    'safety',
    al(
      ['comment activer la 2fa', 'activer la 2fa', 'activer le 2fa', 'mettre la 2fa', 'configurer la 2fa', 'activer la double authentification', 'comment mettre la double authentification', 'active la 2fa'],
      ['how to enable 2fa', 'enable 2fa', 'activate 2fa', 'set up 2fa', 'setup two factor', 'turn on 2fa', 'how do i enable 2fa'],
      ['como activo 2fa', 'activar 2fa', 'como activar el 2fa', 'configurar 2fa', 'habilitar 2fa', 'activar doble autenticacion', 'como activo la doble autenticacion'],
      ['jinsi ya kuwezesha 2fa', 'wezesha 2fa', 'kuwasha 2fa', 'sanidi 2fa', 'kuweka 2fa', 'jinsi ya kuwasha 2fa']
    ),
    {
      fr: {
        title: 'Activer la 2FA (double authentification)',
        content:
          "La 2FA ajoute une deuxième preuve à chaque connexion : même si quelqu'un connaît ton mot de passe, il ne peut pas entrer sans le code.\n\nPour l'activer :\n1. Ouvre Paramètres → Sécurité → 2FA\n2. Renseigne ton email UQ\n3. Définis ton mot de passe 2FA\n4. Saisis le code de vérification\n5. Confirme\n\n✅ Ensuite :\n• Un code est demandé à chaque connexion\n• Il est généré automatiquement\n• Il est valable 30 secondes\n\n💡 Active aussi la biométrie et garde tes codes de secours. Si tu perds l'accès, la récupération passe par Shamir 3/5 ou le support (support@ufundi.uq).",
        suggestions: ['Activer la biométrie', 'J’ai perdu mon 2FA', 'Sécuriser mon compte', 'Contacter le support'],
      },
      en: {
        title: 'Enable 2FA (two-factor authentication)',
        content:
          "2FA adds a second proof at every sign-in: even if someone knows your password, they cannot get in without the code.\n\nTo enable it:\n1. Open Settings → Security → 2FA\n2. Enter your UQ email\n3. Set your 2FA password\n4. Enter the verification code\n5. Confirm\n\n✅ After that:\n• A code is requested at every sign-in\n• It is generated automatically\n• It is valid for 30 seconds\n\n💡 Also enable biometrics and keep your backup codes. If you lose access, recovery goes through Shamir 3/5 or support (support@ufundi.uq).",
        suggestions: ['Enable biometrics', 'I lost my 2FA', 'Secure my account', 'Contact support'],
      },
      es: {
        title: 'Activar la 2FA (doble autenticación)',
        content:
          'La 2FA añade una segunda prueba en cada inicio de sesión: aunque alguien conozca tu contraseña, no puede entrar sin el código.\n\nPara activarla:\n1. Abre Ajustes → Seguridad → 2FA\n2. Ingresa tu email UQ\n3. Define tu contraseña 2FA\n4. Introduce el código de verificación\n5. Confirma\n\n✅ Después:\n• Se pide un código en cada inicio de sesión\n• Se genera automáticamente\n• Es válido durante 30 segundos\n\n💡 Activa también la biometría y guarda tus códigos de respaldo. Si pierdes el acceso, la recuperación pasa por Shamir 3/5 o soporte (support@ufundi.uq).',
        suggestions: ['Activar biometría', 'Perdí mi 2FA', 'Proteger mi cuenta', 'Contactar soporte'],
      },
      sw: {
        title: 'Wezesha 2FA (uthibitisho wa hatua mbili)',
        content:
          '2FA inaongeza uthibitisho wa pili kila unapoingia: hata mtu ajue neno lako la siri, hawezi kuingia bila msimbo.\n\nJinsi ya kuiwezesha:\n1. Fungua Mipangilio → Usalama → 2FA\n2. Weka barua pepe yako ya UQ\n3. Weka neno la siri la 2FA\n4. Ingiza msimbo wa uthibitisho\n5. Thibitisha\n\n✅ Baada ya hapo:\n• Msimbo unaombwa kila unapoingia\n• Unajizalisha kiotomatiki\n• Unadumu sekunde 30\n\n💡 Wezesha pia biometria na uhifadhi misimbo yako ya akiba. Ukipoteza ufikiaji, urejeshaji hupitia Shamir 3/5 au msaada (support@ufundi.uq).',
        suggestions: ['Wezesha biometria', 'Nimepoteza 2FA', 'Linda akaunti yangu', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_account_hacked',
    'safety',
    al(
      ['mon compte a ete pirate', 'mon compte est pirate', 'on m a pirate', 'je me suis fait pirater', 'quelqu un a accede a mon compte', 'mon compte a ete compromis', 'compte pirate', 'mon compte est compromis'],
      ['my account is hacked', 'my acount is hacked', 'my account got hacked', 'i was hacked', 'someone accessed my account', 'my account is compromised', 'account hacked', 'my account was hacked'],
      ['mi cuenta fue hackeada', 'me hackearon la cuenta', 'mi cuenta esta hackeada', 'alguien entro a mi cuenta', 'cuenta comprometida', 'mi cuenta fue comprometida', 'hackearon mi cuenta'],
      ['akaunti yangu imeibiwa', 'nimehackiwa', 'mtu ameingia kwenye akaunti yangu', 'akaunti yangu imevamiwa', 'akaunti yangu imedukuliwa']
    ),
    {
      fr: {
        title: 'Mon compte a été piraté : que faire ?',
        content:
          "Reste calme : chaque minute compte, mais il y a un ordre clair.\n\n1. 🔐 Change immédiatement ton mot de passe et ton code de déblocage depuis un appareil sûr.\n2. 📧 Vérifie les sessions actives et déconnecte les appareils que tu ne reconnais pas.\n3. 🔢 Réactive la 2FA et la biométrie.\n4. 🧾 Regarde l'historique des transactions et note tout mouvement suspect.\n5. 📞 Contacte le support en urgence : support@ufundi.uq.\n6. 🧩 Si tu as perdu l'accès, la récupération passe par Shamir 3/5 avec tes guardians.\n\n⚠️ Ne partage jamais ta clé privée, ton PIN ni ton code 2FA. Le support ne te les demandera jamais.",
        suggestions: ['Activer la 2FA', 'Sécuriser mon compte', 'Contacter le support', 'J’ai perdu mon 2FA'],
      },
      en: {
        title: 'My account was hacked — what now?',
        content:
          "Stay calm: every minute counts, but there is a clear order.\n\n1. 🔐 Immediately change your password and unlock code from a safe device.\n2. 📧 Check active sessions and sign out devices you do not recognize.\n3. 🔢 Re-enable 2FA and biometrics.\n4. 🧾 Review your transaction history and note anything suspicious.\n5. 📞 Contact support urgently: support@ufundi.uq.\n6. 🧩 If you lost access, recovery goes through Shamir 3/5 with your guardians.\n\n⚠️ Never share your private key, PIN or 2FA code. Support will never ask for them.",
        suggestions: ['Enable 2FA', 'Secure my account', 'Contact support', 'I lost my 2FA'],
      },
      es: {
        title: 'Mi cuenta fue hackeada: ¿qué hago?',
        content:
          'Mantén la calma: cada minuto cuenta, pero hay un orden claro.\n\n1. 🔐 Cambia de inmediato tu contraseña y tu código de desbloqueo desde un dispositivo seguro.\n2. 📧 Revisa las sesiones activas y cierra las de dispositivos que no reconozcas.\n3. 🔢 Reactiva la 2FA y la biometría.\n4. 🧾 Revisa el historial de transacciones y anota cualquier movimiento sospechoso.\n5. 📞 Contacta al soporte con urgencia: support@ufundi.uq.\n6. 🧩 Si perdiste el acceso, la recuperación pasa por Shamir 3/5 con tus guardianes.\n\n⚠️ Nunca compartas tu clave privada, tu PIN ni tu código 2FA. El soporte nunca te los pedirá.',
        suggestions: ['Activar 2FA', 'Proteger mi cuenta', 'Contactar soporte', 'Perdí mi 2FA'],
      },
      sw: {
        title: 'Akaunti yangu imeibiwa: nifanye nini?',
        content:
          'Tulia: kila dakika ni muhimu, lakini kuna mpangilio wazi.\n\n1. 🔐 Badilisha mara moja neno lako la siri na msimbo wa kufungua ukitumia kifaa salama.\n2. 📧 Angalia vipindi vinavyotumika na toka kwenye vifaa usivyovitambua.\n3. 🔢 Wezesha tena 2FA na biometria.\n4. 🧾 Kagua historia ya miamala na andika kila jambo la kushuku.\n5. 📞 Wasiliana na msaada haraka: support@ufundi.uq.\n6. 🧩 Ukipoteza ufikiaji, urejeshaji hupitia Shamir 3/5 na walinzi wako.\n\n⚠️ Usishiriki kamwe ufunguo wako wa siri, PIN au msimbo wa 2FA. Msaada hautakuomba vitu hivyo.',
        suggestions: ['Wezesha 2FA', 'Linda akaunti yangu', 'Wasiliana na msaada', 'Nimepoteza 2FA'],
      },
    }
  ),

  MANUAL(
    'topic_cost',
    'topic',
    al(
      ['combien ca coute', 'sa coute combien', 'combien coute', 'combien coute un envoi', 'combien coute un transfert', 'combien coute un paiement', 'coute un envoi', 'frais d envoi', "prix d un envoi", 'c est payant', 'est ce payant', 'ca coute quelque chose', 'quels sont les couts'],
      ['how much does it cost', 'how much does it cost to use uq', 'how much to send', 'how much does it cost to send', 'is it free', 'is uq free', 'does it cost anything', 'what are the costs'],
      ['cuanto cuesta', 'cuanto cuesta usar uq', 'cuanto cuesta un envio', 'cuanto cuesta enviar', 'cuanto cuesta un pago', 'comision de envio', 'es gratis', 'es gratuito', 'tiene costo', 'cuales son los costos'],
      ['inagharimu kiasi gani', 'inagharimu kiasi gani kutuma', 'gharama ya kutuma', 'kutuma ni ngapi', 'ada ya kutuma', 'ni bure', 'ina gharama', 'gharama ni ngapi', 'kuna malipo']
    ),
    {
      fr: {
        title: 'Combien ça coûte ?',
        content:
          "UQ n'a pas d'abonnement obligatoire. Voici les coûts principaux :\n\n• Créer un compte : gratuit\n• Recevoir des BORB : gratuit\n• Envoyer une devise convertie : gratuit\n• Convertir BORB ↔ devise : taux live, sans frais supplémentaires\n• Épargne : gratuite (le gel rapporte 1% à 6% par an selon la durée)\n• Zando : publier une annonce est gratuit ; le boost est optionnel\n• Lecteur UQ : le créateur fixe son prix, 90% lui revient\n\n💡 Le prix du BORB n'est pas fixé à l'avance : le moteur le publie en continu, et le coffre affiche sa source et son âge.",
        suggestions: ['Les frais', 'Combien vaut 1 BORB ?', 'Créer un compte', 'Épargne et crédit'],
      },
      en: {
        title: 'How much does it cost?',
        content:
          "UQ has no mandatory subscription. Here are the main costs:\n\n• Creating an account: free\n• Receiving BORB: free\n• Sending a converted currency: free\n• Converting BORB ↔ currency: live rate, no extra fee\n• Savings: free (locking earns 1% to 6% per year depending on duration)\n• Zando: posting a listing is free; boosting is optional\n• UQ Reader: the creator sets the price, 90% goes to them\n\n💡 The BORB price is not set in advance: the engine publishes it continuously, and the wallet shows its source and its age.",
        suggestions: ['Fees', 'How much is 1 BORB?', 'Create an account', 'Savings and credit'],
      },
      es: {
        title: '¿Cuánto cuesta?',
        content:
          'UQ no tiene suscripción obligatoria. Estos son los costes principales:\n\n• Crear una cuenta: gratis\n• Recibir BORB: gratis\n• Enviar una divisa convertida: gratis\n• Convertir BORB ↔ divisa: tipo live, sin comisión adicional\n• Ahorro: gratis (el bloqueo rinde del 1% al 6% anual según la duración)\n• Zando: publicar un anuncio es gratis; el impulso es opcional\n• Lector UQ: el creador fija su precio, el 90% es para él\n\n💡 El precio del BORB no está fijado de antemano: el motor lo publica de forma continua y la billetera muestra su fuente y su antigüedad.',
        suggestions: ['Las comisiones', '¿Cuánto vale 1 BORB?', 'Crear una cuenta', 'Ahorro y crédito'],
      },
      sw: {
        title: 'Inagharimu kiasi gani?',
        content:
          'UQ haina usajili wa lazima. Hizi ni gharama kuu:\n\n• Kufungua akaunti: bure\n• Kupokea BORB: bure\n• Kutuma sarafu iliyobadilishwa: bure\n• Kubadilisha BORB ↔ sarafu: kiwango cha moja kwa moja, bila ada ya ziada\n• Akiba: bure (kufunga huleta 1% hadi 6% kwa mwaka kulingana na muda)\n• Zando: kuchapisha tangazo ni bure; kukuza ni hiari\n• Lector UQ: mbunifu huweka bei, 90% ni yake\n\n💡 Bei ya BORB haiamuliwa mapema: injini inaitoa kwa mwendelezo, na pouchi huonyesha chanzo chake na umri wake.',
        suggestions: ['Ada', 'BORB 1 ni ngapi?', 'Fungua akaunti', 'Akiba na mkopo'],
      },
    }
  ),

  MANUAL(
    'topic_transfer',
    'topic',
    al(
      ['comment payer', 'comment envoyer de l argent', 'comment transferer', 'faire un transfert', 'comment faire un virement', 'transferer de l argent', 'envoyer une devise', 'envoyer de l argent', 'envoyer en cdf', 'envoyer en usd', 'envoyer en euro', 'envoyer des dollars', 'transferer une devise', 'pourquoi je ne peux pas envoyer du borb', 'pourquoi je ne peux pas envoyer de borb', 'envoyer du borb', 'est ce que l envoi est gratuit', 'l envoi est il gratuit', 'envoi gratuit'],
      ['how do i pay', 'how to pay', 'how to send money', 'how do i transfer money', 'how to transfer', 'send money', 'send a currency', 'send currency', 'send usd', 'send cdf', 'send euros', 'why cant i send borb', 'why cannot i send borb', 'can i send borb', 'is sending free', 'is sending money free', 'are transfers free'],
      ['como pago', 'como pagar', 'como envio dinero', 'como enviar dinero', 'como transferir', 'enviar una divisa', 'enviar divisa', 'enviar dolares', 'enviar en cdf', 'por que no puedo enviar borb', 'puedo enviar borb', 'el envio es gratis', 'enviar es gratis'],
      ['jinsi ya kulipa', 'jinsi ya kutuma pesa', 'kutuma pesa', 'tuma sarafu', 'kutuma sarafu', 'kutuma dola', 'kwa nini siwezi kutuma borb', 'naweza kutuma borb', 'kutuma ni bure', 'uhamisho ni bure', 'nawezaje kutuma pesa']
    ),
    {
      fr: {
        title: 'Envoyer une devise (pas du BORB)',
        content:
          "Sur UQ, on envoie une DEVISE, jamais du BORB directement.\n\nLe BORB est ta réserve de sécurité : la garantie derrière ta monnaie. Il n'est pas transférable à quelqu'un d'autre.\n\n1. Ouvre ton Coffre, section « Réserve de sécurité (BORB) »\n2. Appuie sur « Échanger ma réserve »\n3. Choisis la devise (CDF, USD, EUR…), le montant, et confirme avec ton code PIN — le taux appliqué est le taux live de l'oracle\n4. Ensuite, utilise « Envoyer une devise » : saisis le pseudo uq@... ou le numéro UQ du destinataire, le montant, puis confirme avec ton code secret\n\n✅ L'envoi d'une devise déjà convertie est GRATUIT.\n⚡ Instantané, et définitif : vérifie le destinataire avant de confirmer.\n\n💡 Les devises converties sont les seules transférables. Le BORB reste ta réserve.",
        suggestions: ['C’est quoi le BORB ?', 'Acheter de la réserve BORB', 'Annuler une transaction', 'Contacter le support'],
      },
      en: {
        title: 'Send a currency (not BORB)',
        content:
          "On UQ, you send a CURRENCY, never BORB directly.\n\nBORB is your security reserve: the backing behind your money. It cannot be transferred to someone else.\n\n1. Open your Vault, section “Security reserve (BORB)”\n2. Tap “Exchange my reserve”\n3. Pick the currency (CDF, USD, EUR…) and the amount, then confirm with your PIN — the rate is the live oracle rate\n4. Then use “Send a currency”: enter the recipient's uq@... pseudo or UQ number and the amount, then confirm with your secret code\n\n✅ Sending an already-converted currency is FREE.\n⚡ Instant and final: check the recipient before confirming.\n\n💡 Only converted currencies are transferable. BORB stays your reserve.",
        suggestions: ['What is BORB?', 'Buy BORB reserve', 'Cancel a transaction', 'Contact support'],
      },
      es: {
        title: 'Enviar una divisa (no BORB)',
        content:
          'En UQ se envía una DIVISA, nunca BORB directamente.\n\nEl BORB es tu reserva de seguridad: la garantía detrás de tu dinero. No se puede transferir a otra persona.\n\n1. Abre tu Caja, sección «Reserva de seguridad (BORB)»\n2. Pulsa «Cambiar mi reserva»\n3. Elige la divisa (CDF, USD, EUR…), el importe, y confirma con tu PIN — el tipo aplicado es el tipo live del oráculo\n4. Después usa «Enviar una divisa»: ingresa el seudónimo uq@... o el número UQ del destinatario, el importe, y confirma con tu código secreto\n\n✅ Enviar una divisa ya convertida es GRATIS.\n⚡ Instantáneo y definitivo: verifica el destinatario antes de confirmar.\n\n💡 Solo las divisas convertidas son transferibles. El BORB sigue siendo tu reserva.',
        suggestions: ['¿Qué es el BORB?', 'Comprar reserva BORB', 'Cancelar una transacción', 'Contactar soporte'],
      },
      sw: {
        title: 'Tuma sarafu (si BORB)',
        content:
          'Kwenye UQ, unatuma SARAFU, si BORB moja kwa moja.\n\nBORB ni akiba yako ya usalama: dhamana iliyo nyuma ya pesa yako. Haiwezi kuhamishiwa mtu mwingine.\n\n1. Fungua Sanduku lako, sehemu «Akiba ya usalama (BORB)»\n2. Bofya «Badilisha akiba yangu»\n3. Chagua sarafu (CDF, USD, EUR…), kiasi, na thibitisha kwa PIN yako — kiwango ni kile cha moja kwa moja cha oracle\n4. Kisha tumia «Tuma sarafu»: ingiza jina la uq@... au namba ya UQ ya mpokeaji, kiasi, na thibitisha kwa msimbo wako wa siri\n\n✅ Kutuma sarafu iliyobadilishwa ni BURE.\n⚡ Ni wa papo hapo na wa mwisho: angalia mpokeaji kabla ya kuthibitisha.\n\n💡 Ni sarafu zilizobadilishwa tu zinazoweza kuhamishwa. BORB inabaki kuwa akiba yako.',
        suggestions: ['BORB ni nini?', 'Nunua akiba ya BORB', 'Ghairi muamala', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_cancel',
    'topic',
    al(
      ['annuler une transaction', 'annuler un transfert', 'annuler un envoi', 'peut on annuler', 'annulation', 'annuler paiement'],
      ['cancel transaction', 'cancel a transaction', 'cancel transfer', 'can i cancel', 'cancel payment', 'reverse transaction'],
      ['cancelar una transaccion', 'cancelar transferencia', 'cancelar pago', 'cancelar un envio', 'anular transaccion', 'anular un envio', 'anular envio', 'se puede cancelar', 'se puede anular'],
      ['ghairi muamala', 'kufuta muamala', 'kughairi malipo', 'muamala unaweza kughairiwa', 'kufuta uhamisho']
    ),
    {
      fr: {
        title: 'Peut-on annuler un transfert ?',
        content:
          "Non. Une fois confirmée, une transaction est DÉFINITIVE : elle ne peut pas être annulée ni inversée.\n\n⚠️ Vérifie toujours AVANT de confirmer :\n• Le numéro du destinataire\n• Le montant\n• Le message\n\n💡 En cas d'erreur :\n1. Contacte immédiatement le destinataire pour trouver un arrangement\n2. Si le numéro est incorrect, préviens le support (support@ufundi.uq)\n3. Garde la référence de la transaction\n\nLes frais de 0.1% restent dus même en cas d'erreur.",
        suggestions: ['Mauvais destinataire', 'Envoyer BORB', 'Contacter le support', 'Les frais'],
      },
      en: {
        title: 'Can a transfer be cancelled?',
        content:
          "No. Once confirmed, a transaction is FINAL: it cannot be cancelled or reversed.\n\n⚠️ Always check BEFORE confirming:\n• The recipient's number\n• The amount\n• The message\n\n💡 If you made a mistake:\n1. Contact the recipient immediately to find an arrangement\n2. If the number is wrong, notify support (support@ufundi.uq)\n3. Keep the transaction reference\n\nThe 0.1% fee still applies even if you made a mistake.",
        suggestions: ['Wrong recipient', 'Send BORB', 'Contact support', 'Fees'],
      },
      es: {
        title: '¿Se puede cancelar una transferencia?',
        content:
          'No. Una vez confirmada, una transacción es DEFINITIVA: no se puede cancelar ni revertir.\n\n⚠️ Verifica siempre ANTES de confirmar:\n• El número del destinatario\n• El importe\n• El mensaje\n\n💡 Si te equivocaste:\n1. Contacta de inmediato al destinatario para llegar a un acuerdo\n2. Si el número es incorrecto, avisa al soporte (support@ufundi.uq)\n3. Guarda la referencia de la transacción\n\nLa comisión del 0.1% se aplica igualmente aunque haya error.',
        suggestions: ['Destinatario equivocado', 'Enviar BORB', 'Contactar soporte', 'Las comisiones'],
      },
      sw: {
        title: 'Muamala unaweza kughairiwa?',
        content:
          'Hapana. Ukishathibitishwa, muamala ni WA MWISHO: hauwezi kughairiwa wala kurudishwa.\n\n⚠️ Angalia kila wakati KABLA ya kuthibitisha:\n• Namba ya mpokeaji\n• Kiasi\n• Ujumbe\n\n💡 Ukikosea:\n1. Wasiliana mara moja na mpokeaji ili mpatane\n2. Kama namba si sahihi, arifu msaada (support@ufundi.uq)\n3. Hifadhi kumbukumbu ya muamala\n\nAda ya 0.1% inabaki hata ukikosea.',
        suggestions: ['Mpokeaji si sahihi', 'Tuma BORB', 'Wasiliana na msaada', 'Ada'],
      },
    }
  ),

  MANUAL(
    'topic_escrow',
    'topic',
    al(
      ['escrow', 'sequence', 'sequestre', 'fonds bloques', 'protection achat', 'c est quoi escrow', 'zando escrow'],
      ['escrow', 'what is escrow', 'escrow protection', 'buyer protection', 'funds locked', 'zando escrow'],
      ['escrow', 'que es escrow', 'deposito en garantia', 'proteccion comprador', 'zando escrow'],
      ['escrow', 'escrow ni nini', 'ulinzi wa mnunuzi', 'fedha zimefungwa', 'zando escrow']
    ),
    {
      fr: {
        title: "L'escrow (séquestre) sur Zando",
        content:
          "L'escrow est un SÉQUESTRE : l'argent de l'acheteur est bloqué, puis libéré seulement quand la commande est confirmée.\n\n✅ Les fonds sont bloqués à l'achat\n✅ Libérés à la livraison\n✅ Remboursés si problème\n✅ Arbitrage en cas de litige\n\n💡 Cela protège l'acheteur ET le vendeur : personne ne peut partir avec l'argent sans que l'échange soit terminé.",
        suggestions: ['Comment acheter sur Zando ?', 'Comment vendre sur Zando ?', 'Litiges', 'Contacter le support'],
      },
      en: {
        title: 'Escrow on Zando',
        content:
          "Escrow is a SAFE HOLD: the buyer's money is locked, then released only when the order is confirmed.\n\n✅ Funds are locked at purchase\n✅ Released on delivery\n✅ Refunded if there is a problem\n✅ Arbitration in case of dispute\n\n💡 It protects BOTH buyer and seller: nobody can walk away with the money before the exchange is complete.",
        suggestions: ['How to buy on Zando?', 'How to sell on Zando?', 'Disputes', 'Contact support'],
      },
      es: {
        title: 'El escrow (depósito en garantía) en Zando',
        content:
          'El escrow es un DEPÓSITO EN GARANTÍA: el dinero del comprador queda bloqueado y solo se libera cuando se confirma el pedido.\n\n✅ Los fondos se bloquean al comprar\n✅ Se liberan al entregar\n✅ Se reembolsan si hay problema\n✅ Arbitraje en caso de disputa\n\n💡 Protege al comprador Y al vendedor: nadie puede quedarse con el dinero antes de completar el intercambio.',
        suggestions: ['¿Cómo comprar en Zando?', '¿Cómo vender en Zando?', 'Disputas', 'Contactar soporte'],
      },
      sw: {
        title: 'Escrow (fedha zilizofungwa) kwenye Zando',
        content:
          'Escrow ni UFUNGAJI WA FEDHA: pesa za mnunuzi hufungwa, kisha hutolewa tu pale agizo linapothibitishwa.\n\n✅ Fedha hufungwa wakati wa ununuzi\n✅ Hutolewa baada ya kukabidhi\n✅ Hurudishwa kama kuna tatizo\n✅ Usuluhishi kama kuna mgogoro\n\n💡 Inalinda mnunuzi NA muuzaji: hakuna anayeweza kuchukua pesa kabla biashara haijakamilika.',
        suggestions: ['Jinsi ya kununua Zando?', 'Jinsi ya kuuza Zando?', 'Migogoro', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_borb',
    'topic',
    al(
      ['c est quoi le borb', 'borb c est quoi', 'qu est ce que le borb', 'a quoi sert le borb', 'a quoi sert la reserve de securite', 'c est quoi la reserve de securite', 'reserve de securite', 'ma reserve de securite', 'borb', 'le borb est une monnaie', 'le borb est il une monnaie', 'pourquoi le borb n est pas une monnaie', 'borb monnaie', 'reserve borb', 'qu est ce que la reserve borb'],
      ['what is borb', 'what is the borb', 'what does borb mean', 'what is the security reserve', 'what is borb reserve', 'borb', 'is borb a currency', 'is borb money', 'why is borb not a currency', 'borb reserve', 'what is the borb reserve'],
      ['que es el borb', 'que es borb', 'para que sirve el borb', 'que es la reserva de seguridad', 'reserva de seguridad', 'borb', 'el borb es una moneda', 'el borb es dinero', 'por que el borb no es una moneda', 'reserva borb'],
      ['borb ni nini', 'borb', 'borb ni sarafu', 'borb ni pesa', 'kwa nini borb si sarafu', 'akiba ya usalama ni nini', 'akiba ya usalama', 'akiba ya borb', 'borb ni akiba']
    ),
    {
      fr: {
        title: "Le BORB, c'est ta réserve de sécurité",
        content:
          "Le BORB n'est pas une monnaie : c'est ta RÉSERVE DE SÉCURITÉ.\n\nImage simple : tes devises (CDF, USD, EUR…) sont les billets, et le BORB est l'or qui les garantit. Tu vois les billets ; la réserve reste derrière.\n\n• Le BORB garantit la valeur de tes devises\n• Il n'apparaît pas comme une devise transférable\n• Il n'est pas transférable directement à quelqu'un\n\nPour l'utiliser : échange une part de ta réserve en devise (Coffre → « Échanger ma réserve »), puis envoie cette devise. Le taux d'échange est le taux live de l'oracle.\n\n💡 Plus ta réserve est solide, plus tes devises sont stables.",
        suggestions: ['Comment envoyer de l’argent ?', 'Acheter de la réserve BORB', 'Quelles devises ?', 'Contacter le support'],
      },
      en: {
        title: 'BORB is your security reserve',
        content:
          "BORB is not a currency: it's your SECURITY RESERVE.\n\nSimple picture: your currencies (CDF, USD, EUR…) are the bills, and BORB is the gold backing them. You see the bills; the reserve stays behind.\n\n• BORB backs the value of your currencies\n• It does not appear as a transferable currency\n• It cannot be sent directly to someone\n\nTo use it: exchange part of your reserve into a currency (Vault → “Exchange my reserve”), then send that currency. The exchange rate is the live oracle rate.\n\n💡 The stronger your reserve, the more stable your currencies.",
        suggestions: ['How to send money?', 'Buy BORB reserve', 'Which currencies?', 'Contact support'],
      },
      es: {
        title: 'El BORB es tu reserva de seguridad',
        content:
          'El BORB no es una moneda: es tu RESERVA DE SEGURIDAD.\n\nImagen simple: tus divisas (CDF, USD, EUR…) son los billetes, y el BORB es el oro que los garantiza. Tú ves los billetes; la reserva queda detrás.\n\n• El BORB garantiza el valor de tus divisas\n• No aparece como una divisa transferible\n• No se puede enviar directamente a otra persona\n\nPara usarlo: cambia parte de tu reserva a una divisa (Caja → «Cambiar mi reserva») y luego envía esa divisa. El tipo de cambio es el tipo live del oráculo.\n\n💡 Cuanto más sólida es tu reserva, más estables son tus divisas.',
        suggestions: ['¿Cómo enviar dinero?', 'Comprar reserva BORB', '¿Qué divisas?', 'Contactar soporte'],
      },
      sw: {
        title: 'BORB ni akiba yako ya usalama',
        content:
          'BORB si sarafu: ni AKIBA YAKO YA USALAMA.\n\nPicha rahisi: sarafu zako (CDF, USD, EUR…) ni noti, na BORB ni dhahabu inayozihalalisha. Unaona noti; akiba inabaki nyuma.\n\n• BORB inahalalisha thamani ya sarafu zako\n• Haionekani kama sarafu inayoweza kuhamishwa\n• Haiwezi kutumwa moja kwa moja kwa mtu\n\nIli kuitumia: badilisha sehemu ya akiba yako kuwa sarafu (Sanduku → «Badilisha akiba yangu»), kisha tuma sarafu hiyo. Kiwango cha ubadilishaji ni kile cha moja kwa moja cha oracle.\n\n💡 Kadiri akiba yako ilivyo imara, ndivyo sarafu zako zinavyokuwa thabiti.',
        suggestions: ['Jinsi ya kutuma pesa?', 'Nunua akiba ya BORB', 'Sarafu zipi?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_borb_buy',
    'topic',
    al(
      ['comment acheter du borb', 'acheter du borb', 'acheter borb', 'acheter de la reserve', 'acheter de la reserve borb', 'ou acheter du borb', 'comment vendre du borb', 'vendre du borb', 'vendre borb', 'quel est le taux du borb', 'taux du borb', 'prix du borb', 'combien vaut le borb'],
      ['how to buy borb', 'buy borb', 'how to buy borb reserve', 'where to buy borb', 'how to sell borb', 'sell borb', 'borb price', 'borb rate', 'what is the borb rate', 'borb exchange rate'],
      ['como comprar borb', 'comprar borb', 'comprar reserva borb', 'donde comprar borb', 'como vender borb', 'vender borb', 'precio del borb', 'tasa del borb', 'tipo de cambio del borb'],
      ['jinsi ya kununua borb', 'kununua borb', 'nunua borb', 'wapi kununua borb', 'jinsi ya kuuza borb', 'kuuza borb', 'bei ya borb', 'kiwango cha borb', 'thamani ya borb']
    ),
    {
      fr: {
        title: 'Acheter, vendre ou convertir la réserve BORB',
        content:
          "Le BORB n'est pas une paire de trading : il n'existe ni « Acheter BORB » ni « Vendre BORB » dans le carnet d'ordres.\n\nLe BORB s'échange contre du mobile money dans le P2P mobile (Trading → P2P), et se convertit dans ton Coffre.\n\nPour convertir depuis la réserve de sécurité :\n1. Ouvre ton Coffre\n2. Section « Réserve de sécurité (BORB) »\n3. Appuie sur « Échanger ma réserve »\n4. Choisis le sens : réserve → devise, ou devise → réserve\n5. Saisis le montant et choisis la devise\n6. Confirme avec ton code PIN\n\n📈 Le taux appliqué est celui de l'oracle, en direct : il n'y a pas de prix fixe.\n\n💡 Les BORB achetés en P2P arrivent dans ton coffre : vendables en Trading et convertibles en devise virtuelle pour transférer, mais jamais transférables directement.",
        suggestions: ['Échanger ma réserve', 'Vendre une devise en P2P', 'Comment trader sur UQ ?', "C'est quoi le BORB ?"],
      },
      en: {
        title: 'Buy, sell or convert the BORB reserve',
        content:
          "BORB is not a trading pair: there is no “Buy BORB” or “Sell BORB” in the order book.\n\nBORB is exchanged for mobile money in Mobile P2P (Trading → P2P), and converted in your Vault.\n\nTo convert from the security reserve:\n1. Open your Vault\n2. Section “Security reserve (BORB)”\n3. Tap “Exchange my reserve”\n4. Choose the direction: reserve → currency, or currency → reserve\n5. Enter the amount and pick the currency\n6. Confirm with your PIN\n\n📈 The applied rate is the live oracle rate: there is no fixed price.\n\n💡 BORB bought on P2P lands in your vault: sellable in Trading and convertible into virtual currency to transfer, but never transferable directly.",
        suggestions: ['Exchange my reserve', 'Sell a currency on P2P', 'How to trade on UQ?', 'What is BORB?'],
      },
      es: {
        title: 'Comprar, vender o convertir la reserva BORB',
        content:
          'El BORB no es un par de trading: no existe «Comprar BORB» ni «Vender BORB» en el libro de órdenes.\n\nEl BORB se intercambia por mobile money en el P2P móvil (Trading → P2P) y se convierte en tu Caja.\n\nPara convertir desde la reserva de seguridad:\n1. Abre tu Caja\n2. Sección «Reserva de seguridad (BORB)»\n3. Pulsa «Cambiar mi reserva»\n4. Elige el sentido: reserva → divisa, o divisa → reserva\n5. Indica el importe y elige la divisa\n6. Confirma con tu PIN\n\n📈 El tipo aplicado es el del oráculo, en directo: no hay precio fijo.\n\n💡 Los BORB comprados en P2P llegan a tu caja: vendibles en Trading y convertibles en divisa virtual para transferir, pero nunca transferibles directamente.',
        suggestions: ['Cambiar mi reserva', 'Vender una divisa en P2P', '¿Cómo hacer trading en UQ?', '¿Qué es el BORB?'],
      },
      sw: {
        title: 'Nunua, uza au badilisha akiba ya BORB',
        content:
          'BORB si jozi ya trading: hakuna «Nunua BORB» wala «Uza BORB» kwenye kitabu cha maagizo.\n\nBORB huanishwa na mobile money katika P2P ya simu (Trading → P2P), na hubadilishwa kwenye Sanduku lako.\n\nKubadilisha kutoka akiba ya usalama:\n1. Fungua Sanduku lako\n2. Sehemu «Akiba ya usalama (BORB)»\n3. Bofya «Badilisha akiba yangu»\n4. Chagua mwelekeo: akiba → sarafu, au sarafu → akiba\n5. Weka kiasi na uchague sarafu\n6. Thibitisha kwa PIN yako\n\n📈 Kiwango kinachotumika ni cha oracle, papo hapo: hakuna bei isiyobadilika.\n\n💡 BORB ulizonunua kwenye P2P hufika kwenye sanduku lako: zinaweza kuuzwa kwenye Trading na kubadilishwa kwa sarafu ya kielektroniki ili kutuma, lakini hazitumwi moja kwa moja.',
        suggestions: ['Badilisha akiba yangu', 'Uza sarafu kwenye P2P', 'Jinsi ya kufanya trading UQ?', 'BORB ni nini?'],
      },
    }
  ),

  MANUAL(
    'topic_currencies',
    'topic',
    al(
      ['quelles devises', 'quelles devises puis je utiliser', 'quelles sont les devises', 'devises disponibles', 'mes devises', 'comment voir mes devises', 'voir mes devises', 'changer de devise', 'quel est le taux de change', 'taux de change', 'devise locale', 'devise internationale', 'quelles devises sont acceptees'],
      ['which currencies', 'what currencies', 'which currencies can i use', 'available currencies', 'my currencies', 'how to see my currencies', 'change currency', 'exchange rate', 'what is the exchange rate', 'local currency', 'international currency', 'what currencies are supported'],
      ['que divisas', 'que divisas puedo usar', 'cuales son las divisas', 'divisas disponibles', 'mis divisas', 'como ver mis divisas', 'cambiar de divisa', 'tipo de cambio', 'cual es el tipo de cambio', 'divisa local', 'divisa internacional'],
      ['sarafu gani', 'sarafu zipi', 'sarafu zipi naweza kutumia', 'sarafu zilizopo', 'sarafu zangu', 'jinsi ya kuona sarafu zangu', 'kubadilisha sarafu', 'kiwango cha ubadilishaji', 'kiwango cha ubadilishaji ni nini', 'sarafu ya ndani', 'sarafu ya kimataifa']
    ),
    {
      fr: {
        title: 'Tes devises disponibles',
        content:
          "Les devises disponibles dépendent de ton pays.\n\n🌍 Locales (exemples) : CDF (RDC), XOF, XAF, NGN, KES, ZAR, MAD, GHS, UGX, TZS, EGP, RWF, BIF, MZN, AOA, ETB\n🌐 Internationales : USD, EUR, GBP, CHF, JPY, CNY, CAD, AUD, INR, BRL, MXN, SEK, NOK, DKK, PLN, TRY\n\n• Dans ton Coffre, section « Mes devises », tu vois les soldes réellement détenus après conversion\n• Les taux sont LIVE (oracle) et changent en temps réel\n• Le BORB n'est pas une devise : c'est ta réserve de sécurité\n\n💡 Tu peux convertir une part de ta réserve BORB vers l'une de ces devises, puis l'envoyer. Seules les devises converties sont transférables.",
        suggestions: ['Échanger du BORB en devise', 'Envoyer une devise', 'C’est quoi le BORB ?', 'Contacter le support'],
      },
      en: {
        title: 'Your available currencies',
        content:
          "Available currencies depend on your country.\n\n🌍 Local (examples): CDF (DRC), XOF, XAF, NGN, KES, ZAR, MAD, GHS, UGX, TZS, EGP, RWF, BIF, MZN, AOA, ETB\n🌐 International: USD, EUR, GBP, CHF, JPY, CNY, CAD, AUD, INR, BRL, MXN, SEK, NOK, DKK, PLN, TRY\n\n• In your Vault, under “My currencies”, you see the balances actually held after conversion\n• Rates are LIVE (oracle) and change in real time\n• BORB is not a currency: it's your security reserve\n\n💡 You can convert part of your BORB reserve into one of these currencies, then send it. Only converted currencies are transferable.",
        suggestions: ['Exchange BORB for currency', 'Send a currency', 'What is BORB?', 'Contact support'],
      },
      es: {
        title: 'Tus divisas disponibles',
        content:
          'Las divisas disponibles dependen de tu país.\n\n🌍 Locales (ejemplos): CDF (RDC), XOF, XAF, NGN, KES, ZAR, MAD, GHS, UGX, TZS, EGP, RWF, BIF, MZN, AOA, ETB\n🌐 Internacionales: USD, EUR, GBP, CHF, JPY, CNY, CAD, AUD, INR, BRL, MXN, SEK, NOK, DKK, PLN, TRY\n\n• En tu Caja, sección «Mis divisas», ves los saldos realmente disponibles tras la conversión\n• Los tipos son LIVE (oráculo) y cambian en tiempo real\n• El BORB no es una divisa: es tu reserva de seguridad\n\n💡 Puedes convertir parte de tu reserva BORB a una de estas divisas y luego enviarla. Solo las divisas convertidas son transferibles.',
        suggestions: ['Cambiar BORB a divisa', 'Enviar una divisa', '¿Qué es el BORB?', 'Contactar soporte'],
      },
      sw: {
        title: 'Sarafu zako zilizopo',
        content:
          'Sarafu zilizopo hutegemea nchi yako.\n\n🌍 Za ndani (mfano): CDF (DRC), XOF, XAF, NGN, KES, ZAR, MAD, GHS, UGX, TZS, EGP, RWF, BIF, MZN, AOA, ETB\n🌐 Za kimataifa: USD, EUR, GBP, CHF, JPY, CNY, CAD, AUD, INR, BRL, MXN, SEK, NOK, DKK, PLN, TRY\n\n• Kwenye Sanduku lako, sehemu «Sarafu zangu», unaona salio unalozimiliki baada ya ubadilishaji\n• Viwango ni vya MOJA KWA MOJA (oracle) na hubadilika papo hapo\n• BORB si sarafu: ni akiba yako ya usalama\n\n💡 Unaweza kubadilisha sehemu ya akiba yako ya BORB kuwa moja ya sarafu hizi, kisha kuituma. Ni sarafu zilizobadilishwa tu zinazoweza kuhamishwa.',
        suggestions: ['Badilisha BORB kuwa sarafu', 'Tuma sarafu', 'BORB ni nini?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_borb_exchange',
    'topic',
    al(
      ['comment echanger du borb', 'echanger du borb', 'echanger borb en devise', 'comment echanger du borb en devise', 'comment echanger une devise en borb', 'echanger une devise en borb', 'convertir du borb', 'convertir borb en devise', 'echanger ma reserve', 'convertir ma reserve', 'pourquoi je dois echanger avant d envoyer', 'pourquoi echanger le borb avant d envoyer', 'quel est le taux d echange'],
      ['how to exchange borb', 'exchange borb', 'exchange borb for currency', 'how to convert borb', 'convert borb to currency', 'convert currency to borb', 'exchange currency for borb', 'why do i need to exchange before sending', 'exchange my reserve', 'what is the exchange rate', 'borb exchange'],
      ['como cambiar borb', 'cambiar borb', 'cambiar borb a divisa', 'convertir borb', 'convertir borb a divisa', 'cambiar divisa a borb', 'por que debo cambiar antes de enviar', 'cambiar mi reserva', 'tasa de cambio'],
      ['jinsi ya kubadilisha borb', 'kubadilisha borb', 'badilisha borb kuwa sarafu', 'kubadilisha sarafu kuwa borb', 'kwa nini nibadilishe kabla ya kutuma', 'badilisha akiba yangu', 'kiwango cha ubadilishaji']
    ),
    {
      fr: {
        title: 'Échanger du BORB en devise',
        content:
          "Pour échanger du BORB en devise :\n\n1. Ouvre ton Coffre\n2. Section « Réserve de sécurité (BORB) »\n3. Appuie sur « Échanger ma réserve »\n4. Choisis le sens : réserve → devise, ou devise → réserve\n5. Saisis le montant et choisis la devise\n6. Vérifie le taux appliqué (taux live de l'oracle), puis confirme avec ton code PIN\n\n✅ La devise convertie apparaît aussitôt dans « Mes devises ».\n💡 C'est cette devise que tu peux ensuite envoyer : le BORB, lui, n'est pas transférable directement.\n\nIl n'y a pas de taux fixe : le taux suit l'oracle en temps réel.",
        suggestions: ['Comment envoyer de l’argent ?', 'Acheter de la réserve BORB', 'Quelles devises ?', 'Contacter le support'],
      },
      en: {
        title: 'Exchange BORB for currency',
        content:
          "To exchange BORB for a currency:\n\n1. Open your Vault\n2. Section “Security reserve (BORB)”\n3. Tap “Exchange my reserve”\n4. Choose the direction: reserve → currency, or currency → reserve\n5. Enter the amount and pick the currency\n6. Check the applied rate (live oracle rate), then confirm with your PIN\n\n✅ The converted currency appears right away in “My currencies”.\n💡 That currency is what you can then send: BORB itself cannot be transferred directly.\n\nThere is no fixed rate: it follows the oracle in real time.",
        suggestions: ['How to send money?', 'Buy BORB reserve', 'Which currencies?', 'Contact support'],
      },
      es: {
        title: 'Cambiar BORB a divisa',
        content:
          'Para cambiar BORB a una divisa:\n\n1. Abre tu Caja\n2. Sección «Reserva de seguridad (BORB)»\n3. Pulsa «Cambiar mi reserva»\n4. Elige el sentido: reserva → divisa, o divisa → reserva\n5. Indica el importe y elige la divisa\n6. Verifica el tipo aplicado (tipo live del oráculo) y confirma con tu PIN\n\n✅ La divisa convertida aparece enseguida en «Mis divisas».\n💡 Esa divisa es la que luego puedes enviar: el BORB no se puede transferir directamente.\n\nNo hay tipo fijo: sigue al oráculo en tiempo real.',
        suggestions: ['¿Cómo enviar dinero?', 'Comprar reserva BORB', '¿Qué divisas?', 'Contactar soporte'],
      },
      sw: {
        title: 'Badilisha BORB kuwa sarafu',
        content:
          'Ili kubadilisha BORB kuwa sarafu:\n\n1. Fungua Sanduku lako\n2. Sehemu «Akiba ya usalama (BORB)»\n3. Bofya «Badilisha akiba yangu»\n4. Chagua mwelekeo: akiba → sarafu, au sarafu → akiba\n5. Weka kiasi na uchague sarafu\n6. Angalia kiwango kilichotumika (kiwango cha moja kwa moja cha oracle), kisha thibitisha kwa PIN yako\n\n✅ Sarafu iliyobadilishwa huonekana mara moja kwenye «Sarafu zangu».\n💡 Ni sarafu hiyo unaweza kisha kuituma: BORB yenyewe haiwezi kuhamishwa moja kwa moja.\n\nHakuna kiwango kisichobadilika: hufuata oracle papo hapo.',
        suggestions: ['Jinsi ya kutuma pesa?', 'Nunua akiba ya BORB', 'Sarafu zipi?', 'Wasiliana na msaada'],
      },
    }
  ),

  MANUAL(
    'topic_trading_start',
    'topic',
    al(
      ['comment trader', 'comment faire du trading', 'faire du trading', 'trader sur uq', 'trading uq', 'trading', 'bourse', 'comment trader sur uq', 'comment passer un ordre', 'passer un ordre', 'comment passer un ordre au marche', 'comment passer un ordre limite', 'ordre au marche', 'ordre limite', 'ordre au marche ou ordre limite', 'difference entre ordre au marche et ordre limite', 'ordre limite bloque les fonds', 'les fonds sont bloques pendant un ordre limite', 'fonds immobilises', 'comment annuler un ordre', 'annuler un ordre limite', 'c est quoi un ordre au marche', 'comment acheter une devise sur le marche', 'comment vendre une devise sur le marche', 'acheter une devise', 'vendre une devise', 'comment fonctionne le trading'],
      ['how to trade', 'how to trade on uq', 'uq trading', 'trading', 'how to place an order', 'place an order', 'market order', 'limit order', 'market order or limit order', 'difference between market and limit order', 'does a limit order lock funds', 'locked funds', 'how to cancel an order', 'cancel a limit order', 'how to buy a currency on the market', 'how to sell a currency on the market', 'buy a currency', 'sell a currency', 'how does trading work'],
      ['como hacer trading', 'trading en uq', 'trading', 'como poner una orden', 'orden de mercado', 'orden limite', 'orden de mercado o limite', 'diferencia entre orden de mercado y limite', 'la orden limite bloquea los fondos', 'fondos bloqueados', 'como cancelar una orden', 'cancelar una orden limite', 'como comprar una divisa en el mercado', 'como vender una divisa en el mercado', 'comprar una divisa', 'vender una divisa', 'como funciona el trading'],
      ['jinsi ya kufanya trading', 'trading uq', 'trading', 'jinsi ya kuweka order', 'order ya soko', 'order ya kikomo', 'order ya soko au kikomo', 'tofauti kati ya order ya soko na kikomo', 'order ya kikomo inazuia fedha', 'fedha zilizozuiwa', 'jinsi ya kufuta order', 'kufuta order ya kikomo', 'jinsi ya kununua sarafu sokoni', 'jinsi ya kuuza sarafu sokoni', 'nunua sarafu', 'uza sarafu', 'trading inafanyaje kazi']
    ),
    {
      fr: {
        title: 'Trader sur UQ (Trading)',
        content:
          "Le Trading UQ fonctionne avec des paires USD / devise, alimentées par l'oracle.\n\n1. Ouvre Trading → onglet Marché\n2. Choisis une paire (ex. USD / CDF)\n3. Choisis le sens : Acheter ou Vendre\n4. Choisis le type :\n   • Au marché : exécution immédiate au prix de l'oracle\n   • Limite : ton prix, avec fonds immobilisés jusqu'à exécution\n5. Saisis le montant, puis confirme avec ton code PIN\n\n📌 Tes ordres sont dans l'onglet Ordres. Un ordre limite encore ouvert peut être annulé : les fonds immobilisés te sont restitués.\n📌 Il faut le solde de la devise débitée : la devise quote pour un achat, la devise base pour une vente.\n\n💡 Le prix vient de l'oracle et bouge en direct : il n'y a pas de prix fixe.",
        suggestions: ['Comment repérer le marché vite ?', 'Comment vendre une devise en P2P ?', 'Quelles devises puis-je utiliser ?', 'Comment vérifier mon identité ?'],
      },
      en: {
        title: 'Trading on UQ',
        content:
          "UQ Trading uses USD / currency pairs, powered by the oracle.\n\n1. Open Trading → Market tab\n2. Pick a pair (e.g. USD / CDF)\n3. Choose the side: Buy or Sell\n4. Choose the type:\n   • Market: immediate execution at the oracle price\n   • Limit: your price, with funds locked until execution\n5. Enter the amount, then confirm with your PIN\n\n📌 Your orders are in the Orders tab. An open limit order can be cancelled: locked funds are returned to you.\n📌 You need the balance of the debited currency: the quote currency for a buy, the base currency for a sell.\n\n💡 The price comes from the oracle and moves live: there is no fixed price.",
        suggestions: ['How to scan the market quickly?', 'How to sell a currency on P2P?', 'Which currencies can I use?', 'How to verify my identity?'],
      },
      es: {
        title: 'Hacer trading en UQ',
        content:
          'El Trading UQ usa pares USD / divisa, alimentados por el oráculo.\n\n1. Abre Trading → pestaña Mercado\n2. Elige un par (ej. USD / CDF)\n3. Elige el sentido: Comprar o Vender\n4. Elige el tipo:\n   • De mercado: ejecución inmediata al precio del oráculo\n   • Límite: tu precio, con fondos bloqueados hasta la ejecución\n5. Indica el importe y confirma con tu PIN\n\n📌 Tus órdenes están en la pestaña Órdenes. Una orden límite abierta se puede cancelar: los fondos bloqueados te vuelven.\n📌 Necesitas el saldo de la divisa debitada: la divisa quote para una compra, la base para una venta.\n\n💡 El precio viene del oráculo y cambia en directo: no hay precio fijo.',
        suggestions: ['¿Cómo revisar el mercado rápido?', '¿Cómo vender una divisa en P2P?', '¿Qué divisas puedo usar?', '¿Cómo verificar mi identidad?'],
      },
      sw: {
        title: 'Kufanya trading UQ',
        content:
          'Trading ya UQ inatumia jozi USD / sarafu, zinazotolewa na oracle.\n\n1. Fungua Trading → kichupo cha Soko\n2. Chagua jozi (mf. USD / CDF)\n3. Chagua mwelekeo: Nunua au Uza\n4. Chagua aina:\n   • Ya soko: utekelezaji papo hapo kwa bei ya oracle\n   • Ya kikomo: bei yako, fedha zimezuiwa hadi utekelezaji\n5. Weka kiasi, kisha thibitisha kwa PIN yako\n\n📌 Order zako ziko kwenye kichupo cha Order. Order ya kikomo iliyo wazi inaweza kufutwa: fedha zilizozuiwa zinarejeshwa.\n📌 Unahitaji salio la sarafu inayotozwa: sarafu ya quote kwa ununuzi, sarafu ya msingi kwa uuzaji.\n\n💡 Bei inatoka kwa oracle na hubadilika papo hapo: hakuna bei isiyobadilika.',
        suggestions: ['Jinsi ya kuangalia soko haraka?', 'Jinsi ya kuuza sarafu P2P?', 'Sarafu zipi naweza kutumia?', 'Jinsi ya kuthibitisha utambulisho?'],
      },
    }
  ),

  MANUAL(
    'topic_market_scan',
    'topic',
    al(
      ['comment reperer le marche', 'reperer le marche vite', 'comment lire le marche', 'voir les prix du marche', 'comment scanner le marche', 'comment scanner le marche vite', 'quel est le prix sur le marche', 'ou voir le prix du marche', 'comment suivre les prix', 'comparer les taux', 'comparer le prix oracle et le p2p', 'comment comparer les taux p2p', 'comment voir le taux du jour', 'marche'],
      ['how to scan the market', 'scan the market quickly', 'how to read the market', 'see market prices', 'compare rates', 'oracle price vs p2p', 'how to compare p2p rates', 'what is the market price', 'how to check the rate', 'how to follow prices', 'market'],
      ['como revisar el mercado', 'como leer el mercado', 'ver precios del mercado', 'comparar tipos', 'precio del oraculo y p2p', 'como comparar los tipos p2p', 'cual es el precio del mercado', 'como ver el tipo del dia', 'mercado'],
      ['jinsi ya kuangalia soko', 'kuangalia soko haraka', 'jinsi ya kusoma soko', 'kuona bei za soko', 'kulinganisha viwango', 'bei ya oracle na p2p', 'jinsi ya kulinganisha viwango vya p2p', 'bei ya soko ni ngapi', 'soko']
    ),
    {
      fr: {
        title: 'Repérer le marché vite',
        content:
          "Pour lire le marché en quelques secondes :\n\n1. Trading → Marché : chaque ligne affiche la paire (USD / devise), le prix « 1 USD en devise » et le nombre de transactions sur 24 h\n2. Utilise la recherche pour aller directement à une devise\n3. Appuie sur Actualiser pour relire les prix de l'oracle\n4. Ouvre une paire pour voir le prix du marché dans le formulaire d'ordre\n\n🔎 Compare toujours deux choses :\n• le prix de l'oracle affiché dans Trading\n• les taux proposés en P2P mobile (1 USD = X devise), avec les bornes min/max et l'opérateur\n\n📌 En P2P, les numéros sont masqués (1234 ••• 78) : le numéro complet n'apparaît qu'après avoir pris l'offre.\n\n💡 Regarde d'abord les paires dont tu détiens déjà la devise : inutile de convertir pour commencer.",
        suggestions: ['Comment trader sur UQ ?', 'Comment vendre en P2P ?', 'Quelles devises puis-je utiliser ?', 'Comment vérifier mon identité ?'],
      },
      en: {
        title: 'Scanning the market quickly',
        content:
          "To read the market in seconds:\n\n1. Trading → Market: each row shows the pair (USD / currency), the price “1 USD in currency” and the 24 h transaction count\n2. Use search to jump straight to a currency\n3. Tap Refresh to re-read oracle prices\n4. Open a pair to see the market price in the order form\n\n🔎 Always compare two things:\n• the oracle price shown in Trading\n• the rates offered on mobile P2P (1 USD = X currency), with min/max bounds and the operator\n\n📌 On P2P, numbers are masked (1234 ••• 78): the full number only appears after you take the offer.\n\n💡 Start with pairs whose currency you already hold: no need to convert just to begin.",
        suggestions: ['How to trade on UQ?', 'How to sell on P2P?', 'Which currencies can I use?', 'How to verify my identity?'],
      },
      es: {
        title: 'Revisar el mercado rápido',
        content:
          'Para leer el mercado en segundos:\n\n1. Trading → Mercado: cada línea muestra el par (USD / divisa), el precio «1 USD en divisa» y el número de transacciones en 24 h\n2. Usa la búsqueda para ir directo a una divisa\n3. Pulsa Actualizar para releer los precios del oráculo\n4. Abre un par para ver el precio del mercado en el formulario de orden\n\n🔎 Compara siempre dos cosas:\n• el precio del oráculo que muestra Trading\n• los tipos ofrecidos en P2P móvil (1 USD = X divisa), con los límites mín/máx y el operador\n\n📌 En P2P los números están enmascarados (1234 ••• 78): el número completo aparece solo tras tomar la oferta.\n\n💡 Empieza por los pares cuya divisa ya tienes: no hace falta convertir para comenzar.',
        suggestions: ['¿Cómo hacer trading en UQ?', '¿Cómo vender en P2P?', '¿Qué divisas puedo usar?', '¿Cómo verificar mi identidad?'],
      },
      sw: {
        title: 'Kuangalia soko haraka',
        content:
          'Ili kusoma soko kwa sekunde chache:\n\n1. Trading → Soko: kila mstari unaonyesha jozi (USD / sarafu), bei «USD 1 kwa sarafu» na idadi ya miamala ya saa 24\n2. Tumia utafutaji kwenda moja kwa moja kwenye sarafu\n3. Bofya Sasisha ili kusoma tena bei za oracle\n4. Fungua jozi kuona bei ya soko kwenye fomu ya order\n\n🔎 Linganisha mambo mawili kila mara:\n• bei ya oracle inayoonyeshwa kwenye Trading\n• viwango vinavyotolewa kwenye P2P ya mobile money (USD 1 = sarafu X), pamoja na mipaka ya chini/juu na opereta\n\n📌 Kwenye P2P namba zimefichwa (1234 ••• 78): namba kamili inaonekana tu baada ya kuchukua ofa.\n\n💡 Anza na jozi ambazo tayari unazo sarafu: hakuna haja ya kubadilisha ili kuanza.',
        suggestions: ['Jinsi ya kufanya trading UQ?', 'Jinsi ya kuuza P2P?', 'Sarafu zipi naweza kutumia?', 'Jinsi ya kuthibitisha utambulisho?'],
      },
    }
  ),

  MANUAL(
    'topic_p2p',
    'topic',
    al(
      ['comment vendre en p2p', 'vendre en p2p', 'comment acheter en p2p', 'acheter en p2p', 'p2p mobile', 'comment publier une offre p2p', 'prendre une offre p2p', 'comment prendre une offre', 'comment fonctionne le p2p', 'vendre du mobile money', 'acheter du mobile money', 'comment vendre du mobile money', 'comment acheter du mobile money', 'le numero du vendeur est masque', 'comment vendre mes devises en p2p'],
      ['how to sell on p2p', 'sell on p2p', 'how to buy on p2p', 'buy on p2p', 'mobile p2p', 'how to publish a p2p offer', 'take a p2p offer', 'how to take an offer', 'how does p2p work', 'sell for mobile money', 'buy with mobile money', 'how to buy mobile money', 'how to sell mobile money', 'seller number masked'],
      ['como vender en p2p', 'vender en p2p', 'como comprar en p2p', 'comprar en p2p', 'p2p movil', 'como publicar una oferta p2p', 'tomar una oferta p2p', 'tomar una oferta', 'como funciona el p2p', 'vender por mobile money', 'comprar con mobile money', 'como comprar mobile money', 'como vender mobile money'],
      ['jinsi ya kuuza p2p', 'kuuza p2p', 'jinsi ya kununua p2p', 'kununua p2p', 'p2p ya mobile money', 'jinsi ya kuchapisha ofa p2p', 'kuchukua ofa p2p', 'kuchukua ofa', 'p2p inafanyaje kazi', 'kuuza kwa mobile money', 'kununua kwa mobile money', 'jinsi ya kununua mobile money', 'jinsi ya kuuza mobile money']
    ),
    {
      fr: {
        title: 'Acheter et vendre en P2P mobile',
        content:
          "Le P2P mobile sert à vendre du BORB contre du mobile money, entre utilisateurs. La base du marché est 1 BORB = 1 USD.\n\n📤 VENDRE (publier une offre)\n1. Ton profil doit contenir ton numéro mobile money, sinon l'offre est refusée\n2. Trading → P2P mobile → Publier une offre\n3. Choisis Vente, la devise de réception, ton taux local (1 USD = X devise), le minimum, le maximum, l'opérateur et la ville\n4. L'acheteur voit le prix de chaque BORB dans ta devise ; il prend l'offre avec son PIN et tes BORB sont réservés\n5. Il joint la capture de son paiement, le moteur l'analyse, puis il appuie sur « J'ai payé »\n6. Tu vois son verdict dans la commande, tu vérifies ton compte mobile money, puis tu libères : les BORB passent dans son coffre\n\n📥 ACHETER\n1. Choisis une offre et saisis ce que tu veux : un nombre de BORB, ou un montant dans la devise de ton choix — le prix passe par l'USD\n2. Confirme avec ton PIN : les BORB du vendeur sont réservés\n3. Paie le numéro mobile money affiché\n4. Ajoute la capture (ou photo) de ton paiement en complétant numéro, devise, montant et nom du titulaire\n5. Le moteur lit l'image : conforme → « J'ai payé » s'active ; doute → tu peux continuer en cochant « J'assume le doute », et le vendeur voit cette déclaration\n6. Le vendeur vérifie puis libère : les BORB arrivent dans ton coffre, vendables en Trading et convertibles en devise virtuelle pour transférer\n\n🔎 Chaque preuve est analysée (métadonnées, trace d'image générée par IA, cohérence du montant et de la devise) ; le vendeur peut joindre sa propre capture.\n🧠 Le moteur apprend de chaque issue : les cas validés et les litiges recalibrent ses seuils.\n💬 Un groupe privé « P2P devise #numéro » est créé automatiquement pour suivre la commande.\n🔒 Tu ne peux pas prendre ta propre offre. Une annulation dégage les fonds réservés ; après un paiement annoncé, la commande est marquée en litige.",
        suggestions: ['Comment vendre du BORB ?', 'Comment repérer le marché vite ?', 'Quelles devises puis-je utiliser ?', 'Comment vérifier mon identité ?'],
      },
      en: {
        title: 'Buying and selling on mobile P2P',
        content:
          "Mobile P2P is for selling BORB against mobile money between users. The market base is 1 BORB = 1 USD.\n\n📤 SELL (publish an offer)\n1. Your profile must contain your mobile money number, otherwise the offer is refused\n2. Trading → Mobile P2P → Publish an offer\n3. Choose Sell, the receiving currency, your local rate (1 USD = X currency), the minimum, the maximum, the operator and the city\n4. The buyer sees the price of each BORB in your currency; they take the offer with their PIN and your BORB are reserved\n5. They attach the screenshot of their payment, the engine analyses it, then they tap “I paid”\n6. You see their verdict in the order, check your mobile money account, then release: the BORB move into their vault\n\n📥 BUY\n1. Pick an offer and enter what you want: a number of BORB, or an amount in the currency of your choice — the price goes through USD\n2. Confirm with your PIN: the seller's BORB are reserved\n3. Pay the displayed mobile money number\n4. Add the screenshot (or photo) of your payment, filling in number, currency, amount and account holder name\n5. The engine reads the image: valid → “I paid” unlocks; doubt → you can still continue by ticking “I accept the doubt”, and the seller sees that declaration\n6. The seller checks and releases: the BORB land in your vault, sellable in Trading and convertible into virtual currency to transfer\n\n🔎 Every proof is analysed (metadata, traces of AI-generated images, amount and currency consistency); as a seller you can attach your own receipt.\n🧠 The engine learns from each outcome: confirmed cases and disputes recalibrate its thresholds.\n💬 A private group “P2P currency #number” is created automatically to follow the order.\n🔒 You cannot take your own offer. A cancellation unfreezes the reserved funds; after an announced payment the order is flagged as a dispute.",
        suggestions: ['How to sell BORB?', 'How to scan the market quickly?', 'Which currencies can I use?', 'How to verify my identity?'],
      },
      es: {
        title: 'Comprar y vender en P2P móvil',
        content:
          'El P2P móvil sirve para vender BORB a cambio de mobile money entre usuarios. La base del mercado es 1 BORB = 1 USD.\n\n📤 VENDER (publicar una oferta)\n1. Tu perfil debe tener tu número de mobile money, si no la oferta se rechaza\n2. Trading → P2P móvil → Publicar una oferta\n3. Elige Venta, la divisa de recepción, tu tipo local (1 USD = X divisa), el mínimo, el máximo, el operador y la ciudad\n4. El comprador ve el precio de cada BORB en tu divisa; toma la oferta con su PIN y tus BORB quedan reservados\n5. Adjunta la captura de su pago, el motor la analiza y luego pulsa «He pagado»\n6. Ves su veredicto en la orden, verificas tu cuenta mobile money y liberas: los BORB pasan a su caja\n\n📥 COMPRAR\n1. Elige una oferta e indica lo que quieres: un número de BORB o un importe en la divisa que prefieras — el precio pasa por USD\n2. Confirma con tu PIN: los BORB del vendedor quedan reservados\n3. Paga el número de mobile money mostrado\n4. Añade la captura (o foto) de tu pago completando número, divisa, importe y nombre del titular\n5. El motor lee la imagen: conforme → se activa «He pagado»; duda → puedes continuar marcando «Asumo la duda» y el vendedor verá esa declaración\n6. El vendedor verifica y libera: los BORB llegan a tu caja, vendibles en Trading y convertibles en divisa virtual para transferir\n\n🔎 Cada prueba se analiza (metadatos, rastros de imagen generada por IA, coherencia de importe y divisa); como vendedor puedes adjuntar tu propio recibo.\n🧠 El motor aprende de cada resultado: los casos confirmados y las disputas recalibran sus umbrales.\n💬 Se crea automáticamente un grupo privado «P2P divisa #número» para seguir la orden.\n🔒 No puedes tomar tu propia oferta. Una cancelación libera los fondos reservados; tras un pago anunciado la orden queda marcada como disputa.',
        suggestions: ['¿Cómo vender BORB?', '¿Cómo revisar el mercado rápido?', '¿Qué divisas puedo usar?', '¿Cómo verificar mi identidad?'],
      },
      sw: {
        title: 'Kununua na kuuza kwenye P2P ya mobile money',
        content:
          'P2P ya mobile money ni kwa kuuzia BORB kwa mobile money kati ya watumiaji. Msingi wa soko ni 1 BORB = 1 USD.\n\n📤 KUUZA (kuchapisha ofa)\n1. Profaili yako lazima iwe na namba yako ya mobile money, vinginevyo ofa inakataliwa\n2. Trading → P2P ya mobile money → Chapisha ofa\n3. Chagua Uuzaji, sarafu ya kupokea, kiwango chako cha ndani (1 USD = X sarafu), kiwango cha chini, cha juu, opereta na mji\n4. Mnunuzi anaona bei ya kila BORB katika sarafu yako; anachukua ofa kwa PIN yake na BORB zako zinazuiliwa\n5. Anambatiza picha ya malipo yake, injini haiichambua, kisha anabofya «Nimelipa»\n6. Unaona uamuzi wake kwenye order, unathibitisha akaunti yako ya mobile money, kisha unaachilia: BORB huingia kwenye sanduku lake\n\n📥 KUNUNUA\n1. Chagua ofa na uandikishe unachotaka: idadi ya BORB, au kiasi katika sarafu yoyote — bei hupita kwa USD\n2. Thibitisha kwa PIN yako: BORB za muuzaji zinazuiliwa\n3. Lipa namba ya mobile money inayoonyeshwa\n4. Ongeza picha (au foto) ya malipo yako ukijaza namba, sarafu, kiasi na jina la mmiliki\n5. Injini husoma picha: ikiwa ni sawa → «Nimelipa» hufunguka; ikiwa na shaka → unaweza kuendelea kwa kutia tiki «Nakubali shaka», na muuzaji anaona tangazo hilo\n6. Muuzaji anathibitisha kisha anaachilia: BORB hufika kwenye sanduku lako, zinazoweza kuuzwa kwenye Trading na kubadilishwa kwa sarafu ya kielektroniki ili kutuma\n\n🔎 Kila ushahidi huchambuliwa (metadata, alama za picha iliyotengenezwa na IA, uwiano wa kiasi na sarafu); kama muuzaji unaweza kumbatiza risiti yako.\n🧠 Injini hujifunza kwa kila matokeo: visa vilivyothibitishwa na migogoro hurekebisha viwango vyake.\n💬 Kikundi cha faragha «P2P sarafu #namba» kinaundwa kiotomatiki kufuatilia order.\n🔒 Hauwezi kuchukua ofa yako mwenyewe. Kughairi huachilia fedha zilizozuiwa; baada ya malipo kutangazwa, order huwekwa alama ya mghogoro.',
        suggestions: ['Jinsi ya kuuza BORB?', 'Jinsi ya kuangalia soko haraka?', 'Sarafu zipi naweza kutumia?', 'Jinsi ya kuthibitisha utambulisho?'],
      },
    }
  ),

  MANUAL(
    'topic_borb_p2p',
    'topic',
    al(
      ['vendre du borb en p2p', 'vendre les borb dans p2p', 'vendre borb en p2p', 'comment vendre du borb en p2p', 'peut on vendre du borb en p2p', 'je veux vendre mon borb en p2p', 'acheter du borb en p2p', 'borb p2p', 'p2p borb', 'mettre du borb en p2p', 'echanger du borb contre du mobile money'],
      ['sell borb on p2p', 'sell borb in p2p', 'buy borb on p2p', 'how to sell borb on p2p', 'how to sell borb in p2p', 'can i sell borb on p2p', 'borb p2p', 'p2p borb', 'exchange borb for mobile money'],
      ['vender borb en p2p', 'comprar borb en p2p', 'como vender borb en p2p', 'se puede vender borb en p2p', 'borb p2p', 'p2p borb', 'cambiar borb por mobile money'],
      ['kuuza borb kwenye p2p', 'kununua borb kwenye p2p', 'jinsi ya kuuza borb kwenye p2p', 'jinsi ya kununua borb kwenye p2p', 'naweza kuuza borb p2p', 'borb p2p', 'p2p borb', 'kubadilisha borb na mobile money']
    ),
    {
      fr: {
        title: 'Vendre du BORB en P2P ?',
        content:
          "Non — le BORB ne se vend pas en P2P. Ce n'est pas une devise : c'est ta réserve de sécurité, et le P2P comme le Trading refusent le BORB (et le BORB).\n\nLa bonne séquence :\n1. Ouvre ton Coffre → « Réserve de sécurité (BORB) »\n2. Appuie sur « Échanger ma réserve »\n3. Choisis la devise de sortie et le montant, puis confirme avec ton PIN\n4. La devise apparaît dans « Mes devises »\n5. Vends cette devise en P2P mobile (ou sur le marché)\n\n⚠️ Aucun envoi direct de BORB n'est possible. Ce qui circule, c'est toujours la devise convertie.",
        suggestions: ['Comment échanger ma réserve ?', 'Comment vendre en P2P ?', "C'est quoi le BORB ?", 'Comment trader sur UQ ?'],
      },
      en: {
        title: 'Selling BORB on P2P?',
        content:
          "No — BORB cannot be sold on P2P. It is not a currency: it is your security reserve, and both P2P and Trading reject BORB (and BORB).\n\nThe right sequence:\n1. Open your Vault → “Security reserve (BORB)”\n2. Tap “Exchange my reserve”\n3. Pick the output currency and the amount, then confirm with your PIN\n4. The currency appears in “My currencies”\n5. Sell that currency on mobile P2P (or on the market)\n\n⚠️ BORB cannot be sent directly. What moves is always the converted currency.",
        suggestions: ['How to exchange my reserve?', 'How to sell on P2P?', 'What is BORB?', 'How to trade on UQ?'],
      },
      es: {
        title: '¿Vender BORB en P2P?',
        content:
          'No — el BORB no se vende en P2P. No es una divisa: es tu reserva de seguridad, y tanto el P2P como el Trading rechazan el BORB (y el BORB).\n\nLa secuencia correcta:\n1. Abre tu Caja → «Reserva de seguridad (BORB)»\n2. Pulsa «Cambiar mi reserva»\n3. Elige la divisa de salida y el importe, luego confirma con tu PIN\n4. La divisa aparece en «Mis divisas»\n5. Vende esa divisa en P2P móvil (o en el mercado)\n\n⚠️ No se puede enviar BORB directamente. Lo que circula es siempre la divisa convertida.',
        suggestions: ['¿Cómo cambiar mi reserva?', '¿Cómo vender en P2P?', '¿Qué es el BORB?', '¿Cómo hacer trading en UQ?'],
      },
      sw: {
        title: 'Kuuza BORB kwenye P2P?',
        content:
          'Hapana — BORB hauzwi kwenye P2P. Si sarafu: ni akiba yako ya usalama, na P2P pamoja na Trading zinakataa BORB (na BORB).\n\nMfululizo sahihi:\n1. Fungua Sanduku lako → «Akiba ya usalama (BORB)»\n2. Bofya «Badilisha akiba yangu»\n3. Chagua sarafu ya kutoka na kiasi, kisha thibitisha kwa PIN yako\n4. Sarafu inaonekana kwenye «Sarafu zangu»\n5. Uza sarafu hiyo kwenye P2P ya mobile money (au sokoni)\n\n⚠️ BORB haiwezi kutumwa moja kwa moja. Kinachozunguka ni sarafu iliyobadilishwa kila mara.',
        suggestions: ['Jinsi ya kubadilisha akiba yangu?', 'Jinsi ya kuuza P2P?', 'BORB ni nini?', 'Jinsi ya kufanya trading UQ?'],
      },
    }
  ),

  MANUAL(
    'topic_zando_create',
    'topic',
    al(
      ['comment creer un element', 'comment creer un element zando', 'creer un element', 'creer un element zando', 'comment creer un article', 'comment creer un produit', 'creer une offre', 'comment creer une offre', 'comment publier une offre', 'publier un produit', 'mettre un produit en vente', 'comment mettre un produit en vente', 'vendre un produit', 'vendre un service', 'comment creer une annonce', 'creer une boutique'],
      ['how to create an item', 'how to create an item on zando', 'create an item', 'how do i create an item', 'create an offer', 'how to create an offer', 'how to publish an offer', 'publish a product', 'put a product for sale', 'how to put a product for sale', 'sell a product', 'sell a service', 'how to create a listing'],
      ['como crear un elemento', 'como crear un elemento en zando', 'crear un elemento', 'como creo un elemento', 'crear una oferta', 'como crear una oferta', 'como publicar una oferta', 'publicar un producto', 'poner un producto en venta', 'como poner un producto en venta', 'vender un producto', 'vender un servicio', 'como crear un anuncio'],
      ['jinsi ya kuunda kipengee', 'jinsi ya kuunda kipengee zando', 'unda kipengee', 'unda ofa', 'jinsi ya kuunda ofa', 'jinsi ya kuchapisha ofa', 'chapisha bidhaa', 'weka bidhaa kwa mauzo', 'jinsi ya kuweka bidhaa kwa mauzo', 'uza bidhaa', 'uza huduma', 'jinsi ya kuunda tangazo']
    ),
    {
      fr: {
        title: 'Créer un élément sur Zando',
        content:
          "Depuis le Studio UQ :\n\n1️⃣ Format et catégorie\n• Choisis un format dans la liste officielle\n• Choisis une catégorie existante, ou crée la tienne (2 caractères minimum)\n\n2️⃣ Détails\n• Titre obligatoire (au moins 3 caractères)\n• Description : état, détails, lieu de remise\n• Photo : importe une image (compressée automatiquement) ou colle une URL\n\n3️⃣ Prix\n• Saisis le prix dans ta devise d'affichage\n• Laisse « Publier immédiatement dans le marché » coché, ou décoche-le pour enregistrer un brouillon\n• Appuie sur « Publier l'offre » : ton code PIN est demandé\n\n✅ Un brouillon se publie plus tard depuis « Mes publications » (badge brouillon → Publier, PIN requis).\n💡 Un élément en ligne apparaît aussitôt dans le Marché Zando.",
        suggestions: ['Comment publier un contenu lecteur ?', 'Comment vendre en P2P ?', 'Comment vérifier mon identité ?', 'Comment repérer le marché vite ?'],
      },
      en: {
        title: 'Creating an item on Zando',
        content:
          "From the UQ Studio:\n\n1️⃣ Format and category\n• Pick a format from the official list\n• Pick an existing category, or create your own (at least 2 characters)\n\n2️⃣ Details\n• Title is required (at least 3 characters)\n• Description: condition, details, pickup location\n• Photo: import an image (compressed automatically) or paste a URL\n\n3️⃣ Price\n• Enter the price in your display currency\n• Keep “Publish immediately in the market” checked, or uncheck it to save a draft\n• Tap “Publish the offer”: your PIN is required\n\n✅ A draft can be published later from “My publications” (draft badge → Publish, PIN required).\n💡 A live item appears right away in the Zando Market.",
        suggestions: ['How to publish reader content?', 'How to sell on P2P?', 'How to verify my identity?', 'How to scan the market quickly?'],
      },
      es: {
        title: 'Crear un elemento en Zando',
        content:
          'Desde el Studio UQ:\n\n1️⃣ Formato y categoría\n• Elige un formato de la lista oficial\n• Elige una categoría existente o crea la tuya (mínimo 2 caracteres)\n\n2️⃣ Detalles\n• Título obligatorio (mínimo 3 caracteres)\n• Descripción: estado, detalles, lugar de entrega\n• Foto: importa una imagen (comprimida automáticamente) o pega una URL\n\n3️⃣ Precio\n• Indica el precio en tu divisa de visualización\n• Deja «Publicar de inmediato en el mercado» marcado, o desmárcalo para guardar un borrador\n• Pulsa «Publicar la oferta»: se pide tu PIN\n\n✅ Un borrador se publica más tarde desde «Mis publicaciones» (insignia borrador → Publicar, PIN requerido).\n💡 Un elemento publicado aparece enseguida en el Mercado Zando.',
        suggestions: ['¿Cómo publicar un contenido lector?', '¿Cómo vender en P2P?', '¿Cómo verificar mi identidad?', '¿Cómo revisar el mercado rápido?'],
      },
      sw: {
        title: 'Kuunda kipengee kwenye Zando',
        content:
          'Kutoka Studio UQ:\n\n1️⃣ Muundo na kategoria\n• Chagua muundo kwenye orodha rasmi\n• Chagua kategoria iliyopo, au unda yako (angalau herufi 2)\n\n2️⃣ Maelezo\n• Kichwa kinahitajika (angalau herufi 3)\n• Maelezo: hali, maelezo, mahali pa kukabidhi\n• Picha: ingiza picha (inabanishwa kiotomatiki) au bandika URL\n\n3️⃣ Bei\n• Weka bei kwa sarafu yako ya kuonyesha\n• Acha «Chapisha mara moja sokoni» imetiwa tiki, au iondoe ili kuhifadhi rasimu\n• Bofya «Chapisha ofa»: PIN yako inahitajika\n\n✅ Rasimu inachapishwa baadaye kutoka «Machapisho yangu» (beji ya rasimu → Chapisha, PIN inahitajika).\n💡 Kipengee kilichochapishwa huonekana mara moja kwenye Soko la Zando.',
        suggestions: ['Jinsi ya kuchapisha maudhui ya msomaji?', 'Jinsi ya kuuza P2P?', 'Jinsi ya kuthibitisha utambulisho?', 'Jinsi ya kuangalia soko haraka?'],
      },
    }
  ),

  MANUAL(
    'topic_zando_reader',
    'topic',
    al(
      ['publier un contenu lecteur', 'creer un contenu lecteur', 'comment publier un contenu', 'vendre un contenu', 'comment vendre un contenu', 'facturer a la seconde', 'combien facturer ma musique', 'publier une video payante', 'publier de la musique payante', 'comment vendre ma musique', 'contenu payant a la seconde', 'publier un lien payant'],
      ['publish reader content', 'create reader content', 'how to publish a paid content', 'sell content', 'bill by the second', 'how much to charge for my music', 'publish paid video', 'publish paid music', 'how to sell my music', 'paid content per second'],
      ['publicar contenido lector', 'crear contenido lector', 'como publicar un contenido de pago', 'vender contenido', 'facturar por segundo', 'cuanto cobrar por mi musica', 'publicar video de pago', 'publicar musica de pago', 'como vender mi musica', 'contenido de pago por segundo'],
      ['chapisha maudhui ya msomaji', 'unda maudhui ya msomaji', 'jinsi ya kuchapisha maudhui ya malipo', 'uza maudhui', 'toza kwa sekunde', 'nitozwe kiasi gani kwa muziki wangu', 'chapisha video ya malipo', 'chapisha muziki wa malipo', 'jinsi ya kuuza muziki wangu', 'maudhui ya malipo kwa sekunde']
    ),
    {
      fr: {
        title: 'Publier un contenu lecteur',
        content:
          "Le contenu lecteur se vend au temps de lecture :\n\n1️⃣ Contenu\n• Format, titre, description\n• Lien du contenu : adresse externe commençant par http(s)://\n• Photo de couverture (optionnelle) et catégorie (optionnelle)\n\n2️⃣ Tarif\n• Prix par seconde, dans ta devise d'affichage\n• « Publier immédiatement dans le flux » ou enregistrer un brouillon\n• Confirme avec ton code PIN\n\n✅ Côté lecteur, l'offre affiche « Lire ce contenu · X/s ».\n💡 Le lecteur paie à la seconde : un contenu court et utile se consomme plus facilement.",
        suggestions: ['Comment créer un élément ?', 'Comment gérer mes publications ?', 'Comment vendre en P2P ?', 'Comment vérifier mon identité ?'],
      },
      en: {
        title: 'Publishing reader content',
        content:
          "Reader content is sold by reading time:\n\n1️⃣ Content\n• Format, title, description\n• Content link: external address starting with http(s)://\n• Cover image (optional) and category (optional)\n\n2️⃣ Pricing\n• Price per second, in your display currency\n• “Publish immediately in the feed” or save a draft\n• Confirm with your PIN\n\n✅ On the reader side, the offer shows “Play this content · X/s”.\n💡 Readers pay by the second: short, useful content is easier to consume.",
        suggestions: ['How to create an item?', 'How to manage my publications?', 'How to sell on P2P?', 'How to verify my identity?'],
      },
      es: {
        title: 'Publicar un contenido lector',
        content:
          'El contenido lector se vende por tiempo de lectura:\n\n1️⃣ Contenido\n• Formato, título, descripción\n• Enlace del contenido: dirección externa que empiece por http(s)://\n• Imagen de portada (opcional) y categoría (opcional)\n\n2️⃣ Tarifa\n• Precio por segundo, en tu divisa de visualización\n• «Publicar de inmediato en el feed» o guardar un borrador\n• Confirma con tu PIN\n\n✅ Del lado del lector, la oferta muestra «Leer este contenido · X/s».\n💡 El lector paga por segundo: un contenido breve y útil se consume mejor.',
        suggestions: ['¿Cómo crear un elemento?', '¿Cómo gestionar mis publicaciones?', '¿Cómo vender en P2P?', '¿Cómo verificar mi identidad?'],
      },
      sw: {
        title: 'Kuchapisha maudhui ya msomaji',
        content:
          'Maudhui ya msomaji yanauzwa kwa muda wa kusoma:\n\n1️⃣ Maudhui\n• Muundo, kichwa, maelezo\n• Kiungo cha maudhui: anwani ya nje inayoanza na http(s)://\n• Picha ya jalada (si lazima) na kategoria (si lazima)\n\n2️⃣ Bei\n• Bei kwa sekunde, kwa sarafu yako ya kuonyesha\n• «Chapisha mara moja kwenye mtiririko» au hifadhi rasimu\n• Thibitisha kwa PIN yako\n\n✅ Kwa upande wa msomaji, ofa inaonyesha «Soma maudhui haya · X/s».\n💡 Msomaji hulipa kwa sekunde: maudhui mafupi na yenye manufaa yanatumika kwa urahisi.',
        suggestions: ['Jinsi ya kuunda kipengee?', 'Jinsi ya kusimamia machapisho yangu?', 'Jinsi ya kuuza P2P?', 'Jinsi ya kuthibitisha utambulisho?'],
      },
    }
  ),

  MANUAL(
    'topic_level_up',
    'topic',
    al(
      ['comment etre au niveau eleve', 'etre au niveau eleve', 'comment monter de niveau', 'monter de niveau', 'comment passer au niveau superieur', 'niveau superieur', 'comment augmenter mon niveau', 'comment etre verifie', 'verifier mon compte', 'comment verifier mon identite', 'verifier mon identite', 'comment devenir marketer', 'devenir marketer', 'debloquer mon coffre', 'comment debloquer le coffre', 'comment debloquer les plafonds', 'comment augmenter mes plafonds'],
      ['how to level up', 'level up', 'reach a higher level', 'how to increase my level', 'how to get verified', 'verify my account', 'how to verify my identity', 'verify my identity', 'how to become a marketer', 'become a marketer', 'unlock my vault', 'how to unlock the vault', 'how to increase my limits'],
      ['como subir de nivel', 'subir de nivel', 'llegar a un nivel alto', 'como aumentar mi nivel', 'como verificarme', 'verificar mi cuenta', 'como verificar mi identidad', 'verificar mi identidad', 'como ser marketer', 'ser marketer', 'desbloquear mi caja', 'como desbloquear la caja', 'como aumentar mis limites'],
      ['jinsi ya kupanda ngazi', 'kupanda ngazi', 'kufikia ngazi ya juu', 'jinsi ya kuongeza ngazi yangu', 'jinsi ya kuthibitishwa', 'thibitisha akaunti yangu', 'jinsi ya kuthibitisha utambulisho', 'thibitisha utambulisho', 'jinsi ya kuwa marketer', 'kuwa marketer', 'kufungua sanduku langu', 'jinsi ya kufungua sanduku', 'jinsi ya kuongeza mipaka yangu']
    ),
    {
      fr: {
        title: 'Monter de niveau sur UQ',
        content:
          "Le niveau le plus élevé accessible aujourd'hui, c'est un compte vérifié avec un coffre déverrouillé.\n\nLa marche à suivre :\n1. 👤 Profil complet : pseudo, numéro mobile money et opérateur (obligatoires pour le P2P)\n2. 🔐 Code PIN configuré : demandé pour trader, publier, convertir et prendre une offre\n3. 🪪 Vérification : dépose ton dossier d'identité (nom, prénom, date de naissance, pays, adresse, téléphone, numéro de pièce, photo nette ; vidéo de vivacité facultative, moins de 1,2 Mo)\n4. ⏳ Attends la décision : le statut passe de « non vérifiée » à « en cours d'examen », puis « vérifiée »\n5. 🔓 « Déverrouiller mon coffre » : valide l'intégrité du dossier, ouvre le coffre et prépare ta clé locale\n\n✅ Une identité vérifiée débloque le coffre et les plafonds.\n📈 Ensuite, fais vivre ton compte : offre Zando en ligne, interactions, historique de commandes.\nℹ️ Aucun badge de niveau chiffré n'est affiché dans l'application aujourd'hui.\nℹ️ Le statut Marketer n'est pas encore ouvert : aucun écran ne permet de le demander.\n\n💡 En trading, il n'y a pas de niveau non plus : commence petit, lis le marché et ne mise que ce que tu peux perdre.",
        suggestions: ['Comment vérifier mon identité ?', 'Comment créer un élément ?', 'Comment trader sur UQ ?', 'Comment sécuriser mon compte ?'],
      },
      en: {
        title: 'Leveling up on UQ',
        content:
          "The highest level available today is a verified account with an unlocked vault.\n\nThe path:\n1. 👤 Complete profile: username, mobile money number and operator (required for P2P)\n2. 🔐 PIN configured: required to trade, publish, convert and take an offer\n3. 🪪 Verification: submit your identity file (first name, last name, date of birth, country, address, phone, document number, a sharp photo; optional liveness video under 1.2 MB)\n4. ⏳ Wait for the decision: the status moves from “not verified” to “under review”, then “verified”\n5. 🔓 “Unlock my vault”: checks the file integrity, opens the vault and prepares your local key\n\n✅ A verified identity unlocks the vault and the limits.\n📈 Then keep the account active: a live Zando offer, interactions, order history.\nℹ️ No numeric level badge is displayed in the app today.\nℹ️ The Marketer status is not open yet: no screen allows you to request it.\n\n💡 Trading has no levels either: start small, read the market and only risk what you can lose.",
        suggestions: ['How to verify my identity?', 'How to create an item?', 'How to trade on UQ?', 'How to secure my account?'],
      },
      es: {
        title: 'Subir de nivel en UQ',
        content:
          'El nivel más alto disponible hoy es una cuenta verificada con la caja desbloqueada.\n\nEl camino:\n1. 👤 Perfil completo: usuario, número de mobile money y operador (obligatorios para el P2P)\n2. 🔐 PIN configurado: se pide para operar, publicar, convertir y tomar una oferta\n3. 🪪 Verificación: envía tu expediente de identidad (nombre, apellido, fecha de nacimiento, país, dirección, teléfono, número de documento, foto nítida; vídeo de vivacidad opcional de menos de 1,2 MB)\n4. ⏳ Espera la decisión: el estado pasa de «no verificada» a «en revisión» y luego «verificada»\n5. 🔓 «Desbloquear mi caja»: valida la integridad del expediente, abre la caja y prepara tu clave local\n\n✅ Una identidad verificada desbloquea la caja y los límites.\n📈 Después, mantén la cuenta activa: oferta Zando publicada, interacciones, historial de órdenes.\nℹ️ Hoy no se muestra ninguna insignia de nivel numérico en la aplicación.\nℹ️ El estado Marketer aún no está abierto: ninguna pantalla permite solicitarlo.\n\n💡 En trading tampoco hay niveles: empieza pequeño, lee el mercado y arriesga solo lo que puedas perder.',
        suggestions: ['¿Cómo verificar mi identidad?', '¿Cómo crear un elemento?', '¿Cómo hacer trading en UQ?', '¿Cómo proteger mi cuenta?'],
      },
      sw: {
        title: 'Kupanda ngazi kwenye UQ',
        content:
          'Ngazi ya juu inayopatikana leo ni akaunti iliyothibitishwa na sanduku lililofunguliwa.\n\nNjia:\n1. 👤 Profaili kamili: jina la mtumiaji, namba ya mobile money na opereta (lazima kwa P2P)\n2. 🔐 PIN imewekwa: inahitajika kufanya trading, kuchapisha, kubadilisha na kuchukua ofa\n3. 🪪 Uthibitisho: wasilisha jalada lako la utambulisho (jina la kwanza, jina la mwisho, tarehe ya kuzaliwa, nchi, anwani, simu, namba ya hati, picha safi; video ya uhai ya hiari chini ya MB 1.2)\n4. ⏳ Subiri uamuzi: hali inabadilika kutoka «haijathibitishwa» hadi «inakaguliwa», kisha «imethibitishwa»\n5. 🔓 «Fungua sanduku langu»: huthibitisha uadilifu wa jalada, hufungua sanduku na huandaa ufunguo wako wa ndani\n\n✅ Utambulisho uliothibitishwa hufungua sanduku na mipaka.\n📈 Kisha, endeleza akaunti: ofa ya Zando hewani, mwingiliano, historia ya order.\nℹ️ Hakuna beji ya ngazi ya namba inayoonyeshwa kwenye programu leo.\nℹ️ Hali ya Marketer bado haijafunguliwa: hakuna skrini inayoruhusu kuiomba.\n\n💡 Kwenye trading pia hakuna ngazi: anza kidogo, soma soko na hatarisha kile tu unachoweza kupoteza.',
        suggestions: ['Jinsi ya kuthibitisha utambulisho?', 'Jinsi ya kuunda kipengee?', 'Jinsi ya kufanya trading UQ?', 'Jinsi ya kulinda akaunti yangu?'],
      },
    }
  ),
];

// ============================================================================
// 4. LANGUE DE LA QUESTION
// ============================================================================

export const LANGUAGE_HINTS: Record<Lang, string[]> = {
  fr: [
    'bonjour', 'salut', 'bonsoir', 'coucou', 'merci', 'comment', 'combien', 'pourquoi',
    'quand', 'quelle', 'quel', 'est ce que', 'qu est ce que', 'c est quoi', 'keske', 'koi', 'je veux',
    'je voudrais', 'je peux', 'peux tu', 'pouvez vous', 'aidez moi', 'aide moi',
    's il te plait', 's il vous plait', 'svp', 'stp', 'mon compte', 'ma cle', 'mon argent',
    'mes borb', 'le borb', 'la securite', 'securiser', 'gagner', 'acheter', 'vendre',
    'epargner', 'rembourser', 'pret', 'frais', 'arnaque', 'fiable', 'perdu', 'oublie',
    'vole', 'telephone', 'mot de passe', 'cle privee', 'numero', 'connexion',
    'connecter', 'inscrire', 'creer un compte', 'supprimer', 'changer', 'combien vaut',
    'c est', 'j ai', 'je n ai', 'n est', 'dans', 'pour', 'avec', 'sans', 'sur', 'une',
    'des', 'les', 'est', 'sont', 'qui', 'que', 'quoi', 'dont', 'tres', 'bien', 'trop',
    'aussi', 'reponds', 'explique', 'comprends', 'besoin', 'aider',
  ],
  en: [
    'hello', 'hi', 'hey', 'thanks', 'thank you', 'how', 'how much', 'how many', 'what',
    'what is', 'why', 'when', 'where', 'can i', 'can you', 'i want', 'i need', 'i lost',
    'my account', 'my key', 'my money', 'my borb', 'the borb', 'security', 'secure',
    'earn', 'buy', 'sell', 'save', 'repay', 'loan', 'fees', 'scam', 'trust', 'lost',
    'forgot', 'stolen', 'phone', 'password', 'private key', 'number', 'login', 'sign in',
    'register', 'create account', 'delete', 'change', 'the', 'and', 'is', 'are', 'do',
    'does', 'i', 'you', 'we', 'they', 'my', 'your', 'please', 'explain', 'help', 'need',
  ],
  es: [
    'hola', 'buenas', 'gracias', 'como', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'que',
    'por que', 'cuando', 'donde', 'puedo', 'quiero', 'necesito', 'perdi', 'mi cuenta',
    'mi clave', 'mi dinero', 'mis borb', 'el borb', 'seguridad', 'proteger', 'ganar',
    'comprar', 'vender', 'ahorrar', 'pagar', 'prestamo', 'comisiones', 'estafa',
    'confiable', 'olvide', 'robado', 'telefono', 'contrasena', 'clave privada', 'numero',
    'iniciar sesion', 'entrar', 'registrar', 'crear cuenta', 'eliminar', 'cambiar', 'el',
    'la', 'los', 'las', 'de', 'del', 'para', 'con', 'sin', 'es', 'son', 'y', 'por',
    'favor', 'ayuda', 'explica', 'entiendo', 'quiero',
  ],
  sw: [
    'habari', 'mambo', 'jambo', 'asante', 'nini', 'jinsi', 'gani', 'vipi', 'wapi',
    'lini', 'kwanini', 'kwa nini', 'ninaweza', 'unaweza', 'nataka', 'unataka', 'nimepoteza',
    'nimesahau', 'akaunti', 'ufunguo', 'pesa', 'fedha', 'sarafu', 'usalama', 'linda',
    'kupata', 'nunua', 'uza', 'weka akiba', 'lipa', 'mkopo', 'ada', 'utapeli',
    'kuaminika', 'simu', 'neno la siri', 'ufunguo wa siri', 'namba', 'kuingia', 'ingia',
    'jisajili', 'fungua akaunti', 'futa', 'badilisha', 'ni', 'na', 'ya', 'wa', 'za',
    'kwa', 'katika', 'kama', 'hii', 'hiyo', 'tafadhali', 'nisaidie', 'eleza', 'sielewi',
  ],
};

export const STOPWORDS: Record<Lang, string[]> = {
  fr: [
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux', 'et', 'ou', 'mais',
    'si', 'que', 'qui', 'quoi', 'dont', 'a', 'en', 'y', 'pour', 'par', 'avec', 'sans',
    'sur', 'sous', 'dans', 'chez', 'vers', 'entre', 'est', 'sont', 'etre', 'ai', 'as',
    'avons', 'avez', 'ont', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils',
    'elles', 'me', 'te', 'se', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa',
    'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'ce', 'cet', 'cette', 'ces',
    'comment', 'combien', 'pourquoi', 'quand', 'quel', 'quelle', 'quels', 'quelles',
    'svp', 'stp', 'please', 'merci', 'bonjour', 'salut', 'bonsoir', 'coucou', 'hello',
    'hey', 'ok', 'okay', 'd accord', 'oui', 'non', 'bien', 'tres', 'trop', 'aussi',
    'plus', 'moins', 'peu', 'beaucoup', 'alors', 'donc', 'car', 'comme', 'tout', 'tous',
    'toute', 'toutes', 'fait', 'faire', 'peux', 'peut', 'pouvoir', 'veux', 'veut',
    'vouloir', 'voudrais', 'aimerais', 'aider', 'aide', 'savoir', 'sais', 'dit', 'dire',
    'parle', 'parler', 'reponds', 'repondre', 'uq', 'app', 'application',
  ],
  en: [
    'the', 'a', 'an', 'of', 'to', 'for', 'how', 'what', 'is', 'are', 'am', 'was', 'were',
    'be', 'been', 'being', 'do', 'does', 'did', 'can', 'could', 'should', 'would',
    'will', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'my', 'your', 'his',
    'her', 'its', 'our', 'their', 'and', 'or', 'but', 'if', 'in', 'on', 'at', 'by',
    'with', 'without', 'from', 'about', 'this', 'that', 'these', 'those', 'there',
    'here', 'please', 'thanks', 'thank', 'hi', 'hello', 'hey', 'ok', 'okay', 'yes',
    'no', 'so', 'much', 'many', 'very', 'too', 'also', 'just', 'really', 'want',
    'need', 'help', 'tell', 'explain', 'know', 'get', 'got', 'make', 'made', 'use',
    'using', 'work', 'works', 'working', 'uq', 'app', 'application',
  ],
  es: [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en',
    'y', 'o', 'pero', 'si', 'que', 'quien', 'quienes', 'como', 'cuanto', 'cuanta',
    'cuantos', 'cuantas', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta',
    'desde', 'es', 'son', 'esta', 'estan', 'ser', 'estar', 'soy', 'eres', 'somos',
    'tengo', 'tienes', 'tiene', 'tenemos', 'puedo', 'puedes', 'puede', 'podemos',
    'quiero', 'quieres', 'quiere', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro',
    'nuestra', 'me', 'te', 'se', 'nos', 'os', 'lo', 'le', 'les', 'yo', 'ella',
    'nosotros', 'vosotros', 'ellos', 'ellas', 'por favor', 'gracias', 'hola', 'buenas',
    'buenos', 'dias', 'tardes', 'noches', 'ok', 'vale', 'si', 'no', 'muy', 'mas',
    'menos', 'tambien', 'solo', 'todo', 'todos', 'toda', 'todas', 'favor', 'ayuda',
    'ayudame', 'explicame', 'dime', 'saber', 'sabes', 'necesito', 'uq', 'app',
  ],
  sw: [
    'ni', 'na', 'ya', 'wa', 'za', 'la', 'kwa', 'katika', 'juu', 'chini', 'au', 'lakini',
    'kama', 'hivyo', 'hii', 'hiyo', 'huyu', 'hawa', 'mimi', 'wewe', 'yeye', 'sisi',
    'nyinyi', 'wao', 'wangu', 'yako', 'yake', 'yetu', 'yenu', 'yao', 'naweza',
    'unaweza', 'anaweza', 'tunaweza', 'nataka', 'unataka', 'anataka', 'tunataka',
    'nina', 'una', 'ana', 'tuna', 'wana', 'kuwa', 'kufanya', 'fanya', 'kupata', 'pata',
    'kutoa', 'toa', 'kuuliza', 'uliza', 'tafadhali', 'asante', 'habari', 'mambo',
    'jambo', 'karibu', 'sawa', 'ndiyo', 'hapana', 'vizuri', 'sana', 'kidogo', 'zaidi',
    'pia', 'hata', 'bado', 'sasa', 'kisha', 'basi', 'je', 'gani', 'nini', 'vipi',
    'wapi', 'lini', 'kwanini', 'kwa nini', 'si', 'tu', 'hapa', 'pale', 'huko',
    'kwenye', 'kutoka', 'mpaka', 'bila', 'ndani', 'nje', 'uq', 'app',
  ],
};

export const OFF_TOPIC_HINTS: Record<Lang, string[]> = {
  fr: [
    'meteo', 'weather', 'football', 'foot', 'match', 'president', 'politique',
    'election', 'guerre', 'recette', 'cuisine', 'blague', 'horoscope', 'film', 'serie',
    'acteur', 'chanteur', 'amour', 'mariage', 'religion', 'priere', 'loterie', 'loto',
    'bourse de paris', 'resultat du match', 'capitale', 'coupe du monde', 'presidentielle',
  ],
  en: [
    'weather', 'football', 'soccer', 'basketball', 'president', 'politics', 'election',
    'war', 'recipe', 'cooking', 'joke', 'horoscope', 'movie', 'series', 'actor',
    'singer', 'love', 'marriage', 'religion', 'prayer', 'lottery', 'stock market',
    'game result', 'capital city', 'world cup', 'who won',
  ],
  es: [
    'clima', 'tiempo', 'futbol', 'partido', 'presidente', 'politica', 'eleccion',
    'guerra', 'receta', 'cocina', 'chiste', 'horoscopo', 'pelicula', 'serie', 'actor',
    'cantante', 'amor', 'matrimonio', 'religion', 'oracion', 'loteria', 'bolsa',
    'capital de', 'copa del mundo', 'quien gano',
  ],
  sw: [
    'hali ya hewa', 'mpira', 'soka', 'raisi', 'siasa', 'uchaguzi', 'vita', 'mapishi',
    'utani', 'nyota', 'filamu', 'mwigizaji', 'mwimbaji', 'mapenzi', 'ndoa', 'dini',
    'maombi', 'bahati nasibu', 'matokeo ya mechi', 'mji mkuu', 'kombe la dunia',
  ],
};

export const LANG_NAMES: Record<Lang, Record<Lang, string>> = {
  fr: { fr: 'français', en: 'anglais', es: 'espagnol', sw: 'kiswahili' },
  en: { fr: 'French', en: 'English', es: 'Spanish', sw: 'Swahili' },
  es: { fr: 'francés', en: 'inglés', es: 'español', sw: 'suajili' },
  sw: { fr: 'Kifaransa', en: 'Kiingereza', es: 'Kihispania', sw: 'Kiswahili' },
};

// ============================================================================
// 5. PHRASES DE RAISONNEMENT ET DE RÉPONSE
// ============================================================================

export interface LangPhrases {
  ambiguous: string;
  lowConfidence: string;
  noMatchTitle: string;
  noMatch: string;
  offTopicTitle: string;
  offTopic: string;
  translationNote: string;
  offer: string;
  thinking: string[];
}

export const PHRASES: Record<Lang, LangPhrases> = {
  fr: {
    ambiguous: 'Je pense que tu parles de « {title} ». Voici l’essentiel :',
    lowConfidence: 'Je ne suis pas certain de bien comprendre, mais la piste la plus proche est « {title} » :',
    noMatchTitle: 'Je peux t’aider autrement',
    noMatch:
      'Je n’ai pas trouvé de réponse exacte à « {query} ». Ce n’est pas grave : reformule avec un mot-clé, ou choisis un sujet ci-dessous.\n\nJe comprends aussi les fautes d’orthographe — tu peux écrire naturellement.',
    offTopicTitle: 'Je reste spécialisé sur UQ',
    offTopic:
      'Je suis UQ AI, spécialisé sur l’écosystème UQ. Pour cette question, je ne peux pas te répondre de façon fiable.\n\nEn revanche, je peux t’aider sur : le BORB, la sécurité, les paiements, Zando, l’UBI, l’épargne, le crédit ou le support.',
    translationNote: 'ℹ️ Cette fiche n’est pas encore traduite en {lang}. Voici la version en {answerLang}.',
    offer: '💡 Dis-moi si tu veux un exemple concret ou plus de détails.',
    thinking: ['Je lis ta question…', 'Je cherche la réponse la plus juste…'],
  },
  en: {
    ambiguous: 'I think you mean “{title}”. Here’s the key point:',
    lowConfidence: 'I’m not fully sure I understood, but the closest topic is “{title}”:',
    noMatchTitle: 'Let me help another way',
    noMatch:
      'I couldn’t find an exact answer for “{query}”. No problem: rephrase with a keyword, or pick a topic below.\n\nTypos are fine — write naturally and I’ll do my best.',
    offTopicTitle: 'I stay focused on UQ',
    offTopic:
      'I’m UQ AI, focused on the UQ ecosystem. I can’t answer this one reliably.\n\nWhat I can help with: BORB, security, payments, Zando, UBI, savings, credit or support.',
    translationNote: 'ℹ️ This card isn’t translated into {lang} yet. Here’s the {answerLang} version.',
    offer: '💡 Tell me if you want a concrete example or more detail.',
    thinking: ['Reading your question…', 'Finding the most accurate answer…'],
  },
  es: {
    ambiguous: 'Creo que hablas de «{title}». Esto es lo esencial:',
    lowConfidence: 'No estoy del todo seguro de haber entendido, pero el tema más cercano es «{title}»:',
    noMatchTitle: 'Puedo ayudarte de otra forma',
    noMatch:
      'No encontré una respuesta exacta para «{query}». No pasa nada: reformula con una palabra clave o elige un tema abajo.\n\nLas faltas de ortografía no son problema: escribe con naturalidad.',
    offTopicTitle: 'Me centro en UQ',
    offTopic:
      'Soy UQ AI, especializado en el ecosistema UQ. No puedo responder a esto de forma fiable.\n\nPuedo ayudarte con: BORB, seguridad, pagos, Zando, UBI, ahorro, crédito o soporte.',
    translationNote: 'ℹ️ Esta ficha aún no está traducida al {lang}. Aquí tienes la versión en {answerLang}.',
    offer: '💡 Dime si quieres un ejemplo concreto o más detalles.',
    thinking: ['Leyendo tu pregunta…', 'Buscando la respuesta más precisa…'],
  },
  sw: {
    ambiguous: 'Nadhani unazungumzia «{title}». Hiki ni kitu cha muhimu:',
    lowConfidence: 'Sina uhakika kamili nimekuelewa, lakini mada iliyo karibu zaidi ni «{title}»:',
    noMatchTitle: 'Naweza kukusaidia kwa njia nyingine',
    noMatch:
      'Sikupata jibu kamili kwa «{query}». Hakuna shida: rudia kwa neno muhimu, au chagua mada hapa chini.\n\nMakosa ya maandishi hayana shida — andika kawaida.',
    offTopicTitle: 'Nazingatia UQ',
    offTopic:
      'Mimi ni UQ AI, ninayezingatia mfumo wa UQ. Siwezi kujibu hili kwa uhakika.\n\nNinaweza kukusaidia kuhusu: BORB, usalama, malipo, Zando, UBI, akiba, mkopo au msaada.',
    translationNote: 'ℹ️ Kadi hii bado haijatafsiriwa kwa {lang}. Hii ni toleo la {answerLang}.',
    offer: '💡 Niambie kama unataka mfano halisi au maelezo zaidi.',
    thinking: ['Ninasoma swali lako…', 'Natafuta jibu sahihi zaidi…'],
  },
};

export type Tone = 'definition' | 'howto' | 'money' | 'security' | 'support' | 'default';

export const INTROS: Record<Lang, Record<Tone, string[]>> = {
  fr: {
    definition: ['Bonne question. En clair :', 'Voici l’essentiel à retenir :', 'Je te fais simple :'],
    howto: ['Voici comment faire, simplement :', 'C’est plus simple qu’il n’y paraît :', 'Je t’explique étape par étape :'],
    money: ['Voici les chiffres et le mécanisme :', 'En pratique, ça fonctionne comme ça :', 'Côté argent, voici l’essentiel :'],
    security: ['Ta sécurité passe avant tout. Voici les points clés :', 'Voici comment ton compte est protégé :', 'Côté sécurité, retiens ceci :'],
    support: ['Je t’aide à trouver la bonne solution :', 'Voici la démarche la plus efficace :'],
    default: ['Voici ce que je peux te dire :', 'Bonne question !', 'Je te réponds clairement :'],
  },
  en: {
    definition: ['Good question. In plain terms:', 'Here’s the key point:', 'Let me keep it simple:'],
    howto: ['Here’s how to do it, simply:', 'It’s easier than it looks:', 'Step by step:'],
    money: ['Here are the numbers and the mechanism:', 'In practice, it works like this:', 'Money-wise, here’s the key:'],
    security: ['Your security comes first. Key points:', 'Here’s how your account is protected:', 'Security-wise, remember this:'],
    support: ['Let me help you find the right solution:', 'Here’s the most effective path:'],
    default: ['Here’s what I can tell you:', 'Good question!', 'Let me answer clearly:'],
  },
  es: {
    definition: ['Buena pregunta. En claro:', 'Esto es lo esencial:', 'Te lo explico simple:'],
    howto: ['Así se hace, de forma sencilla:', 'Es más fácil de lo que parece:', 'Paso a paso:'],
    money: ['Estos son los números y el mecanismo:', 'En la práctica funciona así:', 'En lo económico, lo esencial:'],
    security: ['Tu seguridad es lo primero. Puntos clave:', 'Así está protegida tu cuenta:', 'En seguridad, recuerda esto:'],
    support: ['Te ayudo a encontrar la solución adecuada:', 'Este es el camino más eficaz:'],
    default: ['Esto es lo que puedo decirte:', '¡Buena pregunta!', 'Te respondo claro:'],
  },
  sw: {
    definition: ['Swali zuri. Kwa uwazi:', 'Hiki ni kitu cha muhimu:', 'Nikueleze kwa urahisi:'],
    howto: ['Hivi ndivyo unavyofanya, kwa urahisi:', 'Ni rahisi kuliko inavyoonekana:', 'Hatua kwa hatua:'],
    money: ['Hizi ni namba na mfumo:', 'Kivitendo, inafanya kazi hivi:', 'Kuhusu fedha, hiki ni kitu cha muhimu:'],
    security: ['Usalama wako kwanza. Mambo muhimu:', 'Hivi ndivyo akaunti yako inavyolindwa:', 'Kuhusu usalama, kumbuka hili:'],
    support: ['Nakusaidia kupata suluhisho sahihi:', 'Hii ni njia bora zaidi:'],
    default: ['Hiki ndicho ninachoweza kukwambia:', 'Swali zuri!', 'Nakujibu kwa uwazi:'],
  },
};

// ============================================================================
// 6. AIDE AU RAISONNEMENT
// ============================================================================

/** Mots qui indiquent une question de procédure. */
export const HOWTO_HINTS = [
  'comment', 'how', 'como', 'jinsi', 'nifanyeje', 'nifunguaje', 'kuvipi', 'procedure',
  'etape', 'step', 'pasos', 'hatua', 'faire', 'do', 'hacer', 'fanya', 'activer', 'enable',
  'activar', 'wezesha', 'creer', 'create', 'crear', 'fungua', 'envoyer', 'send', 'enviar',
  'tuma', 'vendre', 'sell', 'vender', 'uza', 'acheter', 'buy', 'comprar', 'nunua',
  'reclamer', 'claim', 'reclamar', 'dai', 'connecter', 'login', 'entrar', 'ingia',
  'recuperer', 'recover', 'recuperar', 'rejesha', 'changer', 'change', 'cambiar',
  'badilisha', 'supprimer', 'delete', 'eliminar', 'futa', 'rembourser', 'repay', 'pagar',
  'rejesha',
];

/** Mots qui indiquent une demande de définition. */
export const DEFINITION_HINTS = [
  'c est quoi', 'keske', 'koi', 'qu est ce que', 'what is', 'whats', 'meaning', 'define',
  'explique', 'explain', 'explica', 'ni nini', 'nini', 'kitu gani', 'definition',
  'signifie', 'veut dire', 'means', 'que es', 'para que sirve', 'kazi gani',
];

/** Mots qui indiquent une question d'argent. */
export const MONEY_HINTS = [
  'borb', 'borb', 'argent', 'money', 'dinero', 'pesa', 'prix', 'price', 'precio',
  'bei', 'valeur', 'value', 'valor', 'thamani', 'frais', 'fee', 'fees', 'comision',
  'commission', 'ada', 'gagner', 'earn', 'ganar', 'pata', 'epargne', 'savings',
  'ahorro', 'akiba', 'credit', 'prestamo', 'mkopo', 'ubi', 'bulle', 'bubble',
  'burbuja', 'mapovu', 'tresor', 'treasury', 'tesoro', 'hazina', 'case', 'kesi',
  'rich', 'riche', 'rico', 'tajiri', 'biashara',
];

/** Mots qui indiquent une question de sécurité. */
export const SECURITY_HINTS = [
  'securite', 'security', 'seguridad', 'usalama', 'proteger', 'protect', 'protege',
  'linda', '2fa', 'pin', 'biometrie', 'biometrics', 'biometria', 'biometria', 'shamir',
  'blackkey', 'cle', 'key', 'clave', 'ufunguo', 'mot de passe', 'password',
  'contrasena', 'neno la siri', 'vole', 'stolen', 'robado', 'imeibiwa', 'piratage',
  'hack', 'hacked', 'fraude', 'fraud', 'arnaque', 'scam', 'estafa', 'utapeli',
];

/** Mots qui indiquent un besoin de support humain. */
export const SUPPORT_HINTS = [
  'support', 'humain', 'human', 'persona', 'mtu', 'agent', 'assistance', 'aide',
  'help', 'ayuda', 'msaada', 'contacter', 'contact', 'contactar', 'wasiliana',
  'bug', 'erreur', 'error', 'problema', 'tatizo',
];

// ============================================================================
// RAISONNEMENT : vocabulaire de domaine, small talk et questions canoniques
// ============================================================================

export type QueryFocus =
  | 'borb'
  | 'send'
  | 'buy'
  | 'sell'
  | 'currencies'
  | 'exchange'
  | 'fees'
  | 'trading'
  | 'market'
  | 'p2p'
  | 'zando'
  | 'level';

/** Mots (normalisés) qui rattachent une demande courte au domaine UQ. */
export const DOMAIN_WORDS: string[] = [
  'borb', 'borb', 'reserve', 'securite', 'security', 'devise', 'devises',
  'currency', 'currencies', 'argent', 'money', 'envoi', 'envoyer', 'send',
  'transfert', 'transferer', 'transfer', 'paiement', 'payer', 'pay', 'echange',
  'echanger', 'exchange', 'convertir', 'convert', 'conversion', 'acheter',
  'achat', 'buy', 'vendre', 'vente', 'sell', 'trading', 'bourse', 'frais',
  'fee', 'fees', 'cout', 'couts', 'cost', 'prix', 'price', 'taux', 'rate',
  'wallet', 'coffre', 'portefeuille', 'solde', 'balance', 'compte', 'account',
  'zando', 'ubi', 'epargne', 'savings', 'credit', 'pin', '2fa', 'biometrie',
  'biometrics', 'kyc', 'p2p', 'bubble', 'bulle', 'cases', 'case', 'miner',
  'minage', 'gagner', 'earn', 'gain', 'reward', 'recompense', 'crypto',
  'cryptos', 'usd', 'eur', 'cdf', 'xof', 'xaf', 'ngn', 'kes', 'zar', 'gbp',
  'salio', 'akaunti', 'pesa', 'sarafu', 'tuma', 'kutuma', 'nunua', 'kuuza',
  'badilisha', 'kiwango', 'ada', 'gharama', 'bei', 'divisa', 'divisas',
  'dinero', 'enviar', 'comprar', 'vender', 'cambiar', 'cuenta', 'cartera',
  'ahorro', 'credito', 'moneda', 'monnaie', 'coute', 'coutent', 'euro', 'euros',
  'dollar', 'dollars', 'dolar', 'dolares', 'livre', 'pounds', 'nitume',
  'nituma', 'atume', 'tutume',
  'trader', 'marche', 'marches', 'market', 'markets', 'ordre', 'ordres',
  'order', 'orders', 'orderbook', 'carnet', 'paire', 'paires', 'pair',
  'pairs', 'studio', 'boutique', 'produit', 'produits', 'article', 'articles',
  'contenu', 'contenus', 'publier', 'publication', 'publications', 'annonce',
  'annonces', 'verifier', 'verifie', 'verification', 'identite', 'niveau',
  'niveaux', 'plafond', 'plafonds', 'reperer', 'scan', 'scanner', 'volume',
  'volumes', 'liquidite', 'liquidites', 'soko', 'bidhaa',
  'kipengee', 'utambulisho', 'ngazi', 'mercado', 'producto', 'articulo',
  'publicar', 'nivel', 'identidad', 'verificar', 'limites', 'product',
  'products', 'item', 'items', 'listing', 'element', 'elements', 'level',
  'levels',
];

/** Petites formules conversationnelles retirées avant l'analyse. */
export const SMALL_TALK_PREFIXES: Record<Lang, string[]> = {
  fr: [
    'bonjour', 'salut', 'bonsoir', 'coucou', 'hello', 'hey', 'yo', 'bjr', 'slt',
    'cc', 'rebonjour', 'excusez moi', 'excuse moi', 'pardon', 'desole',
    'desolee', 's il te plait', 's il vous plait', 'stp', 'svp',
  ],
  en: [
    'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
    'greetings', 'excuse me', 'sorry', 'please', 'pls',
  ],
  es: [
    'hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'ola',
    'que tal', 'disculpa', 'perdon', 'por favor', 'porfa',
  ],
  sw: [
    'habari', 'mambo', 'jambo', 'hujambo', 'salama', 'karibu', 'samahani',
    'tafadhali', 'habari za asubuhi', 'habari za mchana', 'habari za jioni',
  ],
};

export const SMALL_TALK_SUFFIXES: Record<Lang, string[]> = {
  fr: ['merci', 'merci beaucoup', 'stp', 'svp', 's il te plait', 's il vous plait', 'pardon', 'desole', 'desolee'],
  en: ['thanks', 'thank you', 'thx', 'please', 'pls', 'sorry'],
  es: ['gracias', 'muchas gracias', 'por favor', 'porfa', 'disculpa', 'perdon'],
  sw: ['asante', 'asante sana', 'tafadhali', 'samahani'],
};

/** Formes canoniques : reconstruisent une vraie question à partir d'un mot-clé. */
export const CANONICAL_QUERIES: Record<QueryFocus, Record<Lang, string[]>> = {
  borb: {
    fr: ['c est quoi le borb', 'a quoi sert la reserve de securite'],
    en: ['what is borb', 'what is the security reserve'],
    es: ['que es el borb', 'que es la reserva de seguridad'],
    sw: ['borb ni nini', 'akiba ya usalama ni nini'],
  },
  send: {
    fr: ['comment envoyer de l argent'],
    en: ['how to send money'],
    es: ['como enviar dinero'],
    sw: ['jinsi ya kutuma pesa'],
  },
  buy: {
    fr: ['comment acheter du borb'],
    en: ['how to buy borb'],
    es: ['como comprar borb'],
    sw: ['jinsi ya kununua borb'],
  },
  sell: {
    fr: ['comment vendre du borb'],
    en: ['how to sell borb'],
    es: ['como vender borb'],
    sw: ['jinsi ya kuuza borb'],
  },
  currencies: {
    fr: ['quelles devises puis je utiliser'],
    en: ['which currencies can i use'],
    es: ['que divisas puedo usar'],
    sw: ['sarafu zipi naweza kutumia'],
  },
  exchange: {
    fr: ['comment echanger du borb en devise'],
    en: ['how to exchange borb for currency'],
    es: ['cambiar borb a divisa'],
    sw: ['badilisha borb kuwa sarafu'],
  },
  fees: {
    fr: ['combien ca coute'],
    en: ['how much does it cost'],
    es: ['cuanto cuesta'],
    sw: ['inagharimu kiasi gani'],
  },
  trading: {
    fr: ['comment trader sur uq', 'comment passer un ordre au marche'],
    en: ['how to trade on uq', 'how to place an order'],
    es: ['como hacer trading en uq', 'como poner una orden'],
    sw: ['jinsi ya kufanya trading uq', 'jinsi ya kuweka order'],
  },
  market: {
    fr: ['comment reperer le marche vite', 'comment lire le marche'],
    en: ['how to scan the market quickly', 'how to read the market'],
    es: ['como revisar el mercado rapido', 'como leer el mercado'],
    sw: ['jinsi ya kuangalia soko haraka', 'jinsi ya kusoma soko'],
  },
  p2p: {
    fr: ['comment vendre en p2p', 'comment acheter en p2p'],
    en: ['how to sell on p2p', 'how to buy on p2p'],
    es: ['como vender en p2p', 'como comprar en p2p'],
    sw: ['jinsi ya kuuza p2p', 'jinsi ya kununua p2p'],
  },
  zando: {
    fr: ['comment creer un element sur zando', 'comment publier une offre'],
    en: ['how to create an item on zando', 'how to publish an offer'],
    es: ['como crear un elemento en zando', 'como publicar una oferta'],
    sw: ['jinsi ya kuunda kipengee zando', 'jinsi ya kuchapisha ofa'],
  },
  level: {
    fr: ['comment monter de niveau sur uq', 'comment verifier mon identite'],
    en: ['how to level up on uq', 'how to verify my identity'],
    es: ['como subir de nivel en uq', 'como verificar mi identidad'],
    sw: ['jinsi ya kupanda ngazi uq', 'jinsi ya kuthibitisha utambulisho'],
  },
};

/** Rappel ajouté quand la question trahit une confusion BORB = monnaie. */
export const BORB_REMINDER: Record<Lang, string> = {
  fr: '⚖️ Rappel : le BORB est ta réserve de sécurité, pas une monnaie transférable.',
  en: '⚖️ Reminder: BORB is your security reserve, not a transferable currency.',
  es: '⚖️ Recordatorio: el BORB es tu reserva de seguridad, no una divisa transferible.',
  sw: '⚖️ Kumbuka: BORB ni akiba yako ya usalama, si sarafu inayoweza kuhamishwa.',
};
