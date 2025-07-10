import React, { useState } from 'react';
import SettingsPage from '../components/SettingsPage';
import GlobalTradeLink from '../components/GlobalTradeLink';
import ResultsPage from '../components/ResultsPage';
import { GameSettings, DEFAULT_SETTINGS } from '../types/GameSettings';

type PracticePageState = 'settings' | 'game' | 'results';

interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number;
  totalReactionTime: number;
  reactionTimes: number[];
}

const PracticePage: React.FC = () => {
  const [pageState, setPageState] = useState<PracticePageState>('settings');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameStats, setGameStats] = useState<GameStats>({
    shinySnipesCaught: 0,
    totalShiniesAppeared: 0,
    totalReactionTime: 0,
    reactionTimes: []
  });

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setPageState('game');
  };

  const handleGameComplete = (stats: GameStats) => {
    setGameStats(stats);
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
        />
    )
  }

  return null; // Should not happen
};

export default PracticePage; 