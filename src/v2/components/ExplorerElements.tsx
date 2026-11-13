import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Un élément de la boutique : une photo, une annonce, une offre — un seul par écran. */
export interface ElementExplorer {
  id: string;
  /** « Galerie », « Information », « Offre » : ce que le visiteur regarde. */
  etiquette?: string;
  /** Média principal, étiré sur la hauteur libre ; cliquable si `onMedia` est fourni. */
  media?: string;
  onMedia?: () => void;
  titre?: string;
  desc?: string;
  /** Prix, bouton, compteurs : ce qui reste collé en bas de la carte. */
  pied?: ReactNode;
  /** Couverture de la boutique : fond flouté derrière un élément sans photo. */
  fond?: string;
  /** Contenu libre, quand le trio titre/description/pied ne suffit pas. */
  noeud?: ReactNode;
}

/**
 * Explorer une boutique : les éléments défilent de gauche à droite, un par écran.
 *
 * Le défilement vertical n'existe plus ici : la piste prend toute la hauteur qui
 * reste sous l'en-tête de la feuille, chaque carte prend toute la largeur utile.
 * Les flèches et les points ne sont que des repères — le geste principal reste le
 * glissement latéral, et les flèches du clavier font la même chose.
 */
export function ExplorerElements({
  elements,
  vide,
}: {
  elements: ElementExplorer[];
  /** Ce que voit le visiteur quand la boutique n'a encore aucun élément. */
  vide?: ReactNode;
}) {
  const piste = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [progression, setProgression] = useState(0);
  const [debut, setDebut] = useState(true);
  const [fin, setFin] = useState(true);

  const maj = () => {
    const node = piste.current;
    if (!node) return;
    const centre = node.scrollLeft + node.clientWidth / 2;
    let meilleur = 0;
    let distance = Number.POSITIVE_INFINITY;
    const cartes = Array.from(node.children) as HTMLElement[];
    cartes.forEach((carte, position) => {
      const milieu = carte.offsetLeft + carte.offsetWidth / 2;
      const ecart = Math.abs(milieu - centre);
      if (ecart < distance) {
        distance = ecart;
        meilleur = position;
      }
    });
    const total = node.scrollWidth - node.clientWidth;
    setIndex(Math.min(meilleur, Math.max(cartes.length - 1, 0)));
    setProgression(total > 0 ? node.scrollLeft / total : 1);
    setDebut(node.scrollLeft <= 2);
    setFin(total <= 2 || node.scrollLeft >= total - 2);
  };

  useEffect(() => {
    maj();
  }, [elements.length]);

  const sauter = (delta: number) => {
    const node = piste.current;
    if (!node) return;
    const largeur = (node.firstElementChild as HTMLElement | null)?.offsetWidth || node.clientWidth;
    node.scrollBy({ left: delta * (largeur + 12), behavior: 'smooth' });
  };

  const cartes = useMemo(() => elements, [elements]);

  if (cartes.length === 0) {
    return <div className="v2-explorer-vide">{vide || <span className="v2-muted">Rien à explorer pour l'instant.</span>}</div>;
  }

  return (
    <div className="v2-explorer">
      <div className="v2-explorer-repere">
        <span>
          Élément {index + 1} sur {cartes.length}
        </span>
        <span className="v2-explorer-points" aria-hidden>
          {cartes.map((element, position) => (
            <span key={element.id} className="v2-explorer-point" data-active={position === index} />
          ))}
        </span>
      </div>

      <div
        className="v2-explorer-piste"
        ref={piste}
        onScroll={maj}
        tabIndex={0}
        role="group"
        aria-label="Éléments de la boutique, à faire défiler de gauche à droite"
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            sauter(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            sauter(-1);
          }
        }}
      >
        {cartes.map((element) => (
          <CarteExplorer key={element.id} element={element} />
        ))}
      </div>

      <div className="v2-explorer-fleches">
        <button
          type="button"
          className="v2-explorer-fleche"
          onClick={() => sauter(-1)}
          disabled={debut}
          aria-label="Élément précédent"
        >
          <Icon name="back" size={17} />
        </button>
        <span className="v2-explorer-barre" aria-hidden>
          <span style={{ width: `${Math.round(progression * 100)}%` }} />
        </span>
        <button
          type="button"
          className="v2-explorer-fleche"
          onClick={() => sauter(1)}
          disabled={fin}
          aria-label="Élément suivant"
        >
          <Icon name="forward" size={17} />
        </button>
      </div>
    </div>
  );
}

/** Une carte ajustée à l'écran : média étiré, texte collé en bas, fond flouté si pas de photo. */
function CarteExplorer({ element }: { element: ElementExplorer }) {
  const { etiquette, media, onMedia, titre, desc, pied, fond, noeud } = element;
  const sansMedia = !media;

  return (
    <article className={`v2-explorer-carte ${sansMedia ? 'v2-explorer-carte--texte' : ''}`.trim()}>
      {sansMedia && fond ? (
        <>
          <img className="v2-explorer-fond" src={fond} alt="" aria-hidden />
          <div className="v2-explorer-voile" />
        </>
      ) : null}

      {media ? (
        <button
          type="button"
          className="v2-explorer-media"
          onClick={onMedia}
          disabled={!onMedia}
          aria-label={etiquette ? `${etiquette} — ${titre || 'agrandir'}` : 'Agrandir'}
        >
          <img src={media} alt="" loading="lazy" />
          {etiquette ? <span className="v2-explorer-etiquette v2-badge">{etiquette}</span> : null}
        </button>
      ) : null}

      <div className="v2-explorer-texte">
        {sansMedia && etiquette ? <span className="v2-badge" style={{ alignSelf: 'flex-start' }}>{etiquette}</span> : null}
        {noeud ? (
          noeud
        ) : (
          <>
            {titre ? <div className="v2-explorer-titre">{titre}</div> : null}
            {desc ? <div className="v2-explorer-desc">{desc}</div> : null}
            {pied ? <div className="v2-explorer-pied">{pied}</div> : null}
          </>
        )}
      </div>
    </article>
  );
}
