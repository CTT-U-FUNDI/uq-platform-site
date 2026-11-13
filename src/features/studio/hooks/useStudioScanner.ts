// ====================
// SCANNER ARRIÈRE-PLAN — Analyse le profil utilisateur
// Détecte les intérêts, brouillons, suggère un Studio
// ====================

import { useEffect, useState } from 'react';

export interface UserProfile {
  accountId: string;
  nom: string;
  email: string;
  interets: string[];
  metiersProbables: string[];
  brouillons: number;
  suggestions: Array<{
    type: string;
    raison: string;
    confiance: number;
  }>;
}

export interface ScannerResult {
  loading: boolean;
  profile: UserProfile | null;
  suggestions: Array<{
    type: string;
    nom: string;
    icon: string;
    raison: string;
    confiance: number;
  }>;
  brouillons: any[];
  error: string | null;
}

export function useStudioScanner(): ScannerResult {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<ScannerResult['suggestions']>([]);
  const [brouillons, setBrouillons] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scan = async () => {
      try {
        // 1. Charger le profil utilisateur
        const accountId = 'UQ-00000001';
        
        // 2. Charger les brouillons
        const savedDrafts = localStorage.getItem('uq_drafts');
        const drafts = savedDrafts ? JSON.parse(savedDrafts) : [];
        setBrouillons(drafts);

        // 3. Charger les items existants pour détecter les intérêts
        const savedItems = localStorage.getItem('uq_items');
        const items = savedItems ? JSON.parse(savedItems) : [];

        // 4. Analyser les types d'items déjà créés
        const typesCrees = items.map((i: any) => i.type);
        const typeCount: Record<string, number> = {};
        typesCrees.forEach((t: string) => {
          typeCount[t] = (typeCount[t] || 0) + 1;
        });

        // 5. Générer des suggestions basées sur l'historique
        const suggestionsGenerees: ScannerResult['suggestions'] = [];

        // Suggérer le type le plus utilisé
        const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
        if (sortedTypes.length > 0) {
          const [topType, count] = sortedTypes[0];
          suggestionsGenerees.push({
            type: topType,
            nom: `Continuer ${topType}`,
            icon: '🔄',
            raison: `Tu as déjà créé ${count} item(s) de ce type`,
            confiance: 0.9,
          });
        }

        // Suggérer Vente Solo si pas encore fait
        if (!typeCount['vente_solo']) {
          suggestionsGenerees.push({
            type: 'vente_solo',
            nom: 'Vendre un article',
            icon: '🏷️',
            raison: 'Tu peux vendre ton iPhone, parcelle, maison...',
            confiance: 0.8,
          });
        }

        // Suggérer Boutique si pas encore fait
        if (!typeCount['boutique']) {
          suggestionsGenerees.push({
            type: 'boutique',
            nom: 'Ouvrir une boutique',
            icon: '🏪',
            raison: 'Tu peux vendre plusieurs produits régulièrement',
            confiance: 0.7,
          });
        }

        // Suggérer Atelier si pas encore fait
        if (!typeCount['atelier']) {
          suggestionsGenerees.push({
            type: 'atelier',
            nom: 'Proposer un service',
            icon: '🔧',
            raison: 'Tu peux offrir tes compétences (réparation, coiffure...)',
            confiance: 0.6,
          });
        }

        setSuggestions(suggestionsGenerees);
        setProfile({
          accountId,
          nom: 'delis-dev',
          email: 'delis@ufundi.uq',
          interets: Object.keys(typeCount),
          metiersProbables: sortedTypes.slice(0, 3).map(([t]) => t),
          brouillons: drafts.length,
          suggestions: suggestionsGenerees.map((s) => ({
            type: s.type,
            raison: s.raison,
            confiance: s.confiance,
          })),
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    // Lancer le scan
    scan();
  }, []);

  return { loading, profile, suggestions, brouillons, error };
}
