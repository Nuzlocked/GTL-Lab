import { PokemonListing } from '../types/Pokemon';
import { POKEMON_NAMES, POKEMON_SPRITES } from './pokemon-data';
import { SeededRNG } from '../utils/seededRng';

const NATURES = [
  'Modest', 'Gentle', 'Brave', 'Impish', 'Naughty', 'Relaxed', 'Timid', 
  'Sassy', 'Hardy', 'Lax', 'Adamant', 'Jolly', 'Careful', 'Hasty', 'Naive',
  'Rash', 'Lonely', 'Quiet', 'Mild', 'Calm'
];

interface RandomGeneratorOptions {
  rng?: SeededRNG;
  gameActive?: boolean;
  allowShiny?: boolean;
  shinyFrequency?: number;
}

const generateRandomIVs = (rng?: SeededRNG) => {
  const randomInt = rng ? (max: number) => rng.randomInt(0, max) : (max: number) => Math.floor(Math.random() * max);
  
  return {
    hp: randomInt(32),
    attack: randomInt(32),
    defense: randomInt(32),
    spAttack: randomInt(32),
    spDefense: randomInt(32),
    speed: randomInt(32),
  };
};

const generateRandomPrice = (rng?: SeededRNG) => {
  const prices = [1999, 2000, 2999, 3000, 3333, 3666, 3800, 5000, 5120, 5300, 5500, 7500, 7666, 11111, 42000];
  return rng ? rng.randomChoice(prices) : prices[Math.floor(Math.random() * prices.length)];
};

const generateRandomLevel = (rng?: SeededRNG) => {
  return rng ? rng.randomInt(1, 68) : Math.floor(Math.random() * 67) + 1; // 1-67 based on the images
};

const generateRandomEndDate = (rng?: SeededRNG) => {
  const dates = ['14 days', '28 days'];
  return rng ? rng.randomChoice(dates) : dates[Math.floor(Math.random() * dates.length)];
};

const generateRandomGender = (rng?: SeededRNG): 'male' | 'female' => {
  const random = rng ? rng.random() : Math.random();
  return random < 0.5 ? 'male' : 'female';
};

let listingCounter = 0;

export const generateRandomListing = (
  gameActive: boolean = false, 
  allowShiny: boolean = true, 
  shinyFrequency: number = 5,
  rng?: SeededRNG
): PokemonListing => {
  const pokemonName = rng ? rng.randomChoice(POKEMON_NAMES) : POKEMON_NAMES[Math.floor(Math.random() * POKEMON_NAMES.length)];
  
  // Use the configurable shiny frequency rate
  const shinyRate = gameActive && allowShiny ? (shinyFrequency / 100) : 0.05; // Convert percentage to decimal
  const random = rng ? rng.random() : Math.random();
  const isShiny = allowShiny && random < shinyRate;
  
  const sprite = POKEMON_SPRITES[pokemonName];
  const price = isShiny ? 250000 : generateRandomPrice(rng);
  
  return {
    id: `listing-${++listingCounter}-${Date.now()}`,
    pokemon: {
      name: pokemonName,
      level: generateRandomLevel(rng),
      sprite: sprite,
      isShiny: isShiny,
      gender: generateRandomGender(rng),
    },
    nature: rng ? rng.randomChoice(NATURES) : NATURES[Math.floor(Math.random() * NATURES.length)],
    ivs: generateRandomIVs(rng),
    price: price,
    startDate: 'Just now',
    endDate: generateRandomEndDate(rng),
    isAvailable: true,
  };
};

export const generateInitialListings = (count: number = 10, rng?: SeededRNG): PokemonListing[] => {
  const listings: PokemonListing[] = [];
  
  // Add some fixed listings to match the images (only for non-seeded/practice mode)
  if (!rng) {
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
  }
  
  // Generate additional random listings
  for (let i = listings.length; i < count; i++) {
    listings.push(generateRandomListing(false, true, 5, rng));
  }
  
  return listings;
};

/**
 * Generate listings for refresh with seeded RNG support
 */
export const generateRefreshListings = (
  count: number,
  gameActive: boolean = false,
  allowShiny: boolean = true,
  shinyFrequency: number = 5,
  rng?: SeededRNG
): PokemonListing[] => {
  const listings: PokemonListing[] = [];
  
  for (let i = 0; i < count; i++) {
    listings.push(generateRandomListing(gameActive, allowShiny, shinyFrequency, rng));
  }
  
  return listings;
};

/**
 * Determine random listing count based on activity level with seeded RNG support
 */
export const getRandomListingCount = (maxPokemon: number, rng?: SeededRNG): number => {
  const random = rng ? rng.random() : Math.random();
  
  if (random < 0.5) {
    // 50% chance: nothing gets listed
    return 0;
  } else if (random < 0.75) {
    // 25% chance: 1 Pokemon gets listed
    return 1;
  } else if (random < 0.95) {
    // 20% chance: moderate activity (up to max-1 or 2, whichever is smaller)
    return Math.min(2, maxPokemon - 1);
  } else {
    // 5% chance: max activity
    return maxPokemon;
  }
};

/**
 * Generate initial listings with seeded RNG (alias for generateInitialListings with RNG)
 */
export const generateInitialListingsSeeded = (count: number, rng: SeededRNG): PokemonListing[] => {
  return generateInitialListings(count, rng);
};

/**
 * Generate random listing with seeded RNG (alias for generateRandomListing with RNG)
 */
export const generateRandomListingSeeded = (
  rng: SeededRNG,
  gameActive: boolean = false,
  allowShiny: boolean = true,
  shinyFrequency: number = 5
): PokemonListing => {
  return generateRandomListing(gameActive, allowShiny, shinyFrequency, rng);
};

export const TOTAL_LISTINGS = 272007; // As shown in the images 