import React, { useState } from 'react';
import SettingsPage from '../components/SettingsPage';
import GlobalTradeLink from '../components/GlobalTradeLink';
import ResultsPage from '../components/ResultsPage';
import { GameSettings, DEFAULT_SETTINGS, GAME_PRESETS } from '../types/GameSettings';
import { useAuth } from '../contexts/AuthContext';
import { recordPersonalBest } from '../services/personalBestService';

type PracticePageState = 'settings' | 'game' | 'results';

interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number;
  totalReactionTime: number;
  reactionTimes: number[];
  totalAttempts: number;
}

const PracticePage: React.FC = () => {
  const [pageState, setPageState] = useState<PracticePageState>('settings');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameStats, setGameStats] = useState<GameStats>({
    shinySnipesCaught: 0,
    totalShiniesAppeared: 0,
    totalReactionTime: 0,
    reactionTimes: [],
    totalAttempts: 0,
  });
  const [isNewBest, setIsNewBest] = useState(false);

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setPageState('game');
  };

  const handleGameComplete = async (stats: GameStats) => {
    setGameStats(stats);

    let newBestFlag = false;
    const category = getCategoryName(gameSettings);

    if (category && user) {
      try {
        newBestFlag = await recordPersonalBest(user.id, category, stats);
      } catch (error) {
        console.error('Error recording personal best', error);
      }
    }

    setIsNewBest(newBestFlag);
    setPageState('results');
  };

  const handlePlayAgain = () => {
    setPageState('game');
  };

  const handleBackToSettings = () => {
    setPageState('settings');
  };

  const handleCancel = () => {
    setPageState('settings');
  };

  const { user } = useAuth();

  const getCategoryName = (settings: GameSettings): string | null => {
    // Determine category by matching to preset settings
    const match = GAME_PRESETS.find(p => JSON.stringify(p.settings) === JSON.stringify(settings));
    if (!match) return null;
    return match.name === 'Normal Day' ? 'Normal' : match.name;
  };

  if (pageState === 'settings') {
    return <SettingsPage onStartGame={handleStartGame} />;
  }

  if (pageState === 'game') {
    return (
      <GlobalTradeLink
        gameSettings={gameSettings}
        onGameComplete={handleGameComplete}
        onCancel={handleCancel}
      />
    );
  }
  
  if (pageState === 'results') {
    return (
        <ResultsPage
            gameStats={gameStats}
            gameSettings={gameSettings}
            onPlayAgain={handlePlayAgain}
            onBackToSettings={handleBackToSettings}
            isNewPersonalBest={isNewBest}
        />
    )
  }

  return null; // Should not happen
};

export default PracticePage; 