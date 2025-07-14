import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { friendlyService, FriendlyMatch, GameStats } from '../services/friendlyService';
import MultiplayerGlobalTradeLink from '../components/MultiplayerGlobalTradeLink';
import MultiplayerResultsPage from '../components/MultiplayerResultsPage';

type MatchState = 'loading' | 'game' | 'results' | 'error';

const MultiplayerMatchPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [matchState, setMatchState] = useState<MatchState>('loading');
  const [match, setMatch] = useState<FriendlyMatch | null>(null);
  const [myStats, setMyStats] = useState<GameStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Get match data from navigation state or check for active match
    const matchData = location.state?.match as FriendlyMatch | undefined;
    
    if (matchData) {
      setMatch(matchData);
      setMatchState('game');
    } else {
      // No match data in navigation state, check for active match
      checkActiveMatch();
    }
  }, [location.state]);

  const checkActiveMatch = async () => {
    if (!user) {
      setError('User not authenticated');
      setMatchState('error');
      return;
    }

    try {
      const activeMatch = await friendlyService.getActiveMatch(user.id);
      
      if (activeMatch) {
        setMatch(activeMatch);
        
        // Check if match was abandoned (forfeited)
        if (activeMatch.match_status === 'abandoned') {
          setError('Match was forfeited');
          setMatchState('error');
          return;
        }
        
        // Check if both players have completed the match
        if (activeMatch.player1_stats && activeMatch.player2_stats) {
          // Both players have submitted results, show results page
          setMatchState('results');
        } else {
          // Match is still active, continue with game
          setMatchState('game');
        }
      } else {
        setError('No active match found');
        setMatchState('error');
      }
    } catch (error) {
      console.error('Error checking active match:', error);
      setError('Failed to load match data');
      setMatchState('error');
    }
  };

  const handleGameComplete = (stats: GameStats) => {
    setMyStats(stats);
    setMatchState('results');
  };

  const handleCancel = () => {
    // Return to friendly page
    navigate('/friendly');
  };

  const handleRematch = async () => {
    if (!match || !user) return;

    try {
      // Determine opponent
      const opponentId = match.player1_id === user.id ? match.player2_id : match.player1_id;
      const opponentUsername = match.player1_id === user.id ? match.player2_username : match.player1_username;
      const myUsername = match.player1_id === user.id ? match.player1_username : match.player2_username;

      // Send new challenge with same settings
      const result = await friendlyService.sendChallenge(
        user.id,
        myUsername,
        opponentUsername,
        match.game_settings
      );

      if (result.success) {
        // Navigate back to friendly page to show the challenge
        navigate('/friendly', { 
          state: { 
            message: 'Rematch challenge sent!',
            messageType: 'success' 
          } 
        });
      } else {
        setError(`Failed to send rematch: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending rematch:', error);
      setError('Failed to send rematch challenge');
    }
  };

  const handleReturnToMenu = () => {
    navigate('/friendly');
  };

  // Subscribe to match updates
  useEffect(() => {
    if (!user || !match) return;

    friendlyService.subscribeToMatches(user.id, (payload) => {
      if (payload.eventType === 'UPDATE') {
        const updatedMatch = payload.new as FriendlyMatch;
        
        if (updatedMatch.id === match.id) {
          setMatch(updatedMatch);
          
          // Check if match was abandoned (forfeited)
          if (updatedMatch.match_status === 'abandoned') {
            setError('Match was forfeited by opponent');
            setMatchState('error');
            return;
          }
          
          // Check if both players have completed the match and we aren't already on the results screen.
          if (updatedMatch.player1_stats && updatedMatch.player2_stats && matchState !== 'results') {
            setMatchState('results');
          }
        }
      }
    });

    return () => {
      // Cleanup handled by friendlyService when component unmounts
      friendlyService.cleanup();
    };
  }, [user, match?.id, matchState]);

  // Handle user leaving the page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (matchState === 'game') {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [matchState]);

  // Loading state
  if (matchState === 'loading') {
    return (
      <div className="h-screen pt-20 flex items-center justify-center px-3">
        <div className="max-w-2xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-gtl-text mb-4">Loading Match...</div>
            <div className="text-gtl-text-dim">Please wait while we load your match data.</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (matchState === 'error') {
    return (
      <div className="h-screen pt-20 flex items-center justify-center px-3">
        <div className="max-w-2xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-4">Error</div>
            <div className="text-gtl-text-dim mb-6">{error}</div>
            <button
              onClick={handleReturnToMenu}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏠 Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Match not found
  if (!match) {
    return (
      <div className="h-screen pt-20 flex items-center justify-center px-3">
        <div className="max-w-2xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-4">Match Not Found</div>
            <div className="text-gtl-text-dim mb-6">The match you're looking for doesn't exist or has expired.</div>
            <button
              onClick={handleReturnToMenu}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏠 Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game state
  if (matchState === 'game') {
    return (
      <MultiplayerGlobalTradeLink
        match={match}
        onGameComplete={handleGameComplete}
        onCancel={handleCancel}
      />
    );
  }

  // Results state
  if (matchState === 'results') {
    // For results, we need to get the stats from the match or use myStats
    const statsToUse = myStats || (match.player1_id === user?.id ? match.player1_stats : match.player2_stats);
    
    if (!statsToUse) {
      return (
        <div className="h-screen pt-20 flex items-center justify-center px-3">
          <div className="max-w-2xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gtl-text mb-4">Loading Results...</div>
              <div className="text-gtl-text-dim">Please wait while we load the match results.</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <MultiplayerResultsPage
        match={match}
        myStats={statsToUse}
        onRematch={handleRematch}
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  return null;
};

export default MultiplayerMatchPage; 