import { useState } from 'react';
import { Icon } from './Icon';
import { Button, Card, EmptyState, ErrorBlock, IconButton, List, Row, Sheet, Skeleton, Textarea } from './Ui';
import { ExplorerElements, type ElementExplorer } from './ExplorerElements';
import { useAsync } from '../lib/hooks';
import {
  BOUTIQUE_SYSTEME_ID,
  connexionsProches,
  describeError,
  getShop,
  noterConnexion,
  type ConnexionVendeur,
} from '../lib/api';
import { lirePosition, type PositionAppareil } from '../lib/connexion';
import { formatDureeRestante, formatInt, formatNumber, initials } from '../lib/format';

/** Une pastille de mesure : ce que le serveur a vu, pas ce qu'il promet. */
const Mesure = ({ vendeur }: { vendeur: ConnexionVendeur }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {[
      `${vendeur.signal}%`,
      vendeur.debit_mbps > 0 ? `${formatNumber(vendeur.debit_mbps)} Mb/s` : null,
      vendeur.latence_ms > 0 ? `${formatNumber(vendeur.latence_ms)} ms` : null,
    ]
      .filter((fragment): fragment is string => Boolean(fragment))
      .map((fragment) => (
        <span key={fragment} className="v2-badge" style={{ fontSize: 11.5 }}>
          {fragment}
        </span>
      ))}
  </div>
);

/** Ce qu'une fiche a reçu comme voix, ou rien du tout quand rien n'est dit. */
const Avis = ({ vendeur }: { vendeur: ConnexionVendeur }) => {
  const total = vendeur.avis_total ?? 0;
  if (!total) {
    return (
      <span style={{ fontSize: 11.5, color: 'var(--v2-ink-3)' }}>
        Pas encore d’avis
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}>
      <span style={{ color: 'var(--v2-accent)' }}>
        <Icon name="star" size={12} filled />
      </span>
      <strong style={{ fontWeight: 760 }}>{formatNumber(vendeur.avis_moyenne ?? 0, 1)}</strong>
      <span style={{ color: 'var(--v2-ink-3)' }}>
        · {formatInt(total)} {total > 1 ? 'avis' : 'avis'}
      </span>
    </span>
  );
};

/** Un chiffre du flux : la valeur telle que le serveur l'a comptée. */
const Chiffre = ({ valeur, libelle }: { valeur: string; libelle: string }) => (
  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
    <span style={{ fontSize: 18, fontWeight: 820, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
      {valeur}
    </span>
    <span className="v2-muted" style={{ fontSize: 11.5, lineHeight: 1.25 }}>
      {libelle}
    </span>
  </span>
);

/**
 * Boutique système de revente de connexion, en mini-site horizontal.
 *
 * Elle appartient au compte du système, pas à un vendeur : rien ici ne se
 * facture, rien ne se renouvelle, et le tarif par seconde n'apparaît jamais —
 * le serveur ne le connaît pas. Cinq écrans défilent de gauche à droite
 * (Accueil · Connexions · Vendre · Comment · Confiance), comme toute boutique
 * Zando. Ce qu'ils affichent vient de deux routes : la fiche de la boutique
 * (`/api/shop/{id}`) et le classement pour la position de celui qui regarde
 * (`/api/connexion/nearby`).
 */
export function ConnexionBoutique({
  onClose,
  onVendre,
}: {
  onClose: () => void;
  onVendre?: () => void;
}) {
  const boutique = useAsync(() => getShop(BOUTIQUE_SYSTEME_ID), []);
  const [position, setPosition] = useState<PositionAppareil | null>(null);
  const [enPosition, setEnPosition] = useState(false);
  const [erreurPosition, setErreurPosition] = useState('');
  const [visuel, setVisuel] = useState(0);
  const [ficheANoter, setFicheANoter] = useState<ConnexionVendeur | null>(null);
  const [note, setNote] = useState(0);
  const [texteAvis, setTexteAvis] = useState('');
  const [erreurAvis, setErreurAvis] = useState('');
  const [envoiAvis, setEnvoiAvis] = useState(false);

  // La région se lit même sans position : le classement a besoin du GPS, les
  // compteurs du flux non. Sans coordonnées, le serveur trie à la puissance.
  const region = useAsync(
    () =>
      connexionsProches(
        position ? { latitude: position.latitude, longitude: position.longitude } : undefined,
      ),
    [position?.latitude, position?.longitude],
  );

  const capter = async () => {
    if (enPosition) return;
    setEnPosition(true);
    setErreurPosition('');
    try {
      setPosition(await lirePosition());
    } catch (error) {
      setErreurPosition(describeError(error, 'Position indisponible sur cet appareil.'));
    } finally {
      setEnPosition(false);
    }
  };

  const fiche = boutique.data?.shop;
  const galerie = (fiche?.gallery || []).filter((url) => Boolean(url));
  const hero = galerie[Math.min(visuel, Math.max(galerie.length - 1, 0))] || '';
  const vendeurs: ConnexionVendeur[] = [region.data?.en_avant, ...(region.data?.suivants || [])].filter(
    (entry): entry is ConnexionVendeur => Boolean(entry),
  );
  const flux = region.data?.vitalite;
  const ageDuFlux =
    flux && flux.derniere_fiche_a > 0
      ? formatDureeRestante(Math.max(0, Math.floor(Date.now() / 1000) - flux.derniere_fiche_a))
      : '';

  const ouvrirNotation = (vendeur: ConnexionVendeur) => {
    setFicheANoter(vendeur);
    setNote(vendeur.avis_moyenne ? Math.round(vendeur.avis_moyenne) : 0);
    setTexteAvis('');
    setErreurAvis('');
  };

  const poserAvis = async () => {
    if (!ficheANoter || note < 1) {
      setErreurAvis('Choisis une note de 1 à 5.');
      return;
    }
    setEnvoiAvis(true);
    setErreurAvis('');
    try {
      await noterConnexion(ficheANoter.id, note, texteAvis.trim());
      setFicheANoter(null);
      region.reload();
    } catch (error) {
      setErreurAvis(describeError(error, 'Avis non enregistré.'));
    } finally {
      setEnvoiAvis(false);
    }
  };

  /* ------------------------- Accueil : la vitrine ------------------------- */
  const accueil = fiche ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--v2-r-lg)',
          border: '1px solid var(--v2-line)',
        }}
      >
        {hero ? (
          <img src={hero} alt="" style={{ display: 'block', width: '100%', height: 168, objectFit: 'cover' }} />
        ) : (
          <div style={{ height: 74, background: 'var(--v2-surface-2)' }} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(6,10,16,0.08), rgba(6,10,16,0.86))',
          }}
        />
        <div style={{ position: 'relative', padding: '0 14px 13px', marginTop: hero ? -66 : 12 }}>
          {fiche.confiance_systeme ? (
            <span
              className="v2-badge v2-badge--accent"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8 }}
            >
              <Icon name="shield" size={12} /> {fiche.confiance}
            </span>
          ) : null}
          <div style={{ fontSize: 19, fontWeight: 820, color: '#fff', letterSpacing: '-0.02em' }}>
            {fiche.name}
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>
            {fiche.description}
          </div>
        </div>
      </div>

      {galerie.length > 1 ? (
        <div style={{ display: 'flex', gap: 8 }}>
          {galerie.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setVisuel(index)}
              aria-label={`Visuel ${index + 1} de la boutique`}
              style={{
                flex: 1,
                padding: 0,
                border: index === visuel ? '2px solid var(--v2-accent)' : '2px solid transparent',
                borderRadius: 12,
                overflow: 'hidden',
                background: 'none',
              }}
            >
              <img src={url} alt="" style={{ display: 'block', width: '100%', height: 54, objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      ) : null}

      <div className="v2-muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
        Glisse vers la droite pour voir les connexions près de toi, comment vendre la tienne,
        comment ça marche et ce que la boutique garantit.
      </div>
    </div>
  ) : null;

  /* -------------------- Connexions : le flux et la région -------------------- */
  const connexions = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="v2-section-title" style={{ margin: 0 }}>Le flux aujourd’hui</div>
      {region.loading && !flux ? (
        <Skeleton height={72} radius={16} />
      ) : !flux ? (
        <Card>
          <div className="v2-muted" style={{ fontSize: 12.5 }}>
            Les compteurs du flux n’ont pas pu être lus. Ils ne sont jamais estimés :
            rien n’apparaît à la place.
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Chiffre valeur={formatInt(flux.fiches)} libelle={flux.fiches > 1 ? 'fiches publiées' : 'fiche publiée'} />
            <Chiffre valeur={formatInt(flux.vendeurs)} libelle={flux.vendeurs > 1 ? 'comptes qui vendent' : 'compte qui vend'} />
            <Chiffre valeur={`${formatInt(flux.satellite)} · ${formatInt(flux.mobile)}`} libelle="satellite · mobile" />
            <Chiffre
              valeur={formatInt(flux.mesures_fraiches)}
              libelle={ageDuFlux ? `mesures de moins de 30 min · dernière ${ageDuFlux}` : 'mesures de moins de 30 min'}
            />
          </div>
        </Card>
      )}

      <div className="v2-section-title" style={{ margin: 0 }}>Près de toi</div>
      {!position ? (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="v2-muted" style={{ fontSize: 13 }}>
              La boutique se lit depuis ta position : le classement met en avant le vendeur le plus
              proche, à puissance égale. Sans position, rien n'est trié par distance.
            </div>
            <Button icon="pin" loading={enPosition} onClick={capter}>
              Capter ma position
            </Button>
            {erreurPosition ? (
              <div style={{ fontSize: 12.5, color: 'var(--v2-danger)' }}>{erreurPosition}</div>
            ) : null}
          </div>
        </Card>
      ) : region.loading ? (
        <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
          <Skeleton height={44} radius={14} />
          <Skeleton height={44} radius={14} />
        </Card>
      ) : region.error ? (
        <ErrorBlock message={region.error} onRetry={region.reload} />
      ) : vendeurs.length === 0 ? (
        <Card>
          <EmptyState
            icon="globe"
            title="Personne ne vend sa connexion près de toi"
            description="Aucune fiche publiée dans la région. Le rayon de recherche est celui du serveur, pas un choix de l'acheteur."
          />
        </Card>
      ) : (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <List plain>
            {vendeurs.map((vendeur, index) => (
              <Row
                key={vendeur.id}
                avatar={{ label: initials(vendeur.nom), src: vendeur.photo || undefined }}
                title={`${index === 0 ? '★ ' : ''}${vendeur.nom}`}
                subtitle={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12.5 }}>
                      {vendeur.reseau === 'starlink' ? 'Lien satellite' : 'Réseau mobile'}
                      {vendeur.distance_km != null ? ` · ${formatNumber(vendeur.distance_km)} km de toi` : ''}
                    </span>
                    <Mesure vendeur={vendeur} />
                    <Avis vendeur={vendeur} />
                  </div>
                }
                right={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="v2-badge" style={{ fontSize: 11.5 }}>
                        {formatNumber(vendeur.puissance)} / 100
                      </div>
                      <IconButton
                        name="edit"
                        compact
                        plain
                        label={`Noter la fiche ${vendeur.nom}`}
                        onClick={() => ouvrirNotation(vendeur)}
                      />
                    </div>
                    {vendeur.mesure_peu_fraiche ? (
                      <div style={{ fontSize: 11, color: 'var(--v2-ink-3)' }}>mesure ancienne</div>
                    ) : null}
                  </div>
                }
              />
            ))}
          </List>
        </Card>
      )}
    </div>
  );

  /* ----------------------- Vendre : passer de l'autre côté ----------------------- */
  const vendre = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 780 }}>Vendre ta connexion</div>
      <div className="v2-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
        Tu publies une fiche : ton nom, ta photo, la nature du lien (satellite ou mobile), ta
        position et la dernière mesure de ton appareil. Le serveur la classe pour les acheteurs
        proches — il ne fixe aucun prix.
      </div>
      {onVendre ? (
        <Button block icon="share" onClick={onVendre}>
          Vendre ma connexion
        </Button>
      ) : null}
      <Card style={{ display: 'flex', gap: 10 }}>
        <span style={{ color: 'var(--v2-accent)', flex: 'none' }}>
          <Icon name="info" size={18} />
        </span>
        <div className="v2-muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
          Le serveur tient le nom, la photo, la nature du lien, la position et la dernière mesure —
          jamais le tarif. Le prix par seconde reste sur l'appareil du vendeur et se demande de
          téléphone à téléphone. Cette page ne facture rien : la session d'échange et le compteur
          d'octets qui le règle sont la marche suivante.
        </div>
      </Card>
    </div>
  );

  /* ----------------------- Comment : ce que la boutique affiche ----------------------- */
  const comment = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 780 }}>Comment ça marche</div>
      {(fiche?.sections || []).map((section) => (
        <Card key={section.id}>
          <div style={{ fontSize: 14, fontWeight: 780, marginBottom: 6 }}>{section.titre}</div>
          <div className="v2-muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
            {section.contenu || ''}
          </div>
        </Card>
      ))}
    </div>
  );

  /* ----------------------- Confiance : ce qui est compté, pas décoré ----------------------- */
  const confiance = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 780 }}>
        {fiche?.confiance || 'Confiance'}
      </div>
      {fiche?.confiance_systeme ? (
        <span
          className="v2-badge v2-badge--accent"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}
        >
          <Icon name="shield" size={12} /> Portée par le compte du système
        </span>
      ) : null}
      <Card style={{ display: 'flex', gap: 10 }}>
        <span style={{ color: 'var(--v2-accent)', flex: 'none' }}>
          <Icon name="star" size={18} />
        </span>
        <div className="v2-muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
          Les compteurs du flux et les avis sont comptés, pas décorés : une fiche sans avis reste
          affichée sans étoile, et un compte ne pèse qu'une voix par fiche. La session d'échange
          n'étant pas encore ouverte, un avis déclare une expérience — il n'est pas la preuve
          chiffrée d'un volume échangé.
        </div>
      </Card>
    </div>
  );

  const elements: ElementExplorer[] = fiche
    ? [
        { id: 'accueil', etiquette: 'Accueil', fond: hero || undefined, noeud: accueil },
        { id: 'connexions', etiquette: 'Connexions', noeud: connexions },
        { id: 'vendre', etiquette: 'Vendre', noeud: vendre },
        { id: 'comment', etiquette: 'Comment', noeud: comment },
        { id: 'confiance', etiquette: 'Confiance', noeud: confiance },
      ]
    : [];

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        className="v2-sheet--explorer"
        title={fiche?.name || 'Boutique connexion'}
        subtitle={`Boutique du système · ${fiche?.confiance ?? ''}`}
        footer={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onVendre ? (
              <Button block icon="share" onClick={onVendre} style={{ flex: 1 }}>
                Vendre ma connexion
              </Button>
            ) : null}
            <IconButton
              name="refresh"
              label="Actualiser"
              onClick={() => {
                boutique.reload();
                region.reload();
              }}
            />
          </div>
        }
      >
        {boutique.loading && !boutique.data ? (
          <div className="v2-stack" style={{ gap: 14, paddingTop: 4 }}>
            <Skeleton height={168} radius={18} />
            <Skeleton height={92} radius={16} />
          </div>
        ) : boutique.error || !fiche ? (
          <ErrorBlock message={boutique.error || 'Boutique système indisponible.'} onRetry={boutique.reload} />
        ) : (
          <ExplorerElements elements={elements} />
        )}
      </Sheet>

      {ficheANoter ? (
        <Sheet
          open
          onClose={() => setFicheANoter(null)}
          title={`Noter ${ficheANoter.nom}`}
          subtitle="Une voix par compte et par fiche"
          footer={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button block loading={envoiAvis} disabled={note < 1} onClick={poserAvis} style={{ flex: 1 }}>
                Publier l’avis
              </Button>
              <IconButton name="close" label="Fermer la notation" onClick={() => setFicheANoter(null)} />
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((degre) => (
                <button
                  key={degre}
                  type="button"
                  onClick={() => setNote(degre)}
                  aria-label={`${degre} sur 5`}
                  aria-pressed={note === degre}
                  style={{
                    flex: 1,
                    display: 'grid',
                    placeItems: 'center',
                    height: 46,
                    borderRadius: 12,
                    border: `1px solid ${note >= degre ? 'var(--v2-accent)' : 'var(--v2-line)'}`,
                    background: note >= degre ? 'var(--v2-accent-soft)' : 'var(--v2-surface-2)',
                    color: note >= degre ? 'var(--v2-accent)' : 'var(--v2-ink-3)',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name="star" size={19} filled={note >= degre} />
                </button>
              ))}
            </div>

            <Textarea
              value={texteAvis}
              onChange={(event) => setTexteAvis(event.target.value.slice(0, 280))}
              placeholder="Ce que le lien a donné, en quelques mots…"
              rows={3}
            />
            <div className="v2-muted" style={{ fontSize: 11.5 }}>
              {texteAvis.length}/280 · ton identifiant n’est jamais affiché avec l’avis.
            </div>

            {erreurAvis ? <div style={{ fontSize: 12.5, color: 'var(--v2-danger)' }}>{erreurAvis}</div> : null}

            <div className="v2-muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
              Cet avis porte sur la fiche publiée : le nom, la mesure, la portée du lien. Il ne prouve pas
              un volume échangé — la session d'échange et son compteur d'octets restent à ouvrir.
            </div>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}