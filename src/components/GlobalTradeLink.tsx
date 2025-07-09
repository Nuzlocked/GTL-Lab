import React, { useState, useEffect } from 'react';
import PokemonListings from './PokemonListings';
import { generateInitialListings, generateRandomListing } from '../data/mockData';
import { PokemonListing } from '../types/Pokemon';
import { GameSettings } from '../types/GameSettings';

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
  const [listings, setListings] = useState<PokemonListing[]>([]);
  const [activeTab, setActiveTab] = useState('pokemon');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize listings on component mount
  useEffect(() => {
    const initialListings = generateInitialListings(25); // Start with 25 listings to test pagination
    setListings(initialListings);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      // Countdown finished, start the game
      setShowCountdown(false);
      setGameActive(true);
    }
  }, [countdown, showCountdown]);

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



  // Add notification function
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
        handleRefresh(); // Trigger refresh on failed purchase
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

    // Remove listing and show success message
    setListings(prev => prev.filter(listing => listing.id !== listingId));
    addNotification("You successfully purchased this listing.", 'success');
  };

  // Enhanced refresh function with game mechanics
  const handleRefresh = () => {
    // Start flicker effect
    setIsRefreshing(true);
    
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
        const canSpawnShiny = gameActive ? !shinyOnCooldown : true;
        
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
              
              // Increment total shinies appeared counter
              setGameStats(prev => ({
                ...prev,
                totalShiniesAppeared: prev.totalShiniesAppeared + 1
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
      
      // End flicker effect
      setIsRefreshing(false);
    }, gameSettings.pingSimulation); // Use ping simulation setting for flicker duration
  };

  const tabs = [
    { id: 'pokemon', label: 'Pokémon Listings', active: true },
    { id: 'items', label: 'Item Listings', active: false },
    { id: 'your', label: 'Your Listings', active: false },
    { id: 'create', label: 'Create Listing', active: false },
    { id: 'trade', label: 'Trade Log', active: false },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  return (
    <div className="h-screen pt-20 flex items-center justify-center px-3">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="bg-gtl-header rounded-t-lg p-2 border-b border-gtl-border">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-gtl-text">Global Trade Link</h1>
            <button className="text-gtl-text hover:text-white text-sm">×</button>
          </div>
        </div>

        {/* Game Control Panel */}
        <div className="bg-gtl-surface border-b border-gtl-border p-2">
          <div className="flex items-center justify-between">
            {showCountdown ? (
              // Countdown Display
              <div className="flex items-center justify-center w-full">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 animate-countdown ${countdown > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {countdown > 0 ? countdown : 'GO!'}
                  </div>
                  <p className="text-gtl-text text-sm">
                    {countdown > 0 ? 'Get ready to snipe shinies!' : 'Game starting...'}
                  </p>
                  <button 
                    onClick={onCancel}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Game Controls
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
                  <p className="font-semibold">🎯 Catch shiny Pokémon within {(gameSettings.snipeWindow / 1000).toFixed(1)}s!</p>
                  <p className="text-xs text-gtl-text-dim">Settings: {gameSettings.shinyFrequency}% shiny rate • {gameSettings.pingSimulation}ms ping • {gameSettings.gtlActivity} max/refresh • {(gameSettings.snipeWindow / 1000).toFixed(1)}s window</p>
                </div>
              </>
            )}
          </div>
        </div>

        {!showCountdown && (
          <>
            {/* Navigation Tabs */}
            <div className="bg-gtl-surface border-b border-gtl-border">
              <div className="flex">
                {tabs.map((tab) => (
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
                  listings={listings} 
                  onPurchase={handlePurchase} 
                  onRefresh={handleRefresh} 
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
        )}

        {showCountdown && (
          <div className="bg-gtl-surface rounded-b-lg h-48 flex items-center justify-center">
            <div className="text-center text-gtl-text-dim">
              <div className="text-2xl mb-2">🎮</div>
              <p className="text-sm">Preparing your GTL experience...</p>
              <p className="text-xs mt-1">Settings: {gameSettings.shinyFrequency}% shiny • {(gameSettings.snipeWindow / 1000).toFixed(1)}s window • {gameSettings.gtlActivity} max/refresh</p>
            </div>
          </div>
        )}
      </div>

      {/* Notification System */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
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