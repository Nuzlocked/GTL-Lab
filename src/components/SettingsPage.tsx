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
    <div className="flex items-center justify-center px-3">
      <div className="max-w-lg w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="bg-transparent p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gtl-text mb-1">Welcome to GTL Lab!</h1>
            <p className="text-gtl-text-dim text-base">Configure your game settings and test your reaction time!</p>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="bg-transparent p-6 pt-0">
          <div className="space-y-6">
            
            {/* Preset Selector */}
            <div>
              <label className="block text-gtl-text text-lg font-medium mb-3">
                ⚙️ Quick Presets
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full bg-gtl-surface-light text-gtl-text border border-gtl-border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-gtl-text text-lg font-medium mb-3">
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
                  <label className="block text-gtl-text text-lg font-medium mb-3">
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
                  <label className="block text-gtl-text text-lg font-medium mb-3">
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
                  <label className="block text-gtl-text text-lg font-medium mb-3">
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
            <div className="bg-blue-600/30 rounded-lg p-4 shadow-lg border border-white/10">
              <h3 className="text-blue-300 text-lg font-bold mb-3">
                📊 Current Configuration
                {selectedPreset !== 'custom' && (
                  <span className="text-sm font-normal ml-2">({selectedPreset} Preset)</span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-gtl-text text-sm">
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
                <p className="text-blue-300 text-sm mt-3">
                  🔒 Settings are locked for this preset. Select "Custom Settings" to modify individual values.
                </p>
              )}
            </div>

            {/* Game Rules */}
            <div className="bg-gtl-surface-dark/50 rounded-lg p-4 shadow-lg border border-white/10">
              <h3 className="text-gtl-text text-lg font-bold mb-3">📋 Game Rules</h3>
              <ul className="text-gtl-text space-y-1 text-sm">
                <li>• Game lasts 60 seconds</li>
                <li>• Shiny Pokemon appear randomly during refreshes</li>
                <li>• Snipe window determines how long you have to purchase shinies</li>
                <li>• Reaction times are tracked for all purchase attempts</li>
                <li>• Shinies have a 10-refresh cooldown after spawning</li>
              </ul>
            </div>

            {/* Start Game Button */}
            <div className="text-center pt-3">
              <button
                onClick={handleStartGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
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