import { useEffect, useMemo, useState } from 'react';
import { getPublicIdentity, type PublicIdentity } from './api';

/**
 * Resolution du PSEUDO a partir d'un UQ.
 *
 * Le backend n'expose l'identite publique que par identifiant :
 * `GET /api/account/{uq}/public` -> { pseudo, name, display, avatar_url }.
 * Les listes (chat, envois, offres) ne renvoient que des UQ : on resout donc
 * ici, avec un cache memoire pour ne pas rejouer la requete a chaque rendu.
 */

const cache = new Map<string, PublicIdentity>();
const pending = new Map<string, Promise<PublicIdentity>>();

const keyOf = (uq: string | undefined | null): string => String(uq || '').trim().toUpperCase();

export async function resolveIdentity(uq: string | undefined | null): Promise<PublicIdentity> {
  const key = keyOf(uq);
  if (!key) return {};

  const cached = cache.get(key);
  if (cached) return cached;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const request = getPublicIdentity(key)
    .then((identity) => {
      const value: PublicIdentity = identity || {};
      cache.set(key, value);
      return value;
    })
    .catch(() => ({}) as PublicIdentity)
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, request);
  return request;
}

/** Pseudo d'affichage : `uq@destin`. A defaut le nom, jamais le numero UQ. */
export const identityPseudo = (uq: string, identity?: PublicIdentity | null): string => {
  const value = identity || cache.get(keyOf(uq));
  return value?.pseudo || value?.name || '';
};

/** Libelle complet renvoye par le backend : `uq@destin (Nom Prenom)`. */
export const identityDisplay = (uq: string, identity?: PublicIdentity | null): string => {
  const value = identity || cache.get(keyOf(uq));
  return value?.display || value?.pseudo || value?.name || '';
};

/** Libelle pret a afficher, avec repli explicite sur l'identifiant technique. */
export const identityLabel = (uq: string, identity?: PublicIdentity | null): string =>
  identityPseudo(uq, identity) || identityDisplay(uq, identity) || uq;

export const identityAvatar = (uq: string, identity?: PublicIdentity | null): string => {
  const value = identity || cache.get(keyOf(uq));
  return value?.avatar_url || '';
};

/** Charge en une passe les identites d'une liste (chat, offres, envois). */
export function useIdentities(uqs: Array<string | undefined | null>): Record<string, PublicIdentity> {
  const key = useMemo(() => {
    const unique = Array.from(new Set(uqs.map(keyOf).filter(Boolean))).sort();
    return unique.join('|');
  }, [uqs]);

  const [identities, setIdentities] = useState<Record<string, PublicIdentity>>(() =>
    Object.fromEntries(cache.entries()),
  );

  useEffect(() => {
    const list = key ? key.split('|') : [];
    if (list.length === 0) return;
    let cancelled = false;

    void Promise.all(
      list.map((uq) => resolveIdentity(uq).then((identity) => [uq, identity] as const)),
    ).then((entries) => {
      if (cancelled) return;
      setIdentities((current) => {
        const next = { ...current };
        let changed = false;
        entries.forEach(([uq, identity]) => {
          if (next[uq] !== identity) {
            next[uq] = identity;
            changed = true;
          }
        });
        return changed ? next : current;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return identities;
}

/** Identite d'un seul compte. */
export function useIdentity(uq?: string | null): PublicIdentity | null {
  const key = keyOf(uq);
  const [identity, setIdentity] = useState<PublicIdentity | null>(() => cache.get(key) || null);

  useEffect(() => {
    if (!key) {
      setIdentity(null);
      return;
    }
    let cancelled = false;
    setIdentity(cache.get(key) || null);
    void resolveIdentity(key).then((value) => {
      if (!cancelled) setIdentity(value);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return identity;
}
