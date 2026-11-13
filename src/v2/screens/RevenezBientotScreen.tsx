// ============================================================================
// RevenezBientotScreen — page officielle UQ Platform « revenez bientôt »
// ============================================================================
//
// Page de continuation post-création : un compte UQ fraîchement créé via
// BORB ou UQZ est redirigé ici pour la vérification. Pour l'instant elle
// affiche uniquement l'écran « revenez bientôt » — la suite (KYC/UQZ)
// sera branchée ici sans changer l'URL.
//
// Deep link : https://uqplatform.com/?ecran=verification

import { LogoUQ } from '../../components/ui/LogoUQ';
import { Icon } from '../components/Icon';

export function RevenezBientotScreen({ onBack }: { onBack?: () => void }) {
  return (
    <div className="v2-screen">
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '32px 24px',
          gap: 18,
        }}
      >
        <LogoUQ size={88} />

        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(110,168,255,.12)',
            border: '1px solid rgba(110,168,255,.3)',
          }}
        >
          <Icon name="clock" size={30} />
        </div>

        <div>
          <div className="v2-h2" style={{ fontSize: 22, fontWeight: 800 }}>
            Compte créé avec succès
          </div>
          <div className="v2-muted" style={{ fontSize: 14, marginTop: 10, lineHeight: 1.6, maxWidth: 320 }}>
            Votre compte UQ est en cours de vérification.
            <br />
            Revenez bientôt pour continuer.
          </div>
        </div>

        <div
          className="v2-muted"
          style={{
            fontSize: 12,
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.04)',
            maxWidth: 320,
            lineHeight: 1.55,
          }}
        >
          La vérification de votre compte se poursuit sur UQZ.
          Revenez ici dès qu'elle est terminée pour accéder à toutes les
          fonctionnalités UQ — wallet BORB inclus.
        </div>

        {onBack && (
          <button
            type="button"
            className="v2-btn v2-btn--ghost"
            onClick={onBack}
            style={{ marginTop: 8 }}
          >
            Retour à la connexion
          </button>
        )}
      </div>
    </div>
  );
}
