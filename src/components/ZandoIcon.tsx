import React from 'react';

interface ZandoIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Icône Zando — Un "Z" stylisé moderne
 * Représente la marketplace décentralisée UQ
 */
export const ZandoIcon: React.FC<ZandoIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* LETTRE Z STYLISÉE */}
      {/* Barre du haut */}
      <path 
        d="M6 5 L18 5" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      {/* Diagonale du Z */}
      <path 
        d="M18 5 L6 19" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      {/* Barre du bas */}
      <path 
        d="M6 19 L18 19" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      {/* Petit point/éclat pour le côté "marketplace" */}
      <circle cx="20" cy="5" r="1.5" fill={color} />
    </svg>
  );
};

export default ZandoIcon;
