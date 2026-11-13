// ====================
// TRADING SCREEN — Écran principal avec tabs
// ====================

import { useState } from 'react';
import { TradingNavBar, TradingTab } from '../components/TradingNavBar';
import { P2PView } from '../components/P2PView';
import { ExchangeView } from '../components/ExchangeView';
import { CryptoMarketView } from '../components/CryptoMarketView';
import { AssetsView } from '../components/AssetsView';
import { OrdersEscrowView } from '../components/OrdersEscrowView';

interface Props {
  onBack: () => void;
}

export default function TradingScreen({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TradingTab>('p2p');

  return (
    <div className="uq-screen uq-spatial-background">
      <TradingNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
      />

      <main className="uq-screen-content">
        {activeTab === 'p2p' && <P2PView />}
        {activeTab === 'orders' && <OrdersEscrowView mode="orders" />}
        {activeTab === 'escrow' && <OrdersEscrowView mode="escrow" />}
        {activeTab === 'crypto-market' && <CryptoMarketView />}
        {activeTab === 'exchange' && <ExchangeView />}
        {activeTab === 'assets' && <AssetsView />}
      </main>
    </div>
  );
}
