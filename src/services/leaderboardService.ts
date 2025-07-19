import { supabase } from '../lib/supabase';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  category: string;
  snipes: number;
  attempts: number;
  avg_reaction: number;
  rank: number;
}

export interface CategoryLeaderboard {
  category: string;
  entries: LeaderboardEntry[];
}

/**
 * Fetches global leaderboards for all categories
 * Rankings are determined by: snipes (desc) > accuracy (desc) > avg_reaction (asc)
 */
export const fetchGlobalLeaderboards = async (): Promise<Record<string, LeaderboardEntry[]>> => {
  try {
    // First get all personal bests
    const { data: personalBests, error: pbError } = await supabase
      .from('personal_bests')
      .select('user_id, category, snipes, attempts, avg_reaction');

    if (pbError) {
      console.error('Error fetching personal bests:', pbError);
      return {};
    }

    if (!personalBests || personalBests.length === 0) {
      return {};
    }

    // Get all unique user IDs
    const userIds = Array.from(new Set(personalBests.map(pb => pb.user_id)));

    // Fetch usernames for all users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return {};
    }

    // Create a map of user_id to username
    const userMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

    // Combine the data
    const combinedData = personalBests.map(pb => ({
      user_id: pb.user_id,
      username: userMap.get(pb.user_id) || 'Unknown',
      category: pb.category,
      snipes: pb.snipes,
      attempts: pb.attempts,
      avg_reaction: pb.avg_reaction
    }));

    // Group by category and apply ranking logic
    const leaderboardsByCategory: Record<string, LeaderboardEntry[]> = {};

    // Process each category
    ['Normal', 'Busy', 'Dump'].forEach(category => {
      const categoryData = combinedData.filter(entry => entry.category === category);
      
      // Sort by ranking criteria: snipes > accuracy > avg_reaction
      const sortedEntries = categoryData.sort((a, b) => {
        // First compare snipes (higher is better)
        if (a.snipes !== b.snipes) {
          return b.snipes - a.snipes;
        }
        
        // Then compare accuracy (higher is better)
        const aAccuracy = a.attempts === 0 ? 0 : a.snipes / a.attempts;
        const bAccuracy = b.attempts === 0 ? 0 : b.snipes / b.attempts;
        if (aAccuracy !== bAccuracy) {
          return bAccuracy - aAccuracy;
        }
        
        // Finally compare avg_reaction (lower is better)
        return a.avg_reaction - b.avg_reaction;
      });

      // Add ranks and convert to LeaderboardEntry format
      leaderboardsByCategory[category] = sortedEntries.map((entry, index) => ({
        user_id: entry.user_id,
        username: entry.username,
        category: entry.category,
        snipes: entry.snipes,
        attempts: entry.attempts,
        avg_reaction: entry.avg_reaction,
        rank: index + 1
      }));
    });

    return leaderboardsByCategory;
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    return {};
  }
};

/**
 * Fetches leaderboard for a specific category
 */
export const fetchCategoryLeaderboard = async (category: string): Promise<LeaderboardEntry[]> => {
  const allLeaderboards = await fetchGlobalLeaderboards();
  return allLeaderboards[category] || [];
}; 