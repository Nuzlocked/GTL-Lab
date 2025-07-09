import React, { useState, useEffect } from 'react';
import SettingsPage from './components/SettingsPage';
import GlobalTradeLink from './components/GlobalTradeLink';
import ResultsPage from './components/ResultsPage';
import Auth from './components/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameSettings, DEFAULT_SETTINGS } from './types/GameSettings';
import { supabase } from './lib/supabase';
import './index.css';

type AppState = 'settings' | 'game' | 'results';

interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number;
  totalReactionTime: number;
  reactionTimes: number[];
}

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
}

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<AppState>('settings');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameStats, setGameStats] = useState<GameStats>({
    shinySnipesCaught: 0,
    totalShiniesAppeared: 0,
    totalReactionTime: 0,
    reactionTimes: []
  });
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  
  // Fetch profile when user object is available or changes
  useEffect(() => {
    if (user) {
      const fetchAndOrCreateProfile = async () => {
        let { data, error } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile not found. This can happen for users who signed up before the trigger was fixed.
          // Let's create a profile for them.
          const username = user.email?.split('@')[0] || 'Trainer';
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              { id: user.id, email: user.email, username: username },
            ])
            .select()
            .single();
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
            // It's possible the auto-generated username is already taken.
            // The user will see the default 'Trainer' and can change their username in settings.
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        } else if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      }

      fetchAndOrCreateProfile();
    }
  }, [user]);

  useEffect(() => {
    const urlHash = window.location.hash;
    if (urlHash.includes('access_token') && urlHash.includes('type=signup')) {
      setVerificationMessage('Email verified successfully! You can now use the app.');
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

  return (
    <div className="App">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gtl-header shadow-lg border-b border-gtl-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/favicon.png" 
                alt="GTL Lab Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-gtl-text">
                GTL Lab
              </h1>
            </div>
            {user && (
              <div className="flex items-center space-x-6">
                <span className="text-gtl-text font-medium text-sm">
                  {profile?.username}
                </span>
                <div className="w-px h-8 bg-gtl-border"></div>
                <button
                  onClick={handleSignOut}
                  className="bg-gtl-surface-light hover:bg-red-600 text-gtl-text hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
          {verificationMessage && (
            <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
              {verificationMessage}
            </div>
          )}
        </div>
      </header>

      <main>
        {authLoading && (
          <div className="min-h-screen flex items-center justify-center bg-gtl-deep">
            <div className="text-xl text-white">Loading...</div>
          </div>
        )}

        {!authLoading && !user && <Auth />}

        {!authLoading && user && (
          <>
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
          </>
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