// ============================================================
// BORB ICON - Symbole visuel de la protection monetaire
// Design : Hexagone fractal + Bouclier + Cercle universel
// Couleurs : Rouge UQ + Bleu UQ + Or BORB
// ============================================================

interface BorbIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: 'full' | 'simple' | 'outline';
}

export function BorbIcon({
  size = 32,
  className = '',
  animated = false,
  variant = 'full',
}: BorbIconProps) {
  // Couleurs UQ
  const rouge = '#E63946';
  const bleu = '#2E86DE';
  const or = '#FFD700';
  const blanc = '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} ${animated ? 'borb-icon-animated' : ''}`}
      style={{
        filter: 'drop-shadow(0 0 6px rgba(230,57,70,0.4)) drop-shadow(0 0 12px rgba(46,134,222,0.3))',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient principal rouge -> bleu */}
        <linearGradient id="borb-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={rouge} stopOpacity="1" />
          <stop offset="50%" stopColor="#B5378C" stopOpacity="1" />
          <stop offset="100%" stopColor={bleu} stopOpacity="1" />
        </linearGradient>

        {/* Gradient or */}
        <linearGradient id="borb-grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={or} stopOpacity="1" />
          <stop offset="100%" stopColor="#B8941A" stopOpacity="1" />
        </linearGradient>

        {/* Glow filtre */}
        <filter id="borb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cercle exterieur (universel) */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="url(#borb-grad-main)"
        strokeWidth="3"
        opacity={variant === 'outline' ? '1' : '0.6'}
      />

      {/* Hexagone (fractal) */}
      <polygon
        points="50,8 85,28 85,72 50,92 15,72 15,28"
        fill={variant === 'simple' ? 'url(#borb-grad-main)' : 'none'}
        stroke="url(#borb-grad-main)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter="url(#borb-glow)"
      />

      {/* Bouclier central (protection) */}
      <path
        d="M50 22 L72 32 L72 55 Q72 72 50 82 Q28 72 28 55 L28 32 Z"
        fill={variant === 'outline' ? 'none' : 'url(#borb-grad-main)'}
        stroke={blanc}
        strokeWidth={variant === 'outline' ? '2' : '1.5'}
        strokeLinejoin="round"
        opacity={variant === 'outline' ? '1' : '0.95'}
      />

      {/* Symbole central : B stylise */}
      {variant !== 'outline' && (
        <>
          {/* Barre verticale du B */}
          <rect x="42" y="35" width="3" height="30" fill={blanc} opacity="0.95" />

          {/* Boucles du B */}
          <path
            d="M45 35 Q58 35 58 42 Q58 48 48 48"
            fill="none"
            stroke={blanc}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.95"
          />
          <path
            d="M45 48 Q60 48 60 58 Q60 65 45 65"
            fill="none"
            stroke={blanc}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Point or (valeur/fractal) */}
          <circle cx="50" cy="50" r="2.5" fill="url(#borb-grad-gold)" />
        </>
      )}

      {/* Petits points fractals autour */}
      {variant === 'full' && (
        <>
          <circle cx="50" cy="4" r="1.5" fill={or} opacity="0.8" />
          <circle cx="50" cy="96" r="1.5" fill={or} opacity="0.8" />
          <circle cx="4" cy="50" r="1.5" fill={or} opacity="0.8" />
          <circle cx="96" cy="50" r="1.5" fill={or} opacity="0.8" />
        </>
      )}
    </svg>
  );
}

// ============================================================
// BORB ICON ANIME (avec rotation subtile)
// ============================================================
export function BorbIconAnimated({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{
        animation: 'borb-spin-slow 12s linear infinite',
      }}
    >
      <BorbIcon size={size} animated={true} />
    </div>
  );
}