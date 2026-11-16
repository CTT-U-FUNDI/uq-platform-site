// ============================================================
// UQ Platform — Service Firestore (chat, zando, publications)
// Plan Spark gratuit — NE JAMAIS y mettre : wallet, KYC, PIN,
// clés, données chiffrées. Ces données restent sur Render/local.
// ============================================================
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, onSnapshot,
         query, orderBy, limit, serverTimestamp, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';
import { chiffrer, dechiffrerAvec, maClePublique, estChiffre } from './e2e';

const firebaseConfig = {
  apiKey: 'AIzaSyB-CLMP1vAcSw627mJi2RCecc5PKC315Q8',
  authDomain: 'uqz-platform.firebaseapp.com',
  projectId: 'uqz-platform',
  storageBucket: 'uqz-platform.firebasestorage.app',
  messagingSenderId: '869395428711',
  appId: '1:869395428711:web:ee7a4ec32e5aaa7764ebc2',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const fbAuth = getAuth(app);

// Connexion anonyme — les règles exigent request.auth != null.
// Quand UQ Auth sera branché, on échangera contre un custom token.
let authPret = false;
export function attendreAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (authPret && fbAuth.currentUser) return resolve(fbAuth.currentUser.uid);
    const unsub = onAuthStateChanged(fbAuth, async (u) => {
      if (u) { authPret = true; unsub(); resolve(u.uid); }
    });
    signInAnonymously(fbAuth).catch(reject);
    setTimeout(() => reject(new Error('Firebase Auth timeout')), 15000);
  });
}

// ---------- Pont UQ Auth → Firebase ----------
// Le backend UQ (Render) émet un custom token via /api/auth/firebase-token.
// On s'authentifie dessus : auth.uid devient le numéro UQ (ex: UQ-00000001)
// au lieu d'un uid anonyme — les clés E2E et profils sont alors liés au vrai compte.
export async function lierUQVersFirebase(customToken: string): Promise<string> {
  const cred = await signInWithCustomToken(fbAuth, customToken);
  authPret = true;
  return cred.user.uid;
}

// Récupère le custom token auprès du backend UQ puis lie la session.
// `fetchToken` = fonction fournie par l'appelant (évite l'import circulaire api<->firestore).
export async function connecterUQ(fetchToken: () => Promise<string>): Promise<string> {
  const customToken = await fetchToken();
  return lierUQVersFirebase(customToken);
}

// ---------- UQ Chat : messages 1:1 ----------
// Structure : chats/{chatId}/messages/{msgId}
// chatId déterministe = les deux UQ triés : "uqA_uqB"
export function chatIdEntre(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export interface MsgUQ {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  pub?: JsonWebKey;
  createdAt: any;
}

// Déchiffre les messages E2E (clé publique de l'expéditeur jointe au doc)
async function decryptAll(msgs: MsgUQ[]): Promise<MsgUQ[]> {
  return Promise.all(msgs.map(async (m) => {
    if (estChiffre(m.text)) {
      const pt = m.pub ? await dechiffrerAvec(m.text, m.pub) : null;
      if (pt !== null) return { ...m, text: pt };
      return { ...m, text: '🔒 [message chiffré illisible]' };
    }
    return m;
  }));
}

// Écoute temps réel d'une conversation (quota-safe : limit 100)
export function ecouterMessages(chatId: string, cb: (msgs: MsgUQ[]) => void) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, async (snap) => {
    cb(await decryptAll(snap.docs.map(d => ({ id: d.id, ...d.data() } as MsgUQ)).reverse()));
  });
}

// Lecture ponctuelle (polling UI v2) — même forme que ecouterMessages
export async function lireMessages(chatId: string): Promise<MsgUQ[]> {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return decryptAll(snap.docs.map(d => ({ id: d.id, ...d.data() } as MsgUQ)).reverse());
}

// ---------- Annuaire de clés publiques (keys/{pseudo}) ----------
// TOFU : la première clé vue est acceptée. La liaison pseudo<->compte
// sera renforcée quand UQ Auth émettra des custom tokens Firebase.
export async function publierCle(pseudo: string): Promise<JsonWebKey> {
  const pub = await maClePublique();
  await setDoc(doc(db, 'keys', pseudo), { pub, updatedAt: serverTimestamp() });
  return pub;
}

export async function clePubliqueDe(pseudo: string): Promise<JsonWebKey | null> {
  const snap = await getDoc(doc(db, 'keys', pseudo));
  return snap.exists() ? (snap.data().pub as JsonWebKey) : null;
}

// ---------- Profil public (directory/{pseudo}) ----------
export interface ProfilUQ {
  pseudo: string; avatar?: string; bio?: string;
  pays?: string; metier?: string; reputation?: number; createdAt?: any;
}
export async function lireProfil(pseudo: string): Promise<ProfilUQ | null> {
  const snap = await getDoc(doc(db, 'directory', pseudo));
  return snap.exists() ? (snap.data() as ProfilUQ) : null;
}
export async function ecrireProfil(p: ProfilUQ) {
  await setDoc(doc(db, 'directory', p.pseudo), { ...p, updatedAt: serverTimestamp() }, { merge: true });
}

// Envoi message — chiffré E2E avant Firestore (règles : sender == auth.uid)
export async function envoyerMessage(chatId: string, sender: string, senderName: string, destinataire: string, text: string) {
  const pub = await publierCle(senderName);
  let contenu = text.slice(0, 2000);
  const pubDest = await clePubliqueDe(destinataire);
  if (pubDest) contenu = await chiffrer(contenu, pubDest);
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: contenu,
    sender,
    senderName: senderName.slice(0, 40),
    pub,
    createdAt: serverTimestamp(),
  });
}

// ---------- Publications + likes (quotas) ----------
export function toggleLike(pubId: string, uid: string) {
  // like = doc publications/{id}/likes/{uid}
  // unlike = delete — géré côté composant avec getDoc/deleteDoc
}
