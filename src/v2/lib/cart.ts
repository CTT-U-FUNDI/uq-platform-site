import { useSyncExternalStore } from 'react';

/**
 * Panier du marché Zando.
 *
 * Le backend n'expose aucune route de panier : `/api/shop/product/buy` est un
 * acquittement immédiat qui ne débite pas un compte. Le panier est donc un
 * espace de travail local, par compte, et la commande se conclut chez le
 * vendeur via le chat. Rien n'est présenté comme payé.
 */
export interface CartLine {
  itemId: string;
  title: string;
  /** Propriétaire technique de l'offre (`shop_id`) : jamais affiché tel quel. */
  seller: string;
  /** Prix dans l'unité interne (`price_borb`), formaté à l'affichage. */
  priceUnits: number;
  qty: number;
  /** Image ou vidéo de l'offre, pour la ligne du panier. */
  media?: string;
}

const PREFIX = 'uq_cart_v1_';
const KEY = (account: string) => `${PREFIX}${account.toUpperCase()}`;

const cache = new Map<string, CartLine[]>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const sanitize = (raw: unknown): CartLine[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is CartLine => Boolean(entry && typeof entry === 'object' && 'itemId' in entry))
    .map((entry) => ({
      itemId: String(entry.itemId),
      title: String(entry.title || 'Offre'),
      seller: String(entry.seller || ''),
      priceUnits: Number(entry.priceUnits) || 0,
      qty: Math.max(1, Math.round(Number(entry.qty) || 1)),
      ...(entry.media ? { media: String(entry.media) } : {}),
    }));
};

/** Lignes du compte, lues depuis le cache mémoire ou le stockage local. */
export const cartLines = (account: string): CartLine[] => {
  const id = account.toUpperCase();
  const known = cache.get(id);
  if (known) return known;
  let lines: CartLine[] = [];
  try {
    lines = sanitize(JSON.parse(localStorage.getItem(KEY(id)) || '[]'));
  } catch {
    // Stockage illisible : on repart d'un panier vide plutôt que de bloquer l'écran.
    lines = [];
  }
  cache.set(id, lines);
  return lines;
};

const write = (account: string, lines: CartLine[]) => {
  cache.set(account.toUpperCase(), lines);
  try {
    localStorage.setItem(KEY(account), JSON.stringify(lines));
  } catch {
    // Quota atteint : le panier reste en mémoire pour la session.
  }
  emit();
};

export const cartCount = (account: string) =>
  cartLines(account).reduce((sum, line) => sum + line.qty, 0);

export const cartTotalUnits = (account: string) =>
  cartLines(account).reduce((sum, line) => sum + line.priceUnits * line.qty, 0);

/** Ajoute une offre (ou incrémente la quantité si elle y est déjà). */
export function addToCart(account: string, line: Omit<CartLine, 'qty'>, qty = 1) {
  const lines = cartLines(account);
  const index = lines.findIndex((entry) => entry.itemId === line.itemId);
  if (index < 0) {
    write(account, [...lines, { ...line, qty: Math.max(1, Math.round(qty)) }]);
    return;
  }
  write(
    account,
    lines.map((entry, position) =>
      position === index ? { ...entry, qty: entry.qty + Math.max(1, Math.round(qty)) } : entry,
    ),
  );
}

export function setCartQty(account: string, itemId: string, qty: number) {
  const target = Math.max(0, Math.round(qty));
  const lines = cartLines(account);
  if (target === 0) {
    write(account, lines.filter((entry) => entry.itemId !== itemId));
    return;
  }
  write(account, lines.map((entry) => (entry.itemId === itemId ? { ...entry, qty: target } : entry)));
}

export const removeFromCart = (account: string, itemId: string) =>
  write(account, cartLines(account).filter((entry) => entry.itemId !== itemId));

export const clearCart = (account: string) => write(account, []);

/** Panier du compte, réactif : toute mutation redessine les composants abonnés. */
export function useCart(account: string) {
  const lines = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => cartLines(account),
    () => [] as CartLine[],
  );

  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    totalUnits: lines.reduce((sum, line) => sum + line.priceUnits * line.qty, 0),
    /** Vendeurs distincts présents au panier : la commande se conclut par vendeur. */
    sellers: Array.from(new Set(lines.map((line) => line.seller).filter(Boolean))),
  };
}
