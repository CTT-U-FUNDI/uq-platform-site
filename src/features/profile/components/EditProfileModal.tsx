// ====================
// EDIT PROFILE MODAL — Modifier les 8 champs modifiables
// ====================

import { useState } from 'react';
import apiClient from '../../../api/client';
import { IconClose, IconCheck, IconRefresh } from '../../../components/ui/UQIcons';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Icon } from '../../../components/ui/Icon';

interface Props {
  uqNumber: string;
  currentProfil: {
    ville_provenance?: string;
    ville_actuelle?: string;
    statut_marital?: string;
    emploi?: string;
    description?: string;
    mobile_money_number?: string;
    mobile_money_operator?: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

const OPERATEURS = [
  'M-Pesa',
  'Airtel Money',
  'Orange Money',
  'MTN Mobile Money',
  'Moov Money',
  'Wave',
  'Autre',
];

export function EditProfileModal({ uqNumber, currentProfil, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const statuses = [
    { v: 'celibataire', l: `💍 ${t('profile.single')}` },
    { v: 'marie', l: `💒 ${t('profile.married')}` },
    { v: 'divorce', l: `💔 ${t('profile.divorced')}` },
    { v: 'veuf', l: `🕊️ ${t('profile.widowed')}` },
  ];
  const [villeProvenance, setVilleProvenance] = useState(currentProfil.ville_provenance || '');
  const [villeActuelle, setVilleActuelle] = useState(currentProfil.ville_actuelle || '');
  const [statutMarital, setStatutMarital] = useState(currentProfil.statut_marital || '');
  const [emploi, setEmploi] = useState(currentProfil.emploi || '');
  const [description, setDescription] = useState(currentProfil.description || '');
  const [mmNumber, setMmNumber] = useState(currentProfil.mobile_money_number || '');
  const [mmOperator, setMmOperator] = useState(currentProfil.mobile_money_operator || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiClient.post('/api/account/profile/update', {
        uq_number: uqNumber,
        ville_provenance: villeProvenance.trim(),
        ville_actuelle: villeActuelle.trim(),
        statut_marital: statutMarital,
        emploi: emploi.trim(),
        description: description.trim(),
        mobile_money_number: mmNumber.trim(),
        mobile_money_operator: mmOperator,
      });
      if (r.data.status === 'success') {
        onSaved();
        onClose();
      } else {
        setError(r.data.message || 'Erreur');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Erreur reseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="w-full max-w-2xl bg-[#181A20] border-t md:border border-[#2A2A38] rounded-t-3xl md:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A38] shrink-0">
          <h3 className="text-base font-bold"><Icon name="pencil" size={18} tone="info" /> {t('profile.editTitle')}</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-[#1F1F2A] flex items-center justify-center disabled:opacity-50"
          >
            <IconClose size={16} color="#EAECEF" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* Info : champs fixes */}
          <div className="bg-[#FCD535]/5 border border-[#FCD535]/30 rounded-xl p-3">
            <p className="text-[11px] text-[#FCD535]">
              ℹ️ {t('profile.fixedFields')}
            </p>
          </div>

          {/* Villes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#8E8E9A] mb-1 block"><Icon name="house" size={14} /> {t('profile.originCity')}</label>
              <input
                type="text"
                value={villeProvenance}
                onChange={(e) => setVilleProvenance(e.target.value)}
                placeholder="Kinshasa"
                className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-sm focus:outline-none focus:border-[#4A9EFF]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8E8E9A] mb-1 block"><Icon name="pin" size={14} tone="brand" /> {t('profile.currentCity')}</label>
              <input
                type="text"
                value={villeActuelle}
                onChange={(e) => setVilleActuelle(e.target.value)}
                placeholder="Lubumbashi"
                className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-sm focus:outline-none focus:border-[#4A9EFF]"
              />
            </div>
          </div>

          {/* Statut marital */}
          <div>
            <label className="text-xs text-[#8E8E9A] mb-1 block"><Icon name="gem" size={14} tone="brand" /> {t('profile.familyStatus')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {statuses.map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setStatutMarital(v)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition ${
                    statutMarital === v
                      ? 'bg-gradient-to-r from-[#E63946] to-[#2E86DE] text-white'
                      : 'bg-[#0F0F15] border border-[#2A2A38] text-[#8E8E9A]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Emploi */}
          <div>
            <label className="text-xs text-[#8E8E9A] mb-1 block"><Icon name="briefcase" size={14} tone="muted" /> {t('profile.occupation')}</label>
            <input
              type="text"
              value={emploi}
              onChange={(e) => setEmploi(e.target.value)}
              placeholder="Menuisier depuis 2015"
              className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-sm focus:outline-none focus:border-[#4A9EFF]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[#8E8E9A] mb-1 block"><Icon name="notebook" size={14} tone="info" /> Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('profile.aboutPlaceholder')}
              rows={3}
              maxLength={300}
              className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-sm focus:outline-none focus:border-[#4A9EFF] resize-none"
            />
            <p className="text-[10px] text-[#5A5A6A] mt-1 text-right">{description.length}/300</p>
          </div>

          {/* Mobile Money */}
          <div className="space-y-2">
            <label className="text-xs text-[#8E8E9A] block"><Icon name="phone" size={14} tone="info" /> Mobile Money</label>
            <select
              value={mmOperator}
              onChange={(e) => setMmOperator(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-sm focus:outline-none focus:border-[#4A9EFF]"
            >
              <option value="">-- {t('profile.selectOperator')} --</option>
              {OPERATEURS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <input
              type="tel"
              value={mmNumber}
              onChange={(e) => setMmNumber(e.target.value)}
              placeholder="+243 XXX XXX XXX"
              className="w-full p-3 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-sm font-mono focus:outline-none focus:border-[#4A9EFF]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-[#F6465D]/15 border border-[#F6465D]/30 text-[#F6465D] text-xs">
              <Icon name="alert" size={14} tone="warning" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A38] flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl border border-[#2A2A38] text-[#8E8E9A] font-bold text-sm disabled:opacity-50"
          >
            {t('profile.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><IconRefresh size={14} color="#FFF" /> Enregistrement...</>
            ) : (
              <><IconCheck size={14} color="#FFF" /> {t('profile.save')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}