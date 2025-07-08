import React, { useState } from 'react';
import { GameSettings, GAME_PRESETS } from '../types/GameSettings';

interface SettingsPageProps {
  onStartGame: (settings: GameSettings) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onStartGame }) => {
  const [settings, setSettings] = useState<GameSettings>(GAME_PRESETS[0].settings); // Start with Normal Day preset
  const [selectedPreset, setSelectedPreset] = useState<string>('Normal Day');

  const handleSliderChange = (key: keyof GameSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSelectedPreset('custom'); // Mark as custom when manually adjusting
  };

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName !== 'custom') {
      const preset = GAME_PRESETS.find(p => p.name === presetName);
      if (preset) {
        setSettings(preset.settings);
      }
    }
  };

  const handleStartGame = () => {
    onStartGame(settings);
  };

  return (
    <div className="min-h-screen p-3 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gtl-header rounded-t-lg p-6 border-b border-gtl-border">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gtl-text mb-2">Welcome to GTLlab!</h1>
            <p className="text-gtl-text-dim text-lg">Configure your game settings and test your reaction time!</p>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="bg-gtl-surface rounded-b-lg p-8">
          <div className="space-y-8">
            
            {/* Preset Selector */}
            <div>
              <label className="block text-gtl-text text-xl font-medium mb-4">
                ⚙️ Quick Presets
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full bg-gtl-surface-light text-gtl-text border border-gtl-border rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {GAME_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
                <option value="custom">Custom Settings</option>
              </select>
              {selectedPreset !== 'custom' && (
                <p className="text-gtl-text-dim text-sm mt-2">
                  <strong>{GAME_PRESETS.find(p => p.name === selectedPreset)?.description}</strong> Settings are automatically configured for this scenario.
                </p>
              )}
              {selectedPreset === 'custom' && (
                <p className="text-gtl-text-dim text-sm mt-2">
                  Customize your own settings using the sliders below.
                </p>
              )}
            </div>

            {/* Individual Settings - Only show for custom */}
            {selectedPreset === 'custom' && (
              <>
                {/* Shiny Frequency Setting */}
                <div>
                  <label className="block text-gtl-text text-xl font-medium mb-4">
                    ⭐ Shiny Frequency: {settings.shinyFrequency}%
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={settings.shinyFrequency}
                      onChange={(e) => handleSliderChange('shinyFrequency', parseInt(e.target.value))}
                      className="w-full h-3 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-gtl-text-dim text-sm mt-2">
                      <span>1% (Rare)</span>
                      <span>25% (Common)</span>
                    </div>
                  </div>
                  <p className="text-gtl-text-dim text-sm mt-2">
                    Higher percentages mean shinies appear more frequently during refreshes.
                  </p>
                </div>

                {/* Ping Simulation Setting */}
                <div>
                  <label className="block text-gtl-text text-xl font-medium mb-4">
                    📡 Ping Simulation: {settings.pingSimulation}ms
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="25"
                      value={settings.pingSimulation}
                      onChange={(e) => handleSliderChange('pingSimulation', parseInt(e.target.value))}
                      className="w-full h-3 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-gtl-text-dim text-sm mt-2">
                      <span>50ms (Fast)</span>
                      <span>500ms (Slow)</span>
                    </div>
                  </div>
                  <p className="text-gtl-text-dim text-sm mt-2">
                    Simulates network latency - how long the refresh flicker effect lasts.
                  </p>
                </div>

                {/* GTL Activity Setting */}
                <div>
                  <label className="block text-gtl-text text-xl font-medium mb-4">
                    🎯 GTL Activity Level: {settings.gtlActivity} max Pokemon per refresh
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={settings.gtlActivity}
                      onChange={(e) => handleSliderChange('gtlActivity', parseInt(e.target.value))}
                      className="w-full h-3 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-gtl-text-dim text-sm mt-2">
                      <span>1 (Quiet)</span>
                      <span>5 (Busy)</span>
                    </div>
                  </div>
                  <p className="text-gtl-text-dim text-sm mt-2">
                    Controls how many Pokemon can appear in a single refresh.
                  </p>
                </div>

                {/* Snipe Window Setting */}
                <div>
                  <label className="block text-gtl-text text-xl font-medium mb-4">
                    ⏰ Snipe Window: {(settings.snipeWindow / 1000).toFixed(1)}s
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="800"
                      max="2000"
                      step="100"
                      value={settings.snipeWindow}
                      onChange={(e) => handleSliderChange('snipeWindow', parseInt(e.target.value))}
                      className="w-full h-3 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-gtl-text-dim text-sm mt-2">
                      <span>0.8s (Lightning)</span>
                      <span>2.0s (Relaxed)</span>
                    </div>
                  </div>
                  <p className="text-gtl-text-dim text-sm mt-2">
                    How long you have to purchase a shiny before it expires.
                  </p>
                </div>
              </>
            )}

            {/* Settings Summary */}
            <div className="bg-blue-600 bg-opacity-20 rounded-lg p-6 border border-blue-600">
              <h3 className="text-blue-400 text-xl font-bold mb-4">
                📊 Current Configuration
                {selectedPreset !== 'custom' && (
                  <span className="text-sm font-normal ml-2">({selectedPreset} Preset)</span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-gtl-text">
                <div>
                  <span className="text-gtl-text-dim">Shiny Rate:</span>
                  <span className="ml-2 font-bold">{settings.shinyFrequency}%</span>
                </div>
                <div>
                  <span className="text-gtl-text-dim">Ping:</span>
                  <span className="ml-2 font-bold">{settings.pingSimulation}ms</span>
                </div>
                <div>
                  <span className="text-gtl-text-dim">Activity:</span>
                  <span className="ml-2 font-bold">{settings.gtlActivity} max</span>
                </div>
                <div>
                  <span className="text-gtl-text-dim">Window:</span>
                  <span className="ml-2 font-bold">{(settings.snipeWindow / 1000).toFixed(1)}s</span>
                </div>
              </div>
              {selectedPreset !== 'custom' && (
                <p className="text-blue-300 text-sm mt-4">
                  🔒 Settings are locked for this preset. Select "Custom Settings" to modify individual values.
                </p>
              )}
            </div>

            {/* Game Rules */}
            <div className="bg-gtl-surface-light rounded-lg p-6 border border-gtl-border">
              <h3 className="text-gtl-text text-xl font-bold mb-4">📋 Game Rules</h3>
              <ul className="text-gtl-text space-y-2 text-lg">
                <li>• Game lasts 60 seconds</li>
                <li>• Shiny Pokemon appear randomly during refreshes</li>
                <li>• Snipe window determines how long you have to purchase shinies</li>
                <li>• Reaction times are tracked for all purchase attempts</li>
                <li>• Shinies have a 10-refresh cooldown after spawning</li>
              </ul>
            </div>

            {/* Start Game Button */}
            <div className="text-center pt-4">
              <button
                onClick={handleStartGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-lg text-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 