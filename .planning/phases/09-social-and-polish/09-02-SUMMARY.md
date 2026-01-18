---
phase: 09-social-and-polish
plan: 02
subsystem: ui
tags: [emotes, reactions, framer-motion, zustand]

dependency-graph:
  requires: [09-01]
  provides: [emote-ui, emote-bubbles, emote-picker]
  affects: []

tech-stack:
  added: []
  patterns:
    - EmotePicker with spring animation and backdrop dismiss
    - EmoteBubble with auto-dismiss timer and exit animation
    - uiStore active emotes with max limit for memory

key-files:
  created:
    - src/components/EmotePicker.tsx
    - src/components/EmoteBubble.tsx
  modified:
    - src/stores/uiStore.ts
    - src/components/GameBoard.tsx

decisions:
  - id: D-09-02-01
    what: "8 preset emotes in 4x2 grid layout"
    why: "Per CONTEXT.md decision - curated set covers common reactions"
  - id: D-09-02-02
    what: "2-second auto-dismiss for emote bubbles"
    why: "Long enough to see, short enough to not clutter"
  - id: D-09-02-03
    what: "Max 6 active emotes in store"
    why: "Memory limit to prevent unbounded growth"
  - id: D-09-02-04
    what: "EmotePicker visible only during bidding phase"
    why: "Relevant during active gameplay, not during reveal/ended"

metrics:
  duration: 3 min
  completed: 2026-01-18
---

# Phase 09 Plan 02: Client Emote UI Summary

**One-liner:** Emote picker with 8 preset emojis and animated bubbles above player badges

## What Was Built

### EmotePicker Component
- Button with Smile icon opens a 4x2 emoji grid
- Spring animations for open/close transitions
- Backdrop click to close picker
- Closes automatically after selection
- Disabled state support for future rate limiting

### EmoteBubble Component
- Appears above player badge when emote received
- Spring enter animation (scale + fade)
- 2-second display duration
- Fade-out exit animation (300ms)
- Calls onComplete callback for cleanup

### uiStore Emote State
- ActiveEmote interface: id, playerId, emote
- activeEmotes array in non-persisted state
- addEmote action: adds new emote, keeps max 6 (memory limit)
- removeEmote action: cleans up after animation completes
- Cleared on resetAnimationState

### GameBoard Integration
- EmotePicker positioned fixed bottom-right during bidding phase
- Each player badge wrapped in relative container
- EmoteBubble overlays for most recent emote per player
- handleSendEmote sends SEND_EMOTE message to server

## Key Implementation Details

**Emote Set:**
```typescript
const EMOTES = ['laughing', 'party', 'shocked', 'thumbsup', 'fire', 'skull', 'thinking', 'eyes'];
```

**Animation Values:**
- Picker: spring stiffness 400, damping 25
- Bubble enter: spring stiffness 400, damping 20
- Bubble exit: 300ms duration, y: -20, scale: 0

**Store Memory Management:**
```typescript
addEmote: (playerId, emote) => set((state) => ({
  activeEmotes: [
    ...state.activeEmotes.slice(-5), // Keep max 6
    { id: `${Date.now()}-${playerId}`, playerId, emote }
  ]
}))
```

## Commits

| Hash | Description |
|------|-------------|
| 115c72f | feat(09-02): create EmotePicker and EmoteBubble components |
| fae9d46 | feat(09-02): add emote state to uiStore |
| 615168f | feat(09-02): integrate emotes into GameBoard |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Complete for client-side emote display.** The parent room page needs to:
1. Handle EMOTE_RECEIVED server messages
2. Call `addEmote(playerId, emote)` to trigger bubble display

This wiring is outside the scope of this plan but documented in GameBoard comments.
