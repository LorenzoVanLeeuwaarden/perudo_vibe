'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { normalizeRoomCode } from '@/lib/roomCode';
import { useClientIdentity } from '@/hooks/useClientIdentity';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import { useUIStore } from '@/stores/uiStore';
import { JoinForm } from '@/components/JoinForm';
import { RoomLobby } from '@/components/RoomLobby';
import { GameBoard } from '@/components/GameBoard';
import { CasinoLogo } from '@/components/CasinoLogo';
import { ShaderBackground } from '@/components/ShaderBackground';
import type { ServerMessage, ServerRoomState, ClientMessage, GameSettings, GameStats } from '@/shared';
import { useSoundEffects } from '@/hooks/useSoundEffects';

type JoinState =
  | { status: 'connecting' }
  | { status: 'room-info'; info: { playerCount: number; maxPlayers: number; gameInProgress: boolean } }
  | { status: 'joining' }
  | { status: 'joined'; roomState: ServerRoomState; playerId: string; myHand: number[] }
  | { status: 'error'; message: string };

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();

  // Extract room code from URL pathname (handles SPA fallback routing on Cloudflare Pages)
  // The URL will be like /room/ABC123/ but useParams might return 'PLACEHOLDER' from static build
  const [roomCode, setRoomCode] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      // pathname is /room/CODE or /room/CODE/
      if (pathParts.length >= 2 && pathParts[0] === 'room') {
        setRoomCode(normalizeRoomCode(pathParts[1]));
      }
    }
  }, []);

  // Fallback to params if available (for normal Next.js routing)
  const code = params.code as string;
  useEffect(() => {
    if (code && code !== 'PLACEHOLDER' && !roomCode) {
      setRoomCode(normalizeRoomCode(code));
    }
  }, [code, roomCode]);

  const clientId = useClientIdentity();
  const { playerColor, clearPreferredMode, addEmote } = useUIStore();
  const { playPop } = useSoundEffects();

  const [joinState, setJoinState] = useState<JoinState>({ status: 'connecting' });
  const [joinError, setJoinError] = useState<string | null>(null);
  const [wsRef, setWsRef] = useState<{ send: (data: string) => void } | null>(null);

  // Celebration and results flow state
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
          myHand: message.yourHand ?? [],
        });
        setJoinError(null);
        // Clear celebration/results state when returning to lobby
        setShowCelebration(false);
        setShowResults(false);
        setGameStats(null);
        break;

      case 'PLAYER_JOINED': {
        // Another player joined - update state first, then toast
        const newPlayer = message.player;
        setJoinState(prev => {
          if (prev.status === 'joined') {
            // Add new player to the players array
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                players: [...prev.roomState.players, newPlayer],
              },
            };
          }
          // If not yet joined, update room-info player count
          if (prev.status === 'room-info') {
            return {
              ...prev,
              info: {
                ...prev.info,
                playerCount: prev.info.playerCount + 1,
              },
            };
          }
          return prev;
        });
        break;
      }

      case 'PLAYER_LEFT':
        // Player left or disconnected
        setJoinState(prev => {
          if (prev.status === 'joined') {
            // Check if we were kicked
            if (message.playerId === prev.playerId && message.reason === 'kicked') {
              toast.error('You were removed from the room');
              router.push('/');
              return prev;
            }

            const player = prev.roomState.players.find(p => p.id === message.playerId);
            if (message.reason === 'disconnected') {
              // Mark as disconnected in BOTH roomState.players AND gameState.players
              const disconnectedAt = Date.now();
              const updatePlayer = (p: typeof player) =>
                p && p.id === message.playerId
                  ? { ...p, isConnected: false, disconnectedAt }
                  : p;

              return {
                ...prev,
                roomState: {
                  ...prev.roomState,
                  players: prev.roomState.players.map(p => updatePlayer(p)!),
                  // Also update gameState.players if game is in progress
                  gameState: prev.roomState.gameState
                    ? {
                        ...prev.roomState.gameState,
                        players: prev.roomState.gameState.players.map(p => updatePlayer(p)!),
                      }
                    : prev.roomState.gameState,
                },
              };
            } else {
              // Actually left (kicked, voluntarily left) - remove from list
              return {
                ...prev,
                roomState: {
                  ...prev.roomState,
                  players: prev.roomState.players.filter(p => p.id !== message.playerId),
                },
              };
            }
          }
          return prev;
        });
        break;

      case 'PLAYER_RECONNECTED':
        // Update player's connection status and clear disconnectedAt
        setJoinState(prev => {
          if (prev.status === 'joined') {
            // Update BOTH roomState.players AND gameState.players
            const reconnectPlayer = <T extends { id: string; isConnected: boolean; disconnectedAt: number | null }>(p: T): T =>
              p.id === message.playerId
                ? { ...p, isConnected: true, disconnectedAt: null }
                : p;

            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                players: prev.roomState.players.map(reconnectPlayer),
                gameState: prev.roomState.gameState
                  ? {
                      ...prev.roomState.gameState,
                      players: prev.roomState.gameState.players.map(reconnectPlayer),
                    }
                  : prev.roomState.gameState,
              },
            };
          }
          return prev;
        });
        break;

      case 'SETTINGS_UPDATED':
        // Update room settings
        setJoinState(prev => {
          if (prev.status === 'joined') {
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                settings: message.settings as GameSettings,
              },
            };
          }
          return prev;
        });
        break;

      case 'HOST_CHANGED':
        // Update host and players' isHost flags
        setJoinState(prev => {
          if (prev.status === 'joined') {
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                hostId: message.newHostId,
                players: prev.roomState.players.map(p => ({
                  ...p,
                  isHost: p.id === message.newHostId,
                })),
              },
            };
          }
          return prev;
        });
        break;

      case 'GAME_STARTED':
        // Set initial game state from server (includes phase, currentTurnPlayerId, etc.)
        setJoinState(prev => {
          if (prev.status === 'joined') {
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                gameState: message.initialState,
              },
            };
          }
          return prev;
        });
        // Auto-send ROLL_DICE to trigger server roll
        if (wsRef) {
          wsRef.send(JSON.stringify({ type: 'ROLL_DICE', timestamp: Date.now() }));
        }
        break;

      case 'DICE_ROLLED':
        // Update my hand with rolled dice
        // Note: Don't modify gameState here - GAME_STATE message will update it
        // This avoids race conditions when React batches state updates
        setJoinState(prev => {
          if (prev.status === 'joined') {
            return {
              ...prev,
              myHand: message.yourHand,
            };
          }
          return prev;
        });
        break;

      case 'TURN_CHANGED':
        // Turn advanced (e.g., after player eliminated due to disconnect)
        setJoinState(prev => {
          if (prev.status === 'joined' && prev.roomState.gameState) {
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                gameState: {
                  ...prev.roomState.gameState,
                  currentTurnPlayerId: message.currentPlayerId,
                  turnStartedAt: message.turnStartedAt,
                },
              },
            };
          }
          return prev;
        });
        break;

      case 'BID_PLACED':
        // Update current bid and last bidder
        setJoinState(prev => {
          if (prev.status === 'joined' && prev.roomState.gameState) {
            // Find next player in turn order
            const activePlayers = prev.roomState.gameState.players.filter(p => !p.isEliminated);
            const currentIndex = activePlayers.findIndex(p => p.id === message.playerId);
            const nextPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                gameState: {
                  ...prev.roomState.gameState,
                  currentBid: message.bid,
                  lastBidderId: message.playerId,
                  currentTurnPlayerId: nextPlayer?.id ?? null,
                  // Reset turn timer for next player
                  turnStartedAt: Date.now(),
                },
              },
            };
          }
          return prev;
        });
        break;

      case 'DUDO_CALLED': {
        // Show DudoOverlay for dudo call
        // Get UI store actions and update outside of setState to avoid React warning
        const { setDudoOverlay, setDudoCaller } = useUIStore.getState();
        setJoinState(prev => {
          if (prev.status === 'joined') {
            const callerName = prev.roomState.players.find(p => p.id === message.callerId)?.name ?? 'Unknown';
            // Schedule UI updates for after render cycle completes
            queueMicrotask(() => {
              setDudoCaller(message.callerId, callerName, 'dudo');
              setDudoOverlay(true);
            });
          }
          return prev;
        });
        break;
      }

      case 'CALZA_CALLED': {
        // Show DudoOverlay for calza call
        // Get UI store actions and update outside of setState to avoid React warning
        const { setDudoOverlay, setDudoCaller } = useUIStore.getState();
        setJoinState(prev => {
          if (prev.status === 'joined') {
            const callerName = prev.roomState.players.find(p => p.id === message.callerId)?.name ?? 'Unknown';
            // Schedule UI updates for after render cycle completes
            queueMicrotask(() => {
              setDudoCaller(message.callerId, callerName, 'calza');
              setDudoOverlay(true);
            });
          }
          return prev;
        });
        break;
      }

      case 'ROUND_RESULT': {
        // Store revealed hands and round result, transition to reveal phase
        const { setRevealedHands, setRoundResult } = useUIStore.getState();
        setRevealedHands(message.allHands);
        setRoundResult({
          bid: message.bid,
          actualCount: message.actualCount,
          loserId: message.loserId,
          winnerId: message.winnerId,
          isCalza: message.isCalza,
          lastBidderId: message.lastBidderId,
        });
        setJoinState(prev => {
          if (prev.status === 'joined' && prev.roomState.gameState) {
            // Update dice counts from server-provided values (authoritative)
            // Update both gameState.players AND roomState.players to ensure consistency
            const updatedGamePlayers = prev.roomState.gameState.players.map(p => {
              const newDiceCount = message.playerDiceCounts[p.id] ?? p.diceCount;
              return {
                ...p,
                diceCount: newDiceCount,
                isEliminated: newDiceCount <= 0,
              };
            });

            // Also update the top-level roomState.players to stay in sync
            const updatedRoomPlayers = prev.roomState.players.map(p => {
              const newDiceCount = message.playerDiceCounts[p.id] ?? p.diceCount;
              return {
                ...p,
                diceCount: newDiceCount,
                isEliminated: newDiceCount <= 0,
              };
            });

            // Get current player's new dice count and trim myHand to match
            // This prevents showing stale dice while waiting for DICE_ROLLED
            const myNewDiceCount = message.playerDiceCounts[prev.playerId] ?? prev.myHand.length;
            const trimmedHand = prev.myHand.slice(0, myNewDiceCount);

            return {
              ...prev,
              myHand: trimmedHand,
              roomState: {
                ...prev.roomState,
                players: updatedRoomPlayers,
                gameState: {
                  ...prev.roomState.gameState,
                  phase: 'reveal',
                  players: updatedGamePlayers,
                },
              },
            };
          }
          return prev;
        });
        break;
      }

      case 'GAME_ENDED':
        // Update game phase to ended and store winner
        setJoinState(prev => {
          if (prev.status === 'joined' && prev.roomState.gameState) {
            return {
              ...prev,
              roomState: {
                ...prev.roomState,
                gameState: {
                  ...prev.roomState.gameState,
                  phase: 'ended',
                },
              },
            };
          }
          return prev;
        });
        // Store stats for results screen
        if (message.stats) {
          setGameStats(message.stats as GameStats);
        }
        // Show celebration first
        setShowCelebration(true);
        // After 8 seconds (per CONTEXT.md), show results
        setTimeout(() => {
          setShowCelebration(false);
          setShowResults(true);
        }, 8000);
        break;

      case 'EMOTE_RECEIVED':
        // Add emote to UI store for bubble display and play sound
        addEmote(message.playerId, message.emote);
        playPop();
        break;

      case 'GAME_STATE':
        // Full game state update from server
        setJoinState(prev => {
          if (prev.status === 'joined') {
            // Sync roomState.players with gameState.players to ensure consistency
            // Update dice counts in top-level players array from the incoming game state
            const incomingPlayers = (message.state?.players || []) as Array<{ id: string; diceCount: number }>;
            const playerDiceMap = new Map<string, number>(
              incomingPlayers.map(p => [p.id, p.diceCount])
            );
            const updatedRoomPlayers = prev.roomState.players.map(p => {
              const newDiceCount = playerDiceMap.get(p.id) ?? p.diceCount;
              return {
                ...p,
                diceCount: newDiceCount,
                isEliminated: newDiceCount <= 0,
              };
            });

            return {
              ...prev,
              myHand: message.yourHand ?? prev.myHand,
              roomState: {
                ...prev.roomState,
                players: updatedRoomPlayers,
                gameState: message.state,
              },
            };
          }
          return prev;
        });
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
  }, [router, wsRef, addEmote, playPop]);

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

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (!wsRef) return;
    wsRef.send(JSON.stringify(msg));
  }, [wsRef]);

  const handleBack = useCallback(() => {
    clearPreferredMode();
    router.push('/');
  }, [clearPreferredMode, router]);

  const handleReturnToLobby = useCallback(() => {
    sendMessage({ type: 'RETURN_TO_LOBBY', timestamp: Date.now() });
  }, [sendMessage]);

  const handleLeaveGame = useCallback(() => {
    window.location.href = '/';
  }, []);

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

  // Joined state - show lobby or game board
  if (joinState.status === 'joined') {
    const gameActive = joinState.roomState.gameState &&
                       joinState.roomState.gameState.phase !== 'lobby';

    if (gameActive) {
      return (
        <GameBoard
          roomState={joinState.roomState}
          myPlayerId={joinState.playerId}
          myHand={joinState.myHand}
          sendMessage={sendMessage}
          showCelebration={showCelebration}
          showResults={showResults}
          gameStats={gameStats}
          onCelebrationComplete={() => {
            setShowCelebration(false);
            setShowResults(true);
          }}
          onReturnToLobby={handleReturnToLobby}
          onLeaveGame={handleLeaveGame}
        />
      );
    }

    return (
      <RoomLobby
        roomCode={roomCode}
        roomState={joinState.roomState}
        myPlayerId={joinState.playerId}
        connectionStatus={status}
        sendMessage={sendMessage}
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
