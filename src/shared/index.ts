/**
 * Shared module barrel export
 *
 * This module exports all shared types, constants, and message schemas
 * that are used by both the PartyKit server and Next.js client.
 */

// Types - server-authoritative state definitions
export * from './types';

// Constants - shared configuration values
export * from './constants';

// Message schemas and types
export {
  // Schemas for validation
  BidSchema,
  ClientMessageSchema,
  ServerMessageSchema,
  GameErrorSchema,
  // Types inferred from schemas
  type ClientMessage,
  type ServerMessage,
  type GameError,
  // Helper types
  type ClientMessageType,
  type ServerMessageType,
  // Factory functions
  createClientMessage,
  createServerMessage,
} from './messages';
