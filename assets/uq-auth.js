/* ============================================================
   UQ Auth — kit d'authentification UQ partagé.
   Source unique pour : création de compte, vérification
   d'identifiants, preuve humaine — utilisé par TOUS les
   systèmes UQ (site, wallet BORB, UQZ, apps mobiles).

   Contrat API plateforme :
     POST /api/human/begin  → défi visuel (puzzle scène)
     POST /api/human/verify → pass humain à usage unique (15 min)
     POST /api/account/create { …champs…, preuve_humaine }
     POST /api/auth/verify-account { email,password } ou
                                { number,email,password }
   ============================================================ */

const API = {
  base: '',
};

export function configurer({ apiUrl } = {}) {
  API.base = (apiUrl || API.base || '').replace(/\/$/, '');
}

async function appel(method, path, body) {
  const r = await fetch(API.base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(j.message || `HTTP ${r.status}`);
    err.status = r.status;
    err.code = j.raison || j.code || '';
    throw err;
  }
  return j;
}

// ---------- Preuve humaine ----------

/**
 * Démarre un défi visuel. Retourne le puzzle à afficher.
 * ?type=scene force la scène animée (objets en mouvement).
 */
export async function defiHumainCommencer() {
  return appel('POST', '/api/human/begin?type=scene');
}

/**
 * Soumet la réponse au défi → pass humain à usage unique.
 * @param {string} jeton   jeton du défi (champ "jeton"/"defi")
 * @param {*}      reponse la réponse utilisateur (choix, code…)
 */
export async function defiHumainVerifier(jeton, reponse) {
  const j = await appel('POST', '/api/human/verify', {
    jeton, reponse,
  });
  // Le pass peut arriver sous plusieurs noms selon la version
  return j.pass || j.preuve_humaine || j.hpass || j.token || null;
}

/**
 * Exécute le cycle complet : begin → callback UI → verify → pass.
 * @param {(puzzle) => Promise<reponse>} resoudre  callback qui
 *        affiche le défi et retourne la réponse de l'utilisateur.
 */
export async function obtenirPassHumain(resoudre) {
  const begin = await defiHumainCommencer();
  const jeton = begin.jeton || begin.defi || begin.id;
  const puzzle = begin.puzzle || begin;
  if (!jeton) throw new Error('Défi humain malformé');
  const reponse = await resoudre(puzzle);
  const pass = await defiHumainVerifier(jeton, reponse);
  if (!pass) throw new Error('Preuve humaine refusée');
  return pass;
}

// ---------- Vérification de compte ----------

/**
 * Vérifie des identifiants UQ.
 * @param {{email:string,password:string,number?:string}} creds
 * @returns {Promise<object>} infos du compte ou throw 401
 */
export async function verifierCompte(creds) {
  return appel('POST', '/api/auth/verify-account', creds);
}

// ---------- Création de compte ----------

/**
 * Champs de création UQ — regroupés par écran wizard
 * (règle : MAX 3 champs par écran).
 */
export const CHAMPS_CREATION = [
  {
    etape: 1, titre: 'Identité', guide: 'Tes informations de base — elles restent confidentielles.',
    champs: [
      { nom: 'prenom', label: 'Prénom', type: 'text', requis: true },
      { nom: 'nom', label: 'Nom', type: 'text', requis: true },
      { nom: 'pseudo', label: 'Pseudo public', type: 'text', requis: false,
        aide: 'Visible par les autres — ex: uq@jean' },
    ],
  },
  {
    etape: 2, titre: 'Naissance', guide: 'Utilisé uniquement pour la vérification d\u2019âge et le KYC.',
    champs: [
      { nom: 'date_naissance', label: 'Date de naissance', type: 'date', requis: true },
      { nom: 'lieu_naissance', label: 'Lieu de naissance', type: 'text', requis: true },
      { nom: 'pays', label: 'Pays', type: 'text', requis: true },
    ],
  },
  {
    etape: 3, titre: 'Contact', guide: 'Ton adresse UQ et un contact de récupération externe.',
    champs: [
      { nom: 'email', label: 'Email UQ', type: 'email', requis: true },
      { nom: 'recovery_email', label: 'Email de récupération', type: 'email', requis: false },
      { nom: 'telephone', label: 'Téléphone', type: 'tel', requis: false },
    ],
  },
  {
    etape: 4, titre: 'Sécurité', guide: 'Choisis un mot de passe solide — il ne quitte jamais ton appareil.',
    champs: [
      { nom: 'password', label: 'Mot de passe', type: 'password', requis: true },
      { nom: 'password2', label: 'Confirmer', type: 'password', requis: true },
      { nom: 'code_promo', label: 'Code parrain (optionnel)', type: 'text', requis: false },
    ],
  },
  {
    etape: 5, titre: 'Vérification humaine', guide: 'Une dernière étape pour prouver que tu es bien humain.',
    champs: [
      { nom: '__preuve__', label: 'Défi visuel', type: 'human', requis: true },
    ],
  },
];

/**
 * Crée un compte UQ.
 * @param {object} donnees  champs remplis (password2 exclu)
 * @param {string} passHumain  pass à usage unique
 */
export async function creerCompte(donnees, passHumain) {
  const body = { ...donnees };
  delete body.password2;
  body.preuve_humaine = passHumain;
  return appel('POST', '/api/account/create', body);
}

/**
 * Flux complet de création : wizard → preuve humaine → create.
 * @param {object} opts
 *   etapes: CHAMPS_CREATION par défaut
 *   resoudreDefi: callback affichant le défi (étape 5)
 *   onEtape(i, etape): callback de progression
 * @param {function} collecter  appelé à chaque étape avec les
 *        valeurs → doit retourner les valeurs saisies
 */
export async function fluxCreation({ resoudreDefi, onEtape, collecter }) {
  const donnees = {};
  for (const [i, etape] of CHAMPS_CREATION.entries()) {
    onEtape?.(i, etape);
    const valeurs = await collecter(etape, donnees);
    Object.assign(donnees, valeurs);
    // Vérif password à l'étape sécurité
    if (etape.etape === 4 && valeurs.password !== valeurs.password2) {
      throw new Error('Les mots de passe ne correspondent pas');
    }
  }
  // Étape 5 = preuve humaine
  const pass = await obtenirPassHumain(resoudreDefi);
  return creerCompte(donnees, pass);
}

// ---------- Raccourcis associes aux autres modules UQ ----------
export const UQAuth = {
  configurer,
  verifierCompte,
  defiHumainCommencer,
  defiHumainVerifier,
  obtenirPassHumain,
  creerCompte,
  fluxCreation,
  CHAMPS_CREATION,
};

window.UQAuth = UQAuth;
