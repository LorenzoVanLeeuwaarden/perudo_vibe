/**
 * Zod schemas for client-server message protocol
 *
 * All messages are validated using Zod discriminated unions.
 * This ensures type safety across the WebSocket boundary.
 *
 * Per CONTEXT.md decisions:
 * - All messages include timestamp field
 * - Errors use structured objects with type and reason
 */

import { z } from 'zod';

// =============================================================================
// Shared Schemas
// =============================================================================

/**
 * Bid schema - count of dice showing a value
 */
export const BidSchema = z.object({
  count: z.number().int().min(1),
  value: z.number().int().min(1).max(6),
});

/**
 * Unix timestamp in milliseconds
 */
const TimestampSchema = z.number();

// =============================================================================
// Client -> Server Messages (Intentions)
// =============================================================================

/**
 * Messages clients send to the server
 * These represent player intentions - the server validates and applies them
 */
export const ClientMessageSchema = z.discriminatedUnion('type', [
  // Lobby actions
  z.object({
    type: z.literal('JOIN_ROOM'),
    playerName: z.string().min(2).max(12),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('LEAVE_ROOM'),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('START_GAME'),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('UPDATE_SETTINGS'),
    settings: z.object({
      startingDice: z.number().int().min(1).max(5).optional(),
      palificoEnabled: z.boolean().optional(),
      turnTimeoutMs: z.number().int().min(10000).max(120000).optional(),
    }),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('KICK_PLAYER'),
    playerId: z.string(),
    timestamp: TimestampSchema,
  }),

  // Game actions
  z.object({
    type: z.literal('ROLL_DICE'),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('PLACE_BID'),
    bid: BidSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('CALL_DUDO'),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('CALL_CALZA'),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('CONTINUE_ROUND'),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('SEND_EMOTE'),
    emote: z.string().max(4), // Single emoji character
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('RETURN_TO_LOBBY'),
    timestamp: TimestampSchema,
  }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// =============================================================================
// Error Types
// =============================================================================

/**
 * Structured error types for client handling
 * Per CONTEXT.md: typed error objects with type and reason
 */
export const GameErrorSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INVALID_BID'),
    reason: z.string(),
    currentBid: BidSchema.nullable(),
  }),
  z.object({
    type: z.literal('NOT_YOUR_TURN'),
    reason: z.string(),
    currentPlayerId: z.string().nullable(),
  }),
  z.object({
    type: z.literal('GAME_NOT_STARTED'),
    reason: z.string(),
  }),
  z.object({
    type: z.literal('ROOM_FULL'),
    reason: z.string(),
    maxPlayers: z.number(),
  }),
  z.object({
    type: z.literal('INVALID_ACTION'),
    reason: z.string(),
  }),
  z.object({
    type: z.literal('NOT_HOST'),
    reason: z.string(),
  }),
  z.object({
    type: z.literal('INVALID_NAME'),
    reason: z.string(),
  }),
]);

export type GameError = z.infer<typeof GameErrorSchema>;

// =============================================================================
// Server -> Client Messages (State Updates)
// =============================================================================

/**
 * Messages server sends to clients
 * These represent state updates and events
 *
 * Note: z.any() is used for complex types (ServerRoomState, ServerGameState)
 * to avoid circular imports. Runtime validation happens at message boundaries.
 */
export const ServerMessageSchema = z.discriminatedUnion('type', [
  // State synchronization
  z.object({
    type: z.literal('ROOM_STATE'),
    state: z.any(), // ServerRoomState - full room state for initial sync
    yourPlayerId: z.string(),
    yourHand: z.array(z.number()).optional(), // Only sent to owner
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('GAME_STATE'),
    state: z.any(), // ServerGameState - full game state update
    yourHand: z.array(z.number()).optional(),
    timestamp: TimestampSchema,
  }),

  // Room info (sent on initial connect before join)
  z.object({
    type: z.literal('ROOM_INFO'),
    roomCode: z.string(),
    playerCount: z.number(),
    maxPlayers: z.number(),
    gameInProgress: z.boolean(),
    timestamp: TimestampSchema,
  }),

  // Player events
  z.object({
    type: z.literal('PLAYER_JOINED'),
    player: z.any(), // PublicPlayerState
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('PLAYER_LEFT'),
    playerId: z.string(),
    reason: z.enum(['left', 'kicked', 'disconnected', 'eliminated']),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('PLAYER_RECONNECTED'),
    playerId: z.string(),
    playerName: z.string(),
    timestamp: TimestampSchema,
  }),

  // Game lifecycle
  z.object({
    type: z.literal('GAME_STARTED'),
    initialState: z.any(), // ServerGameState - initial game state (hands sanitized)
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('DICE_ROLLED'),
    yourHand: z.array(z.number()), // Your dice values
    timestamp: TimestampSchema,
  }),

  // Bidding events
  z.object({
    type: z.literal('BID_PLACED'),
    playerId: z.string(),
    bid: BidSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('DUDO_CALLED'),
    callerId: z.string(),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('CALZA_CALLED'),
    callerId: z.string(),
    timestamp: TimestampSchema,
  }),

  // Round resolution
  z.object({
    type: z.literal('ROUND_RESULT'),
    bid: BidSchema,
    actualCount: z.number(),
    allHands: z.record(z.string(), z.array(z.number())), // All players' dice revealed
    loserId: z.string().nullable(), // Who loses a die (null for calza success)
    winnerId: z.string().nullable(), // Who gains a die (calza only)
    isCalza: z.boolean(),
    playerDiceCounts: z.record(z.string(), z.number()), // Updated dice counts for all players
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('GAME_ENDED'),
    winnerId: z.string(),
    stats: z.any(), // GameStats
    timestamp: TimestampSchema,
  }),

  // Turn management
  z.object({
    type: z.literal('TURN_CHANGED'),
    currentPlayerId: z.string(),
    turnStartedAt: z.number(),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal('TURN_TIMEOUT'),
    playerId: z.string(),
    aiAction: z.enum(['bid', 'dudo']),
    bid: BidSchema.optional(), // Only present when aiAction === 'bid'
    timestamp: TimestampSchema,
  }),

  // Settings
  z.object({
    type: z.literal('SETTINGS_UPDATED'),
    settings: z.any(), // GameSettings
    timestamp: TimestampSchema,
  }),

  // Host transfer
  z.object({
    type: z.literal('HOST_CHANGED'),
    newHostId: z.string(),
    timestamp: TimestampSchema,
  }),

  // Emotes
  z.object({
    type: z.literal('EMOTE_RECEIVED'),
    playerId: z.string(),
    emote: z.string(),
    timestamp: TimestampSchema,
  }),

  // Error handling
  z.object({
    type: z.literal('ERROR'),
    error: GameErrorSchema,
    timestamp: TimestampSchema,
  }),
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Extract specific message types for type-safe handling
 */
export type ClientMessageType = ClientMessage['type'];
export type ServerMessageType = ServerMessage['type'];

/**
 * Helper to create typed client messages
 */
export function createClientMessage<T extends ClientMessageType>(
  type: T,
  data: Omit<Extract<ClientMessage, { type: T }>, 'type' | 'timestamp'>
): Extract<ClientMessage, { type: T }> {
  return {
    type,
    timestamp: Date.now(),
    ...data,
  } as Extract<ClientMessage, { type: T }>;
}

/**
 * Helper to create typed server messages
 */
export function createServerMessage<T extends ServerMessageType>(
  type: T,
  data: Omit<Extract<ServerMessage, { type: T }>, 'type' | 'timestamp'>
): Extract<ServerMessage, { type: T }> {
  return {
    type,
    timestamp: Date.now(),
    ...data,
  } as Extract<ServerMessage, { type: T }>;
}
