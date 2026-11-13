import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon, type IconName } from './Icon';
import { useKeyboardInset } from '../lib/hooks';
import { useSession } from '../lib/session';
import { initials } from '../lib/format';

/* ============================ Header ============================ */

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  large,
  dense,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
  dense?: boolean;
}) {
  return (
    <header className={`v2-topbar ${dense ? 'v2-topbar--dense' : ''}`.trim()}>
      {onBack && (
        <button className="v2-icon-btn v2-icon-btn--plain" onClick={onBack} aria-label="Retour">
          <Icon name="back" size={22} />
        </button>
      )}
      <div style={{ minWidth: 0 }}>
        <div
          className={large ? 'v2-h1' : 'v2-topbar-title'}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {title}
        </div>
        {subtitle && <div className="v2-topbar-sub">{subtitle}</div>}
      </div>
      {right && <div className="v2-topbar-actions">{right}</div>}
    </header>
  );
}

/* ============================ Surfaces ============================ */

export function Card({
  children,
  onClick,
  padded = true,
  style,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  padded?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const base = `v2-card ${padded ? '' : ''} ${className}`.trim();
  if (onClick) {
    return (
      <button
        className={base}
        onClick={onClick}
        style={{ textAlign: 'left', width: '100%', ...style }}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={base} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="v2-section-title">
      <span>{children}</span>
      {action}
    </div>
  );
}

/*
 * Ligne d'indication compacte : un picto + quelques mots.
 * Remplace les phrases d'explication qui encombraient le flux.
 */
export function Hint({
  icon = 'info',
  tone = 'neutral',
  children,
  onClick,
  chevron,
}: {
  icon?: IconName;
  tone?: 'neutral' | 'accent' | 'warning' | 'positive';
  children: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const content = (
    <>
      <Icon name={icon} size={15} />
      <span className="v2-hint-text">{children}</span>
      {(chevron || onClick) && <Icon name="forward" size={14} />}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="v2-hint" data-tone={tone} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div className="v2-hint" data-tone={tone}>
      {content}
    </div>
  );
}

export function List({ children, plain }: { children: ReactNode; plain?: boolean }) {
  return <div className={`v2-list ${plain ? 'v2-list--plain' : ''}`}>{children}</div>;
}

export function Row({
  icon,
  iconTone = 'neutral',
  avatar,
  title,
  subtitle,
  value,
  valueTone,
  chevron,
  onClick,
  right,
}: {
  icon?: IconName;
  iconTone?: 'neutral' | 'accent' | 'green' | 'amber';
  avatar?: { label: string; src?: string; icon?: IconName; presence?: boolean };
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  valueTone?: 'default' | 'positive' | 'negative';
  chevron?: boolean;
  onClick?: () => void;
  right?: ReactNode;
}) {
  const content = (
    <>
      {avatar ? (
        <Avatar
          label={avatar.label}
          src={avatar.src}
          icon={avatar.icon}
          presence={avatar.presence}
        />
      ) : null}
      {icon ? <IconTile name={icon} tone={iconTone} /> : null}
      <div className="v2-row-main">
        <div className="v2-row-title">{title}</div>
        {subtitle ? <div className="v2-row-sub">{subtitle}</div> : null}
      </div>
      {value !== undefined && (
        <div
          className="v2-row-value"
          style={{
            color:
              valueTone === 'positive'
                ? 'var(--v2-positive)'
                : valueTone === 'negative'
                  ? 'var(--v2-negative)'
                  : undefined,
          }}
        >
          {value}
        </div>
      )}
      {right}
      {chevron && <Icon name="forward" size={17} style={{ color: 'var(--v2-ink-3)', flex: 'none' }} />}
    </>
  );

  if (onClick) {
    return (
      <button className="v2-row" onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className="v2-row">{content}</div>;
}

export function IconTile({
  name,
  tone = 'neutral',
  size = 42,
}: {
  name: IconName;
  tone?: 'neutral' | 'accent' | 'green' | 'amber';
  size?: number;
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: 'var(--v2-surface-2)', fg: 'var(--v2-ink-2)' },
    accent: { bg: 'var(--v2-accent-soft)', fg: 'var(--v2-accent)' },
    green: { bg: 'var(--v2-positive-soft)', fg: 'var(--v2-positive)' },
    amber: { bg: 'var(--v2-warning-soft)', fg: 'var(--v2-warning)' },
  };
  const palette = tones[tone] || tones.neutral;
  return (
    <span
      className="v2-icon-tile"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        flex: 'none',
        borderRadius: 14,
        background: palette.bg,
        color: palette.fg,
      }}
    >
      <Icon name={name} size={Math.round(size * 0.48)} />
    </span>
  );
}

export function Avatar({
  label,
  src,
  icon,
  size = 42,
  presence,
}: {
  label: string;
  src?: string;
  /** Service (UQ AI) : la meme pastille ronde, mais un glyph SVG au lieu des initiales. */
  icon?: IconName;
  size?: number;
  /** Activite mesuree par le serveur : un point vert, jamais une supposition. */
  presence?: boolean;
}) {
  const pastille = (
    <span
      className={`v2-avatar ${src ? '' : 'v2-avatar--plain'} ${icon ? 'v2-avatar--icon' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {src ? <img src={src} alt="" /> : icon ? <Icon name={icon} size={Math.round(size * 0.5)} /> : initials(label)}
    </span>
  );
  if (!presence) return pastille;
  return (
    <span className="v2-avatar-wrap" style={{ width: size, height: size }}>
      {pastille}
      <span className="v2-avatar-presence" title="En ligne" />
    </span>
  );
}

/* ============================ Boutons ============================ */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  block?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
};

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`v2-btn v2-btn--${variant} ${size === 'sm' ? 'v2-btn--sm' : ''} ${
        block ? 'v2-btn--block' : ''
      } ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="v2-spinner" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={18} /> : null}
    </button>
  );
}

export function IconButton({
  name,
  onClick,
  label,
  plain,
  badge,
  compact,
}: {
  name: IconName;
  onClick?: () => void;
  label: string;
  plain?: boolean;
  badge?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      className={`v2-icon-btn ${plain ? 'v2-icon-btn--plain' : ''} ${
        compact ? 'v2-icon-btn--sm' : ''
      }`.trim()}
      onClick={onClick}
      aria-label={label}
      data-alert={badge ? 'true' : undefined}
      style={{ position: 'relative', flex: 'none' }}
    >
      <Icon name={name} size={compact ? 18 : 21} />
      {badge && <span className="v2-icon-dot" />}
    </button>
  );
}

/* ============================ Champs ============================ */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="v2-field">
      {label && <span className="v2-label">{label}</span>}
      {children}
      {error ? (
        <span style={{ fontSize: 12.5, color: 'var(--v2-negative)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 12.5, color: 'var(--v2-ink-3)' }}>{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="v2-input" style={style} {...rest} />;
}

export function Textarea({ style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="v2-textarea" style={style} {...rest} />;
}

/**
 * Champ numero UQ : le prefixe « UQ- » est fixe, l'utilisateur ne saisit que
 * les chiffres. La valeur remontee reste complete (`UQ-123…`) pour l'API.
 */
export function UqInput({
  value,
  onChange,
  placeholder = '00000000',
  disabled,
  autoFocus,
  onEnter,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  const digits = value.replace(/^UQ-/i, '').replace(/\D/g, '');
  return (
    <div className="v2-input-group">
      <span aria-hidden style={{ fontWeight: 750, color: 'var(--v2-ink-2)', flex: 'none' }}>
        UQ-
      </span>
      <input
        value={digits}
        onChange={(event) => onChange(`UQ-${event.target.value.replace(/\D/g, '')}`)}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="username"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={disabled}
        autoFocus={autoFocus}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onEnter?.();
        }}
      />
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="v2-input-group">
      <Icon name="search" size={18} style={{ color: 'var(--v2-ink-3)', flex: 'none' }} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Effacer"
          style={{ color: 'var(--v2-ink-3)', display: 'grid', placeItems: 'center' }}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

/* ============================ Segmented ============================ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size,
}: {
  options: { value: NoInfer<T>; label: string; icon?: IconName }[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  size?: 'md' | 'sm';
}) {
  const hote = useRef<HTMLDivElement>(null);

  // Les etaules gardent leur largeur naturelle : quand elles depassent
  // l'ecran, l'onglet actif reste amene dans la zone visible.
  useEffect(() => {
    const racine = hote.current;
    if (!racine) return;
    const enfants = Array.from(racine.children) as HTMLElement[];
    enfants
      .find((element) => element.dataset.value === value)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [value, options.length]);

  return (
    <div className={`v2-segmented ${size === 'sm' ? 'v2-segmented--sm' : ''}`} role="tablist" ref={hote}>
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={option.value === value}
          className="v2-segment"
          data-active={option.value === value}
          data-value={option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <Icon name={option.icon} size={size === 'sm' ? 15 : 17} />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button className="v2-chip" data-active={Boolean(active)} onClick={onClick}>
      {children}
    </button>
  );
}

/* ============================ Proposition ============================ */

/**
 * Suggestion discrete sous un champ : l'utilisateur accepte d'un geste
 * ou continue de saisir. Aucun etat n'est modifie sans son action.
 */
export function Proposal({
  label,
  value,
  onUse,
}: {
  label: string;
  value: string;
  onUse: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -4 }}>
      <div className="v2-muted" style={{ fontSize: 12.5, flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 650 }}>{label} : </span>
        {value}
      </div>
      <Button size="sm" variant="secondary" onClick={onUse}>
        Utiliser
      </Button>
    </div>
  );
}

/* ============================ Sheet ============================ */

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  full,
  centered,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  full?: boolean;
  centered?: boolean;
  className?: string;
}) {
  // Remonte la feuille quand le clavier recouvre la zone visible (iOS, anciens Android).
  const insetClavier = useKeyboardInset();
  // Une feuille fermee ne reserve rien : le decalage ne vaut que pour l'affichage.
  const keyboardOffset = open ? insetClavier : 0;

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // Centree : le panneau se recentre dans la zone libre au-dessus du clavier.
  const styleCentree =
    centered && keyboardOffset
      ? { marginTop: `-${keyboardOffset}px`, maxHeight: `calc(84% - ${keyboardOffset}px)` }
      : undefined;

  return (
    <>
      <div className="v2-backdrop" onClick={onClose} />
      <div
        className={`v2-sheet ${full ? 'v2-sheet--full' : ''} ${centered ? 'v2-sheet--center' : ''} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={
          styleCentree ??
          (!full && !centered && keyboardOffset
            ? { bottom: keyboardOffset, maxHeight: `calc(92% - ${keyboardOffset}px)` }
            : undefined)
        }
      >
        <div className="v2-sheet-handle" />
        {(title || subtitle) && (
          <div className="v2-sheet-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <div className="v2-sheet-title">{title}</div>}
              {subtitle && <div className="v2-muted">{subtitle}</div>}
            </div>
            <button className="v2-icon-btn v2-icon-btn--plain" onClick={onClose} aria-label="Fermer">
              <Icon name="close" size={20} />
            </button>
          </div>
        )}
        <div className="v2-sheet-body">{children}</div>
        {footer && <div className="v2-sheet-foot">{footer}</div>}
      </div>
    </>
  );
}

/* ============================ Etats ============================ */

export function Loader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '56px 0',
        color: 'var(--v2-ink-3)',
      }}
    >
      <span className="v2-spinner" style={{ color: 'var(--v2-accent)' }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export function Skeleton({
  height = 16,
  width = '100%',
  radius = 8,
}: {
  height?: number;
  width?: number | string;
  radius?: number;
}) {
  return <div className="v2-skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function EmptyState({
  icon = 'info',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="v2-empty">
      <span className="v2-empty-icon">
        <Icon name={icon} size={26} />
      </span>
      <div className="v2-h3" style={{ color: 'var(--v2-ink)' }}>
        {title}
      </div>
      {description && <div style={{ fontSize: 13.5, maxWidth: 280 }}>{description}</div>}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="v2-empty">
      <span className="v2-empty-icon" style={{ background: 'var(--v2-negative-soft)', color: 'var(--v2-negative)' }}>
        <Icon name="alert" size={26} />
      </span>
      <div className="v2-h3" style={{ color: 'var(--v2-ink)' }}>
        Impossible de charger
      </div>
      <div style={{ fontSize: 13.5, maxWidth: 300 }}>{message}</div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon="refresh" style={{ marginTop: 10 }}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

/* ============================ Donnees ============================ */

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        className="v2-muted"
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {icon ? <Icon name={icon} size={12} /> : null}
        {label}
      </div>
      <div className="v2-amount" style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>
        {value}
      </div>
      {hint && <div className="v2-muted" style={{ fontSize: 11.5 }}>{hint}</div>}
    </div>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="v2-row-between" style={{ padding: '9px 0' }}>
      <span className="v2-muted">{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/* ============================ Toasts ============================ */

export function ToastHost() {
  const { toasts, dismissToast } = useSession();
  if (toasts.length === 0) return null;
  return (
    <div className="v2-toast-host">
      {toasts.map((entry) => (
        <button
          key={entry.id}
          className="v2-toast"
          data-tone={entry.tone}
          onClick={() => dismissToast(entry.id)}
          style={{ pointerEvents: 'auto', textAlign: 'left' }}
        >
          {entry.message}
        </button>
      ))}
    </div>
  );
}
