import { useMemo } from 'react';

/**
 * Les graphiques v2 suivent les tokens CSS de la racine : ils sont relus au
 * changement de thème pour rester lisibles en thème clair comme en sombre.
 */
export interface ChartTokens {
  line: string;
  gold: string;
  goldSoft: string;
  positive: string;
  negative: string;
  grid: string;
  tick: string;
  ink: string;
  surface: string;
  border: string;
}

export function useChartTokens(theme: string): ChartTokens {
  return useMemo(() => {
    const host = document.querySelector('.v2-root') || document.documentElement;
    const token = (name: string) => getComputedStyle(host).getPropertyValue(name).trim();
    const fallback = (value: string, elseValue: string) => value || elseValue;
    return {
      line: fallback(token('--v2-accent'), 'currentColor'),
      gold: fallback(token('--v2-gold'), token('--v2-accent') || 'currentColor'),
      goldSoft: fallback(token('--v2-gold-soft'), 'rgba(201, 162, 39, 0.18)'),
      positive: fallback(token('--v2-positive'), 'currentColor'),
      negative: fallback(token('--v2-negative'), token('--v2-accent') || 'currentColor'),
      grid: fallback(token('--v2-surface-3'), 'currentColor'),
      tick: fallback(token('--v2-ink-3'), 'currentColor'),
      ink: fallback(token('--v2-ink'), 'currentColor'),
      surface: fallback(token('--v2-surface'), 'transparent'),
      border: fallback(token('--v2-line'), token('--v2-surface-3')),
    };
  }, [theme]);
}

/** Style de bulle aligné sur la carte, pour tous les Tooltip recharts. */
export function tooltipStyle(tokens: ChartTokens) {
  return {
    background: tokens.surface,
    border: `1px solid ${tokens.border}`,
    borderRadius: 12,
    color: tokens.ink,
    fontSize: 12,
  };
}

/** Fenêtres acceptées par les routes d'agrégation (`?periode=`). */
export type SeriesPeriod = '7j' | '30j' | '1an';

export const SERIES_PERIODS: { value: SeriesPeriod; label: string }[] = [
  { value: '7j', label: '7 j' },
  { value: '30j', label: '30 j' },
  { value: '1an', label: '1 an' },
];

/** « 2026-10-05 » → « 05/10 » (libellé court de l'axe horizontal). */
export const jourLabel = (date: string): string => {
  const parts = date.split('-');
  if (parts.length < 3) return date;
  return `${parts[2]}/${parts[1]}`;
}

/** Libellé « jj/mm hh:mm » à partir d'un horodatage en secondes. */
export const horodatageLabel = (secondes: number): string => {
  const date = new Date(secondes * 1000);
  if (Number.isNaN(date.getTime())) return String(secondes);
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${deux(date.getDate())}/${deux(date.getMonth() + 1)} ${deux(date.getHours())}:${deux(date.getMinutes())}`;
};
