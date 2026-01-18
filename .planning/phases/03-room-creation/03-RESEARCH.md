# Phase 3: Room Creation - Research

**Researched:** 2026-01-18
**Domain:** PartyKit room creation, Next.js routing, browser share APIs
**Confidence:** HIGH

## Summary

Phase 3 implements room creation for the "Play with Friends" multiplayer flow. Users click "Play with Friends", which generates a unique room code and navigates to a room-specific URL. The room page displays share options (copy button, native share sheet, QR code) prominently until other players join.

The implementation leverages PartyKit's built-in room model where connecting to a new room ID automatically creates the room. Room codes use the already-configured 6-character alphabet excluding confusing characters (0/O, 1/I/L). Next.js App Router dynamic routes handle the room URL pattern, and native browser APIs (Clipboard, Web Share) provide sharing functionality with QR code as a fallback for in-person sharing.

**Primary recommendation:** Generate room code client-side using nanoid, navigate to `/room/[code]` route, connect via PartySocket which auto-creates the room on first connection. No separate HTTP "create room" endpoint needed.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `partysocket` | ^1.1.10 | WebSocket client with auto-reconnect | Already installed, official PartyKit client |
| `nanoid` | ^5.1.6 | Room code generation | Already installed, secure, customAlphabet support |
| Next.js App Router | 16.1.2 | Dynamic route `/room/[code]` | Already using, built-in support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `qrcode.react` | ^4.1.0 | QR code generation | For in-person sharing |
| Native Clipboard API | Browser | Copy link to clipboard | Primary share method |
| Native Web Share API | Browser | Mobile share sheet | Mobile-first sharing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `qrcode.react` | `react-qr-code` | Both work, qrcode.react is more popular (60M downloads) |
| nanoid customAlphabet | UUID | nanoid already installed, shorter codes, customizable |
| Web Share API | Share buttons per platform | Native API is cleaner, falls back gracefully |

**Installation:**
```bash
npm install qrcode.react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    page.tsx              # Existing, ModeSelection entry point
    room/
      [code]/
        page.tsx          # Room page with share UI and lobby
  components/
    RoomShare.tsx         # Share UI (copy, share sheet, QR)
    RoomLobby.tsx         # Lobby container (Phase 5 will extend)
  hooks/
    useRoomConnection.ts  # PartySocket connection hook
  lib/
    roomCode.ts           # Room code generation utility
```

### Pattern 1: Client-Side Room Creation
**What:** Generate room code and navigate client-side, PartyKit creates room on first connection
**When to use:** Simple room creation without server-side validation
**Example:**
```typescript
// Source: PartyKit docs - "Every new id results in a new PartyKit room"
import { customAlphabet } from 'nanoid';
import { useRouter } from 'next/navigation';
import { ROOM_CODE_LENGTH, ROOM_CODE_ALPHABET } from '@/shared/constants';

const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

function handleCreateRoom() {
  const code = generateRoomCode();
  router.push(`/room/${code}`);
}
```

### Pattern 2: usePartySocket for Room Connection
**What:** React hook that manages PartySocket lifecycle
**When to use:** Any component that needs WebSocket connection to a room
**Example:**
```typescript
// Source: PartyKit docs - partysocket/react
import usePartySocket from 'partysocket/react';

function RoomPage({ roomCode }: { roomCode: string }) {
  const ws = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: roomCode.toUpperCase(), // Normalize to uppercase

    onOpen() {
      console.log('Connected to room:', roomCode);
    },
    onMessage(event) {
      const message = JSON.parse(event.data);
      // Handle server messages
    },
    onClose() {
      console.log('Disconnected from room');
    },
    onError(error) {
      console.error('Connection error:', error);
    },
  });

  return <RoomLobby ws={ws} roomCode={roomCode} />;
}
```

### Pattern 3: Case-Insensitive Room Codes
**What:** Normalize room codes to uppercase for consistency
**When to use:** URL handling, display, and server communication
**Example:**
```typescript
// Client-side normalization
const normalizedCode = code.toUpperCase();

// URL display - always uppercase
<p>Room Code: {roomCode.toUpperCase()}</p>

// Server-side (party/index.ts) - room.id is already the normalized code
// PartyKit room IDs are case-sensitive, so client must normalize before connecting
```

### Pattern 4: Copy to Clipboard with Feedback
**What:** Copy URL with "Copied!" state feedback
**When to use:** Share UI copy button
**Example:**
```typescript
// Source: MDN Clipboard API
const [copied, setCopied] = useState(false);

async function handleCopy() {
  const url = `${window.location.origin}/room/${roomCode}`;
  try {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

<button onClick={handleCopy}>
  {copied ? 'Copied!' : 'Copy Link'}
</button>
```

### Pattern 5: Web Share API with Fallback
**What:** Native share sheet on supported devices, copy fallback otherwise
**When to use:** Share button UI
**Example:**
```typescript
// Source: MDN Web Share API
async function handleShare() {
  const shareData = {
    title: 'Join my Perudo game!',
    text: `Join room ${roomCode}`,
    url: `${window.location.origin}/room/${roomCode}`,
  };

  if (navigator.share && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  } else {
    // Fallback to copy
    handleCopy();
  }
}
```

### Pattern 6: QR Code Generation
**What:** Generate QR code for in-person sharing
**When to use:** Share UI for in-person game setup
**Example:**
```typescript
// Source: qrcode.react npm docs
import { QRCodeSVG } from 'qrcode.react';

function RoomQR({ roomCode }: { roomCode: string }) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomCode}`;

  return (
    <QRCodeSVG
      value={url}
      size={128}
      bgColor="transparent"
      fgColor="#ffffff"
      level="M" // Medium error correction
    />
  );
}
```

### Anti-Patterns to Avoid
- **HTTP endpoint for room creation:** Unnecessary complexity; PartyKit auto-creates rooms on first connection
- **Room code validation on client:** Don't block navigation if code "looks" invalid; let server handle unknown rooms
- **Storing room codes in database:** PartyKit handles room lifecycle; rooms exist while connections exist
- **Case-sensitive room codes in URLs:** Confuses users; always normalize to uppercase

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Room code generation | Custom random string | `nanoid/customAlphabet` | Cryptographically secure, tested, collision-resistant |
| WebSocket reconnection | Manual reconnect logic | `partysocket` | Handles exponential backoff, connection state, message queuing |
| QR code rendering | Canvas drawing code | `qrcode.react` | Handles encoding, error correction, responsive sizing |
| Clipboard access | execCommand('copy') | `navigator.clipboard` | Modern API, promise-based, better error handling |
| Share sheet | Custom social buttons | `navigator.share` | Native UI, respects user's installed apps |

**Key insight:** Browser APIs (Clipboard, Web Share) and PartySocket handle the hard parts. Focus on UX flow, not infrastructure.

## Common Pitfalls

### Pitfall 1: Forgetting Secure Context Requirement
**What goes wrong:** Clipboard and Web Share APIs fail silently
**Why it happens:** These APIs require HTTPS (or localhost)
**How to avoid:** Always test in secure context; development on localhost is fine
**Warning signs:** Share/copy buttons don't work in production HTTP

### Pitfall 2: Web Share API Feature Detection
**What goes wrong:** Calling `navigator.share` on unsupported browsers throws error
**Why it happens:** Web Share API not available on all desktop browsers
**How to avoid:** Check `navigator.share && navigator.canShare(data)` before calling
**Warning signs:** Runtime errors on desktop browsers

### Pitfall 3: Case-Sensitivity in Room Codes
**What goes wrong:** `/room/X7KM3P` and `/room/x7km3p` create different rooms
**Why it happens:** PartyKit room IDs are case-sensitive
**How to avoid:** Normalize to uppercase immediately: `code.toUpperCase()`
**Warning signs:** Users typing lowercase can't join rooms

### Pitfall 4: Not Handling AbortError in Web Share
**What goes wrong:** Console errors when user cancels share sheet
**Why it happens:** User cancel throws AbortError
**How to avoid:** Catch and ignore AbortError specifically
**Warning signs:** Console errors after canceling share

### Pitfall 5: QR Code with Dynamic Origin
**What goes wrong:** QR code rendered during SSR has wrong/no origin
**Why it happens:** `window.location.origin` undefined on server
**How to avoid:** Use client-side only rendering or environment variable for base URL
**Warning signs:** QR codes pointing to localhost or undefined

### Pitfall 6: Connecting Before Route Ready
**What goes wrong:** WebSocket connects with undefined room code
**Why it happens:** useParams returns undefined during initial render
**How to avoid:** Check room code exists before creating connection
**Warning signs:** Connection to undefined room, then reconnection

## Code Examples

Verified patterns from official sources:

### Room Code Generation Utility
```typescript
// src/lib/roomCode.ts
import { customAlphabet } from 'nanoid';
import { ROOM_CODE_LENGTH, ROOM_CODE_ALPHABET } from '@/shared/constants';

const generateCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

export function createRoomCode(): string {
  return generateCode();
}

export function normalizeRoomCode(code: string): string {
  return code.toUpperCase();
}

export function isValidRoomCode(code: string): boolean {
  const normalized = normalizeRoomCode(code);
  if (normalized.length !== ROOM_CODE_LENGTH) return false;
  return [...normalized].every(char => ROOM_CODE_ALPHABET.includes(char));
}
```

### Dynamic Route Page Component
```typescript
// src/app/room/[code]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { normalizeRoomCode } from '@/lib/roomCode';
import { RoomLobby } from '@/components/RoomLobby';

export default function RoomPage() {
  const params = useParams();
  const code = params.code as string;

  if (!code) {
    return <div>Loading...</div>;
  }

  const roomCode = normalizeRoomCode(code);

  return <RoomLobby roomCode={roomCode} />;
}
```

### PartyKit Host Configuration
```typescript
// Environment variable for PartyKit host
// .env.local (development)
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999

// .env.production
NEXT_PUBLIC_PARTYKIT_HOST=perudo-vibe.username.partykit.dev
```

### Share Component Structure
```typescript
// src/components/RoomShare.tsx
'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Share2, Check } from 'lucide-react';

interface RoomShareProps {
  roomCode: string;
  onCopy?: () => void;
}

export function RoomShare({ roomCode, onCopy }: RoomShareProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomCode}`
    : '';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [url, onCopy]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: 'Join my Perudo game!',
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
    <div className="space-y-4">
      {/* Room code display */}
      <div className="text-center">
        <p className="text-sm text-white/60 mb-1">Room Code</p>
        <p className="text-4xl font-mono font-bold tracking-widest">
          {roomCode}
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <QRCodeSVG
          value={url}
          size={128}
          bgColor="transparent"
          fgColor="#ffffff"
          level="M"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        <button onClick={handleCopy} className="btn">
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button onClick={handleShare} className="btn">
          <Share2 />
          Share
        </button>
      </div>

      {/* Full URL (subtle) */}
      <p className="text-xs text-white/40 text-center break-all">
        {url}
      </p>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| document.execCommand('copy') | navigator.clipboard.writeText() | 2020 | Async, promise-based, better error handling |
| Custom share buttons | Web Share API | 2021+ | Native share sheet, respects user preferences |
| Socket.io for multiplayer | PartyKit/partysocket | 2023+ | Simpler deployment, auto-reconnect built-in |
| UUID for room codes | nanoid customAlphabet | 2020+ | Shorter, customizable, same security |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated, use Clipboard API
- React class components for connection lifecycle: Use hooks with usePartySocket
- Generating room codes server-side for simple apps: Unnecessary with PartyKit's auto-create model

## Open Questions

Things that couldn't be fully resolved:

1. **Nickname timing (Claude's Discretion)**
   - What we know: User must have nickname to join game
   - What's unclear: Ask before room creation or after landing in room?
   - Recommendation: Ask after landing in room (Phase 4 join flow handles this)

2. **Loading state during room creation (Claude's Discretion)**
   - What we know: Room creation is instant (just navigation + connection)
   - What's unclear: Need loading state for connection?
   - Recommendation: Brief loading skeleton while WebSocket connects; connection typically < 100ms

3. **Share UI after players join (Claude's Discretion)**
   - What we know: Share UI prominent initially
   - What's unclear: Keep prominent or collapse after first player joins?
   - Recommendation: Keep visible but compact; host may want more players

4. **URL structure (Claude's Discretion)**
   - What we know: Need room code in URL
   - Options: `/room/X7KM3P`, `/game/X7KM3P`, `/r/X7KM3P`
   - Recommendation: `/room/X7KM3P` - clear, descriptive, standard

5. **Error handling for failed room creation (Claude's Discretion)**
   - What we know: PartyKit rooms auto-create, connection can fail
   - What's unclear: How to handle connection failure?
   - Recommendation: Show error with retry button; rare failure case

## Sources

### Primary (HIGH confidence)
- [PartyKit PartySocket API](https://docs.partykit.io/reference/partysocket-api/) - WebSocket client, usePartySocket hook
- [PartyKit Responding to HTTP Requests](https://docs.partykit.io/guides/responding-to-http-requests/) - Room creation patterns
- [PartyKit How It Works](https://docs.partykit.io/how-partykit-works/) - Room auto-creation on connection
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - navigator.clipboard.writeText
- [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) - navigator.share
- [nanoid GitHub](https://github.com/ai/nanoid) - customAlphabet function

### Secondary (MEDIUM confidence)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) - App Router [code] pattern
- [qrcode.react npm](https://www.npmjs.com/package/qrcode.react) - QRCodeSVG component

### Tertiary (LOW confidence)
- None - all patterns verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed or well-documented
- Architecture: HIGH - PartyKit patterns verified in official docs
- Pitfalls: HIGH - Based on official API requirements and common patterns

**Research date:** 2026-01-18
**Valid until:** 2026-03-18 (60 days - stable APIs and libraries)
