import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';

// ====================
// TYPES
// ====================

export type ScreenType =
  | 'login'
  | 'creation'
  | 'dashboard'
  | 'feed'
  | 'coffre'
  | 'zando'
  | 'trading'
  | 'chat'
  | 'profil'
  | 'lecteur'
  | 'studio'
  | 'player'
  | 'unknown';

interface ScreenContextValue {
  screen: ScreenType;
  setScreen: (screen: ScreenType) => void;
}

// ====================
// CONTEXT
// ====================

const ScreenContext = createContext<ScreenContextValue>({
  screen: 'unknown',
  setScreen: () => {},
});

// ====================
// PROVIDER
// ====================

export function ScreenProvider({ children }: { children: ReactNode }) {
  const [screen, setScreenState] = useState<ScreenType>(() => {
    // Deep-link : ?ecran=creation ouvre directement la création de compte
    // (utilisé par le wallet BORB pour renvoyer vers le site UQ).
    const demande = new URLSearchParams(window.location.search).get('ecran');
    if (demande === 'creation' || demande === 'login') return demande;
    // Récupérer du localStorage au démarrage
    const saved = localStorage.getItem('uq_current_screen') as ScreenType;
    return saved || 'unknown';
  });

  useEffect(() => {
    // Sauvegarder dans localStorage à chaque changement
    localStorage.setItem('uq_current_screen', screen);
  }, [screen]);

  const setScreen = useCallback((s: ScreenType) => setScreenState(s), []);

  return (
    <ScreenContext.Provider value={{ screen, setScreen }}>
      {children}
    </ScreenContext.Provider>
  );
}

// ====================
// HOOK
// ====================

export function useScreen(): ScreenContextValue {
  return useContext(ScreenContext);
}

export default ScreenProvider;
