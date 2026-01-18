'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RoomShare } from '@/components/RoomShare';
import { useRoomConnection, type ConnectionStatus } from '@/hooks/useRoomConnection';
import { useUIStore } from '@/stores/uiStore';
import { PLAYER_COLORS } from '@/lib/types';
import { CasinoLogo } from '@/components/CasinoLogo';
import { ShaderBackground } from '@/components/ShaderBackground';

interface RoomLobbyProps {
  roomCode: string;
}

export function RoomLobby({ roomCode }: RoomLobbyProps) {
  const router = useRouter();
  const { playerColor, clearPreferredMode } = useUIStore();
  const colorConfig = PLAYER_COLORS[playerColor];
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Connect to room via PartySocket
  const { status } = useRoomConnection({
    roomCode,
    onStatusChange: setConnectionStatus,
    onMessage: (message) => {
      // Handle server messages (to be expanded in Phase 4)
      console.log('Received:', message);
    },
  });

  const handleBack = () => {
    clearPreferredMode();
    router.push('/');
  };

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

      {/* Connection status indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-purple-deep/90 border border-purple-mid backdrop-blur-sm flex items-center gap-2"
      >
        {status === 'connecting' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
            <span className="text-sm text-yellow-400">Connecting...</span>
          </>
        )}
        {status === 'connected' && (
          <>
            <Wifi className="w-4 h-4 text-green-crt" />
            <span className="text-sm text-green-crt">Connected</span>
          </>
        )}
        {status === 'disconnected' && (
          <>
            <WifiOff className="w-4 h-4 text-red-danger" />
            <span className="text-sm text-red-danger">Disconnected</span>
          </>
        )}
        {status === 'error' && (
          <>
            <WifiOff className="w-4 h-4 text-red-danger" />
            <span className="text-sm text-red-danger">Connection Error</span>
          </>
        )}
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <CasinoLogo color={playerColor} />
        </motion.div>

        {/* Lobby panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="retro-panel p-8 w-full"
        >
          {/* Share UI */}
          <RoomShare roomCode={roomCode} playerColor={playerColor} />

          {/* Waiting message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-white-soft/60 text-sm">
              Waiting for players to join...
            </p>
            <motion.div
              className="flex justify-center gap-1 mt-3"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: colorConfig.bg }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
