import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { PinSheet } from './PinSheet';
import { Button, Card, Field, Hint, Input, List, Loader, Row, Sheet } from './Ui';
import {
  TYPE_PRODUIT_LABELS,
  STATUT_TX_LABELS,
  describeError,
  horsUqAcheteur,
  horsUqLitige,
  horsUqRefuser,
  horsUqTerminer,
  horsUqVendeur,
  livreurList,
  livreurRegister,
  marketplaceAccepter,
  marketplaceAction,
  marketplaceAssignLivreur,
  marketplaceDetail,
  marketplaceGps,
  marketplaceLivreurAccepte,
  marketplaceLivreurRefuse,
  marketplacePayer,
  marketplaceRefuser,
  type LivreurConfiance,
  type MarketplaceTransaction,
} from '../lib/api';
import { useSession } from '../lib/session';
import { useDisplayAmount } from '../lib/currency';

/** Normalise un UQ pour comparer (« UQ-0001 » ≡ « uq-0001 » ≡ « 0001 »). */
const normUq = (v?: string | null) =>
  (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const MEMES_STATUTS_ANNULABLES = new Set([
  'reservation',
  'payee',
  'confirme',
  'attente_livreur',
  'hors_uq_attente_vendeur',
  'hors_uq_confirme',
]);

const STATUTS_LITIGE = new Set(['confirme', 'hors_uq_confirme', 'en_validation']);

interface ReponseAction {
  statut?: string;
  status?: string;
  message?: string;
  saisies?: string[];
}

/**
 * Fiche transaction marketplace : une seule vue pour les trois rôles.
 * Le backend masque déjà le prix au livreur ; ici on ne fait qu'afficher
 * les boutons autorisés par la machine à états (marketplace.rs).
 */
export function TransactionSheet({
  txId,
  onClose,
  onChanged,
}: {
  txId: number | null;
  onClose: () => void;
  /** Appelé après chaque action réussie (ex. recharger « mes ventes »). */
  onChanged?: () => void;
}) {
  const { uq, toast, authenticated } = useSession();
  const money = useDisplayAmount();
  const [tx, setTx] = useState<MarketplaceTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinMode, setPinMode] = useState<'payer' | 'hors_uq_acheteur' | 'hors_uq_vendeur' | null>(null);
  const [code, setCode] = useState('');
  const [motif, setMotif] = useState('');
  const [litigeOuvert, setLitigeOuvert] = useState(false);
  const [assignOuvert, setAssignOuvert] = useState(false);
  const [nouveauLivreur, setNouveauLivreur] = useState('');
  const [livreurs, setLivreurs] = useState<LivreurConfiance[]>([]);

  const charger = useCallback(async () => {
    if (!txId) return;
    setLoading(true);
    setError(null);
    try {
      setTx(await marketplaceDetail(txId));
    } catch (err) {
      setError(describeError(err, 'Transaction introuvable.'));
    } finally {
      setLoading(false);
    }
  }, [txId]);

  useEffect(() => {
    setTx(null);
    setCode('');
    setMotif('');
    setLitigeOuvert(false);
    setAssignOuvert(false);
    void charger();
  }, [charger]);

  const me = normUq(uq);
  const estAcheteur = Boolean(tx && me && normUq(tx.acheteur) === me);
  const estVendeur = Boolean(tx && me && normUq(tx.vendeur) === me);
  const estLivreur = Boolean(tx && me && normUq(tx.livreur_uq) === me);

  /** Applique la réponse d'une action : transaction complète ou accusé partiel (code). */
  const appliquer = async (promesse: Promise<ReponseAction>): Promise<boolean> => {
    setBusy(true);
    try {
      const res = await promesse;
      if (res && typeof res === 'object' && 'statut' in res && res.statut) {
        setTx(res as MarketplaceTransaction);
        toast('Transaction mise à jour', 'success');
      } else if (res?.message) {
        toast(res.message, 'success');
        await charger();
      } else {
        await charger();
      }
      onChanged?.();
      return true;
    } catch (err) {
      toast(describeError(err, 'Action impossible.'), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const envoyerPin = async (pin: string): Promise<string | void> => {
    if (!tx || !pinMode) return;
    const promesse =
      pinMode === 'payer'
        ? marketplacePayer(tx.id, pin)
        : pinMode === 'hors_uq_acheteur'
          ? horsUqAcheteur(tx.id, pin)
          : horsUqVendeur(tx.id, pin);
    // Les actions PIN laissent la feuille ouverte en cas d'erreur (mauvais PIN).
    setBusy(true);
    try {
      const res = (await promesse) as ReponseAction;
      setPinMode(null);
      setBusy(false);
      if (res && typeof res === 'object' && 'statut' in res && res.statut) {
        setTx(res as MarketplaceTransaction);
        toast('Transaction mise à jour', 'success');
        onChanged?.();
      } else {
        await charger();
        onChanged?.();
      }
    } catch (err) {
      setBusy(false);
      return describeError(err, 'Code PIN incorrect.');
    }
  };

  const chargerLivreurs = useCallback(async () => {
    try {
      setLivreurs(await livreurList());
    } catch {
      setLivreurs([]);
    }
  }, []);

  useEffect(() => {
    if (assignOuvert && estVendeur) void chargerLivreurs();
  }, [assignOuvert, estVendeur, chargerLivreurs]);

  const assigner = (livreur: string) => {
    if (!tx) return;
    void appliquer(marketplaceAssignLivreur(tx.id, livreur)).then(() => setAssignOuvert(false));
  };

  const enregistrerEtAssigner = async () => {
    const cible = nouveauLivreur.trim();
    if (!tx || !cible) return;
    setBusy(true);
    try {
      await livreurRegister(cible);
      await marketplaceAssignLivreur(tx.id, cible);
      toast('Livreur de confiance enregistré et assigné', 'success');
      setNouveauLivreur('');
      setAssignOuvert(false);
      await charger();
      onChanged?.();
    } catch (err) {
      toast(describeError(err, 'Enregistrement impossible.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  /** Envoie la position GPS courante (best effort) avant 'livre'. */
  const envoyerPosition = (): Promise<void> =>
    new Promise((resolve) => {
      if (!tx || typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          marketplaceGps(tx.id, pos.coords.latitude, pos.coords.longitude)
            .then(() => resolve())
            .catch(() => resolve());
        },
        () => resolve(),
        { timeout: 5000, maximumAge: 60000 },
      );
    });

  const marquerLivre = async () => {
    if (!tx) return;
    await envoyerPosition();
    await appliquer(marketplaceAction(tx.id, 'livre'));
  };

  const saisirCode = () => {
    if (!tx || code.trim().length < 4) {
      toast('Saisis le code de confirmation reçu.', 'error');
      return;
    }
    void appliquer(marketplaceAction(tx.id, 'code', code.trim().toUpperCase()));
    setCode('');
  };

  const ouvrirLitige = () => {
    if (!tx) return;
    if (!motif.trim()) {
      toast('Décris le motif du litige.', 'error');
      return;
    }
    // Séquestre UQ : litige marketplace. Hors UQ : litige déclaré sans garantie.
    void appliquer(
      modeHorsUq
        ? horsUqLitige(tx.id, motif.trim())
        : marketplaceAction(tx.id, 'litige', undefined, motif.trim()),
    );
    setLitigeOuvert(false);
    setMotif('');
  };

  const annuler = () => {
    if (!tx) return;
    void appliquer(marketplaceAction(tx.id, 'annuler'));
  };

  const refuser = () => {
    if (!tx) return;
    void appliquer(marketplaceRefuser(tx.id));
  };

  const accepter = () => {
    if (!tx) return;
    void appliquer(marketplaceAccepter(tx.id));
  };

  const actionsSimples: Array<{
    label: string;
    icon?: ComponentProps<typeof Button>['icon'];
    run: () => void;
    danger?: boolean;
  }> = [];

  const statut = tx?.statut || '';
  const modeHorsUq = tx?.mode_paiement === 'hors_uq';
  const enCours = !['libere', 'annule', 'litige'].includes(statut);

  // --- Boutons par rôle et statut (miroir de marketplace.rs) ---
  if (tx) {
    if (estAcheteur) {
      if (statut === 'reservation') {
        actionsSimples.push(
          { label: 'Payer avec séquestre UQ', icon: 'wallet', run: () => setPinMode('payer') },
          { label: 'Paiement hors UQ (1 % de frais)', icon: 'external', run: () => setPinMode('hors_uq_acheteur') },
          { label: 'Annuler la réservation', icon: 'close', run: annuler, danger: true },
        );
      } else if (MEMES_STATUTS_ANNULABLES.has(statut)) {
        actionsSimples.push({ label: 'Annuler la transaction', icon: 'close', run: annuler, danger: true });
      }
      if (statut === 'confirme') {
        actionsSimples.push({ label: 'Marquer comme reçu', icon: 'check', run: () => void appliquer(marketplaceAction(tx.id, 'recoit')) });
      }
      if (statut === 'hors_uq_confirme') {
        actionsSimples.push({ label: 'Terminer la transaction (hors UQ)', icon: 'check', run: () => void appliquer(horsUqTerminer(tx.id)) });
      }
      if (STATUTS_LITIGE.has(statut)) {
        actionsSimples.push({ label: modeHorsUq ? 'Litige hors UQ' : 'Signaler un litige', icon: 'alert', run: () => setLitigeOuvert(true), danger: true });
      }
    }

    if (estVendeur) {
      if (statut === 'payee') {
        actionsSimples.push(
          { label: 'Accepter la commande', icon: 'check', run: accepter },
          { label: 'Refuser et rembourser', icon: 'close', run: refuser, danger: true },
        );
      } else if (statut === 'reservation') {
        actionsSimples.push({ label: 'Refuser la commande', icon: 'close', run: refuser, danger: true });
      }
      if (statut === 'hors_uq_attente_vendeur') {
        actionsSimples.push(
          { label: 'Confirmer le paiement hors UQ', icon: 'check', run: () => setPinMode('hors_uq_vendeur') },
          { label: 'Refuser — retour au paiement sécurisé', icon: 'close', run: () => void appliquer(horsUqRefuser(tx.id)), danger: true },
        );
      }
      if ((statut === 'confirme' || statut === 'hors_uq_confirme') && !tx.livreur_uq) {
        actionsSimples.push(
          { label: 'Assigner un livreur de confiance', icon: 'car', run: () => setAssignOuvert(true) },
          { label: 'Remise en main propre — marquer livré', icon: 'box', run: () => void marquerLivre() },
        );
      }
      if (MEMES_STATUTS_ANNULABLES.has(statut)) {
        actionsSimples.push({ label: 'Annuler la transaction', icon: 'close', run: annuler, danger: true });
      }
    }

    if (estLivreur) {
      if (statut === 'attente_livreur') {
        actionsSimples.push(
          { label: 'Accepter la mission (30 min)', icon: 'check', run: () => void appliquer(marketplaceLivreurAccepte(tx.id)) },
          { label: 'Refuser la mission', icon: 'close', run: () => void appliquer(marketplaceLivreurRefuse(tx.id)), danger: true },
        );
      } else if (statut === 'confirme' || statut === 'hors_uq_confirme') {
        if (!tx.recupere_at) {
          actionsSimples.push({ label: 'Marquer récupéré chez le vendeur', icon: 'box', run: () => void appliquer(marketplaceAction(tx.id, 'recupere')) });
        }
        if (tx.recupere_at) {
          actionsSimples.push({ label: 'Marquer livré', icon: 'send', run: () => void marquerLivre() });
        }
      }
    }
  }

  // Le vendeur peut aussi saisir le code quand il n'y a pas de livreur
  // (le backend l'autorise depuis le correctif ; requis = vendeur + acheteur).
  const peutSaisirCode =
    tx &&
    statut === 'en_validation' &&
    (estAcheteur || estLivreur || (estVendeur && !tx.livreur_uq));

  const prixAffiche =
    tx?.points_total !== undefined && tx?.points_total !== null
      ? money.formatPoints(tx.points_total)
      : 'Prix masqué';

  return (
    <>
      <Sheet
        open={Boolean(txId)}
        onClose={onClose}
        title={tx ? `Transaction #${tx.id}` : 'Transaction'}
        subtitle={
          tx
            ? `${TYPE_PRODUIT_LABELS[tx.type_produit] || tx.type_produit} · ${STATUT_TX_LABELS[statut] || statut}`
            : undefined
        }
      >
        {loading && !tx ? (
          <Loader label="Chargement de la transaction…" />
        ) : error ? (
          <Card>
            <Hint icon="alert" tone="warning">
              {error}
            </Hint>
            <Button variant="secondary" block onClick={() => void charger()} style={{ marginTop: 10 }}>
              Réessayer
            </Button>
          </Card>
        ) : tx ? (
          <div className="v2-stack">
            {/* Rôle + statut */}
            <Card>
              <div className="v2-row-between" style={{ marginBottom: 8 }}>
                <span className="v2-badge v2-badge--accent">
                  {estAcheteur ? 'Vous : acheteur' : estVendeur ? 'Vous : vendeur' : estLivreur ? 'Vous : livreur' : 'Observateur'}
                </span>
                <span className="v2-badge">{STATUT_TX_LABELS[statut] || statut}</span>
              </div>
              <List plain>
                <Row title="Montant" right={<strong>{prixAffiche}</strong>} />
                {tx.points_livraison ? <Row title="Frais de livraison" right={<strong>{money.formatPoints(tx.points_livraison)}</strong>} /> : null}
                {tx.frais_hors_uq ? <Row title="Frais hors UQ (1 % par partie)" right={<strong>{money.formatPoints(tx.frais_hors_uq)}</strong>} /> : null}
                <Row title="Vendeur" right={<span>{tx.vendeur}</span>} />
                <Row title="Acheteur" right={<span>{tx.acheteur}</span>} />
                {tx.livreur_uq ? <Row title="Livreur" right={<span>{tx.livreur_uq}</span>} /> : null}
                {modeHorsUq ? (
                  <Row
                    title="Mode de paiement"
                    right={<span className="v2-badge">Hors UQ — sans garantie UQ</span>}
                  />
                ) : null}
              </List>
            </Card>

            {/* Règles contextuelles */}
            {statut === 'reservation' && (
              <Hint icon="shield" tone="accent">
                {modeHorsUq
                  ? 'Paiement hors UQ : déclaré, tracé et taxé (1 % par partie) mais SANS garantie UQ — pas de séquestre, pas de remboursement automatique.'
                  : 'Le paiement séquestre UQ gèle le montant chez l’acheteur jusqu’à la remise. En cas de litige, le séquestre est gelé pour arbitrage.'}
              </Hint>
            )}
            {statut === 'payee' && estVendeur && (
              <Hint icon="info">
                L’acheteur a payé : le montant est séquestré. Accepte sous 48 h sinon la transaction peut être annulée.
              </Hint>
            )}
            {modeHorsUq && statut === 'hors_uq_attente_vendeur' && (
              <Hint icon="alert" tone="warning">
                L’acheteur a payé hors UQ : tu confirmes que tu as bien reçu le paiement. Aucune garantie UQ ne protège cette transaction.
              </Hint>
            )}
            {estLivreur && (
              <Hint icon="eyeOff" tone="neutral">
                Confidentialité livreur : le montant de la transaction t’est masqué. Tu ne vois que la logistique.
              </Hint>
            )}
            {statut === 'en_validation' && (
              <Hint icon="key" tone="accent">
                Code jetable : les deux parties requises (acheteur + vendeur, ou acheteur + livreur) doivent le saisir pour libérer le séquestre. Valable 6 h, 3 tentatives.
              </Hint>
            )}
            {statut === 'libere' && (
              <Hint icon="check" tone="positive">
                Transaction libérée : le vendeur et le livreur ont été payés depuis le séquestre. Cette vente alimente la réputation.
              </Hint>
            )}
            {statut === 'litige' && (
              <Hint icon="alert" tone="warning">
                Litige ouvert : le séquestre est gelé le temps de l’arbitrage. Garde tes preuves (messages, GPS, photos).
              </Hint>
            )}
            {statut === 'annule' && (
              <Hint icon="info">Transaction annulée : le séquestre a été remboursé à l’acheteur.</Hint>
            )}

            {/* Saisie du code jetable */}
            {peutSaisirCode && (
              <Card>
                <Field label="Code de confirmation">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Code reçu par notification"
                    inputMode="text"
                    autoCapitalize="characters"
                    maxLength={12}
                  />
                </Field>
                <Button block icon="key" loading={busy} onClick={saisirCode} style={{ marginTop: 10 }}>
                  Valider le code
                </Button>
              </Card>
            )}

            {/* Litige : motif */}
            {litigeOuvert && tx && (
              <Card>
                <Field label="Motif du litige">
                  <Input
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Décris le problème (colis non reçu, produit différent…)"
                  />
                </Field>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Button variant="secondary" onClick={() => setLitigeOuvert(false)} style={{ flex: 1 }}>
                    Retour
                  </Button>
                  <Button variant="danger" onClick={ouvrirLitige} loading={busy} style={{ flex: 1 }}>
                    Ouvrir le litige
                  </Button>
                </div>
              </Card>
            )}

            {/* Assignation livreur (vendeur) */}
            {assignOuvert && tx && estVendeur && (
              <Card>
                <div className="v2-h3" style={{ marginBottom: 6 }}>
                  Livreurs de confiance
                </div>
                <div className="v2-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                  Seuls les livreurs de ta liste peuvent être assignés (Q9). Le livreur ne voit jamais le prix.
                </div>
                <List plain>
                  {livreurs.length === 0 && (
                    <Row title="Aucun livreur enregistré" subtitle="Ajoute un UQ ci-dessous." />
                  )}
                  {livreurs.map((l) => (
                    <Row
                      key={l.livreur}
                      title={l.livreur}
                      subtitle={`${l.nb_livraisons ?? 0} livraison(s) · ${l.statut}`}
                      right={
                        <Button size="sm" onClick={() => assigner(l.livreur)} loading={busy}>
                          Assigner
                        </Button>
                      }
                    />
                  ))}
                </List>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Input
                    value={nouveauLivreur}
                    onChange={(e) => setNouveauLivreur(e.target.value)}
                    placeholder="UQ du nouveau livreur"
                    style={{ flex: 1 }}
                  />
                  <Button onClick={() => void enregistrerEtAssigner()} loading={busy} disabled={!nouveauLivreur.trim()}>
                    Ajouter
                  </Button>
                </div>
                <Button variant="ghost" block onClick={() => setAssignOuvert(false)} style={{ marginTop: 8 }}>
                  Fermer
                </Button>
              </Card>
            )}

            {/* Boutons d'action */}
            {enCours && actionsSimples.length > 0 && (
              <div className="v2-stack">
                {actionsSimples.map((a) => (
                  <Button
                    key={a.label}
                    block
                    variant={a.danger ? 'danger' : 'primary'}
                    icon={a.icon}
                    loading={busy}
                    onClick={a.run}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Attente livreur : compte à rebours informatif */}
            {statut === 'attente_livreur' && !estLivreur && (
              <Hint icon="clock" tone="neutral">
                Le livreur a 30 minutes pour accepter la mission. Passé ce délai, la transaction peut être réassignée.
              </Hint>
            )}
          </div>
        ) : null}
      </Sheet>

      <PinSheet
        open={Boolean(pinMode && tx)}
        onClose={() => setPinMode(null)}
        title={
          pinMode === 'payer'
            ? 'Payer la transaction'
            : pinMode === 'hors_uq_acheteur'
              ? 'Déclarer le paiement hors UQ'
              : 'Confirmer le paiement hors UQ'
        }
        subtitle={
          pinMode === 'payer'
            ? 'Le montant sera séquestré jusqu’à la remise.'
            : '1 % de frais par partie, sans garantie UQ.'
        }
        onSubmit={envoyerPin}
      />
    </>
  );
}
