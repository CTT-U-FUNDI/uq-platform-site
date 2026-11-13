import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'uq-btn-primary',
  secondary: 'uq-btn-secondary',
  outline: 'uq-btn-secondary',
  danger: 'uq-btn-danger',
  success: 'uq-btn-success',
  ghost: 'uq-btn-ghost',
};

const SIZE_CLASS: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'uq-btn--sm',
  md: '',
  lg: 'uq-btn--lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`uq-btn ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`.replace(/\s+/g, ' ').trim()}
  >
    {children}
  </button>
);

export default Button;
