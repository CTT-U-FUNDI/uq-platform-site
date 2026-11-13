// ====================
// SEND MODAL — Envoi multi-devise avec récapitulatif (Q2→Q6)
// ====================
//
//   Q2 — virgule ET point acceptés : « 5,5 » et « 5.5 »
//   Q3 — montant saisi et débité dans une devise déjà convertie (oracle)
//   Q4 — modale 3D : backdrop blur 20px, scale 0.95 → 1.0, 300 ms
//   Q5 — tableau récapitulatif obligatoire avant le PIN
//   Q6 — Annuler / Modifier / Confirmer
//
// ===== ATTENTION : le destinataire est un PSEUDO (« uq@marie ») =====
//    Le UQ n'est jamais affiché (Q1) : le backend le résout lui-même.
// ====================

import { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { UQ_COLORS, UQ_GRADIENTS } from '../../../theme/colors';
import { PseudoAutocomplete, PseudoResult } from './PseudoAutocomplete';
import { CarteProfil, ProfilData } from './CarteProfil';
import { IconClose, IconEdit, IconSend, IconCheck, IconRefresh } from '../../../components/ui/UQIcons';

const DEVISES = [
  'CDF', 'XAF', 'XOF', 'NGN', 'KES', 'ZAR', 'MAD', 'GHS', 'UGX', 'TZS', 'EGP', 'RWF', 'BIF', 'MZN', 'AOA', 'ETB',
  'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'INR', 'BRL', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY',
] as const;
type Devise = typeof DEVISES[number];

/** « 5,5 » comme « 5.5 » → 5.5 (Q2) */
function parseMontant(saisie: string): number {
  const propre = saisie.replace(/\s/g, '').replace(',', '.');
  const v = parseFloat(propre);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** Nombre de décimales saisies : le backend n'accepte que le centième. */
function nbDecimales(saisie: string): number {
  const propre = saisie.replace(/\s/g, '').replace(',', '.');
  const [, decimales = ''] = propre.split('.');
  return decimales.length;
}

function formatMontant(v: number, decimales = 2): string {
  return v.toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

interface Taux {
  borb_usd: number;
  rates: Record<string, number>;
  source: string;
}


// ProfilData importee depuis CarteProfil.tsx
interface Props {
  uqNumber: string;
  pinPending?: boolean;
  availableWallets?: Array<{ code: string; balance: number }>;
  balanceLoading: boolean;
  balanceReady: boolean;
  initialRecipient?: string;
  initialNom?: string;
  initialPrenom?: string;
  onClose: () => void;
  onConfirm: (data: {
    recipientPseudo: string;
    amountPoints: number;
    feePoints: number;
    memo: string;
    devise: Devise;
    montantDevise: number;
  }) => void;
  loading?: boolean;
  message?: string;
}

export function SendModal({
  uqNumber,
  pinPending = false,
  availableWallets = [],
  balanceLoading,
  balanceReady,
  initialRecipient = '',
  initialNom = '',
  initialPrenom = '',
  onClose,
  onConfirm,
  loading,
  message,
}: Props) {
  const [etape, setEtape] = useState<'form' | 'recap'>('form');
  const [visible, setVisible] = useState(false); // animation 3D (Q4)

  const [destinataire, setDestinataire] = useState(initialRecipient);
  const [nom, setNom] = useState(initialNom);
  const [prenom, setPrenom] = useState(initialPrenom);
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [saisie, setSaisie] = useState('');
  const [devise, setDevise] = useState<Devise>('CDF');
  const [note, setNote] = useState('');
  const [taux, setTaux] = useState<Taux | null>(null);
  const [erreurTaux, setErreurTaux] = useState('');

  // Animation d'entrée (scale 0.95 → 1.0)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Oracle de change (Q3)
  useEffect(() => {
    apiClient
      .get('/api/oracle/fiat')
      .then((r) => {
        const borbUsd = Number(r.data?.borb_usd);
        const rates = r.data?.rates;
        if (!Number.isFinite(borbUsd) || borbUsd <= 0 || !rates || typeof rates !== 'object') {
          setTaux(null);
          setErreurTaux('Taux indisponibles — reessayez plus tard');
          return;
        }
        setTaux({ borb_usd: borbUsd, rates, source: String(r.data?.source || 'oracle backend') });
        setErreurTaux('');
      })
      .catch(() => setErreurTaux('Taux indisponibles — reessayez plus tard'));
  }, []);

  const fermer = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  // ===== Conversions (Q3) =====
  const montantSaisi = parseMontant(saisie);

  /** Montant saisi (dans `devise`) → points BORB (1 BORB = 100 points) */
  const versPoints = (montant: number, d: Devise): number => {
    if (montant <= 0) return 0;
    const parUsd = Number(taux?.rates?.[d]);
    if (!Number.isFinite(parUsd) || parUsd <= 0 || !taux || !Number.isFinite(taux.borb_usd) || taux.borb_usd <= 0) return 0;
    const usd = montant / parUsd;
    const borb = usd / taux.borb_usd;
    return Math.round(borb * 100);
  };

  /** Points BORB → montant dans une devise */
  const depuisPoints = (points: number, d: Devise): number => {
    const borb = points / 100;
    const parUsd = Number(taux?.rates?.[d]);
    if (!Number.isFinite(parUsd) || parUsd <= 0 || !taux || !Number.isFinite(taux.borb_usd) || taux.borb_usd <= 0) return 0;
    const usd = borb * taux.borb_usd;
    return usd * parUsd;
  };

  /** Combien d'unités de devise vaut 1 unité BORB (= units_per_borb côté backend) */
  const deviseParUnite = (d: Devise): number => {
    const parUsd = Number(taux?.rates?.[d]);
    if (!Number.isFinite(parUsd) || parUsd <= 0 || !taux || !Number.isFinite(taux.borb_usd) || taux.borb_usd <= 0) return 0;
    return taux.borb_usd * parUsd;
  };

  const amountPoints = versPoints(montantSaisi, devise);
  // Les transferts en devise convertie sont gratuits côté backend
  // (transfer_converted_currency renvoie fee: 0.0).
  const feePoints = 0;
  const fraisDevise = 0;

  function walletBalanceFor(code: Devise): number {
    return (availableWallets || []).find((wallet) => wallet.code.toUpperCase() === code)?.balance || 0;
  }

  /** Maximum transférable dans la devise sélectionnée (au centième près). */
  const maximumTransferInDevise = Math.floor(walletBalanceFor(devise) * 100) / 100;
  const walletBalance = walletBalanceFor(devise);

  // On ne propose que les devises réellement détenues : le backend débite la
  // poche devise correspondante et refuse un solde insuffisant.
  const devisesDisponibles = DEVISES.filter((d) => {
    const tauxDevise = Number(taux?.rates?.[d]);
    return Boolean(taux && Number.isFinite(tauxDevise) && tauxDevise > 0 && walletBalanceFor(d) > 0);
  });

  const precisionOk = nbDecimales(saisie) <= 2;
  const soldeSuffisant = montantSaisi > 0
    && precisionOk
    && montantSaisi <= maximumTransferInDevise + 0.000001;

  useEffect(() => {
    if (devisesDisponibles.length > 0 && !devisesDisponibles.includes(devise)) {
      setDevise(devisesDisponibles[0]);
    }
  }, [devisesDisponibles.join(','), devise]);

  const destinataireAffiche = nom || prenom ? `${destinataire} (${prenom} ${nom})`.trim() : destinataire;
  const peutContinuer = destinataire.length >= 3
    && devisesDisponibles.includes(devise)
    && soldeSuffisant;
  const activeStep = pinPending ? 3 : etape === 'recap' ? 2 : 1;

  const handlePseudoSelect = (r: PseudoResult) => {
    setDestinataire(r.pseudo);
    setNom(r.nom);
    setPrenom(r.prenom);
    setProfil(r);
  };

  const handleDestinataireChange = (value: string) => {
    setDestinataire(value);
    if (value !== profil?.pseudo) {
      setNom('');
      setPrenom('');
      setProfil(null);
    }
  };

  const handleConfirmer = () => {
    onConfirm({
      recipientPseudo: destinataire,
      amountPoints,
      feePoints,
      memo: note,
      devise,
      montantDevise: montantSaisi,
    });
  };

  const overlayStyle: React.CSSProperties = {
    background: 'rgba(5, 5, 10, 0.55)',
    backdropFilter: 'blur(20px)',          // Q4 — backdrop blur 20px
    WebkitBackdropFilter: 'blur(20px)',
    transition: 'opacity 300ms ease-out',
    opacity: visible ? 1 : 0,
  };

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(17,30,61,0.97) 0%, rgba(7,11,31,0.99) 100%)',
    border: '1px solid var(--uq-border)',
    transform: visible ? 'scale(1)' : 'scale(0.95)',   // Q4 — scale-up
    transition: 'transform 300ms ease-out',
    boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={overlayStyle}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden" style={cardStyle}>

        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--uq-border)]">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <IconSend size={16} color={UQ_COLORS.blue} />
            {etape === 'form' ? 'Envoyer' : 'Confirmer l envoi'}
          </h3>
          <button onClick={fermer} className="w-8 h-8 rounded-full bg-[var(--uq-card-light)] flex items-center justify-center active:scale-90 transition">
            <IconClose size={14} color={UQ_COLORS.textSecondary} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div aria-label={`Étape ${activeStep} sur 3`} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              {[
                { label: 'Détails', step: 1 },
                { label: 'Récapitulatif', step: 2 },
                { label: 'PIN', step: 3 },
              ].map(({ label, step }) => (
                <div
                  key={step}
                  className={`flex-1 text-center text-[10px] font-bold transition-colors ${
                    step <= activeStep ? 'text-white' : 'text-white/35'
                  }`}
                >
                  <span
                    className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                      step < activeStep
                        ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300'
                        : step === activeStep
                          ? 'border-[var(--uq-magenta)] bg-[var(--uq-magenta)]/20 text-white'
                          : 'border-[var(--uq-border)] bg-[var(--uq-bg-primary)] text-white/35'
                    }`}
                  >
                    {step < activeStep ? '✓' : step}
                  </span>
                  {label}
                </div>
              ))}
            </div>
            <div className="flex gap-1.5" aria-hidden="true">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    step <= activeStep ? 'bg-[var(--uq-magenta)]' : 'bg-[var(--uq-border)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {etape === 'form' && (
            <>
              {/* Destinataire — pseudo uniquement (Q1) */}
              <div>
                <label className="text-xs text-white/60 mb-1 block">Destinataire (pseudo)</label>
                <PseudoAutocomplete
                  value={destinataire}
                  onChange={handleDestinataireChange}
                  onSelect={handlePseudoSelect}
                  placeholder="uq@..."
                />
              </div>

              {/* Nom / Prénom grisés (auto-remplis) */}
              {(nom || prenom) && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={prenom} readOnly placeholder="Prénom"
                    className="p-3 bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] rounded-xl text-white/50 text-sm cursor-not-allowed" />
                  <input type="text" value={nom} readOnly placeholder="Nom"
                    className="p-3 bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] rounded-xl text-white/50 text-sm cursor-not-allowed" />
                </div>
              )}

              {/* CARTE PROFIL - Affiche quand un destinataire est selectionne */}
              {destinataire.length >= 3 && profil && (
                <CarteProfil
                  profil={profil}
                  onChat={() => {
                    // Ouvrir le chat avec ce destinataire
                    window.dispatchEvent(new CustomEvent('open-chat', { detail: { pseudo: destinataire } }));
                    fermer();
                  }}
                />
              )}

              {/* Montant + devise (Q2 + Q3) */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-xs text-white/60">Devise virtuelle à envoyer</label>
                  {devisesDisponibles.includes(devise) && (
                    <span className="text-[10px] font-semibold text-emerald-300">
                      Max envoyable : {formatMontant(maximumTransferInDevise)} {devise}
                    </span>
                  )}
                </div>
                {devisesDisponibles.length > 0 ? (
                  <div className="grid max-h-36 grid-cols-3 gap-2 overflow-y-auto pr-1">
                    {devisesDisponibles.map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={devise === d}
                        onClick={() => setDevise(d)}
                        className={`rounded-xl border px-2 py-2 text-left transition active:scale-95 ${
                          devise === d
                            ? 'border-[var(--uq-magenta)] bg-[var(--uq-magenta)]/15'
                            : 'border-[var(--uq-border)] bg-[var(--uq-bg-primary)] hover:border-white/30'
                        }`}
                      >
                        <span className="block text-xs font-black text-white">{d}</span>
                        <span className="block truncate text-[9px] text-emerald-300/80">
                          {formatMontant(walletBalanceFor(d))} max.
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
                    {balanceLoading
                      ? 'Chargement des portefeuilles convertis…'
                      : !balanceReady
                      ? 'Solde du coffre indisponible. Actualisez le coffre avant de continuer.'
                      : erreurTaux || (!taux
                        ? 'Chargement des taux de change…'
                        : 'Aucun solde transférable. Convertissez d’abord une partie de votre score de sécurité en devise virtuelle dans l’onglet Coffres.')}
                  </p>
                )}

                <label className="mb-1 mt-3 block text-xs text-white/60">Montant à envoyer</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    placeholder="5,50"
                    disabled={!devisesDisponibles.includes(devise)}
                    className="flex-1 p-3 bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] rounded-xl text-white text-sm focus:border-[var(--uq-magenta)] outline-none"
                  />
                  <div className="flex w-24 items-center justify-center rounded-xl border border-[var(--uq-border)] bg-[var(--uq-bg-primary)] px-2 text-sm font-bold text-white">
                    {devise}
                  </div>
                </div>

                {/* Conversion temps réel */}
                {amountPoints > 0 && (
                  <div className="mt-2 p-3 rounded-xl bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] space-y-1">
                    <p className="text-xs text-white/80">
                      Débité du portefeuille : <span className="font-bold text-white">{formatMontant(montantSaisi)} {devise}</span>
                    </p>
                    <p className="text-xs text-white/80">
                      Score de sécurité mobilisé (indicatif) :{' '}
                      <span className="font-bold text-white">
                        {formatMontant(amountPoints)} points
                      </span>
                    </p>
                    <p className="text-[10px] text-white/40">
                      Le destinataire recevra cette devise — aucun frais — total débité : {formatMontant(montantSaisi)} {devise}
                    </p>
                  </div>
                )}

                {montantSaisi > 0 && !precisionOk && (
                  <p className="mt-2 rounded-lg bg-[#F59E0B]/10 p-2 text-[11px] text-[#F59E0B]">
                    Deux décimales maximum ({devise}).
                  </p>
                )}

                {montantSaisi > 0 && precisionOk && !soldeSuffisant && (
                  <p className="mt-2 rounded-lg bg-[#F6465D]/10 p-2 text-[11px] text-[#F6465D]">
                    {formatMontant(montantSaisi)} {devise} dépasse le solde disponible de
                    {' '}{formatMontant(walletBalance)} {devise}. Maximum envoyable :
                    {' '}{formatMontant(maximumTransferInDevise)} {devise}.
                  </p>
                )}

                {erreurTaux && (
                  <p className="text-[10px] text-[#F59E0B] mt-1">{erreurTaux}</p>
                )}
              </div>

              {/* Note */}
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optionnel)"
                className="w-full p-3 bg-[var(--uq-bg-primary)] border border-[var(--uq-border)] rounded-xl text-white text-sm focus:border-[var(--uq-magenta)] outline-none"
              />

              {message && (
                <div className="p-3 rounded-xl text-xs bg-[#F6465D]/15 text-[#F6465D]">{message}</div>
              )}

              <button
                onClick={() => setEtape('recap')}
                disabled={!peutContinuer}
                className="w-full py-4 rounded-2xl font-black text-sm text-white disabled:opacity-40 active:scale-95 transition"
                style={{ background: UQ_GRADIENTS.main, backgroundSize: '200% 200%' }}
              >
                Continuer
              </button>
            </>
          )}

          {etape === 'recap' && (
            <>
              {/* Q5 — tableau récapitulatif obligatoire */}
              <div className="rounded-2xl border border-[var(--uq-border)] overflow-hidden">
                <div className="px-4 py-2.5 bg-[var(--uq-card-light)]">
                  <p className="text-xs font-black text-white">Confirmer l'envoi</p>
                </div>
                <div className="divide-y divide-[var(--uq-border)]">
                  {[
                    ['Destinataire', destinataireAffiche || destinataire],
                    ['Montant envoyé', `${formatMontant(montantSaisi)} ${devise}`],
                    ['Frais', `${formatMontant(fraisDevise)} ${devise}`],
                    ['Total débité', `${formatMontant(montantSaisi + fraisDevise)} ${devise}`],
                    ['Score de sécurité mobilisé (indicatif)', `${formatMontant(amountPoints)} points`],
                    ['Taux appliqué', `1 unité = ${formatMontant(deviseParUnite(devise))} ${devise}`],
                    ['Source du taux', taux?.source || '—'],
                    ['Note', note || '—'],
                  ].map(([label, valeur]) => (
                    <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <span className="text-[11px] text-white/50">{label}</span>
                      <span className="text-[11px] font-bold text-white text-right break-all">{valeur}</span>
                    </div>
                  ))}
                </div>
              </div>

              {message && (
                <div className="p-3 rounded-xl text-xs bg-[#F6465D]/15 text-[#F6465D]">{message}</div>
              )}

              {/* Q6 — Annuler / Modifier / Confirmer */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={fermer}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold bg-[#F6465D]/15 text-[#F6465D] active:scale-95 transition"
                >
                  <IconClose size={13} color="#F6465D" /> Annuler
                </button>
                <button
                  onClick={() => setEtape('form')}
                  className="py-3.5 rounded-2xl text-xs font-bold text-white bg-[var(--uq-card-light)] border border-[var(--uq-border)] flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <IconEdit size={13} color={UQ_COLORS.blue} /> Modifier
                </button>
              </div>

              <button
                onClick={handleConfirmer}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-sm text-white disabled:opacity-50 active:scale-95 transition flex items-center justify-center gap-2"
                style={{ background: UQ_GRADIENTS.main, backgroundSize: '200% 200%' }}
              >
                {loading
                  ? <><IconRefresh size={15} color="#FFF" /> Envoi…</>
                  : <><IconCheck size={15} color="#FFF" /> Confirmer et saisir le PIN</>}
              </button>
            </>
          )}
        </div>
      </div>
</div>
);
}

