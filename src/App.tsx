import { useState, useEffect, type ReactNode } from 'react';
import { ScreenProvider } from './context/ScreenContext';
import apiClient, { hasToken, checkTokenValidity, forceLogout } from './api/client';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { Language, LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { LoginScreen } from './screens/LoginScreen';
import { CreateAccountScreen } from './screens/CreateAccountScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { StudioPage } from './features/studio/pages/StudioPage';
import CoffreScreen from './features/wallet/pages/CoffreScreen';
import { PageLoaderWrapper } from './components/ui/PageLoaderWrapper';
import PlayerPage from './pages/PlayerPage';
import ProfilePage from './pages/ProfilePage';
import TradingScreen from './features/trading/pages/TradingScreen';
import ChatScreen from './features/chat/pages/ChatScreen';
import { Navigation } from './components/ui/Navigation';
import V2App from './v2/V2App';
import { Icon } from './components/ui/Icon';

// Bascule d'interface : true = refonte v2 (src/v2), false = ancienne interface.
const USE_V2_UI = true;

// ====================
// TYPES
// ====================
type Screen = 
  | 'dashboard'  // Page d'accueil avec flux TikTok
  | 'studio'     // Studio Zando (création)
  | 'coffre'     // COFFRE BORB (WalletPage)
  | 'trading'    // Trading
  | 'chat'       // Chat
  | 'profil'     // Profil
  | 'player'
  | 'create-account';    // Lecteur UQ

// ====================
// APP
// ====================
function AppInner() {
  const { setLanguage } = useLanguage();
  const { setMode } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('uq_token')
  );
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const fontSize = localStorage.getItem('uq_font_size');
    document.documentElement.style.fontSize =
      fontSize === 'small' ? '13px'
      : fontSize === 'large' ? '17px'
      : fontSize === 'xlarge' ? '19px'
      : '15px';
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Pas de token → Login
      if (!hasToken()) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // 2. Token existe → verifier validite
      try {
        const valid = await checkTokenValidity();
        if (valid) {
          setIsAuthenticated(true);
        } else {
          forceLogout();
        }
      } catch {
        // Backend off : on garde la session ouverte
        setIsAuthenticated(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const uqNumber = localStorage.getItem('uq_number');
    if (!uqNumber) return;

    apiClient.get(`/api/account/preferences/${encodeURIComponent(uqNumber)}`)
      .then((response) => {
        const preferences = response.data?.preferences;
        const language = preferences?.language;
        if (language === 'fr' || language === 'en' || language === 'es' || language === 'sw') {
          setLanguage(language as Language);
        }

        const theme = preferences?.theme;
        if (theme === 'dark' || theme === 'light' || theme === 'auto') {
          localStorage.setItem('uq_theme', theme);
          setMode(theme === 'auto'
            ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
            : theme);
          window.dispatchEvent(new Event('uq:theme-preference-change'));
        }

        const fontSize = preferences?.font_size;
        if (fontSize === 'small' || fontSize === 'medium' || fontSize === 'large' || fontSize === 'xlarge') {
          localStorage.setItem('uq_font_size', fontSize);
          document.documentElement.style.fontSize =
            fontSize === 'small' ? '13px'
            : fontSize === 'large' ? '17px'
            : fontSize === 'xlarge' ? '19px'
            : '15px';
        }
      })
      .catch((error) => {
        console.warn('Impossible de charger les préférences du compte.', error);
      });
  }, [isAuthenticated, setLanguage, setMode]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('uq_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('uq_token');
    setIsAuthenticated(false);
    setCurrentScreen('dashboard');
  };

  const goToStudio = () => setCurrentScreen('studio');
  const goToDashboard = () => setCurrentScreen('dashboard');
  const goToCoffre = () => setCurrentScreen('coffre');
  const goToTrading = () => setCurrentScreen('trading');
  const goToChat = () => setCurrentScreen('chat');
  const goToProfil = () => setCurrentScreen('profil');
  const goToPlayer = () => setCurrentScreen('player');

  // Handler de navigation du menu principal (Coffre / Trading / Chat / Profil / Zando)
  const handleNavigate = (screen: string) => {
    switch (screen) {
      case 'coffre':
        setCurrentScreen('coffre');
        break;
      case 'trading':
        setCurrentScreen('trading');
        break;
      case 'chat':
        setCurrentScreen('chat');
        break;
      case 'profil':
        setCurrentScreen('profil');
        break;
      case 'marche':
        setCurrentScreen('dashboard');
        break;
      case 'studio':
        setCurrentScreen('studio');
        break;
      default:
        setCurrentScreen('dashboard');
    }
  };

  // Menu principal : rendu ici pour être disponible sur TOUS les écrans
  const activeNav: 'coffre' | 'trading' | 'marche' | 'chat' | 'profil' =
    currentScreen === 'coffre' ? 'coffre'
      : currentScreen === 'trading' ? 'trading'
        : currentScreen === 'chat' ? 'chat'
          : currentScreen === 'profil' ? 'profil'
            : 'marche';

  const withMainMenu = (content: ReactNode) => (
    <div className="min-h-screen">
      {content}
      {currentScreen !== 'player' && (
        <Navigation
          active={activeNav}
          onNavigate={handleNavigate}
          onPlusClick={goToStudio}
        />
      )}
    </div>
  );

  // ====================
  // RENDU
  // ====================
  // Verification en cours
  if (isChecking) {
    return (
      <PageLoaderWrapper 
        loadingMessage="Verification de la session..."
        loadingSubMessage="Connexion securisee"
      >
        <div className="min-h-screen bg-[#0A0A0F]" />
      </PageLoaderWrapper>
    );
  }

  // Pas authentifie
  if (!isAuthenticated) {
    if (isCreatingAccount) {
      return (
        <CreateAccountScreen
          onBack={() => setIsCreatingAccount(false)}
          onSuccess={(accountInfo) => {
            setIsCreatingAccount(false);
          }}
        />
      );
    }
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onCreateAccount={() => setIsCreatingAccount(true)}
      />
    );
  }

  // Écran STUDIO
  if (currentScreen === 'studio') {
    return withMainMenu(
      <PageLoaderWrapper 
        loadingMessage="Ouverture du Studio..."
        loadingSubMessage="Préparation de l'espace de création"
      >
        <StudioPage onBack={goToDashboard} />
      </PageLoaderWrapper>
    );
  }

  // Écran COFFRE
  if (currentScreen === 'coffre') {
    return withMainMenu(
      <PageLoaderWrapper 
        loadingMessage="Ouverture du Coffre..."
        loadingSubMessage="Connexion sécurisée au réseau"
      >
        <CoffreScreen
          onBack={goToDashboard}
          onTradingClick={goToTrading}
        />
      </PageLoaderWrapper>
    );
  }

  // Écran TRADING
  if (currentScreen === 'trading') {
    return withMainMenu(
      <PageLoaderWrapper 
        loadingMessage="Ouverture du Trading..."
        loadingSubMessage="Connexion au marché P2P"
      >
        <TradingScreen onBack={goToDashboard} />
      </PageLoaderWrapper>
    );
  }

  // Écran CHAT
  if (currentScreen === 'chat') {
    return withMainMenu(
      <PageLoaderWrapper 
        loadingMessage="Ouverture du Chat..."
        loadingSubMessage="Chiffrement des messages"
      >
        <ChatScreen onBack={goToDashboard} />
      </PageLoaderWrapper>
    );
  }

  // Écran PROFIL
  if (currentScreen === 'profil') {
    return withMainMenu(
      <PageLoaderWrapper 
        loadingMessage="Ouverture du Profil..."
        loadingSubMessage="Chargement de l'identité UQ"
      >
        <div>
          <button
            onClick={goToDashboard}
            className="fixed top-3 right-3 z-50 w-8 h-8 rounded-full bg-uq-card/80 border border-uq-border text-uq-text-secondary hover:text-uq-text hover:border-uq-error/50 flex items-center justify-center text-sm font-bold backdrop-blur-sm active:scale-90 transition-all"
            title="Fermer"
          >
            <Icon name="x" size={20} />
          </button>
          <ProfilePage onBack={goToDashboard} />
        </div>
      </PageLoaderWrapper>
    );
  }

  // Écran PLAYER
  if (currentScreen === 'player') {
    return withMainMenu(
      <PageLoaderWrapper 
        loadingMessage="Ouverture du Lecteur..."
        loadingSubMessage="Préparation du contenu"
      >
        <div>
          <button
            onClick={goToDashboard}
            className="fixed top-3 right-3 z-50 w-8 h-8 rounded-full bg-uq-card/80 border border-uq-border text-uq-text-secondary hover:text-uq-text hover:border-uq-error/50 flex items-center justify-center text-sm font-bold backdrop-blur-sm active:scale-90 transition-all"
            title="Fermer"
          >
            <Icon name="x" size={20} />
          </button>
          <PlayerPage />
        </div>
      </PageLoaderWrapper>
    );
  }

  // Écran par défaut : DASHBOARD / ZANDO
  return withMainMenu(
    <PageLoaderWrapper 
      loadingMessage="Ouverture du Marché Zando..."
      loadingSubMessage="Chargement des boutiques"
    >
      <DashboardScreen
        onLogout={handleLogout}
        onZandoClick={goToStudio}
      />
    </PageLoaderWrapper>
  );
}








// ====================
// WRAPPER avec ScreenProvider
// ====================

export default function App() {
  if (USE_V2_UI) return <V2App />;

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ScreenProvider>
          <div className="uq-app-theme">
            <AppInner />
          </div>
        </ScreenProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}



