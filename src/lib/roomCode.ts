import { customAlphabet } from 'nanoid';
import { ROOM_CODE_LENGTH, ROOM_CODE_ALPHABET } from '@/shared/constants';

const generateCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

/**
 * Generate a unique room code using customAlphabet from nanoid.
 * Returns a 6-character uppercase alphanumeric string.
 * Excludes confusing characters (0/O, 1/I/L).
 */
export function createRoomCode(): string {
  return generateCode();
}

/**
 * Normalize a room code for consistency.
 * Converts to uppercase and trims whitespace.
 */
export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Validate a room code.
 * Checks that the code has correct length and only valid characters.
 */
export function isValidRoomCode(code: string): boolean {
  const normalized = normalizeRoomCode(code);
  if (normalized.length !== ROOM_CODE_LENGTH) return false;
  return [...normalized].every(char => ROOM_CODE_ALPHABET.includes(char));
}
