import React from 'react';
import { GameSettings } from '../types/GameSettings';

interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number;
  totalReactionTime: number;
  reactionTimes: number[];
  totalAttempts: number;
}

interface ResultsPageProps {
  gameStats: GameStats;
  gameSettings: GameSettings;
  onPlayAgain: () => void;
  onBackToSettings: () => void;
  isNewPersonalBest?: boolean;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ 
  gameStats, 
  gameSettings, 
  onPlayAgain, 
  onBackToSettings,
  isNewPersonalBest = false,
}) => {
  const getAverageReactionTime = () => {
    if (gameStats.reactionTimes.length === 0) return 0;
    return gameStats.totalReactionTime / gameStats.reactionTimes.length;
  };

  const getSuccessRate = () => {
    if (gameStats.totalAttempts === 0) return 0;
    return (gameStats.shinySnipesCaught / gameStats.totalAttempts) * 100;
  };

  const getPerformanceGrade = () => {
    const successRate = getSuccessRate();
    if (successRate >= 80) return { grade: 'S', color: 'text-yellow-400', description: 'Outstanding!' };
    if (successRate >= 60) return { grade: 'A', color: 'text-green-400', description: 'Excellent!' };
    if (successRate >= 40) return { grade: 'B', color: 'text-blue-400', description: 'Good!' };
    if (successRate >= 20) return { grade: 'C', color: 'text-orange-400', description: 'Not bad!' };
    return { grade: 'D', color: 'text-red-400', description: 'Keep practicing!' };
  };

  const performance = getPerformanceGrade();

  return (
    <div className="h-screen pt-20 flex items-center justify-center px-3">
      <div className="max-w-2xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="bg-transparent p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gtl-text mb-1">Time's up!</h1>
            <p className="text-gtl-text-dim text-base">Here's how you performed</p>
            {isNewPersonalBest && (
              <p className="text-green-400 text-lg font-semibold mt-2">🎉 New Personal Best!</p>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-transparent p-6 pt-0">
          {/* Performance Grade */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold ${performance.color} mb-1`}>
              {performance.grade}
            </div>
            <div className="text-xl text-gtl-text font-medium mb-1">
              {performance.description}
            </div>
            <div className="text-sm text-gtl-text-dim">
              Success Rate: {getSuccessRate().toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Game Statistics */}
            <div className="bg-gtl-surface-light rounded-lg p-3 border border-gtl-border">
              <h3 className="text-gtl-text text-lg font-bold mb-3 text-center">📊 Game Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⭐ Shinies Sniped:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {gameStats.shinySnipesCaught}/{gameStats.totalShiniesAppeared}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">📊 Success Rate:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {getSuccessRate().toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⚡ Avg Reaction Time:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {getAverageReactionTime().toFixed(0)}ms
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">🎯 Total Attempts:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {gameStats.totalAttempts}
                  </span>
                </div>
              </div>
            </div>

            {/* Game Settings Used */}
            <div className="bg-gtl-surface-light rounded-lg p-3 border border-gtl-border">
              <h3 className="text-gtl-text text-lg font-bold mb-3 text-center">⚙️ Settings Used</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⭐ Shiny Count:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {gameSettings.shinyFrequency} shinies
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm"> Ping Simulation:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {gameSettings.pingSimulation}ms
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">🎯 GTL Activity:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {gameSettings.gtlActivity} max
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-2">
                  <span className="text-gtl-text text-sm">⏰ Snipe Window:</span>
                  <span className="text-gtl-text text-sm font-bold">
                    {(gameSettings.snipeWindow / 1000).toFixed(1)}s
                  </span>
                </div>
               
                {/* Difficulty Rating */}
                <div className="mt-3 bg-gtl-primary bg-opacity-20 rounded p-2 border border-gtl-primary">
                  <div className="text-center">
                    <div className="text-gtl-text text-sm font-medium mb-1">Difficulty Rating</div>
                    <div className="text-gtl-text text-sm font-bold">
                      {getDifficultyRating(gameSettings)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={onPlayAgain}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Play Again (Same Settings)
            </button>
            
            <button
              onClick={onBackToSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Back to Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate difficulty rating
const getDifficultyRating = (settings: GameSettings): string => {
  // Higher shiny frequency = easier (more opportunities)
  // Higher ping simulation = easier (more time to react)
  // Higher GTL activity = harder (more distractions)
  // Shorter snipe window = harder (less time to react)
  
  const shinyScore = (25 - settings.shinyFrequency) / 25; // Inverted: lower frequency = harder
  const pingScore = (500 - settings.pingSimulation) / 450; // Inverted: lower ping = harder
  const activityScore = settings.gtlActivity / 5; // Higher activity = harder
  const snipeScore = (2000 - settings.snipeWindow) / 1200; // Inverted: shorter window = harder
  
  const difficultyScore = (shinyScore + pingScore + activityScore + snipeScore) / 4;
  
  if (difficultyScore >= 0.8) return '🔥 Extreme';
  if (difficultyScore >= 0.6) return '🔴 Hard';
  if (difficultyScore >= 0.4) return '🟡 Medium';
  if (difficultyScore >= 0.2) return '🟢 Easy';
  return '😴 Very Easy';
};

export default ResultsPage; 