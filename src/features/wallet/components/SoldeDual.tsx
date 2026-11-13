// ============================================================
// SOLDE DUAL - 3 lignes avec scroll de devise par ligne
// Titre: devise locale | Sous-titre: devise internationale | Mini: BORB
// ============================================================
import { useEffect, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';

// Devises populaires (le reste vient du backend oracle)
const DEVISES_POPULAIRES = [
  'CDF', 'USD', 'EUR', 'GBP',
  'XAF', 'XOF', 'NGN', 'KES', 'ZAR',
  'MAD', 'GHS', 'UGX', 'TZS', 'EGP', 'RWF', 'BIF',
];

// Sous-unites BORB dans l'ordre (pour affichage si < 1)
const SOUS_UNITES_BORB = ['borb', 'mborb', 'nborb', 'pborb', 'fborb', 'aborb'];

interface Balance {
  borb_total: number;
  units: Array<{ unit: string; value: number }>;
}

interface Props {
  balance: Balance;
  portfolioUsd: number;
  portfolioCdf: number;
  tauxCdf?: number;
  tauxLive?: Record<string, number>;
  hidden?: boolean;
  region?: string; // 'CD', 'FR', 'US', etc.
  onDeviseChange?: (ligne: 1 | 2 | 3, devise: string) => void;
}

// Formate un montant selon la devise
function formatMontant(montant: number, devise: string): string {
  if (devise === 'CDF') {
    return `${Math.round(montant).toLocaleString('fr-FR').replace(/\u202f/g, ' ')} FC`;
  }
  if (devise === 'USD') {
    return `$${montant.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  if (devise === 'EUR' || devise === 'GBP') {
    return montant.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ' + devise;
  }
  if (devise === 'BORB' || SOUS_UNITES_BORB.includes(devise)) {
    return `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} ${devise}`;
  }
  return `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${devise}`;
}

// Convertit BORB -> devise cible. `tauxLive` est une table d'UNITES PAR DOLLAR :
// la multiplier par un solde en BORB n'a de sens qu'après avoir converti ce
// solde en dollars, avec le prix publié du BORB. Ce composant ne reçoit pas ce
// prix (l'appelant le fait : `portfolioUsd`/`portfolioCdf` sont calculs avec),
// donc toute conversion fiat demandee ici renvoie `null` plutot qu'un taux
// suppose. Le fond du probleme etant la parite « 1 BORB = 1 USD », l'afficher
// revient a inventer un cours.
function convertirBORB(borb: number, devise: string, tauxCdf?: number, tauxLive?: Record<string, number>): number | null {
  // Sous-unites BORB : par definition du BORB, aucun taux de marche n'intervient.
  if (devise === 'borb') return borb * 100;
  if (devise === 'mborb') return borb * 10000;
  if (devise === 'nborb') return borb * 1_000_000;
  if (devise === 'pborb') return borb * 100_000_000;

  return null;
}

// Devises par defaut selon la region
function devisesDefaut(region: string): [string, string, string] {
  if (region === 'CD') return ['CDF', 'USD', 'BORB'];
  if (region === 'FR') return ['EUR', 'USD', 'BORB'];
  if (region === 'US') return ['USD', 'EUR', 'BORB'];
  if (region === 'NG') return ['NGN', 'USD', 'BORB'];
  if (region === 'ZA') return ['ZAR', 'USD', 'BORB'];
  return ['USD', 'EUR', 'BORB'];
}

// Composant d'une ligne (scroll + montant)
function LigneSolde({
  numero, devise, setDevise, montant, borbMontant, hidden,
}: {
  numero: 1 | 2 | 3;
  devise: string;
  setDevise: (d: string) => void;
  montant: number | null;
  borbMontant: number;
  hidden: boolean;
}) {
  const tailles: Record<number, string> = {
    1: 'text-4xl sm:text-5xl font-black',
    2: 'text-lg text-white/80',
    3: 'text-sm text-white/60',
  };
  const taille = tailles[numero];

  // Si BORB et < 1, on utilise les sous-unites
  const deviseAffichee = (() => {
    if (devise !== 'BORB') return devise;
    if (borbMontant >= 1) return 'BORB';
    if (borbMontant >= 0.01) return 'borb';
    if (borbMontant >= 0.0001) return 'mborb';
    if (borbMontant >= 0.000001) return 'nborb';
    if (borbMontant >= 0.00000001) return 'pborb';
    return 'fborb';
  })();

  return (
    <div className="flex items-center gap-2 mb-2">
      {/* Scroll de devise a gauche */}
      <select
        value={devise}
        onChange={(e) => setDevise(e.target.value)}
        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white/70 cursor-pointer focus:outline-none"
        disabled={hidden}
      >
        {DEVISES_POPULAIRES.map(d => (
          <option key={d} value={d} className="bg-[#0C1530]">{d}</option>
        ))}
        <option value="BORB" className="bg-[#0C1530]">BORB</option>
      </select>

      {/* Montant */}
      <p className={`${taille} ${numero === 1 ? 'text-white' : ''}`}>
        {hidden ? '••••••' : montant === null ? '— taux indisponible' : formatMontant(montant, deviseAffichee)}
      </p>
    </div>
  );
}

export function SoldeDual({
  balance,
  portfolioUsd,
  portfolioCdf,
  tauxCdf,
  tauxLive,

  hidden = false,
  region = 'CD',
  onDeviseChange,
}: Props) {
  const defauts = devisesDefaut(region);
  const [dev1, setDev1] = useState(defauts[0]);
  const [dev2, setDev2] = useState(defauts[1]);
  const [dev3, setDev3] = useState('BORB');

  const borbTotal = balance.borb_total;

  useEffect(() => { onDeviseChange?.(1, dev1); }, [dev1]);
  useEffect(() => { onDeviseChange?.(2, dev2); }, [dev2]);
  useEffect(() => { onDeviseChange?.(3, dev3); }, [dev3]);

  const convertir = (devise: string): number | null => {
    if (devise === 'CDF') return portfolioCdf;
    if (devise === 'USD') return portfolioUsd;
    return convertirBORB(borbTotal, devise, tauxCdf, tauxLive);
  };

  return (
    <div className="w-full">
      <LigneSolde
        numero={1}
        devise={dev1}
        setDevise={setDev1}
        montant={convertir(dev1)}
        borbMontant={borbTotal}
        hidden={hidden}
      />
      <LigneSolde
        numero={2}
        devise={dev2}
        setDevise={setDev2}
        montant={convertir(dev2)}
        borbMontant={borbTotal}
        hidden={hidden}
      />
      <LigneSolde
        numero={3}
        devise={dev3}
        setDevise={setDev3}
        montant={convertir(dev3)}
        borbMontant={borbTotal}
        hidden={hidden}
      />

      {/* Badge de securite */}
      <div className="mt-3 flex items-center gap-2 text-xs text-[#0ECB81]">
        <span><Icon name="shield" size={20} tone="success" /></span>
        <span>
          Securite :{' '}
          {hidden
            ? '••••••'
            : `${borbTotal.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} BORB proteges`}
        </span>
      </div>

      {/* Badge 30% disponible + Alerte */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{
            background: 'rgba(123,77,217,0.2)',
            color: '#9B6DE8',
            border: '1px solid rgba(123,77,217,0.4)',
          }}
        >
          30% disponible
        </span>
        {borbTotal < 5000 && (
          <span className="text-[10px] font-bold text-[#F6465D] animate-pulse">
            Solde bas - Reclamer disponible
          </span>
        )}
      </div>
    </div>
  );
}
