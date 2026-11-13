import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };
  
  return (
    <div
      onClick={onClick}
      className={`
        uq-glass-card
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
