import { supabase } from '../lib/supabase';
import { GameSettings, GAME_PRESETS } from '../types/GameSettings';
import { generateMatchSeed } from '../utils/seededRng';
import { recordPersonalBest } from './personalBestService';

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  current_page: string;
  updated_at: string;
}

export interface FriendlyChallenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenger_username: string;
  challenged_username: string;
  game_settings: GameSettings;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  updated_at: string;
}

export interface FriendlyMatch {
  id: string;
  challenge_id: string;
  player1_id: string;
  player2_id: string;
  player1_username: string;
  player2_username: string;
  game_settings: GameSettings;
  rng_seed: string;
  match_status: 'starting' | 'in_progress' | 'completed' | 'abandoned';
  player1_stats?: any;
  player2_stats?: any;
  winner_id?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

export interface GameStats {
  shinySnipesCaught: number;
  totalShiniesAppeared: number;
  totalReactionTime: number;
  reactionTimes: number[];
  totalAttempts: number;
}

class FriendlyService {
  private challengeSubscription: any = null;
  private matchSubscription: any = null;
  private presenceSubscription: any = null;
  private presenceUpdateInterval: any = null;

  /**
   * Initialize user presence and start tracking
   */
  async initializePresence(userId: string, currentPage: string = 'home'): Promise<void> {
    try {
      // Update or insert user presence
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          is_online: true,
          last_seen: new Date().toISOString(),
          current_page: currentPage,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Start periodic presence updates
      this.startPresenceUpdates(userId, currentPage);
    } catch (error) {
      console.error('Error initializing presence:', error);
    }
  }

  /**
   * Start periodic presence updates
   */
  private startPresenceUpdates(userId: string, currentPage: string): void {
    // Clear existing interval
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
    }

    // Update presence every 30 seconds
    this.presenceUpdateInterval = setInterval(async () => {
      try {
        await supabase
          .from('user_presence')
          .update({
            is_online: true,
            last_seen: new Date().toISOString(),
            current_page: currentPage,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    }, 30000);
  }

  /**
   * Update current page for presence tracking
   */
  async updatePresencePage(userId: string, currentPage: string): Promise<void> {
    try {
      await supabase
        .from('user_presence')
        .update({
          current_page: currentPage,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating presence page:', error);
    }
  }

  /**
   * Set user as offline
   */
  async setOffline(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_presence')
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Clear presence update interval
      if (this.presenceUpdateInterval) {
        clearInterval(this.presenceUpdateInterval);
        this.presenceUpdateInterval = null;
      }
    } catch (error) {
      console.error('Error setting offline:', error);
    }
  }

  /**
   * Check if a user is online
   */
  async isUserOnline(username: string): Promise<boolean> {
    try {
      // First get the user by username
      const user = await this.getUserByUsername(username);
      if (!user) return false;

      // Then check if that user is online
      return await this.isUserOnlineById(user.id);
    } catch (error) {
      console.error('Error checking user online status:', error);
      return false;
    }
  }

  /**
   * Get user ID by username
   */
  async getUserByUsername(username: string): Promise<{ id: string; username: string } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', username)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  /**
   * Check if user is online by user ID
   */
  async isUserOnlineById(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('is_online')
        .eq('user_id', userId)
        .single();

      if (error) return false;
      return data?.is_online || false;
    } catch (error) {
      console.error('Error checking user online status:', error);
      return false;
    }
  }

  /**
   * Send a friendly challenge
   */
  async sendChallenge(
    challengerId: string,
    challengerUsername: string,
    challengedUsername: string,
    gameSettings: GameSettings
  ): Promise<{ success: boolean; message: string; challenge?: FriendlyChallenge }> {
    try {
      // Get challenged user info
      const challengedUser = await this.getUserByUsername(challengedUsername);
      if (!challengedUser) {
        return { success: false, message: 'User not found.' };
      }

      // Check if challenged user is online
      const isOnline = await this.isUserOnlineById(challengedUser.id);
      if (!isOnline) {
        return { success: false, message: 'This user is offline.' };
      }

      // Check if there's already a pending challenge between these users
      const { data: existingChallenge, error: existingError } = await supabase
        .from('friendly_challenges')
        .select('*')
        .eq('challenger_id', challengerId)
        .eq('challenged_id', challengedUser.id)
        .eq('status', 'pending')
        .single();

      if (existingChallenge) {
        return { success: false, message: 'You already have a pending challenge with this user.' };
      }

      // Create the challenge
      const { data: challenge, error } = await supabase
        .from('friendly_challenges')
        .insert({
          challenger_id: challengerId,
          challenged_id: challengedUser.id,
          challenger_username: challengerUsername,
          challenged_username: challengedUser.username,
          game_settings: gameSettings,
          status: 'pending',
          expires_at: new Date(Date.now() + 30000).toISOString() // 30 seconds from now
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: 'Challenge sent successfully!', challenge };
    } catch (error) {
      console.error('Error sending challenge:', error);
      return { success: false, message: 'Failed to send challenge. Please try again.' };
    }
  }

  /**
   * Accept a challenge
   */
  async acceptChallenge(challengeId: string): Promise<{ success: boolean; message: string; match?: FriendlyMatch }> {
    try {
      // Attempt to mark the challenge as accepted (ignore if it was already accepted)
      let { data: challenge, error: updateError } = await supabase
        .from('friendly_challenges')
        .update({ status: 'accepted' })
        .eq('id', challengeId)
        .in('status', ['pending', 'accepted'])
        .select()
        .single();

      if (updateError) throw updateError;

      // If no rows were updated, fetch the challenge to see its current status
      if (!challenge) {
        const { data: existingChallenge } = await supabase
          .from('friendly_challenges')
          .select('*')
          .eq('id', challengeId)
          .single();

        if (!existingChallenge || existingChallenge.status !== 'accepted') {
          return { success: false, message: 'Challenge not found or already processed.' };
        }

        challenge = existingChallenge as any;
      }

      // Check if a match already exists for this challenge
      const { data: existingMatch } = await supabase
        .from('friendly_matches')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (existingMatch) {
        return { success: true, message: 'Challenge accepted! Joining match...', match: existingMatch };
      }

      // Create match
      const matchSeed = generateMatchSeed();
      const { data: match, error: matchError } = await supabase
        .from('friendly_matches')
        .insert({
          challenge_id: challengeId,
          player1_id: challenge.challenger_id,
          player2_id: challenge.challenged_id,
          player1_username: challenge.challenger_username,
          player2_username: challenge.challenged_username,
          game_settings: challenge.game_settings,
          rng_seed: matchSeed,
          match_status: 'starting'
        })
        .select()
        .single();

      if (matchError) throw matchError;

      return { success: true, message: 'Challenge accepted! Starting match...', match };
    } catch (error: any) {
      console.error('Error accepting challenge:', error);
      return { success: false, message: error?.message || 'Failed to accept challenge. Please try again.' };
    }
  }

  /**
   * Reject a challenge
   */
  async rejectChallenge(challengeId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('friendly_challenges')
        .update({ status: 'rejected' })
        .eq('id', challengeId);

      if (error) throw error;

      return { success: true, message: 'Challenge rejected.' };
    } catch (error: any) {
      console.error('Error rejecting challenge:', error);
      return { success: false, message: error?.message || 'Failed to reject challenge. Please try again.' };
    }
  }

  /**
   * Cancel a challenge
   */
  async cancelChallenge(challengeId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('friendly_challenges')
        .update({ status: 'cancelled' })
        .eq('id', challengeId)
        .eq('status', 'pending');

      if (error) throw error;

      return { success: true, message: 'Challenge cancelled.' };
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      return { success: false, message: 'Failed to cancel challenge. Please try again.' };
    }
  }

  /**
   * Get pending challenges for a user
   */
  async getPendingChallenges(userId: string): Promise<FriendlyChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('friendly_challenges')
        .select('*')
        .eq('challenged_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending challenges:', error);
      return [];
    }
  }

  /**
   * Get pending outgoing challenges (sent by the user)
   */
  async getOutgoingPendingChallenges(userId: string): Promise<FriendlyChallenge[]> {
    try {
      const { data, error } = await supabase
        .from('friendly_challenges')
        .select('*')
        .eq('challenger_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting outgoing pending challenges:', error);
      return [];
    }
  }

  /**
   * Get active match for a user
   */
  async getActiveMatch(userId: string): Promise<FriendlyMatch | null> {
    try {
      const { data, error } = await supabase
        .from('friendly_matches')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .in('match_status', ['starting', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting active match:', error);
      return null;
    }
  }

  /**
   * Get match by ID for polling fallbacks
   */
  async getMatchById(matchId: string): Promise<FriendlyMatch | null> {
    try {
      const { data, error } = await supabase
        .from('friendly_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching match by id:', error);
      return null;
    }
  }

  /**
   * Update match status
   */
  async updateMatchStatus(matchId: string, status: 'starting' | 'in_progress' | 'completed' | 'abandoned'): Promise<void> {
    try {
      // Fetch current match to check started_at
      let startedAt: string | null = null;
      if (status === 'in_progress') {
        const { data } = await supabase
          .from('friendly_matches')
          .select('started_at')
          .eq('id', matchId)
          .single();
        startedAt = data?.started_at || null;
      }

      const updateData: any = { match_status: status };

      if (status === 'in_progress' && !startedAt) {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('friendly_matches')
        .update(updateData)
        .eq('id', matchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  }

  /**
   * Submit match results
   */
  async submitMatchResults(
    matchId: string,
    playerId: string,
    playerStats: GameStats
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current match
      const { data: match, error: fetchError } = await supabase
        .from('friendly_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (fetchError) throw fetchError;

      // Determine if this is player1 or player2
      const isPlayer1 = match.player1_id === playerId;
      const updateField = isPlayer1 ? 'player1_stats' : 'player2_stats';
      const otherStatsField = isPlayer1 ? 'player2_stats' : 'player1_stats';

      // Update player stats
      const updateData: any = {
        [updateField]: playerStats
      };

      // Check if other player has submitted results
      if (match[otherStatsField]) {
        // Both players have submitted, determine winner
        const otherStats = match[otherStatsField];
        const currentPlayerSnipes = playerStats.shinySnipesCaught;
        const otherPlayerSnipes = otherStats.shinySnipesCaught;

        if (currentPlayerSnipes > otherPlayerSnipes) {
          updateData.winner_id = playerId;
        } else if (otherPlayerSnipes > currentPlayerSnipes) {
          updateData.winner_id = isPlayer1 ? match.player2_id : match.player1_id;
        }
        // If tie, winner_id remains null

        updateData.match_status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('friendly_matches')
        .update(updateData)
        .eq('id', matchId);

      if (error) throw error;

      // Record personal best for this player
      try {
        const category = getCategoryFromSettings(match.game_settings);
        if (category) {
          await recordPersonalBest(playerId, category, {
            shinySnipesCaught: playerStats.shinySnipesCaught,
            totalAttempts: playerStats.totalAttempts,
            totalReactionTime: playerStats.totalReactionTime,
            reactionTimes: playerStats.reactionTimes,
          });
        }
      } catch (error) {
        console.error('Error recording personal best:', error);
        // Don't fail the entire operation if personal best recording fails
      }

      const completed = !!updateData.match_status && updateData.match_status === 'completed';
      return { success: true, message: completed ? 'completed' : 'pending' };
    } catch (error) {
      console.error('Error submitting match results:', error);
      return { success: false, message: 'Failed to submit results. Please try again.' };
    }
  }

  /**
   * Subscribe to challenge updates (both incoming and outgoing)
   */
  subscribeToChallenges(userId: string, callback: (payload: any) => void) {
    // Clean up any existing subscription
    if (this.challengeSubscription) {
      supabase.removeChannel(this.challengeSubscription);
    }

    this.challengeSubscription = supabase
      .channel('friendly_challenges_' + userId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendly_challenges',
          filter: `challenged_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendly_challenges',
          filter: `challenger_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
      
    return this.challengeSubscription;
  }

  /**
   * Subscribe to match updates
   */
  subscribeToMatches(userId: string, callback: (payload: any) => void) {
    // Clean up any existing subscription
    if (this.matchSubscription) {
      supabase.removeChannel(this.matchSubscription);
    }

    this.matchSubscription = supabase
      .channel('friendly_matches_' + userId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendly_matches',
          filter: `player1_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendly_matches',
          filter: `player2_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
      
    return this.matchSubscription;
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    if (this.challengeSubscription) {
      supabase.removeChannel(this.challengeSubscription);
      this.challengeSubscription = null;
    }
    if (this.matchSubscription) {
      supabase.removeChannel(this.matchSubscription);
      this.matchSubscription = null;
    }
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
      this.presenceUpdateInterval = null;
    }
  }

  /**
   * Clean up expired challenges
   */
  async cleanupExpiredChallenges(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_challenges');
    } catch (error) {
      console.error('Error cleaning up expired challenges:', error);
    }
  }
}

// Helper function to determine category from game settings
const getCategoryFromSettings = (settings: GameSettings): string | null => {
  // Determine category by matching to preset settings (same logic as PracticePage)
  const match = GAME_PRESETS.find(p => JSON.stringify(p.settings) === JSON.stringify(settings));
  if (!match) return null;
  return match.name === 'Normal Day' ? 'Normal' : match.name;
};

export const friendlyService = new FriendlyService(); 