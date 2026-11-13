import React from 'react';
import { UQ_COLORS, UQ_GRADIENTS, UQ_SHADOWS } from '../../theme/colors';
import { Icon } from './Icon';

interface FixoIconProps {
  size?: number;
  onClick?: () => void;
  className?: string;
  /** Affiche un badge de notification */
  badge?: number;
  /** Désactive l'animation pulse */
  noPulse?: boolean;
}

/**
 * FIXO — L'icône IA de l'UQ AIRB
 * - Rond gradient UQ
 * - Animation pulse + glow
 * - Badge optionnel
 * - Position flottante
 */
export const FixoIcon: React.FC<FixoIconProps> = ({
  size = 56,
  onClick,
  className = '',
  badge,
  noPulse = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-full transition-all active:scale-90 hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        background: UQ_GRADIENTS.diagonal,
        boxShadow: UQ_SHADOWS.glowMagenta,
      }}
      aria-label="UQ AI"
    >
      {/* Halo extérieur (pulse) */}
      {!noPulse && (
        <div
          className="absolute inset-0 rounded-full uq-animate-pulse"
          style={{
            background: UQ_GRADIENTS.diagonal,
            filter: 'blur(12px)',
            opacity: 0.6,
            animationDuration: '3s',
          }}
        />
      )}

      {/* Halo intérieur (glow au hover) */}
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          boxShadow: `0 0 32px ${UQ_COLORS.magenta}`,
        }}
      />

      {/* Contenu principal */}
      <div className="relative w-full h-full flex items-center justify-center rounded-full overflow-hidden">
        {/* Fond noir subtil */}
        <div className="absolute inset-0 rounded-full bg-[#0A0A0F]/40" />

        {/* CERVEAU IA */}
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10"
        >
          <path d="M12 4.5a2.5 2.5 0 0 0-5 0 3 3 0 0 0-3 3 3 3 0 0 0-1 5.5 3 3 0 0 0 2 4 2.5 2.5 0 0 0 4 1.5" />
          <path d="M12 4.5a2.5 2.5 0 0 1 5 0 3 3 0 0 1 3 3 3 3 0 0 1 1 5.5 3 3 0 0 1-2 4 2.5 2.5 0 0 1-4 1.5" />
          <line x1="12" y1="4.5" x2="12" y2="20" />
          <circle cx="7" cy="9" r="0.8" fill="#FFFFFF" />
          <circle cx="17" cy="9" r="0.8" fill="#FFFFFF" />
          <circle cx="20" cy="5" r="0.9" fill="#FFFFFF" opacity="0.9" />
        </svg>

        {/* Effet shine (brillance qui tourne) */}
        {!noPulse && (
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
              animation: 'uq-rotate 4s linear infinite',
            }}
          />
        )}
      </div>

      {/* Badge notification */}
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            background: UQ_COLORS.red,
            boxShadow: `0 0 8px ${UQ_COLORS.red}`,
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Tooltip au hover */}
      <span
        className="absolute bottom-full right-0 mb-2 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: '#0A0A0F',
          color: '#FFFFFF',
          border: `1px solid ${UQ_COLORS.magenta}40`,
        }}
      >
        <Icon name="bot" size={20} tone="info" /> UQ AI — Assistant intelligent
      </span>
    </button>
  );
};

export default FixoIcon;

