import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { BandeauConnexion } from '../components/BandeauConnexion';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBlock,
  IconButton,
  ScreenHeader,
  SearchInput,
  Segmented,
  Skeleton,
} from '../components/Ui';
import { useAsync, useDebounced } from '../lib/hooks';
import { listZandoItems, sqlStamp, zandoOwner, zandoStamp, type ZandoItem } from '../lib/api';
import {
  ingestZandoItems,
  learnedSearchTokens,
  logSearchClick,
  searchAffinity,
  searchHints,
  useLearningRevision,
  useSearchLogging,
} from '../lib/learning';
import { estVitrineBoutique, firstImageUrl, formatDureeRestante, formatInt, parseMediaUrls } from '../lib/format';
import { identityLabel, useIdentities } from '../lib/identity';
import { useDisplayAmount } from '../lib/currency';

type Sort = 'recent' | 'price_asc' | 'price_desc';

/**
 * Marche Zando au format catalogue : liste dense, image a gauche,
 * informations a droite. Les categories viennent des offres publiees.
 */
export function MarketScreen({
  onOpenItem,
  onGoStudio,
  onBack,
  onOpenBoutiqueSysteme,
}: {
  onOpenItem: (item: ZandoItem) => void;
  onGoStudio: () => void;
  onBack?: () => void;
  /** Boutique système de revente de connexion : le serveur seul la décrit. */
  onOpenBoutiqueSysteme?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<Sort>('recent');
  const search = useDebounced(query, 180);
  const feed = useAsync(() => listZandoItems(), []);
  /** Les prix sont rendus en devise : le BORB n'est pas une monnaie d'affichage. */
  const money = useDisplayAmount();
  const learningRevision = useLearningRevision();
  useSearchLogging(search);

  const hints = useMemo(
    () => (query.trim().length >= 2 ? searchHints(query) : []),
    // `learningRevision` force la relecture apres un apprentissage.
    [query, learningRevision],
  );

  const items = useMemo(
    () =>
      (feed.data?.items || []).filter((item) => {
        if (item.published === false) return false;
        if (item.sold) return false;
        const fin = sqlStamp(item.expires_at);
        return !(fin && fin <= Date.now());
      }),
    [feed.data],
  );

  // Lecture silencieuse du catalogue : les offres vues enrichissent les suggestions.
  useEffect(() => {
    if (items.length > 0) ingestZandoItems(items);
  }, [items]);

  const categories = useMemo(() => {
    const found = new Set(items.map((item) => item.category).filter(Boolean));
    return ['all', ...Array.from(found)];
  }, [items]);

  /** Le catalogue ne renvoie que le shop_id : on affiche le pseudo resolu. */
  const sellers = useIdentities(items.map((item) => zandoOwner(item)));
  const sellerOf = (item: ZandoItem) =>
    item.seller_pseudo || identityLabel(zandoOwner(item), sellers[zandoOwner(item).toUpperCase()]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchCategory = category === 'all' || item.category === category;
      const owner = zandoOwner(item);
      const seller = item.seller_pseudo || identityLabel(owner, sellers[owner.toUpperCase()]);
      const matchQuery =
        !needle ||
        item.title?.toLowerCase().includes(needle) ||
        item.description?.toLowerCase().includes(needle) ||
        seller?.toLowerCase().includes(needle);
      return matchCategory && matchQuery;
    });

    const learned = needle ? learnedSearchTokens(search) : {};
    const affinity = (item: ZandoItem) =>
      searchAffinity(learned, `${item.title} ${item.description} ${item.category}`);

    return list.sort((a, b) => {
      if (sort === 'price_asc') return Number(a.price_borb) - Number(b.price_borb);
      if (sort === 'price_desc') return Number(b.price_borb) - Number(a.price_borb);
      const relevance = affinity(b) - affinity(a);
      if (relevance !== 0) return relevance;
      return zandoStamp(b) - zandoStamp(a);
    });
  }, [items, category, search, sort, sellers, learningRevision]);

  return (
    <>
      <ScreenHeader
        title="Marché Zando"
        subtitle={`${formatInt(items.length)} offres publiées`}
        onBack={onBack}
        right={
          <>
            <IconButton name="refresh" label="Actualiser" onClick={feed.reload} />
            <IconButton name="plus" label="Publier une offre" onClick={onGoStudio} />
          </>
        }
      />

      {onOpenBoutiqueSysteme ? (
        <div className="v2-pad" style={{ paddingBottom: 0 }}>
          <BandeauConnexion onOpen={onOpenBoutiqueSysteme} />
        </div>
      ) : null}

      <div className="v2-pad" style={{ paddingTop: 6 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une offre, un vendeur…" />
      </div>

      {hints.length > 0 && (
        <div className="v2-scroll-x" style={{ marginTop: 8 }}>
          {hints.map((hint) => (
            <Chip key={hint} onClick={() => setQuery(hint)}>
              {hint}
            </Chip>
          ))}
        </div>
      )}

      <div className="v2-scroll-x" style={{ marginTop: 10 }}>
        {categories.map((entry) => (
          <Chip key={entry} active={category === entry} onClick={() => setCategory(entry)}>
            {entry === 'all' ? 'Tout' : entry}
          </Chip>
        ))}
      </div>

      <div className="v2-pad" style={{ marginTop: 12 }}>
        <Segmented
          value={sort}
          onChange={setSort}
          options={[
            { value: 'recent', label: 'Récents' },
            { value: 'price_asc', label: 'Prix ↑' },
            { value: 'price_desc', label: 'Prix ↓' },
          ]}
        />
      </div>

      <div className="v2-pad" style={{ marginTop: 12 }}>
        {feed.loading ? (
          <div className="v2-stack">
            {[0, 1, 2, 3].map((index) => (
              <Card key={index} style={{ display: 'flex', gap: 12 }}>
                <Skeleton height={84} width={84} radius={14} />
                <div style={{ flex: 1 }}>
                  <Skeleton height={14} width="85%" />
                  <div style={{ height: 8 }} />
                  <Skeleton height={12} width="55%" />
                  <div style={{ height: 8 }} />
                  <Skeleton height={16} width="35%" />
                </div>
              </Card>
            ))}
          </div>
        ) : feed.error ? (
          <ErrorBlock message={feed.error} onRetry={feed.reload} />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={query ? 'search' : 'market'}
              title={query ? 'Aucun résultat' : 'Le marché est vide'}
              description={
                query
                  ? `Rien ne correspond à « ${query} ».`
                  : 'Publie la première offre de ta zone depuis le Studio.'
              }
              action={
                <Button size="sm" icon="plus" onClick={onGoStudio}>
                  Publier une offre
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="v2-stack">
            {filtered.map((item) => {
              const media = parseMediaUrls(item.media_urls);
              const cover = firstImageUrl(media) || media[0];
              const fin = sqlStamp(item.expires_at);
              const reste = fin ? Math.max(0, Math.round((fin - Date.now()) / 1000)) : 0;
              return (
                <button
                  key={item.id}
                  className="v2-card v2-market-row"
                  onClick={() => {
                    if (query.trim().length >= 2) logSearchClick(query, item);
                    onOpenItem(item);
                  }}
                >
                  {cover ? (
                    <img className="v2-market-thumb" src={cover} alt="" loading="lazy" />
                  ) : (
                    <div
                      className="v2-market-thumb"
                      style={{ display: 'grid', placeItems: 'center', color: 'var(--v2-ink-3)' }}
                    >
                      <Icon name="image" size={24} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="v2-clamp-2" style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.3 }}>
                      {item.title}
                    </div>
                    {item.subtitle && !estVitrineBoutique(item) ? (
                      <div className="v2-muted v2-clamp-1" style={{ fontSize: 12, marginTop: 2 }}>
                        {item.subtitle}
                      </div>
                    ) : null}
                    <div className="v2-muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {sellerOf(item) || 'Zando'}
                      {item.category ? ` · ${item.category}` : ''}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 6,
                        marginTop: 6,
                      }}
                    >
                      {estVitrineBoutique(item) ? (
                        <span
                          className="v2-badge v2-badge--accent"
                          style={{ fontSize: 12.5, fontWeight: 720 }}
                        >
                          <Icon name="market" size={13} /> Boutique a explorer
                        </span>
                      ) : (
                        <span
                          className="v2-amount"
                          style={{ fontSize: 17, fontWeight: 780, color: 'var(--v2-accent)' }}
                        >
                          {money.format(item.price_borb)}
                        </span>
                      )}
                      {item.rating ? (
                        <span className="v2-muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>
                          {formatInt(item.rating)}/5
                        </span>
                      ) : null}
                      {reste > 0 && !estVitrineBoutique(item) ? (
                        <span
                          className="v2-badge v2-badge--accent"
                          style={{ fontSize: 11, marginLeft: item.rating ? 6 : 'auto' }}
                        >
                          <Icon name="clock" size={11} /> {formatDureeRestante(reste)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Icon name="forward" size={17} style={{ color: 'var(--v2-ink-3)', flex: 'none' }} />
                </button>
              );
            })}
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>
    </>
  );
}
