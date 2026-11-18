import { useMemo, useState } from 'react';
import { useNotifications } from '../lib/notifications';
import { Icon, type IconName } from './Icon';
import { Button, Chip, EmptyState, Sheet } from './Ui';
import type { ScreenNotification } from '../lib/trading';
import { relativeDay, formatTime } from '../lib/format';

const SCOPES: Record<string, { label: string; icon: IconName }> = {
  kyc: { label: 'Vérification', icon: 'shield' },
  coffre: { label: 'Coffre', icon: 'wallet' },
  zando: { label: 'Zando', icon: 'market' },
  trading: { label: 'Trading', icon: 'trendUp' },
  chat: { label: 'Chat', icon: 'chat' },
};

export function NotificationsSheet({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (scope: string) => void;
}) {
  const notifications = useNotifications();
  const [filtre, setFiltre] = useState<string>('tout');

  // Une catégorie n'est proposée que si le flux en contient vraiment :
  // aucun onglet mort, aucune étiquette inventée.
  const categories = useMemo(() => {
    const vues: string[] = [];
    for (const entry of notifications.items) {
      if (!vues.includes(entry.scope)) vues.push(entry.scope);
    }
    return vues;
  }, [notifications.items]);

  // Une catégorie filtrée peut disparaître entre deux relevés : le filtre
  // retombe sur « Tout » au lieu de laisser une liste vide à l'écran.
  const actif = filtre !== 'tout' && categories.includes(filtre) ? filtre : 'tout';

  const visibles = useMemo(
    () =>
      actif === 'tout'
        ? notifications.items
        : notifications.items.filter((entry) => entry.scope === actif),
    [notifications.items, actif],
  );

  const libelle = (scope: string) => SCOPES[scope]?.label || scope;
  const nonLues = visibles.reduce((total, entry) => (entry.read ? total : total + 1), 0);
  // Les signaux d'état s'acquittent par référence, les événements par identifiant.
  const references = visibles
    .filter((entry) => entry.reference)
    .map((entry) => entry.reference);

  // Le flux arrive déjà ordonné par le backend : tête épinglée, puis un bloc
  // par catégorie. Le rendu suit cet ordre, il n'en réinvente aucun.
  const tete = visibles.filter((entry) => entry.en_cours);
  const groupes = useMemo(() => {
    const blocs: { scope: string; entries: ScreenNotification[] }[] = [];
    for (const entry of visibles) {
      if (entry.en_cours) continue;
      const courant = blocs[blocs.length - 1];
      if (courant && courant.scope === entry.scope) courant.entries.push(entry);
      else blocs.push({ scope: entry.scope, entries: [entry] });
    }
    return blocs;
  }, [visibles]);

  const ligne = (entry: ScreenNotification) => {
    const scope = SCOPES[entry.scope] || { label: entry.scope, icon: 'info' as IconName };
    // Les événements stockés portent leur heure ; les signaux d'état
    // n'ont pas d'instant, ils décrivent la situation actuelle.
    const horodatage =
      entry.id > 0
        ? `${relativeDay(entry.created_at)} · ${formatTime(entry.created_at)}`
        : 'Signal actuel';
    return (
      <button
        key={`${entry.scope}-${entry.id}-${entry.reference}`}
        className="v2-row"
        onClick={() => {
          notifications.markRead(
            entry.id > 0 ? { ids: [entry.id] } : { references: [entry.reference] },
          );
          onNavigate(entry.scope);
        }}
        style={{ opacity: entry.read ? 0.6 : 1 }}
      >
        <span className="v2-badge" style={{ gap: 4 }}>
          <Icon name={scope.icon} size={14} /> {scope.label}
        </span>
        <div className="v2-row-main">
          <div className="v2-row-title">{entry.title}</div>
          <div className="v2-row-sub">{entry.body}</div>
        </div>
        <span className="v2-row-stamp">{horodatage}</span>
        {!entry.read && <span className="v2-dot" />}
      </button>
    );
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Notifications"
      subtitle={
        actif === 'tout'
          ? `${notifications.total} non lue(s)${
              notifications.totalEnCours ? ` · ${notifications.totalEnCours} en cours` : ''
            }`
          : `${libelle(actif)} · ${nonLues} non lue(s)`
      }
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            block
            icon="bell"
            onClick={notifications.toggleSound}
          >
            {notifications.soundEnabled ? 'Son activé' : 'Son coupé'}
          </Button>
          <Button
            block
            icon="check"
            onClick={() =>
              notifications.markRead(
                actif === 'tout'
                  ? { all: true, references }
                  : { scope: actif, references },
              )
            }
          >
            {actif === 'tout' ? 'Tout lire' : `Tout lire · ${libelle(actif)}`}
          </Button>
        </div>
      }
    >
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip active={actif === 'tout'} onClick={() => setFiltre('tout')}>
            Tout
            {notifications.total > 0 && (
              <span className="v2-chip-count">
                {notifications.total > 9 ? '9+' : notifications.total}
              </span>
            )}
          </Chip>
          {categories.map((scope) => {
            const reste = notifications.counts[scope] || 0;
            return (
              <Chip key={scope} active={actif === scope} onClick={() => setFiltre(scope)}>
                <Icon name={SCOPES[scope]?.icon || ('info' as IconName)} size={14} />
                {libelle(scope)}
                {reste > 0 && (
                  <span className="v2-chip-count">{reste > 9 ? '9+' : reste}</span>
                )}
              </Chip>
            );
          })}
        </div>
      )}

      {notifications.items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Aucune notification"
          description="Aucune alerte active."
        />
      ) : (
        <>
          {tete.length > 0 && (
            <div className="v2-notif-pinned">
              <div className="v2-notif-group">
                <Icon name="clock" size={13} /> En cours
                <span className="v2-notif-count">{tete.length}</span>
              </div>
              <div className="v2-list">{tete.map(ligne)}</div>
            </div>
          )}
          {groupes.map((groupe) => {
            const reste = groupe.entries.reduce(
              (total, entry) => (entry.read ? total : total + 1),
              0,
            );
            return (
              <div key={groupe.scope}>
                {actif === 'tout' && (
                  <div className="v2-notif-group">
                    <Icon
                      name={SCOPES[groupe.scope]?.icon || ('info' as IconName)}
                      size={13}
                    />
                    {libelle(groupe.scope)}
                    {reste > 0 && <span className="v2-notif-count">{reste}</span>}
                  </div>
                )}
                <div className="v2-list">{groupe.entries.map(ligne)}</div>
              </div>
            );
          })}
        </>
      )}
    </Sheet>
  );
}

/* ============================ Ecran ============================ */
