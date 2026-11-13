import { getTemplate } from '../templates';
import * as MetierIcons from '../../../components/icons/metiers/MetierIcons';
import { Icon } from '../../../components/ui/Icon';

interface MiniSiteProps {
  item: any;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function MiniSite({ item, onClose, onAction }: MiniSiteProps) {
  const template = getTemplate(item.type);
  if (!template) return null;

  const getIcon = (iconKey: string, size = 24, color = 'currentColor') => {
    const IconComponent = (MetierIcons as any)[iconKey];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
  };

  const statutLabels: Record<string, string> = {
    disponible: 'DISPONIBLE',
    vendu: 'VENDU',
    en_cours: 'EN COURS',
    termine: 'TERMINÉ',
    epuise: 'ÉPUISÉ',
    ferme: 'FERMÉ',
    pause: 'EN PAUSE',
    brouillon: 'BROUILLON',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      
      {/* Header minimal */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
        >
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${template.color}30` }}
          >
            {getIcon(template.iconKey, 16, template.color)}
          </div>
          <span className="text-white font-semibold text-sm">{template.nom}</span>
        </div>
      </div>

      {/* Photo/Vidéo PLEINE LARGEUR */}
      <div className="relative flex-1 bg-black">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.titre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-30"><Icon name="camera" size={20} /></span>
          </div>
        )}

        {/* Overlay sombre en bas pour lisibilité */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent" />

        {/* Overlay sombre à droite pour les boutons */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/70 to-transparent" />

        {/* Statut overlay si non disponible */}
        {item.statut !== 'disponible' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-6xl font-bold rotate-[-15deg] drop-shadow-2xl">
              {statutLabels[item.statut]}
            </span>
          </div>
        )}

        {/* ─── BOUTONS À DROITE (style TikTok) ─── */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
          
          {/* Avatar créateur */}
          <button
            onClick={() => onAction('profil')}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border-2 border-white flex items-center justify-center text-white text-lg active:scale-90 transition-all"
          >
            <Icon name="user" size={20} />
          </button>

          {/* ❤️ AIMER */}
          <button
            onClick={() => onAction('aimer')}
            className="flex flex-col items-center active:scale-90 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl">
              <Icon name="heart" size={24} tone="brand" />
            </div>
            <span className="text-white text-xs font-semibold mt-1">
              {item.aimer || 0}
            </span>
          </button>

          {/* 💬 COMMENTER */}
          <button
            onClick={() => onAction('commenter')}
            className="flex flex-col items-center active:scale-90 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl">
              <Icon name="message" size={24} tone="info" />
            </div>
            <span className="text-white text-xs font-semibold mt-1">
              {item.avis || 0}
            </span>
          </button>

          {/* 💰 ACHETER */}
          <button
            onClick={() => onAction('acheter')}
            className="flex flex-col items-center active:scale-90 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/50">
              <Icon name="wallet" size={24} tone="brand" />
            </div>
            {item.prix && (
              <span className="text-purple-400 text-xs font-bold mt-1">
                {item.prix} BORB
              </span>
            )}
          </button>

          {/* 🤝 DEVENIR COMMISSIONNAIRE */}
          <button
            onClick={() => onAction('commissionnaire')}
            className="flex flex-col items-center active:scale-90 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 flex items-center justify-center text-white text-2xl">
              <Icon name="handshake" size={24} tone="success" />
            </div>
            <span className="text-yellow-400 text-[10px] font-semibold mt-1 text-center leading-tight">
              Agent
            </span>
          </button>

          {/* 📖 LIRE LE CONTENU COMPLET */}
          <button
            onClick={() => onAction('lire')}
            className="flex flex-col items-center active:scale-90 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-2xl">
              <Icon name="book" size={24} tone="info" />
            </div>
            <span className="text-white text-[10px] font-semibold mt-1">
              Détails
            </span>
          </button>

        </div>

        {/* ─── INFOS EN BAS (style TikTok) ─── */}
        <div className="absolute bottom-0 left-0 right-20 p-4 z-10">
          
          {/* Créateur */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {item.createurNom?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-white font-bold text-sm">
              @{item.createurNom || 'createur'}
            </span>
          </div>

          {/* Titre */}
          <h2 className="text-white font-bold text-lg mb-2 leading-tight">
            {item.titre}
          </h2>

          {/* Description courte */}
          {item.description && (
            <p className="text-gray-300 text-sm line-clamp-2 mb-2">
              {item.description}
            </p>
          )}

          {/* Stats inline */}
          <div className="flex items-center gap-3 text-gray-300 text-xs mb-2 flex-wrap">
            {item.prix && (
              <span className="text-purple-400 font-bold"><Icon name="wallet" size={20} tone="brand" /> {item.prix} BORB</span>
            )}
            {item.localisation?.distance && (
              <span><Icon name="pin" size={20} tone="brand" /> {item.localisation.distance}km</span>
            )}
            <span><Icon name="star" size={20} tone="warning" /> {item.note?.toFixed(1) || 'N/A'}</span>
            <span><Icon name="eye" size={20} /> {item.vues || 0}</span>
          </div>

          {/* Statut */}
          {item.statut !== 'disponible' && (
            <div className="inline-block px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50">
              <span className="text-red-400 text-xs font-bold">
                {statutLabels[item.statut]}
              </span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

