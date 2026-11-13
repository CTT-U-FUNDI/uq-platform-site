import { useMemo } from 'react';
import { useAsync } from './hooks';
import { getFiatRates, getPrices, paritePointsParBorb, pointsVersBorb } from './api';
import type { OracleFiatResponse } from './api';
import { formatCurrency } from './format';

const STORAGE_KEY = 'uq_display_currency';

/** Devise d'affichage memorisee sur l'appareil (le coffre l'ecrit a chaque choix). */
export const readDisplayCurrency = (fallback = 'CDF'): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
};

export const storeDisplayCurrency = (code: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Stockage indisponible : la devise du compte reste la reference.
  }
};

export interface DisplayAmount {
  /** Devise dans laquelle les montants sont rendus. */
  currency: string;
  /** Valeur d'une unite interne dans cette devise, lue sur l'oracle. */
  perUnit: number;
  ready: boolean;
  /** Rend un montant exprime dans l'unite interne en devise d'affichage. */
  format: (units: number) => string;
  /** Parite points->BORB publiee par le moteur ; 0 = jamais recue sur l'appareil. */
  pointsParBorb: number;
  /** Rend une ecriture du grand livre (points) en devise d'affichage. */
  formatPoints: (points: number) => string;
  /** Provenance et fraicheur du taux utilise : affichables a l'identique partout. */
  taux: ProvenanceTaux;
}

/**
 * Provenance d'un lot de taux, normalisee depuis la reponse de l'oracle.
 *
 * Un ecran de taux sans mention de fraicheur ment par omission : le membre ne
 * peut pas distinguer une mediane calculee a la seconde du dernier taux capte
 * avant une coupure. Ces champs viennent du backend (`badge`, `age_secs`,
 * `devises_rejouees`) ou du cache local (`hors_ligne`) — jamais inventes ici.
 */
export interface ProvenanceTaux {
  badge: string;
  source: string;
  ageSecs: number;
  horsLigne: boolean;
  devisesRejouees: number;
  nbSources: number;
}

const PROVENANCE_VIDE: ProvenanceTaux = {
  badge: '',
  source: '',
  ageSecs: -1,
  horsLigne: false,
  devisesRejouees: 0,
  nbSources: 0,
};

/**
 * Devises fiat que l'oracle propose a l'affichage : la liste qu'il publie,
 * moins l'unite interne, moins la queue crypto annoncee par
 * `categories.crypto`. Aucun code n'est ecrit en dur, et le selecteur de devise
 * du profil comme celui du coffre lisent le meme resultat.
 */
export const devisesFiat = (payload?: OracleFiatResponse | null): string[] => {
  const declarees = payload?.devises || [];
  const crypto = Number(payload?.categories?.crypto) || 0;
  const sansUniteInterne = declarees.filter(
    (code) => !['BORB', 'BORB'].includes(String(code).toUpperCase()),
  );
  return crypto > 0 && crypto < sansUniteInterne.length
    ? sansUniteInterne.slice(0, sansUniteInterne.length - crypto)
    : sansUniteInterne;
};

/** Libelle de l'age d'un taux, en francais, pour le titre de la pastille. */
export const decrireAgeTaux = (ageSecs: number): string => {
  if (!Number.isFinite(ageSecs) || ageSecs < 0) return 'âge inconnu';
  if (ageSecs < 60) return `capté il y a ${Math.round(ageSecs)} s`;
  if (ageSecs < 3600) return `capté il y a ${Math.round(ageSecs / 60)} min`;
  if (ageSecs < 86400) return `capté il y a ${Math.round(ageSecs / 3600)} h`;
  return `capté il y a ${Math.round(ageSecs / 86400)} j`;
};

export const lireProvenanceTaux = (payload?: OracleFiatResponse | null): ProvenanceTaux => {
  if (!payload) return PROVENANCE_VIDE;
  return {
    badge: payload.badge || '',
    source: payload.source || '',
    ageSecs: Number(payload.age_secs ?? -1),
    horsLigne: payload.hors_ligne === true,
    devisesRejouees: Number(payload.devises_rejouees ?? 0),
    nbSources: Number(payload.nb_sources ?? 0),
  };
};

/**
 * Libellé unique de provenance, utilisé par la pastille comme par les
 * sous-titres d'écrans : un seul endroit décide de ce que le membre lit au pied
 * d'un montant converti.
 *
 * L'âge n'est ajouté que quand il commence à compter (au-delà de 5 min) : une
 * médiane calculée à la seconde n'a pas besoin d'un « capté il y a 0 s ».
 */
export const tauxProvenanceLabel = (taux: ProvenanceTaux, devise?: string): string => {
  const base = taux.badge || (taux.source ? `Taux · ${taux.source}` : '');
  if (!base) return '';
  const ages = taux.ageSecs >= 300 ? ` · ${decrireAgeTaux(taux.ageSecs)}` : '';
  const horsLigne = taux.horsLigne ? ' · réseau coupé' : '';
  return `${base}${ages}${horsLigne}${devise ? ` · ${devise}` : ''}`;
};

/**
 * Convertisseur de montants vers la devise d'affichage.
 *
 * Une seule implémentation de la formule `montant / taux_propre * taux_vue` :
 * recopier ce calcul écran par écran avait déjà divergé (l'un convertissait la
 * réserve BORB, l'autre non). Ici, l'absence de taux est un état du résultat,
 * jamais un taux implicite 1 pour 1.
 */
export interface SourceTaux {
  /** Table des taux publiés par l'oracle : unités par USD. */
  rates: Record<string, number>;
  /** Prix interne d'une unité dans la réserve de valeur, en USD. */
  usdRate: number;
  /** Devise dans laquelle le membre veut lire ses montants. */
  devise: string;
}

export interface ConvertisseurDevise extends SourceTaux {
  /** Taux de la devise d'affichage ; 0 = l'oracle ne l'a pas observée. */
  tauxDevise: number;
  /** Aucun taux exploitable : les montants convertis sont indisponibles. */
  sansTaux: boolean;
  /** Unité interne -> devise d'affichage, formatée. */
  versDevise: (unites: number) => string;
  /** Écriture du grand livre (points) -> devise d'affichage, formatée. */
  versDevisePoints: (points: number) => string;
  /** Solde exprimé dans sa propre devise -> valeur dans la devise d'affichage. */
  depuisDevise: (code: string, montant: number) => number;
  /** Somme de soldes multi-devises dans la devise d'affichage. */
  totalEnDevise: (lignes: { code: string; balance: number | string }[]) => number;
}

/**
 * Somme des soldes d'un portefeuille multi-devises, ramenée dans la devise
 * cible. Une ligne dont la devise n'est pas cotée par l'oracle est écartée :
 * une valeur qu'on ne peut pas convertir n'est pas une valeur à 0, et l'écran
 * qui l'afficherait comme telle gonflerait ou amputerait le total.
 */
export const totalEnDevise = (
  lignes: { code: string; balance: number | string }[],
  rates: Record<string, number>,
  devise: string,
): number => {
  const cible = Number(rates[devise]) || 0;
  if (!cible) return 0;
  return lignes.reduce((somme, ligne) => {
    const propre = Number(rates[ligne.code]) || 0;
    if (!propre) return somme;
    return somme + (Number(ligne.balance) / propre) * cible;
  }, 0);
};

export function useConvertisseurDevise(source: SourceTaux): ConvertisseurDevise {
  const convertisseur = useMemo(() => {
    const tauxDevise = Number(source.rates[source.devise]) || 0;
    const sansTaux = !source.usdRate || !tauxDevise;
    const versDevise = (unites: number) =>
      sansTaux
        ? '— taux indisponible'
        : formatCurrency(Number(unites) * source.usdRate * tauxDevise, source.devise);
    return {
      ...source,
      tauxDevise,
      sansTaux,
      versDevise,
      versDevisePoints: (points: number) => {
        const borb = pointsVersBorb(points);
        return borb === null ? '— parité indisponible' : versDevise(borb);
      },
      depuisDevise: (code: string, montant: number) => {
        const propre = Number(source.rates[code]) || 0;
        if (!propre || !tauxDevise) return 0;
        return (Number(montant) / propre) * tauxDevise;
      },
      totalEnDevise: (lignes) => totalEnDevise(lignes, source.rates, source.devise),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.rates, source.usdRate, source.devise]);
  return convertisseur;
}

/**
 * Convertisseur public (oracle + prix) pour les ecrans qui ne chargent pas le
 * portefeuille : le BORB n'y est jamais une monnaie, seules les devises
 * s'affichent. Aucun taux n'est ecrit en dur.
 */
export function useDisplayAmount(fallbackCurrency?: string): DisplayAmount {
  const state = useAsync(async () => {
    const [rates, prices] = await Promise.all([getFiatRates(), getPrices()]);
    return {
      table: (rates?.rates || {}) as Record<string, number>,
      usd: Number((prices?.prices as Record<string, number> | undefined)?.borb_usd || 0),
      provenance: lireProvenanceTaux(rates),
    };
  }, []);

  return useMemo(() => {
    const stored = readDisplayCurrency(fallbackCurrency || 'CDF');
    const table = state.data?.table || {};
    const usd = state.data?.usd || 0;
    // Devise memorisee inconnue de l'oracle : on retombe sur une devise publiee.
    const currency =
      !state.data || table[stored] ? stored : table.CDF ? 'CDF' : 'USD';
    const perUnit = usd * (Number(table[currency]) || 0);
    const format = (units: number) =>
      perUnit > 0 ? formatCurrency(Number(units) * perUnit, currency) : '—';
    return {
      currency,
      perUnit,
      ready: Boolean(state.data),
      taux: state.data?.provenance || PROVENANCE_VIDE,
      pointsParBorb: paritePointsParBorb(),
      format,
      formatPoints: (points: number) => {
        const borb = pointsVersBorb(points);
        return borb === null ? '— parité indisponible' : format(borb);
      },
    };
  }, [state.data, fallbackCurrency]);
}
