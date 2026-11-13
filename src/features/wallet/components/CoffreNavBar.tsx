// ====================
// COFFRE NAV BAR — Navigation hybride alignée sur TradingScreen
// ====================
//
//   PC     : sidebar fixe à gauche (repliable) — rendue par CoffreScreen
//   Mobile : onglets EN HAUT, sticky top-0, défilement horizontal
//
// Style aligné sur TradingNavBar : pills dégradées, icônes lucide,
// libellés masqués sous sm (icône seule sur petit écran).
// ====================

import { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, LayoutDashboard, Send, QrCode, ArrowLeftRight,
  Gift, History, Vault,
} from 'lucide-react';

export type CoffreTab =
  | 'dashboard'
  | 'send'
  | 'receive'
  | 'convert'
  | 'ubi'
  | 'history'
  | 'vault';

export interface CoffreTabDef {
  id: CoffreTab;
  label: string;
  Icon: LucideIcon;
}

export const COFFRE_TABS: CoffreTabDef[] = [
  { id: 'dashboard', label: 'Coffre',      Icon: LayoutDashboard },
  { id: 'send',      label: 'Envoyer',     Icon: Send            },
  { id: 'receive',   label: 'Recevoir',    Icon: QrCode          },
  { id: 'convert',   label: 'Unités BORB', Icon: ArrowLeftRight  },
  { id: 'ubi',       label: 'UBI',         Icon: Gift            },
  { id: 'history',   label: 'Historique',  Icon: History         },
  { id: 'vault',     label: 'Coffres',     Icon: Vault           },
];

interface Props {
  activeTab: CoffreTab;
  onTabChange: (tab: CoffreTab) => void;
  onBack: () => void;
  onTradingClick?: () => void;
}

/**
 * Barre d'onglets mobile (sticky en haut) — masquée sur PC (md:hidden),
 * où c'est la sidebar qui prend le relais.
 */
export function CoffreNavBar({ activeTab, onTabChange, onBack, onTradingClick }: Props) {
  return (
    <header className="uq-screen-header md:hidden">
      <div className="uq-tabbar min-h-[var(--uq-header-h)]">

        {/* Retour accueil */}
        <button
          onClick={onBack}
          className="uq-icon-btn"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="shrink-0 w-px h-6 bg-uq-border mx-1" />

        {COFFRE_TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="uq-tab"
              data-active={active}
              aria-pressed={active}
            >
              <Icon size={15} />
              <span className={active ? 'inline' : 'hidden sm:inline'}>{label}</span>
            </button>
          );
        })}

        {onTradingClick && (
          <>
            <div className="shrink-0 w-px h-6 bg-uq-border mx-1" />
            <button
              onClick={onTradingClick}
              className="uq-tab"
            >
              Trading
            </button>
          </>
        )}
      </div>
    </header>
  );
}
