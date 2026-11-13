// ====================
// PASSKEYS (WebAuthn) — client de la biométrie UQ
// ====================
//
// Le contrat avec le backend est strict : le serveur ne recoit que ce qu'une
// enclave produit réellement.
//   * a l'enrolement : l'`attestationObject` brut (le serveur en extrait la cle
//     publique et l'identifiant de la cle, le client ne choisit pas l'identifiant) ;
//   * a la connexion : `authenticatorData`, `clientDataJSON` et `signature`,
//     car c'est la signature sur authData || sha256(clientDataJSON) qui prouve
//     que la cle est bien dans l'enclave de CET appareil.
//
// Les anciens champs « public_key » (octets de l'attestation recodés en texte)
// et « token webauthn_... » n'existent plus : ils ne vérifiaient rien.

import {
  webauthnLoginBegin,
  webauthnLoginComplete,
  webauthnRegisterBegin,
  webauthnRegisterComplete,
  webauthnTransactionBegin,
  webauthnTransactionComplete,
} from './api';

/** Cle de stockage local : indice d'appareil, jamais une autorité. */
export const CLE_APPAREIL_LOCAL = 'uq_passkey_credential_id';

export type MotifEchec =
  | 'NON_SUPPORTE'
  | 'CONTEXTE_NON_SECURISE'
  | 'ANNULE'
  | 'SERVEUR'
  | 'INCONNU';

export interface ResultatPasskey {
  ok: boolean;
  motif?: MotifEchec;
  message?: string;
  credential_id?: string;
  token?: string;
  palier?: string;
}

// ===== base64url <-> ArrayBuffer =====

export function bufferVersBase64url(buffer: ArrayBuffer): string {
  const octets = new Uint8Array(buffer);
  let binaire = '';
  for (let i = 0; i < octets.length; i += 1) binaire += String.fromCharCode(octets[i]);
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlVersBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const complete = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binaire = atob(complete);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  return octets.buffer;
}

// ===== Diagnostic honnete =====

/**
 * WebAuthn n'est disponible qu'en contexte securise (https, localhost,
 * 127.0.0.1). Sur une IP de LAN en http — le cas frequent des tests sur
 * telephone — le navigateur refuse toute cle : la page doit donc proposer le
 * palier complet et le dire, pas simuler une biométrie.
 */
export function etatBiometrie(): { disponible: boolean; motif?: MotifEchec; message: string } {
  const sur = typeof window !== 'undefined' && window.PublicKeyCredential !== undefined
    && typeof navigator.credentials?.create === 'function';
  if (!sur) {
    return {
      disponible: false,
      motif: 'NON_SUPPORTE',
      message: 'Ce navigateur ne propose pas de cle biométrique (WebAuthn).',
    };
  }
  const contexteSécurisé =
    window.isSecureContext ||
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  if (!contexteSécurisé) {
    return {
      disponible: false,
      motif: 'CONTEXTE_NON_SECURISE',
      message:
        'La biométrie exige HTTPS ou localhost : sur cette adresse, seule la connexion complète (email + mot de passe) est possible.',
    };
  }
  return { disponible: true, message: 'Biométrie disponible sur cet appareil.' };
}

export function memoriserCleAppareil(credential_id: string): void {
  if (credential_id) localStorage.setItem(CLE_APPAREIL_LOCAL, credential_id);
}

export function lireCleAppareil(): string {
  return localStorage.getItem(CLE_APPAREIL_LOCAL) || '';
}

export function oublierCleAppareil(): void {
  localStorage.removeItem(CLE_APPAREIL_LOCAL);
}

function etiquetteAppareil(): string {
  const agent = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(agent)) return 'iPhone / iPad';
  if (/Android/i.test(agent)) return 'Android';
  if (/Windows/i.test(agent)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(agent)) return 'macOS';
  if (/Linux/i.test(agent)) return 'Linux';
  return 'Appareil';
}

function motifDepException(erreur: unknown): { motif: MotifEchec; message: string } {
  const nom = (erreur as { name?: string })?.name || '';
  if (nom === 'NotAllowedError') {
    return { motif: 'ANNULE', message: 'Vérification biométrique annulée ou expirée.' };
  }
  if (nom === 'InvalidStateError') {
    return { motif: 'SERVEUR', message: 'Cette cle biométrique existe déjà sur l’appareil.' };
  }
  return {
    motif: 'INCONNU',
    message: (erreur as { message?: string })?.message || 'Erreur biométrique.',
  };
}

// ====================
// ENROLEMENT (apres un succes email + mot de passe, ou une creation)
// ====================

export async function enregistrerPasskey(uqNumber: string): Promise<ResultatPasskey> {
  const etat = etatBiometrie();
  if (!etat.disponible) return { ok: false, motif: etat.motif, message: etat.message };

  let erreur: { motif: MotifEchec; message: string };
  try {
    const debut = await webauthnRegisterBegin(uqNumber);
    if (debut.status !== 'success' || !debut.challenge) {
      return {
        ok: false,
        motif: 'SERVEUR',
        message: debut.message || 'Le serveur refuse l’enregistrement de la cle.',
      };
    }

    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: base64urlVersBuffer(debut.challenge),
        rp: {
          name: debut.rp?.name || 'UQ Platform',
          id: debut.rp?.id || window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(debut.user?.id || uqNumber),
          name: debut.user?.name || uqNumber,
          displayName: debut.user?.displayName || uqNumber,
        },
        pubKeyCredParams: debut.pubKeyCredParams?.length
          ? debut.pubKeyCredParams
          : [{ type: 'public-key' as const, alg: -7 }],
        timeout: debut.timeout || 60000,
        attestation: 'none',
        authenticatorSelection: {
          userVerification: 'required',
          residentKey: 'required',
        },
      },
    })) as PublicKeyCredential | null;

    if (!cred) {
      return { ok: false, motif: 'ANNULE', message: 'Enregistrement biométrique annulé.' };
    }

    const reponse = cred.response as AuthenticatorAttestationResponse;
    const credentialId = bufferVersBase64url(cred.rawId);

    const fin = await webauthnRegisterComplete({
      uq_number: uqNumber,
      challenge: debut.challenge,
      attestation_object: bufferVersBase64url(reponse.attestationObject),
      credential_id: credentialId,
      device_name: etiquetteAppareil(),
    });

    if (fin.status === 'success') {
      const cle = fin.credential_id || credentialId;
      memoriserCleAppareil(cle);
      return { ok: true, credential_id: cle, message: fin.message };
    }

    return {
      ok: false,
      motif: 'SERVEUR',
      message: fin.message || 'Le serveur n’a pas pu vérifier cette cle.',
    };
  } catch (e) {
    erreur = motifDepException(e);
    return { ok: false, motif: erreur.motif, message: erreur.message };
  }
}

// ====================
// CONNEXION PAR CLE (paliers auto / biometrie)
// ====================

export async function authentifierParPasskey(
  uqNumber: string,
  credentialId = lireCleAppareil(),
): Promise<ResultatPasskey> {
  const etat = etatBiometrie();
  if (!etat.disponible) return { ok: false, motif: etat.motif, message: etat.message };

  try {
    const debut = await webauthnLoginBegin(uqNumber, credentialId);
    if (debut.status !== 'success' || !debut.challenge) {
      return {
        ok: false,
        motif: 'SERVEUR',
        palier: debut.palier,
        message: debut.message || 'Aucune cle biométrique active pour ce compte.',
      };
    }

    const allowCredentials = (debut.allowCredentials || []).map((c) => ({
      type: 'public-key' as const,
      id: base64urlVersBuffer(c.id),
    }));

    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: base64urlVersBuffer(debut.challenge),
        timeout: debut.timeout || 60000,
        userVerification: 'required',
        ...(debut.rpId ? { rpId: debut.rpId } : {}),
        ...(allowCredentials.length ? { allowCredentials } : {}),
      },
    })) as PublicKeyCredential | null;

    if (!cred) {
      return { ok: false, motif: 'ANNULE', message: 'Connexion biométrique annulée.' };
    }

    const reponse = cred.response as AuthenticatorAssertionResponse;
    const cleSignante = bufferVersBase64url(cred.rawId);

    const fin = await webauthnLoginComplete({
      uq_number: uqNumber,
      challenge: debut.challenge,
      credential_id: cleSignante,
      authenticator_data: bufferVersBase64url(reponse.authenticatorData),
      client_data_json: bufferVersBase64url(reponse.clientDataJSON),
      signature: bufferVersBase64url(reponse.signature),
    });

    if (fin.status === 'success' && fin.token) {
      memoriserCleAppareil(cleSignante);
      return {
        ok: true,
        token: fin.token,
        credential_id: cleSignante,
        palier: fin.palier,
        message: fin.message,
      };
    }

    return {
      ok: false,
      motif: 'SERVEUR',
      palier: fin.palier,
      message: fin.message || 'La biométrie n’a pas été confirmée.',
    };
  } catch (e) {
    const { motif, message } = motifDepException(e);
    return { ok: false, motif, message };
  }
}

// ====================
// VALIDATION D'UNE TRANSACTION PAR LA CLE DE L'APPAREIL
// ====================

export async function validerTransactionParPasskey(
  uqNumber: string,
  transactionId: string,
): Promise<ResultatPasskey> {
  const etat = etatBiometrie();
  if (!etat.disponible) return { ok: false, motif: etat.motif, message: etat.message };

  try {
    const debut = await webauthnTransactionBegin(uqNumber, transactionId);
    if (debut.status !== 'success' || !debut.challenge) {
      return { ok: false, motif: 'SERVEUR', message: debut.message || 'Challenge indisponible.' };
    }

    const allowCredentials = (debut.allowCredentials || []).map((c) => ({
      type: 'public-key' as const,
      id: base64urlVersBuffer(c.id),
    }));

    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: base64urlVersBuffer(debut.challenge),
        timeout: debut.timeout || 60000,
        userVerification: 'required',
        ...(debut.rpId ? { rpId: debut.rpId } : {}),
        ...(allowCredentials.length ? { allowCredentials } : {}),
      },
    })) as PublicKeyCredential | null;

    if (!cred) {
      return { ok: false, motif: 'ANNULE', message: 'Validation annulée.' };
    }

    const reponse = cred.response as AuthenticatorAssertionResponse;

    const fin = await webauthnTransactionComplete({
      uq_number: uqNumber,
      challenge: debut.challenge,
      transaction_id: transactionId,
      credential_id: bufferVersBase64url(cred.rawId),
      authenticator_data: bufferVersBase64url(reponse.authenticatorData),
      client_data_json: bufferVersBase64url(reponse.clientDataJSON),
      signature: bufferVersBase64url(reponse.signature),
    });

    if (fin.status === 'success' && fin.validated) {
      return { ok: true, message: fin.message };
    }

    return { ok: false, motif: 'SERVEUR', message: fin.message || 'Biométrie non confirmée.' };
  } catch (e) {
    const { motif, message } = motifDepException(e);
    return { ok: false, motif, message };
  }
}
