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