import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { COLLECTION_POKEMON, LEGENDARY_MYTHICAL, CollectionPokemon } from '../data/collection-data';

interface UserSelectedSprite {
  user_id: string;
  pokemon_name: string;
  is_shiny: boolean;
}

interface UserSpriteUnlock {
  pokemon_name: string;
  unlock_type: string;
  unlock_data: any;
}

const CollectionPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedSprite, setSelectedSprite] = useState<UserSelectedSprite | null>(null);
  const [unlockedSprites, setUnlockedSprites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<number | 'all'>('all');
  const [showShiny, setShowShiny] = useState(false);
  const [hoveredPokemon, setHoveredPokemon] = useState<string | null>(null);

  const getSpriteUrl = (pokemon: CollectionPokemon, isShiny: boolean = false) => {
    const baseUrl = process.env.REACT_APP_SUPABASE_URL;
    const spriteType = isShiny ? 'shiny' : 'normal';
    const pokemonFileName = pokemon.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
    return `${baseUrl}/storage/v1/object/public/collection-sprites/${spriteType}/${pokemonFileName}.gif`;
  };

  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load selected sprite
      const { data: selectedData, error: selectedError } = await supabase
        .from('user_selected_sprite')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (selectedError && selectedError.code !== 'PGRST116') {
        console.error('Error loading selected sprite:', selectedError);
      } else if (selectedData) {
        setSelectedSprite(selectedData);
      }

      // Load unlocked sprites
      const { data: unlocksData, error: unlocksError } = await supabase
        .from('user_sprite_unlocks')
        .select('pokemon_name')
        .eq('user_id', user.id);

      if (unlocksError) {
        console.error('Error loading sprite unlocks:', unlocksError);
      } else {
        const unlocked = new Set(unlocksData?.map(unlock => unlock.pokemon_name) || []);
        setUnlockedSprites(unlocked);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleSpriteSelect = async (pokemonName: string, isShiny: boolean) => {
    if (!user || saving) return;

    // Check if the Pokemon is locked
    const pokemon = COLLECTION_POKEMON[pokemonName];
    if (!pokemon) return;

    const isLegendary = LEGENDARY_MYTHICAL.has(pokemonName);
    if (isLegendary && !unlockedSprites.has(pokemonName)) {
      // Show locked message
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_selected_sprite')
        .upsert({
          user_id: user.id,
          pokemon_name: pokemonName,
          is_shiny: isShiny
        });

      if (error) {
        console.error('Error saving selected sprite:', error);
        alert('Failed to save sprite selection. Please try again.');
      } else {
        setSelectedSprite({
          user_id: user.id,
          pokemon_name: pokemonName,
          is_shiny: isShiny
        });
      }
    } catch (error) {
      console.error('Error updating sprite:', error);
      alert('Failed to save sprite selection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isPokemonUnlocked = (pokemonName: string) => {
    const isLegendary = LEGENDARY_MYTHICAL.has(pokemonName);
    return !isLegendary || unlockedSprites.has(pokemonName);
  };

  const isPokemonSelected = (pokemonName: string, isShiny: boolean) => {
    return selectedSprite?.pokemon_name === pokemonName && selectedSprite?.is_shiny === isShiny;
  };

  // Filter Pokemon by generation
  const filteredPokemon = Object.entries(COLLECTION_POKEMON).filter(([_, pokemon]) => {
    if (selectedGeneration === 'all') return true;
    return pokemon.generation === selectedGeneration;
  });

  // Sort Pokemon by ID
  const sortedPokemon = filteredPokemon.sort(([_, a], [__, b]) => a.id - b.id);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-xl text-white">Please log in to access your collection.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-xl text-white">Loading your collection...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 bg-gtl-deep">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gtl-text mb-2">Pokemon Collection</h1>
          <p className="text-gtl-text-dim">Select your favorite Pokemon to display as your avatar</p>
          
          {selectedSprite && (
            <div className="mt-4 p-4 bg-gtl-surface-glass backdrop-blur-xl border border-white/20 rounded-lg inline-block">
              <div className="text-gtl-text font-semibold mb-2">Current Avatar:</div>
              <div className="flex items-center justify-center space-x-4">
                <img 
                  src={getSpriteUrl(COLLECTION_POKEMON[selectedSprite.pokemon_name], selectedSprite.is_shiny)}
                  alt={selectedSprite.pokemon_name}
                  className="w-16 h-16 pixelated"
                />
                <div>
                  <div className="text-gtl-text font-medium">
                    {COLLECTION_POKEMON[selectedSprite.pokemon_name]?.name}
                  </div>
                  <div className="text-gtl-text-dim text-sm">
                    {selectedSprite.is_shiny ? 'Shiny' : 'Normal'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center space-x-2">
            <label className="text-gtl-text text-sm font-medium">Generation:</label>
            <select
              value={selectedGeneration}
              onChange={(e) => setSelectedGeneration(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-gtl-surface-dark border border-gtl-border rounded px-3 py-1 text-gtl-text text-sm"
            >
              <option value="all">All Generations</option>
              <option value={1}>Generation 1</option>
              <option value={2}>Generation 2</option>
              <option value={3}>Generation 3</option>
              <option value={4}>Generation 4</option>
              <option value={5}>Generation 5</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-gtl-text text-sm font-medium">Show Shiny:</label>
            <input
              type="checkbox"
              checked={showShiny}
              onChange={(e) => setShowShiny(e.target.checked)}
              className="rounded border-gtl-border bg-gtl-surface-dark text-gtl-accent focus:ring-gtl-accent"
            />
          </div>
        </div>

        {/* Pokemon Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4">
          {sortedPokemon.map(([pokemonName, pokemon]) => {
            const isUnlocked = isPokemonUnlocked(pokemonName);
            const isSelected = isPokemonSelected(pokemonName, showShiny);
            const isLegendary = LEGENDARY_MYTHICAL.has(pokemonName);

            return (
              <div
                key={`${pokemonName}-${showShiny ? 'shiny' : 'normal'}`}
                className={`relative group cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-gtl-accent bg-gtl-accent/20' 
                    : isUnlocked
                      ? 'border-white/20 hover:border-white/40 bg-gtl-surface-glass backdrop-blur-xl'
                      : 'border-gray-600 bg-gray-800/50'
                }`}
                onClick={() => isUnlocked && handleSpriteSelect(pokemonName, showShiny)}
                onMouseEnter={() => setHoveredPokemon(pokemonName)}
                onMouseLeave={() => setHoveredPokemon(null)}
              >
                <div className="p-2 text-center">
                  <div className="relative mb-2">
                    <img
                      src={getSpriteUrl(pokemon, showShiny)}
                      alt={pokemon.name}
                      className={`w-12 h-12 mx-auto pixelated transition-all duration-200 ${
                        isUnlocked ? '' : 'grayscale opacity-50'
                      }`}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gtl-accent rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    {isLegendary && !isUnlocked && (
                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">★</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs font-medium ${
                    isUnlocked ? 'text-gtl-text' : 'text-gray-500'
                  }`}>
                    {pokemon.name}
                  </div>
                  
                  <div className="text-xs text-gtl-text-dim">
                    #{pokemon.id.toString().padStart(3, '0')}
                  </div>
                </div>

                {/* Tooltip for locked legendary Pokemon */}
                {hoveredPokemon === pokemonName && isLegendary && !isUnlocked && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                    Can be unlocked by...
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {saving && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gtl-surface-glass backdrop-blur-xl border border-white/20 rounded-lg p-6">
              <div className="text-gtl-text text-center">Saving your selection...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionPage; 