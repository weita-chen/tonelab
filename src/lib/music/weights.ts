/**
 * Single source for prompt ordering.
 * Higher weight is written earlier. Suno weights the front of the style box most.
 * Change numbers here — the engine sorts by these values, it does not hard-code sequence.
 */
export const CATEGORY_WEIGHTS = {
  primaryGenre: 100,
  genreInfluence: 90,
  coreStyle: 80,
  mood: 70,
  era: 60,
  texture: 55,
  instrument: 50,
  rhythm: 45,
  technique: 40,
  bpm: 35,
} as const;

export type WeightKey = keyof typeof CATEGORY_WEIGHTS;
