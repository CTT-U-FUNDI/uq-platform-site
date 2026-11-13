import { IconStar, IconLocation, IconPlay } from '../ui/Icons';
import * as MetierIcons from '../icons/metiers/MetierIcons';
import { Icon } from '../ui/Icon';

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description: string;
    rating: number;
    reviewCount?: number;
    distance?: string;
    priceBORB?: number;
    priceUSD?: number;
    photoUrl?: string;
    shopThumbnail?: string;
    videoUrl?: string;
    category?: string;
    itemType?: string;
  };
  onViewProduct?: () => void;
  onBuy?: () => void;
  onContact?: () => void;
  onAgent?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

const CATEGORY_STYLES: Record<string, { icon: string; gradient: string; color: string }> = {
  commerce: { icon: 'IconBoutique', gradient: 'from-purple-600 to-purple-900', color: '#8B5CF6' },
  alimentation: { icon: 'IconRestaurant', gradient: 'from-orange-500 to-red-900', color: '#F97316' },
  transport: { icon: 'IconAeroport', gradient: 'from-blue-500 to-blue-900', color: '#4A9EFF' },
  spiritualite: { icon: 'IconEglise', gradient: 'from-yellow-500 to-yellow-900', color: '#FBBF24' },
  hebergement: { icon: 'IconHotel', gradient: 'from-pink-500 to-purple-900', color: '#EC4899' },
  loisirs: { icon: 'IconBar', gradient: 'from-green-500 to-green-900', color: '#4ADE80' },
  beaute: { icon: 'IconSalon', gradient: 'from-pink-400 to-pink-900', color: '#F472B6' },
  mecanique: { icon: 'IconAtelier', gradient: 'from-gray-500 to-gray-900', color: '#94A3B8' },
  immobilier: { icon: 'IconVenteSolo', gradient: 'from-teal-500 to-teal-900', color: '#14B8A6' },
  service: { icon: 'IconService', gradient: 'from-indigo-500 to-indigo-900', color: '#6366F1' },
  business: { icon: 'IconBusiness', gradient: 'from-slate-500 to-slate-900', color: '#64748B' },
  hospitalite: { icon: 'IconHotel', gradient: 'from-red-400 to-red-900', color: '#EF4444' },
};

export function ShopCard({ 
  shop, 
  onViewProduct, 
  onBuy, 
  onContact,
  onAgent,
  onLike,
  onComment,
}: ShopCardProps) {
  const categoryStyle = CATEGORY_STYLES[shop.category || 'commerce'] || CATEGORY_STYLES.commerce;
  const IconComponent = (MetierIcons as any)[categoryStyle.icon];
  const gradientClass = 'bg-gradient-to-br ' + categoryStyle.gradient;
  
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
      
      {shop.videoUrl ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30">
          <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg shadow-purple-500/50 border border-white/30 active:scale-90 transition-transform">
            <IconPlay size={28} color="white" />
          </button>
        </div>
      ) : shop.photoUrl ? (
        <img 
          src={shop.photoUrl} 
          alt={shop.name} 
          className="absolute inset-0 w-full h-full object-cover" 
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className={'absolute inset-0 ' + gradientClass + ' flex items-center justify-center'}>
          {IconComponent ? (
            <IconComponent size={160} color="rgba(255,255,255,0.15)" />
          ) : (
            <span className="text-9xl opacity-20"><Icon name="camera" size={20} /></span>
          )}
        </div>
      )}

      <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center gap-1.5 z-10">
        <IconLocation size={12} color="#4A9EFF" />
        <span className="text-white text-xs font-semibold">{shop.distance || 'N/A'}</span>
      </div>

      <div className="absolute right-3 bottom-48 flex flex-col items-center gap-4 z-10">
        
        <button onClick={onAgent} className="flex flex-col items-center active:scale-90 transition-all">
          <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-yellow-500/50 flex items-center justify-center text-white text-xl shadow-lg shadow-yellow-500/30">
            <Icon name="handshake" size={20} tone="success" />
          </div>
          <span className="text-yellow-400 text-[9px] font-bold mt-0.5 text-center leading-tight">
            Agent
          </span>
        </button>

        <button onClick={onLike} className="flex flex-col items-center active:scale-90 transition-all">
          <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl">
            <Icon name="heart" size={20} tone="brand" />
          </div>
          <span className="text-white text-[10px] font-semibold mt-0.5">
            {shop.reviewCount || 0}
          </span>
        </button>

        <button onClick={onComment} className="flex flex-col items-center active:scale-90 transition-all">
          <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl">
            <Icon name="message" size={20} tone="info" />
          </div>
          <span className="text-white text-[10px] font-semibold mt-0.5">
            {shop.reviewCount || 0}
          </span>
        </button>

      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col justify-end p-4 z-10">
        
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-white text-base font-bold line-clamp-1 flex-1">
            {shop.name}
          </h3>
          {shop.priceBORB && shop.priceBORB > 0 && (
            <span className="text-purple-400 text-sm font-bold whitespace-nowrap">
              {shop.priceBORB.toLocaleString()} BORB
            </span>
          )}
        </div>

        {shop.description && (
          <p className="text-gray-300 text-xs line-clamp-2 mb-2">
            {shop.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <IconStar size={12} color="#FFD700" filled />
            <span className="text-yellow-400 font-semibold">{(shop.rating || 0).toFixed(1)}</span>
          </span>
          {shop.distance && (
            <span><Icon name="pin" size={20} tone="brand" /> {shop.distance}</span>
          )}
          <span><Icon name="eye" size={20} /> {shop.reviewCount || 0}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onViewProduct}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white font-semibold text-xs border border-white/20 active:scale-95 transition-transform"
          >
            <Icon name="book" size={20} tone="info" /> VOIR
          </button>
          <button
            onClick={onContact}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-green-500/20 backdrop-blur-xl text-green-400 font-semibold text-xs border border-green-500/30 active:scale-95 transition-transform"
          >
            <Icon name="message" size={20} tone="info" /> CONTACTER
          </button>
          <button
            onClick={onBuy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-xs shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
          >
            <Icon name="wallet" size={20} tone="brand" /> ACHETER
          </button>
        </div>

      </div>

    </div>
  );
}
