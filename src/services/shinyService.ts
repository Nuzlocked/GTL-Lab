import { supabase } from '../lib/supabase';

export interface ShinyUnlock {
  id: string;
  user_id: string;
  pokemon_name: string;
  is_shiny: boolean;
  unlock_type: string;
  unlock_data: any;
  unlocked_at: string;
}

export interface GameShinyStatus {
  user_id: string;
  is_current_game_shiny: boolean;
  game_type: 'practice' | 'friendly';
  updated_at: string;
}

class ShinyService {
  /**
   * Roll for shiny on game start (1/100 chance)
   */
  async rollForShiny(userId: string, gameType: 'practice' | 'friendly'): Promise<boolean> {
    const isShiny = Math.random() < 0.01 // 1/100 chance
    
    // Store the current game's shiny status
    await this.setGameShinyStatus(userId, isShiny, gameType);
    
    return isShiny;
  }

  /**
   * Set the current game's shiny status
   */
  async setGameShinyStatus(userId: string, isShiny: boolean, gameType: 'practice' | 'friendly'): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_game_shiny_status')
        .upsert({
          user_id: userId,
          is_current_game_shiny: isShiny,
          game_type: gameType
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error setting game shiny status:', error);
    }
  }

  /**
   * Get the current game's shiny status
   */
  async getGameShinyStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_game_shiny_status')
        .select('is_current_game_shiny')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting game shiny status:', error);
        return false;
      }

      return data?.is_current_game_shiny || false;
    } catch (error) {
      console.error('Error getting game shiny status:', error);
      return false;
    }
  }

  /**
   * Clear the current game's shiny status (called when game ends)
   */
  async clearGameShinyStatus(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_game_shiny_status')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing game shiny status:', error);
    }
  }

  /**
   * Unlock a shiny Pokemon permanently
   */
  async unlockShiny(userId: string, pokemonName: string): Promise<boolean> {
    try {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_sprite_unlocks')
        .select('id')
        .eq('user_id', userId)
        .eq('pokemon_name', pokemonName)
        .eq('is_shiny', true)
        .single();

      if (existing) {
        return false; // Already unlocked
      }

      // Unlock the shiny
      const { error } = await supabase
        .from('user_sprite_unlocks')
        .insert({
          user_id: userId,
          pokemon_name: pokemonName,
          is_shiny: true,
          unlock_type: 'shiny_hunt',
          unlock_data: {
            unlocked_at: new Date().toISOString(),
            method: 'game_roll'
          }
        });

      if (error) throw error;
      return true; // Successfully unlocked
    } catch (error) {
      console.error('Error unlocking shiny:', error);
      return false;
    }
  }

  /**
   * Check if user has unlocked a specific shiny
   */
  async hasShinyUnlocked(userId: string, pokemonName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_sprite_unlocks')
        .select('id')
        .eq('user_id', userId)
        .eq('pokemon_name', pokemonName)
        .eq('is_shiny', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking shiny unlock:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking shiny unlock:', error);
      return false;
    }
  }

  /**
   * Get all unlocked shinies for a user
   */
  async getUnlockedShinies(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_sprite_unlocks')
        .select('pokemon_name')
        .eq('user_id', userId)
        .eq('is_shiny', true);

      if (error) throw error;
      return data?.map(unlock => unlock.pokemon_name) || [];
    } catch (error) {
      console.error('Error getting unlocked shinies:', error);
      return [];
    }
  }

  /**
   * Handle shiny encounter (roll + unlock if new)
   */
  async handleShinyEncounter(userId: string, pokemonName: string, gameType: 'practice' | 'friendly'): Promise<{
    isShiny: boolean;
    isNewUnlock: boolean;
  }> {
    const isShiny = await this.rollForShiny(userId, gameType);
    
    if (isShiny) {
      const isNewUnlock = await this.unlockShiny(userId, pokemonName);
      return { isShiny: true, isNewUnlock };
    }

    return { isShiny: false, isNewUnlock: false };
  }
}

export const shinyService = new ShinyService(); 