// ====================
// TRADING NAV BAR — Barre d'icônes (P2P, Ordres, Escrow, etc.)
// Responsive : PC + Mobile
// ====================

import { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, Repeat, Clock, Shield, TrendingUp, BarChart3, Wallet
} from 'lucide-react';

export type TradingTab =
  | 'p2p'
  | 'orders'
  | 'escrow'
  | 'crypto-market'
  | 'exchange'
  | 'assets';

interface TabDef {
  id: TradingTab;
  label: string;
  Icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: 'p2p',           label: 'P2P',           Icon: Repeat     },
  { id: 'orders',        label: 'Ordres',        Icon: Clock      },
  { id: 'escrow',        label: 'Escrow',        Icon: Shield     },
  { id: 'crypto-market', label: 'Marché Crypto', Icon: TrendingUp },
  { id: 'exchange',      label: 'Bourse',        Icon: BarChart3  },
  { id: 'assets',        label: 'Actif',         Icon: Wallet     },
];

interface Props {
  activeTab: TradingTab;
  onTabChange: (tab: TradingTab) => void;
  onBack: () => void;
}

export function TradingNavBar({ activeTab, onTabChange, onBack }: Props) {
  return (
    <header className="uq-screen-header">
      <div className="uq-tabbar min-h-[var(--uq-header-h)]">

        {/* Bouton retour accueil */}
        <button
          onClick={onBack}
          className="uq-icon-btn"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="shrink-0 w-px h-6 bg-[var(--uq-border)] mx-1" />

        {/* Onglets */}
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="uq-tab"
              data-active={active}
              aria-pressed={active}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}

      </div>
    </header>
  );
}
