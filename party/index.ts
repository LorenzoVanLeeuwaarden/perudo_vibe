import type * as Party from 'partykit/server';
import {
  ClientMessageSchema,
  type ClientMessage,
  type ServerMessage,
  type ServerRoomState,
  type GameSettings,
  STARTING_DICE,
  DEFAULT_TURN_TIMEOUT_MS,
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
    ctx: Party.ConnectionContext
  ): Promise<void> {
    // Store connection metadata
    connection.setState({ connectedAt: Date.now() });

    // If room doesn't exist yet, don't send state
    // Client must send JOIN_ROOM message to initialize
    if (this.roomState) {
      // Check if this is a reconnecting player
      const existingPlayer = this.roomState.players.find(
        p => p.id === connection.id
      );
      if (existingPlayer) {
        // Reconnection - update connection status
        existingPlayer.isConnected = true;
        await this.persistState();

        // Send current state to reconnecting player
        this.sendToConnection(connection, {
          type: 'ROOM_STATE',
          state: this.getPublicRoomState(),
          yourPlayerId: connection.id,
          yourHand: existingPlayer.hand,
          timestamp: Date.now(),
        });
      }
    }
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
      player.isConnected = false;
      await this.persistState();

      // Notify other players
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
    // TODO: Implement in Phase 4 (Join Flow)
    // For now, just log
    console.log(`[JOIN_ROOM] ${msg.playerName} wants to join`);
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
    // TODO: Implement in Phase 5 (Lobby Experience)
    console.log(`[START_GAME] requested by ${sender.id}`);
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
    // TODO: Implement in Phase 5
    console.log(`[UPDATE_SETTINGS] by ${sender.id}`);
  }

  private async handleKickPlayer(
    msg: Extract<ClientMessage, { type: 'KICK_PLAYER' }>,
    sender: Party.Connection
  ): Promise<void> {
    // TODO: Implement in Phase 5
    console.log(`[KICK_PLAYER] ${msg.playerId} by ${sender.id}`);
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

// Suppress unused variable warnings for DEFAULT_SETTINGS (will be used in Phase 4)
void DEFAULT_SETTINGS;
