import React from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, rightAction }) => {
  return (
    <header className="uq-screen-header">
      <div className="uq-screen-header-inner">
        {onBack && (
          <button type="button" onClick={onBack} className="uq-icon-btn" aria-label="Retour">
            <Icon name="arrowLeft" size={18} tone="inherit" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="uq-screen-title truncate">{title}</h1>
          {subtitle ? <div className="uq-screen-subtitle truncate">{subtitle}</div> : null}
        </div>
        {rightAction}
      </div>
    </header>
  );
};

export default Header;
