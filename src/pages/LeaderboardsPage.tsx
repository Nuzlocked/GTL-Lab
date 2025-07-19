import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchGlobalLeaderboards, LeaderboardEntry } from '../services/leaderboardService';

const CATEGORIES = ['Normal', 'Busy', 'Dump'];
const LEADERBOARD_LIMIT = 10; // Show top 10 players per category

const LeaderboardsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [allLeaderboards, setAllLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({
    'Normal': [],
    'Busy': [],
    'Dump': [],
  });
  const [fetching, setFetching] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Normal');

  const fetchLeaderboards = useCallback(async () => {
    setFetching(true);
    try {
      const data = await fetchGlobalLeaderboards();
      
      // Store all data (not limited) for accurate user ranking
      const allData: Record<string, LeaderboardEntry[]> = {};
      CATEGORIES.forEach(category => {
        allData[category] = data[category] || [];
      });
      
      setAllLeaderboards(allData);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchLeaderboards();
    }
  }, [loading, fetchLeaderboards]);

  // Refetch data when the page becomes visible/focused
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchLeaderboards();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchLeaderboards();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, fetchLeaderboards]);

  if (loading || fetching) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderLeaderboardRow = (entry: LeaderboardEntry, index: number) => {
    const isCurrentUser = user && entry.user_id === user.id;
    const accuracy = entry.attempts === 0 ? 0 : ((entry.snipes / entry.attempts) * 100);
    
    return (
      <tr 
        key={entry.user_id} 
        className={`border-b border-gtl-border ${isCurrentUser ? 'bg-gtl-primary/20' : ''}`}
      >
        <td className="py-2 px-4 text-center text-gtl-text font-bold">
          {getRankDisplay(entry.rank)}
        </td>
        <td className="py-2 px-4 text-gtl-text">
          <div className="flex items-center">
            <span className={isCurrentUser ? 'font-bold text-gtl-primary' : ''}>
              {entry.username}
            </span>
            {isCurrentUser && (
              <span className="ml-2 text-xs bg-gtl-primary text-white px-2 py-1 rounded">You</span>
            )}
          </div>
        </td>
        <td className="py-2 px-4 text-center text-gtl-text">
          {entry.snipes}
        </td>
        <td className="py-2 px-4 text-center text-gtl-text">
          {accuracy.toFixed(1)}%
        </td>
        <td className="py-2 px-4 text-center text-gtl-text">
          {entry.avg_reaction.toFixed(0)}ms
        </td>
      </tr>
    );
  };

  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const getCurrentUserRank = (category: string): LeaderboardEntry | null => {
    if (!user) return null;
    // Search in all entries, not just top 10
    return allLeaderboards[category].find(entry => entry.user_id === user.id) || null;
  };

  // Get top 10 for display
  const selectedLeaderboard = (allLeaderboards[selectedCategory] || []).slice(0, LEADERBOARD_LIMIT);
  const userRank = getCurrentUserRank(selectedCategory);
  const userInTop10 = userRank && userRank.rank <= LEADERBOARD_LIMIT;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gtl-text mb-6">🏆 Global Leaderboards</h1>
        
        {/* Category Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-gtl-surface-dark rounded-lg p-1 flex">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-gtl-primary text-white'
                    : 'text-gtl-text hover:bg-gtl-surface-light'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* User's Rank Display (if not in top 10) */}
        {user && !userInTop10 && (
          <div className="mb-4 p-3 bg-gtl-surface-dark/50 rounded-lg border border-gtl-border">
            <p className="text-center text-gtl-text-dim text-sm">
              {userRank ? (
                <>Your rank in {selectedCategory}: <span className="font-bold text-gtl-text">#{userRank.rank}</span> 
                   {userRank.snipes > 0 && (
                     <> • {userRank.snipes} snipes • {((userRank.snipes / userRank.attempts) * 100).toFixed(1)}% accuracy • {userRank.avg_reaction.toFixed(0)}ms avg</>
                   )}
                </>
              ) : (
                <>You haven't set a personal best in {selectedCategory} yet</>
              )}
            </p>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gtl-border text-gtl-text-dim text-sm">
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4 text-left">Player</th>
                <th className="py-3 px-4 text-center">Snipes</th>
                <th className="py-3 px-4 text-center">Accuracy</th>
                <th className="py-3 px-4 text-center">Avg Reaction</th>
              </tr>
            </thead>
            <tbody>
              {selectedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gtl-text-dim">
                    No records found for {selectedCategory} category
                  </td>
                </tr>
              ) : (
                selectedLeaderboard.map(renderLeaderboardRow)
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-gtl-text-dim text-sm">
          <p>Showing top {LEADERBOARD_LIMIT} players • Rankings update in real-time</p>
          <p className="mt-1">Rankings by: Snipes → Accuracy → Reaction Time</p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage; 