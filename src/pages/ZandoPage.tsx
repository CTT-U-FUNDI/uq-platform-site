import { useState } from 'react';
import axios from 'axios';
import ZandoIcon from '@/components/ZandoIcon';
import apiClient from '@/api/client';
import { PublicUserIdentity } from '../components/ui/PublicUserIdentity';
import { Icon } from '../components/ui/Icon';

interface ZandoPageProps {
  onBack?: () => void;
}

export default function ZandoPage({ onBack }: ZandoPageProps) {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [priceBorb, setPriceBorb] = useState('0');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const uqNumber = localStorage.getItem('uq_number') || '';

  const handleCreate = async () => {
    const normalizedTitle = itemName.trim();
    const normalizedPrice = Number(priceBorb);
    if (!normalizedTitle || !Number.isSafeInteger(normalizedPrice) || normalizedPrice <= 0) {
      setMessage('Ajoutez un titre et un prix entier positif en BORB.');
      return;
    }

    setLoading(true);
    try {
      const resp = await apiClient.post('/api/zando/item/create', {
        type: 'text',
        title: normalizedTitle,
        description,
        price_borb: normalizedPrice,
        price_usd: 0,
        media_urls: '[]',
        category,
        commission_enabled: false,
        commission_rate: 0,
      });
      const data = resp.data;
      if (data.status !== 'success' || !data.item_id) {
        throw new Error(data.message || 'Le serveur n’a pas confirmé la création.');
      }

      const publishResponse = await apiClient.post(
        `/api/zando/item/${encodeURIComponent(data.item_id)}/publish`,
      );
      if (publishResponse.data?.status !== 'success') {
        throw new Error(`L’offre ${data.item_id} est enregistrée, mais sa publication a échoué.`);
      }
      setMessage('Offre publiée dans Zando.');
      setTimeout(() => onBack?.(), 1200);
    } catch (error) {
      const responseMessage = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      setMessage(responseMessage || (error instanceof Error ? error.message : 'La publication a échoué.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <button onClick={onBack} className="text-2xl"><Icon name="arrowLeft" size={24} /></button>
        <ZandoIcon size={32} />
        <h1 className="text-2xl font-bold">ZANDO</h1>
        <span className="text-sm text-gray-400">Créer une offre</span>
        {uqNumber && <PublicUserIdentity userId={uqNumber} size="sm" compact className="ml-auto" />}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-400">Nom de l'offre</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Ex: Réparation moto"
            className="w-full mt-2 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris ton service..."
            rows={4}
            className="w-full mt-2 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-400">Prix (BORB)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={priceBorb}
              onChange={(e) => setPriceBorb(e.target.value)}
              className="w-full mt-2 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-2 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
            >
              <option value="general">Général</option>
              <option value="mecanique">Mécanique</option>
              <option value="alimentation">Alimentation</option>
              <option value="art">Art</option>
              <option value="service">Service</option>
            </select>
          </div>
        </div>

        {message && <p className="text-center">{message}</p>}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-lg disabled:opacity-50"
        >
          {loading ? 'Publication…' : '🟣 PUBLIER DANS ZANDO'}
        </button>
      </div>
    </div>
  );
}
