import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
  error?: string;
}

export function Input({ icon, label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-uq-text-secondary text-sm mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-uq-text-muted">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-uq-card-light border border-uq-border rounded-ios
            ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4
            text-uq-text placeholder-uq-text-muted
            focus:outline-none focus:border-uq-blue-light
            transition-colors
            ${error ? 'border-uq-error' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="text-uq-error text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
