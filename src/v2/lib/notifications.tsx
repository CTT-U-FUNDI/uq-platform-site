import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { describeError, getPreferences, type Preferences } from './api';
import { useSession } from './session';
import {
  getScreenNotifications,
  markScreenNotificationsRead,
  type ScreenNotification,
  type ScreenNotificationsResponse,
} from './trading';

/**
 * Notifications par ecran : le backend renvoie, pour le compte connecte, les
 * evenements stockes (trading, P2P, Zando) et les signaux derives d'un etat
 * reel (KYC, PIN du coffre, numero mobile money, messages non lus).
 * Le badge et le son systeme suivent ce flux — rien n'est simule ici.
 */

const SOUND_KEY = 'uq_notif_sound';
const POLL_MS = 20000;

export type SoundTone = 'info' | 'success' | 'alert';

interface ReadOptions {
  ids?: number[];
  scope?: string;
  references?: string[];
  all?: boolean;
}

interface NotificationsValue {
  ready: boolean;
  items: ScreenNotification[];
  counts: Record<string, number>;
  total: number;
  /** Objets encore vivants (ordre ouvert, commande P2P en attente, epargne
   *  verrouillee) : le backend les epingle en tete du flux. */
  totalEnCours: number;
  refresh: () => Promise<void>;
  markRead: (options: ReadOptions) => Promise<void>;
  soundEnabled: boolean;
  toggleSound: () => void;
  play: (tone?: SoundTone) => void;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

/** Son systeme genere a la volee (WebAudio) : aucun fichier a charger. */
function useSystemSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const ensure = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!contextRef.current) contextRef.current = new Ctor();
    if (contextRef.current.state === 'suspended') {
      contextRef.current.resume().catch(() => undefined);
    }
    return contextRef.current;
  }, []);

  // Les navigateurs bloquent l'audio avant la premiere interaction.
  useEffect(() => {
    const unlock = () => {
      ensure();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [ensure]);

  const play = useCallback(
    (tone: SoundTone = 'info') => {
      if (!enabled) return;
      const context = ensure();
      if (!context) return;
      const notes =
        tone === 'alert' ? [880, 660, 880] : tone === 'success' ? [660, 880] : [740];
      const start = context.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const at = start + index * 0.13;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.13, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.14);
      });
    },
    [enabled, ensure],
  );

  return play;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { authenticated, uq, toast } = useSession();
  const [feed, setFeed] = useState<ScreenNotificationsResponse | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<Preferences>({});
  const [ready, setReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== '0';
    } catch {
      return true;
    }
  });

  const play = useSystemSound(soundEnabled);
  const lastTotal = useRef<number | null>(null);
  const lastTopId = useRef(0);
  const busy = useRef(false);

  const refreshPreferences = useCallback(async () => {
    if (!authenticated || !uq) {
      setNotificationPreferences({});
      return;
    }
    try {
      const response = await getPreferences(uq);
      setNotificationPreferences(response.preferences || {});
    } catch {
      // Les préférences sont facultatives : les notifications restent activées par défaut.
    }
  }, [authenticated, uq]);

  useEffect(() => {
    void refreshPreferences();
    window.addEventListener('uq-notification-preferences-updated', refreshPreferences);
    return () => window.removeEventListener('uq-notification-preferences-updated', refreshPreferences);
  }, [refreshPreferences]);

  const load = useCallback(async () => {
    if (!authenticated || !uq) return;
    if (busy.current) return;
    busy.current = true;
    try {
      const response = await getScreenNotifications(uq);
      setFeed(response);
      setReady(true);
      const stored = (response.notifications || []).filter((entry) => entry.id > 0);
      const hiddenUnread = Object.entries(response.counts || {})
        .filter(([scope]) => !notificationScopeEnabled(scope, notificationPreferences))
        .reduce((total, [, count]) => total + count, 0);
      // Le flux est trié par état puis par heure : le plus grand identifiant
      // n'est donc plus forcément en tête.
      const topId = stored.reduce((sommet, entry) => Math.max(sommet, entry.id), 0);
      const total = Math.max(0, (response.total_unread || 0) - hiddenUnread);

      if (lastTotal.current !== null && total > lastTotal.current) {
        const fresh = stored.find(
          (entry) =>
            entry.id > lastTopId.current &&
            notificationScopeEnabled(entry.scope, notificationPreferences),
        );
        if (fresh) {
          const tone: SoundTone =
            fresh.scope === 'kyc' || fresh.scope === 'coffre' ? 'alert' : 'info';
          play(tone);
          toast(`${fresh.title}${fresh.body ? ` — ${fresh.body}` : ''}`, 'default');
        }
      }
      lastTotal.current = total;
      lastTopId.current = Math.max(lastTopId.current, topId);
    } catch {
      // Le flux de notifications ne doit jamais bloquer l'app.
    } finally {
      busy.current = false;
    }
  }, [authenticated, uq, play, toast, notificationPreferences]);

  useEffect(() => {
    if (!authenticated || !uq) {
      setFeed(null);
      setReady(false);
      lastTotal.current = null;
      lastTopId.current = 0;
      return;
    }
    load();
  }, [authenticated, uq, load]);

  useEffect(() => {
    if (!authenticated || !uq) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authenticated, uq, load]);

  const markRead = useCallback(
    async (options: ReadOptions) => {
      if (!uq) return;
      try {
        let selection = options;
        if (options.all && feed?.notifications.some((entry) => !notificationScopeEnabled(entry.scope, notificationPreferences))) {
          const ids = feed.notifications
            .filter((entry) => !entry.read && notificationScopeEnabled(entry.scope, notificationPreferences))
            .map((entry) => entry.id)
            .filter((id) => id > 0);
          if (ids.length === 0) return;
          selection = { ids };
        }
        await markScreenNotificationsRead({ uq, ...selection });
        lastTotal.current = null;
        await load();
      } catch (error) {
        toast(describeError(error, 'Notifications non mises a jour'), 'error');
      }
    },
    [uq, load, toast, feed, notificationPreferences],
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      const next = !current;
      try {
        localStorage.setItem(SOUND_KEY, next ? '1' : '0');
      } catch {
        // stockage indisponible
      }
      return next;
    });
  }, []);

  const value = useMemo<NotificationsValue>(() => {
    const sourceCounts = (feed?.counts || {}) as Record<string, number>;
    const counts = Object.fromEntries(
      Object.entries(sourceCounts).filter(([scope]) =>
        notificationScopeEnabled(scope, notificationPreferences),
      ),
    );
    const hiddenUnread = Object.entries(sourceCounts)
      .filter(([scope]) => !notificationScopeEnabled(scope, notificationPreferences))
      .reduce((total, [, count]) => total + count, 0);
    const items = (feed?.notifications || []).filter((entry) =>
      notificationScopeEnabled(entry.scope, notificationPreferences),
    );
    return {
      ready,
      items,
      counts,
      total: Math.max(0, (feed?.total_unread || 0) - hiddenUnread),
      totalEnCours: items.filter((entry) => entry.en_cours).length,
      refresh: load,
      markRead,
      soundEnabled,
      toggleSound,
      play,
    };
  }, [feed, ready, load, markRead, soundEnabled, toggleSound, play, notificationPreferences]);

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

function notificationScopeEnabled(scope: string, preferences: Preferences): boolean {
  const key =
    scope === 'chat'
      ? 'notify_chat'
      : scope === 'coffre'
        ? 'notify_wallet'
        : scope === 'trading'
          ? 'notify_trading'
          : scope === 'zando'
            ? 'notify_zando'
            : scope === 'kyc' || scope === 'system'
              ? 'notify_system'
              : null;
  if (!key) return true;
  const value = preferences[key];
  return value !== false && value !== 'false';
}

export function useNotifications(): NotificationsValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications doit etre utilise dans NotificationsProvider');
  }
  return context;
}
