/**
 * Seeded Random Number Generator for deterministic gameplay
 * Uses Linear Congruential Generator (LCG) algorithm
 * Both players will see identical results when using the same seed
 */

export class SeededRNG {
  private seed: number;
  private initialSeed: number;

  constructor(seed: string | number) {
    // Convert string seed to number if needed
    this.initialSeed = typeof seed === 'string' ? this.hashString(seed) : seed;
    this.seed = this.initialSeed;
  }

  /**
   * Convert string to a numeric seed
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Linear Congruential Generator
   * Parameters chosen for good distribution
   */
  private next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed;
  }

  /**
   * Get next random float between 0 and 1 (exclusive)
   */
  public random(): number {
    return this.next() / 4294967296;
  }

  /**
   * Get random integer between min (inclusive) and max (exclusive)
   */
  public randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Get random float between min (inclusive) and max (exclusive)
   */
  public randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  /**
   * Get random boolean with optional probability
   */
  public randomBoolean(probability: number = 0.5): boolean {
    return this.random() < probability;
  }

  /**
   * Choose random element from array
   */
  public randomChoice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length)];
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Reset RNG to initial seed
   */
  public reset(): void {
    this.seed = this.initialSeed;
  }

  /**
   * Get current seed state
   */
  public getSeed(): number {
    return this.seed;
  }

  /**
   * Set new seed
   */
  public setSeed(seed: string | number): void {
    this.initialSeed = typeof seed === 'string' ? this.hashString(seed) : seed;
    this.seed = this.initialSeed;
  }
}

/**
 * Generate a random match seed
 */
export function generateMatchSeed(): string {
  return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default instance for non-seeded random operations
 */
export const defaultRNG = new SeededRNG(Date.now()); 