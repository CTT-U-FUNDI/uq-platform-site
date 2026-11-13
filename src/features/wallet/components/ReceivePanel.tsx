// ============================================================
// RECEIVE PANEL - Section Recevoir (ASCII pur)
// QR genere par le backend : GET /api/account/{uq}/qr.png
// ============================================================

import { useState, useEffect } from 'react';
import apiClient, { apiUrl } from '../../../api/client';
import { UQ_COLORS, UQ_GRADIENTS } from '../../../theme/colors';
import {
  IconReceive, IconCopy, IconCheck, IconArrowDown
} from '../../../components/ui/UQIcons';

interface IdentitePublique {
  pseudo: string;
  name: string;
  display: string;
}

interface Props {
  uqNumber: string;
}

export function ReceivePanel({ uqNumber }: Props) {
  const [identite, setIdentite] = useState<IdentitePublique | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [erreur, setErreur] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!uqNumber) return;
    setErreur('');

    // Charger l identite publique (pseudo + nom, jamais le UQ)
    apiClient
      .get(`/api/account/${encodeURIComponent(uqNumber)}/public`)
      .then((r) => setIdentite(r.data))
      .catch(() => {
        setIdentite(null);
        setErreur('Identite publique indisponible. Reessayez plus tard.');
      });

    // URL du QR (avec cache buster)
    setQrUrl(apiUrl(`/api/account/${encodeURIComponent(uqNumber)}/qr.png?t=${Date.now()}`));
  }, [uqNumber]);

  const copierPseudo = async () => {
    const texte = identite?.display || identite?.pseudo || '';
    if (!texte) return;
    try {
      await navigator.clipboard.writeText(texte);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErreur('Copie impossible');
    }
  };

  const telechargerQr = async () => {
    if (!qrUrl) return;

    // 1. Charger le QR depuis le backend
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('QR indisponible'));
      img.src = qrUrl;
    });

    // 2. Creer un canvas 400 x 520
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 3. Fond degrade rouge/bleu UQ
    const grad = ctx.createLinearGradient(0, 0, 400, 520);
    grad.addColorStop(0, '#1a0a15');
    grad.addColorStop(0.5, '#0f0f18');
    grad.addColorStop(1, '#0a1525');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 520);

    // 4. Bordure neon rouge/bleu
    const borderGrad = ctx.createLinearGradient(0, 0, 400, 520);
    borderGrad.addColorStop(0, '#E63946');
    borderGrad.addColorStop(1, '#2E86DE');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 384, 504);

    // 5. Titre "UQ PAY"
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('UQ PAY', 200, 60);

    // 6. Sous-titre "PLATFORM"
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('P L A T F O R M', 200, 82);

    // 7. Nom + Prenom du proprietaire
    const nomComplet = (identite?.display || identite?.pseudo || '').toUpperCase();
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(nomComplet, 200, 118);

    // 8. Ligne decorative
    const lineGrad = ctx.createLinearGradient(100, 0, 300, 0);
    lineGrad.addColorStop(0, 'rgba(230,57,70,0)');
    lineGrad.addColorStop(0.5, 'rgba(230,57,70,0.8)');
    lineGrad.addColorStop(1, 'rgba(47,107,255,0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 132);
    ctx.lineTo(300, 132);
    ctx.stroke();

    // 9. Fond blanc arrondi derriere le QR
    const qrSize = 220;
    const qrX = (400 - qrSize) / 2;
    const qrY = 150;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    const radius = 16;
    ctx.moveTo(qrX + radius, qrY);
    ctx.lineTo(qrX + qrSize - radius, qrY);
    ctx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + radius);
    ctx.lineTo(qrX + qrSize, qrY + qrSize - radius);
    ctx.quadraticCurveTo(qrX + qrSize, qrY + qrSize, qrX + qrSize - radius, qrY + qrSize);
    ctx.lineTo(qrX + radius, qrY + qrSize);
    ctx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - radius);
    ctx.lineTo(qrX, qrY + radius);
    ctx.quadraticCurveTo(qrX, qrY, qrX + radius, qrY);
    ctx.closePath();
    ctx.fill();

    // 10. QR au centre
    ctx.drawImage(img, qrX + 10, qrY + 10, qrSize - 20, qrSize - 20);

    // 11. Prenom du proprietaire pour le message
    const prenom = nomComplet.split(' ')[0] || nomComplet;

    // 12. Message "Scanner pour payer"
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(`Scanner pour payer ${prenom}`, 200, 410);

    // 13. Ligne "sur UQ Platform"
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('sur UQ Platform', 200, 432);

    // 14. Message securite
    ctx.fillStyle = 'rgba(14,203,129,0.9)';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('Paiement securise - Technologie BlockOrb', 200, 458);

    // 15. Pied de page
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('UQ PAY - Aucune donnee sensible dans ce QR', 200, 485);

    // 16. Telecharger
    const link = document.createElement('a');
    const pseudo = (identite?.pseudo || 'user').replace('@', '').replace(/\s+/g, '-');
    link.download = `uq-pay-${pseudo}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4 uq-animate-fade-in">
      {/* Titre */}
      <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(14,203,129,0.5)]">
        <IconReceive size={22} color={UQ_COLORS.green} />
        Recevoir une devise
      </h2>

      {/* Conteneur principal avec glow vert */}
      <div
        className="rounded-3xl p-6 border border-[#0ECB81]/30 flex flex-col items-center gap-5"
        style={{
          background: 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(7,11,31,0.96) 100%)',
          boxShadow: '0 0 50px rgba(14,203,129,0.15), inset 0 0 40px rgba(14,203,129,0.03)',
        }}
      >
        {/* Identite publique */}
        <div className="text-center">
          <p className="text-base font-black text-white">
            {identite?.display || identite?.pseudo || 'Chargement...'}
          </p>
          <p className="text-xs text-white/55 mt-1 leading-relaxed max-w-xs">
            Partage ce QR pour recevoir un paiement. L’expéditeur choisit la devise virtuelle envoyée ; aucune donnée sensible ne figure dans le QR.
          </p>
        </div>

        {/* QR code avec glow rouge + bleu + vert */}
        <div
          className="bg-white rounded-2xl p-4 transition-all hover:scale-[1.02]"
          style={{
            boxShadow: '0 0 40px rgba(47,107,255,0.3), 0 0 80px rgba(22,139,255,0.24), 0 0 120px rgba(74,222,128,0.12)',
            border: '1px solid rgba(230,57,70,0.2)',
          }}
        >
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR de reception"
              width={180}
              height={180}
              className="w-[180px] h-[180px] block rounded-lg"
              onError={() => setErreur('QR indisponible')}
            />
          ) : (
            <div className="w-[180px] h-[180px] flex items-center justify-center text-black/40 text-sm">
              Generation...
            </div>
          )}
        </div>

        {/* Boutons d action */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* Bouton Copier pseudo - glow rouge */}
          <button
            onClick={copierPseudo}
            className="py-3.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-[0_0_40px_rgba(230,57,70,0.6)]"
            style={{
              background: UQ_GRADIENTS.main,
              backgroundSize: '200% 200%',
              boxShadow: '0 0 25px rgba(230,57,70,0.4)',
            }}
          >
            {copied ? <IconCheck size={14} color="#FFF" /> : <IconCopy size={14} color="#FFF" />}
            {copied ? 'Copie' : 'Copier mon pseudo'}
          </button>

          {/* Bouton Telecharger - glow bleu */}
          <button
            onClick={telechargerQr}
            className="py-3.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-[0_0_40px_rgba(47,107,255,0.6)]"
            style={{
              background: 'rgba(47,107,255,0.15)',
              border: '1px solid rgba(47,107,255,0.45)',
              boxShadow: '0 0 25px rgba(47,107,255,0.3)',
            }}
          >
            <IconArrowDown size={14} color={UQ_COLORS.blue} />
            Telecharger le QR
          </button>
        </div>

        {/* Message d erreur */}
        {erreur && (
          <div className="w-full p-3 rounded-xl text-xs bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30">
            {erreur}
          </div>
        )}
      </div>

      {/* Note bas de page */}
      <p className="text-[11px] text-white/45 px-1 leading-relaxed">
        Le QR contient uniquement ton pseudo et ton nom public. Pour etre paye,
        la personne saisit ton pseudo dans Envoyer - ton numero UQ reste prive.
      </p>
    </div>
  );
}