/**
 * Rampe de couleurs UQ — source unique, partagée entre Tailwind (ESM) et le dé runtime.
 * Formats : channels = triplets "r g b" pour les modificateurs d'opacité Tailwind,
 * hex = valeur pleine pour les styles inline et le CSS.
 *
 * Rouge  #EA4335 = marque UQ et danger
 * Vert   #0FBE7C = succès / valeur positive
 * Bleu   #1A73E8 = information / lien
 * Ambre  #F9AB00 = attention (seul état intermédiaire autorisé)
 * Ink    = neutres Google (gris 50→900)
 */

export const UQ_HEX = {
  red: {
    50: '#FEF0EF', 100: '#FCD9D6', 200: '#F8B0AA', 300: '#FF6B5E',
    400: '#F5564A', 500: '#EA4335', 600: '#C5372B', 700: '#9A2C24',
    800: '#6E211C', 900: '#431512', 950: '#2A0E0C',
  },
  green: {
    50: '#E6F6EF', 100: '#C4EED9', 200: '#8FE0BB', 300: '#3DDC97',
    400: '#17CC86', 500: '#0FBE7C', 600: '#0A9A64', 700: '#057048',
    800: '#044C32', 900: '#023322', 950: '#011F15',
  },
  blue: {
    50: '#E8F1FD', 100: '#C6DAFB', 200: '#8DB4F8', 300: '#65A7F7',
    400: '#3B87EF', 500: '#1A73E8', 600: '#1152A8', 700: '#0C3D7D',
    800: '#082B59', 900: '#051C3B', 950: '#03122A',
  },
  amber: {
    50: '#FEF7E0', 100: '#FCE8B2', 200: '#FAD16B', 300: '#F9AB00',
    400: '#E09400', 500: '#C77F00', 600: '#9E6300', 700: '#754900',
    800: '#4E3000', 900: '#31200A', 950: '#1F1306',
  },
  ink: {
    50: '#F8F9FA', 100: '#F1F3F4', 200: '#E8EAED', 300: '#DADCE0',
    400: '#B3BAC2', 500: '#9AA0A6', 600: '#6D7580', 700: '#5F6368',
    800: '#3C4043', 900: '#202124', 950: '#0B0C0E',
  },
};

const toChannels = (scale) =>
  Object.fromEntries(
    Object.entries(scale).map(([step, hex]) => [step, hexToChannels(hex)])
  );

export function hexToChannels(hex) {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0, 2), 16)} ${parseInt(h.slice(2, 4), 16)} ${parseInt(h.slice(4, 6), 16)}`;
}

export const UQ_RAMP = {
  red: toChannels(UQ_HEX.red),
  green: toChannels(UQ_HEX.green),
  blue: toChannels(UQ_HEX.blue),
  amber: toChannels(UQ_HEX.amber),
  ink: toChannels(UQ_HEX.ink),
};

export default UQ_RAMP;
