import React from 'react';

export type VerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<VerificationStatus, {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  not_verified: {
    icon: '❌',
    label: 'Non vérifié',
    color: '#848E9C',
    bgColor: 'rgba(132, 142, 156, 0.15)',
    borderColor: 'rgba(132, 142, 156, 0.3)',
  },
  pending: {
    icon: '⏳',
    label: 'En attente',
    color: '#FCD535',
    bgColor: 'rgba(252, 213, 53, 0.15)',
    borderColor: 'rgba(252, 213, 53, 0.3)',
  },
  verified: {
    icon: '✅',
    label: 'Vérifié',
    color: '#0ECB81',
    bgColor: 'rgba(14, 203, 129, 0.15)',
    borderColor: 'rgba(14, 203, 129, 0.3)',
  },
  rejected: {
    icon: '🚫',
    label: 'Refusé',
    color: '#F6465D',
    bgColor: 'rgba(246, 70, 93, 0.15)',
    borderColor: 'rgba(246, 70, 93, 0.3)',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        color: config.color,
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

export default StatusBadge;
