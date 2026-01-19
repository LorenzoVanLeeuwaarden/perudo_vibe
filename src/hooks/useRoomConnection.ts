'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import PartySocket from 'partysocket';
import { normalizeRoomCode } from '@/lib/roomCode';
import type { ServerMessage } from '@/shared';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseRoomConnectionOptions {
  roomCode: string;
  clientId?: string | null; // Pass from useClientIdentity - must be non-null to connect
  onMessage?: (message: ServerMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Hook for managing PartySocket connection to a game room.
 * Handles connection lifecycle and message parsing.
 * IMPORTANT: Does not connect until clientId is available (non-null).
 */
export function useRoomConnection({ roomCode, clientId, onMessage, onStatusChange }: UseRoomConnectionOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [ws, setWs] = useState<PartySocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onStatusChangeRef = useRef(onStatusChange);

  // Keep refs updated
  useEffect(() => {
    onMessageRef.current = onMessage;
    onStatusChangeRef.current = onStatusChange;
  }, [onMessage, onStatusChange]);

  // Only connect when clientId and roomCode are available
  useEffect(() => {
    // Don't connect until we have the clientId and a valid roomCode
    if (!clientId || !roomCode) {
      return;
    }

    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
      room: normalizeRoomCode(roomCode),
      id: clientId, // Use the persistent client ID for reconnection
    });

    socket.onopen = () => {
      setStatus('connected');
      onStatusChangeRef.current?.('connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        onMessageRef.current?.(message);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      onStatusChangeRef.current?.('disconnected');
    };

    socket.onerror = () => {
      setStatus('error');
      onStatusChangeRef.current?.('error');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [clientId, roomCode]);

  return { ws, status };
}
