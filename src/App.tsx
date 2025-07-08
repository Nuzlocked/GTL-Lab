import React, { useState } from 'react';
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
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<AppState>('settings');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameStats, setGameStats] = useState<GameStats>({
    shinySnipesCaught: 0,
    totalShiniesAppeared: 0,
    totalReactionTime: 0,
    reactionTimes: []
  });

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
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="App">
      {/* Header with user info and sign out */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Pokemon GTL Lab
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
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