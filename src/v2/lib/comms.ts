import apiClient from '../../api/client';
import { signatureUq } from '../../lib/deviceKey';

/**
 * UQ Mail + UQ SMS — routes /api/mail/* et /api/sms/* de la plateforme.
 * Lecture : GET simples (adresse réelle, boîtes, messages, statuts).
 * Écriture (envoi, assignation, mark-read) : POST signés Ed25519
 * (domaines UQ_MAIL_V1 / UQ_SMS_V1) — la clé Ed25519 de l'appareil est
 * générée par le plugin natif UqCrypto (src/lib/deviceKey.ts). Sur web,
 * cryptoAppareilDisponible() vaut faux et ces appels échouent proprement.
 */

export interface MailResume {
  id: number;
  from_addr: string;
  from_name: string;
  to_addr: string;
  subject: string;
  date: number;
  is_read: boolean;
  otp_code: string | null;
  apercu: string;
}

export interface MailComplet extends MailResume {
  folder: string;
  body_text: string;
}

export interface AdresseMail {
  adresse: string;
  domaine: string;
}

export interface BoiteMail {
  dossier: string;
  messages: MailResume[];
  non_lus: number;
}

export interface SmsRecu {
  id: number;
  relay_number: string;
  from_addr: string;
  text: string;
  otp_code: string | null;
  date: number;
  is_read: boolean;
}

export interface StatutSms {
  relay_number: string | null;
  otp_non_lus: number;
}

const enc = encodeURIComponent;

// ── UQ Mail ──────────────────────────────────────────────

export const getMailAdresse = (uq: string) =>
  apiClient
    .get<{ status?: string; adresse?: string; domaine?: string }>(
      `/api/mail/adresse/${enc(uq)}`,
    )
    .then((r) => r.data as AdresseMail);

export const listerMails = (uq: string, dossier: 'inbox' | 'sent' | 'drafts' | 'spam' = 'inbox') =>
  apiClient
    .get<BoiteMail>(`/api/mail/boite/${enc(uq)}/${dossier}`)
    .then((r) => r.data);

export const lireMail = (uq: string, id: number) =>
  apiClient
    .get<{ status?: string; message?: MailComplet }>(
      `/api/mail/message/${enc(uq)}/${id}`,
    )
    .then((r) => r.data.message as MailComplet);

export const mailNonLus = (uq: string) =>
  apiClient
    .get<{ status?: string; non_lus?: number }>(`/api/mail/non-lus/${enc(uq)}`)
    .then((r) => r.data.non_lus ?? 0);

/**
 * POST /api/mail/send — envoi signé Ed25519 (UQ_MAIL_V1).
 * `to` = adresse réelle (@domaine mail) ou pseudo uq@… résolu côté backend.
 */
export const envoyerMail = async (
  uq: string,
  message: { to: string; subject: string; body: string },
) => {
  const auth = await signatureUq('UQ_MAIL_V1', uq);
  const r = await apiClient.post<{ status?: string; from?: string; message?: string }>(
    '/api/mail/send',
    {
      uq,
      to: message.to,
      subject: message.subject,
      body: message.body,
      ...auth,
    },
    { validateStatus: () => true },
  );
  if (r.status >= 400 || r.data?.status === 'error') {
    throw new Error(r.data?.message || `Envoi refusé (${r.status})`);
  }
  return r.data;
};

// ── UQ SMS ───────────────────────────────────────────────

export const getSmsStatus = (uq: string) =>
  apiClient
    .get<StatutSms & { status?: string }>(`/api/sms/status/${enc(uq)}`)
    .then((r) => r.data);

export const listerSms = (uq: string) =>
  apiClient
    .get<{ status?: string; messages?: SmsRecu[]; otp_non_lus?: number }>(
      `/api/sms/messages/${enc(uq)}`,
    )
    .then((r) => ({ messages: r.data.messages ?? [], otp_non_lus: r.data.otp_non_lus ?? 0 }));

/** POST /api/sms/assign — attribue un numéro relais (signé UQ_SMS_V1). */
export const assignerSms = async (uq: string) => {
  const auth = await signatureUq('UQ_SMS_V1', uq);
  const r = await apiClient.post<{ status?: string; relay_number?: string; message?: string }>(
    '/api/sms/assign',
    { uq, ...auth },
    { validateStatus: () => true },
  );
  if (r.status >= 400 || r.data?.status === 'error') {
    throw new Error(r.data?.message || `Attribution refusée (${r.status})`);
  }
  return r.data;
};

/** POST /api/sms/release — libère le numéro relais (signé UQ_SMS_V1). */
export const libererSms = async (uq: string) => {
  const auth = await signatureUq('UQ_SMS_V1', uq);
  const r = await apiClient.post<{ status?: string; message?: string }>(
    '/api/sms/release',
    { uq, ...auth },
    { validateStatus: () => true },
  );
  if (r.status >= 400 || r.data?.status === 'error') {
    throw new Error(r.data?.message || `Libération refusée (${r.status})`);
  }
  return r.data;
};

/** POST /api/sms/mark-read — marque un SMS comme lu (signé UQ_SMS_V1). */
export const marquerSmsLu = async (uq: string, id: number) => {
  const auth = await signatureUq('UQ_SMS_V1', uq);
  await apiClient.post(
    '/api/sms/mark-read',
    { uq, id, ...auth },
    { validateStatus: () => true },
  );
};
