export interface PokemonListing {
  id: string;
  pokemon: {
    name: string;
    level: number;
    sprite: string;
    isShiny: boolean;
    gender: 'male' | 'female';
  };
  nature: string;
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  price: number;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
}

export interface PokemonData {
  name: string;
  sprite: string;
}

export const POKEMON_SPRITES: Record<string, string> = {
  'Ditto': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png',
  'Shroomish': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/285.png',
  'Tyranitar': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/248.png',
  'Magikarp': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png',
  'Zorua': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/570.png',
  'Garchomp': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/445.png',
  'Rotom': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/479.png',
  'Eevee': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png',
  'Pikachu': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  'Charizard': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
  'Luxio': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/404.png',
  'Smoochum': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/238.png',
  'Porygon-Z': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/474.png',
  'Sealeo': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/364.png',
  'Arcanine': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/59.png',
  'Piplup': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/393.png',
  'Boldore': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/525.png',
  'Quagsire': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/195.png',
};

export const POKEMON_SHINY_SPRITES: Record<string, string> = {
  'Ditto': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/132.png',
  'Shroomish': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/285.png',
  'Tyranitar': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/248.png',
  'Magikarp': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/129.png',
  'Zorua': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/570.png',
  'Garchomp': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/445.png',
  'Rotom': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/479.png',
  'Eevee': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/133.png',
  'Pikachu': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png',
  'Charizard': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/6.png',
  'Luxio': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/404.png',
  'Smoochum': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/238.png',
  'Porygon-Z': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/474.png',
  'Sealeo': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/364.png',
  'Arcanine': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/59.png',
  'Piplup': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/393.png',
  'Boldore': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/525.png',
  'Quagsire': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/195.png',
}; 