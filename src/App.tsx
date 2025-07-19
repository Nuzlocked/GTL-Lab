import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SpriteLoadingProvider, useSpriteLoading } from './contexts/SpriteLoadingContext';
import { supabase } from './lib/supabase';
import './index.css';
import NavigationBar from './components/layout/NavigationBar';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import FriendlyPage from './pages/FriendlyPage';
import MultiplayerMatchPage from './pages/MultiplayerMatchPage';
import RankedPage from './pages/RankedPage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import StatsPage from './pages/StatsPage';
import UserSettingsPage from './pages/UserSettingsPage';
import CollectionPage from './pages/CollectionPage';

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { startPreloading } = useSpriteLoading();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string>('');

  useEffect(() => {
    if (user) {
      startPreloading();
      
      const fetchAndOrCreateProfile = async () => {
        let { data, error } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile not found.
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
  }, [user, startPreloading]);

  useEffect(() => {
    const urlHash = window.location.hash;
    if (urlHash.includes('access_token') && urlHash.includes('type=signup')) {
      setVerificationMessage('Email verified successfully! You can now use the app.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="App min-h-screen bg-gtl-deep">
      <Router>
        {user && <NavigationBar profile={profile} />}
        <main>
          {verificationMessage && (
            <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
              {verificationMessage}
            </div>
          )}
          {authLoading && (
            <div className="min-h-screen flex items-center justify-center bg-gtl-deep">
              <div className="text-xl text-white">Loading...</div>
            </div>
          )}

          {!authLoading && !user && <Auth />}

          {!authLoading && user && (
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/friendly" element={<FriendlyPage />} />
              <Route path="/friendly/match" element={<MultiplayerMatchPage />} />
              <Route path="/ranked" element={<RankedPage />} />
              <Route path="/leaderboards" element={<LeaderboardsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/settings" element={<UserSettingsPage />} />
            </Routes>
          )}
        </main>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SpriteLoadingProvider>
        <AppContent />
      </SpriteLoadingProvider>
    </AuthProvider>
  );
}

export default App; 