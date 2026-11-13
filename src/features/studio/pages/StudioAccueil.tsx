import { useState } from 'react';
import { Icon, type IconName } from '../../../components/ui/Icon';

interface StudioAccueilProps {
  onBack: () => void;
  onSelectTemplate: (templateType: string) => void;
}

interface Suggestion {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  color: string;
  templateType: string;
  inspiration: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'vendre-telephone',
    icon: 'phone',
    title: 'Vends ton téléphone',
    description: 'iPhone, Samsung, Tecno... vends en quelques secondes',
    color: '#8B5CF6',
    templateType: 'vente_solo',
    inspiration: 'Tu ne l\'utilises plus ? Fais-en de l\'argent !',
  },
  {
    id: 'creer-eglise',
    icon: 'church',
    title: 'Crée ton église',
    description: 'Paroisse, mosquée, temple... rassemble ta communauté',
    color: '#FBBF24',
    templateType: 'eglise',
    inspiration: 'Ta foi mérite un espace numérique',
  },
  {
    id: 'entreprise',
    icon: 'building',
    title: 'Mets en avant ton entreprise',
    description: 'Boutique, restaurant, salon... développe ton commerce',
    color: '#4A9EFF',
    templateType: 'boutique',
    inspiration: 'Ton business, visible par toute la communauté UQ',
  },
  {
    id: 'atelier',
    icon: 'tool',
    title: 'Ouvre ton atelier',
    description: 'Mécanique, soudure, artisanat... propose tes services',
    color: '#94A3B8',
    templateType: 'atelier',
    inspiration: 'Ton savoir-faire, à portée de main',
  },
  {
    id: 'restaurant',
    icon: 'utensils',
    title: 'Crée ton restaurant',
    description: 'Cuisine locale, snack, bar... régale ton quartier',
    color: '#F97316',
    templateType: 'restaurant',
    inspiration: 'Ta cuisine mérite d\'être connue',
  },
  {
    id: 'hotel',
    icon: 'building',
    title: 'Ouvre ton hôtel',
    description: 'Hébergement, guesthouse, motel... accueille les voyageurs',
    color: '#EC4899',
    templateType: 'hotel',
    inspiration: 'Ton hospitalité, récompensée',
  },
  {
    id: 'transport',
    icon: 'car',
    title: 'Propose ton transport',
    description: 'Taxi, moto, camion... offre tes services de mobilité',
    color: '#4ADE80',
    templateType: 'transport',
    inspiration: 'Rends-toi utile et sois payé',
  },
  {
    id: 'salon',
    icon: 'sparkle',
    title: 'Ouvre ton salon',
    description: 'Coiffure, manucure, beauté... sublime tes clients',
    color: '#F472B6',
    templateType: 'salon',
    inspiration: 'Ton talent, à découvrir',
  },
  {
    id: 'vendre-maison',
    icon: 'house',
    title: 'Vends ta maison',
    description: 'Villa, parcelle, appartement... trouve un acheteur',
    color: '#14B8A6',
    templateType: 'vente_maison',
    inspiration: 'Ton bien, aux bonnes personnes',
  },
  {
    id: 'marche',
    icon: 'shoppingCart',
    title: 'Ouvre ton marché',
    description: 'Épicerie, alimentation... ravitaille ton quartier',
    color: '#8B5CF6',
    templateType: 'marche',
    inspiration: 'Deviens le point de repère',
  },
];

export function StudioAccueil({ onBack, onSelectTemplate }: StudioAccueilProps) {
  const [search, setSearch] = useState('');

  const filtered = SUGGESTIONS.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-y-auto bg-[var(--uq-bg-primary)] text-[var(--uq-text-primary)]">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <Icon name="arrowLeft" size={20} />
        </button>
        <h1 className="text-xl font-bold text-white"><Icon name="house" size={20} /> Accueil Studio</h1>
        <div className="w-10" />
      </div>

      {/* Message d'accueil */}
      <div className="p-6 bg-gradient-to-br from-purple-900/30 to-transparent">
        <h2 className="text-2xl font-bold text-white mb-2">
          <Icon name="hand" size={24} tone="info" /> Bienvenue dans le Studio
        </h2>
        <p className="text-gray-300 text-sm">
          Découvre comment gagner de l'argent avec UQ Platform.
          Choisis une suggestion pour commencer.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="Chercher une idée..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Suggestions */}
      <div className="p-4 space-y-3">
        {filtered.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelectTemplate(suggestion.templateType)}
            className="w-full text-left rounded-2xl p-4 active:scale-98 transition-all"
            style={{
              backgroundColor: suggestion.color + '15',
              borderLeft: '4px solid ' + suggestion.color,
            }}
          >
            <div className="flex items-start gap-4">
              <Icon name={suggestion.icon} size={28} />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-gray-300 text-xs mb-2">
                  {suggestion.description}
                </p>
                <p className="text-xs italic" style={{ color: suggestion.color }}>
                  <Icon name="lightbulb" size={14} tone="warning" /> {suggestion.inspiration}
                </p>
              </div>
              <div className="text-white text-xl flex-shrink-0"><Icon name="arrowRight" size={20} /></div>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucune suggestion trouvée</p>
          </div>
        )}
      </div>

    </div>
  );
}
