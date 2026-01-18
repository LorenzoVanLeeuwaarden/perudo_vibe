# Plan 08-02 Summary: Client disconnect visuals

## Result: COMPLETE

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add grayed-out disconnect visual to PlayerRow | f7371b4 | src/components/PlayerRow.tsx |
| 2 | Implement 5-second delay logic for disconnect visual in GameBoard | 636d254 | src/components/GameBoard.tsx, src/components/PlayerDiceBadge.tsx |
| 3 | Add Welcome back toast and track disconnectedAt | 3a54f16 | src/app/room/[code]/page.tsx |
| 4 | Human verification checkpoint | - | - |

## Bug Fixes During Verification

| Issue | Fix | Commit |
|-------|-----|--------|
| DudoOverlay animation freezing | Memoize onComplete callback to prevent effect restarts | 68a7967 |
| WifiOff icon not showing during game | Add icon to PlayerDiceBadge, pass isConnected prop | 705a014 |
| gameState.players not updated on disconnect | Update both roomState.players AND gameState.players | a65b5b7 |
| Game stuck when player eliminated on their turn | Advance turn to next player after disconnect elimination | 0178f4c |
| Page refresh skipping your turn | Add 5-second grace period before AI takeover | bfebd9d |
| Host can't rejoin after refresh | Wait for clientId before connecting WebSocket | 957de8a |

## Deliverables

1. **Immediate disconnect feedback**
   - WifiOff icon shows next to player name immediately
   - Toast notification "{name} disconnected" for other players
   - Grayed-out visual (opacity + grayscale) after 5-second delay

2. **Reconnection feedback**
   - "Welcome back! You're back in the game" toast for reconnecting player
   - "{name} reconnected" toast for other players
   - Visual state restored immediately on reconnect

3. **Turn handling on disconnect**
   - 5-second grace period before AI takes over disconnected player's turn
   - Page refresh within 5 seconds preserves your turn
   - TURN_CHANGED message type for turn advancement

4. **Connection stability**
   - WebSocket connection waits for persistent clientId from localStorage
   - Ensures same ID used for reconnection after page refresh

## Key Decisions

- [08-02]: WifiOff icon in PlayerDiceBadge uses 3x3 size to fit compact badge
- [08-02]: Toast notification uses `toast.warning` for disconnect events
- [08-02]: 5-second delay before grayed-out visual to avoid flicker on brief network blips
- [08-02]: AI takeover has 5-second grace period (separate from 60-second elimination)
- [08-02]: useRoomConnection refactored to manual PartySocket for connection timing control

## Files Modified

- src/components/PlayerRow.tsx - Added showDisconnectedVisual prop styling
- src/components/PlayerDiceBadge.tsx - Added WifiOff icon and isConnected prop
- src/components/GameBoard.tsx - Added disconnect visual timing, memoized callback
- src/app/room/[code]/page.tsx - Updated PLAYER_LEFT/RECONNECTED handlers, added TURN_CHANGED
- src/hooks/useRoomConnection.ts - Refactored to wait for clientId before connecting
- src/shared/messages.ts - Added TURN_CHANGED message type
- party/index.ts - Added AI takeover grace period, turn advancement on elimination
