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

        this.sendToConnection(connection, {
          type: 'ROOM_STATE',
          state: this.getPublicRoomState(),
          yourPlayerId: connection.id,
          yourHand: existingPlayer.hand,
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

    // Set game state to initial rolling phase
    this.roomState.gameState = {
      phase: 'rolling',
      players: connectedPlayers,
      currentBid: null,
      currentTurnPlayerId: firstPlayer?.id ?? null,
      roundStarterId: firstPlayer?.id ?? null,
      lastBidderId: null,
      isPalifico: false,
      roundNumber: 1,
      turnStartedAt: Date.now(),
    };

    await this.persistState();

    // Broadcast GAME_STARTED to all players
    this.broadcast({
      type: 'GAME_STARTED',
      timestamp: Date.now(),
    });
  }

  private async handleRollDice(
    msg: Extract<ClientMessage, { type: 'ROLL_DICE' }>,
    sender: Party.Connection
  ): Promise<void> {
    // TODO: Implement in Phase 6 (Game State Sync)
    console.log(`[ROLL_DICE] requested by ${sender.id}`);
  }

  private async handlePlaceBid(
    msg: Extract<ClientMessage, { type: 'PLACE_BID' }>,
    sender: Party.Connection
  ): Promise<void> {
    // TODO: Implement in Phase 6
    console.log(`[PLACE_BID] ${msg.bid.count}x${msg.bid.value} by ${sender.id}`);
  }

  private async handleCallDudo(
    msg: Extract<ClientMessage, { type: 'CALL_DUDO' }>,
    sender: Party.Connection
  ): Promise<void> {
    // TODO: Implement in Phase 6
    console.log(`[CALL_DUDO] by ${sender.id}`);
  }

  private async handleCallCalza(
    msg: Extract<ClientMessage, { type: 'CALL_CALZA' }>,
    sender: Party.Connection
  ): Promise<void> {
    // TODO: Implement in Phase 6
    console.log(`[CALL_CALZA] by ${sender.id}`);
  }

  private async handleContinueRound(
    msg: Extract<ClientMessage, { type: 'CONTINUE_ROUND' }>,
    sender: Party.Connection
  ): Promise<void> {
    // TODO: Implement in Phase 6
    console.log(`[CONTINUE_ROUND] by ${sender.id}`);
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
