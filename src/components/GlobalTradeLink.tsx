import React, { useState, useEffect, useCallback } from 'react';
import PokemonListings from './PokemonListings';
import { generateInitialListings, generateRandomListing } from '../data/mockData';
import { PokemonListing } from '../types/Pokemon';
import { GameSettings } from '../types/GameSettings';
import { useSpriteLoading } from '../contexts/SpriteLoadingContext';

const TABS = [
  { id: 'pokemon', label: 'Pokémon Listings' },
  { id: 'items', label: 'Item Listings' },
  { id: 'your', label: 'Your Listings' },
  { id: 'create', label: 'Create Listing' },
  { id: 'log', label: 'Trade Log' },
];

// Game state interface
interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number; // total shinies that spawned during the game
  totalReactionTime: number; // in milliseconds
  reactionTimes: number[]; // array of individual reaction times
}

interface ShinySnipe {
  listingId: string;
  appearTime: number; // timestamp when shiny appeared
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface GlobalTradeLinkProps {
  gameSettings: GameSettings;
  onGameComplete: (stats: GameStats) => void;
  onCancel: () => void;
}

const GlobalTradeLink: React.FC<GlobalTradeLinkProps> = ({ gameSettings, onGameComplete, onCancel }) => {
  // "listings" holds the authoritative GTL state that is updated automatically every
  // second. "visibleListings" is the snapshot that the player currently sees and is
  // only updated when they press the refresh button.
  const [listings, setListings] = useState<PokemonListing[]>([]); // hidden / true state
  const [visibleListings, setVisibleListings] = useState<PokemonListing[]>([]); // user-visible state
  const [activeTab, setActiveTab] = useState('pokemon');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { areSpritesLoaded } = useSpriteLoading();
  
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameTimeLeft, setGameTimeLeft] = useState(60); // 60 seconds
  const [countdown, setCountdown] = useState(3); // 3-second countdown
  const [showCountdown, setShowCountdown] = useState(true);
  const [gameStats, setGameStats] = useState<GameStats>({
    shinySnipesCaught: 0,
    totalShiniesAppeared: 0,
    totalReactionTime: 0,
    reactionTimes: []
  });
  const [activeShinySnipes, setActiveShinySnipes] = useState<Map<string, ShinySnipe>>(new Map());
  const [shinyOnCooldown, setShinyOnCooldown] = useState(false);
  // Snipe scheduling state
  const [snipesSpawned, setSnipesSpawned] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [snipeSchedule, setSnipeSchedule] = useState<number[]>([]);
  
  // Forced snipe scheduling constants (practice mode)
  const MAX_SNIPES = 12;
  const SNIPE_MIN_DELAY_MS = 2000;   // No snipe before 2s
  const SNIPE_END_BUFFER_MS = 3000;  // Buffer at end (no spawns in last 3s)
  const GAME_DURATION_MS = 60000;    // 60s game
  const SNIPE_MIN_GAP_MS = 3000;     // At least 3s between snipes

  // Utility to create a pseudo-random schedule that meets all constraints
  const createSnipeSchedule = (): number[] => {
    const schedule: number[] = [];
    const startWindow = SNIPE_MIN_DELAY_MS;
    const endWindow = GAME_DURATION_MS - SNIPE_END_BUFFER_MS;

    for (let i = 0; i < MAX_SNIPES; i++) {
      const remaining = MAX_SNIPES - i - 1;
      const earliest = i === 0 ? startWindow : schedule[i - 1] + SNIPE_MIN_GAP_MS;
      const latest = endWindow - remaining * SNIPE_MIN_GAP_MS;
      // Random time between earliest and latest
      const randomOffset = Math.random();
      const nextTime = Math.floor(earliest + randomOffset * (latest - earliest));
      schedule.push(nextTime);
    }
    return schedule;
  };
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize listings on component mount
  useEffect(() => {
    const initialListings = generateInitialListings(25); // Start with 25 listings to test pagination
    setListings(initialListings);
    setVisibleListings(initialListings);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    // Wait for sprites to be loaded before starting the countdown
    if (!areSpritesLoaded) return;

    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      // Countdown finished, start the game
      setShowCountdown(false);
      setGameActive(true);
      setGameStartTime(Date.now());
      setSnipesSpawned(0);
      setSnipeSchedule(createSnipeSchedule());
    }
  }, [countdown, showCountdown, areSpritesLoaded]);

  // Game timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameActive && gameTimeLeft > 0) {
      interval = setInterval(() => {
        setGameTimeLeft(prev => {
          if (prev <= 1) {
            // Game ended
            setGameActive(false);
            // Clear active snipes but don't remove them from listings
            setActiveShinySnipes(new Map());
            // Call onGameComplete with final stats
            setGameStats(finalStats => {
              onGameComplete(finalStats);
              return finalStats;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameActive, gameTimeLeft, onGameComplete, onCancel]);

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handlePurchase = (listingId: string) => {
    // Check if this is an expired shiny snipe during game
    if (gameActive && activeShinySnipes.has(listingId)) {
      const snipe = activeShinySnipes.get(listingId)!;
      const elapsed = Date.now() - snipe.appearTime;
      
      if (elapsed > gameSettings.snipeWindow) {
        // Shiny has expired - track the missed reaction time
        const reactionTime = elapsed;
        
        // Update game stats to include missed reaction time
        setGameStats(prev => ({
          shinySnipesCaught: prev.shinySnipesCaught, // Don't increment caught count
          totalShiniesAppeared: prev.totalShiniesAppeared, // Keep count the same
          totalReactionTime: prev.totalReactionTime + reactionTime,
          reactionTimes: [...prev.reactionTimes, reactionTime]
        }));
        
        // Remove from active snipes tracking
        setActiveShinySnipes(prev => {
          const newMap = new Map(prev);
          newMap.delete(listingId);
          return newMap;
        });
        
        addNotification("Listing not found.", 'error');
        handleDisplayRefresh(); // Reveal current state on failed purchase
        return;
      }
      
      // Successful shiny snipe
      const reactionTime = elapsed;
      
      // Update game stats
      setGameStats(prev => ({
        shinySnipesCaught: prev.shinySnipesCaught + 1,
        totalShiniesAppeared: prev.totalShiniesAppeared, // Keep count the same
        totalReactionTime: prev.totalReactionTime + reactionTime,
        reactionTimes: [...prev.reactionTimes, reactionTime]
      }));
      
      // Remove from active snipes
      setActiveShinySnipes(prev => {
        const newMap = new Map(prev);
        newMap.delete(listingId);
        return newMap;
      });
    }

    // Remove listing from both authoritative and visible states, then show success
    setListings(prev => prev.filter(listing => listing.id !== listingId));
    setVisibleListings(prev => prev.filter(listing => listing.id !== listingId));
    addNotification("You successfully purchased this listing.", 'success');
  };

  // -----------------------------
  // Generation logic (runs every second automatically)
  // -----------------------------
  const generateListings = useCallback(() => {
    // NOTE: We intentionally do NOT start the flicker effect here because this
    // function is executed automatically every second and should not visibly
    // disturb the user interface.
    
    // Remove expired shiny snipes from listings if game is active
    if (gameActive) {
      const currentTime = Date.now();
      const expiredListingIds: string[] = [];
      
      activeShinySnipes.forEach((snipe, listingId) => {
        const elapsed = currentTime - snipe.appearTime;
        if (elapsed > gameSettings.snipeWindow) {
          expiredListingIds.push(listingId);
        }
      });
      
      if (expiredListingIds.length > 0) {
        // Remove expired listings
        setListings(prev => prev.filter(listing => !expiredListingIds.includes(listing.id)));
        
        // Remove from active snipes tracking
        setActiveShinySnipes(prev => {
          const newMap = new Map(prev);
          expiredListingIds.forEach(id => newMap.delete(id));
          return newMap;
        });
      }
    }
    
    // Generate random number between 0 and 1
    const random = Math.random();
    let newListingsCount = 0;
    
    // Determine how many listings to add based on GTL activity setting
    const maxPokemon = gameSettings.gtlActivity;
    if (random < 0.5) {
      // 50% chance: nothing gets listed
      newListingsCount = 0;
    } else if (random < 0.75) {
      // 25% chance: 1 Pokemon gets listed
      newListingsCount = 1;
    } else if (random < 0.95) {
      // 20% chance: moderate activity (up to max-1 or 2, whichever is smaller)
      newListingsCount = Math.min(2, maxPokemon - 1);
    } else {
      // 5% chance: max activity
      newListingsCount = maxPokemon;
    }
    
    // Brief delay for flicker effect (using ping simulation setting), then add new listings
    setTimeout(() => {
      // Update shiny cooldown logic for game mode
      if (gameActive && shinyOnCooldown) {
        // For simplicity, we'll allow shinies again after enough time has passed
        // This could be enhanced with more complex cooldown logic if needed
        setShinyOnCooldown(false);
      }
      
      // Generate the determined number of new listings
      if (newListingsCount > 0) {
        const newListings: PokemonListing[] = [];
        // Disable random shiny spawns for practice mode — we'll schedule guaranteed snipes instead
        const canSpawnShiny = false;
        
        for (let i = 0; i < newListingsCount; i++) {
          newListings.push(generateRandomListing(gameActive, canSpawnShiny, gameSettings.shinyFrequency));
        }
        
        // If game is active, track new shiny snipes and update cooldown
        if (gameActive) {
          let shinySpawned = false;
          
          newListings.forEach(listing => {
            if (listing.pokemon.isShiny) {
              shinySpawned = true;
              const appearTime = Date.now();
              
              // Track this shiny snipe (without auto-disappear)
              setActiveShinySnipes(prev => {
                const newMap = new Map(prev);
                newMap.set(listing.id, { listingId: listing.id, appearTime });
                return newMap;
              });
              
              // Update stats for total shinies appeared
              setGameStats(prev => ({
                ...prev,
                totalShiniesAppeared: prev.totalShiniesAppeared + 1,
              }));
            }
          });
          
          // If a shiny spawned, activate cooldown
          if (shinySpawned) {
            setShinyOnCooldown(true);
          }
        }
        
        setListings(prev => [...newListings, ...prev]);
      }
      
      // No UI flicker for automatic generation
    }, gameSettings.pingSimulation);

    // -------------------------------------------
    // Guaranteed snipe spawn logic (12 total, ≥3s apart)
    // -------------------------------------------
    if (gameActive &&
        gameStartTime !== null &&
        snipesSpawned < MAX_SNIPES &&
        snipeSchedule.length === MAX_SNIPES) {
      const elapsedMs = Date.now() - gameStartTime;
      const nextThresholdMs = snipeSchedule[snipesSpawned];

      if (elapsedMs >= nextThresholdMs) {
        // Force-generate a shiny listing
        const snipeListing = generateRandomListing(true, true, 100);

        // Track shiny snipe for reaction window
        const appearTime = Date.now();
        setActiveShinySnipes(prev => {
          const newMap = new Map(prev);
          newMap.set(snipeListing.id, { listingId: snipeListing.id, appearTime });
          return newMap;
        });

        // Update stats
        setGameStats(prev => ({
          ...prev,
          totalShiniesAppeared: prev.totalShiniesAppeared + 1,
        }));

        // Add to listings and increment counter
        setListings(prev => [snipeListing, ...prev]);
        setSnipesSpawned(prev => prev + 1);
      }
    }
  }, [gameActive, shinyOnCooldown, activeShinySnipes, gameSettings, snipesSpawned, gameStartTime, snipeSchedule]);

  // ---------------------------------------
  // Manual refresh – just reveal current GTL
  // ---------------------------------------
  const handleDisplayRefresh = () => {
    // Start flicker effect so the user still experiences the network-like flash
    setIsRefreshing(true);

    setTimeout(() => {
      // Expose the latest authoritative listings to the user
      setVisibleListings(listings);
      setIsRefreshing(false);
    }, gameSettings.pingSimulation);
  };

  // ---------------------------------------
  // Automatic generation interval – create new GTL entries every 0.5s
  // ---------------------------------------
  useEffect(() => {
    const intervalId = setInterval(() => {
      generateListings();
    }, 500);

    return () => clearInterval(intervalId);
  }, [generateListings]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Display a waiting message if sprites aren't loaded yet
  if (!areSpritesLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gtl-deep">
        <div className="text-white text-3xl font-bold">
          Waiting until all sprites are loaded...
        </div>
      </div>
    );
  }

  // Display a countdown timer before the game starts
  if (showCountdown) {
    return (
      <div className="h-screen pt-20 flex items-center justify-center px-3">
        <div className="max-w-6xl w-full relative border-4 border-gray-600 rounded-lg overflow-hidden">
          {/* Countdown Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="text-center text-white">
              <div className="text-8xl font-bold animate-pulse">
                {countdown > 0 ? countdown : 'GO!'}
              </div>
              {countdown > 0 && (
                <p className="text-2xl mt-4">
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

          {/* Header */}
          <div className="bg-gtl-header rounded-t-lg p-2 border-b border-gtl-border">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold text-gtl-text">Global Trade Link</h1>
              <button className="text-gtl-text hover:text-white text-sm">×</button>
            </div>
          </div>

          {/* Game Control Panel (Placeholder) */}
          <div className="bg-gtl-surface border-b border-gtl-border p-2 h-[76px]">
            {/* This space is intentionally kept to maintain layout, countdown is in the overlay */}
          </div>

          {/* Navigation Tabs */}
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

          {/* Content Area */}
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
                <p className="text-sm">Currently showing: {activeTab === 'items' ? 'Item Listings' : 
                  activeTab === 'your' ? 'Your Listings' : 
                  activeTab === 'create' ? 'Create Listing' : 'Trade Log'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notification System */}
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
  }

  return (
    <div className="h-screen pt-20 flex flex-col items-center justify-center px-3 gap-4">
      {/* Game Control Panel */}
      <div className="max-w-6xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-2">
        <div className="flex items-center justify-between">
          <>
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
              <button 
                onClick={onCancel}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
              >
                ❌ Cancel
              </button>
            </div>
            
            <div className="text-gtl-text text-sm">
              <p className="font-semibold">🎯 Snipe Pokémon within {(gameSettings.snipeWindow / 1000).toFixed(1)}s!</p>
              <p className="text-xs text-gtl-text-dim">Settings: {gameSettings.shinyFrequency}% shiny rate • {gameSettings.pingSimulation}ms ping • {gameSettings.gtlActivity} max/refresh • {(gameSettings.snipeWindow / 1000).toFixed(1)}s window</p>
            </div>
          </>
        </div>
      </div>
      <div className="max-w-6xl w-full border-4 border-gray-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gtl-header rounded-t-lg p-2 border-b border-gtl-border">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-gtl-text">Global Trade Link</h1>
            <button className="text-gtl-text hover:text-white text-sm">×</button>
          </div>
        </div>

        {/* Game Control Panel is now above */}
        

          <>
        {/* Navigation Tabs */}
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

        {/* Content Area */}
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
              <p className="text-sm">Currently showing: {activeTab === 'items' ? 'Item Listings' : 
                activeTab === 'your' ? 'Your Listings' : 
                activeTab === 'create' ? 'Create Listing' : 'Trade Log'}</p>
            </div>
          )}
        </div>
          </>

      </div>

      {/* Notification System */}
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

export default GlobalTradeLink; 