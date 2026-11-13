import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  Button,
  Card,
  ErrorBlock,
  Field,
  IconButton,
  IconTile,
  Input,
  KeyValue,
  Row,
  ScreenHeader,
  Skeleton,
} from '../components/Ui';
import { KycStepper, type Etape } from '../components/KycStepper';
import { CaptureStep, type CaptureUnique } from '../components/CaptureStep';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { useHelp } from '../lib/help';
import {
  canReclaim,
  describeError,
  getKycStatut,
  getKycStatus,
  submitIdentityDossier,
  submitVerification,
  type KycDossierStatut,
} from '../lib/api';
import { demarrerSessionKyc, type BilanSequence, type SessionKyc } from '../lib/kycLive';
import { formatDate } from '../lib/format';

type KycState = 'none' | 'pending' | 'verified' | 'rejected';

const stateOf = (raw: string | undefined): KycState => {
  if (raw === 'Verifie') return 'verified';
  if (raw === 'EnAttente') return 'pending';
  if (raw === 'Refuse') return 'rejected';
  return 'none';
};

const STATE_COPY: Record<KycState, { title: string; description: string; tone: 'accent' | 'green' | 'amber' | 'neutral' }> = {
  none: {
    title: 'Identité non vérifiée',
    description: 'Pièce d’identité + photo + contrôle de vivacité.',
    tone: 'accent',
  },
  pending: {
    title: 'Dossier en cours d’examen',
    description: 'En file de vérification.',
    tone: 'amber',
  },
  verified: {
    title: 'Identité vérifiée',
    description: 'Coffre et plafonds débloqués.',
    tone: 'green',
  },
  rejected: {
    title: 'Dossier refusé',
    description: 'Corrige et renvoie une photo nette.',
    tone: 'neutral',
  },
};

const ETAPES: Etape[] = [
  { cle: 'intro', titre: 'Préparation', icone: 'info' },
  { cle: 'identite', titre: 'Identité', icone: 'user' },
  { cle: 'piece', titre: 'Pièce', icone: 'file' },
  { cle: 'selfie', titre: 'Selfie', icone: 'camera' },
  { cle: 'vivacite', titre: 'Vivacité', icone: 'shield' },
  { cle: 'envoi', titre: 'Envoi', icone: 'check' },
];

const AIDES: Record<string, { titre: string; aide: string }> = {
  piece: {
    titre: 'Redresse ta pièce',
    aide: 'Pose-la à plat, sans reflet. Le cadre se ferme dès que les quatre coins sont nets.',
  },
  selfie: {
    titre: 'Regarde la caméra',
    aide: 'Reste immobile une seconde : la capture se déclenche toute seule.',
  },
  vivacite: {
    titre: 'Confirme que tu es vivant',
    aide: 'Le défi en bas du cadre change à chaque essai. Bouge lentement la tête jusqu’à la fin des images.',
  },
};

export function KycScreen({ onBack }: { onBack?: () => void }) {
  const { uq, refreshProfile, toast } = useSession();
  const help = useHelp();

  const dossier = useAsync<KycDossierStatut | null>(
    () => (uq ? getKycStatut(uq) : Promise.resolve(null)),
    [uq],
    { enabled: Boolean(uq) },
  );
  const system = useAsync(() => getKycStatus(), []);
  const reclaim = useAsync(() => canReclaim(), []);

  const [etape, setEtape] = useState(0);
  const [session, setSession] = useState<SessionKyc | null>(null);
  const [sessionOuverture, setSessionOuverture] = useState(false);
  const [piece, setPiece] = useState<CaptureUnique | null>(null);
  const [selfie, setSelfie] = useState<CaptureUnique | null>(null);
  const [bilan, setBilan] = useState<BilanSequence | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [birth, setBirth] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');

  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockResult, setUnlockResult] = useState<string | null>(null);

  const rawState = dossier.data?.statut;
  const state = stateOf(rawState);
  const copy = STATE_COPY[state];

  const components = (system.data as { components?: Record<string, boolean>; ready?: boolean } | null)
    ?.components;
  const reclaimData = reclaim.data as { can_reclaim?: boolean; raison?: string } | null;

  const cle = ETAPES[etape].cle;

  // Une session par capture : le défi de vivacité est à usage unique côté serveur.
  const ouvrirSession = useCallback(async () => {
    setSessionOuverture(true);
    try {
      const nouvelle = await demarrerSessionKyc();
      setSession(nouvelle);
      return nouvelle;
    } catch (error) {
      toast(describeError(error, 'Moteur de vérification indisponible.'), 'error');
      return null;
    } finally {
      setSessionOuverture(false);
    }
  }, [toast]);

  const aller = (prochaine: number) => {
    const cleProchaine = ETAPES[prochaine]?.cle;
    const capture = cleProchaine === 'piece' || cleProchaine === 'selfie' || cleProchaine === 'vivacite';
    if (capture) {
      if (sessionOuverture) return;
      // Un nouveau défi par étape : l'ancien bilan ne peut pas être rejoué.
      if (cleProchaine === 'vivacite') setBilan(null);
      void ouvrirSession().then((nouvelle) => {
        if (nouvelle) {
          setEtape(prochaine);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      return;
    }
    setEtape(prochaine);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Une session vit 120 s. Plutot que de laisser l'ecran mourir au bout de ce
    // delai, on en rouvre une en silence : la camera se rallume une fraction de
    // seconde, mais l'utilisateur garde la main sur son cadrage.
    if (!session) return;
    const capturePrise =
      (cle === 'piece' && piece) || (cle === 'selfie' && selfie) || (cle === 'vivacite' && bilan);
    if (capturePrise) return;
    const minuteur = window.setTimeout(() => {
      void ouvrirSession();
    }, 110_000);
    return () => window.clearTimeout(minuteur);
  }, [session, cle, piece, selfie, bilan, ouvrirSession]);

  const identiteValide =
    nom.trim().length >= 2 &&
    prenom.trim().length >= 2 &&
    documentNumber.trim().length >= 4 &&
    country.trim().length >= 2;

  const soumettre = async () => {
    if (!uq || !piece) return;
    setEnvoi(true);
    try {
      await submitIdentityDossier({
        uq_number: uq,
        nom: nom.trim(),
        prenom: prenom.trim(),
        date_naissance: birth.trim(),
        pays: country.trim(),
        adresse: address.trim(),
        telephone: phone.trim(),
        document_number: documentNumber.trim(),
        photo_base64: piece.base64,
        selfie_base64: selfie?.base64,
        session_vivacite: bilan?.session,
      });
      toast('Dossier envoyé pour vérification', 'success');
      setSession(null);
      dossier.reload();
      await refreshProfile().catch(() => undefined);
      onBack?.();
    } catch (error) {
      toast(describeError(error, 'Envoi impossible.'), 'error');
    } finally {
      setEnvoi(false);
    }
  };

  const unlock = async () => {
    if (!uq) return;
    setUnlockBusy(true);
    try {
      const result = (await submitVerification({ uq_number: uq })) as {
        status?: string;
        verified?: boolean;
        deverrouille?: boolean;
        key_generated?: boolean;
      };
      if (result?.deverrouille || result?.verified) {
        setUnlockResult('Coffre déverrouillé · clé locale prête');
        toast('Coffre déverrouillé', 'success');
      } else {
        setUnlockResult('Vérification incomplète : réessaie après validation du dossier');
        toast('Déverrouillage incomplet', 'error');
      }
      await refreshProfile().catch(() => undefined);
    } catch (error) {
      const piratage = (error as { response?: { data?: { piratage?: boolean } } })?.response?.data?.piratage;
      toast(
        piratage
          ? 'Intégrité du dossier compromise — contacte le support'
          : describeError(error, 'Déverrouillage impossible.'),
        'error',
      );
    } finally {
      setUnlockBusy(false);
    }
  };

  const retour = etape === 0 ? onBack : () => aller(Math.max(0, etape - 1));

  return (
    <>
      <ScreenHeader
        title={etape === 0 ? 'Vérification' : ETAPES[etape].titre}
        subtitle={etape === 0 ? 'Identité et accès au coffre' : `Étape ${etape + 1} sur ${ETAPES.length}`}
        onBack={retour}
        right={
          <>
            <IconButton name="info" label="Guide de vérification" onClick={() => help.openHelp('kyc')} />
            {etape === 0 ? (
              <IconButton name="refresh" label="Actualiser" onClick={dossier.reload} />
            ) : null}
          </>
        }
      />

      <div className="v2-pad">
        <KycStepper etapes={ETAPES} index={etape} onSelectif={(cible) => aller(cible)} />
      </div>

      {cle === 'intro' && (
        <>
          <div className="v2-pad">
            {dossier.loading ? (
              <Card>
                <div style={{ display: 'grid', gap: 12 }}>
                  <Skeleton height={20} width="55%" />
                  <Skeleton height={14} width="85%" />
                </div>
              </Card>
            ) : dossier.error ? (
              <ErrorBlock message={dossier.error} onRetry={dossier.reload} />
            ) : (
              <Card>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <IconTile
                    name={state === 'verified' ? 'shield' : state === 'pending' ? 'clock' : 'file'}
                    tone={copy.tone}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="v2-h3">{copy.title}</div>
                    <div className="v2-muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {copy.description}
                    </div>
                  </div>
                </div>

                {dossier.data?.soumis_at ? (
                  <div style={{ marginTop: 10 }}>
                    <KeyValue label="Dossier envoyé" value={formatDate(Number(dossier.data.soumis_at))} />
                    {dossier.data.decision_at ? (
                      <KeyValue label="Décision" value={formatDate(Number(dossier.data.decision_at))} />
                    ) : null}
                  </div>
                ) : null}

                {state === 'verified' ? (
                  <div className="kyc-parcours">
                    <Row
                      icon="check"
                      iconTone="green"
                      title="Identité confirmée"
                      subtitle="Tu peux rouvrir un parcours pour corriger ton dossier."
                    />
                  </div>
                ) : (
                  <div className="kyc-parcours">
                    {[
                      ['user', 'Tes informations', 'Nom, prénom, pièce et contact.'],
                      ['file', 'La pièce d’identité', 'Guidée jusqu’aux quatre coins nets.'],
                      ['camera', 'Un selfie', 'Guidé comme une reconnaissance faciale.'],
                      ['shield', 'Un contrôle de vivacité', 'Un défi différent à chaque essai.'],
                    ].map(([icone, titre, sous]) => (
                      <Row key={titre} icon={icone as 'user'} title={titre} subtitle={sous} />
                    ))}
                  </div>
                )}

                <Button
                  block
                  icon={state === 'rejected' ? 'refresh' : 'forward'}
                  onClick={() => aller(1)}
                  style={{ marginTop: 12 }}
                >
                  {state === 'none' ? 'Commencer la vérification' : state === 'pending' ? 'Corriger mon dossier' : 'Refaire le parcours'}
                </Button>
              </Card>
            )}
          </div>

          <div className="v2-pad">
            <div className="v2-section-title">Accès au coffre</div>
            <Card>
              <div className="v2-muted" style={{ fontSize: 13, marginBottom: 10 }}>
                Le déverrouillage valide l’intégrité de ton dossier puis ouvre ton coffre et prépare ta clé
                locale. Aucune donnée n’est envoyée ailleurs.
              </div>
              {unlockResult && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'var(--v2-surface-2)',
                    marginBottom: 10,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  <Icon name="check" size={16} />
                  {unlockResult}
                </div>
              )}
              <Button
                variant={state === 'verified' ? 'primary' : 'secondary'}
                block
                icon="lock"
                loading={unlockBusy}
                onClick={unlock}
              >
                Déverrouiller mon coffre
              </Button>
            </Card>
          </div>

          <div className="v2-pad">
            <div className="v2-section-title">Vérification automatique</div>
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {system.loading ? (
                <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                  <Skeleton height={16} />
                  <Skeleton height={16} width="70%" />
                </div>
              ) : (
                <>
                  <Row
                    icon={(system.data as { ready?: boolean } | null)?.ready ? 'check' : 'alert'}
                    iconTone={(system.data as { ready?: boolean } | null)?.ready ? 'green' : 'amber'}
                    title="Service de vérification"
                    subtitle={
                      (system.data as { ready?: boolean } | null)?.ready
                        ? 'Tous les modules sont disponibles'
                        : 'Certains modules sont indisponibles'
                    }
                  />
                  {[
                    { key: 'tesseract', label: 'Lecture de la pièce' },
                    { key: 'ocr_script', label: 'Extraction de texte' },
                    { key: 'face_script', label: 'Comparaison du visage' },
                    { key: 'liveness_script', label: 'Détection du vivant' },
                  ].map((entry) => {
                    const ok = Boolean(components?.[entry.key]);
                    return (
                      <Row
                        key={entry.key}
                        icon={ok ? 'check' : 'close'}
                        iconTone={ok ? 'green' : 'neutral'}
                        title={entry.label}
                        subtitle={ok ? 'Disponible' : 'Indisponible'}
                      />
                    );
                  })}
                </>
              )}
            </Card>
          </div>

          {reclaimData?.can_reclaim && (
            <div className="v2-pad">
              <div className="v2-section-title">Avantage</div>
              <Card style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--v2-accent)', flex: 'none' }}>
                  <Icon name="gift" size={18} />
                </span>
                <div>
                  <div className="v2-h3">Réclamation exceptionnelle disponible</div>
                  <div className="v2-muted" style={{ fontSize: 12.5 }}>
                    {reclaimData.raison || 'Ton compte remplit les conditions de réclamation.'}
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="v2-pad">
            <Card style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--v2-ink-3)', flex: 'none' }}>
                <Icon name="info" size={18} />
              </span>
              <div className="v2-muted" style={{ fontSize: 12.5 }}>
                Les images de guidage ne sont pas enregistrées : seules la pièce et les captures validées
                entrent dans ton dossier.
              </div>
            </Card>
            <div style={{ height: 8 }} />
          </div>
        </>
      )}

      {cle === 'identite' && (
        <div className="v2-pad">
          <Card>
            <div className="v2-h3" style={{ marginBottom: 4 }}>Tes informations</div>
            <div className="v2-muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
              Elles doivent correspondre exactement à ta pièce d’identité.
            </div>
            <div className="v2-stack">
              <div style={{ display: 'flex', gap: 10 }}>
                <Field label="Prénom">
                  <Input value={prenom} onChange={(event) => setPrenom(event.target.value)} placeholder="Prénom" />
                </Field>
                <Field label="Nom">
                  <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Nom" />
                </Field>
              </div>

              <Field label="Date de naissance">
                <Input
                  value={birth}
                  onChange={(event) => setBirth(event.target.value)}
                  placeholder="JJ/MM/AAAA"
                  inputMode="numeric"
                />
              </Field>

              <Field label="Pays">
                <Input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="RD Congo" />
              </Field>

              <Field label="Adresse">
                <Input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Ville, quartier, avenue"
                />
              </Field>

              <Field label="Téléphone">
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+243 …"
                  inputMode="tel"
                />
              </Field>

              <Field label="Numéro de la pièce" hint="Passeport, permis ou carte d’identité">
                <Input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder="Numéro du document"
                />
              </Field>
            </div>
          </Card>

          <div className="kyc-barre">
            <Button variant="secondary" icon="back" onClick={() => aller(0)}>
              Retour
            </Button>
            <Button
              icon="camera"
              disabled={!identiteValide}
              onClick={() => {
                if (!identiteValide) {
                  toast('Nom, prénom, pays et numéro de pièce sont requis', 'error');
                  return;
                }
                aller(2);
              }}
            >
              Vers la pièce
            </Button>
          </div>
          {!identiteValide ? (
            <p className="v2-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              Renseigne au minimum prénom, nom, pays et numéro de pièce.
            </p>
          ) : null}
        </div>
      )}

      {(cle === 'piece' || cle === 'selfie' || cle === 'vivacite') && (
        <div className="v2-pad kyc-pad-capture">
          {session ? (
            <CaptureStep
              key={`${cle}-${session.session}`}
              mode={cle}
              session={session.session}
              defi={
                cle === 'vivacite'
                  ? { template: session.template, rect: session.rect, ratio: session.ratio }
                  : null
              }
              titre={AIDES[cle].titre}
              aide={AIDES[cle].aide}
              onUnique={(capture) => {
                if (cle === 'piece') setPiece(capture);
                else setSelfie(capture);
              }}
              onSequence={(mesure) => {
                setBilan(mesure);
                if (!mesure.ok) toast('Vivacité non confirmée : recommence', 'error');
              }}
              onRelancer={() => aller(etape)}
              onSuivant={() => aller(etape + 1)}
              onAnnuler={() => aller(Math.max(0, etape - 1))}
            />
          ) : (
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Skeleton height={18} width="45%" />
                <Skeleton height={120} />
                <Skeleton height={14} width="70%" />
              </div>
              <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 10 }}>
                {sessionOuverture ? 'Ouverture du moteur de guidage…' : 'Moteur indisponible : relance l’étape.'}
              </div>
              <Button block icon="refresh" style={{ marginTop: 12 }} onClick={() => void ouvrirSession()}>
                Rouvrir le guidage
              </Button>
            </Card>
          )}
        </div>
      )}

      {cle === 'envoi' && (
        <div className="v2-pad">
          <Card>
            <div className="v2-h3" style={{ marginBottom: 10 }}>Récapitulatif</div>
            <div className="kyc-recap">
              <figure className="kyc-recap-vue">
                {piece?.apercu ? (
                  <img src={piece.apercu} alt="Pièce d’identité capturée" />
                ) : (
                  <div className="kyc-recap-manquant">Pièce absente</div>
                )}
                <figcaption>Pièce {piece?.rectifie ? 'redressée' : 'brute'}</figcaption>
              </figure>
              <figure className="kyc-recap-vue">
                {selfie?.apercu ? (
                  <img src={selfie.apercu} alt="Selfie capturé" />
                ) : (
                  <div className="kyc-recap-manquant">Selfie absent</div>
                )}
                <figcaption>Selfie guidé</figcaption>
              </figure>
            </div>

            <div style={{ marginTop: 12 }}>
              <KeyValue label="Identité" value={`${prenom.trim()} ${nom.trim()}`.trim() || '—'} />
              <KeyValue label="Pièce n°" value={documentNumber.trim() || '—'} />
              <KeyValue
                label="Vivacité"
                value={
                  bilan
                    ? bilan.ok
                      ? `Confirmée · défi ${Math.round(bilan.nonce_ratio * 100)} %`
                      : 'Non confirmée'
                    : 'Non contrôlée'
                }
              />
            </div>

            {!bilan?.ok && (
              <div className="kyc-alerte">
                <Icon name="alert" size={16} />
                <span>
                  Sans contrôle de vivacité, le dossier sera examiné manuellement et mettra plus de temps.
                </span>
              </div>
            )}
          </Card>

          <div className="kyc-barre">
            <Button variant="secondary" icon="back" onClick={() => aller(!piece ? 2 : !selfie ? 3 : 4)} disabled={envoi}>
              Reprendre les captures
            </Button>
            <Button
              icon="check"
              loading={envoi}
              disabled={!piece}
              onClick={() => {
                if (!piece) {
                  toast('Capture la pièce d’identité d’abord', 'error');
                  return;
                }
                void soumettre();
              }}
            >
              Envoyer mon dossier
            </Button>
          </div>

          {piece ? null : (
            <p className="v2-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              L’envoi exige au moins la photo de la pièce.
            </p>
          )}
        </div>
      )}

      <div className="v2-pad">
        <div style={{ height: 8 }} />
      </div>
    </>
  );
}
