import { PublicUserIdentity } from '../../../components/ui/PublicUserIdentity';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Icon } from '../../../components/ui/Icon';

interface StudioHomeProps {
  onBack: () => void;
  onMesZando: () => void;
  onCreateNew: () => void;
  onAccueil: () => void;
  itemCount: number;
  loadError?: string;
}

export function StudioHome({ onBack, onMesZando, onCreateNew, onAccueil, itemCount, loadError }: StudioHomeProps) {
  const uqNumber = localStorage.getItem('uq_number') || '';
  return (
    <div className="uq-screen uq-screen--inset uq-spatial-background overflow-y-auto">

      <ScreenHeader
        onBack={onBack}
        backLabel="Retour au marché"
        title="Studio"
        subtitle="Zando · Espace vendeur"
        right={
          uqNumber ? (
            <PublicUserIdentity
              userId={uqNumber}
              size="sm"
              className="hidden rounded-xl border border-white/[0.08] bg-[var(--uq-bg-secondary)] px-3 py-2 sm:flex"
            />
          ) : null
        }
      />

      {loadError && (
        <p role="alert" className="mx-auto mt-4 w-full max-w-6xl rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {loadError}
        </p>
      )}

      {/* 3 Grandes cartes */}
      <div className="uq-screen-content flex-1 space-y-4">
        
        {/* Carte 1 : Mes Zando */}
        <button
          onClick={onMesZando}
          className="w-full rounded-3xl border border-white/10 bg-[#0F121C] p-6 text-left transition-transform hover:border-white/20 active:scale-[0.99]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl"><Icon name="package" size={20} tone="warning" /></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <span className="text-xl text-white"><Icon name="arrowRight" size={20} /></span>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Mes offres</h2>
          <p className="mb-4 text-sm text-white/55">
            Voir et gérer tes annonces publiées
          </p>
          <div className="flex gap-2">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
              {itemCount} item{itemCount > 1 ? 's' : ''}
            </span>
          </div>
        </button>

        {/* Carte 2 : Créer un nouvel élément */}
        <button
          onClick={onCreateNew}
          className="w-full rounded-3xl border border-[#00E599]/35 bg-gradient-to-br from-[#00E599]/10 to-[#0F121C] p-6 text-left transition-transform hover:border-[#00E599]/65 active:scale-[0.99]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl"><Icon name="plus" size={20} /></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00E599]/15">
              <span className="text-xl text-[#00E599]"><Icon name="arrowRight" size={20} /></span>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Créer une offre</h2>
          <p className="mb-4 text-sm text-white/55">
            Publie un produit ou un service sur le marché
          </p>
          <div className="flex gap-2">
            <span className="rounded-full bg-[#00E599]/10 px-3 py-1 text-xs font-semibold text-[#00E599]">
              Publication via API sécurisée
            </span>
          </div>
        </button>

        {/* Carte 3 : Accueil / Suggestions */}
        <button
          onClick={onAccueil}
          className="w-full rounded-3xl border border-white/10 bg-[#0F121C] p-6 text-left transition-transform hover:border-white/20 active:scale-[0.99]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl"><Icon name="house" size={20} /></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <span className="text-xl text-white"><Icon name="arrowRight" size={20} /></span>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Conseils</h2>
          <p className="mb-4 text-sm text-white/55">
            Parcourir des idées de présentation
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
              <Icon name="phone" size={14} tone="info" /> Vends ton téléphone
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
              <Icon name="church" size={14} tone="info" /> Crée ton église
            </span>
          </div>
        </button>

      </div>

    </div>
  );
}
