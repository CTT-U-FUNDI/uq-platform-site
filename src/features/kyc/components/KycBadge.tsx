// KycBadge — Badge 3 états (rouge/jaune/vert)
import React from 'react';

export type KycStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';

interface KycBadgeProps {
  status: KycStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const LABELS: Record<KycStatus, string> = {
  not_verified: 'Non vérifié',
  pending: 'En cours',
  verified: 'Vérifié',
  rejected: 'Refusé',
};

const ICONS: Record<KycStatus, string> = {
  not_verified: '🔴',
  pending: '🟡',
  verified: '✅',
  rejected: '❌',
};

export function KycBadge({ status, size = 'md', showDot = true }: KycBadgeProps) {
  const sizeStyles = {
    sm: { fontSize: 11, padding: '4px 10px' },
    md: { fontSize: 13, padding: '6px 14px' },
    lg: { fontSize: 15, padding: '8px 18px' },
  }[size];

  return (
    <span
      className="kyc-badge"
      data-status={status}
      style={sizeStyles}
    >
      {showDot && <span className="kyc-badge-dot" />}
      <span>{LABELS[status]}</span>
    </span>
  );
}

export default KycBadge;
