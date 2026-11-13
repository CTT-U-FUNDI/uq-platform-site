import { useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import api, { createZandoItem } from '../../../api/client';
import { TypeSelector } from '../components/TypeSelector';
import { CreateItemForm } from '../components/CreateItemForm';
import { MesZando } from './MesZando';
import { StudioHome } from './StudioHome';
import { StudioAccueil } from './StudioAccueil';

interface StudioPageProps {
  onBack: () => void;
}

type StudioView = 'home' | 'accueil' | 'mes-items' | 'select-type' | 'create-form';

export function StudioPage({ onBack }: StudioPageProps) {
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<StudioView>('home');
  const [selectedType, setSelectedType] = useState<string>('');
  const [itemCount, setItemCount] = useState(0);
  const [loadError, setLoadError] = useState('');

  // Charger le nombre d'items au démarrage
  useEffect(() => {
    loadItemCount();
  }, []);

  const uqNumber = localStorage.getItem('uq_number') || '';

  const loadItemCount = async () => {
    try {
      const data = await api.get('/api/zando/items');
      const items = data.data.items || [];
      const mine = uqNumber ? items.filter((i: any) => i.shop_id === uqNumber) : [];
      setItemCount(mine.length);
      setLoadError('');
    } catch (error) {
      console.error('Impossible de charger les offres du Studio depuis l’API.', error);
      setLoadError('Impossible de charger les offres depuis le serveur.');
    }
  };

  const handleTypeSelected = (type: string) => {
    setSelectedType(type);
    setView('create-form');
  };

  const handlePublish = async (data: any) => {
    try {
      const payload = {
        type: data.type || selectedType || 'boutique',
        title: data.title || data.titre || '',
        description: data.description || '',
        price_borb: Number(data.price_borb ?? data.prix),
        media_urls: typeof data.media_urls === 'string'
          ? data.media_urls
          : JSON.stringify(data.images || []),
        category: data.category || data.categorie || 'commerce',
      };
      const created = await createZandoItem(payload);
      if (created.status !== 'success' || !created.item_id) {
        throw new Error(created.message || 'Le serveur n’a pas confirmé la création de l’offre.');
      }
      const published = await api.post(`/api/zando/item/${encodeURIComponent(created.item_id)}/publish`);
      if (published.data?.status !== 'success') {
        throw new Error(`L’offre ${created.item_id} a été enregistrée, mais sa publication a échoué. ${published.data?.message || ''}`.trim());
      }

      await loadItemCount();
      setView('home');
      setSelectedType('');
    } catch (err) {
      console.error('La création ou publication Zando a échoué.', err);
      throw err instanceof Error ? err : new Error('La publication a échoué. Réessayez.');
    }
  };

  let content: ReactNode;
  if (view === 'home') {
    content = (
      <StudioHome
        onBack={onBack}
        onMesZando={() => setView('mes-items')}
        onCreateNew={() => setView('select-type')}
        onAccueil={() => setView('accueil')}
        itemCount={itemCount}
        loadError={loadError}
      />
    );
  } else if (view === 'accueil') {
    content = (
      <StudioAccueil
        onBack={() => setView('home')}
        onSelectTemplate={(type) => {
          setSelectedType(type);
          setView('create-form');
        }}
      />
    );
  } else if (view === 'mes-items') {
    content = <MesZando onBack={() => setView('home')} />;
  } else if (view === 'create-form') {
    content = (
      <CreateItemForm
        type={selectedType}
        onPublish={handlePublish}
        onCancel={() => setView('home')}
        onBack={() => setView('select-type')}
      />
    );
  } else {
    content = (
      <TypeSelector
        onSelect={handleTypeSelected}
        onCancel={() => setView('home')}
      />
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={view}
        className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-40 overflow-hidden"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 24 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 16 }}
        transition={reduceMotion ? { duration: 0.01 } : { type: 'spring', damping: 26, stiffness: 320 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
