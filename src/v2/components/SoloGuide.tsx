// ============================================================================
// SoloGuide.tsx — Guide IA animé (cerveau + bulle + dactylo)
// Design pro : cerveau SVG animé, bulle de chat, texte machine à écrire
// ============================================================================

import { useEffect, useRef, useState } from 'react';

const MESSAGES: Record<number, string[]> = {
  1: [
    'Bienvenue ! Je suis ton guide IA.',
    'Choisis ce que tu veux publier : un objet ou un service.',
    'Tout se fait en 6 étapes. Tu peux revenir en arrière à tout moment.',
  ],
  2: [
    'Tu veux vendre un objet ou proposer un service ?',
    'Vente = téléphone, moto, terrain, maison...',
    'Service = plombier, coiffeur, livreur...',
  ],
  3: [
    'Ajoute une photo pour attirer l\'attention.',
    'Prends une photo avec ta caméra ou importe depuis ta galerie.',
    'Une bonne photo double tes chances de vendre.',
  ],
  4: [
    'Décris ton annonce en quelques mots.',
    'Choisis la catégorie qui correspond le mieux.',
    'Un titre clair + une description courte = plus de contacts.',
  ],
  5: [
    'Fixe ton prix et choisis la devise.',
    'Indique l\'état : neuf, occasion ou pièce.',
    'Ajoute ta position pour que les acheteurs proches te trouvent.',
  ],
  6: [
    'Vérifie ton annonce une dernière fois.',
    'Si tout est bon, clique sur Publier.',
    'Ton annonce sera visible dans le flux Zando pendant 48h.',
  ],
};

const VITESSE_DACTYLO = 25; // ms par lettre
const PAUSE_ENTRE_MESSAGES = 3000; // ms entre chaque message

interface SoloGuideProps {
  etape: number;
}

export function SoloGuide({ etape }: SoloGuideProps) {
  const messages = MESSAGES[etape] || ['On te guide pas à pas.'];
  const [indexMessage, setIndexMessage] = useState(0);
  const [texteAffiche, setTexteAffiche] = useState('');
  const [enTrainDEcrire, setEnTrainDEcrire] = useState(true);
  const timerRef = useRef<number | null>(null);
  const pauseRef = useRef<number | null>(null);

  // Reset quand l'étape change
  useEffect(() => {
    setIndexMessage(0);
    setTexteAffiche('');
    setEnTrainDEcrire(true);
  }, [etape]);

  // Machine à écrire
  useEffect(() => {
    // Nettoyer les timers précédents
    if (timerRef.current) clearInterval(timerRef.current);
    if (pauseRef.current) clearTimeout(pauseRef.current);

    const messageActuel = messages[indexMessage] || '';
    setTexteAffiche('');
    setEnTrainDEcrire(true);

    let i = 0;
    timerRef.current = window.setInterval(() => {
      if (i < messageActuel.length) {
        setTexteAffiche(messageActuel.slice(0, i + 1));
        i++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setEnTrainDEcrire(false);

        // Pause puis message suivant
        pauseRef.current = window.setTimeout(() => {
          if (indexMessage < messages.length - 1) {
            setIndexMessage((prev) => prev + 1);
          } else {
            setIndexMessage(0);
          }
        }, PAUSE_ENTRE_MESSAGES);
      }
    }, VITESSE_DACTYLO);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pauseRef.current) clearTimeout(pauseRef.current);
    };
  }, [indexMessage, messages]);

  return (
    <div className="solo-guide">
      {/* Cerveau animé */}
      <div className="solo-guide__cerveau">
        <svg viewBox="0 0 48 48" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e63946">
                <animate attributeName="stop-color" values="#e63946;#c9a227;#b5378c;#e63946" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#c42a36">
                <animate attributeName="stop-color" values="#c42a36;#7d3cff;#e63946;#c42a36" dur="4s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          {/* Forme du cerveau */}
          <path
            d="M 16 14 Q 10 14 10 20 Q 10 24 14 26 Q 12 30 16 34 Q 20 36 22 32 Q 24 34 26 32 Q 28 36 32 34 Q 36 30 34 26 Q 38 24 38 20 Q 38 14 32 14 Q 30 10 24 10 Q 18 10 16 14 Z"
            fill="url(#brainGrad)"
            opacity="0.95"
          >
            <animate attributeName="opacity" values="0.95;1;0.95" dur="2s" repeatCount="indefinite" />
          </path>
          {/* Circonvolutions */}
          <path d="M 18 18 Q 20 20 18 22" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M 30 18 Q 28 20 30 22" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M 22 26 Q 24 28 26 26" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7" />
          {/* Étincelles */}
          <circle cx="12" cy="12" r="1.5" fill="#c9a227">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="36" cy="12" r="1.5" fill="#c9a227">
            <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="24" cy="8" r="1.5" fill="#c9a227">
            <animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite" begin="1s" />
          </circle>
        </svg>
      </div>

      {/* Bulle de chat */}
      <div className="solo-guide__bulle">
        <p>
          {texteAffiche}
          {enTrainDEcrire && <span className="solo-guide__curseur">|</span>}
        </p>
      </div>
    </div>
  );
}