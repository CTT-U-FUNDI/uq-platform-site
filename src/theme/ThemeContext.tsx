import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';

// ====================
// TYPES
// ====================

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  isDark: boolean;
}

// ====================
// CONTEXT
// ====================

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'uq_theme_mode';

// ====================
// PROVIDER
// ====================

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const preference = localStorage.getItem('uq_theme');
    const saved = preference === 'auto' ? '' : preference || localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    // Appliquer au <html>
    document.documentElement.setAttribute('data-theme', mode);
    if (mode === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    let media: MediaQueryList | null = null;
    let updateMode: (() => void) | null = null;
    const syncPreference = () => {
      if (media && updateMode) media.removeEventListener('change', updateMode);
      media = null;
      updateMode = null;
      if (localStorage.getItem('uq_theme') !== 'auto') return;
      const activeMedia = window.matchMedia('(prefers-color-scheme: light)');
      const applyMode = () => setModeState(activeMedia.matches ? 'light' : 'dark');
      media = activeMedia;
      updateMode = applyMode;
      applyMode();
      activeMedia.addEventListener('change', applyMode);
    };
    syncPreference();
    window.addEventListener('uq:theme-preference-change', syncPreference);
    return () => {
      window.removeEventListener('uq:theme-preference-change', syncPreference);
      if (media && updateMode) media.removeEventListener('change', updateMode);
    };
  }, []);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggle = useCallback(() => setModeState(prev => prev === 'dark' ? 'light' : 'dark'), []);

  const value: ThemeContextValue = {
    mode,
    setMode,
    toggle,
    isDark: mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ====================
// HOOK
// ====================

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans <ThemeProvider>');
  return ctx;
}

// ====================
// HELPER : variables CSS selon le thème
// ====================

export const THEME_VARS_CSS = `
:root,
html.dark {
  --uq-bg: #07090D;
  --uq-bg-secondary: #0D121B;
  --uq-card: #0D121B;
  --uq-card-light: #141B27;
  --uq-border: rgba(255, 255, 255, 0.08);
  --uq-border-light: rgba(255, 255, 255, 0.14);

  --uq-text: #FFFFFF;
  --uq-text-secondary: #94A3B8;
  --uq-text-muted: #64748B;

  --uq-red: #F87171;
  --uq-magenta: #38BDF8;
  --uq-purple: #8B5CF6;
  --uq-blue: #38BDF8;
  --uq-green: #34D399;
  --uq-yellow: #38BDF8;

  --uq-gradient: linear-gradient(90deg, #0284C7 0%, #38BDF8 52%, #7DD3FC 100%);
}

html.light {
  --uq-bg: #FFFFFF;
  --uq-bg-secondary: #F5F5F7;
  --uq-card: #FFFFFF;
  --uq-card-light: #F0F0F3;
  --uq-border: #E5E5E7;
  --uq-border-light: #D5D5D7;

  --uq-text: #0B0E11;
  --uq-text-secondary: #6B7280;
  --uq-text-muted: #9CA3AF;

  --uq-red: #FF3B30;
  --uq-magenta: #00B8D4;
  --uq-purple: #8B5CF6;
  --uq-blue: #00B8D4;
  --uq-green: #10B981;
  --uq-yellow: #00B8D4;

  --uq-gradient: linear-gradient(90deg, #0284C7 0%, #38BDF8 52%, #7DD3FC 100%);
}

/* Application globale */
body {
  background-color: var(--uq-bg);
  color: var(--uq-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}
`;

export default ThemeProvider;
