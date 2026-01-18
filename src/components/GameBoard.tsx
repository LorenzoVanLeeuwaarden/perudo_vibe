'use client';

import { motion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { PlayerDiceBadge } from './PlayerDiceBadge';
import { BidUI } from './BidUI';
import { SortedDiceDisplay } from './SortedDiceDisplay';
import { DudoOverlay } from './DudoOverlay';
import { RevealPhase } from './RevealPhase';
import { ShaderBackground } from './ShaderBackground';
import type { ServerRoomState, ClientMessage } from '@/shared';
import type { PlayerColor } from '@/lib/types';

interface GameBoardProps {
  roomState: ServerRoomState;
  myPlayerId: string;
  myHand: number[];
  sendMessage: (msg: ClientMessage) => void;
}

export function GameBoard({ roomState, myPlayerId, myHand, sendMessage }: GameBoardProps) {
  const {
    showDudoOverlay,
    dudoCallerName,
    dudoType,
    revealedHands,
    roundResult,
    setRevealedHands,
    setRoundResult,
    setDudoOverlay,
    setDudoCaller,
  } = useUIStore();

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
  const dudoCallerColor = dudoCallerName
    ? (players.find(p => p.name === dudoCallerName)?.color as PlayerColor) ?? 'blue'
    : 'blue';

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

  const handleContinueRound = () => {
    // Clear reveal UI state
    setRevealedHands(null);
    setRoundResult(null);
    setDudoOverlay(false);
    setDudoCaller(null, null, null);
    // Send continue message to server
    sendMessage({ type: 'CONTINUE_ROUND', timestamp: Date.now() });
  };

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
          {players.map(player => (
            <PlayerDiceBadge
              key={player.id}
              playerName={player.name}
              diceCount={player.diceCount}
              color={player.color as PlayerColor}
              isActive={player.id === gameState.currentTurnPlayerId}
              isEliminated={player.isEliminated}
              hasPalifico={gameState.isPalifico && player.id === gameState.roundStarterId}
              showThinking={player.id === gameState.currentTurnPlayerId && gameState.phase === 'bidding'}
              thinkingPrompt={player.id === myPlayerId ? 'Your turn' : 'Thinking'}
            />
          ))}
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
            />
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
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Dudo/Calza overlay */}
      <DudoOverlay
        isVisible={showDudoOverlay}
        type={dudoType ?? 'dudo'}
        callerName={dudoCallerName ?? 'Unknown'}
        callerColor={dudoCallerColor}
        onComplete={() => setDudoOverlay(false)}
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
    </main>
  );
}

export default GameBoard;
