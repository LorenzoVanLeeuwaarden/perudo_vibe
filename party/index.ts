import type * as Party from 'partykit/server';
import {
  ClientMessageSchema,
  type ClientMessage,
  type ServerMessage,
  type ServerRoomState,
  type ServerPlayer,
  type GameSettings,
  type PlayerStats,
  STARTING_DICE,
  DEFAULT_TURN_TIMEOUT_MS,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from '../src/shared';
import { rollDice, isValidBid, countMatching, generateTimeoutAIMove } from '../src/lib/gameLogic';

// Default game settings
const DEFAULT_SETTINGS: GameSettings = {
  startingDice: STARTING_DICE,
  palificoEnabled: false,
  turnTimeoutMs: DEFAULT_TURN_TIMEOUT_MS,
};

export default class GameServer implements Party.Server {
  // Room state - persisted via PartyKit storage
  private roomState: ServerRoomState | null = null;

  // Emote cooldowns - tracks last emote timestamp per player (in-memory, resets on server restart)
  private playerEmoteCooldowns: Map<string, number> = new Map();
  private readonly EMOTE_COOLDOWN_MS = 2500; // 2.5 seconds

  constructor(readonly room: Party.Room) {}

  // ========== Unified Alarm System (Turn Timer + Disconnect Grace Period) ==========
  // PartyKit only supports ONE alarm per room, so we use storage to track multiple deadlines

  /**
   * Storage schema for alarm tracking:
   * - 'turnTimer': { fireAt: timestamp } - when turn timeout should fire
   * - 'disconnect_{playerId}': { playerId: string, eliminateAt: timestamp } - per-player disconnect elimination
   * - 'aitakeover_{playerId}': { playerId: string, takeoverAt: timestamp } - delayed AI takeover for disconnected player's turn
   */

  /**
   * Schedule the next alarm based on all pending deadlines.
   * Reads turn timer, disconnect entries, and AI takeover entries, sets alarm for the nearest deadline.
   */
  private async scheduleNextAlarm(): Promise<void> {
    const deadlines: number[] = [];

    // Check turn timer
    const turnTimer = await this.room.storage.get<{ fireAt: number }>('turnTimer');
    if (turnTimer?.fireAt) {
      deadlines.push(turnTimer.fireAt);
    }

    // Check all disconnect and AI takeover entries
    const allKeys = await this.room.storage.list();
    for (const [key, value] of allKeys) {
      if (key.startsWith('disconnect_')) {
        const entry = value as { playerId: string; eliminateAt: number };
        if (entry?.eliminateAt) {
          deadlines.push(entry.eliminateAt);
        }
      } else if (key.startsWith('aitakeover_')) {
        const entry = value as { playerId: string; takeoverAt: number };
        if (entry?.takeoverAt) {
          deadlines.push(entry.takeoverAt);
        }
      }
    }

    if (deadlines.length === 0) {
      // No pending deadlines - clear any existing alarm
      // PartyKit doesn't have clearAlarm, but setting alarm to past time effectively clears it
      // Actually, we just don't set any alarm
      console.log('[ALARM] No pending deadlines');
      return;
    }

    // Set alarm for nearest deadline
    const nextDeadline = Math.min(...deadlines);
    await this.room.storage.setAlarm(nextDeadline);
    console.log(`[ALARM] Next alarm scheduled for ${new Date(nextDeadline).toISOString()}`);
  }

  /**
   * Set a turn timer for the current player.
   * Stores the timer in storage and schedules the next alarm.
   */
  private async setTurnTimer(): Promise<void> {
    // Guard: must have active game in bidding phase
    if (!this.roomState?.gameState || this.roomState.gameState.phase !== 'bidding') {
      // Clear turn timer if not in bidding phase
      await this.room.storage.delete('turnTimer');
      await this.scheduleNextAlarm();
      return;
    }

    // Guard: timeout must be configured (> 0)
    const timeoutMs = this.roomState.settings.turnTimeoutMs;
    if (!timeoutMs || timeoutMs <= 0) {
      await this.room.storage.delete('turnTimer');
      await this.scheduleNextAlarm();
      return;
    }

    // Add 500ms grace period for network latency compensation
    const fireAt = Date.now() + timeoutMs + 500;
    await this.room.storage.put('turnTimer', { fireAt });
    console.log(`[TIMER] Set turn timer for ${timeoutMs}ms + 500ms grace (fireAt ${new Date(fireAt).toISOString()})`);

    await this.scheduleNextAlarm();
  }

  /**
   * Clear the turn timer (e.g., when phase changes to reveal).
   */
  private async clearTurnTimer(): Promise<void> {
    await this.room.storage.delete('turnTimer');
    await this.scheduleNextAlarm();
  }

  /**
   * Unified alarm handler for turn timer, disconnect grace periods, and AI takeovers.
   * Checks all pending deadlines and processes those that have expired.
   */
  async onAlarm(): Promise<void> {
    console.log('[ALARM] Alarm fired');
    const now = Date.now();

    // Process AI takeovers for disconnected players (5-second grace)
    await this.processAITakeovers(now);

    // Process turn timer if expired
    await this.processTurnTimer(now);

    // Process disconnect eliminations
    await this.processDisconnectEliminations(now);

    // Schedule next alarm for any remaining deadlines
    await this.scheduleNextAlarm();
  }

  /**
   * Process turn timer if it has expired.
   * AI takes over with a conservative move.
   */
  private async processTurnTimer(now: number): Promise<void> {
    const turnTimer = await this.room.storage.get<{ fireAt: number }>('turnTimer');
    if (!turnTimer || turnTimer.fireAt > now) {
      return; // Not expired yet
    }

    // Clear the turn timer entry
    await this.room.storage.delete('turnTimer');

    // Guard: room state must exist with game state
    if (!this.roomState?.gameState) {
      console.log('[TIMER] No game state - ignoring turn timer');
      return;
    }

    const gameState = this.roomState.gameState;

    // Guard: must be in bidding phase
    if (gameState.phase !== 'bidding') {
      console.log(`[TIMER] Game phase is ${gameState.phase}, not bidding - ignoring`);
      return;
    }

    // Guard: must have a current turn player
    if (!gameState.currentTurnPlayerId) {
      console.log('[TIMER] No current turn player - ignoring');
      return;
    }

    // Find current player
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
    if (!currentPlayer) {
      console.log('[TIMER] Current player not found - ignoring');
      return;
    }

    // Guard: player must not be eliminated (disconnected players can still have AI play)
    if (currentPlayer.isEliminated) {
      console.log(`[TIMER] Player ${currentPlayer.name} is eliminated - ignoring`);
      return;
    }

    console.log(`[TIMEOUT] Player ${currentPlayer.name} timed out - AI taking over`);

    // Execute AI move for the player
    await this.executeTimeoutAIMove(currentPlayer);
  }

  /**
   * Process AI takeovers for disconnected players whose grace period has expired.
   * This handles the 5-second delay before AI takes over a disconnected player's turn.
   */
  private async processAITakeovers(now: number): Promise<void> {
    const allKeys = await this.room.storage.list();

    for (const [key, value] of allKeys) {
      if (!key.startsWith('aitakeover_')) continue;

      const entry = value as { playerId: string; takeoverAt: number };
      if (!entry || entry.takeoverAt > now) continue;

      // Grace period expired - AI takes over if player still disconnected and it's their turn
      console.log(`[AI_TAKEOVER] Grace period expired for player ${entry.playerId}`);

      // Delete the storage entry first
      await this.room.storage.delete(key);

      // Guard: room state must exist with game state
      if (!this.roomState?.gameState) continue;

      const gameState = this.roomState.gameState;

      // Guard: must still be in bidding phase
      if (gameState.phase !== 'bidding') {
        console.log(`[AI_TAKEOVER] Game phase is ${gameState.phase}, not bidding - skipping`);
        continue;
      }

      // Guard: must still be this player's turn
      if (gameState.currentTurnPlayerId !== entry.playerId) {
        console.log(`[AI_TAKEOVER] No longer ${entry.playerId}'s turn - skipping`);
        continue;
      }

      // Find the player
      const player = gameState.players.find(p => p.id === entry.playerId);
      if (!player) continue;

      // Guard: player must still be disconnected
      if (player.isConnected) {
        console.log(`[AI_TAKEOVER] Player ${player.name} reconnected - skipping AI takeover`);
        continue;
      }

      // Guard: player must not be eliminated
      if (player.isEliminated) {
        console.log(`[AI_TAKEOVER] Player ${player.name} is eliminated - skipping`);
        continue;
      }

      console.log(`[AI_TAKEOVER] AI taking over for disconnected player ${player.name}`);

      // Mark that this action was a timeout (AI)
      gameState.lastActionWasTimeout = true;

      // Execute AI move
      await this.executeTimeoutAIMove(player);
    }
  }

  /**
   * Execute AI move for a player who has timed out or is disconnected.
   * Reused for both turn timeout and disconnected player turn handling.
   */
  private async executeTimeoutAIMove(player: ServerPlayer): Promise<void> {
    if (!this.roomState?.gameState) return;

    const gameState = this.roomState.gameState;
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const totalDice = activePlayers.reduce((sum, p) => sum + p.diceCount, 0);

    // Generate conservative AI move
    const aiMove = generateTimeoutAIMove(
      player.hand,
      gameState.currentBid,
      totalDice,
      gameState.isPalifico
    );

    // Mark that this action was a timeout
    gameState.lastActionWasTimeout = true;

    if (aiMove.type === 'bid') {
      // AI places a bid
      console.log(`[TIMEOUT] AI bids ${aiMove.bid.count}x ${aiMove.bid.value}s`);

      // Track stats: increment bidsPlaced for AI bid
      if (gameState.stats[player.id]) {
        gameState.stats[player.id].bidsPlaced++;
      }

      gameState.currentBid = aiMove.bid;
      gameState.lastBidderId = player.id;

      // Advance turn to next active player
      const currentIndex = activePlayers.findIndex(p => p.id === player.id);
      const nextIndex = (currentIndex + 1) % activePlayers.length;
      gameState.currentTurnPlayerId = activePlayers[nextIndex].id;
      gameState.turnStartedAt = Date.now();

      await this.persistState();

      // Broadcast TURN_TIMEOUT with the bid
      this.broadcast({
        type: 'TURN_TIMEOUT',
        playerId: player.id,
        aiAction: 'bid',
        bid: aiMove.bid,
        timestamp: Date.now(),
      });

      // Broadcast BID_PLACED so clients update normally
      this.broadcast({
        type: 'BID_PLACED',
        playerId: player.id,
        bid: aiMove.bid,
        timestamp: Date.now(),
      });

      // Set timer for next player's turn
      await this.setTurnTimer();

    } else {
      // AI calls dudo
      console.log(`[TIMEOUT] AI calls DUDO`);

      // Track stats: increment dudosCalled for AI dudo
      if (gameState.stats[player.id]) {
        gameState.stats[player.id].dudosCalled++;
      }

      // Transition to reveal phase
      gameState.phase = 'reveal';

      // Clear turn timer since we're leaving bidding phase
      await this.room.storage.delete('turnTimer');

      // Broadcast TURN_TIMEOUT
      this.broadcast({
        type: 'TURN_TIMEOUT',
        playerId: player.id,
        aiAction: 'dudo',
        timestamp: Date.now(),
      });

      // Broadcast DUDO_CALLED
      this.broadcast({
        type: 'DUDO_CALLED',
        callerId: player.id,
        timestamp: Date.now(),
      });

      // Calculate actual count (same logic as handleCallDudo)
      let actualCount = 0;
      for (const p of activePlayers) {
        actualCount += countMatching(p.hand, gameState.currentBid!.value, gameState.isPalifico);
      }

      // Build allHands for reveal
      const allHands: Record<string, number[]> = {};
      for (const p of activePlayers) {
        allHands[p.id] = p.hand;
      }

      // Determine loser
      let loserId: string;
      if (actualCount >= gameState.currentBid!.count) {
        // Bid was correct - caller loses
        loserId = player.id;
      } else {
        // Bid was wrong - last bidder loses
        loserId = gameState.lastBidderId!;
        // Track stats: successful dudo for AI
        if (gameState.stats[player.id]) {
          gameState.stats[player.id].dudosSuccessful++;
        }
      }

      // Apply die loss
      const loser = gameState.players.find(p => p.id === loserId);
      if (loser) {
        loser.diceCount -= 1;
        // Track stats: increment diceLost for loser
        if (gameState.stats[loserId]) {
          gameState.stats[loserId].diceLost++;
        }
        console.log(`[TIMEOUT DUDO] ${loser.name} lost a die, now has ${loser.diceCount} dice`);
        if (loser.diceCount <= 0) {
          loser.isEliminated = true;
          console.log(`[TIMEOUT DUDO] ${loser.name} has been ELIMINATED`);
        }
      }

      gameState.lastRoundLoserId = loserId;

      await this.persistState();

      // Build playerDiceCounts
      const playerDiceCounts: Record<string, number> = {};
      for (const p of gameState.players) {
        playerDiceCounts[p.id] = p.diceCount;
      }

      // Broadcast round result
      this.broadcast({
        type: 'ROUND_RESULT',
        bid: gameState.currentBid!,
        actualCount,
        allHands,
        loserId,
        winnerId: null,
        isCalza: false,
        lastBidderId: gameState.lastBidderId,
        playerDiceCounts,
        timestamp: Date.now(),
      });

      // Check for game end
      const remainingPlayers = gameState.players.filter(p => !p.isEliminated && p.diceCount > 0);
      if (remainingPlayers.length === 1) {
        gameState.phase = 'ended';
        await this.persistState();
        this.broadcast({
          type: 'GAME_ENDED',
          winnerId: remainingPlayers[0].id,
          stats: {
            roundsPlayed: gameState.roundNumber,
            totalBids: Object.values(gameState.stats).reduce((sum, s) => sum + s.bidsPlaced, 0),
            winnerId: remainingPlayers[0].id,
            playerStats: gameState.stats,
          },
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Process disconnect eliminations for players whose grace period has expired.
   */
  private async processDisconnectEliminations(now: number): Promise<void> {
    const allKeys = await this.room.storage.list();

    for (const [key, value] of allKeys) {
      if (!key.startsWith('disconnect_')) continue;

      const entry = value as { playerId: string; eliminateAt: number };
      if (!entry || entry.eliminateAt > now) continue;

      // Grace period expired - eliminate player if still disconnected
      console.log(`[DISCONNECT] Grace period expired for player ${entry.playerId}`);

      // Delete the storage entry first
      await this.room.storage.delete(key);

      // Find the player
      if (!this.roomState?.gameState) continue;

      const player = this.roomState.gameState.players.find(p => p.id === entry.playerId);
      if (!player) continue;

      // Check if player is still disconnected
      if (player.isConnected) {
        console.log(`[DISCONNECT] Player ${player.name} reconnected - skipping elimination`);
        continue;
      }

      // Already eliminated? Skip
      if (player.isEliminated) {
        console.log(`[DISCONNECT] Player ${player.name} already eliminated - skipping`);
        continue;
      }

      // Eliminate the player
      player.isEliminated = true;
      player.diceCount = 0;
      console.log(`[DISCONNECT] Player ${player.name} eliminated due to disconnect timeout`);

      await this.persistState();

      // Broadcast PLAYER_LEFT with reason 'eliminated'
      this.broadcast({
        type: 'PLAYER_LEFT',
        playerId: entry.playerId,
        reason: 'eliminated',
        timestamp: Date.now(),
      });

      // Check for game end condition
      const remainingPlayers = this.roomState.gameState.players.filter(
        p => !p.isEliminated && p.diceCount > 0
      );
      if (remainingPlayers.length === 1) {
        this.roomState.gameState.phase = 'ended';
        await this.persistState();
        const gameState = this.roomState.gameState;
        this.broadcast({
          type: 'GAME_ENDED',
          winnerId: remainingPlayers[0].id,
          stats: {
            roundsPlayed: gameState.roundNumber,
            totalBids: Object.values(gameState.stats).reduce((sum, s) => sum + s.bidsPlaced, 0),
            winnerId: remainingPlayers[0].id,
            playerStats: gameState.stats,
          },
          timestamp: Date.now(),
        });
      } else if (remainingPlayers.length === 0) {
        console.error('[DISCONNECT] ERROR: No remaining players after elimination!');
      } else {
        // Game continues - check if eliminated player was current turn player
        const gameState = this.roomState.gameState;
        if (gameState.phase === 'bidding' && gameState.currentTurnPlayerId === entry.playerId) {
          console.log(`[DISCONNECT] Eliminated player was current turn - advancing to next player`);

          // Find next active player
          const activePlayers = gameState.players.filter(p => !p.isEliminated);
          const currentIndex = activePlayers.findIndex(p => p.id === entry.playerId);
          // Since eliminated player is no longer in activePlayers after re-filtering, find next
          const stillActivePlayers = gameState.players.filter(p => !p.isEliminated && p.diceCount > 0);
          if (stillActivePlayers.length > 0) {
            // Get next player in turn order
            const eliminatedPlayerOrder = gameState.players.findIndex(p => p.id === entry.playerId);
            let nextPlayer: typeof stillActivePlayers[0] | null = null;

            // Search forward from eliminated player's position
            for (let i = 1; i < gameState.players.length; i++) {
              const checkIndex = (eliminatedPlayerOrder + i) % gameState.players.length;
              const candidate = gameState.players[checkIndex];
              if (!candidate.isEliminated && candidate.diceCount > 0) {
                nextPlayer = candidate;
                break;
              }
            }

            if (nextPlayer) {
              gameState.currentTurnPlayerId = nextPlayer.id;
              gameState.turnStartedAt = Date.now();
              await this.persistState();

              // Broadcast turn change
              this.broadcast({
                type: 'TURN_CHANGED',
                currentPlayerId: nextPlayer.id,
                turnStartedAt: gameState.turnStartedAt,
                timestamp: Date.now(),
              });

              // Set turn timer for next player
              await this.setTurnTimer();

              console.log(`[DISCONNECT] Turn advanced to ${nextPlayer.name}`);
            }
          }
        }
      }
    }
  }

  // Called when room starts or wakes from hibernation
  async onStart(): Promise<void> {
    // Load persisted state if it exists
    const savedState = await this.room.storage.get<ServerRoomState>('roomState');
    if (savedState) {
      this.roomState = savedState;
    }
  }

  // Called when a client connects
  async onConnect(
    connection: Party.Connection,
    _ctx: Party.ConnectionContext
  ): Promise<void> {
    // Store connection metadata
    connection.setState({ connectedAt: Date.now() });

    if (this.roomState) {
      // Check if returning player
      const existingPlayer = this.roomState.players.find(p => p.id === connection.id);
      if (existingPlayer) {
        // Returning user - update connection state
        existingPlayer.isConnected = true;
        existingPlayer.disconnectedAt = null;

        // Cancel any scheduled elimination and AI takeover for this player
        await this.room.storage.delete(`disconnect_${connection.id}`);
        await this.room.storage.delete(`aitakeover_${connection.id}`);
        await this.scheduleNextAlarm();

        await this.persistState();

        // Ensure hand length matches diceCount (fixes stale hand after losing dice)
        const safeHand = existingPlayer.hand.slice(0, existingPlayer.diceCount);

        this.sendToConnection(connection, {
          type: 'ROOM_STATE',
          state: this.getPublicRoomState(),
          yourPlayerId: connection.id,
          yourHand: safeHand,
          timestamp: Date.now(),
        });

        // Notify others of reconnection
        this.broadcast({
          type: 'PLAYER_RECONNECTED',
          playerId: connection.id,
          playerName: existingPlayer.name,
          timestamp: Date.now(),
        }, [connection.id]);

        console.log(`[RECONNECT] Player ${existingPlayer.name} reconnected`);
        return;
      }
    }

    // New user - send room info for join form
    const connectedCount = this.roomState?.players.filter(p => p.isConnected).length ?? 0;
    // Check if game is in progress - must explicitly check roomState and gameState exist
    // (undefined !== null is true, so we need to guard against undefined from optional chaining)
    const gameInProgress = Boolean(
      this.roomState?.gameState && this.roomState.gameState.phase !== 'lobby'
    );

    this.sendToConnection(connection, {
      type: 'ROOM_INFO',
      roomCode: this.room.id,
      playerCount: connectedCount,
      maxPlayers: MAX_PLAYERS,
      gameInProgress: gameInProgress ?? false,
      timestamp: Date.now(),
    });
  }

  // Called when a message is received
  async onMessage(
    message: string | ArrayBuffer,
    sender: Party.Connection
  ): Promise<void> {
    if (typeof message !== 'string') {
      this.sendError(sender, 'INVALID_ACTION', 'Binary messages not supported');
      return;
    }

    // Parse and validate message with Zod
    let parsed: ClientMessage;
    try {
      const raw = JSON.parse(message);
      parsed = ClientMessageSchema.parse(raw);
    } catch (error) {
      this.sendError(sender, 'INVALID_ACTION', 'Invalid message format');
      return;
    }

    // Handle message by type - TypeScript narrows automatically
    switch (parsed.type) {
      case 'JOIN_ROOM':
        await this.handleJoinRoom(parsed, sender);
        break;
      case 'LEAVE_ROOM':
        await this.handleLeaveRoom(parsed, sender);
        break;
      case 'START_GAME':
        await this.handleStartGame(parsed, sender);
        break;
      case 'ROLL_DICE':
        await this.handleRollDice(parsed, sender);
        break;
      case 'PLACE_BID':
        await this.handlePlaceBid(parsed, sender);
        break;
      case 'CALL_DUDO':
        await this.handleCallDudo(parsed, sender);
        break;
      case 'CALL_CALZA':
        await this.handleCallCalza(parsed, sender);
        break;
      case 'CONTINUE_ROUND':
        await this.handleContinueRound(parsed, sender);
        break;
      case 'UPDATE_SETTINGS':
        await this.handleUpdateSettings(parsed, sender);
        break;
      case 'KICK_PLAYER':
        await this.handleKickPlayer(parsed, sender);
        break;
      case 'SEND_EMOTE':
        await this.handleSendEmote(parsed, sender);
        break;
      case 'RETURN_TO_LOBBY':
        await this.handleReturnToLobby(parsed, sender);
        break;
    }
  }

  // Called when a client disconnects
  async onClose(connection: Party.Connection): Promise<void> {
    if (!this.roomState) return;

    const player = this.roomState.players.find(p => p.id === connection.id);
    if (player) {
      // Check if disconnecting player was host
      const wasHost = this.roomState.hostId === connection.id;

      // Mark player as disconnected with timestamp
      player.isConnected = false;
      player.disconnectedAt = Date.now();

      console.log(`[DISCONNECT] Player ${player.name} disconnected`);

      // Handle host transfer if necessary
      if (wasHost) {
        // Find first connected player (excluding the one who just disconnected)
        const connectedPlayers = this.roomState.players.filter(
          p => p.isConnected && p.id !== connection.id
        );

        if (connectedPlayers.length > 0) {
          const newHost = connectedPlayers[0]; // Earliest joined (array is ordered by join time)

          // Update isHost flags
          player.isHost = false;
          newHost.isHost = true;
          this.roomState.hostId = newHost.id;

          // Broadcast HOST_CHANGED
          this.broadcast({
            type: 'HOST_CHANGED',
            newHostId: newHost.id,
            timestamp: Date.now(),
          }, [connection.id]);
        }
      }

      // Schedule 60-second elimination if game is in progress
      const gameState = this.roomState.gameState;
      const gameInProgress = gameState && gameState.phase !== 'lobby' && gameState.phase !== 'ended';

      if (gameInProgress && !player.isEliminated) {
        const GRACE_PERIOD_MS = 60000; // 60 seconds
        const eliminateAt = Date.now() + GRACE_PERIOD_MS;

        await this.room.storage.put(`disconnect_${connection.id}`, {
          playerId: connection.id,
          eliminateAt,
        });

        console.log(`[DISCONNECT] Scheduled elimination for ${player.name} at ${new Date(eliminateAt).toISOString()}`);

        // If it's the disconnected player's turn, schedule AI takeover after short grace period
        // This allows for page refreshes without losing your turn
        if (gameState.phase === 'bidding' && gameState.currentTurnPlayerId === connection.id) {
          const AI_TAKEOVER_DELAY_MS = 5000; // 5 seconds grace for reconnection
          const aiTakeoverAt = Date.now() + AI_TAKEOVER_DELAY_MS;

          await this.room.storage.put(`aitakeover_${connection.id}`, {
            playerId: connection.id,
            takeoverAt: aiTakeoverAt,
          });

          console.log(`[DISCONNECT] Scheduled AI takeover for ${player.name} in 5 seconds`);
        }

        await this.scheduleNextAlarm();
      }

      await this.persistState();

      // Notify other players of disconnection
      this.broadcast({
        type: 'PLAYER_LEFT',
        playerId: connection.id,
        reason: 'disconnected',
        timestamp: Date.now(),
      }, [connection.id]);
    }
  }

  // ========== Message Handlers (Stubs) ==========
  // These will be fully implemented in later phases

  private async handleJoinRoom(
    msg: Extract<ClientMessage, { type: 'JOIN_ROOM' }>,
    sender: Party.Connection
  ): Promise<void> {
    const { playerName } = msg;

    // Validate nickname on server (trust but verify)
    if (playerName.length < 2 || playerName.length > 12) {
      this.sendError(sender, 'INVALID_NAME', 'Nickname must be 2-12 characters.');
      return;
    }

    if (!this.roomState) {
      // First player creates room and becomes host
      this.roomState = {
        roomCode: this.room.id,
        hostId: sender.id,
        players: [],
        gameState: null,
        settings: DEFAULT_SETTINGS,
        createdAt: Date.now(),
      };
    } else {
      // Check if already joined (shouldn't happen but defensive)
      if (this.roomState.players.some(p => p.id === sender.id && p.isConnected)) {
        // Already in room - just resend state
        this.sendToConnection(sender, {
          type: 'ROOM_STATE',
          state: this.getPublicRoomState(),
          yourPlayerId: sender.id,
          timestamp: Date.now(),
        });
        return;
      }

      // Check for duplicate nickname (case-insensitive)
      const duplicateName = this.roomState.players.some(
        p => p.name.toLowerCase() === playerName.toLowerCase() && p.isConnected
      );
      if (duplicateName) {
        this.sendError(sender, 'INVALID_NAME', 'This name is taken. Choose another.');
        return;
      }

      // Check room capacity
      const connectedCount = this.roomState.players.filter(p => p.isConnected).length;
      if (connectedCount >= MAX_PLAYERS) {
        this.sendError(sender, 'ROOM_FULL', `Room is full (${MAX_PLAYERS}/${MAX_PLAYERS} players).`);
        return;
      }

      // Check game state
      if (this.roomState.gameState !== null && this.roomState.gameState.phase !== 'lobby') {
        this.sendError(sender, 'INVALID_ACTION', 'Game in progress. Wait until it ends.');
        return;
      }
    }

    // Assign color (first available from list)
    const usedColors = new Set(this.roomState.players.map(p => p.color));
    const availableColors: Array<'blue' | 'green' | 'orange' | 'yellow' | 'purple' | 'red'> =
      ['blue', 'green', 'orange', 'yellow', 'purple', 'red'];
    const color = availableColors.find(c => !usedColors.has(c)) ?? 'blue';

    // Create player
    const newPlayer: ServerPlayer = {
      id: sender.id,
      name: playerName,
      color,
      diceCount: this.roomState.settings.startingDice,
      hand: [],
      isConnected: true,
      disconnectedAt: null,
      isEliminated: false,
      isHost: this.roomState.players.length === 0, // First player is host
    };

    this.roomState.players.push(newPlayer);
    await this.persistState();

    // Send full state to joiner
    this.sendToConnection(sender, {
      type: 'ROOM_STATE',
      state: this.getPublicRoomState(),
      yourPlayerId: sender.id,
      timestamp: Date.now(),
    });

    // Notify others
    this.broadcast({
      type: 'PLAYER_JOINED',
      player: { ...newPlayer, hand: [] }, // Don't leak hand
      timestamp: Date.now(),
    }, [sender.id]);
  }

  private async handleLeaveRoom(
    msg: Extract<ClientMessage, { type: 'LEAVE_ROOM' }>,
    sender: Party.Connection
  ): Promise<void> {
    // TODO: Implement in Phase 4
    console.log(`[LEAVE_ROOM] ${sender.id} leaving`);
  }

  private async handleStartGame(
    msg: Extract<ClientMessage, { type: 'START_GAME' }>,
    sender: Party.Connection
  ): Promise<void> {
    if (!this.roomState) {
      this.sendError(sender, 'INVALID_ACTION', 'Room does not exist');
      return;
    }

    // Verify sender is host
    if (this.roomState.hostId !== sender.id) {
      this.sendError(sender, 'NOT_HOST', 'Only the host can start the game');
      return;
    }

    // Verify game not already in progress
    if (this.roomState.gameState !== null && this.roomState.gameState.phase !== 'lobby') {
      this.sendError(sender, 'INVALID_ACTION', 'Game already in progress');
      return;
    }

    // Count connected players
    const connectedPlayers = this.roomState.players.filter(p => p.isConnected);
    const connectedCount = connectedPlayers.length;

    if (connectedCount < MIN_PLAYERS || connectedCount > MAX_PLAYERS) {
      this.sendError(sender, 'INVALID_ACTION', `Need ${MIN_PLAYERS}-${MAX_PLAYERS} players to start`);
      return;
    }

    // Find first connected player for turn order
    const firstPlayer = connectedPlayers[0];

    console.log(`[GAME_START] Starting game with ${connectedPlayers.length} players: ${connectedPlayers.map(p => p.name).join(', ')}`);

    // Reset dice counts to current setting (in case setting changed after players joined)
    const startingDice = this.roomState.settings.startingDice;
    for (const player of connectedPlayers) {
      player.diceCount = startingDice;
    }

    // Initialize per-player stats
    const initialStats: Record<string, PlayerStats> = {};
    for (const player of connectedPlayers) {
      initialStats[player.id] = {
        bidsPlaced: 0,
        dudosCalled: 0,
        dudosSuccessful: 0,
        calzasCalled: 0,
        calzasSuccessful: 0,
        diceLost: 0,
        diceGained: 0,
      };
    }

    // Set game state to initial rolling phase
    this.roomState.gameState = {
      phase: 'rolling',
      players: connectedPlayers,
      currentBid: null,
      currentTurnPlayerId: firstPlayer?.id ?? null,
      roundStarterId: firstPlayer?.id ?? null,
      lastBidderId: null,
      lastRoundLoserId: null,
      isPalifico: false,
      roundNumber: 1,
      turnStartedAt: Date.now(),
      lastActionWasTimeout: false,
      stats: initialStats,
    };

    await this.persistState();

    // Broadcast GAME_STARTED to all players with sanitized initial state
    // Sanitize: remove hands from players
    const sanitizedGameState = {
      ...this.roomState.gameState,
      players: this.roomState.gameState.players.map(p => ({
        ...p,
        hand: [], // Never send private hands
      })),
    };

    this.broadcast({
      type: 'GAME_STARTED',
      initialState: sanitizedGameState,
      timestamp: Date.now(),
    });
  }

  private async handleRollDice(
    msg: Extract<ClientMessage, { type: 'ROLL_DICE' }>,
    sender: Party.Connection
  ): Promise<void> {
    // Guard: game must exist
    if (!this.roomState?.gameState) {
      this.sendError(sender, 'GAME_NOT_STARTED', 'Game has not started');
      return;
    }

    // Guard: must be in rolling phase
    // If already in bidding phase, silently ignore - another client already triggered the roll
    // This handles the race condition where multiple clients send ROLL_DICE after GAME_STARTED
    if (this.roomState.gameState.phase !== 'rolling') {
      // Not an error - just a late/duplicate roll request after dice were already rolled
      // Re-send the player their hand in case they missed the DICE_ROLLED message
      const player = this.roomState.gameState.players.find(p => p.id === sender.id);
      if (player && !player.isEliminated && player.hand.length > 0) {
        this.sendToConnection(sender, {
          type: 'DICE_ROLLED',
          yourHand: player.hand,
          timestamp: Date.now(),
        });
      }
      return;
    }

    const gameState = this.roomState.gameState;

    // Roll dice for each non-eliminated player
    for (const player of gameState.players) {
      if (!player.isEliminated) {
        player.hand = rollDice(player.diceCount);
      }
    }

    // Check for palifico: round starter has exactly 1 die
    const roundStarter = gameState.players.find(p => p.id === gameState.roundStarterId);
    if (roundStarter && roundStarter.diceCount === 1 && this.roomState.settings.palificoEnabled) {
      gameState.isPalifico = true;
    } else {
      gameState.isPalifico = false;
    }

    // Transition to bidding phase
    gameState.phase = 'bidding';
    gameState.turnStartedAt = Date.now();

    await this.persistState();

    // Send private hand to each player
    for (const connection of this.room.getConnections()) {
      const player = gameState.players.find(p => p.id === connection.id);
      if (player && !player.isEliminated) {
        this.sendToConnection(connection, {
          type: 'DICE_ROLLED',
          yourHand: player.hand,
          timestamp: Date.now(),
        });
      }
    }

    // Broadcast public game state (without private hands)
    this.broadcast({
      type: 'GAME_STATE',
      state: this.getPublicRoomState().gameState,
      timestamp: Date.now(),
    });

    // Set turn timer for the first player
    await this.setTurnTimer();
  }

  private async handlePlaceBid(
    msg: Extract<ClientMessage, { type: 'PLACE_BID' }>,
    sender: Party.Connection
  ): Promise<void> {
    // Guard: game must exist and be in bidding phase
    if (!this.roomState?.gameState || this.roomState.gameState.phase !== 'bidding') {
      this.sendError(sender, 'INVALID_ACTION', 'Not in bidding phase');
      return;
    }

    const gameState = this.roomState.gameState;

    // Clear timeout flag - this is a human action
    gameState.lastActionWasTimeout = false;

    // Guard: must be sender's turn
    if (gameState.currentTurnPlayerId !== sender.id) {
      this.sendError(sender, 'NOT_YOUR_TURN', 'It is not your turn');
      return;
    }

    // Calculate total dice in play
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const totalDice = activePlayers.reduce((sum, p) => sum + p.diceCount, 0);

    // Validate bid
    const validation = isValidBid(msg.bid, gameState.currentBid, totalDice, gameState.isPalifico);
    if (!validation.valid) {
      this.sendToConnection(sender, {
        type: 'ERROR',
        error: {
          type: 'INVALID_BID',
          reason: validation.reason || 'Invalid bid',
          currentBid: gameState.currentBid,
        },
        timestamp: Date.now(),
      });
      return;
    }

    // Track stats: increment bidsPlaced
    if (gameState.stats[sender.id]) {
      gameState.stats[sender.id].bidsPlaced++;
    }

    // Update game state
    gameState.currentBid = msg.bid;
    gameState.lastBidderId = sender.id;

    // Advance turn to next active player
    const currentIndex = activePlayers.findIndex(p => p.id === sender.id);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    gameState.currentTurnPlayerId = activePlayers[nextIndex].id;
    gameState.turnStartedAt = Date.now();

    await this.persistState();

    // Broadcast bid placed
    this.broadcast({
      type: 'BID_PLACED',
      playerId: sender.id,
      bid: msg.bid,
      timestamp: Date.now(),
    });

    // Set turn timer for next player
    await this.setTurnTimer();
  }

  private async handleCallDudo(
    msg: Extract<ClientMessage, { type: 'CALL_DUDO' }>,
    sender: Party.Connection
  ): Promise<void> {
    // Guard: game must exist and be in bidding phase
    if (!this.roomState?.gameState || this.roomState.gameState.phase !== 'bidding') {
      this.sendError(sender, 'INVALID_ACTION', 'Not in bidding phase');
      return;
    }

    const gameState = this.roomState.gameState;

    // Clear timeout flag - this is a human action
    gameState.lastActionWasTimeout = false;

    // Guard: must be sender's turn
    if (gameState.currentTurnPlayerId !== sender.id) {
      this.sendError(sender, 'NOT_YOUR_TURN', 'It is not your turn');
      return;
    }

    // Guard: must have a bid to challenge
    if (!gameState.currentBid) {
      this.sendError(sender, 'INVALID_ACTION', 'No bid to challenge');
      return;
    }

    // Track stats: increment dudosCalled
    if (gameState.stats[sender.id]) {
      gameState.stats[sender.id].dudosCalled++;
    }

    // Transition to reveal phase (alarm is naturally ignored since phase changes)
    gameState.phase = 'reveal';

    // Broadcast dudo called
    this.broadcast({
      type: 'DUDO_CALLED',
      callerId: sender.id,
      timestamp: Date.now(),
    });

    // Calculate actual count of matching dice
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    let actualCount = 0;
    for (const player of activePlayers) {
      actualCount += countMatching(player.hand, gameState.currentBid.value, gameState.isPalifico);
    }

    // Build allHands for reveal
    const allHands: Record<string, number[]> = {};
    for (const player of activePlayers) {
      allHands[player.id] = player.hand;
    }

    // Determine loser: if actualCount >= bid.count, bid was correct, challenger loses
    // Otherwise, bid was wrong, last bidder loses
    let loserId: string;
    if (actualCount >= gameState.currentBid.count) {
      // Bid was correct - challenger (sender) loses
      loserId = sender.id;
    } else {
      // Bid was wrong - last bidder loses
      loserId = gameState.lastBidderId!;
      // Track stats: successful dudo for sender
      if (gameState.stats[sender.id]) {
        gameState.stats[sender.id].dudosSuccessful++;
      }
    }

    // Apply die loss to loser
    const loser = gameState.players.find(p => p.id === loserId);
    if (loser) {
      loser.diceCount -= 1;
      // Track stats: increment diceLost for loser
      if (gameState.stats[loserId]) {
        gameState.stats[loserId].diceLost++;
      }
      console.log(`[DUDO] ${loser.name} lost a die, now has ${loser.diceCount} dice`);
      if (loser.diceCount <= 0) {
        loser.isEliminated = true;
        console.log(`[DUDO] ${loser.name} has been ELIMINATED`);
      }
    }

    // Track loser for next round starter
    gameState.lastRoundLoserId = loserId;

    await this.persistState();

    // Build playerDiceCounts map with updated values
    const playerDiceCounts: Record<string, number> = {};
    for (const player of gameState.players) {
      playerDiceCounts[player.id] = player.diceCount;
    }

    // Broadcast round result
    this.broadcast({
      type: 'ROUND_RESULT',
      bid: gameState.currentBid,
      actualCount,
      allHands,
      loserId,
      winnerId: null,
      isCalza: false,
      lastBidderId: gameState.lastBidderId,
      playerDiceCounts,
      timestamp: Date.now(),
    });

    // Check for game end - only end when exactly 1 player with dice remains
    const remainingPlayers = gameState.players.filter(p => !p.isEliminated && p.diceCount > 0);
    console.log(`[DUDO] Remaining players after round: ${remainingPlayers.length} (${remainingPlayers.map(p => p.name).join(', ')})`);
    if (remainingPlayers.length === 1) {
      gameState.phase = 'ended';
      await this.persistState();
      this.broadcast({
        type: 'GAME_ENDED',
        winnerId: remainingPlayers[0].id,
        stats: {
          roundsPlayed: gameState.roundNumber,
          totalBids: Object.values(gameState.stats).reduce((sum, s) => sum + s.bidsPlaced, 0),
          winnerId: remainingPlayers[0].id,
          playerStats: gameState.stats,
        },
        timestamp: Date.now(),
      });
    } else if (remainingPlayers.length === 0) {
      // Edge case: somehow no players left (shouldn't happen)
      console.error('[DUDO] ERROR: No remaining players after round!');
    }
  }

  private async handleCallCalza(
    msg: Extract<ClientMessage, { type: 'CALL_CALZA' }>,
    sender: Party.Connection
  ): Promise<void> {
    // Guard: game must exist and be in bidding phase
    if (!this.roomState?.gameState || this.roomState.gameState.phase !== 'bidding') {
      this.sendError(sender, 'INVALID_ACTION', 'Not in bidding phase');
      return;
    }

    const gameState = this.roomState.gameState;

    // Clear timeout flag - this is a human action
    gameState.lastActionWasTimeout = false;

    // Guard: must be sender's turn (calza is a turn action like bid or dudo)
    if (gameState.currentTurnPlayerId !== sender.id) {
      this.sendError(sender, 'NOT_YOUR_TURN', 'It is not your turn');
      return;
    }

    // Guard: must have a bid to calza
    if (!gameState.currentBid) {
      this.sendError(sender, 'INVALID_ACTION', 'No bid to calza');
      return;
    }

    // Track stats: increment calzasCalled
    if (gameState.stats[sender.id]) {
      gameState.stats[sender.id].calzasCalled++;
    }

    // Transition to reveal phase (alarm is naturally ignored since phase changes)
    gameState.phase = 'reveal';

    // Broadcast calza called
    this.broadcast({
      type: 'CALZA_CALLED',
      callerId: sender.id,
      timestamp: Date.now(),
    });

    // Calculate actual count of matching dice
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    let actualCount = 0;
    for (const player of activePlayers) {
      actualCount += countMatching(player.hand, gameState.currentBid.value, gameState.isPalifico);
    }

    // Build allHands for reveal
    const allHands: Record<string, number[]> = {};
    for (const player of activePlayers) {
      allHands[player.id] = player.hand;
    }

    // Determine result: calza succeeds only if count is EXACTLY right
    const caller = gameState.players.find(p => p.id === sender.id);
    let loserId: string | null = null;
    let winnerId: string | null = null;

    if (actualCount === gameState.currentBid.count) {
      // Calza success - caller gains 1 die (up to max starting dice)
      const maxDice = this.roomState.settings.startingDice;
      const canGainDie = caller && caller.diceCount < maxDice;

      if (canGainDie) {
        winnerId = sender.id;
        caller.diceCount += 1;
        // Track stats: diceGained only if actually gained
        if (gameState.stats[sender.id]) {
          gameState.stats[sender.id].diceGained++;
        }
      }
      // Track stats: calzasSuccessful even if at max dice
      if (gameState.stats[sender.id]) {
        gameState.stats[sender.id].calzasSuccessful++;
      }
      // On calza success, the last bidder starts next round (convention varies)
      // Using caller as the next starter since they "won" the round
      gameState.lastRoundLoserId = null; // No loser on success
    } else {
      // Calza failed - caller loses 1 die
      loserId = sender.id;
      if (caller) {
        caller.diceCount -= 1;
        // Track stats: diceLost for failed calza
        if (gameState.stats[sender.id]) {
          gameState.stats[sender.id].diceLost++;
        }
        console.log(`[CALZA] ${caller.name} lost a die, now has ${caller.diceCount} dice`);
        if (caller.diceCount <= 0) {
          caller.isEliminated = true;
          console.log(`[CALZA] ${caller.name} has been ELIMINATED`);
        }
      }
      // Track loser for next round starter
      gameState.lastRoundLoserId = loserId;
    }

    await this.persistState();

    // Build playerDiceCounts map with updated values
    const playerDiceCounts: Record<string, number> = {};
    for (const player of gameState.players) {
      playerDiceCounts[player.id] = player.diceCount;
    }
    // Broadcast round result
    this.broadcast({
      type: 'ROUND_RESULT',
      bid: gameState.currentBid,
      actualCount,
      allHands,
      loserId,
      winnerId,
      isCalza: true,
      lastBidderId: gameState.lastBidderId,
      playerDiceCounts,
      timestamp: Date.now(),
    });

    // Check for game end - only end when exactly 1 player with dice remains
    const remainingPlayers = gameState.players.filter(p => !p.isEliminated && p.diceCount > 0);
    console.log(`[CALZA] Remaining players after round: ${remainingPlayers.length} (${remainingPlayers.map(p => p.name).join(', ')})`);
    if (remainingPlayers.length === 1) {
      gameState.phase = 'ended';
      await this.persistState();
      this.broadcast({
        type: 'GAME_ENDED',
        winnerId: remainingPlayers[0].id,
        stats: {
          roundsPlayed: gameState.roundNumber,
          totalBids: Object.values(gameState.stats).reduce((sum, s) => sum + s.bidsPlaced, 0),
          winnerId: remainingPlayers[0].id,
          playerStats: gameState.stats,
        },
        timestamp: Date.now(),
      });
    } else if (remainingPlayers.length === 0) {
      // Edge case: somehow no players left (shouldn't happen)
      console.error('[CALZA] ERROR: No remaining players after round!');
    }
  }

  private async handleContinueRound(
    msg: Extract<ClientMessage, { type: 'CONTINUE_ROUND' }>,
    sender: Party.Connection
  ): Promise<void> {
    // Guard: game must exist
    if (!this.roomState?.gameState) {
      this.sendError(sender, 'GAME_NOT_STARTED', 'Game has not started');
      return;
    }

    const gameState = this.roomState.gameState;

    // Guard: game is over (check first since 'ended' is terminal)
    if (gameState.phase === 'ended') {
      return; // Silently ignore - game is over
    }

    // Guard: must be in reveal phase
    if (gameState.phase !== 'reveal') {
      this.sendError(sender, 'INVALID_ACTION', 'Not in reveal phase');
      return;
    }

    // Reset for new round
    gameState.currentBid = null;
    gameState.lastBidderId = null;
    gameState.roundNumber += 1;

    // Get active (non-eliminated) players
    const activePlayers = gameState.players.filter(p => !p.isEliminated);

    // Determine next round starter:
    // The loser of the previous round starts, if still in game
    // If loser was eliminated or calza success (no loser), use last bidder then fallback to first player
    let newStarterId: string | null = null;

    if (gameState.lastRoundLoserId) {
      // Check if loser is still active
      const loserStillActive = activePlayers.find(p => p.id === gameState.lastRoundLoserId);
      if (loserStillActive) {
        newStarterId = gameState.lastRoundLoserId;
      } else {
        // Loser was eliminated - find next player in turn order after the loser
        const allPlayers = gameState.players;
        const loserIndex = allPlayers.findIndex(p => p.id === gameState.lastRoundLoserId);
        // Search forward from loser for first active player
        for (let i = 1; i <= allPlayers.length; i++) {
          const nextPlayer = allPlayers[(loserIndex + i) % allPlayers.length];
          if (!nextPlayer.isEliminated) {
            newStarterId = nextPlayer.id;
            break;
          }
        }
      }
    } else {
      // Calza success case (no loser) - use last bidder or first active player
      const lastBidder = activePlayers.find(p => p.id === gameState.lastBidderId);
      newStarterId = lastBidder?.id ?? activePlayers[0]?.id ?? null;
    }

    // Fallback to first active player if somehow still null
    if (!newStarterId && activePlayers.length > 0) {
      newStarterId = activePlayers[0].id;
    }

    gameState.roundStarterId = newStarterId;
    gameState.currentTurnPlayerId = newStarterId;

    // Check palifico: round starter has exactly 1 die
    const roundStarter = activePlayers.find(p => p.id === newStarterId);
    if (roundStarter && roundStarter.diceCount === 1 && this.roomState.settings.palificoEnabled) {
      gameState.isPalifico = true;
    } else {
      gameState.isPalifico = false;
    }

    // Roll dice for each non-eliminated player immediately
    // (No need for 'rolling' phase - we roll synchronously here)
    for (const player of activePlayers) {
      player.hand = rollDice(player.diceCount);
    }

    // Transition directly to bidding phase
    gameState.phase = 'bidding';
    gameState.turnStartedAt = Date.now();

    await this.persistState();

    // Send private hand to each player
    for (const connection of this.room.getConnections()) {
      const player = activePlayers.find(p => p.id === connection.id);
      if (player) {
        this.sendToConnection(connection, {
          type: 'DICE_ROLLED',
          yourHand: player.hand,
          timestamp: Date.now(),
        });
      }
    }

    // Broadcast public game state (now in bidding phase)
    // Sanitize gameState.players to clear private hands before broadcasting
    const sanitizedGameState = {
      ...gameState,
      players: gameState.players.map(p => ({
        ...p,
        hand: [], // Never send private hands in broadcast
      })),
    };
    this.broadcast({
      type: 'GAME_STATE',
      state: sanitizedGameState,
      timestamp: Date.now(),
    });

    // Set turn timer for the round starter
    await this.setTurnTimer();
  }

  private async handleUpdateSettings(
    msg: Extract<ClientMessage, { type: 'UPDATE_SETTINGS' }>,
    sender: Party.Connection
  ): Promise<void> {
    if (!this.roomState) {
      this.sendError(sender, 'INVALID_ACTION', 'Room does not exist');
      return;
    }

    // Verify sender is host
    if (this.roomState.hostId !== sender.id) {
      this.sendError(sender, 'NOT_HOST', 'Only the host can change settings');
      return;
    }

    // Verify game not in progress
    if (this.roomState.gameState !== null && this.roomState.gameState.phase !== 'lobby') {
      this.sendError(sender, 'INVALID_ACTION', 'Cannot change settings during game');
      return;
    }

    // Merge settings (partial update)
    this.roomState.settings = {
      ...this.roomState.settings,
      ...msg.settings,
    };

    await this.persistState();

    // Broadcast updated settings to all players
    this.broadcast({
      type: 'SETTINGS_UPDATED',
      settings: this.roomState.settings,
      timestamp: Date.now(),
    });
  }

  private async handleKickPlayer(
    msg: Extract<ClientMessage, { type: 'KICK_PLAYER' }>,
    sender: Party.Connection
  ): Promise<void> {
    if (!this.roomState) {
      this.sendError(sender, 'INVALID_ACTION', 'Room does not exist');
      return;
    }

    // Verify sender is host
    if (this.roomState.hostId !== sender.id) {
      this.sendError(sender, 'NOT_HOST', 'Only the host can kick players');
      return;
    }

    // Verify target exists and is not the host
    const targetIndex = this.roomState.players.findIndex(p => p.id === msg.playerId);
    if (targetIndex === -1) {
      this.sendError(sender, 'INVALID_ACTION', 'Player not found');
      return;
    }

    if (msg.playerId === this.roomState.hostId) {
      this.sendError(sender, 'INVALID_ACTION', 'Cannot kick yourself');
      return;
    }

    // Remove player from room
    this.roomState.players.splice(targetIndex, 1);
    await this.persistState();

    // Broadcast PLAYER_LEFT with reason 'kicked' to all
    this.broadcast({
      type: 'PLAYER_LEFT',
      playerId: msg.playerId,
      reason: 'kicked',
      timestamp: Date.now(),
    });

    // Close kicked player's connection
    for (const connection of this.room.getConnections()) {
      if (connection.id === msg.playerId) {
        connection.close();
        break;
      }
    }
  }

  private async handleSendEmote(
    msg: Extract<ClientMessage, { type: 'SEND_EMOTE' }>,
    sender: Party.Connection
  ): Promise<void> {
    // Guard: player must be in room
    if (!this.roomState) return;
    const player = this.roomState.players.find(p => p.id === sender.id);
    if (!player) return;

    // Check cooldown (silently ignore if too frequent)
    const lastEmote = this.playerEmoteCooldowns.get(sender.id) ?? 0;
    if (Date.now() - lastEmote < this.EMOTE_COOLDOWN_MS) {
      return; // Silently ignore - no error needed for spam protection
    }

    // Update cooldown
    this.playerEmoteCooldowns.set(sender.id, Date.now());

    // Broadcast to all players
    this.broadcast({
      type: 'EMOTE_RECEIVED',
      playerId: sender.id,
      emote: msg.emote,
      timestamp: Date.now(),
    });

    console.log(`[EMOTE] ${player.name} sent emote: ${msg.emote}`);
  }

  private async handleReturnToLobby(
    msg: Extract<ClientMessage, { type: 'RETURN_TO_LOBBY' }>,
    sender: Party.Connection
  ): Promise<void> {
    if (!this.roomState) {
      this.sendError(sender, 'INVALID_ACTION', 'Room does not exist');
      return;
    }

    // Only host can initiate return to lobby
    if (this.roomState.hostId !== sender.id) {
      this.sendError(sender, 'NOT_HOST', 'Only host can return to lobby');
      return;
    }

    // Only valid from ended game state
    if (!this.roomState.gameState || this.roomState.gameState.phase !== 'ended') {
      this.sendError(sender, 'INVALID_ACTION', 'Game must be ended to return to lobby');
      return;
    }

    // Remove disconnected players from room
    this.roomState.players = this.roomState.players.filter(p => p.isConnected);

    // Reset player state for potential rematch
    for (const player of this.roomState.players) {
      player.diceCount = this.roomState.settings.startingDice;
      player.isEliminated = false;
      player.hand = [];
    }

    // Clear game state (back to lobby)
    this.roomState.gameState = null;

    // Clear any pending alarms/timers
    await this.room.storage.delete('turnTimer');
    const allKeys = await this.room.storage.list();
    for (const [key] of allKeys) {
      if (key.startsWith('disconnect_') || key.startsWith('aitakeover_')) {
        await this.room.storage.delete(key);
      }
    }

    await this.persistState();

    console.log(`[RETURN_TO_LOBBY] Host ${sender.id} returning ${this.roomState.players.length} players to lobby`);

    // Send ROOM_STATE to each connected player
    for (const conn of this.room.getConnections()) {
      const player = this.roomState.players.find(p => p.id === conn.id);
      if (player) {
        this.sendToConnection(conn, {
          type: 'ROOM_STATE',
          state: this.getPublicRoomState(),
          yourPlayerId: conn.id,
          timestamp: Date.now(),
        });
      }
    }
  }

  // ========== Helper Methods ==========

  private getPublicRoomState(): ServerRoomState {
    if (!this.roomState) {
      throw new Error('Room state not initialized');
    }
    // Return state without private hand data
    return {
      ...this.roomState,
      players: this.roomState.players.map(p => ({
        ...p,
        hand: [], // Never send other players' hands
      })),
    };
  }

  private async persistState(): Promise<void> {
    if (this.roomState) {
      await this.room.storage.put('roomState', this.roomState);
    }
  }

  private sendToConnection(
    connection: Party.Connection,
    message: ServerMessage
  ): void {
    connection.send(JSON.stringify(message));
  }

  private broadcast(
    message: ServerMessage,
    exclude?: string[]
  ): void {
    const json = JSON.stringify(message);
    for (const connection of this.room.getConnections()) {
      if (!exclude?.includes(connection.id)) {
        connection.send(json);
      }
    }
  }

  private sendError(
    connection: Party.Connection,
    type: string,
    reason: string
  ): void {
    this.sendToConnection(connection, {
      type: 'ERROR',
      error: { type: type as 'INVALID_ACTION', reason },
      timestamp: Date.now(),
    });
  }
}
