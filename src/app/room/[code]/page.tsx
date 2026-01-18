'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { normalizeRoomCode } from '@/lib/roomCode';
import { useClientIdentity } from '@/hooks/useClientIdentity';
import { useRoomConnection, type ConnectionStatus } from '@/hooks/useRoomConnection';
import { useUIStore } from '@/stores/uiStore';
import { JoinForm } from '@/components/JoinForm';
import { RoomLobby } from '@/components/RoomLobby';
import { CasinoLogo } from '@/components/CasinoLogo';
import { ShaderBackground } from '@/components/ShaderBackground';
import type { ServerMessage, ServerRoomState } from '@/shared';

type JoinState =
  | { status: 'connecting' }
  | { status: 'room-info'; info: { playerCount: number; maxPlayers: number; gameInProgress: boolean } }
  | { status: 'joining' }
  | { status: 'joined'; roomState: ServerRoomState; playerId: string }
  | { status: 'error'; message: string };

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const roomCode = normalizeRoomCode(code || '');

  const clientId = useClientIdentity();
  const { playerColor, clearPreferredMode } = useUIStore();

  const [joinState, setJoinState] = useState<JoinState>({ status: 'connecting' });
  const [joinError, setJoinError] = useState<string | null>(null);
  const [wsRef, setWsRef] = useState<{ send: (data: string) => void } | null>(null);

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'ROOM_INFO':
        // New user - show join form
        if (message.gameInProgress) {
          setJoinState({ status: 'error', message: 'Game in progress. Wait until it ends.' });
        } else {
          setJoinState({
            status: 'room-info',
            info: {
              playerCount: message.playerCount,
              maxPlayers: message.maxPlayers,
              gameInProgress: message.gameInProgress,
            },
          });
        }
        break;

      case 'ROOM_STATE':
        // Joined or returning user
        setJoinState({
          status: 'joined',
          roomState: message.state,
          playerId: message.yourPlayerId,
        });
        setJoinError(null);
        break;

      case 'PLAYER_JOINED':
        // Another player joined
        toast.success(`${message.player.name} joined`);
        // Update room state if we have it
        setJoinState(prev => {
          if (prev.status === 'joined') {
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                players: [...prev.roomState.players, message.player],
              },
            };
          }
          return prev;
        });
        break;

      case 'PLAYER_LEFT':
        // Player left
        setJoinState(prev => {
          if (prev.status === 'joined') {
            const player = prev.roomState.players.find(p => p.id === message.playerId);
            if (player && message.reason !== 'disconnected') {
              toast.info(`${player.name} left`);
            }
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                players: prev.roomState.players.filter(p => p.id !== message.playerId),
              },
            };
          }
          return prev;
        });
        break;

      case 'PLAYER_RECONNECTED':
        toast.success(`${message.playerName} reconnected`);
        break;

      case 'ERROR':
        // Handle errors
        if (message.error.type === 'INVALID_NAME' || message.error.type === 'ROOM_FULL') {
          setJoinError(message.error.reason);
          // Go back to room-info state to show form with error
          setJoinState(prev => {
            if (prev.status === 'joining') {
              return { status: 'room-info', info: { playerCount: 0, maxPlayers: 6, gameInProgress: false } };
            }
            return prev;
          });
        } else if (message.error.type === 'INVALID_ACTION') {
          setJoinState({ status: 'error', message: message.error.reason });
        }
        break;
    }
  }, []);

  // Connection hook - only connect when we have clientId
  const { ws, status } = useRoomConnection({
    roomCode,
    clientId: clientId ?? undefined,
    onMessage: handleMessage,
  });

  // Store ws reference for sending messages
  useEffect(() => {
    if (ws) {
      setWsRef(ws);
    }
  }, [ws]);

  const handleJoinSubmit = useCallback((nickname: string) => {
    if (!wsRef) return;

    setJoinState({ status: 'joining' });
    setJoinError(null);

    wsRef.send(JSON.stringify({
      type: 'JOIN_ROOM',
      playerName: nickname,
      timestamp: Date.now(),
    }));
  }, [wsRef]);

  const handleBack = useCallback(() => {
    clearPreferredMode();
    router.push('/');
  }, [clearPreferredMode, router]);

  // Loading state while client ID initializes
  if (!clientId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <ShaderBackground />
        <div className="scanlines-overlay" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-gold-accent" />
          <p className="text-white-soft/60">Connecting...</p>
        </motion.div>
      </main>
    );
  }

  // Error state
  if (joinState.status === 'error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 relative">
        <ShaderBackground />
        <div className="scanlines-overlay" />
        <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
          <CasinoLogo color={playerColor} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="retro-panel p-8 mt-8 w-full"
          >
            <AlertCircle className="w-12 h-12 text-red-danger mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white-soft mb-2">Cannot Join Room</h2>
            <p className="text-white-soft/60 mb-6">{joinState.message}</p>
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gold-accent text-purple-deep font-bold rounded-lg"
            >
              Back to Home
            </motion.button>
          </motion.div>
        </div>
      </main>
    );
  }

  // Joined state - show lobby
  if (joinState.status === 'joined') {
    return (
      <RoomLobby
        roomCode={roomCode}
        roomState={joinState.roomState}
        myPlayerId={joinState.playerId}
        connectionStatus={status}
      />
    );
  }

  // Join form state
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <ShaderBackground />
      <div className="scanlines-overlay" />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 px-4 py-2 rounded-lg bg-purple-deep/90 border border-purple-mid text-white-soft/70 flex items-center gap-2 hover:bg-purple-mid/50 transition-colors backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <CasinoLogo color={playerColor} />
        </motion.div>

        <AnimatePresence mode="wait">
          {(joinState.status === 'connecting' || joinState.status === 'joining') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="retro-panel p-8 w-full flex flex-col items-center"
            >
              <Loader2 className="w-8 h-8 animate-spin text-gold-accent mb-4" />
              <p className="text-white-soft/60">
                {joinState.status === 'connecting' ? 'Connecting to room...' : 'Joining...'}
              </p>
            </motion.div>
          )}

          {joinState.status === 'room-info' && (
            <JoinForm
              key="join-form"
              roomCode={roomCode}
              roomInfo={joinState.info}
              isLoading={false}
              error={joinError}
              onSubmit={handleJoinSubmit}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
