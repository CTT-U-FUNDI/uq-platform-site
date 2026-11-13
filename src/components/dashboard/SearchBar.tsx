import { useState, useEffect } from 'react';
import { IconSearch } from '../ui/Icons';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Rechercher..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Recherche en temps réel (debounce 200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="px-4 py-2">
      <div 
        className={`
          relative max-w-md mx-auto
          transition-all duration-200
          ${isFocused ? 'scale-[1.02]' : 'scale-100'}
        `}
      >
        {/* Cercle bleu autour de l'icône (réduit) */}
        <div 
          className={`
            absolute left-2.5 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-full flex items-center justify-center
            transition-all duration-200
            ${isFocused ? 'bg-uq-blue/25' : 'bg-uq-blue/15'}
          `}
        >
          <IconSearch size={12} color="#4A9EFF" />
        </div>
        
        {/* Input glassmorphism (compact) */}
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full 
            bg-uq-card/60 backdrop-blur-xl
            border rounded-pill
            pl-10 pr-4 py-2.5
            text-uq-text text-sm placeholder-uq-text-muted
            focus:outline-none
            transition-all duration-200
            ${isFocused 
              ? 'border-uq-blue-light/60 shadow-lg shadow-uq-blue/20' 
              : 'border-uq-border/50'}
          `}
        />

        {/* Indicateur "IA" quand on tape */}
        {query.length > 0 && (
          <div 
            className="absolute right-3 top-1/2 -translate-y-1/2
                       flex items-center gap-1
                       px-2 py-0.5 rounded-full
                       bg-uq-gradient
                       fade-in"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          >
            <span className="text-white text-[9px] font-bold tracking-wider">
              IA
            </span>
          </div>
        )}

        {/* Effet de glow subtil quand focus */}
        {isFocused && (
          <div 
            className="absolute inset-0 rounded-pill pointer-events-none
                       bg-uq-blue/5"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
