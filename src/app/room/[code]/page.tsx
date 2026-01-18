'use client';

import { useParams } from 'next/navigation';
import { normalizeRoomCode } from '@/lib/roomCode';
import { RoomLobby } from '@/components/RoomLobby';

export default function RoomPage() {
  const params = useParams();
  const code = params.code as string;

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white-soft/60">Loading...</p>
      </div>
    );
  }

  const roomCode = normalizeRoomCode(code);

  return <RoomLobby roomCode={roomCode} />;
}
