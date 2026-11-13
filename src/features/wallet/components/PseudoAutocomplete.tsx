// ====================
// PSEUDO AUTOCOMPLETE — Champ avec suggestions dès 3 caractères
// ====================

import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../api/client';
import { UQ_COLORS } from '../../../theme/colors';
import { IconSearch, IconUser, IconCheck } from '../../../components/ui/UQIcons';

export interface PseudoResult {
  pseudo: string;
  nom: string;
  prenom: string;
  display: string;
  // ===== PROFIL COMPLET =====
  sexe?: string;
  ville_provenance?: string;
  ville_actuelle?: string;
  statut_marital?: string;
  photo_url?: string;
  description?: string;
  emploi?: string;
  mobile_money_number?: string;
  mobile_money_operator?: string;
  verified?: boolean;
}

interface Props {
  value: string;
  onChange: (pseudo: string) => void;
  onSelect: (result: PseudoResult) => void;
  placeholder?: string;
}

export function PseudoAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [results, setResults] = useState<PseudoResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await apiClient.get(`/api/uq/pseudos?search=${encodeURIComponent(value)}`);
        setResults(r.data.pseudos || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (r: PseudoResult) => {
    setShowDropdown(false);
    onSelect(r);
  };;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <IconSearch size={16} color={UQ_COLORS.textSecondary} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 3 && setShowDropdown(true)}
          placeholder={placeholder || 'uq@...'}
          className="w-full p-3 pl-10 bg-[var(--uq-bg)] border border-[var(--uq-border)] rounded-lg text-[var(--uq-text)] text-sm focus:border-[var(--uq-magenta)] outline-none"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--uq-magenta)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--uq-card)] border border-[var(--uq-border)] rounded-lg shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--uq-card-light)] transition-colors text-left border-b border-[var(--uq-border)] last:border-b-0"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                   style={{ background: 'linear-gradient(135deg, #E63946, #B5378C, #7B5EA7)' }}>
                <IconUser size={14} color="#FFF" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--uq-text)] truncate">{r.pseudo}</p>
                {r.nom && (
                  <p className="text-xs text-[var(--uq-text-secondary)] truncate">
                    {r.prenom} {r.nom}
                  </p>
                )}
              </div>
              <IconCheck size={14} color={UQ_COLORS.green} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
