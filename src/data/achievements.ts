/**
 * POKEMON UNLOCK REQUIREMENTS
 * 
 * Complete list of Legendary/Mythical Pokemon that need achievements:
 * 
 * Gen 1: mew, mewtwo, articuno, zapdos, moltres
 * Gen 2: lugia, ho-oh, celebi, raikou, entei, suicune  
 * Gen 3: regirock, regice, registeel, latias, latios, kyogre, groudon, rayquaza, jirachi, deoxys
 * Gen 4: uxie, mesprit, azelf, dialga, palkia, heatran, regigigas, giratina, cresselia, phione, manaphy, darkrai, shaymin, arceus
 * Gen 5: victini, cobalion, terrakion, virizion, tornadus, thundurus, reshiram, zekrom, landorus, kyurem, keldeo, meloetta, genesect
 * 
 * Requirement Types:
 * - game_stats: Based on game performance (speed, accuracy, etc.)
 * - collection: Based on collection progress (shinies, Pokemon count, etc.)  
 * - special: Unique or complex requirements
 * - time_based: Based on play time or daily activities
 * - streak: Based on consecutive achievements
 * - challenge: Special challenge modes or conditions
 */

export interface PokemonUnlockRequirement {
  pokemon_name: string;
  description: string;
  type: 'game_stats' | 'collection' | 'special' | 'time_based' | 'streak' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  // Requirements will be defined when implementing the logic
  requirements?: any;
}

// Pokemon unlock requirements - key by pokemon name
export const POKEMON_UNLOCK_REQUIREMENTS: Record<string, PokemonUnlockRequirement> = {
  // ===== GENERATION 1 LEGENDARIES =====
  
  'mew': {
    pokemon_name: 'mew',
    description: 'Achieve 12/12 snipes on all 3 Practice Categories\n\n(Normal, Busy, and Dump)',
    type: 'collection',
    difficulty: 'medium'
  },
  
  'mewtwo': {
    pokemon_name: 'mewtwo',
    description: 'Achieve 12/12 snipes on all 3 Practice Categories\n\nAND\n\nAverage reaction time under 900ms',
    type: 'game_stats',
    difficulty: 'hard'
  },
  
  'articuno': {
    pokemon_name: 'articuno',
    description: 'Achieve 12/12 snipes on the Normal Practice Category',
    type: 'game_stats',
    difficulty: 'medium'
  },
  
  'zapdos': {
    pokemon_name: 'zapdos',
    description: 'Achieve 12/12 snipes on the Busy Practice Category',
    type: 'game_stats',
    difficulty: 'medium'
  },
  
  'moltres': {
    pokemon_name: 'moltres',
    description: 'Achieve 12/12 snipes on the Dump Practice Category',
    type: 'game_stats',
    difficulty: 'medium'
  },

  // ===== GENERATION 2 LEGENDARIES =====
  
  'lugia': {
    pokemon_name: 'lugia',
    description: 'Win 100 ranked matches',
    type: 'special',
    difficulty: 'hard'
  },
  
  'ho-oh': {
    pokemon_name: 'ho-oh',
    description: 'Play 1000 practice matches',
    type: 'special',
    difficulty: 'hard'
  },
  
  'celebi': {
    pokemon_name: 'celebi',
    description: '', 
    type: 'time_based',
    difficulty: 'medium'
  },
  
  'raikou': {
    pokemon_name: 'raikou',
    description: 'POPULATE: Achievement description for unlocking Raikou',
    type: 'streak',
    difficulty: 'medium'
  },
  
  'entei': {
    pokemon_name: 'entei',
    description: 'POPULATE: Achievement description for unlocking Entei',
    type: 'streak', 
    difficulty: 'medium'
  },
  
  'suicune': {
    pokemon_name: 'suicune',
    description: 'POPULATE: Achievement description for unlocking Suicune',
    type: 'streak',
    difficulty: 'medium'
  },

  // ===== GENERATION 3 LEGENDARIES =====
  
  // Add more requirements for remaining legendaries...
  // regirock, regice, registeel, latias, latios, kyogre, groudon, rayquaza, jirachi, deoxys
  
  // ===== GENERATION 4 LEGENDARIES =====
  
  // Add more requirements for remaining legendaries...
  // uxie, mesprit, azelf, dialga, palkia, heatran, regigigas, giratina, cresselia, phione, manaphy, darkrai, shaymin, arceus
  
  // ===== GENERATION 5 LEGENDARIES =====
  
  // Add more requirements for remaining legendaries...
  // victini, cobalion, terrakion, virizion, tornadus, thundurus, reshiram, zekrom, landorus, kyurem, keldeo, meloetta, genesect
  
};



// Helper functions
export const getUnlockRequirementForPokemon = (pokemonName: string): PokemonUnlockRequirement | null => {
  return POKEMON_UNLOCK_REQUIREMENTS[pokemonName] || null;
};

export const getAchievementsForPokemon = (pokemonName: string): PokemonUnlockRequirement[] => {
  const requirement = POKEMON_UNLOCK_REQUIREMENTS[pokemonName];
  return requirement ? [requirement] : [];
};

export const getAllUnlockRequirements = (): PokemonUnlockRequirement[] => {
  return Object.values(POKEMON_UNLOCK_REQUIREMENTS);
};

export const getRequirementsByType = (type: PokemonUnlockRequirement['type']): PokemonUnlockRequirement[] => {
  return Object.values(POKEMON_UNLOCK_REQUIREMENTS).filter(requirement => requirement.type === type);
};

export const getRequirementsByDifficulty = (difficulty: PokemonUnlockRequirement['difficulty']): PokemonUnlockRequirement[] => {
  return Object.values(POKEMON_UNLOCK_REQUIREMENTS).filter(requirement => requirement.difficulty === difficulty);
};

export const isPokemonLocked = (pokemonName: string): boolean => {
  return POKEMON_UNLOCK_REQUIREMENTS.hasOwnProperty(pokemonName);
}; 