import { supabase } from '../lib/supabase';

interface PersonalBestRow {
  user_id: string;
  category: string;
  snipes: number;
  attempts: number;
  avg_reaction: number; // milliseconds
}

interface GameStatsInput {
  shinySnipesCaught: number;
  totalAttempts: number;
  totalReactionTime: number;
  reactionTimes: number[];
}

// Utility to determine if new stats are better than current best according to priority rules
const isBetterPerformance = (current: PersonalBestRow | null, stats: GameStatsInput): boolean => {
  if (!current) return true;

  // Compare snipes
  if (stats.shinySnipesCaught !== current.snipes) {
    return stats.shinySnipesCaught > current.snipes;
  }

  // Compare accuracy
  const newAccuracy = stats.totalAttempts === 0 ? 0 : stats.shinySnipesCaught / stats.totalAttempts;
  const currentAccuracy = current.attempts === 0 ? 0 : current.snipes / current.attempts;

  if (newAccuracy !== currentAccuracy) {
    return newAccuracy > currentAccuracy;
  }

  // Compare average reaction time (lower is better)
  const newAvg = stats.reactionTimes.length === 0 ? 0 : stats.totalReactionTime / stats.reactionTimes.length;
  return newAvg < current.avg_reaction;
};

// Records the personal best for a given user & category, returns true if this run sets a new best
export const recordPersonalBest = async (
  userId: string,
  category: string,
  stats: GameStatsInput
): Promise<boolean> => {
  // Fetch current best
  const { data: existing, error: fetchError } = await supabase
    .from('personal_bests')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Ignore row-not-found error (code may vary) but throw others
    console.error('Error fetching personal best', fetchError);
  }

  const better = isBetterPerformance(existing ?? null, stats);

  if (!better) {
    return false;
  }

  const payload = {
    user_id: userId,
    category,
    snipes: stats.shinySnipesCaught,
    attempts: stats.totalAttempts,
    avg_reaction: stats.reactionTimes.length === 0 ? 0 : stats.totalReactionTime / stats.reactionTimes.length,
  };

  if (existing) {
    await supabase
      .from('personal_bests')
      .update(payload)
      .match({ user_id: userId, category });
  } else {
    await supabase.from('personal_bests').insert(payload);
  }

  return true;
}; 