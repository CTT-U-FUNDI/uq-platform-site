import { useState } from 'react';
import { Button, Card, Field, Sheet } from './Ui';
import { Icon } from './Icon';
import { useSession } from '../lib/session';
import { describeError } from '../lib/api';
import { formatNumber } from '../lib/format';
import { compressImageFile, dataUrlBytes, formatBytes, pickImageFile } from '../lib/image';
import {
  attachP2PProof,
  completeP2POrder,
  confirmP2POrder,
  getP2PProofImage,
  numeroDePreuve,
  type P2PAnalyse,
  type P2POrder,
  type P2PProof,
  type P2PProofVerdict,
} from '../lib/trading';

/**
 * Les preuves de paiement du P2P mobile. Le moteur d'analyse côté serveur
 * mesure la capture et les valeurs recopiées, puis rend un verdict ; il ouvre
 * le bouton « J'ai payé », jamais il ne paie à la place de l'utilisateur. Le
 * vendeur garde la décision finale sur ses BORB : il voit le verdict de
 * l'acheteur, peut joindre sa propre capture, et clique lui-même.
 */

const VERDICTS: Record<P2PProofVerdict, { label: string; teinte: string }> = {
  valide: { label: 'conforme', teinte: 'var(--v2-positive)' },
  doute: { label: 'à vérifier', teinte: 'var(--v2-warning)' },
  rejet: { label: 'écartée', teinte: 'var(--v2-negative)' },
};

const pourcentage = (valeur: number): string => `${Math.round(valeur * 100)} %`;

function EtatPreuve({ preuve }: { preuve: P2PProof }) {
  const etat = VERDICTS[preuve.verdict] ?? VERDICTS.doute;
  return (
    <>
      <span style={{ color: etat.teinte, fontWeight: 600 }}>{etat.label}</span>
      {' '}
      ({pourcentage(preuve.conformite)})
      {preuve.derogue ? ' · doute assumé par son auteur' : ''}
      {preuve.nom_verifie === 'divergent' ? ' · nom recopié divergent' : ''}
      {preuve.nom_verifie === 'conforme' ? ' · nom vérifié' : ''}
    </>
  );
}

function Motifs({ analyse }: { analyse: P2PAnalyse }) {
  if (!analyse.raisons.length) return null;
  return (
    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--v2-ink-3)' }}>
      {analyse.raisons.slice(0, 5).map((raison, index) => (
        <li key={`${raison}-${index}`}>{raison}</li>
      ))}
    </ul>
  );
}

type Role = 'buyer' | 'seller';

function FeuillePreuve({
  order,
  role,
  face,
  numeroAttendu,
  onAttachee,
  onClose,
}: {
  order: P2POrder;
  role: Role;
  face: string;
  /** La ligne que l'acheteur doit montrer : le serveur l'a déjà résolue. */
  numeroAttendu?: string;
  onAttachee: (analyse: P2PAnalyse) => void;
  onClose: () => void;
}) {
  const { uq, toast } = useSession();
  const [capture, setCapture] = useState<{ dataUrl: string; chars: number } | null>(null);
  // Les quatre valeurs ci-dessous sont des déclarations : rien n'est
  // pré-rempli, rien n'est en lecture seule. Une case déjà remplie ne prouve
  // rien et ne peut pas être fausse ; ce que l'utilisateur écrit l'engage.
  const [montant, setMontant] = useState('');
  const [devise, setDevise] = useState('');
  const [numero, setNumero] = useState('');
  // Le nom du bénéficiaire n'est jamais affiché par la plateforme : la feuille
  // part donc vide. Ce que l'utilisateur y écrit vient de son écran d'opérateur,
  // et c'est précisément ce qui en fait une preuve de connaissance.
  const [titulaire, setTitulaire] = useState('');
  const [analyse, setAnalyse] = useState<P2PAnalyse | null>(null);
  const [occupation, setOccupation] = useState(false);

  const choisir = async () => {
    const fichier = await pickImageFile();
    if (!fichier) return;
    try {
      const compressee = await compressImageFile(fichier, { maxChars: 900_000, maxSide: 1400 });
      setCapture({ dataUrl: compressee.dataUrl, chars: compressee.chars });
      setAnalyse(null);
    } catch (error) {
      toast(describeError(error, 'Capture illisible'), 'error');
    }
  };

  const saisir = () => Number(montant.replace(/\s/g, '').replace(',', '.'));

  const envoyer = async () => {
    if (!capture) {
      toast('Choisis d abord la capture de ton paiement.', 'error');
      return;
    }
    if (!saisir()) {
      toast('Recopie le montant visible sur la capture.', 'error');
      return;
    }
    if (!devise.trim()) {
      toast('Recopie la devise affichée sur la capture.', 'error');
      return;
    }
    // Un numéro non recopié ne peut pas être confronté : la preuve serait
    // muette sur la ligne qui a servi au paiement.
    if (!numero.trim()) {
      toast('Recopie le numéro de la ligne mobile money affichée sur ton reçu.', 'error');
      return;
    }
    // Sans nom recopié, le test n'a pas lieu et le serveur refuse la preuve.
    if (role === 'buyer' && !titulaire.trim()) {
      toast('Recopie le nom complet que ton opérateur affiche après le paiement.', 'error');
      return;
    }
    setOccupation(true);
    try {
      const reponse = await attachP2PProof(order.id, {
        uq,
        image: capture.dataUrl,
        montant: saisir(),
        devise: devise.trim().toUpperCase(),
        numero: numero.trim(),
        nom: titulaire.trim(),
      });
      setAnalyse(reponse.analyse);
      onAttachee(reponse.analyse);
      const etat = VERDICTS[reponse.analyse.verdict] ?? VERDICTS.doute;
      toast(
        `Analyse : preuve ${etat.label} (${pourcentage(reponse.analyse.conformite)}).`,
        reponse.analyse.verdict === 'valide' ? 'success' : 'default',
      );
    } catch (error) {
      toast(describeError(error, 'Envoi de la preuve impossible'), 'error');
    } finally {
      setOccupation(false);
    }
  };

  const etat = analyse ? VERDICTS[analyse.verdict] ?? VERDICTS.doute : null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={role === 'buyer' ? 'Preuve de paiement' : 'Ma preuve de réception'}
      subtitle={
        role === 'buyer'
          ? "La capture doit montrer le numéro, le montant et le nom complet du bénéficiaire."
          : 'Joins la capture de réception : le moteur l analyse, mais toi seul libères les BORB.'
      }
      footer={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            size="sm"
            icon="check"
            loading={occupation}
            disabled={!capture || Boolean(analyse)}
            onClick={envoyer}
          >
            Analyser la capture
          </Button>
          {analyse ? (
            <Button size="sm" variant="secondary" icon="camera" onClick={() => setAnalyse(null)}>
              Autre capture
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" icon="close" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <Card style={{ padding: 12 }}>
        <Field
          label="Capture du paiement"
          hint={
            capture
              ? `${formatBytes(dataUrlBytes(capture.dataUrl))} — rien n'est envoyé avant ton accord.`
              : 'Capture d écran ou photo du reçu mobile money.'
          }
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" icon="camera" onClick={choisir}>
              {capture ? 'Changer' : 'Choisir'}
            </Button>
            {capture ? (
              <img
                src={capture.dataUrl}
                alt="aperçu de la preuve"
                style={{ maxWidth: 140, maxHeight: 140, borderRadius: 10, objectFit: 'contain' }}
              />
            ) : (
              <span className="v2-muted" style={{ fontSize: 12.5 }}>
                Aucune image jointe
              </span>
            )}
          </div>
        </Field>
      </Card>
      <div style={{ height: 8 }} />
      <Card style={{ padding: 12 }}>
        <Field
          label="Montant visible sur la capture"
          hint="Recopie ce que ton reçu affiche, pas ce que la commande réclame."
        >
          <input
            className="v2-input"
            value={montant}
            inputMode="decimal"
            placeholder="Montant du reçu"
            onChange={(evenement) => {
              setMontant(evenement.target.value);
              setAnalyse(null);
            }}
          />
        </Field>
        <div style={{ height: 8 }} />
        <Field label="Devise" hint={`La commande est en ${order.currency}.`}>
          <input
            className="v2-input"
            value={devise}
            placeholder={order.currency}
            onChange={(evenement) => {
              setDevise(evenement.target.value);
              setAnalyse(null);
            }}
          />
        </Field>
        <div style={{ height: 8 }} />
        <Field
          label={
            role === 'buyer'
              ? "Numéro du compte destinataire, tel que ton opérateur l'écrit"
              : "Numéro du payeur, tel qu'il apparaît sur ton avis de réception"
          }
          hint={
            role === 'buyer'
              ? numeroAttendu
                ? `Le paiement est parti vers ${numeroAttendu} : recopie le numéro de ton reçu.`
                : "Aucune ligne n'est enregistrée sur cette commande : recopie le numéro de ton reçu."
              : "Le moteur le compare à la ligne que le payeur a déclarée chez lui."
          }
        >
          <input
            className="v2-input"
            value={numero}
            inputMode="tel"
            placeholder="Numéro affiché sur le reçu"
            onChange={(evenement) => {
              setNumero(evenement.target.value);
              setAnalyse(null);
            }}
          />
        </Field>
        <div style={{ height: 8 }} />
        <Field
          label={
            role === 'buyer'
              ? "Nom complet du bénéficiaire, tel que ton opérateur l'affiche"
              : "Nom du payeur, tel que ton opérateur l'affiche"
          }
          hint={
            role === 'buyer'
              ? `UQ ne t'affiche jamais ce nom : écris celui de ton reçu, pas le pseudo « ${face} ».`
              : "Recopie le nom de ton avis de réception. Le moteur le compare au nom que le payeur a enregistré chez lui."
          }
        >
          <input
            className="v2-input"
            value={titulaire}
            placeholder={role === 'buyer' ? 'Prénom et nom complet' : 'Prénom et nom du payeur'}
            onChange={(evenement) => {
              setTitulaire(evenement.target.value);
              setAnalyse(null);
            }}
          />
        </Field>
      </Card>
      {analyse && etat ? (
        <>
          <div style={{ height: 8 }} />
          <Card style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name={analyse.verdict === 'valide' ? 'check' : 'shield'} size={18} />
              <span style={{ color: etat.teinte, fontWeight: 700 }}>
                Analyse : preuve {etat.label} ({pourcentage(analyse.conformite)})
              </span>
            </div>
            <Motifs analyse={analyse} />
            {analyse.verdict === 'rejet' ? (
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                Tu peux joindre une autre capture. Si tu préfères continuer, coche « J'assume le
                doute » sur la commande : le vendeur verra cette mention avant de libérer les BORB.
              </div>
            ) : null}
            {analyse.nom_verifie === 'divergent' ? (
              <div style={{ fontSize: 12.5, color: 'var(--v2-negative)', marginTop: 8 }}>
                Le nom recopié n'est pas celui que la contrepartie a enregistré. Si ton paiement est
                bien parti, recopie-le tel que ton opérateur l'affiche ; sinon cette commande mérite
                un litige.
              </div>
            ) : null}
            {analyse.nom_verifie === 'inverifiable' ? (
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                Contrôle du nom impossible : la contrepartie n'a pas enregistré son nom officiel, ou
                le reçu n'en montre qu'un masqué.
              </div>
            ) : null}
            {analyse.veto ? (
              <div style={{ fontSize: 12.5, color: 'var(--v2-negative)', marginTop: 8 }}>
                Le fichier porte le nom d'un générateur d'images : le moteur écarte cette capture.
              </div>
            ) : null}
          </Card>
        </>
      ) : null}
    </Sheet>
  );
}

function Capture({ preuveId, titre }: { preuveId: number; titre: string }) {
  const { uq, toast } = useSession();
  const [image, setImage] = useState<string | null>(null);
  const [occupation, setOccupation] = useState(false);

  const ouvrir = async () => {
    setOccupation(true);
    try {
      const reponse = await getP2PProofImage(preuveId, uq);
      setImage(reponse.image);
    } catch (error) {
      toast(describeError(error, 'Capture indisponible'), 'error');
    } finally {
      setOccupation(false);
    }
  };

  if (image) {
    return (
      <Sheet open onClose={() => setImage(null)} title={titre} subtitle="Preuve jointe à la commande.">
        <img
          src={image}
          alt="preuve de paiement"
          style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 12 }}
        />
      </Sheet>
    );
  }

  return (
    <Button size="sm" variant="ghost" icon="image" loading={occupation} onClick={ouvrir}>
      Voir la capture
    </Button>
  );
}

/** Acheteur : la preuve ouvre « J'ai payé ». Un verdict écarté reste
 *  surmontable, mais la déclaration est enregistrée et visible au vendeur. */
export function FactureAcheteur({
  order,
  face,
  onRefresh,
}: {
  order: P2POrder;
  face: string;
  onRefresh: () => void;
}) {
  const { uq, toast } = useSession();
  const [feuille, setFeuille] = useState(false);
  const [assume, setAssume] = useState(false);
  const [occupation, setOccupation] = useState(false);
  const preuve = order.my_proof;
  const ecartee = preuve?.verdict === 'rejet';
  const peutAnnoncer = Boolean(preuve) && (!ecartee || assume);

  const annoncer = async () => {
    setOccupation(true);
    try {
      await confirmP2POrder(order.id, uq, ecartee && assume);
      toast('Paiement annoncé au vendeur', 'success');
      onRefresh();
    } catch (error) {
      toast(describeError(error, 'Annonce impossible'), 'error');
    } finally {
      setOccupation(false);
    }
  };

  return (
    <>
      {preuve ? (
        <Button size="sm" variant="ghost" icon="camera" onClick={() => setFeuille(true)}>
          Ma preuve
        </Button>
      ) : (
        <Button size="sm" icon="camera" onClick={() => setFeuille(true)}>
          Ajouter la preuve
        </Button>
      )}
      {preuve ? (
        <Button
          size="sm"
          icon="wallet"
          disabled={!peutAnnoncer}
          loading={occupation}
          onClick={annoncer}
        >
          J'ai payé
        </Button>
      ) : null}
      {preuve && ecartee ? (
        <label
          className="v2-muted"
          style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <input
            type="checkbox"
            checked={assume}
            onChange={(event) => setAssume(event.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--v2-accent)' }}
          />
          J'assume le doute : le vendeur verra cette déclaration
        </label>
      ) : null}
      {feuille ? (
        <FeuillePreuve
          order={order}
          role="buyer"
          face={face}
          numeroAttendu={numeroDePreuve(order)}
          onAttachee={() => onRefresh()}
          onClose={() => setFeuille(false)}
        />
      ) : null}
    </>
  );
}

/** Vendeur : le moteur analyse, il ne libère rien. Il garde le dernier clic
 *  sur ses BORB, avec le verdict de l'acheteur sous les yeux. */
export function FactureVendeur({
  order,
  face,
  onRefresh,
}: {
  order: P2POrder;
  face: string;
  onRefresh: () => void;
}) {
  const { uq, toast } = useSession();
  const [feuille, setFeuille] = useState(false);
  const [occupation, setOccupation] = useState(false);
  const preuve = order.my_proof;

  const liberer = async () => {
    setOccupation(true);
    try {
      await completeP2POrder(order.id, uq);
      toast(
        `${formatNumber(order.borb_amount ?? 0, 2)} BORB transférés, commande terminée`,
        'success',
      );
      onRefresh();
    } catch (error) {
      toast(describeError(error, 'Libération impossible'), 'error');
    } finally {
      setOccupation(false);
    }
  };

  return (
    <>
      {order.peer_proof ? (
        <Capture preuveId={order.peer_proof.id} titre={`Capture de ${face}`} />
      ) : null}
      <Button size="sm" variant="ghost" icon="camera" onClick={() => setFeuille(true)}>
        {preuve ? 'Ma preuve' : 'Preuve de réception'}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        icon="check"
        loading={occupation}
        onClick={liberer}
      >
        J'ai reçu, libérer
      </Button>
      {feuille ? (
        <FeuillePreuve
          order={order}
          role="seller"
          face={face}
          onAttachee={() => onRefresh()}
          onClose={() => setFeuille(false)}
        />
      ) : null}
    </>
  );
}


/**
 * Ligne d'etat des preuves d'une commande : l'acheteur voit le verdict qui
 * ouvre (ou non) « J'ai payé », le vendeur voit celui de la partie adverse
 * avant de liberer ses BORB.
 */
export function PucePreuveCommande({ order, face }: { order: P2POrder; face: string }) {
  if (order.status !== 'pending_payment' && order.status !== 'paid') return null;
  const mienne = order.my_proof;
  const adverse = order.peer_proof;
  const facePreuve = order.role === 'seller' ? face : 'le vendeur';
  return (
    <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
      {mienne ? (
        <>
          Ta preuve : <EtatPreuve preuve={mienne} />
        </>
      ) : (
        <>Aucune capture jointe. Ajoute la preuve de paiement pour ouvrir « J&apos;ai payé ».</>
      )}
      {order.role === 'seller'
        ? adverse
          ? <> · capture de {facePreuve} : <EtatPreuve preuve={adverse} /></>
          : <> · {facePreuve} n&apos;a pas encore joint de capture.</>
        : null}
    </div>
  );
}