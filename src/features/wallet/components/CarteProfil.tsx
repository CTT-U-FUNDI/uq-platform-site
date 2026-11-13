import { Icon } from '../../../components/ui/Icon';
// ============================================================
// CARTE PROFIL - Affiche le profil du destinataire
// Photo + Nom + Ville + Emploi + Mobile Money + Chat
// ============================================================

export interface ProfilData {
  pseudo: string;
  display: string;
  nom?: string;
  prenom?: string;
  sexe?: string;
  ville_provenance?: string;
  ville_actuelle?: string;
  statut_marital?: string;
  photo_url?: string;
  description?: string;
  emploi?: string;
  mobile_money_number?: string;
  mobile_money_operator?: string;
  verified?: boolean;
}

interface Props {
  profil: ProfilData;
  onChat?: () => void;
  onMobileMoney?: () => void;
}

export function CarteProfil({ profil, onChat, onMobileMoney }: Props) {
  const initiale = (profil.prenom?.[0] || profil.pseudo?.[0] || '?').toUpperCase();
  const nomComplet = `${profil.prenom || ''} ${profil.nom || ''}`.trim() || profil.pseudo;

  const ville = profil.ville_actuelle || profil.ville_provenance || 'Ville inconnue';
  const statutLabel = (s: string) => {
    const map: Record<string, string> = {
      celibataire: 'Celibataire',
      marie: 'Marie(e)',
      divorce: 'Divorce(e)',
      veuf: 'Veuf(ve)',
    };
    return map[s] || s;
  };

  return (
    <div
      className="rounded-2xl p-4 mt-3"
      style={{
        background: 'linear-gradient(135deg, rgba(47,107,255,0.08) 0%, rgba(56,189,248,0.06) 100%)',
        border: '1px solid rgba(47,107,255,0.25)',
        boxShadow: '0 0 25px rgba(47,107,255,0.12)',
      }}
    >
      {/* Header : Photo + Nom */}
      <div className="flex items-center gap-3 mb-3">
        {profil.photo_url ? (
          <img
            src={profil.photo_url}
            alt={nomComplet}
            className="w-14 h-14 rounded-full object-cover border-2"
            style={{ borderColor: '#E63946', boxShadow: '0 0 15px rgba(230,57,70,0.4)' }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg"
            style={{
              background: 'linear-gradient(135deg, #E63946, #7B4DD9)',
              boxShadow: '0 0 15px rgba(230,57,70,0.4)',
            }}
          >
            {initiale}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-black text-white truncate">{nomComplet}</p>
            {profil.verified && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0"
                style={{
                  background: 'rgba(14,203,129,0.2)',
                  color: '#0ECB81',
                  border: '1px solid rgba(14,203,129,0.4)',
                }}
                title="KYC verifie"
              >
                <Icon name="check" size={20} tone="success" /> Verifie
              </span>
            )}
          </div>
          <p className="text-xs text-white/55 truncate">{profil.pseudo}</p>
          <p className="text-[10px] text-white/45 truncate">
            <Icon name="pin" size={12} tone="brand" /> {ville}
            {profil.emploi && ` • 💼 ${profil.emploi}`}
          </p>
        </div>
      </div>

      {/* Détails */}
      <div className="space-y-1.5 mb-3 text-[11px]">
        {profil.ville_provenance && profil.ville_actuelle && profil.ville_provenance !== profil.ville_actuelle && (
          <p className="text-white/65">
            <span className="text-white/40">Originaire de :</span> {profil.ville_provenance}
          </p>
        )}
        {profil.statut_marital && (
          <p className="text-white/65">
            <span className="text-white/40">Statut :</span> {statutLabel(profil.statut_marital)}
          </p>
        )}
        {profil.sexe && (
          <p className="text-white/65">
            <span className="text-white/40">Sexe :</span> {profil.sexe === 'M' ? 'Homme' : profil.sexe === 'F' ? 'Femme' : 'Autre'}
          </p>
        )}
        {profil.description && (
          <p className="text-white/65 italic line-clamp-2">"{profil.description}"</p>
        )}
      </div>

      {/* Mobile Money */}
      {profil.mobile_money_number && (
        <div
          className="rounded-xl p-2.5 mb-3 flex items-center gap-2"
          style={{
            background: 'rgba(14,203,129,0.1)',
            border: '1px solid rgba(14,203,129,0.3)',
          }}
        >
          <span className="text-lg"><Icon name="phone" size={18} tone="info" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/50 uppercase tracking-wider">
              {profil.mobile_money_operator || 'Mobile Money'}
            </p>
            <p className="text-xs font-bold text-white font-mono truncate">
              {profil.mobile_money_number}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {onMobileMoney && profil.mobile_money_number && (
          <button
            onClick={onMobileMoney}
            className="py-2.5 rounded-xl text-[11px] font-bold text-white active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(14,203,129,0.25), rgba(14,203,129,0.1))',
              border: '1px solid rgba(14,203,129,0.4)',
            }}
          >
            <Icon name="phone" size={20} tone="info" /> Payer Mobile Money
          </button>
        )}
        {onChat && (
          <button
            onClick={onChat}
            className={`py-2.5 rounded-xl text-[11px] font-bold text-white active:scale-95 transition-all ${!profil.mobile_money_number ? 'col-span-2' : ''}`}
            style={{
              background: 'linear-gradient(135deg, rgba(47,107,255,0.25), rgba(47,107,255,0.1))',
              border: '1px solid rgba(47,107,255,0.4)',
            }}
          >
            <Icon name="message" size={20} tone="info" /> Discuter dans le chat
          </button>
        )}
      </div>
    </div>
  );
}