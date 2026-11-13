import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Défi visuel "scène" : des objets colorés portant chacun un numéro se
 * déplacent aléatoirement pendant ~2 s, les numéros permutent entre objets
 * et des éclairages s'allument/éteignent. Ensuite la scène se fige :
 * l'utilisateur doit lire le numéro de l'objet cerclé et le choisir.
 *
 * Le serveur reste l'autorité : il connaît la correspondance objet→numéro
 * et valide le numéro soumis. L'animation n'est que la présentation.
 */

interface Props {
  /** Numéros uniques (10-99) affichés sur chaque objet, index = objet. */
  objets: number[];
  /** Index de l'objet ciblé par la question. */
  cibleIdx: number;
  /** Appelé avec le numéro choisi par l'utilisateur. */
  onReponse: (nombre: number) => void;
  /** Désactive les interactions (busy / verrou). */
  desactive?: boolean;
}

interface Position {
  x: number; // % dans le conteneur
  y: number;
}

const MELANGE_MS = 2000;
const PAS_MS = 170;
const PALETTE = [
  '#e05555',
  '#e0913f',
  '#d9c22e',
  '#4fae62',
  '#3f8fd9',
  '#8a5fd0',
  '#d95fa0',
];

function positionsAleatoires(n: number): Position[] {
  return Array.from({ length: n }, () => ({
    x: 8 + Math.random() * 76,
    y: 10 + Math.random() * 68,
  }));
}

function permutation<T>(source: T[]): T[] {
  const copie = [...source];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

export function HumanScenePuzzle({ objets, cibleIdx, onReponse, desactive }: Props) {
  const [phase, setPhase] = useState<'melange' | 'reponse'>('melange');
  const [positions, setPositions] = useState<Position[]>(() => positionsAleatoires(objets.length));
  const [numerosAffiches, setNumerosAffiches] = useState<number[]>(() => permutation(objets));
  const [eclairage, setEclairage] = useState<boolean[]>(() =>
    objets.map(() => Math.random() < 0.6),
  );
  const [sceneLumineuse, setSceneLumineuse] = useState(true);
  const minuteries = useRef<number[]>([]);
  const fige = useRef(false);

  const mouvementReduit = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
    [],
  );

  // Mélange : positions + numéros + lumières bougent pendant MELANGE_MS.
  useEffect(() => {
    const melange = mouvementReduit ? Math.min(MELANGE_MS, 1200) : MELANGE_MS;
    const intervalle = window.setInterval(() => {
      setPositions(positionsAleatoires(objets.length));
      if (!fige.current) {
        // Pendant le mélange les numéros permutent entre les objets.
        setNumerosAffiches(permutation(objets));
        setEclairage(objets.map(() => Math.random() < 0.55));
        setSceneLumineuse(Math.random() < 0.7);
      }
    }, PAS_MS);
    minuteries.current.push(intervalle);
    const fin = window.setTimeout(() => {
      // Figement : chaque objet reprend SON numéro (ordre serveur) et
      // l'éclairage se stabilise ; les objets continuent de dériver.
      fige.current = true;
      setPhase('reponse');
      setNumerosAffiches([...objets]);
      setEclairage(objets.map(() => true));
      setSceneLumineuse(true);
    }, melange);
    minuteries.current.push(fin);
    return () => {
      minuteries.current.forEach((t) => {
        window.clearInterval(t);
        window.clearTimeout(t);
      });
      minuteries.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const numerosMelanges = useMemo(() => permutation(objets), [objets]);

  return (
    <div className="v2-human-scene">
      <div className="v2-human-scene-ask" role="status" aria-live="polite">
        {phase === 'melange'
          ? 'Mémorise la scène… les numéros se mélangent.'
          : `Quel numéro porte l’objet cerclé ?`}
      </div>
      <div
        className={`v2-human-scene-stage${sceneLumineuse ? ' is-lit' : ''}`}
        role="group"
        aria-label="Scène d’objets numérotés"
      >
        {objets.map((numero, index) => {
          const estCible = phase === 'reponse' && index === cibleIdx;
          return (
            <div
              key={index}
              className={`v2-human-scene-objet${estCible ? ' is-cible' : ''}${
                mouvementReduit ? ' is-static' : ''
              }`}
              style={{
                left: `${positions[index].x}%`,
                top: `${positions[index].y}%`,
                backgroundColor: PALETTE[index % PALETTE.length],
                boxShadow: eclairage[index]
                  ? `0 0 18px ${PALETTE[index % PALETTE.length]}aa`
                  : '0 0 4px rgba(0,0,0,.35)',
                opacity: eclairage[index] ? 1 : 0.55,
              }}
              aria-label={estCible ? `Objet ciblé, numéro ${numero}` : `Objet numéro ${numero}`}
            >
              <span className="v2-human-scene-num">{numerosAffiches[index]}</span>
            </div>
          );
        })}
      </div>
      {phase === 'reponse' && (
        <div className="v2-human-scene-choix" role="group" aria-label="Choisir le numéro">
          {numerosMelanges.map((nombre) => (
            <button
              key={nombre}
              type="button"
              className="v2-human-scene-num-btn"
              disabled={desactive}
              onClick={() => onReponse(nombre)}
            >
              {nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
