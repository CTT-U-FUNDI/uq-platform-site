import { useEffect, useRef, useState } from 'react';
import './styles/v2.css';
import { Icon, type IconName } from './components/Icon';
import { Loader, ToastHost } from './components/Ui';
import { VideoFeed } from './components/VideoFeed';
import { BoutiqueSite } from './components/BoutiqueSite';
import { ConnexionBoutique } from './components/ConnexionBoutique';
import { CartSheet } from './components/CartSheet';
import { ZandoItemSheet } from './components/ZandoItemSheet';
import { SessionProvider, useSession } from './lib/session';
import { NotificationsProvider, useNotifications } from './lib/notifications';
import { HelpHost, HelpProvider } from './lib/help';
import { getZandoItem, BOUTIQUE_SYSTEME_ID, type ZandoItem } from './lib/api';
import { parseMediaUrls } from './lib/format';
import { useLearningSync } from './lib/learning';
import { AuthScreen } from './screens/AuthScreen';
import { LandingScreen } from './screens/LandingScreen';
import { CreateAccountScreen } from './screens/CreateAccountScreen';
import { FeedScreen } from './screens/FeedScreen';
import { MarketScreen } from './screens/MarketScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TradingScreen } from './screens/TradingScreen';
import { StudioScreen } from './screens/StudioScreen';
import { SoloSaleFlow, type SoloDraft } from './components/SoloSaleFlow';
import { SiteEditor } from './components/SiteEditor';
import { PlayerScreen } from './screens/PlayerScreen';
import { KycScreen } from './screens/KycScreen';
import { OwnerVaultScreen } from './screens/OwnerVaultScreen';
import { ProfileAnalyticsScreen } from './screens/ProfileAnalyticsScreen';
import { PolitiquesScreen } from './screens/PolitiquesScreen';
import { PublicPages } from './screens/PublicPages';
import { RevenezBientotScreen } from './screens/RevenezBientotScreen';
import { MailScreen } from './screens/MailScreen';
import { SmsScreen } from './screens/SmsScreen';

/** Un « monde » de l'app : le flux Zando est la racine, les autres onglets s'y ajoutent. */
type Tab = 'feed' | 'wallet' | 'trading' | 'chat' | 'profile';
type Overlay = 'market' | 'studio' | 'player' | 'kyc' | 'owner' | 'analytics' | 'politiques' | 'mail' | 'sms' | null;

/** Chaque onglet surveille son propre compteur de notifications. */
const TAB_SCOPES: Record<Tab, string> = {
  feed: 'zando',
  wallet: 'coffre',
  trading: 'trading',
  chat: 'chat',
  profile: 'kyc',
};

function TabBadge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="v2-tab-badge">{count > 9 ? '9+' : count}</span>;
}

const NAV: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'wallet', label: 'Coffre', icon: 'wallet' },
  { id: 'trading', label: 'Trading', icon: 'trendUp' },
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'profile', label: 'Profil', icon: 'user' },
];

const OVERLAY_TITLES: Record<Exclude<Overlay, null>, string> = {
  market: 'Marché Zando',
  studio: 'Studio Zando',
  player: 'Lecteur UQ',
  kyc: 'Vérification',
  owner: 'Coffre propriétaire',
  analytics: 'Tableau analytique',
  politiques: 'Politiques & règles',
  mail: 'UQ Mail',
  sms: 'UQ SMS',
};

function Shell() {
  const { ready, authenticated, uq, theme, fontScale, isGuardian } = useSession();
  const notifications = useNotifications();
  useLearningSync(authenticated ? uq : '');

  const [tab, setTab] = useState<Tab>('feed');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [creating, setCreating] = useState(
    () => new URLSearchParams(window.location.search).get('ecran') === 'creation',
  );
  /** Deep link ?ecran=verification|politiques — pages publiques officielles. */
  const [ecranDemande, setEcranDemande] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('ecran'),
  );
  /** Deep link ?sujet=<slug> pour ouvrir une politique précise. */
  const [sujetInitial] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('sujet'),
  );
  /** Identifiants UQ remis a l'ecran de connexion apres une creation reussie. */
  const [prefill, setPrefill] = useState<{ number: string; email: string } | null>(null);
  /** Page d'accueil « rencontre » : false = landing vitrine, true = connexion. */
  const [montreAuth, setMontreAuth] = useState(false);
  const [activeItem, setActiveItem] = useState<ZandoItem | null>(null);
  /** Contenu preselectionne pour le lecteur (bouton « Lire » de la fiche). */
  const [playItem, setPlayItem] = useState<ZandoItem | null>(null);
  const [chatPeer, setChatPeer] = useState<string | null>(null);
  /** Element Zando lie a la discussion ouverte depuis le flux (« Clients »). */
  const [chatItem, setChatItem] = useState<ZandoItem | null>(null);
  // Le proprietaire (JWT guardian) ouvre le coffre proprietaire en premier.
  const [walletView, setWalletView] = useState<'auto' | 'personal'>('auto');
  /** Flux vidéo immersif : activé par le lien profond ?feed=video. */
  const [videoFeed, setVideoFeed] = useState(false);
  /** Panier local et mini-site ouvert par « Découvrir ». */
  const [cartOpen, setCartOpen] = useState(false);
  const [boutique, setBoutique] = useState<string | null>(null);
  /**
   * Mini-site ouvert par son identifiant plutôt que par son vendeur : c'est le
   * cas de la boutique système, annexée au compte owner, qu'on ne veut pas
   * confondre avec une boutique commerciale de ce même compte.
   */
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);
  /**
   * Écran du Studio affiché à l'ouverture : l'accueil (publier), la boutique
   * (créer un mini-site) ou la vente de connexion.
   */
  const [studioMode, setStudioMode] = useState<'home' | 'shop' | 'connect'>('home');

  const bodyRef = useRef<HTMLDivElement>(null);
  /** Appuis successifs sur « + » : 1 = flux, 2 = publier, 3 = boutique. */
  const plusTaps = useRef(0);
  const [soloSaleOpen, setSoloSaleOpen] = useState(false);
  const [soloSaleInitial, setSoloSaleInitial] = useState<SoloDraft | null>(null);
  const [soloSaleItemId, setSoloSaleItemId] = useState<string | null>(null);
  const [siteEditorOpen, setSiteEditorOpen] = useState(false);
  const plusTimer = useRef<number | null>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [tab, overlay, creating]);

  useEffect(() => {
    document.title = overlay ? `${OVERLAY_TITLES[overlay]} · UQ` : 'UQ · Plateforme';
  }, [overlay]);

  // Lien profond ?item=<id> : ouvre directement la fiche d'une offre.
  useEffect(() => {
    if (!authenticated) return;
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('item');
    if (!itemId) return;
    getZandoItem(itemId)
      .then((response) => {
        if (response?.item) setActiveItem(response.item);
      })
      .catch(() => undefined)
      .finally(() => {
        params.delete('item');
        const query = params.toString();
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
        );
      });
  }, [authenticated]);

  // Lien profond ?feed=video : affiche le flux vidéo à la place du flux Zando.
  useEffect(() => {
    if (!authenticated) return;
    const feed = new URLSearchParams(window.location.search).get('feed');
    if (feed !== 'video') return;
    setVideoFeed(true);
    setTab('feed');
  }, [authenticated]);

  const goTab = (target: Tab) => {
    setOverlay(null);
    setWalletView('auto');
    // Re-toucher l'onglet actif ramene au flux, comme sur une app de contenu.
    setTab(tab === target && target !== 'feed' ? 'feed' : target);
  };

  const messageSeller = (peer: string, item?: ZandoItem) => {
    setActiveItem(null);
    setChatPeer(peer);
    setChatItem(item || null);
    setOverlay(null);
    setTab('chat');
  };

  const playContent = (item: ZandoItem) => {
    setActiveItem(null);
    setPlayItem(item);
    setOverlay('player');
  };

  /** Le mini-site s'ouvre par-dessus l'écran courant, fiche d'offre fermée. */
  const ouvrirBoutique = (seller: string, shopId?: string) => {
    setActiveItem(null);
    setCartOpen(false);
    setBoutiqueId(shopId || null);
    setBoutique(seller);
  };

  /** La boutique système s'ouvre par son identifiant, pas par un vendeur. */
  const ouvrirBoutiqueSysteme = () => ouvrirBoutique('', BOUTIQUE_SYSTEME_ID);

  /** Le Studio s'ouvre sur un mode précis quand une autre page y renvoie l'utilisateur. */
  const ouvrirStudio = (mode: 'home' | 'shop' | 'connect' = 'home') => {
    setStudioMode(mode);
    setOverlay('studio');
  };

  /**
   * Le bouton « + » écoute les appuis rapprochés :
   * - 1 appui  : retour au flux d'actualité, remis en haut ;
   * - 2 appuis : Studio de publication (vente solo / produit 48 h) ;
   * - 3 appuis : création de la boutique et de son mini-site.
   *
   * Le délai court (280 ms) n'est là que pour distinguer les appuis : rien
   * d'autre n'est demandé à l'utilisateur.
   */
  const onPlus = () => {
    plusTaps.current += 1;
    if (plusTimer.current !== null) window.clearTimeout(plusTimer.current);
    plusTimer.current = window.setTimeout(() => {
      const taps = plusTaps.current;
      plusTaps.current = 0;
      plusTimer.current = null;
      if (taps >= 3) {
        setSiteEditorOpen(true);
        return;
      }
      if (taps === 2) {
        setSoloSaleInitial(null);
        setSoloSaleItemId(null);
        setSoloSaleOpen(true);
        return;
      }
      setOverlay(null);
      setTab('feed');
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 280);
  };

  /** Ouvrir SoloSaleFlow en mode creation (2 clics sur +) */
  const handleCreateZando = () => {
    setSoloSaleInitial(null);
    setSoloSaleItemId(null);
    setSoloSaleOpen(true);
  };

  /** Ouvrir SoloSaleFlow en mode edition (depuis Mes annonces) */
  const handleEditZando = (item: ZandoItem) => {
    const draft: SoloDraft = {
      etape: 5,
      type: 'vente',
      photo: parseMediaUrls(item.media_urls)[0] || '',
      titre: item.title || '',
      description: item.description || '',
      categorie: item.category || 'Autre objet',
      prix: item.price_borb || 0,
      devise: 'CDF',
      position: null,
      etat: 'stock',
    };
    setSoloSaleInitial(draft);
    setSoloSaleItemId(item.id);
    setSoloSaleOpen(true);
  };

  useEffect(
    () => () => {
      if (plusTimer.current !== null) window.clearTimeout(plusTimer.current);
    },
    [],
  );

  const fermerBoutique = () => {
    setBoutique(null);
    setBoutiqueId(null);
  };

  const content = (() => {
    if (overlay === 'market') {
      return (
        <MarketScreen
          onBack={() => setOverlay(null)}
          onOpenItem={setActiveItem}
          onGoStudio={() => ouvrirStudio()}
          onOpenBoutiqueSysteme={ouvrirBoutiqueSysteme}
        />
      );
    }
    if (siteEditorOpen) {
      return (
        <SiteEditor
          initial={null}
          shopName="Ma boutique"
          onClose={() => setSiteEditorOpen(false)}
          onSave={() => setSiteEditorOpen(false)}
        />
      );
    }
    if (overlay === 'studio') {
      return (
        <StudioScreen
          onBack={() => setOverlay(null)}
          modeInitial={studioMode}
          onOpenBoutiqueSysteme={ouvrirBoutiqueSysteme}
          onOpenItem={(item) => {
            setOverlay(null);
            setActiveItem(item);
          }}
        />
      );
    }
    if (overlay === 'player') {
      return (
        <PlayerScreen
          initialItem={playItem}
          onBack={() => {
            setPlayItem(null);
            setOverlay(null);
          }}
        />
      );
    }
    if (overlay === 'kyc') return <KycScreen onBack={() => setOverlay(null)} />;
    if (overlay === 'owner') return <OwnerVaultScreen onBack={() => setOverlay(null)} />;
    if (overlay === 'analytics') return <ProfileAnalyticsScreen onBack={() => setOverlay(null)} />;
    if (overlay === 'politiques') return <PolitiquesScreen onBack={() => setOverlay(null)} />;
    if (overlay === 'mail') return <MailScreen onBack={() => setOverlay(null)} />;
    if (overlay === 'sms') return <SmsScreen onBack={() => setOverlay(null)} />;

    if (tab === 'wallet') {
      if (isGuardian && walletView !== 'personal') {
        return (
          <OwnerVaultScreen
            onBack={() => goTab('feed')}
            onOpenPersonal={() => setWalletView('personal')}
          />
        );
      }
      return (
        <WalletScreen
          onBack={() => goTab('feed')}
          onOpenSecurity={() => setTab('profile')}
          onOpenOwner={() => (isGuardian ? setWalletView('auto') : setOverlay('owner'))}
          onGoTrading={() => goTab('trading')}
        />
      );
    }
    if (tab === 'trading') {
      return (
        <TradingScreen
          onBack={() => goTab('feed')}
          onOpenItem={setActiveItem}
          onOpenWallet={() => setTab('wallet')}
          onOpenProfile={() => setTab('profile')}
          onOpenChat={() => setTab('chat')}
          onOpenFeed={() => goTab('feed')}
          onMessage={(pseudo) => messageSeller(pseudo)}
        />
      );
    }
    if (tab === 'chat') {
      return (
        <ChatScreen
          initialPeer={chatPeer}
          initialItem={chatItem}
          onPeerConsumed={() => {
            setChatPeer(null);
            setChatItem(null);
          }}
          onOpenItem={setActiveItem}
          onBack={() => goTab('feed')}
        />
      );
    }
    if (tab === 'profile') {
      return (
        <ProfileScreen
          onBack={() => goTab('feed')}
          onGoKyc={() => setOverlay('kyc')}
          onGoStudio={() => ouvrirStudio()}
          onGoPlayer={() => setOverlay('player')}
          onGoOwner={() => setOverlay('owner')}
          onGoAnalytics={() => setOverlay('analytics')}
          onGoPolitiques={() => setOverlay('politiques')}
          onGoMail={() => setOverlay('mail')}
          onGoSms={() => setOverlay('sms')}
          onEditZando={handleEditZando}
          onCreateZando={handleCreateZando}
        />
      );
    }
    if (videoFeed) {
      return (
        <VideoFeed
          onOpenItem={setActiveItem}
          onOpenBoutique={ouvrirBoutique}
          onOpenCart={() => setCartOpen(true)}
          onGoStudio={() => ouvrirStudio()}
        />
      );
    }
    return (
      <FeedScreen
        onOpenItem={setActiveItem}
        onMessage={messageSeller}
        onGoStudio={() => ouvrirStudio()}
        onGoMarket={() => setOverlay('market')}
        onPlay={playContent}
        onOpenBoutiqueSysteme={ouvrirBoutiqueSysteme}
      />
    );
  })();

  const onFeed = !overlay && tab === 'feed';

  return (
    <div className="v2-root" data-theme={theme} data-fontsize={fontScale}>
      <div className="v2-frame">
        {!ready ? (
          <div className="v2-body">
            <Loader label="Ouverture de la session…" />
          </div>
        ) : !authenticated ? (
          ecranDemande === 'verification' ? (
            // Page officielle « revenez bientôt » — continuation post-création.
            <RevenezBientotScreen onBack={() => setEcranDemande(null)} />
          ) : ecranDemande === 'politiques' || ecranDemande === 'faq' || ecranDemande === 'aide' || ecranDemande === 'aide-politiques' ? (
            // Pages publiques officielles — identité cinématique de la vitrine.
            <PublicPages
              pageInitial={
                ecranDemande === 'faq' ? 'faq'
                : ecranDemande === 'aide' ? 'aide'
                : ecranDemande === 'aide-politiques' ? 'menu'
                : 'politiques'
              }
              sujetInitial={sujetInitial}
              onBack={() => setEcranDemande(null)}
            />
          ) : creating ? (
            <CreateAccountScreen
              onBack={() => setCreating(false)}
              onGoLogin={(identity) => {
                setPrefill(identity);
                setMontreAuth(true);
                setCreating(false);
              }}
            />
          ) : montreAuth ? (
            <AuthScreen
              onCreateAccount={() => setCreating(true)}
              prefill={prefill}
              onBack={() => setMontreAuth(false)}
            />
          ) : (
            <LandingScreen
              onLogin={() => setMontreAuth(true)}
              onCreateAccount={() => setCreating(true)}
            />
          )
        ) : (
          <>
            <div
              className={`v2-body ${onFeed ? 'v2-body--flush' : 'v2-with-tabbar'}`}
              ref={bodyRef}
              key={overlay || tab}
            >
              {content}
            </div>

            {!overlay && (
              <nav className="v2-tabbar" data-over-feed={onFeed} aria-label="Navigation principale">
                {NAV.slice(0, 2).map((entry) => (
                  <button
                    key={entry.id}
                    className="v2-tab"
                    data-active={tab === entry.id}
                    aria-current={tab === entry.id ? 'page' : undefined}
                    onClick={() => goTab(entry.id)}
                  >
                    <span className="v2-tab-icon">
                      <Icon name={entry.icon} size={22} />
                      <TabBadge count={notifications.counts[TAB_SCOPES[entry.id]] || 0} />
                    </span>
                    <span>{entry.label}</span>
                  </button>
                ))}

                <button
                  className="v2-tab v2-tab--center"
                  aria-label={`Zando · 1 appui : flux, 2 appuis : publier, 3 appuis : boutique${
                    notifications.counts.zando ? ` (${notifications.counts.zando} notifications)` : ''
                  }`}
                  onClick={onPlus}
                >
                  <span className="v2-tab-plus">
                    <Icon name="plus" size={26} />
                    <TabBadge count={notifications.counts.zando || 0} />
                  </span>
                  <span>ZANDO</span>
                </button>

                {NAV.slice(2).map((entry) => (
                  <button
                    key={entry.id}
                    className="v2-tab"
                    data-active={tab === entry.id}
                    aria-current={tab === entry.id ? 'page' : undefined}
                    onClick={() => goTab(entry.id)}
                  >
                    <span className="v2-tab-icon">
                      <Icon name={entry.icon} size={22} />
                      <TabBadge count={notifications.counts[TAB_SCOPES[entry.id]] || 0} />
                    </span>
                    <span>{entry.label}</span>
                  </button>
                ))}
              </nav>
            )}

            {soloSaleOpen && (
              <SoloSaleFlow
                onClose={() => {
                  setSoloSaleOpen(false);
                  setSoloSaleInitial(null);
                  setSoloSaleItemId(null);
                }}
                onPublish={async () => {
                  setSoloSaleOpen(false);
                  setSoloSaleInitial(null);
                  setSoloSaleItemId(null);
                }}
                initial={soloSaleInitial}
                itemId={soloSaleItemId}
              />
            )}
          </>
        )}

        <ToastHost />

        <HelpHost />

        <ZandoItemSheet
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onMessage={messageSeller}
          onPlay={playContent}
          onOpenBoutique={ouvrirBoutique}
        />

        <CartSheet
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onCheckout={(seller) => {
            setCartOpen(false);
            messageSeller(seller);
          }}
          onOpenItem={(line) => {
            setCartOpen(false);
            getZandoItem(line.itemId)
              .then((response) => setActiveItem(response?.item || null))
              .catch(() => undefined);
          }}
        />

        {boutiqueId === BOUTIQUE_SYSTEME_ID ? (
          <ConnexionBoutique
            onClose={fermerBoutique}
            onVendre={() => {
              fermerBoutique();
              ouvrirStudio('connect');
            }}
          />
        ) : (
          <BoutiqueSite
            seller={boutique || ''}
            onClose={() => {
              setBoutique(null);
              setBoutiqueId(null);
            }}
            onContact={(seller) => {
              setBoutique(null);
              messageSeller(seller);
            }}
            onOpenItem={(item) => {
              setBoutique(null);
              setActiveItem(item);
            }}
            onOpenCart={() => setCartOpen(true)}
          />
        )}
      </div>
    </div>
  );
}

export function V2App() {
  return (
    <SessionProvider>
      <NotificationsProvider>
        <HelpProvider>
          <Shell />
        </HelpProvider>
      </NotificationsProvider>
    </SessionProvider>
  );
}

export default V2App;