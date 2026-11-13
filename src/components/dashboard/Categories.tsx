import { useState } from 'react';
import * as MetierIcons from '../icons/metiers/MetierIcons';
import { ALL_TEMPLATES, CATEGORIE_INFO } from '../../features/studio/templates';
import { Icon } from '../ui/Icon';

interface CategoriesProps {
  active?: string;
  onSelect?: (category: string) => void;
}

export function Categories({ active = 'all', onSelect }: CategoriesProps) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = (iconKey: string, size = 18, color = 'currentColor') => {
    const IconComponent = (MetierIcons as any)[iconKey];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
  };

  // ===== MODE COMPACT (défaut) =====
  if (!expanded) {
    const activeTemplate = ALL_TEMPLATES.find((t) => t.type === active);
    const activeCatInfo = activeTemplate ? CATEGORIE_INFO[activeTemplate.categorie] : null;

    return (
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {/* Bouton TOUT */}
        <button
          onClick={() => onSelect?.('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
            active === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-300 border border-white/10'
          }`}
        >
          <span className="text-sm"><Icon name="globe" size={16} tone="info" /></span>
          <span className="text-xs font-semibold">Tout</span>
        </button>

        {/* Catégorie active */}
        {activeTemplate && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap bg-purple-600/30 text-white border border-purple-500/50"
          >
            {getIcon(activeTemplate.iconKey, 14, activeTemplate.color)}
            <span className="text-xs font-semibold">{activeTemplate.nom}</span>
          </button>
        )}

        {/* Bouton déplier */}
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 text-gray-300 border border-white/10 whitespace-nowrap active:scale-95 transition-all"
        >
          <span className="text-xs">▼</span>
          <span className="text-xs font-semibold">Catégories</span>
        </button>
      </div>
    );
  }

  // ===== MODE ÉTENDU =====
  return (
    <div className="px-4 py-3 border-b border-white/10 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm"><Icon name="tag" size={16} tone="warning" /> Catégories</h3>
        <button
          onClick={() => setExpanded(false)}
          className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-xs active:scale-90 transition-all"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Grille de catégories par groupe */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {/* Bouton TOUT */}
        <button
          onClick={() => {
            onSelect?.('all');
            setExpanded(false);
          }}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
            active === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-300 active:scale-95'
          }`}
        >
          <Icon name="globe" size={20} tone="info" /> Tout afficher
        </button>

        {/* Catégories groupées */}
        {Object.entries(CATEGORIE_INFO).map(([catKey, catInfo]) => {
          const templates = ALL_TEMPLATES.filter((t) => t.categorie === catKey);
          if (templates.length === 0) return null;

          return (
            <div key={catKey}>
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
                {catInfo.icon} {catInfo.nom}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => {
                      onSelect?.(template.type);
                      setExpanded(false);
                    }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      active === template.type
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 active:scale-95'
                    }`}
                  >
                    {getIcon(template.iconKey, 18, active === template.type ? 'white' : template.color)}
                    <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
                      {template.nom}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
