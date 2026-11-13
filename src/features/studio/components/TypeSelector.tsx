import { useState } from 'react';
import { ALL_TEMPLATES, CATEGORIE_INFO } from '../templates';
import * as MetierIcons from '../../../components/icons/metiers/MetierIcons';
import { Icon } from '../../../components/ui/Icon';

interface TypeSelectorProps {
  onSelect: (type: string) => void;
  onCancel: () => void;
}

export function TypeSelector({ onSelect, onCancel }: TypeSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredTemplates = ALL_TEMPLATES.filter((t) => {
    const matchesSearch = t.nom.toLowerCase().includes(search.toLowerCase()) ||
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCat || t.categorie === selectedCat;
    return matchesSearch && matchesCat;
  });

  const getIcon = (iconKey: string, size = 24, color = 'currentColor') => {
    const IconComponent = (MetierIcons as any)[iconKey];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[var(--uq-bg-primary)] text-[var(--uq-text-primary)]">
      
      {/* Header compact */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Que veux-tu créer ?</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Barre de recherche compacte */}
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-lueur w-full bg-white/5 border border-white/20 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none text-sm"
          autoFocus
        />
      </div>

      {/* Catégories compactes (horizontal scroll) */}
      <div className="px-3 py-2 border-b border-white/10 overflow-x-auto flex gap-2">
        <button
          onClick={() => setSelectedCat(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            !selectedCat ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300'
          }`}
        >
          Tout
        </button>
        {Object.entries(CATEGORIE_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setSelectedCat(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCat === key ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300'
            }`}
          >
            {info.icon} {info.nom}
          </button>
        ))}
      </div>

      {/* Grille COMPACTE style TikTok Shop */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2">
          {filteredTemplates.map((template) => (
            <button
              key={template.type}
              onClick={() => onSelect(template.type)}
              className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center gap-1.5
                         active:scale-95 transition-all relative overflow-hidden"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${template.color}20` }}
              >
                {getIcon(template.iconKey, 22, template.color)}
              </div>
              <span className="text-white font-semibold text-xs text-center leading-tight line-clamp-2">
                {template.nom}
              </span>
            </button>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            Aucun métier trouvé
          </div>
        )}
      </div>

      {/* Footer discret */}
      <div className="px-4 py-2 border-t border-white/10 text-center">
        <p className="text-gray-600 text-[10px]">
          <Icon name="bot" size={12} tone="info" /> L'IA peut te suggérer selon ton profil
        </p>
      </div>
    </div>
  );
}
