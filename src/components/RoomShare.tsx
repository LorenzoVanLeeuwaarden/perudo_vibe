'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PlayerColor } from '@/shared/types';
import { PLAYER_COLORS } from '@/lib/types';

interface RoomShareProps {
  roomCode: string;
  playerColor: PlayerColor;
}

export function RoomShare({ roomCode, playerColor }: RoomShareProps) {
  const [copied, setCopied] = useState(false);
  const colorConfig = PLAYER_COLORS[playerColor];

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomCode}`
    : '';

  const handleCopy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [url]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: 'Join my Last Die game!',
      text: `Join room ${roomCode}`,
      url,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy(); // Fallback
        }
      }
    } else {
      handleCopy(); // Fallback
    }
  }, [roomCode, url, handleCopy]);

  return (
    <div className="space-y-6">
      {/* Room code display */}
      <div className="text-center">
        <p className="text-sm text-white-soft/60 mb-2 uppercase tracking-wider">Room Code</p>
        <p
          className="text-5xl font-mono font-bold tracking-[0.3em]"
          style={{ color: colorConfig.bg }}
        >
          {roomCode}
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="p-4 rounded-xl bg-white">
          <QRCodeSVG
            value={url || `https://faroleo.pages.dev/room/${roomCode}`}
            size={160}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold uppercase tracking-wider"
          style={{
            background: colorConfig.bgGradient,
            border: `2px solid ${colorConfig.border}`,
            boxShadow: `0 4px 0 0 ${colorConfig.shadow}`,
          }}
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold uppercase tracking-wider bg-purple-mid border-2 border-purple-glow"
          style={{
            boxShadow: '0 4px 0 0 var(--purple-deep)',
          }}
        >
          <Share2 className="w-5 h-5" />
          Share
        </motion.button>
      </div>

      {/* Full URL (subtle) */}
      <p className="text-xs text-white-soft/40 text-center break-all px-4">
        {url}
      </p>
    </div>
  );
}
