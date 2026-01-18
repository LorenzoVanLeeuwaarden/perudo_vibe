import type * as Party from 'partykit/server';
import {
  ClientMessageSchema,
  type ClientMessage,
  type ServerMessage,
  type ServerRoomState,
  type ServerPlayer,
  type GameSettings,
  STARTING_DICE,
  DEFAULT_TURN_TIMEOUT_MS,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from '../src/shared';
import { rollDice, isValidBid, countMatching } from '../src/lib/gameLogic';

// Default game settings
const DEFAULT_SETTINGS: GameSettings = {
  startingDice: STARTING_DICE,
  palificoEnabled: false,
  turnTimeoutMs: DEFAULT_TURN_TIMEOUT_MS,
};

export default class GameServer implements Party.Server {
  // Room state - persisted via PartyKit storage
  private roomState: ServerRoomState | null = null;

  constructor(readonly room: Party.Room) {}

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
        // Returning user - update connection, send state
        existingPlayer.isConnected = true;
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
    }
  }

  // Called when a client disconnects
  async onClose(connection: Party.Connection): Promise<void> {
    if (!this.roomState) return;

    const player = this.roomState.players.find(p => p.id === connection.id);
    if (player) {
      // Check if disconnecting player was host
      const wasHost = this.roomState.hostId === connection.id;

      // Mark player as disconnected
      player.isConnected = false;

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

          // Persist state before broadcasting
          await this.persistState();

          // Broadcast HOST_CHANGED
          this.broadcast({
            type: 'HOST_CHANGED',
            newHostId: newHost.id,
            timestamp: Date.now(),
          }, [connection.id]);
        } else {
          // No players left, just persist
          await this.persistState();
        }
      } else {
        await this.persistState();
      }

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
    const availableColors: Array<'blue' | 'green' | 'orange' | 'yellow' | 'black' | 'red'> =
      ['blue', 'green', 'orange', 'yellow', 'black', 'red'];
    const color = availableColors.find(c => !usedColors.has(c)) ?? 'blue';

    // Create player
    const newPlayer: ServerPlayer = {
      id: sender.id,
      name: playerName,
      color,
      diceCount: this.roomState.settings.startingDice,
      hand: [],
      isConnected: true,
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

    // Transition to reveal phase
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
    }

    // Apply die loss to loser
    const loser = gameState.players.find(p => p.id === loserId);
    if (loser) {
      loser.diceCount -= 1;
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

    // Transition to reveal phase
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
      // Calza success - caller gains 1 die (max 5)
      winnerId = sender.id;
      if (caller) {
        caller.diceCount = Math.min(caller.diceCount + 1, 5);
      }
      // On calza success, the last bidder starts next round (convention varies)
      // Using caller as the next starter since they "won" the round
      gameState.lastRoundLoserId = null; // No loser on success
    } else {
      // Calza failed - caller loses 1 die
      loserId = sender.id;
      if (caller) {
        caller.diceCount -= 1;
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
