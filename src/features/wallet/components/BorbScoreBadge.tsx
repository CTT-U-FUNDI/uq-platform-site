// ============================================================
// Score de sécurité BORB provenant de l'API portefeuille
// ============================================================
import { CoffreIcon3D } from '../../../components/ui/Icons3D';

interface Props {
  balance: number;
  hidden?: boolean;
}

export function BorbScoreBadge({ balance, hidden = false }: Props) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center justify-between"
      style={{
        background: 'linear-gradient(120deg, rgba(25,91,108,0.3), rgba(9,27,38,0.74) 68%, rgba(27,69,98,0.28))',
        border: '1px solid rgba(112,216,229,0.26)',
        boxShadow: '0 0 28px rgba(47,107,255,0.12), inset 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center">
          <CoffreIcon3D size={36} />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold">
            Score de sécurité
          </p>
          <p className="text-lg font-black text-[#D7F6FF]">
            {hidden ? '••••••' : `${balance.toLocaleString('fr-FR')} unités de score`}
          </p>
        </div>
      </div>
    </div>
  );
}