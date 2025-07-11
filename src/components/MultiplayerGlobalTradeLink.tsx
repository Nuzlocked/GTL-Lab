import React, { useState, useEffect, useCallback } from 'react';
import PokemonListings from './PokemonListings';
import { generateInitialListingsSeeded, generateRandomListingSeeded } from '../data/mockData';
import { PokemonListing } from '../types/Pokemon';
import { GameSettings } from '../types/GameSettings';
import { useSpriteLoading } from '../contexts/SpriteLoadingContext';
import { useAuth } from '../contexts/AuthContext';
import { friendlyService, FriendlyMatch, GameStats } from '../services/friendlyService';
import { SeededRNG } from '../utils/seededRng';

const TABS = [
  { id: 'pokemon', label: 'Pokémon Listings' },
  { id: 'items', label: 'Item Listings' },
  { id: 'your', label: 'Your Listings' },
  { id: 'create', label: 'Create Listing' },
  { id: 'log', label: 'Trade Log' },
];

interface ShinySnipe {
  listingId: string;
  appearTime: number;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface MultiplayerGlobalTradeLinkProps {
  match: FriendlyMatch;
  onGameComplete: (stats: GameStats) => void;
  onCancel: () => void;
}

const MultiplayerGlobalTradeLink: React.FC<MultiplayerGlobalTradeLinkProps> = ({ 
  match, 
  onGameComplete, 
  onCancel 
}) => {
  const { user } = useAuth();
  // listings = authoritative GTL state, visibleListings = what user currently sees
  const [listings, setListings] = useState<PokemonListing[]>([]);
  const [visibleListings, setVisibleListings] = useState<PokemonListing[]>([]);
  const [activeTab, setActiveTab] = useState('pokemon');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { areSpritesLoaded } = useSpriteLoading();
  
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameTimeLeft, setGameTimeLeft] = useState(60);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(true);
  const [gameStats, setGameStats] = useState<GameStats>({
    shinySnipesCaught: 0,
    totalShiniesAppeared: 0,
    totalReactionTime: 0,
    reactionTimes: []
  });
  const [activeShinySnipes, setActiveShinySnipes] = useState<Map<string, ShinySnipe>>(new Map());
  const [shinyOnCooldown, setShinyOnCooldown] = useState(false);
  
  // Multiplayer state
  const [rng, setRng] = useState<SeededRNG | null>(null);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [matchStatus, setMatchStatus] = useState(match.match_status);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize RNG and opponent info
  useEffect(() => {
    const seededRng = new SeededRNG(match.rng_seed);
    setRng(seededRng);
    
    // Set opponent username
    const opponent = match.player1_id === user?.id ? match.player2_username : match.player1_username;
    setOpponentUsername(opponent);
    
    // Initialize listings with seeded RNG
    const initialListings = generateInitialListingsSeeded(25, seededRng);
    setListings(initialListings);
    setVisibleListings(initialListings);
    
    // No longer immediately update match status; we'll set it once countdown finishes
  }, [match, user]);

  // Derive countdown / gameTimeLeft from server start time if available
  useEffect(() => {
    if (!rng) return;

    const GAME_DURATION = 60; // seconds
    const COUNTDOWN_DEFAULT = 3; // seconds

    if (match.started_at) {
      const startTimestamp = new Date(match.started_at).getTime();
      const now = Date.now();

      const elapsedSinceStart = Math.floor((now - startTimestamp) / 1000);

      if (elapsedSinceStart < 0) {
        // Match hasn't started yet – show countdown until start
        setShowCountdown(true);
        setCountdown(Math.abs(elapsedSinceStart));
      } else if (elapsedSinceStart < GAME_DURATION) {
        // Match already in progress – skip countdown
        setShowCountdown(false);
        setGameActive(true);
        setGameTimeLeft(GAME_DURATION - elapsedSinceStart);
      } else {
        // Match time elapsed – complete game immediately
        setShowCountdown(false);
        setGameActive(false);
        setGameTimeLeft(0);
        handleGameComplete();
      }
    } else {
      // No start time yet – keep default countdown
      setCountdown(COUNTDOWN_DEFAULT);
      setShowCountdown(true);
    }
  }, [match.started_at, rng]);

  // When countdown ends, start game and set match in_progress (only once)
  useEffect(() => {
    if (!showCountdown && gameActive && matchStatus === 'starting') {
      friendlyService.updateMatchStatus(match.id, 'in_progress');
      setMatchStatus('in_progress');
    }
  }, [showCountdown, gameActive, matchStatus, match.id]);

  // Removed child-level match subscription to avoid clobbering global subscription

  // Countdown timer effect
  useEffect(() => {
    if (!areSpritesLoaded || !rng) return;

    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      setGameActive(true);
    }
  }, [countdown, showCountdown, areSpritesLoaded, rng]);

  // Game timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameActive && gameTimeLeft > 0) {
      interval = setInterval(() => {
        setGameTimeLeft(prev => {
          if (prev <= 1) {
            setGameActive(false);
            setActiveShinySnipes(new Map());
            handleGameComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameActive, gameTimeLeft]);

  const handleGameComplete = async () => {
    if (!user) return;
    
    setWaitingForOpponent(true);
    
    try {
      const result = await friendlyService.submitMatchResults(match.id, user.id, gameStats);
      
      if (result.success) {
        onGameComplete(gameStats);
      } else {
        addNotification('Failed to submit results', 'error');
      }
    } catch (error) {
      console.error('Error submitting match results:', error);
      addNotification('Error submitting results', 'error');
    }
  };

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handlePurchase = (listingId: string) => {
    if (gameActive && activeShinySnipes.has(listingId)) {
      const snipe = activeShinySnipes.get(listingId)!;
      const elapsed = Date.now() - snipe.appearTime;
      
      if (elapsed > match.game_settings.snipeWindow) {
        const reactionTime = elapsed;
        
        setGameStats(prev => ({
          shinySnipesCaught: prev.shinySnipesCaught,
          totalShiniesAppeared: prev.totalShiniesAppeared,
          totalReactionTime: prev.totalReactionTime + reactionTime,
          reactionTimes: [...prev.reactionTimes, reactionTime]
        }));
        
        setActiveShinySnipes(prev => {
          const newMap = new Map(prev);
          newMap.delete(listingId);
          return newMap;
        });
        
        addNotification("Listing not found.", 'error');
        handleDisplayRefresh();
        return;
      }
      
      const reactionTime = elapsed;
      
      setGameStats(prev => ({
        shinySnipesCaught: prev.shinySnipesCaught + 1,
        totalShiniesAppeared: prev.totalShiniesAppeared,
        totalReactionTime: prev.totalReactionTime + reactionTime,
        reactionTimes: [...prev.reactionTimes, reactionTime]
      }));
      
      setActiveShinySnipes(prev => {
        const newMap = new Map(prev);
        newMap.delete(listingId);
        return newMap;
      });
    }

    setListings(prev => prev.filter(listing => listing.id !== listingId));
    setVisibleListings(prev => prev.filter(listing => listing.id !== listingId));
    addNotification("You successfully purchased this listing.", 'success');
  };

  // -----------------------------
  // Generation logic (runs every second)
  // -----------------------------
  const generateListings = useCallback(() => {
    if (!rng) return;

    // Remove expired shiny snipes
    if (gameActive) {
      const currentTime = Date.now();
      const expiredListingIds: string[] = [];

      activeShinySnipes.forEach((snipe, listingId) => {
        const elapsed = currentTime - snipe.appearTime;
        if (elapsed > match.game_settings.snipeWindow) {
          expiredListingIds.push(listingId);
        }
      });

      if (expiredListingIds.length > 0) {
        setListings(prev => prev.filter(listing => !expiredListingIds.includes(listing.id)));
        setVisibleListings(prev => prev.filter(listing => !expiredListingIds.includes(listing.id)));
      }
    }

    // Generate new listings using seeded RNG
    const random = rng.random();
    let newListingsCount = 0;
    const maxPokemon = match.game_settings.gtlActivity;
    if (random < 0.5) {
      newListingsCount = 0;
    } else if (random < 0.75) {
      newListingsCount = 1;
    } else if (random < 0.95) {
      newListingsCount = Math.min(2, maxPokemon - 1);
    } else {
      newListingsCount = maxPokemon;
    }

    setTimeout(() => {
      if (gameActive && shinyOnCooldown) {
        setShinyOnCooldown(false);
      }

      if (newListingsCount > 0) {
        const newListings: PokemonListing[] = [];
        const canSpawnShiny = gameActive ? !shinyOnCooldown : true;

        for (let i = 0; i < newListingsCount; i++) {
          newListings.push(generateRandomListingSeeded(rng, gameActive, canSpawnShiny, match.game_settings.shinyFrequency));
        }

        if (gameActive) {
          let shinySpawned = false;

          newListings.forEach(listing => {
            if (listing.pokemon.isShiny) {
              shinySpawned = true;
              const appearTime = Date.now();
              setActiveShinySnipes(prev => {
                const newMap = new Map(prev);
                newMap.set(listing.id, { listingId: listing.id, appearTime });
                return newMap;
              });
              setGameStats(prev => ({
                ...prev,
                totalShiniesAppeared: prev.totalShiniesAppeared + 1,
              }));
            }
          });

          if (shinySpawned) {
            setShinyOnCooldown(true);
          }
        }

        setListings(prev => [...newListings, ...prev]);
      }
    }, match.game_settings.pingSimulation);
  }, [rng, gameActive, activeShinySnipes, shinyOnCooldown, match.game_settings]);

  // ---------------------------------------
  // Manual refresh – reveal current GTL state
  // ---------------------------------------
  const handleDisplayRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setVisibleListings(listings);
      setIsRefreshing(false);
    }, match.game_settings.pingSimulation);
  };

  // Automatic generation interval – generate every 0.5s
  useEffect(() => {
    const intervalId = setInterval(() => {
      generateListings();
    }, 500);
    return () => clearInterval(intervalId);
  }, [generateListings]);

  // (Old) refresh button now mapped directly to handleDisplayRefresh

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!areSpritesLoaded || !rng) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gtl-deep">
        <div className="text-white text-3xl font-bold">
          Loading multiplayer match...
        </div>
        <div className="text-white text-lg mt-2">
          Playing against: {opponentUsername}
        </div>
      </div>
    );
  }

  if (waitingForOpponent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gtl-deep">
        <div className="text-white text-3xl font-bold">
          Waiting for {opponentUsername} to finish...
        </div>
        <div className="text-white text-lg mt-2">
          Your stats have been submitted!
        </div>
      </div>
    );
  }

  if (showCountdown) {
    return (
      <div className="h-screen pt-20 flex items-center justify-center px-3">
        <div className="max-w-6xl w-full relative border-4 border-gray-600 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="text-center text-white">
              <div className="text-6xl font-bold animate-pulse">
                {countdown > 0 ? countdown : 'GO!'}
              </div>
              <div className="text-2xl mt-2">
                Playing against: {opponentUsername}
              </div>
              {countdown > 0 && (
                <p className="text-xl mt-4">
                  Get ready to snipe shinies!
                </p>
              )}
              <button
                onClick={onCancel}
                className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                ❌ Cancel
              </button>
            </div>
          </div>

          <div className="bg-gtl-header rounded-t-lg p-2 border-b border-gtl-border">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold text-gtl-text">Global Trade Link - Multiplayer</h1>
              <button className="text-gtl-text hover:text-white text-sm">×</button>
            </div>
          </div>

          <div className="bg-gtl-surface border-b border-gtl-border p-2 h-[76px]">
            {/* Countdown overlay content */}
          </div>

          <div className="bg-gtl-surface border-b border-gtl-border">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-1 text-sm font-medium border-r border-gtl-border ${
                    activeTab === tab.id
                      ? 'bg-gtl-primary text-white'
                      : 'bg-gtl-surface-light text-gtl-text hover:bg-gtl-primary hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gtl-surface rounded-b-lg">
            {activeTab === 'pokemon' && (
              <PokemonListings 
                listings={visibleListings} 
                onPurchase={handlePurchase} 
                onRefresh={handleDisplayRefresh} 
                isRefreshing={isRefreshing}
                gameActive={gameActive}
                activeShinySnipes={activeShinySnipes}
              />
            )}
            {activeTab !== 'pokemon' && (
              <div className="p-4 text-center text-gtl-text-dim">
                <p className="text-sm">This section is not yet implemented.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen pt-20 flex flex-col items-center justify-center px-3 gap-4">
      <div className="max-w-6xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white font-bold py-1 px-2 rounded text-sm">
              ⏱️ Time: {formatTime(gameTimeLeft)}
            </div>
            <div className="bg-blue-600 text-white font-bold py-1 px-2 rounded text-sm">
              ⭐ Snipes: {gameStats.shinySnipesCaught}
            </div>
            <div className="bg-purple-600 text-white font-bold py-1 px-2 rounded text-sm">
              🎯 Attempts: {gameStats.reactionTimes.length}
            </div>
            <div className="bg-green-600 text-white font-bold py-1 px-2 rounded text-sm">
              👤 vs {opponentUsername}
            </div>
            <button 
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              ❌ Cancel
            </button>
          </div>
          
          <div className="text-gtl-text text-sm text-right">
            <p className="font-semibold">🎯 Snipe Pokémon within {(match.game_settings.snipeWindow / 1000).toFixed(1)}s!</p>
            <p className="text-xs text-gtl-text-dim">
              Multiplayer Match • Same seed for fair play
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl w-full border-4 border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gtl-header rounded-t-lg p-2 border-b border-gtl-border">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-gtl-text">Global Trade Link - Multiplayer</h1>
            <button className="text-gtl-text hover:text-white text-sm">×</button>
          </div>
        </div>

        <div className="bg-gtl-surface border-b border-gtl-border">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 text-sm font-medium border-r border-gtl-border ${
                  activeTab === tab.id
                    ? 'bg-gtl-primary text-white'
                    : 'bg-gtl-surface-light text-gtl-text hover:bg-gtl-primary hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gtl-surface rounded-b-lg">
          {activeTab === 'pokemon' && (
            <PokemonListings 
              listings={visibleListings} 
              onPurchase={handlePurchase} 
              onRefresh={handleDisplayRefresh} 
              isRefreshing={isRefreshing}
              gameActive={gameActive}
              activeShinySnipes={activeShinySnipes}
            />
          )}
          {activeTab !== 'pokemon' && (
            <div className="p-4 text-center text-gtl-text-dim">
              <p className="text-sm">This section is not yet implemented.</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`mb-2 px-3 py-2 rounded-lg text-white font-medium text-sm shadow-lg animate-fade-in bg-gtl-uniform-bg`}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiplayerGlobalTradeLink; 