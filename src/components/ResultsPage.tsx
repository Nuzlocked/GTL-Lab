import React from 'react';
import { GameSettings } from '../types/GameSettings';

interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number;
  totalReactionTime: number;
  reactionTimes: number[];
}

interface ResultsPageProps {
  gameStats: GameStats;
  gameSettings: GameSettings;
  onPlayAgain: () => void;
  onBackToSettings: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ 
  gameStats, 
  gameSettings, 
  onPlayAgain, 
  onBackToSettings 
}) => {
  const getAverageReactionTime = () => {
    if (gameStats.reactionTimes.length === 0) return 0;
    return gameStats.totalReactionTime / gameStats.reactionTimes.length;
  };

  const getSuccessRate = () => {
    if (gameStats.totalShiniesAppeared === 0) return 0;
    return (gameStats.shinySnipesCaught / gameStats.totalShiniesAppeared) * 100;
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
    <div className="min-h-screen p-3 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="bg-gtl-header rounded-t-lg p-6 border-b border-gtl-border">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gtl-text mb-2">🎉 Game Complete!</h1>
            <p className="text-gtl-text-dim text-lg">Here's how you performed</p>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-gtl-surface rounded-b-lg p-8">
          {/* Performance Grade */}
          <div className="text-center mb-8">
            <div className={`text-8xl font-bold ${performance.color} mb-2`}>
              {performance.grade}
            </div>
            <div className="text-2xl text-gtl-text font-medium mb-2">
              {performance.description}
            </div>
            <div className="text-lg text-gtl-text-dim">
              Success Rate: {getSuccessRate().toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Game Statistics */}
            <div className="bg-gtl-surface-light rounded-lg p-6 border border-gtl-border">
              <h3 className="text-gtl-text text-2xl font-bold mb-6 text-center">📊 Game Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                  <span className="text-gtl-text text-lg">⭐ Shinies Sniped:</span>
                  <span className="text-gtl-text text-xl font-bold">
                    {gameStats.shinySnipesCaught}/{gameStats.totalShiniesAppeared}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                  <span className="text-gtl-text text-lg">📊 Success Rate:</span>
                  <span className="text-gtl-text text-xl font-bold">
                    {getSuccessRate().toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                  <span className="text-gtl-text text-lg">⚡ Avg Reaction Time:</span>
                  <span className="text-gtl-text text-xl font-bold">
                    {getAverageReactionTime().toFixed(0)}ms
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                  <span className="text-gtl-text text-lg">🎯 Total Attempts:</span>
                  <span className="text-gtl-text text-xl font-bold">
                    {gameStats.reactionTimes.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Game Settings Used */}
            <div className="bg-gtl-surface-light rounded-lg p-6 border border-gtl-border">
              <h3 className="text-gtl-text text-2xl font-bold mb-6 text-center">⚙️ Settings Used</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                  <span className="text-gtl-text text-lg">⭐ Shiny Frequency:</span>
                  <span className="text-gtl-text text-xl font-bold">
                    {gameSettings.shinyFrequency}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                  <span className="text-gtl-text text-lg">📡 Ping Simulation:</span>
                  <span className="text-gtl-text text-xl font-bold">
                    {gameSettings.pingSimulation}ms
                  </span>
                </div>
                
                                 <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                   <span className="text-gtl-text text-lg">🎯 GTL Activity:</span>
                   <span className="text-gtl-text text-xl font-bold">
                     {gameSettings.gtlActivity} max
                   </span>
                 </div>
                 
                 <div className="flex justify-between items-center bg-gtl-surface rounded p-4">
                   <span className="text-gtl-text text-lg">⏰ Snipe Window:</span>
                   <span className="text-gtl-text text-xl font-bold">
                     {(gameSettings.snipeWindow / 1000).toFixed(1)}s
                   </span>
                 </div>
                
                {/* Difficulty Rating */}
                <div className="mt-6 bg-gtl-primary bg-opacity-20 rounded p-4 border border-gtl-primary">
                  <div className="text-center">
                    <div className="text-gtl-text text-lg font-medium mb-2">Difficulty Rating</div>
                    <div className="text-gtl-text text-xl font-bold">
                      {getDifficultyRating(gameSettings)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={onPlayAgain}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Play Again (Same Settings)
            </button>
            
            <button
              onClick={onBackToSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Back to Main Menu
            </button>
          </div>

          {/* Tips for Improvement */}
          {getSuccessRate() < 50 && (
            <div className="mt-8 bg-yellow-600 bg-opacity-20 rounded-lg p-6 border border-yellow-600">
              <h4 className="text-yellow-400 text-xl font-bold mb-3">💡 Tips for Improvement</h4>
                             <ul className="text-gtl-text space-y-2">
                 <li>• Try lowering the shiny frequency to practice with fewer distractions</li>
                 <li>• Increase ping simulation for more time to react</li>
                 <li>• Reduce GTL activity to focus on individual shinies</li>
                 <li>• Increase snipe window to have more time to purchase shinies</li>
                 <li>• Keep your eyes focused on the refresh button area</li>
                 <li>• Practice makes perfect - reaction time improves with repetition!</li>
               </ul>
            </div>
          )}
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