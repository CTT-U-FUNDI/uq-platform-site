import { apiUrl } from '../../api/client';

/**
 * Les gestes appareils de la revente de connexion : le prix, la position, la
 * mesure du lien.
 *
 * Le prix ne quitte jamais l'appareil. Le serveur qui classe les vendeurs
 * ignore volontairement ce qu'il ne peut pas garantir : le devis se négocie
 * téléphone à téléphone, au moment où l'acheteur frappe. Il est donc écrit
 * ici, dans le stockage local du compte, et nulle part ailleurs.
 */

const clePrix = (uq: string) => `uq.connexion.prix.${(uq || 'anonyme').trim().toLowerCase()}`;

/** Le tarif par seconde en points BORB, ou rien si le vendeur n'a rien saisi. */
export const lirePrixLocal = (uq: string): number | null => {
  const brut = localStorage.getItem(clePrix(uq));
  if (brut === null || brut === '') return null;
  const valeur = Number(brut);
  return Number.isFinite(valeur) && valeur > 0 ? valeur : null;
};

/** `null` efface la valeur : rien n'est stocké pour un vendeur sans prix. */
export const ecrirePrixLocal = (uq: string, valeur: number | null): void => {
  if (valeur === null || !Number.isFinite(valeur) || valeur <= 0) {
    localStorage.removeItem(clePrix(uq));
    return;
  }
  localStorage.setItem(clePrix(uq), String(Math.round(valeur)));
};

export interface PositionAppareil {
  latitude: number;
  longitude: number;
  /** Rayon d'erreur du capteur, en mètres — ce que l'appareil sait de sa propre précision. */
  precision_m: number;
  captee_a: number;
}

/**
 * Le fix GPS de l'appareil.
 *
 * `enableHighAccuracy` n'est pas un détail : à 100 m près, le voisin du carrefour
 * d'à côté passe devant lui au classement, et l'acheteur se déplace pour rien.
 */
export const lirePosition = (): Promise<PositionAppareil> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Cet appareil ne sait pas partager sa position.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (fixe) =>
        resolve({
          latitude: fixe.coords.latitude,
          longitude: fixe.coords.longitude,
          precision_m: Math.round(fixe.coords.accuracy || 0),
          captee_a: Math.round((fixe.timestamp || Date.now()) / 1000),
        }),
      (erreur) =>
        reject(
          new Error(
            erreur.code === erreur.PERMISSION_DENIED
              ? 'Position refusée : sans elle, personne ne peut te trouver.'
              : 'Position indisponible : réessaie le GPS à découvert.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });

export interface MesureLien {
  /** Puissance estimée du lien, de 0 à 100. */
  signal: number;
  debit_mbps: number;
  latence_ms: number;
  source: 'appareil' | 'sonde' | 'aucune';
}

const mediane = (valeurs: number[]): number => {
  const tries = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(tries.length / 2);
  return tries.length % 2 ? tries[milieu] : (tries[milieu - 1] + tries[milieu]) / 2;
};

interface InformationsLien {
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
}

/**
 * Ce que l'appareil voit de son propre lien, à l'instant où le vendeur publie.
 *
 * L'API Network Information (Android) donne un débit et une latence mesurés :
 * c'est la source. Sinon, une sonde sur la route de santé du serveur mesure le
 * temps de réponse réel, et le débit reste à zéro — mieux vaut une fiche
 * modeste qu'un chiffre inventé.
 */
export const mesurerLien = async (): Promise<MesureLien> => {
  const lien = (navigator as unknown as { connection?: InformationsLien }).connection;
  if (lien && (lien.downlink || lien.rtt)) {
    const debit = Number(lien.downlink) || 0;
    const latence = Number(lien.rtt) || 0;
    const signal = debit
      ? Math.min(100, Math.round((debit / 40) * 100))
      : ({ 'slow-2g': 10, '2g': 25, '3g': 55, '4g': 85 } as Record<string, number>)[
          lien.effectiveType || ''
        ] ?? 20;
    return { signal, debit_mbps: debit, latence_ms: latence, source: 'appareil' };
  }

  const allers: number[] = [];
  for (let index = 0; index < 3; index += 1) {
    const debut = performance.now();
    try {
      await fetch(apiUrl('/api/health'), { cache: 'no-store' });
      allers.push(performance.now() - debut);
    } catch {
      // Une requête ratée n'est pas une latence : on ne la compte pas.
    }
  }
  if (!allers.length) return { signal: 0, debit_mbps: 0, latence_ms: 0, source: 'aucune' };

  const latence = Math.round(mediane(allers));
  // Sans débit mesuré, seule la latence connue dit quelque chose de la puissance.
  const signal = Math.max(5, Math.min(90, Math.round(100 - (latence / 300) * 100)));
  return { signal, debit_mbps: 0, latence_ms: latence, source: 'sonde' };
};

/** « 12 Mb/s · 40 ms · mesuré par l'appareil », tel que le vendeur le lit. */
export const decrireMesure = (mesure: MesureLien): string => {
  if (mesure.source === 'aucune') {
    return 'Aucune mesure : ta fiche sera classée en dernier.';
  }
  const fragments = [
    mesure.debit_mbps > 0 ? `${mesure.debit_mbps} Mb/s` : null,
    mesure.latence_ms > 0 ? `${mesure.latence_ms} ms` : null,
    `${mesure.signal}/100`,
  ].filter(Boolean);
  return fragments.join(' · ');
};
