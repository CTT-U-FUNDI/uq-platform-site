// ============================================================
// TREASURY OWNER PANEL - Panneau de contrôle de l'owner
// Affiche Profil 1 (Auto 70%) + Profil 2 (Manuel 30%)
// + Bouton Reclamer + Auto-recharge + Tresor 1M
// ============================================================

import { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { UQ_COLORS, UQ_GRADIENTS } from '../../../theme/colors';
import {
  IconBank, IconCoffre, IconShield, IconMoney,
  IconActions, IconChevron,
} from '../../../components/ui/UQIcons';

interface Profil1 {
  stock_borb: number;
  threshold_recharge_pct: number;
  active: boolean;
}

interface Profil2 {
  balance_borb: number;
  threshold_low_borb: number;
  claim_pct_from_profile1: number;
}

interface Tresor1M {
  solde_borb: number;
  cible_borb: number;
  seuil_recharge_borb: number;
  recharge_necessaire: boolean;
}

interface Props {
  uqNumber: string;
  onClose?: () => void;
}

export function TreasuryOwnerPanel({ uqNumber, onClose }: Props) {
  const [profil1, setProfil1] = useState<Profil1 | null>(null);
  const [profil2, setProfil2] = useState<Profil2 | null>(null);
  const [tresor1m, setTresor1m] = useState<Tresor1M | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [actionEnCours, setActionEnCours] = useState('');
  const [dejaReparti, setDejaReparti] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        apiClient.get('/api/distribution/treasury').catch(() => ({ data: null })),
        apiClient.get('/api/distribution/delis').catch(() => ({ data: null })),
        apiClient.get('/api/treasury/1m/status').catch(() => ({ data: null })),
      ]);

      if (r1.data) {
        setProfil1({
          stock_borb: r1.data.stock_borb ?? r1.data.stats?.stock_borb ?? 0,
          threshold_recharge_pct: r1.data.threshold_recharge_pct ?? 50,
          active: true,
        });
      }
      if (r2.data) {
        setProfil2({
          balance_borb: r2.data.balance_borb ?? r2.data.stats?.balance_borb ?? 0,
          threshold_low_borb: r2.data.threshold_low_borb ?? r2.data.seuil_reclamation ?? 5000,
          claim_pct_from_profile1: r2.data.claim_pct ?? r2.data.stats?.claim_pct_from_profile1 ?? 30,
        });
      }
      if (r3.data?.tresor_1m) {
        setTresor1m({
          solde_borb: r3.data.tresor_1m.solde_borb || 0,
          cible_borb: r3.data.tresor_1m.cible_borb || 1_000_000,
          seuil_recharge_borb: r3.data.tresor_1m.seuil_recharge_borb || 500_000,
          recharge_necessaire: r3.data.tresor_1m.recharge_necessaire || false,
        });
      }
      setErreur('');
      try {
        const r = await apiClient.get('/api/distribution/repartition/status');
        if (r.data?.deja_reparti) setDejaReparti(true);
      } catch {}
    } catch (e: any) {
      setErreur(e.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uqNumber) charger();
  }, [uqNumber]);

  const reclamer30 = async () => {
    setActionEnCours('reclaim');
    setMessage('');
    try {
      const r = await apiClient.post('/api/distribution/recharge', {
        action: 'claim_profile2',
        owner: uqNumber,
      });
      if (r.data.status === 'success') {
        setMessage(`Reclame avec succes : +${r.data.amount_borb || 0} BORB`);
        await charger();
      } else {
        setMessage(r.data.message || 'Erreur reclaim');
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || e.message || 'Erreur');
    } finally {
      setActionEnCours('');
    }
  };

  const repartir = async () => {
    setActionEnCours('repartir');
    setMessage('');
    try {
      const r = await apiClient.post('/api/distribution/repartition', {
        solde_total_borb: 1000000,
      });
      if (r.data.status === 'success') {
        setMessage(`Reparti : Profil 1 = ${r.data.profil1_borb} BORB | Profil 2 = ${r.data.profil2_borb} BORB`);
        setDejaReparti(true);
        await charger();
      } else {
        setMessage(r.data.message || 'Erreur');
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || e.message || 'Erreur');
    } finally {
      setActionEnCours('');
    }
  };

  const rechargerAuto = async (force: boolean = false) => {
    setActionEnCours('recharge');
    setMessage('');
    try {
      const r = await apiClient.post(`/api/treasury/1m/recharge${force ? '?force=true' : ''}`);
      if (r.data.status === 'success') {
        setMessage(r.data.raison || 'Recharge effectuee');
        await charger();
      } else {
        setMessage(r.data.message || 'Erreur recharge');
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || e.message || 'Erreur');
    } finally {
      setActionEnCours('');
    }
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const profil2Faible = profil2 && profil2.balance_borb < profil2.threshold_low_borb;

  if (loading) {
    return (
      <div className="rounded-3xl p-6 bg-[var(--uq-bg-secondary)] border border-[var(--uq-border)]">
        <p className="text-center text-white/60 text-sm">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-6 bg-[var(--uq-bg-secondary)] border border-[var(--uq-border)]">
      <p className="text-center text-white/60 text-sm">
        Panneau owner en cours de refonte...
      </p>
    </div>
  );
}
