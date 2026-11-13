import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBlock,
  Field,
  Input,
  Proposal,
  Segmented,
  Sheet,
  Skeleton,
  Textarea,
} from './Ui';
import { useAsync, usePolling } from '../lib/hooks';
import { useSession } from '../lib/session';
import {
  commentPublication,
  createPublication,
  describeError,
  likePublication,
  listPublications,
  recordPublicationView,
  unlikePublication,
  type Publication,
  type PublicationKind,
} from '../lib/api';
import { formatCount, formatNumber, formatTime, relativeDay } from '../lib/format';
import { PublicProfileSheet } from './PublicProfileSheet';
import {
  ingestPublications,
  suggestPriceUnits,
  suggestText,
  suggestTitle,
  useLearningRevision,
} from '../lib/learning';

const KIND_LABEL: Record<string, string> = {
  annonce: 'Annonce',
  conference: 'Conférence',
  publication: 'Publication',
  status: 'Statut',
};

const KIND_ICON = {
  annonce: 'bell',
  conference: 'users',
  publication: 'chat',
  status: 'sparkles',
} as const;

const remainingLabel = (expiresAt: number): string => {
  const seconds = expiresAt - Math.floor(Date.now() / 1000);
  if (seconds <= 0) return 'Expirée';
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return `Expire dans ${days} j`;
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `Expire dans ${hours} h`;
  return `Expire dans ${Math.max(1, Math.floor(seconds / 60))} min`;
};

type KindFilter = 'all' | PublicationKind;

/**
 * Fil des publications ephemeres (annonces, conferences, posts).
 * Meme composant dans le canal Tendances du chat et dans Trading : lecture
 * commune de /api/publications, rafraichie en continu, disparition au bout
 * de 7 jours cote backend.
 */
export function PublicationsPanel({
  compose = false,
  compact = false,
  emptyHint = 'Publie une annonce ou une conférence : elle reste 7 jours.',
  onContact,
}: {
  compose?: boolean;
  compact?: boolean;
  emptyHint?: string;
  /** Ouvre la discussion avec le pseudo affiché (raccourci « Contacter » du profil). */
  onContact?: (pseudo: string) => void;
}) {
  const { toast } = useSession();
  const feed = useAsync(() => listPublications(), []);
  usePolling(() => feed.reload(), 8000);

  const [filter, setFilter] = useState<KindFilter>('all');
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState<string | null>(null);
  const [profilOuvert, setProfilOuvert] = useState<string | null>(null);
  /** Publications déjà comptées comme vues pendant cette session de lecture. */
  const [vuesEnregistrees, setVuesEnregistrees] = useState<Set<string>>(new Set());

  const [writeOpen, setWriteOpen] = useState(false);
  const [kind, setKind] = useState<PublicationKind>('annonce');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [price, setPrice] = useState('');
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState('');

  const publications = useMemo(() => feed.data?.publications || [], [feed.data]);

  // Lecture silencieuse du flux : chaque publication vue enrichit les suggestions.
  useEffect(() => {
    if (publications.length > 0) ingestPublications(publications);
  }, [publications]);

  // Suggestions tirees des publications deja lues (apprentissage local).
  const learningRevision = useLearningRevision();
  const titleProposal = useMemo(
    () => suggestTitle({ kind, seed: title }),
    [kind, title, learningRevision],
  );
  const textProposal = useMemo(
    () => (body.trim() ? null : suggestText({ kind, title })),
    [kind, title, body, learningRevision],
  );
  const priceProposalUnits = useMemo(
    () => suggestPriceUnits({ kind }),
    [kind, learningRevision],
  );

  const visible = useMemo(
    () =>
      filter === 'all'
        ? publications
        : publications.filter((entry) => entry.kind === filter),
    [publications, filter],
  );
  const displayed = compact ? visible.slice(0, 3) : visible;

  const selected = publications.find((entry) => entry.id === commentsFor) || null;

  const patch = (updated?: Publication) => {
    if (!updated) return;
    feed.setData({
      ...(feed.data || {}),
      publications: publications.map((entry) =>
        entry.id === updated.id ? updated : entry,
      ),
    });
  };

  /** Les routes like/view ne renvoient que le compte : on ne remplace que ce champ. */
  const patchCompteurs = (id: string, champs: Partial<Publication>) => {
    feed.setData({
      ...(feed.data || {}),
      publications: publications.map((entry) =>
        entry.id === id ? { ...entry, ...champs } : entry,
      ),
    });
  };

  const toggleLike = async (entry: Publication) => {
    if (likeBusy) return;
    setLikeBusy(entry.id);
    try {
      const resultat = entry.liked
        ? await unlikePublication(entry.id)
        : await likePublication(entry.id);
      patchCompteurs(entry.id, {
        likes: resultat.likes,
        liked: !entry.liked,
      });
    } catch (error) {
      toast(describeError(error, 'Action impossible.'), 'error');
    } finally {
      setLikeBusy(null);
    }
  };

  const ouvrirDetail = (entry: Publication) => {
    setCommentsFor(entry.id);
    setCommentDraft('');
    if (vuesEnregistrees.has(entry.id)) return;
    setVuesEnregistrees((precedentes) => new Set(precedentes).add(entry.id));
    recordPublicationView(entry.id)
      .then((resultat) => patchCompteurs(entry.id, { vues: resultat.vues }))
      .catch(() => {
        // La vue est secondaire : elle ne doit jamais bloquer la lecture.
        setVuesEnregistrees((precedentes) => {
          const copie = new Set(precedentes);
          copie.delete(entry.id);
          return copie;
        });
      });
  };

  const openComments = (entry: Publication) => ouvrirDetail(entry);

  const sendComment = async () => {
    if (!selected) return;
    const text = commentDraft.trim();
    if (!text) return;
    setCommentBusy(true);
    try {
      const result = await commentPublication(selected.id, text);
      patch(result.publication);
      setCommentDraft('');
    } catch (error) {
      toast(describeError(error, 'Commentaire refusé.'), 'error');
    } finally {
      setCommentBusy(false);
    }
  };

  const resetWrite = () => {
    setTitle('');
    setBody('');
    setPrice('');
    setPublishError('');
  };

  const submitPublication = async () => {
    const titre = title.trim();
    if (!titre) {
      setPublishError('Donne un titre à ta publication.');
      return;
    }
    const montant = Number(price.replace(',', '.'));
    setPublishBusy(true);
    setPublishError('');
    try {
      const created = await createPublication({
        kind,
        title: titre,
        body: body.trim() || undefined,
        price: Number.isFinite(montant) && montant > 0 ? montant : undefined,
      });
      if (created?.publication) ingestPublications([created.publication]);
      toast('Publication en ligne · 7 jours', 'success');
      setWriteOpen(false);
      resetWrite();
      feed.reload();
    } catch (error) {
      setPublishError(describeError(error, 'Publication impossible.'));
    } finally {
      setPublishBusy(false);
    }
  };

  return (
    <div className="v2-stack">
      {compose && (
        <Button
          block={!compact}
          size={compact ? 'sm' : undefined}
          variant={compact ? 'secondary' : 'primary'}
          icon="plus"
          onClick={() => setWriteOpen(true)}
        >
          {compact ? 'Publier' : 'Publier une annonce ou une conférence'}
        </Button>
      )}

      {!compact && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          <Icon name="filter" size={13} />
          Tout
        </Chip>
        <Chip active={filter === 'annonce'} onClick={() => setFilter('annonce')}>
          <Icon name="bell" size={13} />
          Annonces
        </Chip>
        <Chip active={filter === 'conference'} onClick={() => setFilter('conference')}>
          <Icon name="globe" size={13} />
          Conférences
        </Chip>
        <Chip active={filter === 'publication'} onClick={() => setFilter('publication')}>
          <Icon name="file" size={13} />
          Publications
        </Chip>
        <Chip active={filter === 'status'} onClick={() => setFilter('status')}>
          <Icon name="clock" size={13} />
          Statuts
        </Chip>
      </div>}

      {feed.loading && !feed.data ? (
        <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
          <Skeleton height={46} radius={14} />
          <Skeleton height={46} radius={14} />
        </Card>
      ) : feed.error ? (
        <ErrorBlock message={feed.error} onRetry={feed.reload} />
      ) : displayed.length === 0 ? (
        <Card>
          <EmptyState
            icon="sparkles"
            title="Aucune publication"
            description={emptyHint}
            action={
              compose ? (
                <Button size="sm" icon="plus" onClick={() => setWriteOpen(true)}>
                  Publier
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        displayed.map((entry) => (
          <Card key={entry.id} style={compact ? { padding: 12 } : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setProfilOuvert(entry.author_pseudo)}
                aria-label={`Profil de ${entry.author_pseudo}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 0,
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                }}
              >
                <Avatar label={entry.author_pseudo} src={entry.author_avatar} size={compact ? 32 : 40} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750, fontSize: 14 }}>{entry.author_pseudo}</div>
                  <div className="v2-muted" style={{ fontSize: 11.5 }}>
                    {relativeDay(entry.created_at)} · {formatTime(entry.created_at)}
                  </div>
                  {entry.author_certifie ? (
                    <span className="v2-badge v2-badge--gold" style={{ marginTop: 3 }}>
                      <Icon name="shield" size={11} />
                      {entry.author_badge}
                    </span>
                  ) : null}
                </div>
              </button>
              <span className="v2-badge v2-badge--accent">
                <Icon
                  name={KIND_ICON[entry.kind as keyof typeof KIND_ICON] || 'sparkles'}
                  size={12}
                />
                {KIND_LABEL[entry.kind] || entry.kind}
              </span>
            </div>

            {entry.media ? (
              <img
                src={entry.media}
                alt={entry.title}
                style={{
                  width: '100%',
                  maxHeight: compact ? 130 : 220,
                  objectFit: 'cover',
                  borderRadius: 16,
                  marginTop: 10,
                  background: 'var(--v2-surface-2)',
                }}
              />
            ) : null}

            <div style={{ marginTop: 8, fontWeight: 750, fontSize: compact ? 14 : 15 }}>{entry.title}</div>
            {entry.body ? (
              <div
                style={{
                  marginTop: 6,
                  fontSize: compact ? 12.5 : 13.5,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  ...(compact
                    ? {
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                        overflow: 'hidden',
                      }
                    : {}),
                }}
              >
                {entry.body}
              </div>
            ) : null}
            {typeof entry.price === 'number' && entry.price > 0 ? (
              <div style={{ marginTop: 8 }}>
                <span className="v2-badge">
                  <Icon name="coin" size={12} /> {formatNumber(entry.price, 2)}
                </span>
              </div>
            ) : null}

            <div
              className="v2-row-between"
              style={{ marginTop: 12, alignItems: 'center', gap: 8 }}
            >
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Button
                  size="sm"
                  variant={entry.liked ? 'primary' : 'ghost'}
                  icon="sparkles"
                  loading={likeBusy === entry.id}
                  onClick={() => toggleLike(entry)}
                  aria-label={entry.liked ? 'Retirer mon like' : 'Like'}
                >
                  {formatCount(entry.likes)}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="chat"
                  onClick={() => openComments(entry)}
                  aria-label="Commentaires"
                >
                  {formatCount(entry.comment_count)}
                </Button>
                <span
                  className="v2-muted"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '0 4px' }}
                >
                  <Icon name="eye" size={13} />
                  {formatCount(entry.vues)}
                </span>
              </div>
              <span
                className="v2-muted"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
              >
                <Icon name="clock" size={12} />
                {remainingLabel(entry.expires_at)}
              </span>
            </div>
          </Card>
        ))
      )}

      {/* Commentaires d'une publication */}
      <Sheet
        open={Boolean(selected)}
        onClose={() => setCommentsFor(null)}
        title={selected?.title || 'Commentaires'}
        subtitle={
          selected
            ? `${selected.author_pseudo} · ${selected.comment_count} commentaire(s)`
            : undefined
        }
        footer={
          <>
            <Field label="Ton commentaire">
              <Textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Écris un commentaire…"
                rows={3}
                maxLength={500}
              />
            </Field>
            <Button
              block
              icon="send"
              loading={commentBusy}
              disabled={!commentDraft.trim()}
              onClick={sendComment}
              style={{ marginTop: 10 }}
            >
              Envoyer
            </Button>
          </>
        }
      >
        <div className="v2-stack">
          {(selected?.comments || []).length === 0 ? (
            <div className="v2-muted" style={{ fontSize: 13 }}>
              Aucun commentaire. Sois le premier.
            </div>
          ) : (
            (selected?.comments || []).map((entry, index) => (
              <div key={`${entry.created_at}-${index}`} style={{ display: 'flex', gap: 10 }}>
                <Avatar label={entry.pseudo} size={34} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{entry.pseudo}</span>
                    <span className="v2-muted" style={{ fontSize: 11 }}>
                      {relativeDay(entry.created_at)} · {formatTime(entry.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{entry.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Sheet>

      {/* Nouvelle publication */}
      <Sheet
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        title="Nouvelle publication"
        subtitle="Visible 7 jours dans Trading et le canal Tendances"
        footer={
          <Button block icon="send" loading={publishBusy} onClick={submitPublication}>
            Publier
          </Button>
        }
      >
        <div className="v2-stack">
          <Segmented
            value={kind}
            onChange={(value) => setKind(value)}
            options={[
              { value: 'annonce', label: 'Annonce', icon: 'bell' },
              { value: 'conference', label: 'Conférence', icon: 'globe' },
              { value: 'publication', label: 'Publication', icon: 'file' },
            ]}
          />
          <Field label="Titre">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex. Conférence trading samedi 18 h"
              maxLength={140}
            />
          </Field>
          {titleProposal && (
            <Proposal label="Titre proposé" value={titleProposal} onUse={() => setTitle(titleProposal)} />
          )}
          <Field label="Texte" hint="Optionnel">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Détails, lien d'inscription, conditions…"
              rows={4}
              maxLength={2000}
            />
          </Field>
          {textProposal && (
            <Proposal label="Texte proposé" value={textProposal} onUse={() => setBody(textProposal)} />
          )}
          <Field label="Prix" hint="Optionnel, en unité d'affichage">
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </Field>
          {priceProposalUnits !== null && (
            <Proposal
              label="Prix conseillé"
              value={formatNumber(priceProposalUnits, 2)}
              onUse={() => setPrice(String(priceProposalUnits))}
            />
          )}
          {publishError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--v2-negative)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Icon name="alert" size={16} />
              {publishError}
            </div>
          )}
        </div>
      </Sheet>

      {/* Profil public de l'auteur, ouvert depuis le flux */}
      <PublicProfileSheet
        pseudo={profilOuvert || ''}
        onClose={() => setProfilOuvert(null)}
        onContact={
          onContact
            ? (pseudo) => {
                setProfilOuvert(null);
                onContact(pseudo);
              }
            : undefined
        }
      />
    </div>
  );
}
