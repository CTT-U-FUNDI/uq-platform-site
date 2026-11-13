// ====================
// 🛒 ZANDO — TYPES
// ====================

export type ItemType = 'video' | 'photos' | 'text';

export interface ShopItem {
  id: string;
  shop_id: string;
  type: ItemType;
  media_urls: string[];
  title: string;
  description: string;
  price_borb: number;
  price_usd: number;
  category: string;
  commission_enabled: boolean;
  commission_rate: number;
  rating: number;
  review_count: number;
  comment_count: number;
  share_count: number;
  published: boolean;
  created_at: string;
}

export interface ItemAgent {
  user_id: string;
  commission_rate: number;
  sales_count: number;
  total_earned: number;
  joined_at: string;
}

export interface ItemInteraction {
  user_id: string;
  type: 'view' | 'like' | 'share' | 'comment';
  created_at: string;
}

export interface ContactRequest {
  id: string;
  requester_id: string;
  target_id: string;
  field: 'number' | 'email' | 'phone';
  status: 'pending' | 'accepted' | 'refused';
  created_at: string;
  responded_at?: string;
}

export interface SharedContact {
  shared_with_id: string;
  field: string;
  shared_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  draft_type: 'shop' | 'item' | 'message';
  data: any;
  created_at: string;
  updated_at: string;
}

export interface CreateItemPayload {
  shop_id: string;
  item_type: ItemType;
  media_urls: string[];
  title: string;
  description: string;
  price_borb: number;
  price_usd: number;
  category: string;
  commission_enabled: boolean;
  commission_rate: number;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
