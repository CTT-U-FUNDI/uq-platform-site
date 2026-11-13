import { useMemo } from 'react';
import { Icon } from './Icon';
import { Avatar, Button, EmptyState, Sheet } from './Ui';
import { clearCart, removeFromCart, setCartQty, useCart, type CartLine } from '../lib/cart';
import { useSession } from '../lib/session';
import { useDisplayAmount } from '../lib/currency';
import { identityLabel, useIdentities } from '../lib/identity';

/**
 * Panier du marché : lignes groupées par vendeur, quantités ajustables,
 * sous-total par vendeur et total général. La commande part chez le vendeur
 * via le chat — le backend ne facture rien tout seul.
 */
export function CartSheet({
  open,
  onClose,
  onCheckout,
  onOpenItem,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout?: (seller: string, lines: CartLine[]) => void;
  onOpenItem?: (item: CartLine) => void;
}) {
  const { uq } = useSession();
  const money = useDisplayAmount();
  const cart = useCart(uq);

  const sellerOf = useIdentities(cart.lines.map((line) => line.seller));

  const groups = useMemo(() => {
    const bySeller = new Map<string, CartLine[]>();
    cart.lines.forEach((line) => {
      const list = bySeller.get(line.seller) || [];
      list.push(line);
      bySeller.set(line.seller, list);
    });
    return Array.from(bySeller.entries()).map(([seller, lines]) => ({
      seller,
      lines,
      subtotal: lines.reduce((sum, line) => sum + line.priceUnits * line.qty, 0),
    }));
  }, [cart.lines]);

  const labelOf = (seller: string) => identityLabel(seller, sellerOf[seller.toUpperCase()]) || 'Vendeur';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Panier"
      subtitle={
        cart.count > 0
          ? `${cart.count} article${cart.count > 1 ? 's' : ''} · ${groups.length} vendeur${groups.length > 1 ? 's' : ''}`
          : 'Aucun article'
      }
      footer={
        cart.lines.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="v2-muted" style={{ fontSize: 11.5 }}>Total</div>
              <div style={{ fontSize: 19, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {money.format(cart.totalUnits)}
              </div>
            </div>
            <Button variant="ghost" icon="trash" onClick={() => clearCart(uq)}>
              Vider
            </Button>
          </div>
        ) : null
      }
    >
      {cart.lines.length === 0 ? (
        <EmptyState
          icon="market"
          title="Ton panier est vide"
          description="Ajoute une offre depuis le flux ou le marché : elle restera ici tant que tu ne l'as pas envoyée au vendeur."
          action={
            <Button size="sm" variant="secondary" onClick={onClose}>
              Continuer à parcourir
            </Button>
          }
        />
      ) : (
        <div className="v2-stack" style={{ gap: 16 }}>
          {groups.map((group) => (
            <div key={group.seller || 'sans-vendeur'}>
              <div className="v2-row-between" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar label={labelOf(group.seller)} size={26} />
                  <span style={{ fontWeight: 750, fontSize: 13.5 }}>{labelOf(group.seller)}</span>
                </div>
                <span style={{ fontWeight: 750, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                  {money.format(group.subtotal)}
                </span>
              </div>

              <div className="v2-stack" style={{ gap: 8 }}>
                {group.lines.map((line) => (
                  <div
                    key={line.itemId}
                    className="v2-card"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenItem?.(line)}
                      aria-label={`Voir ${line.title}`}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        overflow: 'hidden',
                        flex: 'none',
                        border: '1px solid var(--v2-line)',
                        background: 'var(--v2-surface-2)',
                        display: 'grid',
                        placeItems: 'center',
                        padding: 0,
                        cursor: onOpenItem ? 'pointer' : 'default',
                        color: 'var(--v2-ink-3)',
                      }}
                    >
                      {line.media ? (
                        <img
                          src={line.media}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Icon name="market" size={20} />
                      )}
                    </button>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13.5,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {line.title}
                      </div>
                      <div className="v2-muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {money.format(line.priceUnits)} × {line.qty}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        borderRadius: 999,
                        border: '1px solid var(--v2-line)',
                        background: 'var(--v2-surface-2)',
                        padding: 2,
                        flex: 'none',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCartQty(uq, line.itemId, line.qty - 1)}
                        aria-label="Retirer un article"
                        style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}
                      >
                        <Icon name="minus" size={15} />
                      </button>
                      <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 750, fontSize: 13 }}>
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCartQty(uq, line.itemId, line.qty + 1)}
                        aria-label="Ajouter un article"
                        style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}
                      >
                        <Icon name="plus" size={15} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(uq, line.itemId)}
                      aria-label={`Retirer ${line.title} du panier`}
                      style={{
                        width: 30,
                        height: 30,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 999,
                        border: '1px solid var(--v2-line)',
                        background: 'none',
                        color: 'var(--v2-ink-3)',
                        cursor: 'pointer',
                        flex: 'none',
                      }}
                    >
                      <Icon name="close" size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {onCheckout ? (
                <Button
                  size="sm"
                  icon="send"
                  onClick={() => onCheckout(group.seller, group.lines)}
                  style={{ marginTop: 8 }}
                  block
                >
                  Envoyer la commande
                </Button>
              ) : null}
            </div>
          ))}

          <div className="v2-muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
            Rien n'est débité à cette étape : la commande part chez le vendeur, qui confirme le prix
            et la remise avec toi.
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** Pastille de comptage pour un bouton d'accès au panier. */
export function CartBadge({ account }: { account: string }) {
  const count = useCart(account).count;
  if (!count) return null;
  return <span className="v2-tab-badge">{count > 9 ? '9+' : count}</span>;
}
