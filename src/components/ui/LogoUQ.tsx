interface LogoUQProps {
  size?: number;
  variant?: 'default' | 'login' | 'header' | 'profile' | 'receipt';
  animated?: boolean;
  className?: string;
}

const SIZES = {
  default: 48,
  login: 120,
  header: 32,
  profile: 80,
  receipt: 24,
};

export function LogoUQ({
  size,
  variant = 'default',
  animated = false,
  className = '',
}: LogoUQProps) {
  const finalSize = size ?? SIZES[variant];

  return (
    <span
      className={`uq-brand-logo ${animated ? 'uq-brand-logo--animated' : ''} ${className}`.trim()}
      style={{ width: finalSize, height: finalSize }}
      role="img"
      aria-label="UQ Platform"
    >
      <img src="/assets/uq-mark.svg" alt="" width={finalSize} height={finalSize} draggable={false} />
    </span>
  );
}
