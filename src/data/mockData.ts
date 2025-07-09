import { PokemonListing } from '../types/Pokemon';
import { POKEMON_NAMES, POKEMON_SPRITES } from './pokemon-data';

const NATURES = [
  'Modest', 'Gentle', 'Brave', 'Impish', 'Naughty', 'Relaxed', 'Timid', 
  'Sassy', 'Hardy', 'Lax', 'Adamant', 'Jolly', 'Careful', 'Hasty', 'Naive',
  'Rash', 'Lonely', 'Quiet', 'Mild', 'Calm'
];

// const POKEMON_NAMES = Object.keys(POKEMON_SPRITES); // No longer needed

const generateRandomIVs = () => ({
  hp: Math.floor(Math.random() * 32),
  attack: Math.floor(Math.random() * 32),
  defense: Math.floor(Math.random() * 32),
  spAttack: Math.floor(Math.random() * 32),
  spDefense: Math.floor(Math.random() * 32),
  speed: Math.floor(Math.random() * 32),
});

const generateRandomPrice = () => {
  const prices = [1999, 2000, 2999, 3000, 3333, 3666, 3800, 5000, 5120, 5300, 5500, 7500, 7666, 11111, 42000];
  return prices[Math.floor(Math.random() * prices.length)];
};

const generateRandomLevel = () => Math.floor(Math.random() * 67) + 1; // 1-67 based on the images

const generateRandomEndDate = () => {
  const dates = ['14 days', '28 days'];
  return dates[Math.floor(Math.random() * dates.length)];
};

const generateRandomGender = (): 'male' | 'female' => {
  return Math.random() < 0.5 ? 'male' : 'female';
};

let listingCounter = 0;

export const generateRandomListing = (gameActive: boolean = false, allowShiny: boolean = true, shinyFrequency: number = 5): PokemonListing => {
  const pokemonName = POKEMON_NAMES[Math.floor(Math.random() * POKEMON_NAMES.length)];
  
  // Use the configurable shiny frequency rate
  const shinyRate = gameActive && allowShiny ? (shinyFrequency / 100) : 0.05; // Convert percentage to decimal
  const isShiny = allowShiny && Math.random() < shinyRate;
  
  const sprite = POKEMON_SPRITES[pokemonName];
  const price = isShiny ? 250000 : generateRandomPrice();
  
  return {
    id: `listing-${++listingCounter}-${Date.now()}`,
    pokemon: {
      name: pokemonName,
      level: generateRandomLevel(),
      sprite: sprite,
      isShiny: isShiny,
      gender: generateRandomGender(),
    },
    nature: NATURES[Math.floor(Math.random() * NATURES.length)],
    ivs: generateRandomIVs(),
    price: price,
    startDate: 'Just now',
    endDate: generateRandomEndDate(),
    isAvailable: true,
  };
};

export const generateInitialListings = (count: number = 10): PokemonListing[] => {
  const listings: PokemonListing[] = [];
  
  // Add some fixed listings to match the images
  listings.push({
    id: 'listing-1',
    pokemon: { name: 'Ditto', level: 33, sprite: POKEMON_SPRITES['Ditto'], isShiny: false, gender: 'male' },
    nature: 'Modest',
    ivs: { hp: 11, attack: 7, defense: 25, spAttack: 21, spDefense: 28, speed: 16 },
    price: 5300,
    startDate: 'Just now',
    endDate: '14 days',
    isAvailable: true,
  });
  
  listings.push({
    id: 'listing-2',
    pokemon: { name: 'Ditto', level: 41, sprite: POKEMON_SPRITES['Ditto'], isShiny: false, gender: 'female' },
    nature: 'Gentle',
    ivs: { hp: 15, attack: 15, defense: 15, spAttack: 27, spDefense: 17, speed: 30 },
    price: 5120,
    startDate: 'Just now',
    endDate: '14 days',
    isAvailable: true,
  });
  
  listings.push({
    id: 'listing-3',
    pokemon: { name: 'Shroomish', level: 6, sprite: POKEMON_SPRITES['Shroomish'], isShiny: false, gender: 'male' },
    nature: 'Brave',
    ivs: { hp: 12, attack: 5, defense: 15, spAttack: 25, spDefense: 24, speed: 12 },
    price: 2999,
    startDate: 'Just now',
    endDate: '14 days',
    isAvailable: true,
  });
  
  listings.push({
    id: 'listing-4',
    pokemon: { name: 'Tyranitar', level: 55, sprite: POKEMON_SPRITES['Tyranitar'], isShiny: false, gender: 'female' },
    nature: 'Impish',
    ivs: { hp: 6, attack: 15, defense: 15, spAttack: 27, spDefense: 29, speed: 16 },
    price: 5000,
    startDate: 'Just now',
    endDate: '14 days',
    isAvailable: true,
  });
  
  // Generate additional random listings
  for (let i = listings.length; i < count; i++) {
    listings.push(generateRandomListing());
  }
  
  return listings;
};

export const TOTAL_LISTINGS = 272007; // As shown in the images 