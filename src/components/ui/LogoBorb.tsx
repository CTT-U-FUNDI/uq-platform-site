import React from 'react';

interface LogoBorbProps {
  size?: number;
  className?: string;
  /** Zoom pour cacher les bords noirs (par défaut 1.15 = 15% de zoom) */
  zoom?: number;
  /** Désactiver le rond (utile pour usage en watermark) */
  square?: boolean;
}

/**
 * Logo BORB — utilise le PNG réel
 * - Rond par défaut (border-radius: 50%)
 * - Zoom pour cacher les bords noirs de l'image originale
 * - Taille personnalisable
 */
export const LogoBorb: React.FC<LogoBorbProps> = ({
  size = 64,
  className = '',
  zoom = 1.15,
  square = false,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: square ? 0 : '50%',
        overflow: 'hidden',
        backgroundColor: '#0A0A0F',
        position: 'relative',
      }}
    >
      <img
        src="/assets/borb.png"
        alt="BORB"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          display: 'block',
        }}
        draggable={false}
      />
    </div>
  );
};

export default LogoBorb;
