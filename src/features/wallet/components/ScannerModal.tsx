// ============================================================
// SCANNER MODAL - Scan QR UQ PAY
// Lit le QR, verifie le compte, puis remplit le SendModal
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../../../api/client';
import { UQ_COLORS } from '../../../theme/colors';
import { IconClose } from '../../../components/ui/UQIcons';
import { Icon } from '../../../components/ui/Icon';

interface Props {
  show: boolean;
  onClose: () => void;
  onScan: (pseudo: string, name: string) => void;
}

type Statut = 'init' | 'scan' | 'verif' | 'ok' | 'erreur';

export function ScannerModal({ show, onClose, onScan }: Props) {
  const [statut, setStatut] = useState<Statut>('init');
  const [erreur, setErreur] = useState('');
  const [pseudoTrouve, setPseudoTrouve] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!show) return;
    let mounted = true;

    const startScanner = async () => {
      try {
        setErreur('');
        setStatut('scan');

        const scanner = new Html5Qrcode('uq-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (isProcessingRef.current) return;
            if (!mounted) return;

            // Parse JSON
            let pseudo = '';
            let name = '';
            try {
              const data = JSON.parse(decodedText);
              pseudo = data.pseudo || '';
              name = data.name || '';
            } catch {
              setErreur('QR non reconnu - scanner un QR UQ PAY');
              return;
            }

            if (!pseudo) {
              setErreur('QR invalide : pas de pseudo');
              return;
            }

            isProcessingRef.current = true;
            setPseudoTrouve(pseudo);
            setStatut('verif');

            // Verification backend
            try {
              const r = await apiClient.get(
                `/api/account/public/${encodeURIComponent(pseudo.replace('@', '_'))}`
              );
              if (r.data?.status === 'success' && r.data?.existe) {
                setStatut('ok');
                // Arreter le scanner
                await scanner.stop().catch(() => {});
                scanner.clear();
                if (mounted) {
                  onScan(r.data.pseudo || pseudo, r.data.name || name);
                  onClose();
                }
              } else {
                setErreur(r.data?.message || 'Compte introuvable');
                setStatut('erreur');
              }
            } catch (e: any) {
              setErreur(e.response?.data?.message || 'Verification impossible');
              setStatut('erreur');
            }
          },
          () => {
            // Callback erreur detection (silencieux)
          }
        );
      } catch (e: any) {
        setErreur(e.message || 'Impossible d ouvrir la camera');
        setStatut('erreur');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4 uq-animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-3xl w-full max-w-md overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(26,10,21,0.98) 0%, rgba(10,21,48,0.98) 100%)',
          border: '1px solid rgba(230,57,70,0.4)',
          boxShadow: '0 0 60px rgba(47,107,255,0.24), 0 0 120px rgba(22,139,255,0.18)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E63946]/30">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span><Icon name="camera" size={20} /></span>
            Scanner pour payer
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all active:scale-90"
          >
            <IconClose size={18} color="#FFF" />
          </button>
        </div>

        {/* Zone camera */}
        <div className="relative p-5">
          <div
            id="uq-qr-reader"
            className="w-full rounded-2xl overflow-hidden"
            style={{
              background: '#000',
              minHeight: '320px',
              boxShadow: '0 0 40px rgba(230,57,70,0.3)',
              border: '2px solid rgba(230,57,70,0.4)',
            }}
          />

          {/* Viseur */}
          {(statut === 'scan') && (
            <div className="absolute inset-5 pointer-events-none flex items-center justify-center">
              <div
                style={{
                  width: '250px',
                  height: '250px',
                  border: '3px solid rgba(230,57,70,0.8)',
                  borderRadius: '16px',
                  boxShadow: '0 0 30px rgba(47,107,255,0.45), inset 0 0 30px rgba(22,139,255,0.28)',
                  animation: 'pulseScan 2s ease-in-out infinite',
                }}
              />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="px-5 pb-5">
          {statut === 'init' && (
            <div className="p-3 rounded-xl text-xs bg-white/5 border border-white/10 text-white/60 text-center">
              Initialisation...
            </div>
          )}

          {statut === 'scan' && (
            <div className="p-3 rounded-xl text-xs bg-[#0ECB81]/10 border border-[#0ECB81]/30 text-[#0ECB81] text-center">
              <div className="font-bold mb-1"><Icon name="camera" size={20} /> Camera active</div>
              <div className="text-white/60">Placez le QR UQ PAY dans le cadre</div>
            </div>
          )}

          {statut === 'verif' && (
            <div className="p-3 rounded-xl text-xs bg-[#2E86DE]/15 border border-[#2E86DE]/40 text-[#2E86DE] text-center">
              <div className="font-bold mb-1"><Icon name="search" size={20} /> Verification en cours</div>
              <div className="text-white/70">{pseudoTrouve}</div>
            </div>
          )}

          {statut === 'ok' && (
            <div className="p-3 rounded-xl text-xs bg-[#0ECB81]/15 border border-[#0ECB81]/40 text-[#0ECB81] text-center">
              <div className="font-bold"><Icon name="checkCircle" size={20} tone="success" /> Compte verifie</div>
            </div>
          )}

          {statut === 'erreur' && (
            <div className="p-3 rounded-xl text-xs bg-[#F6465D]/15 border border-[#F6465D]/40 text-[#F6465D]">
              {erreur}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 text-[10px] text-white/40 leading-relaxed text-center">
            Le QR contient uniquement le pseudo et le nom public.
            <br />
            Aucune donnee sensible n&apos;y figure.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseScan {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}