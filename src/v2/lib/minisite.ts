import type { MediaAdjust, SiteMedia } from './api';

/**
 * Rendu partagé du mini-site : l'éditeur (Studio) et la fiche publique
 * (BoutiqueSite) appliquent exactement les mêmes réglages et la même durée,
 * pour que le visiteur voie ce que le vendeur a calibré.
 */

/** Filtre CSS des réglages colorimétriques (luminosité, contraste, brillance…). */
export function mediaFilter(a: MediaAdjust): string {
  let f = `brightness(${a.brightness / 100}) contrast(${a.contrast / 100}) saturate(${a.saturation / 100})`;
  if (a.highlights) f += ` brightness(${(1 + a.highlights / 280).toFixed(3)}) contrast(${(1 - a.highlights / 600).toFixed(3)})`;
  if (a.shadows) f += ` brightness(${(1 + a.shadows / 320).toFixed(3)}) contrast(${(1 - a.shadows / 700).toFixed(3)})`;
  if (a.sharp) f += ` contrast(${(1 + a.sharp / 500).toFixed(3)})`;
  if (a.warmth > 0) f += ` sepia(${(a.warmth / 260).toFixed(3)})`;
  else if (a.warmth < 0) f += ` hue-rotate(${(a.warmth * 0.25).toFixed(1)}deg)`;
  if (a.hue) f += ` hue-rotate(${a.hue}deg)`;
  return f;
}

/** Durée source conservée après coupe (somme des morceaux). */
export const segsDuree = (m: SiteMedia): number => m.segs.reduce((s, x) => s + (x.end - x.start), 0);

/** Durée de lecture effective : la coupe et la vitesse la raccourcissent. */
export const mediaDuree = (m: SiteMedia): number => (m.type === 'video' ? segsDuree(m) / (m.speed || 1) : 0);

/** « 0:24 » — horodatage court des timelines et compteurs. */
export const fmtDuree = (s: number): string => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};