// Types P2P — alignés sur /api/sellers et /api/mesh/sellers

export interface BackendSellerOffer {
  id: string;
  seller: string;
  description: string;
  price_per_mb: number;
  total_size_mb: number;
  active: boolean;
  created_at: number;
}

export interface P2POffer {
  id: string;
  name: string;
  priceUsd: number;
  rating: number;
  speed: string;
  verified: boolean;
  payments: string[];
  rawDescription: string;
}

export function mapSellerToOffer(o: BackendSellerOffer, borbUsdRate: number): P2POffer {
  const priceUsd =
    o.price_per_mb > 0
      ? Math.max(0.01, o.price_per_mb / 100)
      : Math.max(0.01, borbUsdRate);

  const initials = o.seller.slice(0, 2).toUpperCase();
  const ageSec = Math.max(0, Math.floor(Date.now() / 1000) - o.created_at);
  const speed =
    ageSec < 120 ? '< 2 min' : ageSec < 600 ? '< 10 min' : '< 30 min';

  return {
    id: o.id,
    name: o.seller || initials,
    priceUsd,
    rating: o.active ? 4.8 : 4.2,
    speed,
    verified: o.active,
    payments: ['Mobile Money', 'Virement', 'BORB'],
    rawDescription: o.description,
  };
}
