import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: (value: T | null) => void;
}

/**
 * Chargement asynchrone avec etat et relance manuelle.
 * `deps` doit rester stable en taille et en ordre.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const enabled = options.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loaderRef
      .current()
      .then((result) => {
        if (cancelled || !mounted.current) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled || !mounted.current) return;
        const message =
          typeof err === 'object' && err !== null
            ? (err as { response?: { data?: { message?: string } }; message?: string }).response?.data
                ?.message ||
              (err as { message?: string }).message ||
              'Chargement impossible'
            : 'Chargement impossible';
        setError(message);
      })
      .finally(() => {
        if (cancelled || !mounted.current) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, enabled, ...deps]);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  // Reconnexion : tant qu'un chargement a raté, ou qu'il a été resservi depuis
  // le cache local (marker `hors_ligne` posé par lib/api.ts), l'écran affiche
  // une valeur périmée. Sans relais, elle le resterait jusqu'au rechargement
  // manuel de la page ; dès que le réseau revient on relance le chargement.
  const chargeRatee = error !== null;
  const sertieDuCache = Boolean((data as { hors_ligne?: boolean } | null)?.hors_ligne);
  useEffect(() => {
    if (!enabled || (!chargeRatee && !sertieDuCache)) return;
    const surReconnexion = () => setTick((value) => value + 1);
    window.addEventListener('online', surReconnexion);
    return () => window.removeEventListener('online', surReconnexion);
  }, [enabled, chargeRatee, sertieDuCache]);

  return { data, loading, error, reload, setData };
}

/** Polling simple pour les donnees "temps reel" du backend (REST only). */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => saved.current(), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
}

/** Retarde la valeur pour eviter de spammer la recherche. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Compteur : interpole doucement vers la nouvelle valeur (montants du coffre).
 * Desactive par prefers-reduced-motion et en cas de valeur non finie.
 */
export function useAnimatedNumber(value: number, duration = 620): number {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !Number.isFinite(value)) {
      current.current = value;
      setDisplay(value);
      return;
    }

    const from = current.current;
    const delta = value - from;
    if (Math.abs(delta) < 0.005) {
      current.current = value;
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const ratio = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - ratio, 3);
      const next = from + delta * eased;
      current.current = next;
      setDisplay(next);
      if (ratio < 1) frame = requestAnimationFrame(step);
      else current.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

/**
 * Hauteur recouverte par le clavier virtuel (0 quand il est ferme).
 * Un element ancre en bas de l'ecran l'utilise pour rester au-dessus des touches.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;

    /* Certains webviews n'exposent pas visualViewport : la fenetre retrecit
       quand le clavier s'ouvre. On compare donc a la plus grande hauteur vue. */
    if (!viewport) {
      let reference = window.innerHeight;
      const repli = () => {
        reference = Math.max(reference, window.innerHeight);
        const recouvre = reference - window.innerHeight;
        setInset(recouvre > 120 ? Math.round(recouvre) : 0);
      };
      repli();
      window.addEventListener('resize', repli);
      return () => window.removeEventListener('resize', repli);
    }

    const update = () => {
      const overlap = window.innerHeight - (viewport.height + viewport.offsetTop);
      setInset(overlap > 120 ? Math.round(overlap) : 0);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
