import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GameSettings, GAME_PRESETS } from '../types/GameSettings';
import { friendlyService, FriendlyChallenge, FriendlyMatch } from '../services/friendlyService';

const FriendlyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<GameSettings>(GAME_PRESETS[0].settings);
  const [selectedPreset, setSelectedPreset] = useState<string>('Normal Day');
  
  // Challenge state
  const [targetUsername, setTargetUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  // Challenge requests
  const [pendingChallenges, setPendingChallenges] = useState<FriendlyChallenge[]>([]); // includes incoming + outgoing
  const [activeMatch, setActiveMatch] = useState<FriendlyMatch | null>(null);
  
  // Loading states
  const [challengesLoading, setChallengesLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPendingChallenges();
      checkActiveMatch();
      setupRealtimeSubscriptions();
      
      // Initialize presence for friendly page
      friendlyService.initializePresence(user.id, 'friendly');
      
      // Cleanup function
      cleanupRef.current = () => {
        friendlyService.cleanup();
        friendlyService.updatePresencePage(user.id, 'home');
      };
      
      // Return cleanup function
      return cleanupRef.current;
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [user]);

  // Handle navigation state messages (like rematch confirmations)
  useEffect(() => {
    const navigationState = location.state as any;
    if (navigationState?.message) {
      showMessage(navigationState.message, navigationState.messageType || 'info');
      // Clear the navigation state to prevent the message from showing again
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const loadPendingChallenges = async () => {
    if (!user) return;
    
    try {
      const incoming = await friendlyService.getPendingChallenges(user.id);
      const outgoing = await friendlyService.getOutgoingPendingChallenges(user.id);
      setPendingChallenges([...incoming, ...outgoing]);
    } catch (error) {
      console.error('Error loading pending challenges:', error);
    } finally {
      setChallengesLoading(false);
    }
  };

  const checkActiveMatch = async () => {
    if (!user) return;
    
    try {
      const match = await friendlyService.getActiveMatch(user.id);
      if (match) {
        setActiveMatch(match);
        // If match is starting or in progress, redirect to game immediately
        if (match.match_status === 'starting' || match.match_status === 'in_progress') {
          navigate('/friendly/match', { state: { match } });
        }
      }
    } catch (error) {
      console.error('Error checking active match:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to challenges (both incoming and outgoing)
    friendlyService.subscribeToChallenges(user.id, (payload) => {
      console.log('Challenge subscription event:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newChallenge = payload.new as FriendlyChallenge;
        if (newChallenge.status !== 'pending') return;

        // Add for either direction
        setPendingChallenges(prev => {
          const exists = prev.some(c => c.id === newChallenge.id);
          if (!exists) {
            return [newChallenge, ...prev];
          }
          return prev;
        });

        if (newChallenge.challenged_id === user.id) {
          showMessage('New challenge request received!', 'info');
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedChallenge = payload.new as FriendlyChallenge;
        
        // Handle challenge status updates
        if (updatedChallenge.challenger_id === user.id) {
          // This is a challenge you sent that got updated
          if (updatedChallenge.status === 'accepted') {
            showMessage(`${updatedChallenge.challenged_username} accepted your challenge!`, 'success');

            // Proactively fetch the match and navigate (fallback in case the INSERT event is missed)
            // Add a small delay to give the match insertion time to complete after the challenge update.
            setTimeout(() => {
              checkActiveMatch();
            }, 500); // 500ms delay to allow for match insertion
          } else if (updatedChallenge.status === 'rejected') {
            showMessage(`${updatedChallenge.challenged_username} rejected your challenge.`, 'info');
          }
        } else if (updatedChallenge.challenged_id === user.id) {
          // This is a challenge to you that got updated
          // We will handle state update below in a consolidated setState
        }
        
        // Consolidated state update: if status is not pending remove; otherwise add/update
        setPendingChallenges(prev => {
          if (updatedChallenge.status !== 'pending') {
            return prev.filter(c => c.id !== updatedChallenge.id);
          }
          const exists = prev.some(c => c.id === updatedChallenge.id);
          if (exists) {
            return prev.map(c => (c.id === updatedChallenge.id ? updatedChallenge : c));
          }
          return [updatedChallenge, ...prev];
        });
      }
    });

    // Subscribe to matches
    friendlyService.subscribeToMatches(user.id, (payload) => {
      console.log('Match subscription event:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newMatch = payload.new as FriendlyMatch;
        setActiveMatch(newMatch);
        showMessage('Match is starting!', 'success');
        
        // Automatically navigate to match
        setTimeout(() => {
          navigate('/friendly/match', { state: { match: newMatch } });
        }, 1000); // Small delay to show the message
        
      } else if (payload.eventType === 'UPDATE') {
        const updatedMatch = payload.new as FriendlyMatch;
        setActiveMatch(updatedMatch);
        
        // Handle match status changes
        if (updatedMatch.match_status === 'starting' || updatedMatch.match_status === 'in_progress') {
          navigate('/friendly/match', { state: { match: updatedMatch } });
        } else if (updatedMatch.match_status === 'completed') {
          setActiveMatch(null);
          showMessage('Match completed!', 'info');
        }
      }
    });
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    
    // Different timeouts for different message types
    const timeout = type === 'error' ? 8000 : type === 'success' ? 6000 : 5000;
    setTimeout(() => setMessage(''), timeout);
  };

  const handleSliderChange = (key: keyof GameSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSelectedPreset('custom');
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

  const handleSendChallenge = async () => {
    if (!user || !targetUsername.trim()) {
      showMessage('Please enter a username', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await friendlyService.sendChallenge(
        user.id,
        user.email?.split('@')[0] || 'Player',
        targetUsername.trim(),
        settings
      );

      if (result.success) {
        showMessage(result.message, 'success');
        setTargetUsername('');
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to send challenge. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    setIsLoading(true);
    try {
      const result = await friendlyService.acceptChallenge(challengeId);
      
      if (result.success) {
        showMessage(result.message, 'success');
        // Optimistically remove from list
        setPendingChallenges(prev => prev.filter(c => c.id !== challengeId));
        // Reload challenge count/badge
        await loadPendingChallenges();
        
        if (result.match) {
          setActiveMatch(result.match);
          navigate('/friendly/match', { state: { match: result.match } });
        }
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to accept challenge. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectChallenge = async (challengeId: string) => {
    setIsLoading(true);
    try {
      const result = await friendlyService.rejectChallenge(challengeId);
      
      if (result.success) {
        showMessage(result.message, 'success');
        // Optimistically remove from list
        setPendingChallenges(prev => prev.filter(c => c.id !== challengeId));
        await loadPendingChallenges();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to reject challenge. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return '0s';
    
    const diffSeconds = Math.floor(diffMs / 1000);
    return `${diffSeconds}s`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white">Please log in to access friendly matches.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gtl-text mb-2">Friendly Matches</h1>
          <p className="text-gtl-text-dim">Challenge other players to head-to-head matches</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`rounded-lg p-4 text-center ${
            messageType === 'success' ? 'bg-green-900/20 border border-green-500 text-green-300' :
            messageType === 'error' ? 'bg-red-900/20 border border-red-500 text-red-300' :
            'bg-blue-900/20 border border-blue-500 text-blue-300'
          }`}>
            {message}
          </div>
        )}

        {/* Active Match Notice */}
        {activeMatch && (
          <div className="bg-yellow-900/20 border border-yellow-500 text-yellow-300 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <strong>Active Match:</strong> vs {activeMatch.player1_id === user.id ? activeMatch.player2_username : activeMatch.player1_username}
                <div className="text-sm opacity-75">Status: {activeMatch.match_status}</div>
              </div>
              <button
                onClick={() => navigate('/friendly/match', { state: { match: activeMatch } })}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
              >
                Join Match
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Challenge Configuration */}
          <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gtl-text mb-6">Send Challenge</h2>
              
              {/* Game Settings */}
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
                      <strong>{GAME_PRESETS.find(p => p.name === selectedPreset)?.description}</strong>
                    </p>
                  )}
                </div>

                {/* Custom Settings */}
                {selectedPreset === 'custom' && (
                  <div className="space-y-4">
                    {/* Shiny Frequency */}
                    <div>
                      <label className="block text-gtl-text text-sm font-medium mb-2">
                        ⭐ Shiny Frequency: {settings.shinyFrequency}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={settings.shinyFrequency}
                        onChange={(e) => handleSliderChange('shinyFrequency', parseInt(e.target.value))}
                        className="w-full h-2 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Ping Simulation */}
                    <div>
                      <label className="block text-gtl-text text-sm font-medium mb-2">
                        📡 Ping Simulation: {settings.pingSimulation}ms
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="25"
                        value={settings.pingSimulation}
                        onChange={(e) => handleSliderChange('pingSimulation', parseInt(e.target.value))}
                        className="w-full h-2 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* GTL Activity */}
                    <div>
                      <label className="block text-gtl-text text-sm font-medium mb-2">
                        🎯 GTL Activity: {settings.gtlActivity} max
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={settings.gtlActivity}
                        onChange={(e) => handleSliderChange('gtlActivity', parseInt(e.target.value))}
                        className="w-full h-2 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Snipe Window */}
                    <div>
                      <label className="block text-gtl-text text-sm font-medium mb-2">
                        ⏰ Snipe Window: {(settings.snipeWindow / 1000).toFixed(1)}s
                      </label>
                      <input
                        type="range"
                        min="800"
                        max="2000"
                        step="100"
                        value={settings.snipeWindow}
                        onChange={(e) => handleSliderChange('snipeWindow', parseInt(e.target.value))}
                        className="w-full h-2 bg-gtl-surface-light rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Username Input */}
                <div>
                  <label className="block text-gtl-text text-lg font-medium mb-3">
                    👤 Challenge Player
                  </label>
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full bg-gtl-surface-light text-gtl-text border border-gtl-border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                {/* Send Challenge Button */}
                <button
                  onClick={handleSendChallenge}
                  disabled={isLoading || !targetUsername.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send Challenge'}
                </button>
              </div>
            </div>
          </div>

          {/* Pending Challenges */}
          <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gtl-text mb-6">
                Challenge Requests
                {pendingChallenges.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {pendingChallenges.length}
                  </span>
                )}
              </h2>

              {challengesLoading ? (
                <div className="text-center text-gtl-text-dim py-8">Loading challenges...</div>
              ) : pendingChallenges.length === 0 ? (
                <div className="text-center text-gtl-text-dim py-8">
                  <p>No pending challenges.</p>
                  <p className="text-sm mt-2">Challenges will appear here when other players send them to you.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingChallenges.map((challenge) => {
                    const isOutgoing = challenge.challenger_id === user.id;
                    return (
                    <div key={challenge.id} className="bg-gtl-surface-dark rounded-lg p-4 border border-gtl-border">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {isOutgoing ? (
                            <>
                              <h3 className="text-gtl-text font-bold text-lg">Challenge to {challenge.challenged_username}</h3>
                              <p className="text-gtl-text-dim text-sm">Waiting for response...</p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-gtl-text font-bold text-lg">{challenge.challenger_username}</h3>
                              <p className="text-gtl-text-dim text-sm">
                                Expires in: <span className="font-mono">{formatTimeRemaining(challenge.expires_at)}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Challenge Settings Preview */}
                      <div className="bg-gtl-surface rounded p-3 mb-4">
                        <h4 className="text-gtl-text text-sm font-medium mb-2">Game Settings:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gtl-text-dim">
                          <div>Shiny Rate: {challenge.game_settings.shinyFrequency}%</div>
                          <div>Ping: {challenge.game_settings.pingSimulation}ms</div>
                          <div>Activity: {challenge.game_settings.gtlActivity} max</div>
                          <div>Window: {(challenge.game_settings.snipeWindow / 1000).toFixed(1)}s</div>
                        </div>
                      </div>

                      {!isOutgoing && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptChallenge(challenge.id)}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectChallenge(challenge.id)}
                            disabled={isLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendlyPage; 