'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { PlayerDiceBadge } from './PlayerDiceBadge';
import { BidUI } from './BidUI';
import { TurnTimer } from './TurnTimer';
import { SortedDiceDisplay } from './SortedDiceDisplay';
import { DudoOverlay } from './DudoOverlay';
import { RevealPhase } from './RevealPhase';
import { ShaderBackground } from './ShaderBackground';
import { EmotePicker } from './EmotePicker';
import { EmoteBubble } from './EmoteBubble';
import { Dice } from './Dice';
import type { ServerRoomState, ClientMessage, ServerPlayer, GameStats } from '@/shared';
import { PLAYER_COLORS, type PlayerColor } from '@/lib/types';
import { VictoryScreen } from './VictoryScreen';
import { GameResultsScreen } from './GameResultsScreen';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Check if disconnect visual should be shown for a player
 * Returns true if player disconnected more than 5 seconds ago
 */
function shouldShowDisconnectedVisual(player: ServerPlayer, currentTime: number): boolean {
  if (player.isConnected) return false;
  if (!player.disconnectedAt) return false;
  return (currentTime - player.disconnectedAt) >= 5000;
}

interface GameBoardProps {
  roomState: ServerRoomState;
  myPlayerId: string;
  myHand: number[];
  sendMessage: (msg: ClientMessage) => void;
  // New props for celebration/results flow
  showCelebration?: boolean;
  showResults?: boolean;
  gameStats?: GameStats | null;
  onCelebrationComplete?: () => void;
  onReturnToLobby?: () => void;
  onLeaveGame?: () => void;
}

export function GameBoard({
  roomState,
  myPlayerId,
  myHand,
  sendMessage,
  showCelebration,
  showResults,
  gameStats,
  onCelebrationComplete,
  onReturnToLobby,
  onLeaveGame,
}: GameBoardProps) {
  // Shared hooks for animation guards
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  const {
    showDudoOverlay,
    dudoCallerName,
    dudoType,
    revealedHands,
    roundResult,
    activeEmotes,
    setRevealedHands,
    setRoundResult,
    setDudoOverlay,
    setDudoCaller,
    removeEmote,
  } = useUIStore();

  // Track current time for disconnect visual delay calculation
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update every second to recalculate disconnect visuals
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const gameState = roomState.gameState;
  if (!gameState) return null;

  // Helper computations
  const players = gameState.players;
  const activePlayers = players.filter(p => !p.isEliminated);
  const myPlayer = players.find(p => p.id === myPlayerId);
  const myColor = (myPlayer?.color ?? 'blue') as PlayerColor;
  const isMyTurn = gameState.currentTurnPlayerId === myPlayerId;
  const totalDice = activePlayers.reduce((sum, p) => sum + p.diceCount, 0);
  // Calza is a turn action - on your turn with a current bid, you can BID, DUDO, or CALZA
  const canCalza = !!gameState.currentBid && isMyTurn && myPlayer && !myPlayer.isEliminated;
  const lastBidder = players.find(p => p.id === gameState.lastBidderId);
  const lastBidderColor = lastBidder?.color as PlayerColor | undefined;
  const lastBidderName = lastBidder?.name;
  const currentTurnPlayer = players.find(p => p.id === gameState.currentTurnPlayerId);

  // Timer values
  const turnStartedAt = gameState.turnStartedAt;
  const turnTimeoutMs = roomState.settings.turnTimeoutMs;
  const wasAutoPlayed = gameState.lastActionWasTimeout ?? false;
  const dudoCallerColor = dudoCallerName
    ? (players.find(p => p.name === dudoCallerName)?.color as PlayerColor) ?? 'blue'
    : 'blue';

  // Celebration/results computations
  const winnerId = gameStats?.winnerId;
  const isWinner = winnerId === myPlayerId;
  const isHost = roomState.hostId === myPlayerId;

  // Action handlers
  const handleBid = (bid: { count: number; value: number }) => {
    sendMessage({ type: 'PLACE_BID', bid, timestamp: Date.now() });
  };

  const handleDudo = () => {
    sendMessage({ type: 'CALL_DUDO', timestamp: Date.now() });
  };

  const handleCalza = () => {
    sendMessage({ type: 'CALL_CALZA', timestamp: Date.now() });
  };

  // Note: EMOTE_RECEIVED messages are handled in the parent room page
  // and call addEmote(playerId, emote) to trigger bubble display
  const handleSendEmote = (emote: string) => {
    sendMessage({ type: 'SEND_EMOTE', emote, timestamp: Date.now() });
  };

  const handleContinueRound = () => {
    // Clear reveal UI state
    setRevealedHands(null);
    setRoundResult(null);
    setDudoOverlay(false);
    setDudoCaller(null, null, null);
    // Send continue message to server
    sendMessage({ type: 'CONTINUE_ROUND', timestamp: Date.now() });
  };

  // Memoized callback for DudoOverlay completion to prevent effect restarts
  const handleDudoComplete = useCallback(() => {
    setDudoOverlay(false);
  }, [setDudoOverlay]);

  // Check if we're in reveal phase
  const isRevealPhase = gameState.phase === 'reveal';
  const isEndedPhase = gameState.phase === 'ended';

  return (
    <main className="min-h-screen flex flex-col relative">
      <ShaderBackground />
      <div className="scanlines-overlay" />

      {/* Main game content */}
      <div className="relative z-10 flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        {/* Player row at top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2 mb-4"
        >
          {players.map(player => {
            const playerEmotes = activeEmotes.filter(e => e.playerId === player.id);
            return (
              <div key={player.id} className="relative">
                <PlayerDiceBadge
                  playerName={player.name}
                  diceCount={player.diceCount}
                  color={player.color as PlayerColor}
                  isActive={player.id === gameState.currentTurnPlayerId}
                  isEliminated={player.isEliminated}
                  hasPalifico={gameState.isPalifico && player.id === gameState.roundStarterId}
                  showThinking={player.id === gameState.currentTurnPlayerId && gameState.phase === 'bidding'}
                  thinkingPrompt={player.id === myPlayerId ? 'Your turn' : 'Thinking'}
                  showDisconnectedVisual={shouldShowDisconnectedVisual(player, currentTime)}
                  isConnected={player.isConnected}
                />
                {/* Emote bubbles above player badge */}
                {playerEmotes.slice(-1).map(activeEmote => (
                  <EmoteBubble
                    key={activeEmote.id}
                    emote={activeEmote.emote}
                    onComplete={() => removeEmote(activeEmote.id)}
                  />
                ))}
              </div>
            );
          })}
        </motion.div>

        {/* Center area - bid display or reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          {/* Placeholder during reveal phase - actual reveal is in RevealPhase overlay */}
          {isRevealPhase && (
            <div className="retro-panel p-8 text-center">
              <p className="text-white-soft/60 text-lg">Revealing dice...</p>
            </div>
          )}

          {/* Show game ended state */}
          {isEndedPhase && (
            <div className="retro-panel p-8 w-full max-w-md text-center">
              <h2 className="text-3xl font-bold text-gold-accent mb-4">Game Over!</h2>
              <p className="text-white-soft text-xl mb-6">
                {players.find(p => !p.isEliminated)?.name} wins!
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-gold-accent text-purple-deep font-bold rounded-lg uppercase tracking-wider"
              >
                Play Again
              </motion.button>
            </div>
          )}

          {/* Show bidding UI during bidding phase */}
          {gameState.phase === 'bidding' && !isRevealPhase && !isEndedPhase && (
            <>
              {/* Turn timer - only show if timeout is configured */}
              {turnTimeoutMs > 0 && turnStartedAt && (
                <div className="mb-4">
                  <TurnTimer
                    turnStartedAt={turnStartedAt}
                    turnTimeoutMs={turnTimeoutMs}
                    isMyTurn={isMyTurn}
                  />
                </div>
              )}

              {/* Custom bid display matching single-player's recessed table surface */}
              <div className="w-full max-w-md mb-4">
                {gameState.currentBid && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                    style={{ perspective: '800px' }}
                  >
                    {/* Circular Player Token - absolute positioned */}
                    {lastBidderName && lastBidderColor && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="absolute -top-3 -left-3 z-20"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-mono font-bold uppercase tracking-wider"
                          style={{
                            background: `linear-gradient(135deg, ${PLAYER_COLORS[lastBidderColor].bg} 0%, ${PLAYER_COLORS[lastBidderColor].shadow} 100%)`,
                            color: '#fff',
                            boxShadow: `0 3px 10px rgba(0,0,0,0.5), 0 0 15px ${PLAYER_COLORS[lastBidderColor].glow}`,
                            border: `2px solid ${PLAYER_COLORS[lastBidderColor].border}`,
                          }}
                        >
                          {lastBidderName.slice(0, 3)}
                        </div>
                      </motion.div>
                    )}

                    {/* Recessed table surface with subtle floating animation */}
                    <motion.div
                      className="rounded-xl p-5 relative"
                      style={{
                        background: 'linear-gradient(180deg, rgba(3, 15, 15, 0.95) 0%, rgba(10, 31, 31, 0.9) 100%)',
                        boxShadow: `
                          inset 0 4px 20px rgba(0, 0, 0, 0.8),
                          inset 0 2px 4px rgba(0, 0, 0, 0.5),
                          inset 0 -2px 10px rgba(45, 212, 191, 0.05),
                          0 4px 20px rgba(0, 0, 0, 0.4)
                        `,
                        border: '2px solid rgba(45, 212, 191, 0.15)',
                        transformOrigin: 'center bottom',
                      }}
                      animate={useSimplifiedAnimations ? {} : {
                        y: [0, -3, 0, 3, 0],
                        rotateX: [5, 5.3, 5, 4.7, 5],
                      }}
                      transition={useSimplifiedAnimations ? undefined : {
                        duration: 6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {/* Inner carved edge */}
                      <div
                        className="absolute inset-2 rounded-lg pointer-events-none"
                        style={{
                          border: '1px solid rgba(0, 0, 0, 0.3)',
                          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
                        }}
                      />

                      {/* Bid dice display */}
                      <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                        {Array.from({ length: gameState.currentBid.count }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: i * 0.03, type: 'spring', stiffness: 400 }}
                          >
                            <Dice
                              value={gameState.currentBid!.value}
                              index={i}
                              size="sm"
                              isPalifico={gameState.isPalifico}
                              color={lastBidderColor || myColor}
                            />
                          </motion.div>
                        ))}
                      </div>

                      {/* Bid count indicator */}
                      <p className="text-center text-lg font-bold text-white-soft/60 mt-1">
                        {gameState.currentBid.count}× {gameState.currentBid.value === 1 ? 'Jokers' : `${gameState.currentBid.value}s`}
                      </p>
                    </motion.div>
                  </motion.div>
                )}

                {/* No bid yet message */}
                {!gameState.currentBid && isMyTurn && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-turquoise/60 text-sm uppercase tracking-wider font-mono">
                      Make the opening bid
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Action/Input Menu */}
              <div className="w-full max-w-sm sm:max-w-md mx-auto px-2 sm:px-0">
                <BidUI
                  currentBid={gameState.currentBid}
                  onBid={handleBid}
                  onDudo={handleDudo}
                  onCalza={handleCalza}
                  isMyTurn={isMyTurn}
                  totalDice={totalDice}
                  isPalifico={gameState.isPalifico}
                  canCalza={canCalza ?? false}
                  playerColor={myColor}
                  lastBidderColor={lastBidderColor}
                  lastBidderName={lastBidderName}
                  hideBidDisplay={true}
                  wasAutoPlayed={wasAutoPlayed}
                />
              </div>
            </>
          )}

          {/* Show rolling state */}
          {gameState.phase === 'rolling' && (
            <div className="retro-panel p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4 border-4 border-gold-accent border-t-transparent rounded-full"
              />
              <p className="text-white-soft text-lg">Rolling dice...</p>
            </div>
          )}
        </motion.div>

        {/* My dice at bottom */}
        {myHand.length > 0 && gameState.phase !== 'ended' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-auto pt-4"
          >
            <div className="retro-panel p-4">
              <p className="text-xs uppercase text-white-soft/50 mb-3 tracking-wider text-center">Your Dice</p>
              <div className="flex justify-center">
                <SortedDiceDisplay
                  dice={myHand}
                  color={myColor}
                  isPalifico={gameState.isPalifico}
                  size="md"
                  highlightValue={!isMyTurn ? gameState.currentBid?.value ?? null : null}
                  draggable={true}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Emote picker - only show during active game */}
      {gameState.phase === 'bidding' && (
        <div className="fixed bottom-24 right-4 z-20">
          <EmotePicker
            onSelect={handleSendEmote}
            disabled={false}
          />
        </div>
      )}

      {/* Dudo/Calza overlay */}
      <DudoOverlay
        isVisible={showDudoOverlay}
        type={dudoType ?? 'dudo'}
        callerName={dudoCallerName ?? 'Unknown'}
        callerColor={dudoCallerColor}
        onComplete={handleDudoComplete}
      />

      {/* Reveal phase overlay */}
      {isRevealPhase && revealedHands && roundResult && (
        <RevealPhase
          players={players}
          revealedHands={revealedHands}
          roundResult={roundResult}
          onContinue={handleContinueRound}
          showOverlay={showDudoOverlay}
        />
      )}

      {/* Victory celebration for winner */}
      {showCelebration && isWinner && (
        <VictoryScreen
          playerColor={myColor}
          onPlayAgain={onCelebrationComplete || (() => {})}
        />
      )}

      {/* Waiting screen for non-winners during celebration */}
      {showCelebration && !isWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0416 70%, #050208 100%)',
          }}
        >
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white-soft mb-4">Game Over</h2>
            <p className="text-xl text-white-soft/70">
              {players.find(p => p.id === winnerId)?.name} wins!
            </p>
            <p className="text-white-soft/50 mt-4">Loading results...</p>
          </div>
        </motion.div>
      )}

      {/* Results screen for all players after celebration */}
      {showResults && gameStats && (
        <GameResultsScreen
          stats={gameStats}
          players={players.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color as PlayerColor,
          }))}
          isHost={isHost}
          onReturnToLobby={onReturnToLobby || (() => {})}
          onLeaveGame={onLeaveGame || (() => {})}
        />
      )}
    </main>
  );
}

export default GameBoard;
