import { useState } from 'react';
import * as MetierIcons from '../../../components/icons/metiers/MetierIcons';
import { ALL_TEMPLATES, CATEGORIE_INFO } from '../templates';
import { IconSearchLens, IconCheck } from '../../../components/ui/Icons';
import { Icon } from '../../../components/ui/Icon';

interface ScannerProps {
  items: any[];
  onClose: () => void;
  onSelectItems: (items: any[]) => void;
}

export function Scanner({ items, onClose, onSelectItems }: ScannerProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const getIcon = (iconKey: string, size = 20, color = 'currentColor') => {
    const IconComponent = (MetierIcons as any)[iconKey];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
  };

  // Filtrer les items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !selectedType || item.itemType === selectedType;
    const matchesCat = !selectedCat || item.category === selectedCat;
    return matchesSearch && matchesType && matchesCat;
  });

  const toggleCheck = (id: string) => {
    const newSet = new Set(checkedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCheckedIds(newSet);
  };

  const handleFinish = () => {
    const selectedItems = items.filter((item) => checkedIds.has(item.id));
    onSelectItems(selectedItems);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      
      {/* ─── HEADER ─── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconSearchLens size={20} color="#4ADE80" />
            <h2 className="text-lg font-bold text-white">Scanner UQ</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm active:scale-90 transition-all"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="Que cherches-tu ?"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-full px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 text-sm"
          autoFocus
        />
      </div>

      {/* ─── CATÉGORIES ─── */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-white/10 overflow-x-auto flex gap-2">
        <button
          onClick={() => {
            setSelectedCat(null);
            setSelectedType(null);
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            !selectedCat && !selectedType ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300'
          }`}
        >
          Tout
        </button>
        {Object.entries(CATEGORIE_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => {
              setSelectedCat(key);
              setSelectedType(null);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCat === key ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300'
            }`}
          >
            {info.icon} {info.nom}
          </button>
        ))}
      </div>

      {/* ─── LES 31 ICÔNES DU STUDIO ─── */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-white/10">
        <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
          Filtrer par type
        </p>
        <div className="grid grid-cols-10 gap-1 max-h-16 overflow-y-auto">
          {ALL_TEMPLATES.map((template) => (
            <button
              key={template.type}
              onClick={() => {
                setSelectedType(selectedType === template.type ? null : template.type);
                setSelectedCat(null);
              }}
              className={`aspect-square rounded-md flex items-center justify-center transition-all ${
                selectedType === template.type
                  ? 'bg-purple-600 scale-105'
                  : 'bg-white/5 active:scale-95'
              }`}
              title={template.nom}
            >
              {getIcon(
                template.iconKey,
                12,
                selectedType === template.type ? 'white' : template.color
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── RÉSULTATS (LISTE avec CHECKBOX) ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-xs">
            {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}
          </p>
          {(selectedType || selectedCat || search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedType(null);
                setSelectedCat(null);
              }}
              className="text-purple-400 text-xs font-semibold"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {filteredItems.length > 0 ? (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const template = ALL_TEMPLATES.find((t) => t.type === item.itemType);
              const isChecked = checkedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    isChecked
                      ? 'bg-purple-600/20 border border-purple-500/50'
                      : 'bg-white/5 border border-white/10 active:bg-white/10'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                      isChecked
                        ? 'bg-purple-600'
                        : 'bg-white/10 border border-white/30'
                    }`}
                  >
                    {isChecked && <IconCheck size={12} color="white" />}
                  </div>

                  {/* Photo/Icon */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      template && getIcon(template.iconKey, 24, template.color)
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white font-semibold text-sm line-clamp-1">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      {item.priceBORB > 0 && (
                        <span className="text-purple-400 font-bold">
                          {item.priceBORB} BORB
                        </span>
                      )}
                      {item.distance && <span>{item.distance}</span>}
                      {item.rating > 0 && <span>{item.rating.toFixed(1)}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              {search || selectedType || selectedCat
                ? 'Aucun résultat pour ces filtres'
                : 'Aucun item publié'}
            </p>
          </div>
        )}
      </div>

      {/* ─── BOUTON FINIR ─── */}
      <div className="flex-shrink-0 p-3 border-t border-white/10 bg-black">
        <button
          onClick={handleFinish}
          disabled={checkedIds.size === 0}
          className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
            checkedIds.size > 0
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white active:scale-95 shadow-lg shadow-purple-500/30'
              : 'bg-white/10 text-gray-500'
          }`}
        >
          {checkedIds.size > 0
            ? `FINIR (${checkedIds.size} sélectionné${checkedIds.size > 1 ? 's' : ''})`
            : 'FINIR'}
        </button>
      </div>

    </div>
  );
}
