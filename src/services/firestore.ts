// ============================================================
// UQ Platform — Service Firestore (chat, zando, publications)
// Plan Spark gratuit — NE JAMAIS y mettre : wallet, KYC, PIN,
// clés, données chiffrées. Ces données restent sur Render/local.
// ============================================================
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, onSnapshot,
         query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

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
  createdAt: any;
}

// Écoute temps réel d'une conversation (quota-safe : limit 100)
export function ecouterMessages(chatId: string, cb: (msgs: MsgUQ[]) => void) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as MsgUQ)).reverse());
  });
}

// Envoi message — règles : sender == auth.uid, text <= 2000
export async function envoyerMessage(chatId: string, sender: string, senderName: string, text: string) {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text: text.slice(0, 2000),
    sender,
    senderName: senderName.slice(0, 40),
    createdAt: serverTimestamp(),
  });
}

// ---------- Publications + likes (quotas) ----------
export function toggleLike(pubId: string, uid: string) {
  // like = doc publications/{id}/likes/{uid}
  // unlike = delete — géré côté composant avec getDoc/deleteDoc
}
