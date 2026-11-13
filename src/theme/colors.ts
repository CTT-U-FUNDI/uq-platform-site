// ====================
// UQ PLATFORM — PALETTE (miroir JS des tokens CSS)
// Rouge = marque · Vert = succès · Bleu = information · Ambre = attention
// Ne pas dupliquer : les valeurs viennent de theme/ramp.js, mêmes tokens que Tailwind.
// ====================

import { UQ_HEX } from './ramp.js';

const red = UQ_HEX.red;
const green = UQ_HEX.green;
const blue = UQ_HEX.blue;
const amber = UQ_HEX.amber;
const ink = UQ_HEX.ink;

export const UQ_COLORS = {
  // ===== Marque (rouge UQ) =====
  brand: red[500],
  red: red[500],
  redLight: red[300],
  redDark: red[600],
  redDeep: red[700],
  redSoft: 'rgba(234, 67, 53, 0.12)',

  // ===== Sémantique =====
  green: green[500],
  greenLight: green[300],
  greenDark: green[600],
  greenSoft: 'rgba(15, 190, 124, 0.12)',

  blue: blue[500],
  blueLight: blue[300],
  blueDark: blue[600],
  blueSoft: 'rgba(26, 115, 232, 0.12)',

  amber: amber[300],
  amberDark: amber[500],
  amberSoft: 'rgba(249, 171, 0, 0.14)',

  // ===== Alias dépréciés (palette unifiée) =====
  magenta: blue[500],
  magentaLight: blue[300],
  magentaDark: blue[600],
  purple: red[500],
  purpleLight: red[300],
  purpleDark: red[600],
  violet: red[500],
  pink: red[400],
  gold: amber[300],
  goldDark: amber[500],
  yellow: amber[300],
  yellowDark: amber[500],
  gray: ink[500],
  cyan: blue[400],
  high: red[500],
  medium: amber[300],
  low: blue[400],

  // ===== Neutres Dark =====
  bg: '#07090D',
  bgSecondary: '#0D121B',
  bgTertiary: '#141B27',
  bgHover: '#1A2433',
  card: '#0D121B',
  cardLight: '#141B27',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',

  // ===== Texte =====
  text: ink[200],
  textSecondary: ink[500],
  textMuted: ink[600],

  // ===== Neutres Light =====
  lightBg: '#FFFFFF',
  lightBgSecondary: ink[50],
  lightCard: '#FFFFFF',
  lightCardHover: ink[100],
  lightBorder: ink[300],
  lightText: ink[900],
  lightTextSecondary: ink[700],
  lightTextMuted: ink[600],

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const UQ_SCALES = { red, green, blue, amber, ink };

// ===== Gradients UQ =====
export const UQ_GRADIENTS = {
  // Dégradé de marque — rouge UQ
  main: `linear-gradient(110deg, ${red[600]} 0%, ${red[500]} 52%, ${red[300]} 100%)`,
  vertical: `linear-gradient(180deg, ${red[600]} 0%, ${red[500]} 52%, ${red[300]} 100%)`,
  diagonal: `linear-gradient(135deg, ${red[600]} 0%, ${red[500]} 55%, ${red[700]} 100%)`,
  // Réussite / dépôt
  green: `linear-gradient(110deg, ${green[700]} 0%, ${green[500]} 55%, ${green[300]} 100%)`,
  // Information
  blue: `linear-gradient(110deg, ${blue[600]} 0%, ${blue[500]} 50%, ${blue[300]} 100%)`,
  // Fonds subtils
  subtle: `linear-gradient(135deg, rgba(234,67,53,0.10) 0%, rgba(234,67,53,0.04) 55%, rgba(26,115,232,0.05) 100%)`,
  radial: 'radial-gradient(circle, rgba(234,67,53,0.10) 0%, transparent 70%)',
};

// ===== Ombres UQ =====
export const UQ_SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,.30), 0 1px 3px rgba(0,0,0,.24)',
  md: '0 2px 4px rgba(0,0,0,.28), 0 4px 12px rgba(0,0,0,.32)',
  lg: '0 8px 24px rgba(0,0,0,.40), 0 2px 6px rgba(0,0,0,.30)',
  xl: '0 16px 48px rgba(0,0,0,.50)',
  glowRed: '0 0 24px rgba(234,67,53,0.20)',
  glowMagenta: '0 0 20px rgba(234,67,53,0.16)',
  glowBlue: '0 0 20px rgba(26,115,232,0.18)',
  glowPurple: '0 0 24px rgba(234,67,53,0.20)',
  brand: '0 6px 20px rgba(234,67,53,.28)',
};

// ===== Rayons =====
export const UQ_RADIUS = {
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
};

// ===== Transitions =====
export const UQ_TRANSITIONS = {
  fast: '0.15s ease',
  base: '0.25s ease',
  slow: '0.4s ease',
  spring: '0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// ===== Tailles de composant (Material touch targets) =====
export const UQ_SIZES = {
  touch: '44px',
  touchLg: '52px',
  iconSm: '16px',
  iconMd: '20px',
  iconLg: '24px',
  iconXl: '32px',
};

// ===== Helper : convertir hex en rgba =====
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ===== Helper : gradient avec opacité =====
export function gradientWithAlpha(colors: string[], alpha: number): string {
  const stops = colors.map((c, i) => {
    const pct = (i / (colors.length - 1)) * 100;
    return `${hexToRgba(c, alpha)} ${pct}%`;
  }).join(', ');
  return `linear-gradient(90deg, ${stops})`;
}

export default UQ_COLORS;
