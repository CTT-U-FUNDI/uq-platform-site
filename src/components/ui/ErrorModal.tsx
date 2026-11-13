import { Icon } from './Icon';
﻿import React from 'react';

interface ErrorModalProps {
  title?: string;
  message: string;
  hint?: string;
  onRetry?: () => void;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  title = 'Erreur',
  message,
  hint,
  onRetry,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#14141A] border border-[#F6465D]/30 rounded-2xl p-6 uq-animate-shake">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-3"><Icon name="xCircle" size={20} tone="brand" /></div>
          <h3 className="text-lg font-bold text-[#F6465D] mb-1">{title}</h3>
        </div>

        {/* Message */}
        <div className="bg-[#F6465D]/10 border border-[#F6465D]/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-[#EAECEF] text-center">{message}</p>
        </div>

        {/* Hint */}
        {hint && (
          <div className="bg-[#1A1A24] rounded-xl p-3 mb-5">
            <p className="text-xs text-[#8E8E9A] text-center"><Icon name="lightbulb" size={14} tone="warning" /> {hint}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold active:scale-95 transition-all"
            >
              <Icon name="refresh" size={20} /> Réessayer
            </button>
          )}
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-full font-semibold active:scale-95 transition-all ${
              onRetry
                ? 'bg-[#1A1A24] border border-[#2A2A38] text-[#8E8E9A]'
                : 'bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white'
            }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
