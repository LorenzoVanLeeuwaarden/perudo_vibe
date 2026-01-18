'use client';

import { useState, useCallback } from 'react';
import usePartySocket from 'partysocket/react';
import { normalizeRoomCode } from '@/lib/roomCode';
import type { ServerMessage } from '@/shared';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseRoomConnectionOptions {
  roomCode: string;
  onMessage?: (message: ServerMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Hook for managing PartySocket connection to a game room.
 * Handles connection lifecycle and message parsing.
 */
export function useRoomConnection({ roomCode, onMessage, onStatusChange }: UseRoomConnectionOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const ws = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: normalizeRoomCode(roomCode),

    onOpen() {
      handleStatusChange('connected');
    },
    onMessage(event) {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        onMessage?.(message);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    },
    onClose() {
      handleStatusChange('disconnected');
    },
    onError() {
      handleStatusChange('error');
    },
  });

  return { ws, status };
}
