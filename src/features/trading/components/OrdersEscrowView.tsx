interface Props {
  mode: 'orders' | 'escrow';
}

export function OrdersEscrowView({ mode }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold mb-4">
        {mode === 'escrow' ? 'Escrows actifs' : 'Mes ordres P2P'}
      </h2>
      <div className="uq-card text-center py-10">
        <p role="status" className="text-[var(--uq-text-secondary)] text-sm">
          {mode === 'escrow'
            ? 'Le service escrow n’est pas encore disponible. Aucun escrow actif ne peut être affiché.'
            : 'Le carnet d’ordres P2P n’est pas encore disponible. Aucun ordre réel ne peut être affiché.'}
        </p>
      </div>
    </div>
  );
}
