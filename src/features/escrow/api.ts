import apiClient from '../../api/client';
export const escrow = {
  buy: (product_id: number) => apiClient.post('/api/escrow/buy', { product_id }),
  myOrders: () => apiClient.get('/api/escrow/my-orders'),
  clients: () => apiClient.get('/api/escrow/clients'),
  select: (id: number, buyer: string) => apiClient.post(`/api/escrow/${id}/select`, { buyer }),
  sell: (id: number) => apiClient.post(`/api/escrow/${id}/sell`),
  chatGet: (id: number) => apiClient.get(`/api/escrow/${id}/chat`),
  chatSend: (id: number, msg: string) => apiClient.post(`/api/escrow/${id}/chat`, { msg }),
  position: (id: number, lat: number, lng: number) => apiClient.post(`/api/escrow/${id}/position`, { lat, lng }),
  confirm: (id: number, code: string) => apiClient.post(`/api/escrow/${id}/confirm`, { code }),
};
