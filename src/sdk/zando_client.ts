// ====================
// 🛒 ZANDO — CLIENT API (avec les VRAIS chemins du backend)
// ====================

import api from '../api/client';
import type {
  ShopItem,
  ItemAgent,
  ItemInteraction,
  ContactRequest,
  SharedContact,
  Draft,
  CreateItemPayload,
  ApiResponse,
} from './zando_types';

const client = api;

type BackendShopItem = Omit<ShopItem, 'media_urls'> & { media_urls: string | string[] };

function normalizeItem(item: BackendShopItem): ShopItem {
  if (Array.isArray(item.media_urls)) {
    return { ...item, media_urls: item.media_urls };
  }
  let mediaUrls: unknown;
  try {
    mediaUrls = JSON.parse(item.media_urls);
  } catch {
    throw new Error(`Les médias de l’offre ${item.id} ne sont pas au format attendu.`);
  }
  if (!Array.isArray(mediaUrls) || mediaUrls.some((url) => typeof url !== 'string')) {
    throw new Error(`Les médias de l’offre ${item.id} sont invalides.`);
  }
  return { ...item, media_urls: mediaUrls };
}

// ====================
// 🛒 ZANDO — ÉLÉMENTS
// ====================

export async function createItem(payload: CreateItemPayload): Promise<ShopItem> {
  const resp = await client.post<{ status: string; item_id?: string; message?: string }>(
    '/api/zando/item/create',
    {
      type: payload.item_type,
      media_urls: JSON.stringify(payload.media_urls),
      title: payload.title,
      description: payload.description,
      price_borb: payload.price_borb,
      price_usd: payload.price_usd,
      category: payload.category,
      commission_enabled: payload.commission_enabled,
      commission_rate: payload.commission_rate,
    },
  );
  if (resp.data.status !== 'success' || !resp.data.item_id) {
    throw new Error(resp.data.message || 'Erreur de création');
  }
  await publishItem(resp.data.item_id);
  return getItemById(resp.data.item_id);
}

export async function getShopItems(shopId: string): Promise<ShopItem[]> {
  const resp = await client.get<{ status: string; items: BackendShopItem[] }>(
    `/api/zando/items/${encodeURIComponent(shopId)}`
  );
  return (resp.data.items || []).map(normalizeItem);
}

export async function getItemById(itemId: string): Promise<ShopItem> {
  const resp = await client.get<{ status: string; item?: BackendShopItem; message?: string }>(
    `/api/zando/item/${encodeURIComponent(itemId)}`
  );
  if (resp.data.status !== 'success' || !resp.data.item) {
    throw new Error(resp.data.message || 'Élément introuvable');
  }
  return normalizeItem(resp.data.item);
}

export async function updateItem(
  itemId: string,
  updates: Partial<CreateItemPayload>
): Promise<void> {
  const current = await getItemById(itemId);
  const resp = await client.post<ApiResponse>(
    `/api/zando/item/${encodeURIComponent(itemId)}/update`,
    {
      type: updates.item_type ?? current.type,
      media_urls: JSON.stringify(updates.media_urls ?? current.media_urls),
      title: updates.title ?? current.title,
      description: updates.description ?? current.description,
      price_borb: updates.price_borb ?? current.price_borb,
      price_usd: updates.price_usd ?? current.price_usd,
      category: updates.category ?? current.category,
      commission_enabled: updates.commission_enabled ?? current.commission_enabled,
      commission_rate: updates.commission_rate ?? current.commission_rate,
    }
  );
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur de mise à jour');
  }
}

export async function deleteItem(itemId: string): Promise<void> {
  const resp = await client.post<ApiResponse>(
    `/api/zando/item/${encodeURIComponent(itemId)}/delete`
  );
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur de suppression');
  }
}

export async function publishItem(itemId: string): Promise<void> {
  const resp = await client.post<ApiResponse>(
    `/api/zando/item/${encodeURIComponent(itemId)}/publish`
  );
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur de publication');
  }
}

// ====================
// 🛒 ZANDO — AGENTS (COMMISSIONNAIRES)
// ====================

export async function becomeAgent(itemId: string, userId: string): Promise<void> {
  const resp = await client.post<ApiResponse>('/api/zando/agent/become', {
    item_id: itemId,
    user_id: userId,
  });
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur');
  }
}

export async function getItemAgents(itemId: string): Promise<ItemAgent[]> {
  const resp = await client.get<ApiResponse<{ agents: ItemAgent[] }>>(
    `/api/zando/agents/${encodeURIComponent(itemId)}`
  );
  return resp.data.data?.agents || [];
}

export async function recordAgentSale(
  itemId: string,
  agentId: string,
  saleAmountBorb: number
): Promise<{ commission: number }> {
  const resp = await client.post<ApiResponse<{ commission: number }>>(
    '/api/zando/agent/sale',
    { item_id: itemId, agent_id: agentId, sale_amount_borb: saleAmountBorb }
  );
  if (resp.data.status !== 'success' || !resp.data.data) {
    throw new Error(resp.data.message || 'Erreur');
  }
  return resp.data.data;
}

// ====================
// 🛒 ZANDO — INTERACTIONS
// ====================

export async function recordInteraction(
  itemId: string,
  userId: string,
  type: 'view' | 'like' | 'share' | 'comment'
): Promise<void> {
  const resp = await client.post<ApiResponse>(
    `/api/zando/item/${encodeURIComponent(itemId)}/interact`,
    { user_id: userId, type }
  );
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur');
  }
}

export async function getItemInteractions(itemId: string): Promise<ItemInteraction[]> {
  const resp = await client.get<ApiResponse<{ interactions: ItemInteraction[] }>>(
    `/api/zando/item/${encodeURIComponent(itemId)}/interactions`
  );
  return resp.data.data?.interactions || [];
}

// ====================
// 📇 CONTACTS
// ====================

export async function requestContact(
  requesterId: string,
  targetId: string,
  field: 'number' | 'email' | 'phone'
): Promise<string> {
  const resp = await client.post<ApiResponse<{ request_id: string }>>(
    '/api/zando/contacts/request',
    { requester_id: requesterId, target_id: targetId, field }
  );
  if (resp.data.status !== 'success' || !resp.data.data) {
    throw new Error(resp.data.message || 'Erreur');
  }
  return resp.data.data.request_id;
}

export async function acceptContact(requestId: string): Promise<void> {
  const resp = await client.post<ApiResponse>(
    `/api/zando/contacts/${encodeURIComponent(requestId)}/accept`
  );
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur');
  }
}

export async function refuseContact(requestId: string): Promise<void> {
  const resp = await client.post<ApiResponse>(
    `/api/zando/contacts/${encodeURIComponent(requestId)}/refuse`
  );
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur');
  }
}

export async function shareContact(
  ownerId: string,
  sharedWithId: string,
  field: 'number' | 'email' | 'phone'
): Promise<void> {
  const resp = await client.post<ApiResponse>('/api/zando/contacts/share', {
    owner_id: ownerId,
    shared_with_id: sharedWithId,
    field,
  });
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur');
  }
}

export async function getSharedContacts(userId: string): Promise<SharedContact[]> {
  const resp = await client.get<ApiResponse<{ contacts: SharedContact[] }>>(
    `/api/zando/contacts/shared/${encodeURIComponent(userId)}`
  );
  return resp.data.data?.contacts || [];
}

// ====================
// 📝 DRAFTS (BROUILLONS)
// ====================

export async function saveDraft(
  userId: string,
  draftType: 'shop' | 'item' | 'message',
  data: any
): Promise<string> {
  const resp = await client.post<ApiResponse<{ draft_id: string }>>(
    '/api/zando/drafts',
    { user_id: userId, draft_type: draftType, data }
  );
  if (resp.data.status !== 'success' || !resp.data.data) {
    throw new Error(resp.data.message || 'Erreur');
  }
  return resp.data.data.draft_id;
}

export async function getDraft(draftId: string): Promise<Draft | null> {
  const resp = await client.get<ApiResponse<Draft>>(
    `/api/zando/drafts/${encodeURIComponent(draftId)}`
  );
  return resp.data.data || null;
}

export async function deleteDraft(draftId: string): Promise<void> {
  const resp = await client.delete<ApiResponse>(
    `/api/zando/drafts/${encodeURIComponent(draftId)}`
  );
  if (resp.data.status !== 'success') {
    throw new Error(resp.data.message || 'Erreur');
  }
}

// ====================
// 📔 JOURNAL
// ====================

export async function getJournal(accountId: string): Promise<any[]> {
  const resp = await client.get<ApiResponse<{ entries: any[] }>>(
    `/api/journal/export/${encodeURIComponent(accountId)}`
  );
  return resp.data.data?.entries || [];
}

// ====================
// EXPORT GLOBAL
// ====================

export const zandoApi = {
  createItem,
  getShopItems,
  getItemById,
  updateItem,
  deleteItem,
  publishItem,
  becomeAgent,
  getItemAgents,
  recordAgentSale,
  recordInteraction,
  getItemInteractions,
  requestContact,
  acceptContact,
  refuseContact,
  shareContact,
  getSharedContacts,
  saveDraft,
  getDraft,
  deleteDraft,
  getJournal,
};
