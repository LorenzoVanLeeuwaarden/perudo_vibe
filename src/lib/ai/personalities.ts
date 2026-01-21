/**
 * AI Personality Definitions
 * 6 distinct personalities that affect AI decision-making
 */

import { Personality, PersonalityParams } from './types';

// =============================================================================
// Personality Definitions
// =============================================================================

/**
 * SHARK - Aggressive, punishes bluffers, high risk tolerance
 * Strategy: Calls dudo frequently on suspected bluffers, makes aggressive bids
 */
const SHARK: Personality = {
  id: 'shark',
  name: 'Shark',
  description: 'Aggressive predator that punishes bluffers and takes calculated risks',
  params: {
    dudoThreshold: 0.55, // Calls dudo earlier than most
    calzaThreshold: 0.8, // Rarely attempts calza
    bluffFrequency: 0.25, // Moderate bluffing
    aggression: 0.75, // High aggression
    riskTolerance: 0.7, // High risk tolerance
    adaptability: 0.8, // Very adaptive to opponent behavior
    unpredictability: 0.2, // Fairly predictable (aggressive)
    positionalAwareness: 0.6, // Good positional play
  },
};

/**
 * TURTLE - Conservative, waits for certainty, low risk
 * Strategy: Only calls dudo when very confident, makes small incremental bids
 */
const TURTLE: Personality = {
  id: 'turtle',
  name: 'Turtle',
  description: 'Conservative player that waits for certainty and avoids risks',
  params: {
    dudoThreshold: 0.85, // Only calls when very confident
    calzaThreshold: 0.3, // More likely to try calza (lower deviation needed)
    bluffFrequency: 0.08, // Rarely bluffs
    aggression: 0.15, // Very low aggression
    riskTolerance: 0.2, // Risk averse
    adaptability: 0.4, // Moderate adaptability
    unpredictability: 0.1, // Very predictable (conservative)
    positionalAwareness: 0.4, // Basic positional awareness
  },
};

/**
 * CHAOS - Unpredictable, high variance, random-ish decisions
 * Strategy: Makes seemingly random decisions to confuse opponents
 */
const CHAOS: Personality = {
  id: 'chaos',
  name: 'Chaos',
  description: 'Unpredictable wildcard that keeps everyone guessing',
  params: {
    dudoThreshold: 0.65, // Medium threshold but highly variable
    calzaThreshold: 0.6, // Sometimes attempts risky calzas
    bluffFrequency: 0.45, // High bluff frequency
    aggression: 0.5, // Medium aggression (varies)
    riskTolerance: 0.6, // Medium-high risk tolerance
    adaptability: 0.3, // Low adaptability (doesn't follow patterns)
    unpredictability: 0.9, // Extremely unpredictable
    positionalAwareness: 0.3, // Poor positional play (chaotic)
  },
};

/**
 * CALCULATOR - Pure math, zero randomness, optimal play
 * Strategy: Makes statistically optimal decisions based on probability
 */
const CALCULATOR: Personality = {
  id: 'calculator',
  name: 'Calculator',
  description: 'Pure mathematical player that makes statistically optimal decisions',
  params: {
    dudoThreshold: 0.70, // Statistically sound threshold
    calzaThreshold: 0.4, // Will calza when math says so
    bluffFrequency: 0.15, // Low but strategic bluffing
    aggression: 0.4, // Medium aggression (math-based)
    riskTolerance: 0.5, // Neutral risk tolerance
    adaptability: 0.6, // Moderate adaptability
    unpredictability: 0.0, // Zero randomness
    positionalAwareness: 0.7, // Good positional awareness
  },
};

/**
 * BLUFFER - Loves to lie, rarely calls dudo, plays the long game
 * Strategy: Frequently bluffs, avoids calling dudo, tries to build pots
 */
const BLUFFER: Personality = {
  id: 'bluffer',
  name: 'Bluffer',
  description: 'Master of deception that loves to lie and rarely challenges',
  params: {
    dudoThreshold: 0.88, // Very reluctant to call dudo
    calzaThreshold: 0.5, // Medium calza tendency
    bluffFrequency: 0.55, // Very high bluff frequency
    aggression: 0.6, // Medium-high aggression
    riskTolerance: 0.65, // Higher risk tolerance
    adaptability: 0.5, // Medium adaptability
    unpredictability: 0.4, // Moderately unpredictable
    positionalAwareness: 0.5, // Average positional play
  },
};

/**
 * TRAPPER - Positional play expert, squeeze specialist, sets traps
 * Strategy: Uses position to trap opponents, expert at squeeze plays
 */
const TRAPPER: Personality = {
  id: 'trapper',
  name: 'Trapper',
  description: 'Positional expert that sets traps and exploits vulnerable players',
  params: {
    dudoThreshold: 0.72, // Balanced threshold
    calzaThreshold: 0.45, // Will calza strategically
    bluffFrequency: 0.3, // Strategic bluffing
    aggression: 0.55, // Medium-high aggression for traps
    riskTolerance: 0.5, // Balanced risk
    adaptability: 0.7, // High adaptability
    unpredictability: 0.25, // Somewhat unpredictable
    positionalAwareness: 0.95, // Expert positional awareness
  },
};

// =============================================================================
// Personality Registry
// =============================================================================

/**
 * All available personalities
 */
export const PERSONALITIES: Record<string, Personality> = {
  shark: SHARK,
  turtle: TURTLE,
  chaos: CHAOS,
  calculator: CALCULATOR,
  bluffer: BLUFFER,
  trapper: TRAPPER,
};

// =============================================================================
// AI Name to Personality Mapping
// =============================================================================

/**
 * Maps AI names to their assigned personalities
 * Based on thematic fit with the personality type
 */
const NAME_TO_PERSONALITY: Record<string, string> = {
  // SHARK - Aggressive, predatory names
  'El Bloffo': 'shark',
  'La Serpiente': 'shark',
  'El Bandido': 'shark',
  'El Zorro Viejo': 'shark',

  // TURTLE - Conservative, careful names
  'Doña Suerte': 'turtle',
  'Tía Pícara': 'turtle',
  'Señora Riesgo': 'turtle',
  'Don Peligro': 'turtle',

  // CHAOS - Unpredictable, wild names
  'La Mentirosa': 'chaos',
  'El Calaverón': 'chaos',
  'La Calavera Loca': 'chaos',
  'Señorita Dados': 'chaos',

  // CALCULATOR - Scholarly, analytical names
  'Profesor Huesos': 'calculator',
  'Don Dinero': 'calculator',
  'Capitán Dados': 'calculator',
  'Conde Cubiletes': 'calculator',

  // BLUFFER - Deceptive, tricky names
  'El Tramposo': 'bluffer',
  'Madame Fortuna': 'bluffer',
  'El Embustero': 'bluffer',
  'Doña Trampa': 'bluffer',

  // TRAPPER - Strategic, cunning names
  'Señor Dudoso': 'trapper',
  'Don Calzón': 'trapper',
  'El Último': 'trapper',
  'El Gran Jugador': 'trapper',
  'El Tahúr': 'trapper',
};

// =============================================================================
// Personality Access Functions
// =============================================================================

/**
 * Gets the personality for a given AI name
 * Falls back to a random personality if name not mapped
 */
export function getPersonalityForName(name: string): Personality {
  const personalityId = NAME_TO_PERSONALITY[name];
  if (personalityId && PERSONALITIES[personalityId]) {
    return PERSONALITIES[personalityId];
  }
  // Fallback: assign based on name hash for consistency
  return getPersonalityByHash(name);
}

/**
 * Gets a personality by its ID
 */
export function getPersonalityById(id: string): Personality | null {
  return PERSONALITIES[id] || null;
}

/**
 * Gets a random personality
 */
export function getRandomPersonality(): Personality {
  const keys = Object.keys(PERSONALITIES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return PERSONALITIES[randomKey];
}

/**
 * Gets a consistent personality based on name hash
 * Ensures the same name always gets the same personality
 */
function getPersonalityByHash(name: string): Personality {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const keys = Object.keys(PERSONALITIES);
  const index = Math.abs(hash) % keys.length;
  return PERSONALITIES[keys[index]];
}

/**
 * Creates adjusted personality parameters based on context
 * Used for dynamic personality tuning (e.g., boring game adjustment)
 */
export function adjustPersonalityParams(
  base: PersonalityParams,
  adjustments: Partial<PersonalityParams>
): PersonalityParams {
  return {
    ...base,
    ...adjustments,
  };
}

/**
 * Scales a value based on personality parameter and randomness
 * Used to add variance to decisions while staying in character
 */
export function applyPersonalityVariance(
  baseValue: number,
  unpredictability: number,
  min: number = 0,
  max: number = 1
): number {
  const variance = (Math.random() - 0.5) * 2 * unpredictability * 0.3;
  const adjusted = baseValue + variance;
  return Math.max(min, Math.min(max, adjusted));
}
