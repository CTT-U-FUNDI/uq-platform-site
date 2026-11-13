import { ReactNode } from 'react';

/** Tones du thème : marque + sémantiques + neutre. Les anciens noms restent acceptés. */
export type GlassIconTone =
  | 'brand'
  | 'success'
  | 'info'
  | 'warning'
  | 'neutral'
  // alias historiques
  | 'cyan'
  | 'high'
  | 'medium'
  | 'low';

interface GlassIconProps {
  children: ReactNode;
  tone?: GlassIconTone;
  size?: number;
  className?: string;
  label?: string;
}

export function GlassIcon({
  children,
  tone = 'brand',
  size = 44,
  className = '',
  label,
}: GlassIconProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      className={`uq-glass-icon uq-glass-icon-${tone} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="uq-glass-icon__glyph">{children}</span>
    </span>
  );
}
