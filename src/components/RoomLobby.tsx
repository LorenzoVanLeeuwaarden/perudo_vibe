'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Loader2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RoomShare } from '@/components/RoomShare';
import { PlayerList } from '@/components/PlayerList';
import { KickConfirmDialog } from '@/components/KickConfirmDialog';
import { GameSettingsModal } from '@/components/GameSettingsModal';
import { LobbyLayout } from '@/components/LobbyLayout';
import { type ConnectionStatus } from '@/hooks/useRoomConnection';
import { useUIStore } from '@/stores/uiStore';
import type { ServerRoomState, ClientMessage, GameSettings } from '@/shared';

interface RoomLobbyProps {
  roomCode: string;
  roomState: ServerRoomState;
  myPlayerId: string;
  connectionStatus: ConnectionStatus;
  sendMessage: (msg: ClientMessage) => void;
}

export function RoomLobby({ roomCode, roomState, myPlayerId, connectionStatus, sendMessage }: RoomLobbyProps) {
  const router = useRouter();
  const { playerColor, clearPreferredMode } = useUIStore();

  const [showKickDialog, setShowKickDialog] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const isHost = roomState.hostId === myPlayerId;
  const connectedCount = roomState.players.filter(p => p.isConnected).length;
  const canStart = connectedCount >= 2 && connectedCount <= 6;

  const handleBack = () => {
    clearPreferredMode();
    router.push('/');
  };

  const handleKickConfirm = () => {
    if (showKickDialog) {
      sendMessage({ type: 'KICK_PLAYER', playerId: showKickDialog, timestamp: Date.now() });
      setShowKickDialog(null);
    }
  };

  const handleSaveSettings = (settings: Partial<GameSettings>) => {
    sendMessage({ type: 'UPDATE_SETTINGS', settings, timestamp: Date.now() });
  };

  const handleStartGame = () => {
    sendMessage({ type: 'START_GAME', timestamp: Date.now() });
  };

  const playerToKick = roomState.players.find(p => p.id === showKickDialog);

  return (
    <>
      {/* Connection status indicator - fixed position outside LobbyLayout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-purple-deep/90 border border-purple-mid backdrop-blur-sm flex items-center gap-2"
      >
        {connectionStatus === 'connecting' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
            <span className="text-sm text-yellow-400">Connecting...</span>
          </>
        )}
        {connectionStatus === 'connected' && (
          <>
            <Wifi className="w-4 h-4 text-green-crt" />
            <span className="text-sm text-green-crt">Connected</span>
          </>
        )}
        {connectionStatus === 'disconnected' && (
          <>
            <WifiOff className="w-4 h-4 text-red-danger" />
            <span className="text-sm text-red-danger">Disconnected</span>
          </>
        )}
        {connectionStatus === 'error' && (
          <>
            <WifiOff className="w-4 h-4 text-red-danger" />
            <span className="text-sm text-red-danger">Connection Error</span>
          </>
        )}
      </motion.div>

      <LobbyLayout
        title={`Room: ${roomCode}`}
        onBack={handleBack}
        confirmBack={true}
        backConfirmTitle="Leave Lobby?"
        backConfirmMessage="You will be removed from the game room."
        headerRight={null}
        footer={
          isHost ? (
            <motion.button
              whileHover={canStart ? { scale: 1.02 } : {}}
              whileTap={canStart ? { scale: 0.98 } : {}}
              onClick={handleStartGame}
              disabled={!canStart}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
                canStart
                  ? 'bg-gold-accent text-purple-deep hover:bg-gold-accent/90'
                  : 'bg-purple-mid/50 text-white-soft/50 cursor-not-allowed'
              }`}
            >
              Start Game
            </motion.button>
          ) : (
            <div className="text-center py-4">
              <p className="text-white-soft/60">
                Waiting for host to start... ({connectedCount}/6 players)
              </p>
            </div>
          )
        }
      >
        {/* Content: Player list, settings button, share section */}
        <div className="space-y-6">
          {/* Player List section */}
          <div>
            <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider mb-3">
              Players ({connectedCount}/6)
            </h3>
            <PlayerList
              players={roomState.players}
              myPlayerId={myPlayerId}
              isHost={isHost}
              onKickPlayer={(playerId) => setShowKickDialog(playerId)}
            />
          </div>

          {/* Settings section */}
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSettings(true)}
              className="w-full py-3 rounded-lg bg-purple-mid border border-purple-glow text-white-soft flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {isHost ? 'Configure Game' : 'Game Settings'}
            </motion.button>
          </div>

          {/* Share section */}
          <div className="pt-4 border-t border-purple-mid">
            <RoomShare roomCode={roomCode} playerColor={playerColor} />
          </div>
        </div>
      </LobbyLayout>

      {/* Kick Confirm Dialog */}
      <KickConfirmDialog
        isOpen={!!showKickDialog}
        playerName={playerToKick?.name ?? ''}
        onCancel={() => setShowKickDialog(null)}
        onConfirm={handleKickConfirm}
      />

      {/* Game Settings Modal */}
      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={roomState.settings}
        isHost={isHost}
        onSave={handleSaveSettings}
      />
    </>
  );
}
