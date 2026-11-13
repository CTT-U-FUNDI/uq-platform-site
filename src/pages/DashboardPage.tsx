import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getShops, getDistribution, getCases } from '@/api/client';
import ZandoIcon from '@/components/ZandoIcon';
import { Icon } from '../components/ui/Icon';

export default function DashboardPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [shopsData, distData, casesData] = await Promise.all([
          getShops(),
          getDistribution(),
          getCases(),
        ]);
        setShops(shopsData.shops || []);
        setDistribution(distData);
        setCases(casesData.cases || []);
      } catch (err) {
        console.error('Erreur de chargement', err);
      }
    };
    loadData();
  }, []);

  const scrollDown = () => {
    if (currentIndex < shops.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const scrollUp = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleZandoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/zando');
  };

  return (
    <div className="min-h-screen bg-black text-white" onClick={scrollDown}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <h1 className="text-2xl font-bold"><Icon name="circle" size={24} tone="info" /> UQ PLATFORM</h1>
        <div className="flex gap-3">
          <span className="text-2xl"><Icon name="sparkle" size={24} tone="info" /></span>
          <span className="text-2xl"><Icon name="bell" size={24} tone="warning" /></span>
        </div>
      </div>

      {/* Catégories */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-white/10">
        {['🏪', '🍽️', '🎨', '⛪', '💼', '🚗', 'TOUT', '📷'].map((cat, i) => (
          <button key={i} className="px-4 py-2 bg-white/10 rounded-full text-sm whitespace-nowrap">
            {cat}
          </button>
        ))}
      </div>

      {/* Carte TikTok */}
      {shops.length > 0 && currentIndex < shops.length ? (
        <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
          <div className="bg-white/10 rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">{shops[currentIndex].name}</h2>
            <p className="text-gray-400">{shops[currentIndex].description}</p>
            <div className="mt-4 flex gap-2">
              <span className="px-3 py-1 bg-green-500/20 rounded-full"><Icon name="star" size={20} tone="warning" /> {shops[currentIndex].rating || 'N/A'}</span>
              <span className="px-3 py-1 bg-purple-500/20 rounded-full"><Icon name="circle" size={20} tone="success" /> Ouvert</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[60vh]">
          <p>Aucune boutique trouvée</p>
        </div>
      )}

      {/* Navigation AVEC BOUTON ZANDO */}
      <div className="p-4 flex justify-around items-center border-t border-white/10">
        <button className="text-2xl"><Icon name="briefcase" size={24} tone="muted" /></button>
        <button className="text-2xl"><Icon name="refresh" size={24} /></button>
        
        {/* BOUTON ZANDO (Z SVG) */}
        <button
          onClick={handleZandoClick}
          className="relative -mt-8 hover:scale-110 transition-transform"
          title="Zando — Créer une offre"
        >
          <div className="w-16 h-16 rounded-full shadow-lg shadow-purple-500/50 flex items-center justify-center bg-black">
            <ZandoIcon size={60} />
          </div>
        </button>
        
        <button className="text-2xl"><Icon name="message" size={24} tone="info" /></button>
        <button className="text-2xl"><Icon name="user" size={24} /></button>
      </div>
    </div>
  );
}
