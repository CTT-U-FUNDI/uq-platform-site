import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HelpSheet } from '../components/HelpSheet';
import type { GuideTopic } from './guides';

/**
 * Point d'entrée unique de l'aide : n'importe quel écran appelle
 * `openHelp('trading')` (ou `openHelp()` pour le sommaire) sans porter la prose.
 */
interface HelpApi {
  openHelp: (topic?: GuideTopic | null) => void;
  closeHelp: () => void;
  open: boolean;
  topic: GuideTopic | null;
}

const HelpContext = createContext<HelpApi | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<GuideTopic | null>(null);

  const openHelp = useCallback((next?: GuideTopic | null) => {
    setTopic(next ?? null);
    setOpen(true);
  }, []);
  const closeHelp = useCallback(() => setOpen(false), []);

  const api = useMemo(
    () => ({ openHelp, closeHelp, open, topic }),
    [openHelp, closeHelp, open, topic],
  );

  return <HelpContext.Provider value={api}>{children}</HelpContext.Provider>;
}

/**
 * Hôte du guide : rendu dans le cadre de l'app pour que la feuille
 * s'ancre au téléphone, pas à la fenêtre du navigateur.
 */
export function HelpHost() {
  const api = useContext(HelpContext);

  useEffect(() => {
    if (!api?.open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') api.closeHelp();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [api]);

  if (!api?.open) return null;

  return (
    <div className="v2-help-host">
      <HelpSheet key={api.topic || 'index'} topic={api.topic} onClose={api.closeHelp} />
    </div>
  );
}

export function useHelp(): HelpApi {
  const api = useContext(HelpContext);
  // Hors provider (tests, aperçu isolé) : on n'échoue pas, l'aide est simplement inactive.
  return api ?? { openHelp: () => undefined, closeHelp: () => undefined, open: false, topic: null };
}
