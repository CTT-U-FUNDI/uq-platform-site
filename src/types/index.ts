export interface LoginResponse {
  token: string;
  expires_at?: string;
}

export interface CaseInfo {
  name: string;
  balance: number;
}

export interface CasesResponse {
  status: string;
  cases: [string, number][];
}

export interface DistributionStats {
  profile1_treasury: {
    stock_borb: number;
    usage: string;
  };
  profile2_delis: {
    balance_borb: number;
    usage: string;
  };
}

export interface PlayerStats {
  total_sessions: number;
  total_seconds: number;
  total_paid: number;
  cached_contents: number;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  rating: number;
  open: boolean;
}

export interface JournalEntry {
  id: number;
  tx_type: string;
  amount_points: number;
  fee_points: number;
  counterparty: string;
  created_at: string;
}
