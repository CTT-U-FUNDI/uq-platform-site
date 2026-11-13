// ====================
// Adaptateur v2 -> jeu d'icônes canonique (src/components/ui/Icon).
// Conserve l'API v2 (noms, props style/filled) pendant la migration.
// ====================

import type { CSSProperties } from 'react';
import { Icon as UqIcon, type IconName as CanonicalIconName } from '../../components/ui/Icon';

const ALIAS: Record<string, CanonicalIconName> = {
  alert: 'alert',
  arrowDownLeft: 'arrowDownLeft',
  arrowUpRight: 'arrowUpRight',
  back: 'chevronLeft',
  bank: 'bank',
  bell: 'bell',
  briefcase: 'briefcase',
  building: 'building',
  camera: 'camera',
  cart: 'shoppingCart',
  chat: 'message',
  check: 'check',
  chevronDown: 'chevronDown',
  chevronUp: 'chevronUp',
  clock: 'clock',
  close: 'x',
  coin: 'coins',
  contact: 'contact',
  copy: 'copy',
  device: 'smartphone',
  edit: 'pencil',
  external: 'external',
  eye: 'eye',
  eyeOff: 'eyeOff',
  file: 'fileText',
  filter: 'filter',
  forward: 'chevronRight',
  gift: 'gift',
  globe: 'globe',
  heart: 'heart',
  home: 'house',
  image: 'image',
  info: 'info',
  key: 'key',
  keypad: 'keyboard',
  lock: 'lock',
  logout: 'logout',
  mail: 'mail',
  market: 'store',
  minus: 'minus',
  moon: 'moon',
  more: 'moreHorizontal',
  music: 'music',
  phone: 'phone',
  pin: 'pin',
  play: 'play',
  plus: 'plus',
  qr: 'qr',
  receipt: 'receipt',
  refresh: 'refresh',
  search: 'search',
  send: 'send',
  settings: 'settings',
  share: 'share',
  shield: 'shield',
  sparkles: 'sparkle',
  star: 'star',
  stop: 'square',
  swap: 'convert',
  sun: 'sun',
  trash: 'trash',
  trendDown: 'trendingDown',
  trendUp: 'trendingUp',
  user: 'user',
  users: 'users',
  uqia: 'bot',
  video: 'video',
  wallet: 'wallet',

  // --- Noms du studio (studio-data, panneaux, éditeur de vitrine) -------------
  // Sans ces entrées, tout nom inconnu retombait silencieusement sur « info ».
  x: 'x',
  'arrow-left': 'arrowLeft',
  arrowLeft: 'arrowLeft',
  arrowRight: 'arrowRight',
  spark: 'sparkle',

  pill: 'package',
  steth: 'heart',
  cross: 'plus',
  bed: 'house',
  drop: 'waves',
  shoe: 'shoppingBag',
  egg: 'circle',
  fork: 'utensils',
  leaf: 'sprout',
  fish: 'waves',
  bread: 'utensils',
  shirt: 'tag',
  box: 'package',
  book: 'book',
  wrench: 'wrench',
  tool: 'tool',
  scissors: 'sparkle',
  car: 'car',
  parking: 'car',
  plane: 'send',
  hotel: 'building',
  grad: 'award',
  party: 'sparkle',
  cam: 'camera',
  church: 'church',
  ball: 'target',
  ship: 'waves',
  plant: 'sprout',
  grid: 'grid',
  money: 'money',
  rng: 'layers',
  alignL: 'list',
  alignC: 'list',
  alignR: 'list',
  grip: 'list',
  bold: 'hash',
  live: 'video',

  // Menus et sous-menus du studio (partie 3).
  txt: 'fileText',
  font: 'hash',
  stk: 'sparkle',
  cap: 'tag',
  banner: 'layout',
  shop: 'store',
  palette: 'palette',

  // Panneaux du studio (partie 4).
  up: 'arrowUp',
  down: 'arrowDown',
  offline: 'eyeOff',
  bolt: 'zap',
  expand: 'scan',
  shrink: 'scale',
  center: 'target',
  undo: 'refresh',
  thumb: 'image',
  r11: 'square',
  r916: 'smartphone',
  r43: 'image',
  r169: 'video',
  sliders: 'settings',
  route: 'arrowUpRight',
};

export type IconName = keyof typeof ALIAS;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  filled?: boolean;
}

export function Icon({ name, size = 22, strokeWidth = 1.8, className, style, filled }: IconProps) {
  return (
    <UqIcon
      name={ALIAS[name] ?? 'info'}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      filled={filled}
    />
  );
}
