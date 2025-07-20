import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { COLLECTION_POKEMON } from '../data/collection-data';
import { shinyService } from '../services/shinyService';

interface UserSpriteProps {
  userId?: string;
  username?: string;
  className?: string;
  showUsername?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  forceShiny?: boolean; // Force shiny display for current game
  showSparkles?: boolean; // Show sparkle effect when shiny appears
  onShinyLoad?: () => void; // Callback when shiny sprite loads
}

interface UserSelectedSprite {
  pokemon_name: string;
  is_shiny: boolean;
}

// Sparkle effect component
const SparkleEffect: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75"
          style={{
            left: `${20 + i * 10}%`,
            top: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 100}ms`,
            animationDuration: '1s'
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
};

const UserSprite: React.FC<UserSpriteProps> = ({ 
  userId, 
  username, 
  className = '', 
  showUsername = true,
  size = 'medium',
  forceShiny = false,
  showSparkles = false,
  onShinyLoad
}) => {
  const [selectedSprite, setSelectedSprite] = useState<UserSelectedSprite | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayUsername, setDisplayUsername] = useState<string>('');
  const [gameShinyStatus, setGameShinyStatus] = useState<boolean>(false);

  // Size configurations
  const sizeConfig = {
    small: { sprite: 'w-12 h-12', text: 'text-xs', container: 'gap-1' },
    medium: { sprite: 'w-16 h-16', text: 'text-sm', container: 'gap-2' },
    large: { sprite: 'w-20 h-20', text: 'text-base', container: 'gap-3' },
    xlarge: { sprite: 'w-32 h-32', text: 'text-lg', container: 'gap-4' }
  };

  const config = sizeConfig[size];

  const getSpriteUrl = (pokemonName: string, isShiny: boolean = false) => {
    const baseUrl = process.env.REACT_APP_SUPABASE_URL;
    const spriteType = isShiny ? 'shiny' : 'normal';
    const pokemonFileName = pokemonName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
    return `${baseUrl}/storage/v1/object/public/collection-sprites/${spriteType}/${pokemonFileName}.gif`;
  };

  useEffect(() => {
    const loadUserSprite = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load selected sprite
        const { data: spriteData, error: spriteError } = await supabase
          .from('user_selected_sprite')
          .select('pokemon_name, is_shiny')
          .eq('user_id', userId)
          .single();

        if (spriteError && spriteError.code !== 'PGRST116') {
          console.error('Error loading user sprite:', spriteError);
        } else if (spriteData) {
          setSelectedSprite(spriteData);
        }

        // Load game shiny status if not forced
        if (!forceShiny) {
          const gameShiny = await shinyService.getGameShinyStatus(userId);
          setGameShinyStatus(gameShiny);
        }

        // Load username if not provided
        if (!username) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();

          if (profileError) {
            console.error('Error loading username:', profileError);
            setDisplayUsername('Unknown User');
          } else {
            setDisplayUsername(profileData?.username || 'Unknown User');
          }
        } else {
          setDisplayUsername(username);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserSprite();
  }, [userId, username, forceShiny]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center ${config.container} ${className}`}>
        {showUsername && (
          <div className={`${config.text} text-gtl-text-dim font-medium`}>
            Loading...
          </div>
        )}
        <div className={`${config.sprite} bg-gray-600 rounded animate-pulse`} />
      </div>
    );
  }

  if (!selectedSprite) {
    // Show default Pikachu if no sprite is selected
    const defaultSprite = {
      pokemon_name: 'pikachu',
      is_shiny: forceShiny || gameShinyStatus
    };

    return (
      <div className={`flex flex-col items-center ${config.container} ${className}`}>
        {showUsername && (
          <div className={`${config.text} text-gtl-text font-medium`}>
            {displayUsername}
          </div>
        )}
        <div className="relative">
          <img
            src={getSpriteUrl(defaultSprite.pokemon_name, defaultSprite.is_shiny)}
            alt={defaultSprite.pokemon_name}
            className={`${config.sprite} pixelated transform scale-x-[-1]`}
            onLoad={() => {
              if (defaultSprite.is_shiny && onShinyLoad) {
                onShinyLoad();
              }
            }}
            onError={(e) => {
              // Fallback to a placeholder if sprite fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          {defaultSprite.is_shiny && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-yellow-900 text-xs font-bold">✨</span>
            </div>
          )}
          <SparkleEffect show={showSparkles && defaultSprite.is_shiny} />
        </div>
      </div>
    );
  }

  const pokemon = COLLECTION_POKEMON[selectedSprite.pokemon_name];
  const pokemonDisplayName = pokemon?.name || selectedSprite.pokemon_name;
  
  // Determine if we should show shiny - either forced, game shiny status, or user's selection
  const shouldShowShiny = forceShiny || gameShinyStatus || selectedSprite.is_shiny;

  return (
    <div className={`flex flex-col items-center ${config.container} ${className}`}>
      {showUsername && (
        <div className={`${config.text} text-gtl-text font-medium text-center`}>
          {displayUsername}
        </div>
      )}
      <div className="relative">
        <img
          src={getSpriteUrl(selectedSprite.pokemon_name, shouldShowShiny)}
          alt={pokemonDisplayName}
          className={`${config.sprite} pixelated transform scale-x-[-1] transition-transform hover:scale-105`}
          title={`${pokemonDisplayName}${shouldShowShiny ? ' (Shiny)' : ''}`}
          onLoad={() => {
            if (shouldShowShiny && onShinyLoad) {
              onShinyLoad();
            }
          }}
          onError={(e) => {
            // Fallback to non-shiny version if shiny fails
            if (shouldShowShiny) {
              e.currentTarget.src = getSpriteUrl(selectedSprite.pokemon_name, false);
            }
          }}
        />
        {shouldShowShiny && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-yellow-900 text-xs font-bold">✨</span>
          </div>
        )}
        <SparkleEffect show={showSparkles && shouldShowShiny} />
      </div>
    </div>
  );
};

export default UserSprite; 