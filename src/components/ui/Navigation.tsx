import React from 'react';
import { useLanguage, type MessageKey } from '../../i18n/LanguageContext';
import { GlassIcon } from './GlassIcon';
import { Icon, type IconName, type IconTone } from './Icon';
import type { GlassIconTone } from './GlassIcon';

interface NavigationProps {
  active: 'coffre' | 'trading' | 'marche' | 'chat' | 'profil';
  onNavigate: (screen: string) => void;
  onPlusClick?: () => void;
}

const ITEMS: Array<{
  id: NavigationProps['active'];
  name: IconName;
  tone: IconTone;
  glass: GlassIconTone;
  labelKey: MessageKey;
  fallback: string;
  isCentral?: boolean;
}> = [
  { id: 'coffre', name: 'wallet', tone: 'brand', glass: 'brand', labelKey: 'nav.wallet', fallback: 'Coffre' },
  { id: 'trading', name: 'trendingUp', tone: 'success', glass: 'success', labelKey: 'nav.trading', fallback: 'Trading' },
  { id: 'marche', name: 'store', tone: 'brand', glass: 'brand', labelKey: 'nav.market', fallback: 'ZANDO', isCentral: true },
  { id: 'chat', name: 'message', tone: 'info', glass: 'info', labelKey: 'nav.chat', fallback: 'Chat' },
  { id: 'profil', name: 'user', tone: 'muted', glass: 'neutral', labelKey: 'nav.profile', fallback: 'Profil' },
];

export function Navigation({ active, onNavigate, onPlusClick }: NavigationProps) {
  const { t } = useLanguage();

  return (
    <nav className="shrink-0 fixed bottom-0 left-0 right-0 z-50 pointer-events-auto border-t border-[var(--uq-border)] bg-[var(--uq-bg-primary)]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center h-16 w-full max-w-4xl mx-auto px-2 sm:px-6">
        {ITEMS.map((item) => {
          const label = item.id === 'marche' ? item.fallback : t(item.labelKey) || item.fallback;

          if (item.isCentral) {
            return (
              <button
                key={item.id}
                onClick={onPlusClick}
                className="group relative -mt-8 flex flex-col items-center justify-center min-w-0 min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uq-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--uq-bg-primary)]"
                aria-label={label}
              >
                <div className="absolute top-0 w-14 h-14 rounded-full bg-[var(--uq-brand)]/10 blur-xl opacity-70" />
                <GlassIcon tone="brand" size={56} className="relative rounded-full">
                  <Icon name={item.name} size={26} tone="brand" strokeWidth={1.9} />
                </GlassIcon>
                <span className="uq-label-md text-[var(--uq-brand)] mt-1.5">{label}</span>
              </button>
            );
          }

          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="group flex flex-col items-center justify-center gap-1 py-2 px-1 min-w-0 min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uq-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--uq-bg-primary)]"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <GlassIcon tone={isActive ? item.glass : 'neutral'} size={40}>
                <Icon name={item.name} size={22} tone={isActive ? item.tone : 'muted'} />
              </GlassIcon>
              <span
                className="uq-label-md tracking-wide"
                style={{ color: isActive ? `var(--uq-${TONE_COLOR[item.tone]})` : 'var(--uq-text-secondary)' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const TONE_COLOR: Record<IconTone, string> = {
  brand: 'brand',
  success: 'green',
  info: 'blue',
  warning: 'amber',
  muted: 'text-secondary',
  inherit: 'brand',
};
