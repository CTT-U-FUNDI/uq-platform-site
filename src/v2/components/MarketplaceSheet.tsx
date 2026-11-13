import { useCallback, useEffect, useState } from 'react';
import { TransactionSheet } from './TransactionSheet';
import { Button, Card, Hint, List, Loader, Row, Sheet } from './Ui';
import {
  STATUT_TX_LABELS,
  TYPE_PRODUIT_LABELS,
  describeError,
  marketplaceMes,
  type MarketplaceTransaction,
} from '../lib/api';
import { useSession } from '../lib/session';
import { useDisplayAmount } from '../lib/currency';

const normUq = (v?: string | null) =>
  (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * « Ventes & commandes » dans un fil de discussion : toutes les transactions
 * marketplace entre moi et ce contact, quel que soit le rôle (acheteur,
 * vendeur ou livreur). Le vendeur gère ici ses ventes sans quitter le chat.
 */
export function MarketplaceSheet({
  peer,
  onClose,
}: {
  /** UQ canonique du contact (ex. « UQ-0001 »). */
  peer: string | null;
  onClose: () => void;
}) {
  const { uq } = useSession();
  const money = useDisplayAmount();
  const [txs, setTxs] = useState<MarketplaceTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txOuvert, setTxOuvert] = useState<number | null>(null);

  const charger = useCallback(async () => {
    if (!peer) return;
    setLoading(true);
    setError(null);
    try {
      // Trois lectures : mes achats, mes ventes, mes missions livreur.
      const [achats, ventes, livraisons] = await Promise.all([
        marketplaceMes('acheteur').catch(() => [] as MarketplaceTransaction[]),
        marketplaceMes('vendeur').catch(() => [] as MarketplaceTransaction[]),
        marketplaceMes('livreur').catch(() => [] as MarketplaceTransaction[]),
      ]);
      const cible = normUq(peer);
      const moi = normUq(uq);
      const lies = [...achats, ...ventes, ...livraisons].filter((tx) => {
        const autres = [tx.acheteur, tx.vendeur, tx.livreur_uq]
          .map(normUq)
          .filter((u) => u && u !== moi);
        return autres.includes(cible);
      });
      // Déduplique par id (une tx peut apparaître dans deux rôles ? non,
      // mais un achat + une mission peuvent coïncider : on garde l'unique).
      const vus = new Set<number>();
      setTxs(
        lies
          .sort((a, b) => (b.id || 0) - (a.id || 0))
          .filter((tx) => (vus.has(tx.id) ? false : (vus.add(tx.id), true))),
      );
    } catch (err) {
      setError(describeError(err, 'Chargement impossible.'));
    } finally {
      setLoading(false);
    }
  }, [peer, uq]);

  useEffect(() => {
    setTxs([]);
    setTxOuvert(null);
    void charger();
  }, [charger]);

  const roleDe = (tx: MarketplaceTransaction) => {
    const moi = normUq(uq);
    if (normUq(tx.acheteur) === moi) return 'Acheteur';
    if (normUq(tx.vendeur) === moi) return 'Vendeur';
    if (normUq(tx.livreur_uq) === moi) return 'Livreur';
    return '—';
  };

  return (
    <>
      <Sheet
        open={Boolean(peer)}
        onClose={onClose}
        title="Ventes & commandes"
        subtitle={peer || undefined}
      >
        {loading ? (
          <Loader label="Chargement des transactions…" />
        ) : error ? (
          <Card>
            <Hint icon="alert" tone="warning">
              {error}
            </Hint>
            <Button variant="secondary" block onClick={() => void charger()} style={{ marginTop: 10 }}>
              Réessayer
            </Button>
          </Card>
        ) : txs.length === 0 ? (
          <Card>
            <Hint icon="cart" tone="neutral">
              Aucune transaction marketplace avec ce contact. Les ventes et services solo passent par le
              séquestre UQ : acheteur, vendeur et livreur agissent chacun depuis sa fiche transaction.
            </Hint>
          </Card>
        ) : (
          <div className="v2-stack">
            <Hint icon="info" tone="neutral">
              Chaque transaction a son propre cycle : réservation → paiement séquestré → confirmation →
              remise → code jetable → libération. Le prix est masqué au livreur.
            </Hint>
            <List plain>
              {txs.map((tx) => (
                <Row
                  key={tx.id}
                  icon="cart"
                  title={`Transaction #${tx.id} — ${TYPE_PRODUIT_LABELS[tx.type_produit] || tx.type_produit}`}
                  subtitle={`${roleDe(tx)} · ${STATUT_TX_LABELS[tx.statut] || tx.statut}${
                    tx.points_total !== undefined ? ` · ${money.formatPoints(tx.points_total)}` : ''
                  }`}
                  right={<span className="v2-badge">Ouvrir</span>}
                  chevron
                  onClick={() => setTxOuvert(tx.id)}
                />
              ))}
            </List>
          </div>
        )}
      </Sheet>

      <TransactionSheet
        txId={txOuvert}
        onClose={() => setTxOuvert(null)}
        onChanged={() => void charger()}
      />
    </>
  );
}
