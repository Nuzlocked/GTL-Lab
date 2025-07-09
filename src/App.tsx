import React, { useState, useEffect } from 'react';
import SettingsPage from './components/SettingsPage';
import GlobalTradeLink from './components/GlobalTradeLink';
import ResultsPage from './components/ResultsPage';
import Auth from './components/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameSettings, DEFAULT_SETTINGS } from './types/GameSettings';
import './index.css';

type AppState = 'settings' | 'game' | 'results';

interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number;
  totalReactionTime: number;
  reactionTimes: number[];
}

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<AppState>('settings');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameStats, setGameStats] = useState<GameStats>({
    shinySnipesCaught: 0,
    totalShiniesAppeared: 0,
    totalReactionTime: 0,
    reactionTimes: []
  });
  const [verificationMessage, setVerificationMessage] = useState<string>('');

  // Check for email verification on component mount
  useEffect(() => {
    const urlHash = window.location.hash;
    if (urlHash.includes('access_token') && urlHash.includes('type=signup')) {
      setVerificationMessage('Email verified successfully! You can now use the app.');
      // Clear the hash from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setCurrentPage('game');
  };

  const handleGameComplete = (stats: GameStats) => {
    setGameStats(stats);
    setCurrentPage('results');
  };

  const handlePlayAgain = () => {
    setCurrentPage('game');
  };

  const handleBackToSettings = () => {
    setCurrentPage('settings');
  };

  const handleCancel = () => {
    setCurrentPage('settings');
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentPage('settings');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="App">
      {/* Header with user info and sign out */}
      <header className="bg-gtl-header shadow-lg border-b border-gtl-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎮</div>
              <h1 className="text-xl font-bold text-gtl-text">
                Pokemon GTL Lab
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gtl-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(profile?.username || user?.email || 'T')[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-gtl-text font-medium text-sm">
                    {profile?.username || 'Trainer'}
                  </span>
                  <span className="text-gtl-text-dim text-xs">
                    {user?.email}
                  </span>
                </div>
              </div>
              <div className="w-px h-8 bg-gtl-border"></div>
              <button
                onClick={handleSignOut}
                className="bg-gtl-surface-light hover:bg-red-600 text-gtl-text hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          {verificationMessage && (
            <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
              {verificationMessage}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main>
        {currentPage === 'settings' && (
          <SettingsPage onStartGame={handleStartGame} />
        )}
        
        {currentPage === 'game' && (
          <GlobalTradeLink 
            gameSettings={gameSettings}
            onGameComplete={handleGameComplete}
            onCancel={handleCancel}
          />
        )}
        
        {currentPage === 'results' && (
          <ResultsPage 
            gameStats={gameStats}
            gameSettings={gameSettings}
            onPlayAgain={handlePlayAgain}
            onBackToSettings={handleBackToSettings}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 