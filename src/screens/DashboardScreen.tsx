import { useState, useEffect, useRef } from 'react';
import apiClient, { hasToken } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import {
  IconCheck, IconSearch, IconCategorie,
  IconCatAll, IconCatCommerce, IconCatService, IconCatTransport,
  IconCatCommunaute, IconCatArt, IconCatTech, IconCatAgriculture,
  IconCatLoisirs, IconCatConstruction, IconCatUrgence,
  UQ_COLORS
} from '../components/ui/UQIcons';
import { Icon } from '../components/ui/Icon';
import { HeartIcon3D } from '../components/ui/Icons3D';
import { PublicUserIdentity } from '../components/ui/PublicUserIdentity';

interface Item {
  id: string;
  title: string;
  description: string;
  price_borb: number;
  category: string;
  media_urls: string | null;
  shop_id?: string;
  seller_id: string;
  seller_pseudo?: string;
  created_at: number;
  published?: boolean;
  rating?: number;
  review_count?: number;
  share_count?: number;
}

interface DashboardScreenProps {
  onLogout: () => void;
  onZandoClick?: () => void;
}

// ===== CATÉGORIES DU STUDIO UQ =====
const CATEGORIES = [
  { id: 'all', label: 'Tout', Icon: IconCatAll },
  { id: 'general', label: 'Général', Icon: IconCatAll },
  { id: 'commerce', label: 'Commerce', Icon: IconCatCommerce },
  { id: 'service', label: 'Services', Icon: IconCatService },
  { id: 'transport', label: 'Transport', Icon: IconCatTransport },
  { id: 'communaute', label: 'Communauté', Icon: IconCatCommunaute },
  { id: 'art', label: 'Art & Culture', Icon: IconCatArt },
  { id: 'tech', label: 'Technologie', Icon: IconCatTech },
  { id: 'agriculture', label: 'Agriculture', Icon: IconCatAgriculture },
  { id: 'loisirs', label: 'Loisirs', Icon: IconCatLoisirs },
  { id: 'construction', label: 'Construction', Icon: IconCatConstruction },
  { id: 'urgence', label: 'Urgence', Icon: IconCatUrgence },
];

export function DashboardScreen({ onLogout, onZandoClick }: DashboardScreenProps) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCategories, setShowCategories] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(() => new Set());
  const [interactionNotice, setInteractionNotice] = useState('');

  const feedRef = useRef<HTMLDivElement>(null);
  const viewedItems = useRef(new Set<string>());
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
    };
    if (showCategories) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategories]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get('/api/zando/items');
      const itemsList: Item[] = resp.data.items || [];
      const publishedItems = itemsList.filter((item) => item.published === true);
      setItems(publishedItems);
      setFilteredItems(publishedItems);
      setLoadError('');
    } catch (error) {
      console.error('Impossible de charger le flux Zando depuis l’API.', error);
      setLoadError('Impossible de charger les offres depuis le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = items;
    if (activeCategory !== 'all') result = result.filter(i => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    }
    setFilteredItems(result);
    setCurrentIndex(0);
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [items, activeCategory, searchQuery]);

  const handleFeedScroll = () => {
    const feed = feedRef.current;
    if (!feed || feed.clientHeight === 0) return;
    setCurrentIndex(Math.min(
      filteredItems.length - 1,
      Math.round(feed.scrollTop / feed.clientHeight),
    ));
  };

  useEffect(() => {
    const activeItem = filteredItems[currentIndex];
    if (!activeItem || !hasToken() || viewedItems.current.has(activeItem.id)) return;
    viewedItems.current.add(activeItem.id);
    apiClient.post(`/api/zando/item/${encodeURIComponent(activeItem.id)}/interact`, { type: 'view' })
      .catch((error) => console.warn('Le serveur n’a pas enregistré cette vue Zando.', error));
  }, [currentIndex, filteredItems]);

  useEffect(() => {
    const sharedItemId = new URLSearchParams(window.location.search).get('item');
    const sharedIndex = filteredItems.findIndex((item) => item.id === sharedItemId);
    const feed = feedRef.current;
    if (sharedIndex < 0 || !feed || feed.clientHeight === 0) return;
    feed.scrollTo({ top: sharedIndex * feed.clientHeight });
    setCurrentIndex(sharedIndex);
  }, [filteredItems]);

  const handleLike = async (item: Item) => {
    if (!hasToken()) {
      setInteractionNotice('Connectez-vous pour enregistrer cette offre.');
      return;
    }
    try {
      await apiClient.post(`/api/zando/item/${encodeURIComponent(item.id)}/interact`, { type: 'like' });
      setLikedItems((previous) => new Set(previous).add(item.id));
      setInteractionNotice('Offre enregistrée.');
    } catch (error) {
      console.error('Impossible d’enregistrer cette offre.', error);
      setInteractionNotice('Le serveur n’a pas pu enregistrer cette offre.');
    }
  };

  const handleShare = async (item: Item) => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('item', item.id);
    if (hasToken()) {
      try {
        await apiClient.post(`/api/zando/item/${encodeURIComponent(item.id)}/interact`, { type: 'share' });
      } catch (error) {
        console.warn('Le serveur n’a pas enregistré le partage Zando.', error);
      }
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: shareUrl.toString() });
      } else {
        await navigator.clipboard.writeText(shareUrl.toString());
        setInteractionNotice('Lien de l’offre copié.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Impossible de partager cette offre.', error);
      setInteractionNotice('Le partage a échoué. Réessayez.');
    }
  };

  const activeCatInfo = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="uq-screen uq-screen--fixed uq-spatial-background w-full min-w-0">

      {/* ═══ HEADER (chrome commun) ═══ */}
      <header className="uq-screen-header z-20">
        <div className="uq-screen-header-inner gap-2">

          {/* GAUCHE : Icône Catégorie + Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="uq-icon-tile relative flex items-center justify-center active:scale-95 transition-all"
              aria-label={t('market.categories')}
            >
              <IconCategorie size={20} color={UQ_COLORS.white} />
              {activeCategory !== 'all' && activeCatInfo && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--uq-blue)] border-2 border-[var(--uq-bg-primary)]" />
              )}
            </button>

            {/* DROPDOWN COMPACT */}
            {showCategories && (
              <div className="uq-glass-card absolute top-12 left-0 z-50 w-56 overflow-hidden shadow-2xl shadow-black/60">
                <div className="max-h-[70vh] overflow-y-auto py-1">
                  {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setShowCategories(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                          isActive ? 'bg-accent/10 text-white' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <cat.Icon size={16} color={isActive ? UQ_COLORS.gold : UQ_COLORS.gray} />
                        </div>
                        <span className="flex-1 text-left font-medium">{cat.label}</span>
                        {isActive && <IconCheck size={14} color={UQ_COLORS.green} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* MILIEU : Recherche */}
          <div className="flex-1 max-w-md mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('market.search')}
              className="w-full rounded-full border border-white/[0.08] bg-[#161F2F]/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#64748B] focus:border-accent focus:outline-none"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IconSearch size={16} color={UQ_COLORS.gray} />
            </div>
          </div>

          <span className="hidden shrink-0 text-xs font-semibold tracking-[0.16em] text-[#94A3B8] sm:block">ZANDO · MARCHÉ</span>
        </div>
      </header>

      {/* ═══ FLUX PLEIN ÉCRAN ═══ */}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-12 h-12 border-2 border-[var(--uq-blue)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center h-full px-8">
            <div className="text-center">
              <p className="text-4xl mb-3"><Icon name="alert" size={32} tone="warning" /></p>
              <p className="text-sm text-white/75 mb-4" role="alert">{loadError}</p>
              <button
                onClick={loadItems}
                className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/15"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full px-8">
            <div className="text-center">
              <p className="text-5xl mb-4"><Icon name="store" size={20} tone="brand" /></p>
              <h3 className="text-xl font-bold mb-2">{t('market.noResults')}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery ? `${t('market.noResults')} : "${searchQuery}"` : t('market.noItems')}
              </p>
              <button
                onClick={onZandoClick}
                className="px-6 py-3 bg-uq-gradient text-[#071126] rounded-xl text-sm font-bold"
              >
                <Icon name="plus" size={20} /> {t('market.publishFirst')}
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={feedRef}
            onScroll={handleFeedScroll}
            className="h-full overflow-y-auto snap-y snap-mandatory overscroll-y-contain scroll-smooth motion-reduce:scroll-auto"
            style={{ scrollbarWidth: 'none' }}
            aria-label="Offres Zando"
          >
            {filteredItems.map((item, index) => (
              <ShopCardVertical
                key={item.id}
                item={item}
                isActive={index === currentIndex}
                isLiked={likedItems.has(item.id)}
                onLike={() => handleLike(item)}
                onShare={() => handleShare(item)}
              />
            ))}
          </div>
        )}

        {interactionNotice && (
          <p
            className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-center text-xs text-white shadow-lg backdrop-blur"
            role="status"
            aria-live="polite"
          >
            {interactionNotice}
          </p>
        )}

        {/* Indicateur de position */}
        {filteredItems.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1">
            {filteredItems.slice(0, Math.min(5, filteredItems.length)).map((_, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all ${
                  idx === currentIndex ? 'h-6 bg-[var(--uq-blue)]' : 'h-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ===== CARTE PLEIN ÉCRAN =====
function ShopCardVertical({
  item,
  isActive,
  isLiked,
  onLike,
  onShare,
}: {
  item: Item;
  isActive: boolean;
  isLiked: boolean;
  onLike: () => void;
  onShare: () => void;
}) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const sellerUq = [item.seller_id, item.shop_id]
    .find((value) => typeof value === 'string' && /^UQ-\d+$/i.test(value)) || '';
  const photoUrl = (() => {
    try {
      if (item.media_urls) {
        const urls = typeof item.media_urls === 'string' ? JSON.parse(item.media_urls) : item.media_urls;
        return urls[0] || null;
      }
      return null;
    } catch { return null; }
  })();

  return (
    <article className="relative h-full min-h-full snap-start snap-always overflow-hidden bg-[var(--uq-bg-primary)] text-white">
      {photoUrl && (
        <img
          src={photoUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-3xl motion-safe:animate-[pulse_6s_ease-in-out_infinite] motion-reduce:animate-none"
          loading={isActive ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(0,229,255,0.1),transparent_55%),linear-gradient(to_bottom,rgba(5,7,10,0.15),rgba(5,7,10,0.2)_45%,#05070A_95%)]" />

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0D121B]/70 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-xl">
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(0,229,255,0.7)]" />
        Offre publiée
        {item.category && <span className="text-white/55">· {item.category}</span>}
      </div>

      <div className="absolute inset-x-4 bottom-[30%] top-16 flex items-center justify-center sm:bottom-[25%]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={item.title}
            loading={isActive ? 'eager' : 'lazy'}
            className="max-h-full max-w-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.55)]"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-full border border-white/10 bg-white/5 text-6xl shadow-[0_0_100px_rgba(0,229,153,0.12)]">
            <Icon name="shoppingBag" size={20} tone="brand" />
          </div>
        )}
      </div>

      <div className="absolute bottom-5 left-4 right-20 z-10 space-y-3 sm:bottom-8 sm:left-8 sm:right-24">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              <span className="shrink-0">{t('market.seller')}</span>
              {sellerUq ? (
                <PublicUserIdentity userId={sellerUq} size="sm" compact className="normal-case tracking-normal" />
              ) : (
                <span className="truncate normal-case tracking-normal">
                  {item.seller_pseudo || 'Vendeur'}
                </span>
              )}
            </div>
            <h2 className="line-clamp-2 text-xl font-extrabold leading-tight sm:text-3xl">{item.title}</h2>
          </div>
          <p className="uq-mono shrink-0 text-right text-xl font-bold text-white sm:text-2xl">
            {item.price_borb > 0 ? item.price_borb.toLocaleString() : '—'}
            {item.price_borb > 0 && <span className="ml-1 text-sm">BORB</span>}
          </p>
        </div>

        <p className={`text-sm leading-relaxed text-white/70 ${showDetails ? '' : 'line-clamp-2'}`}>
          {item.description || t('market.noDescription')}
        </p>
        <button
          onClick={() => setShowDetails((open) => !open)}
          className="text-xs font-semibold text-white/80 underline decoration-white/30 underline-offset-4"
          aria-expanded={showDetails}
        >
          {showDetails ? 'Réduire' : 'Lire la description'}
        </button>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onLike}
            disabled={isLiked}
            className="min-h-12 flex-1 rounded-2xl bg-uq-gradient px-4 text-sm font-bold text-[#05070A] shadow-[0_8px_30px_rgba(0,229,255,0.16)] transition-transform active:scale-95 disabled:opacity-70 motion-reduce:transition-none"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {isLiked ? <IconCheck size={16} color="#06231B" /> : <HeartIcon3D size={20} />}
              {isLiked ? 'Offre enregistrée' : 'Enregistrer l’offre'}
            </span>
          </button>
          <p className="max-w-28 text-[10px] leading-tight text-white/45">
            Achat et paiement en ligne non disponibles
          </p>
        </div>
      </div>

      <div className="absolute bottom-[34%] right-3 z-10 flex flex-col items-center gap-4 sm:right-6">
        <button
          onClick={onLike}
          disabled={isLiked}
          aria-label={isLiked ? 'Offre enregistrée' : 'Enregistrer cette offre'}
          className="flex flex-col items-center gap-1 rounded-full text-white transition-transform active:scale-90 disabled:text-[#FF3366]"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/40 backdrop-blur">
            <HeartIcon3D size={28} liked={isLiked} />
          </span>
          <span className="text-[10px] font-semibold">{isLiked ? 'Enregistré' : 'Garder'}</span>
        </button>
        <button
          onClick={onShare}
          aria-label="Partager cette offre"
          className="flex flex-col items-center gap-1 rounded-full text-white transition-transform active:scale-90"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/40 text-xl backdrop-blur"><Icon name="arrowUpRight" size={20} tone="success" /></span>
          <span className="text-[10px] font-semibold">Partager</span>
        </button>
      </div>
    </article>
  );
}
