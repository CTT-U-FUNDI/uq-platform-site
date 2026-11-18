import apiClient from '../../api/client';
export const escrowGet = (id: number) => apiClient.get(`/api/escrow/${id}`);
