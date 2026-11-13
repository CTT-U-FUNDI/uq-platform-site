import apiClient from '../../api/client';

/**
 * UQ Mail + UQ SMS — routes /api/mail/* et /api/sms/* de la plateforme.
 * Lecture : GET simples (adresse réelle, boîtes, messages, statuts).
 * Écriture (envoi, mark-read) : POST signés Ed25519 (domaine UQ_MAIL_V1 /
 * UQ_SMS_V1) — la clé vit dans le wallet BORB, le pont de signature est
 * branché ici quand il sera disponible.
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
