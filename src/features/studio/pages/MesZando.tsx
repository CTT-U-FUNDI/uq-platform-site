import { useState, useEffect } from 'react';
import api, { apiFetch } from '../../../api/client';
import { MiniSite } from '../components/MiniSite';
import { CreateItemForm } from '../components/CreateItemForm';
import { Icon, type IconName } from '../../../components/ui/Icon';

interface MesZandoProps {
  onBack: () => void;
}

type FilterType = 'all' | 'active' | 'sold' | 'expired' | 'draft';

interface ItemStatus {
  label: string;
  color: string;
  bg: string;
  icon: IconName;
}

const STATUS_MAP: Record<string, ItemStatus> = {
  active:  { label: 'ACTIF',     color: '#4ADE80', bg: 'rgba(74,222,128,0.15)',  icon: 'circle' },
  sold:    { label: 'VENDU',     color: '#FBBF24', bg: 'rgba(251,191,36,0.15)',  icon: 'circle' },
  expired: { label: 'EXPIRÉ',    color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   icon: 'circle' },
  draft:   { label: 'BROUILLON', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', icon: 'circle' },
};

export function MesZando({ onBack }: MesZandoProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editItem, setEditItem] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadMyItems();
  }, []);

  const uqNumber = localStorage.getItem('uq_number') || '';

  const loadMyItems = async () => {
    setLoading(true);
    try {
      if (!uqNumber) throw new Error('Identifiant du compte absent. Reconnectez-vous.');
      const resp = await api.get('/api/zando/items');
      const allItems = resp.data.items || [];

      const myItems = allItems.filter((item: any) => item.shop_id === uqNumber);

      // Ajouter un statut calculé si absent
      const itemsWithStatus = myItems.map((item: any) => {
        let status = 'active';

        // Si pas publié = brouillon
        if (item.published === false || item.published === 0) {
          status = 'draft';
        }

        // Si marqué vendu
        if (item.sold === true) {
          status = 'sold';
        }

        // Si expiré (date dépassée)
        if (item.expires_at) {
          const now = Date.now();
          const expiresAt = new Date(item.expires_at).getTime();
          if (expiresAt < now) {
            status = 'expired';
          }
        }

        return { ...item, _status: status };
      });

      setItems(itemsWithStatus);
      setLoadError('');
    } catch (error) {
      console.error('Impossible de charger les offres du compte.', error);
      setLoadError(error instanceof Error ? error.message : 'Impossible de charger tes offres.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item._status === filter;
  });

  const counts = {
    all: items.length,
    active: items.filter((i) => i._status === 'active').length,
    sold: items.filter((i) => i._status === 'sold').length,
    expired: items.filter((i) => i._status === 'expired').length,
    draft: items.filter((i) => i._status === 'draft').length,
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
  };

  const handleRepublish = async (item: any) => {
    setActionError('');
    try {
      const resp = await apiFetch(`/api/zando/item/${encodeURIComponent(item.id)}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok || data.status !== 'success') {
        throw new Error(data.message || 'La republication a échoué.');
      }
      await loadMyItems();
    } catch (error) {
      console.error('La republication Zando a échoué.', error);
      setActionError(error instanceof Error ? error.message : 'La republication a échoué.');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Supprimer cet item ?')) return;
    setActionError('');
    try {
      const resp = await apiFetch(`/api/zando/item/${encodeURIComponent(item.id)}/delete`, {
        method: 'POST',
      });
      const data = await resp.json();
      if (!resp.ok || data.status !== 'success') {
        throw new Error(data.message || 'La suppression a échoué.');
      }
      await loadMyItems();
    } catch (error) {
      console.error('La suppression Zando a échoué.', error);
      setActionError(error instanceof Error ? error.message : 'La suppression a échoué.');
    }
  };

  // Mode édition
  if (editItem) {
    return (
      <CreateItemForm
        type={editItem.type || 'boutique'}
        initialData={editItem}
        onPublish={async (data: any) => {
          const payload = {
            type: data.type || editItem.type || 'boutique',
            title: data.title || '',
            description: data.description || '',
            price_borb: Number(data.price_borb),
            media_urls: typeof data.media_urls === 'string'
              ? data.media_urls
              : JSON.stringify(data.images || []),
            category: data.category || 'general',
          };
          const response = await api.post(`/api/zando/item/${encodeURIComponent(editItem.id)}/update`, payload);
          if (response.data?.status !== 'success') {
            throw new Error(response.data?.message || 'La mise à jour a échoué.');
          }
          setEditItem(null);
          await loadMyItems();
        }}
        onCancel={() => setEditItem(null)}
        onBack={() => setEditItem(null)}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[var(--uq-bg-primary)] text-[var(--uq-text-primary)]">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <Icon name="arrowLeft" size={20} />
        </button>
        <h1 className="text-xl font-bold text-white"><Icon name="package" size={20} tone="warning" /> Mon Zando</h1>
        <div className="w-10" />
      </div>

      {(loadError || actionError) && (
        <div className="mx-4 mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200" role="alert">
          {actionError || loadError}
          {loadError && !loading && (
            <button onClick={loadMyItems} className="ml-3 underline">Réessayer</button>
          )}
        </div>
      )}

      {/* Filtres */}
      <div className="px-4 py-3 border-b border-white/10 flex gap-2 overflow-x-auto">
        {[
          { key: 'all', icon: 'list', label: 'Tous', count: counts.all },
          { key: 'active', icon: 'circle', label: 'Actifs', count: counts.active },
          { key: 'draft', icon: 'fileText', label: 'Brouillons', count: counts.draft },
          { key: 'sold', icon: 'tag', label: 'Vendus', count: counts.sold },
          { key: 'expired', icon: 'clock', label: 'Expirés', count: counts.expired },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as FilterType)}
            className={'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ' +
              (filter === f.key
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-400 border border-white/10')}
          >
            <span className="inline-flex items-center gap-1.5"><Icon name={f.icon as IconName} size={12} />{f.label} ({f.count})</span>
          </button>
        ))}
      </div>

      {/* Liste des items */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Chargement...</p>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 p-3">
            {filteredItems.map((item) => {
              const status = STATUS_MAP[item._status] || STATUS_MAP.active;
              return (
                <div
                  key={item.id}
                  className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] relative">
                    {item.media_urls ? (
                      (() => {
                        try {
                          const urls = typeof item.media_urls === 'string'
                            ? JSON.parse(item.media_urls)
                            : item.media_urls;
                          if (urls && urls[0]) {
                            return <img src={urls[0]} alt={item.title} className="w-full h-full object-cover" />;
                          }
                        } catch {}
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-black">
                            <span className="text-4xl opacity-40"><Icon name="camera" size={32} /></span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-black">
                        <span className="text-4xl opacity-40"><Icon name="camera" size={32} /></span>
                      </div>
                    )}

                    {/* Badge statut */}
                    <div
                      className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      <Icon name={status.icon} size={12} /> {status.label}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="p-3">
                    <p className="text-white text-sm font-bold line-clamp-1 mb-1">
                      {item.title}
                    </p>
                    {item.price_borb > 0 && (
                      <p className="text-purple-400 text-xs font-bold mb-2">
                        <Icon name="wallet" size={14} tone="brand" /> {item.price_borb.toLocaleString()} BORB
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-semibold active:scale-95"
                      >
                        <Icon name="pencil" size={20} tone="info" /> Modifier
                      </button>
                      {(item._status === 'expired' || item._status === 'sold' || item._status === 'draft') && (
                        <button
                          onClick={() => handleRepublish(item)}
                          className="flex-1 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-[10px] font-semibold active:scale-95"
                        >
                          <Icon name="refresh" size={20} /> Republier
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="py-1.5 px-2 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-semibold active:scale-95"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-4">
                {filter === 'all'
                  ? 'Aucune création pour le moment'
                  : 'Aucun item dans cette catégorie'}
              </p>
              <p className="text-gray-500 text-sm">
                Clique sur <Icon name="plus" size={14} /> pour créer ton premier item
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
