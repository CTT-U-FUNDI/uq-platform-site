// ====================
// VALIDATEURS UQ PLATFORM — VERSION PROFESSIONNELLE
// ====================

// ====================
// TYPES
// ====================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ====================
// CONSTANTES
// ====================

export const UQ_MIN_PASSWORD_LENGTH = 8;
export const UQ_MAX_PASSWORD_LENGTH = 64;
export const UQ_MIN_AGE = 13;
export const UQ_MAX_AGE = 120;
export const UQ_MIN_PRENOM = 2;
export const UQ_MAX_PRENOM = 50;
export const UQ_MIN_NOM = 2;
export const UQ_MAX_NOM = 50;

// ====================
// NUMERO UQ
// Format : UQ-[PAYS(3)][NOM+PRENOM(5)][POSITION(1+)]
// Backend : 8 a 15 chiffres
// ====================

export function validateNumeroUQ(numero: string): ValidationResult {
  const cleaned = numero.trim().toUpperCase();

  if (!cleaned) {
    return { valid: false, error: 'Entre ton numero UQ' };
  }

  if (!cleaned.startsWith('UQ-')) {
    return { valid: false, error: 'Le numero doit commencer par UQ-' };
  }

  const regex = /^UQ-[0-9]{8,15}$/;
  if (!regex.test(cleaned)) {
    return {
      valid: false,
      error: 'Format : UQ-XXXXXXXX (8 a 15 chiffres)'
    };
  }

  return { valid: true };
}

export function isOwnerNumber(numero: string): boolean {
  const cleaned = numero.trim().toUpperCase();
  return cleaned === 'UQ-00000001' || cleaned === 'UQ-266335331';
}

// ====================
// EMAIL UQ
// Format : [pseudo]@zando.uq (users) | [pseudo]@ufundi.uq (owner)
// ====================

export function validateEmailUQ(email: string): ValidationResult {
  const cleaned = email.trim().toLowerCase();

  if (!cleaned) {
    return { valid: false, error: 'Entre ton email UQ' };
  }

  if (cleaned.length > 254) {
    return { valid: false, error: 'Email trop long' };
  }

  const regex = /^[a-z0-9._-]+@(zando|ufundi)\.uq$/;
  if (!regex.test(cleaned)) {
    return {
      valid: false,
      error: 'Format : pseudo@zando.uq'
    };
  }

  const localPart = cleaned.split('@')[0];
  if (localPart.length < 2 || localPart.length > 64) {
    return { valid: false, error: 'Pseudo email : 2 a 64 caracteres' };
  }

  return { valid: true };
}

export function isOwnerEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@ufundi.uq');
}

// ====================
// MOT DE PASSE — Regles professionnelles
// Minimum 8 | Majuscule | Minuscule | Chiffre
// ====================

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Entre ton mot de passe' };
  }

  if (password.length < UQ_MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: 'Minimum ' + UQ_MIN_PASSWORD_LENGTH + ' caracteres'
    };
  }

  if (password.length > UQ_MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: 'Maximum ' + UQ_MAX_PASSWORD_LENGTH + ' caracteres'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Au moins 1 majuscule requise' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Au moins 1 minuscule requise' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Au moins 1 chiffre requis' };
  }

  return { valid: true };
}

// ====================
// NOM
// ====================

export function validateNom(nom: string): ValidationResult {
  const cleaned = nom.trim();

  if (!cleaned) {
    return { valid: false, error: 'Entre ton nom' };
  }

  if (cleaned.length < UQ_MIN_NOM) {
    return { valid: false, error: 'Minimum ' + UQ_MIN_NOM + ' caracteres' };
  }

  if (cleaned.length > UQ_MAX_NOM) {
    return { valid: false, error: 'Maximum ' + UQ_MAX_NOM + ' caracteres' };
  }

  const regex = /^[a-zA-Z\u00C0-\u00FF\s\'-]+$/;
  if (!regex.test(cleaned)) {
    return { valid: false, error: 'Lettres uniquement' };
  }

  return { valid: true };
}

// ====================
// PRENOM
// ====================

export function validatePrenom(prenom: string): ValidationResult {
  const cleaned = prenom.trim();

  if (!cleaned) {
    return { valid: false, error: 'Entre ton prenom' };
  }

  if (cleaned.length < UQ_MIN_PRENOM) {
    return { valid: false, error: 'Minimum ' + UQ_MIN_PRENOM + ' caracteres' };
  }

  if (cleaned.length > UQ_MAX_PRENOM) {
    return { valid: false, error: 'Maximum ' + UQ_MAX_PRENOM + ' caracteres' };
  }

  const regex = /^[a-zA-Z\u00C0-\u00FF\s\'-]+$/;
  if (!regex.test(cleaned)) {
    return { valid: false, error: 'Lettres uniquement' };
  }

  return { valid: true };
}

// ====================
// TELEPHONE
// Format : +XXX XXXXXXXXX (international)
// ====================

export function validatePhone(phone: string): ValidationResult {
  const cleaned = phone.replace(/[\s.-]/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Entre ton numero de telephone' };
  }

  const regex = /^\+\d{9,15}$/;
  if (!regex.test(cleaned)) {
    return {
      valid: false,
      error: 'Format : +XXX XXXXXXXXX'
    };
  }

  return { valid: true };
}

// ====================
// DATE DE NAISSANCE
// ====================

export function validateDateNaissance(date: string): ValidationResult {
  if (!date) {
    return { valid: false, error: 'Entre ta date de naissance' };
  }

  const birthDate = new Date(date);
  if (isNaN(birthDate.getTime())) {
    return { valid: false, error: 'Date invalide' };
  }

  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  let realAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    realAge--;
  }

  if (realAge < UQ_MIN_AGE) {
    return { valid: false, error: 'Age minimum : ' + UQ_MIN_AGE + ' ans' };
  }

  if (realAge > UQ_MAX_AGE) {
    return { valid: false, error: 'Date invalide' };
  }

  return { valid: true };
}

// ====================
// CODE 2FA
// ====================

export function validateCode2FA(code: string): ValidationResult {
  if (!code) {
    return { valid: false, error: 'Entre le code 2FA' };
  }

  if (!/^\d{6}$/.test(code)) {
    return { valid: false, error: 'Le code doit avoir 6 chiffres' };
  }

  return { valid: true };
}

// ====================
// PSEUDO UQ
// Format : uq@[prenom]
// ====================

export function validatePseudoUQ(pseudo: string): ValidationResult {
  const cleaned = pseudo.trim().toLowerCase();

  if (!cleaned) {
    return { valid: false, error: 'Entre ton pseudo UQ' };
  }

  if (!cleaned.startsWith('uq@')) {
    return { valid: false, error: 'Le pseudo doit commencer par uq@' };
  }

  if (cleaned.length < 4 || cleaned.length > 30) {
    return { valid: false, error: 'Pseudo : 4 a 30 caracteres' };
  }

  const regex = /^uq@[a-z0-9._-]+$/;
  if (!regex.test(cleaned)) {
    return { valid: false, error: 'Format : uq@[prenom]' };
  }

  return { valid: true };
}

// ====================
// CODE PAYS (pour l'adresse UQ)
// ====================

export function validateCountry(country: string): ValidationResult {
  const cleaned = country.trim().toUpperCase();

  if (!cleaned) {
    return { valid: false, error: 'Entre ton pays' };
  }

  if (cleaned.length < 2 || cleaned.length > 3) {
    return { valid: false, error: 'Code pays : 2 a 3 lettres' };
  }

  if (!/^[A-Z]+$/.test(cleaned)) {
    return { valid: false, error: 'Lettres uniquement' };
  }

  return { valid: true };
}
