import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { POKEMON_SPRITES } from '../data/pokemon-data';

interface SpriteLoadingContextType {
  areSpritesLoaded: boolean;
  startPreloading: () => void;
}

const SpriteLoadingContext = createContext<SpriteLoadingContextType | undefined>(undefined);

export const useSpriteLoading = () => {
  const context = useContext(SpriteLoadingContext);
  if (!context) {
    throw new Error('useSpriteLoading must be used within a SpriteLoadingProvider');
  }
  return context;
};

interface SpriteLoadingProviderProps {
  children: ReactNode;
}

// Helper function to preload a single image and return a promise
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });
};

export const SpriteLoadingProvider: React.FC<SpriteLoadingProviderProps> = ({ children }) => {
  const [areSpritesLoaded, setAreSpritesLoaded] = useState(false);

  const startPreloading = useCallback(async () => {
    // Prevent re-triggering if already loaded
    if (areSpritesLoaded) return;

    console.log('Starting sprite preloading...');
    try {
      const allSpriteUrls = Object.values(POKEMON_SPRITES);
      await Promise.all(allSpriteUrls.map(preloadImage));
      setAreSpritesLoaded(true);
      console.log('All sprites have been successfully preloaded and cached.');
    } catch (error) {
      console.error('An error occurred during sprite preloading:', error);
      // Optionally, you could set an error state here
    }
  }, [areSpritesLoaded]);

  return (
    <SpriteLoadingContext.Provider value={{ areSpritesLoaded, startPreloading }}>
      {children}
    </SpriteLoadingContext.Provider>
  );
}; 