import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyService } from '../../services/friendlyService';
import { supabase } from '../../lib/supabase';

interface NavigationBarProps {
  profile: {
    id: string;
    username: string | null;
    email: string;
  } | null;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ profile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [pendingChallengeCount, setPendingChallengeCount] = useState(0);

  // Keep a ref to this component's dedicated channel so we can clean it up properly
  const challengeChannelRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      // Initialize presence tracking
      const currentPage = getCurrentPageName(location.pathname);
      friendlyService.initializePresence(user.id, currentPage);
      
      // Load initial challenge count
      loadChallengeCount();
      
      // Setup real-time challenge subscriptions
      challengeChannelRef.current = setupChallengeSubscriptions();
      
      // Cleanup on unmount
      return () => {
        // Clean up the dedicated realtime channel
        if (challengeChannelRef.current) {
          supabase.removeChannel(challengeChannelRef.current);
          challengeChannelRef.current = null;
        }

        // Mark user offline and clean up any service-level subscriptions
        friendlyService.setOffline(user.id);
        friendlyService.cleanup();
      };
    }
  }, [user]);

  useEffect(() => {
    // Update presence when page changes
    if (user) {
      const currentPage = getCurrentPageName(location.pathname);
      friendlyService.updatePresencePage(user.id, currentPage);
    }
  }, [location.pathname, user]);

  const getCurrentPageName = (pathname: string): string => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/practice')) return 'practice';
    if (pathname.startsWith('/friendly')) return 'friendly';
    if (pathname.startsWith('/ranked')) return 'ranked';
    if (pathname.startsWith('/leaderboards')) return 'leaderboards';
    if (pathname.startsWith('/stats')) return 'stats';
    if (pathname.startsWith('/collection')) return 'collection';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'other';
  };

  const loadChallengeCount = async () => {
    if (!user) return;
    
    try {
      const challenges = await friendlyService.getPendingChallenges(user.id);
      setPendingChallengeCount(challenges.length);
    } catch (error) {
      console.error('Error loading challenge count:', error);
    }
  };

  const setupChallengeSubscriptions = () => {
    if (!user) return null;

    // Create a dedicated channel for the navbar so that other components' subscriptions
    // won't interfere or get torn down.
    const channel = supabase
      .channel(`navbar_challenges_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friendly_challenges', filter: `challenged_id=eq.${user.id}` },
        (payload) => {
          setPendingChallengeCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'friendly_challenges', filter: `challenged_id=eq.${user.id}` },
        (payload) => {
          const updated: any = payload.new;
          if (updated.status !== 'pending') {
            // A pending challenge was accepted / rejected / expired – decrement the badge
            setPendingChallengeCount((prev) => Math.max(prev - 1, 0));
          } else {
            // Other field changed (e.g., expires_at) but still pending – make sure count is accurate
            loadChallengeCount();
          }
        }
      )
      .subscribe();

    return channel;
  };

  const handleLogout = async () => {
    if (user) {
      await friendlyService.setOffline(user.id);
      friendlyService.cleanup();
    }
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gtl-header shadow-lg border-b border-gtl-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <img 
                src="/gtl-lab_logo.png" 
                alt="GTL Lab Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-gtl-text">
                GTL Lab
              </h1>
            </div>
            <nav className="flex items-center space-x-6">
              <NavLink to="/" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
                Home
              </NavLink>
              <NavLink to="/practice" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
                Practice
              </NavLink>
              <NavLink to="/friendly" className={({ isActive }) => `relative text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
                Friendly
                {pendingChallengeCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {pendingChallengeCount > 9 ? '9+' : pendingChallengeCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/ranked" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
                Ranked
              </NavLink>
              <NavLink to="/leaderboards" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
                Leaderboards
              </NavLink>
              <NavLink to="/stats" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
                Stats
              </NavLink>
              <NavLink to="/collection" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
                Collection
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full" title="Online"></div>
              <span className="text-sm font-medium text-gtl-text">
                {profile?.username || 'Loading...'}
              </span>
            </div>
            
            <NavLink to="/settings" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>
              Settings
            </NavLink>
            
            <div className="border-l border-gtl-border pl-6">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-all duration-200 border border-red-400/20 hover:border-red-400/40"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavigationBar; 