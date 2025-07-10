import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FriendlyMatch, GameStats } from '../services/friendlyService';
import { GameSettings } from '../types/GameSettings';

interface MultiplayerResultsPageProps {
  match: FriendlyMatch;
  myStats: GameStats;
  onRematch: () => void;
  onReturnToMenu: () => void;
}

const MultiplayerResultsPage: React.FC<MultiplayerResultsPageProps> = ({ 
  match, 
  myStats, 
  onRematch, 
  onReturnToMenu 
}) => {
  const { user } = useAuth();
  const [opponentStats, setOpponentStats] = useState<GameStats | null>(null);
  const [winner, setWinner] = useState<'me' | 'opponent' | 'tie' | null>(null);
  
  // Determine which player is me and which is opponent
  const isPlayer1 = match.player1_id === user?.id;
  const myUsername = isPlayer1 ? match.player1_username : match.player2_username;
  const opponentUsername = isPlayer1 ? match.player2_username : match.player1_username;

  useEffect(() => {
    // Get opponent's stats from the match
    const opponentStatsData = isPlayer1 ? match.player2_stats : match.player1_stats;
    
    if (opponentStatsData) {
      setOpponentStats(opponentStatsData);
      
      // Determine winner
      const myScore = calculateScore(myStats, match.game_settings);
      const opponentScore = calculateScore(opponentStatsData, match.game_settings);
      
      if (myScore > opponentScore) {
        setWinner('me');
      } else if (opponentScore > myScore) {
        setWinner('opponent');
      } else {
        setWinner('tie');
      }
    }
  }, [match, myStats, isPlayer1]);

  const calculateScore = (stats: GameStats, settings: GameSettings): number => {
    const successRate = stats.totalShiniesAppeared > 0 ? 
      (stats.shinySnipesCaught / stats.totalShiniesAppeared) * 100 : 0;
    
    const avgReactionTime = stats.reactionTimes.length > 0 ? 
      stats.totalReactionTime / stats.reactionTimes.length : 0;
    
    // Score formula: Success rate (0-100) + time bonus (max 50 points for fastest reactions)
    const timeBonus = Math.max(0, 50 - (avgReactionTime / 100));
    return successRate + timeBonus;
  };

  const getPerformanceGrade = (stats: GameStats) => {
    const successRate = stats.totalShiniesAppeared > 0 ? 
      (stats.shinySnipesCaught / stats.totalShiniesAppeared) * 100 : 0;
    
    if (successRate >= 80) return { grade: 'S', color: 'text-yellow-400', description: 'Outstanding!' };
    if (successRate >= 60) return { grade: 'A', color: 'text-green-400', description: 'Excellent!' };
    if (successRate >= 40) return { grade: 'B', color: 'text-blue-400', description: 'Good!' };
    if (successRate >= 20) return { grade: 'C', color: 'text-orange-400', description: 'Not bad!' };
    return { grade: 'D', color: 'text-red-400', description: 'Keep practicing!' };
  };

  const getAverageReactionTime = (stats: GameStats) => {
    if (stats.reactionTimes.length === 0) return 0;
    return stats.totalReactionTime / stats.reactionTimes.length;
  };

  const getSuccessRate = (stats: GameStats) => {
    if (stats.totalShiniesAppeared === 0) return 0;
    return (stats.shinySnipesCaught / stats.totalShiniesAppeared) * 100;
  };

  const myPerformance = getPerformanceGrade(myStats);
  const opponentPerformance = opponentStats ? getPerformanceGrade(opponentStats) : null;

  if (!opponentStats) {
    return (
      <div className="h-screen pt-20 flex items-center justify-center px-3">
        <div className="max-w-2xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-gtl-text mb-4">Loading Results...</div>
            <div className="text-gtl-text-dim">Waiting for opponent data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen pt-20 flex items-center justify-center px-3">
      <div className="max-w-6xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="bg-transparent p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gtl-text mb-2">Match Complete!</h1>
            <div className="text-xl text-gtl-text-dim">
              {winner === 'me' && '🏆 You Win!'}
              {winner === 'opponent' && '💪 You Lose!'}
              {winner === 'tie' && '🤝 It\'s a Tie!'}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-transparent p-6 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Results */}
            <div className="bg-gtl-surface-light rounded-lg p-4 border border-gtl-border">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gtl-text mb-2">
                  {myUsername} {winner === 'me' ? '👑' : ''}
                </h3>
                <div className={`text-4xl font-bold ${myPerformance.color} mb-1`}>
                  {myPerformance.grade}
                </div>
                <div className="text-lg text-gtl-text font-medium">
                  {myPerformance.description}
                </div>
                <div className="text-sm text-gtl-text-dim">
                  Success Rate: {getSuccessRate(myStats).toFixed(1)}%
                </div>
                <div className="text-sm text-gtl-text-dim">
                  Score: {calculateScore(myStats, match.game_settings).toFixed(1)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⭐ Shinies Sniped:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {myStats.shinySnipesCaught}/{myStats.totalShiniesAppeared}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">📊 Success Rate:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {getSuccessRate(myStats).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⚡ Avg Reaction Time:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {getAverageReactionTime(myStats).toFixed(0)}ms
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">🎯 Total Attempts:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {myStats.reactionTimes.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Opponent Results */}
            <div className="bg-gtl-surface-light rounded-lg p-4 border border-gtl-border">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gtl-text mb-2">
                  {opponentUsername} {winner === 'opponent' ? '👑' : ''}
                </h3>
                <div className={`text-4xl font-bold ${opponentPerformance?.color} mb-1`}>
                  {opponentPerformance?.grade}
                </div>
                <div className="text-lg text-gtl-text font-medium">
                  {opponentPerformance?.description}
                </div>
                <div className="text-sm text-gtl-text-dim">
                  Success Rate: {getSuccessRate(opponentStats).toFixed(1)}%
                </div>
                <div className="text-sm text-gtl-text-dim">
                  Score: {calculateScore(opponentStats, match.game_settings).toFixed(1)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⭐ Shinies Sniped:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {opponentStats.shinySnipesCaught}/{opponentStats.totalShiniesAppeared}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">📊 Success Rate:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {getSuccessRate(opponentStats).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⚡ Avg Reaction Time:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {getAverageReactionTime(opponentStats).toFixed(0)}ms
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">🎯 Total Attempts:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {opponentStats.reactionTimes.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Settings Used */}
          <div className="mt-6 bg-gtl-surface-light rounded-lg p-4 border border-gtl-border">
            <h3 className="text-gtl-text text-lg font-bold mb-3 text-center">⚙️ Match Settings</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gtl-surface rounded p-2 text-center">
                <div className="text-gtl-text text-xs">Shiny Frequency</div>
                <div className="text-gtl-text text-sm font-bold">
                  {match.game_settings.shinyFrequency}%
                </div>
              </div>
              
              <div className="bg-gtl-surface rounded p-2 text-center">
                <div className="text-gtl-text text-xs">Ping Simulation</div>
                <div className="text-gtl-text text-sm font-bold">
                  {match.game_settings.pingSimulation}ms
                </div>
              </div>
              
              <div className="bg-gtl-surface rounded p-2 text-center">
                <div className="text-gtl-text text-xs">GTL Activity</div>
                <div className="text-gtl-text text-sm font-bold">
                  {match.game_settings.gtlActivity} max
                </div>
              </div>
              
              <div className="bg-gtl-surface rounded p-2 text-center">
                <div className="text-gtl-text text-xs">Snipe Window</div>
                <div className="text-gtl-text text-sm font-bold">
                  {(match.game_settings.snipeWindow / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={onRematch}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🔄 Rematch
            </button>
            
            <button
              onClick={onReturnToMenu}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏠 Return to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerResultsPage; 