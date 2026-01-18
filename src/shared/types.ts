/**
 * Server-authoritative types for Perudo multiplayer
 *
 * These types represent the canonical state that lives on the PartyKit server.
 * The server is the source of truth - clients receive state updates and send intentions.
 */

// Re-export PlayerColor from existing types for consistency
export type PlayerColor = 'blue' | 'green' | 'orange' | 'yellow' | 'black' | 'red';

/**
 * Server-authoritative game phases
 * Note: 'Victory' and 'Defeat' from client are represented as 'ended' on server
 * The server only knows who won, not "victory vs defeat" (that's player-relative)
 */
export type GamePhase = 'lobby' | 'rolling' | 'bidding' | 'reveal' | 'ended';

/**
 * A bid in the game - count of dice showing a specific value
 */
export interface Bid {
  count: number;
  value: number; // 1-6, where 1 (aces) are wild in non-palifico rounds
}

/**
 * Server's complete view of a player
 * The server tracks everything, including private state (hand)
 */
export interface ServerPlayer {
  id: string;           // Connection ID from PartyKit
  name: string;         // Display name (2-12 chars)
  color: PlayerColor;
  diceCount: number;    // Current dice remaining
  hand: number[];       // Dice values (only sent to owner in messages)
  isConnected: boolean; // WebSocket currently connected
  isEliminated: boolean;
  isHost: boolean;
}

/**
 * Game settings that can be configured in lobby
 */
export interface GameSettings {
  startingDice: number;     // Default 5
  palificoEnabled: boolean; // Wild ones rule changes when player has 1 die
  turnTimeoutMs: number;    // Per-turn timer (0 = disabled)
}

/**
 * Server's canonical game state
 * This is the source of truth for an active game
 */
export interface ServerGameState {
  phase: GamePhase;
  players: ServerPlayer[];
  currentBid: Bid | null;
  currentTurnPlayerId: string | null;
  roundStarterId: string | null;     // Who started this round (for turn order)
  lastBidderId: string | null;       // Who placed the last bid
  isPalifico: boolean;               // True when round starter has exactly 1 die
  roundNumber: number;
  turnStartedAt: number | null;      // Timestamp for turn timer
}

/**
 * Complete room state including lobby and game
 */
export interface ServerRoomState {
  roomCode: string;
  hostId: string;
  players: ServerPlayer[];
  gameState: ServerGameState | null; // null when in lobby
  settings: GameSettings;
  createdAt: number;
}

/**
 * What other players can see - no private hand information
 * Used when broadcasting player info to other clients
 */
export type PublicPlayerState = Omit<ServerPlayer, 'hand'>;

/**
 * Default game settings
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  startingDice: 5,
  palificoEnabled: true,
  turnTimeoutMs: 30000,
};
