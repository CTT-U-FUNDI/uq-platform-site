import { useState } from 'react';
import { Icon } from './Icon';
import { Button, IconTile, Sheet } from './Ui';
import { GUIDES, guideOf, type GuideTopic } from '../lib/guides';

/**
 * Page d'aide : le texte détaillé est ici, jamais dans le flux principal.
 * `topic = null` affiche le sommaire des guides.
 */
export function HelpSheet({
  topic,
  onClose,
}: {
  topic: GuideTopic | null;
  onClose: () => void;
}) {
  const [active, setActive] = useState<GuideTopic | null>(topic);
  const guide = guideOf(active);

  return (
    <Sheet
      open
      onClose={onClose}
      title={guide ? guide.title : 'Guide UQ'}
      subtitle={guide ? guide.tagline : 'Choisis un sujet'}
      footer={
        guide ? (
          <Button block variant="secondary" icon="back" onClick={() => setActive(null)}>
            Tous les guides
          </Button>
        ) : (
          <Button block onClick={onClose}>
            Fermer
          </Button>
        )
      }
    >
      {guide ? (
        <div className="v2-guide">
          <div className="v2-guide-hero">
            <span className="v2-guide-glyph" aria-hidden="true">
              <Icon name={guide.icon} size={78} />
            </span>
            <IconTile name={guide.icon} tone="accent" size={52} />
            <div style={{ minWidth: 0 }}>
              <div className="v2-guide-title">{guide.title}</div>
              <div className="v2-guide-tagline">{guide.tagline}</div>
            </div>
          </div>

          <ol className="v2-guide-steps">
            {guide.steps.map((step, index) => (
              <li key={step.title} className="v2-guide-step">
                <span className="v2-guide-num">{index + 1}</span>
                <span className="v2-guide-step-icon">
                  <Icon name={step.icon} size={17} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="v2-guide-step-title">{step.title}</div>
                  <div className="v2-guide-step-text">{step.text}</div>
                </div>
              </li>
            ))}
          </ol>

          {guide.note && (
            <div className="v2-guide-note">
              <Icon name="alert" size={16} />
              <span>{guide.note}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="v2-guide-index">
          {GUIDES.map((entry) => (
            <button
              key={entry.topic}
              type="button"
              className="v2-guide-card"
              onClick={() => setActive(entry.topic)}
            >
              <IconTile name={entry.icon} tone="accent" size={40} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="v2-guide-card-title">{entry.title}</span>
                <span className="v2-guide-card-sub">{entry.tagline}</span>
              </span>
              <span className="v2-guide-count">{entry.steps.length}</span>
              <Icon name="forward" size={16} />
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
