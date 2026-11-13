// ====================
// SCREEN HEADER — En-tête unique de toutes les fenêtres
// ====================
//
//   Même hauteur (4rem + safe-area), même flou, même bordure,
//   même bouton retour : les écrans se ressemblent tous.
//   `left` / `right` / `children` permettent de garder les
//   contrôles propres à chaque écran sans casser l'alignement.
// ====================

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  /** Titre principal (gauche du header). */
  title?: ReactNode;
  /** Sous-titre discret sous le titre. */
  subtitle?: ReactNode;
  /** Pastille/icône affichée avant le titre. */
  icon?: ReactNode;
  /** Affiche le bouton retour standard. */
  onBack?: () => void;
  /** Libellé accessible du bouton retour. */
  backLabel?: string;
  /** Remplace complètement la zone gauche (bouton retour custom). */
  left?: ReactNode;
  /** Actions alignées à droite. */
  right?: ReactNode;
  /** Rangée supplémentaire sous la ligne de titre (onglets, recherche...). */
  children?: ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  icon,
  onBack,
  backLabel = 'Retour',
  left,
  right,
  children,
  className = '',
}: Props) {
  const leftSlot = left ?? (
    onBack ? (
      <button type="button" onClick={onBack} className="uq-icon-btn" aria-label={backLabel}>
        <ArrowLeft size={18} />
      </button>
    ) : null
  );

  const hasTitle = Boolean(title || subtitle);

  return (
    <header className={`uq-screen-header uq-screen-header--app ${className}`.trim()}>
      <div className="uq-screen-header-inner">
        {leftSlot}
        {icon}
        {hasTitle ? (
          <div className="min-w-0 flex-1">
            {title ? <h1 className="uq-screen-title truncate">{title}</h1> : null}
            {subtitle ? <div className="uq-screen-subtitle truncate">{subtitle}</div> : null}
          </div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        {right}
      </div>
      {children}
    </header>
  );
}

export default ScreenHeader;
