# Feature Landscape: Real-Time Multiplayer Browser Games

**Domain:** Room-based casual multiplayer browser game (turn-based dice)
**Researched:** 2026-01-18
**Overall confidence:** HIGH

## Executive Summary

Research across Board Game Arena, Tabletopia, Jackbox, skribbl.io, and existing Liar's Dice implementations reveals clear patterns for what users expect from casual multiplayer browser games. The feature set divides cleanly into table stakes (must-have for users to stay), differentiators (competitive advantages), and anti-features (scope traps to avoid for v1).

For a room-based casual game like Perudo, the core expectations center on frictionless joining, reliable state sync, and graceful handling of disconnects. The differentiators come from polish and social features that enhance the experience without adding complexity.

---

## Table Stakes

Features users expect. Missing any of these = product feels incomplete or broken.

### Room/Lobby Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Room creation with unique code/link** | Standard pattern across all comparable games (skribbl.io, Jackbox, codenames.game). Users expect to share a link. | Low | 4-6 character codes are norm. Links preferred over codes for mobile. |
| **Join via link without account** | Low friction is table stakes for casual games. Foony, Hide and Seek World, skribbl.io all do this. | Low | Guest nickname prompt on join. Consider name persistence via localStorage. |
| **Player list in lobby** | Users need to see who has joined before starting. Universal across all surveyed games. | Low | Show names, ready status, host indicator. |
| **Host indicator** | Players need to know who can start the game and change settings. | Low | Visual badge on host player. |
| **Host can start game** | Someone must control when game begins. Universal pattern. | Low | Button only visible to host. |
| **Minimum/maximum player limits** | Prevent starting with too few or allowing too many. FunNode Liar's Dice: 2-10 players. | Low | Perudo: 2-6 players. Disable start until minimum met. |

**Sources:** [Heroic Labs Forum](https://forum.heroiclabs.com/t/best-practices-to-create-a-lobby-system/1735), [brainCloud Lobbies](https://help.getbraincloud.com/en/articles/3272699-design-multiplayer-lobbies), [Game Developer: Rules of the Game](https://www.gamedeveloper.com/design/the-rules-of-the-game-hanging-out-in-the-lobby)

### Game State Synchronization

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Real-time state sync** | Core requirement. Players see same state simultaneously. Sub-200ms latency expected. | High | PartyKit or similar handles heavy lifting. |
| **Turn indicator** | Players must know whose turn it is. Universal in turn-based games. | Low | Highlight current player, show timer if applicable. |
| **Action confirmation** | Players need feedback when their action is received. | Low | Optimistic UI with server confirmation. |
| **Consistent game state on rejoin** | Refreshing page shouldn't break game. BGA and Tabletopia both support this. | Medium | Store game state server-side, restore on reconnect. |

**Sources:** [Getgud.io Reconnection Guide](https://www.getgud.io/blog/how-to-successfully-create-a-reconnect-ability-in-multiplayer-games/), [Unity Reconnecting Docs](https://docs-multiplayer.unity3d.com/netcode/current/advanced-topics/reconnecting-mid-game/index.html)

### Disconnect Handling

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Reconnection support** | Network drops happen. Players expect to rejoin their game. | Medium | Grace period (60-120 seconds typical) before any penalty. |
| **Visual disconnect indicator** | Other players need to know someone is disconnected vs thinking. | Low | Icon or status change on disconnected player. |
| **Game continues without blocking** | One disconnected player shouldn't freeze everyone. Critical for turn-based. | Medium | Timer + fallback action (AI takes turn or forfeit turn). |

**Sources:** [Getgud.io Reconnection Guide](https://www.getgud.io/blog/how-to-successfully-create-a-reconnect-ability-in-multiplayer-games/), [Photon Forum Discussion](https://forum.photonengine.com/discussion/6448/handling-disconnects-and-reconnecting)

### Turn Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Turn timer** | Prevents indefinite waits. Board game apps: 45 seconds to 2 minutes typical. Colonist.io users want 2-round AFK kick. | Low | Configurable by host. Warn at 10-15 seconds. |
| **Auto-action on timeout** | If timer expires, game must continue. AI bid or auto-fold. | Medium | Notify player their turn was skipped. |
| **Whose turn visibility** | Always clear whose turn it is. | Low | Highlight, animation, text indicator. |

**Sources:** [Colonist.io Feature Request](https://colonist.featureupvote.com/suggestions/91225/afk-inactive-players-should-be-kicked-after-2-rounds), [Game of Thrones Board Game Discussion](https://steamcommunity.com/app/1075190/discussions/0/2969519680698169126/)

### Basic Host Controls

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Kick player from lobby** | Host must remove bad actors before game starts. Jackbox added this in Pack 9. | Low | Can't rejoin without new link/code for kicked players. |
| **Game settings configuration** | Host should control game parameters. FunNode allows rule variants. | Low | Starting dice count, wild ones toggle. |

**Sources:** [Jackbox Blog: Kick Players Feature](https://www.jackboxgames.com/blog/the-ability-to-kick-players-and-other-new-features-coming-to-party-pack-9), [Robot Entertainment Help](https://robotentertainment.zendesk.com/hc/en-us/articles/33658948731277-How-do-I-Kick-or-Ban-a-Player-in-my-Lobby)

### Audio/Visual Feedback

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Sound effects** | Audio feedback enhances game feel. Expected in polished games. | Low | Already exists in current codebase. |
| **Mute/volume control** | Users playing in public or listening to other audio need this. | Low | Essential accessibility feature. |
| **Visual turn notifications** | Tab may be in background. Browser tab title change or visual pulse. | Low | "Your turn!" in tab title when inactive. |

**Sources:** [MDN Audio for Web Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games)

---

## Differentiators

Features that set product apart. Not expected by default, but valued when present.

### Polish & Social Features

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Quick reactions/emotes** | Adds social layer without text chat complexity. Hearthstone, LoL use emote systems extensively. | Medium | 4-8 preset reactions (thumbs up, laugh, groan, clap). Cooldown to prevent spam. |
| **Animated state transitions** | Differentiates from basic implementations. Existing codebase has this. | Exists | Leverage existing Framer Motion animations. |
| **Sound for other players' actions** | Know when something happens even when looking away. | Low | Subtle sounds for bids, dice rolls, challenges. |
| **"Your turn" push notification** | Recall players who switched tabs. | Low | Browser Notification API with permission. |

**Sources:** [Sceyt Blog: In-Game Chats](https://sceyt.com/blog/how-in-game-chats-enhance-player-interaction-and-strategy), [Kinetix: Emotes in Games](https://www.kinetix.tech/blog/how-are-emotes-integrated-into-gameplay), [League of Legends Emote System](https://wiki.leagueoflegends.com/en-us/Emote)

### Reconnection Excellence

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI takeover on disconnect** | Game continues smoothly. Better than pausing everyone. FunNode Liar's Dice: "AI substitution" mentioned. | Medium | Player can reclaim from AI on return. Clear indicator showing AI is playing. |
| **Seamless rejoin** | Return to exact game state. No lost progress. | Medium | Store all state server-side, restore client on reconnect. |
| **Grace period before AI** | Don't penalize brief disconnects (page refresh, network blip). | Low | 30-60 second grace period where turn timer pauses. |

**Sources:** [Getgud.io Reconnection Guide](https://www.getgud.io/blog/how-to-successfully-create-a-reconnect-ability-in-multiplayer-games/)

### Post-Game Flow

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Return to lobby for rematch** | Keep the party together. MW2 "Play Again" was highly requested. | Medium | Same room, same players, new game. |
| **Game statistics display** | See how the game went. Rounds played, dice lost, successful bluffs. | Low | Track during game, show at end. |
| **"One more game" quick start** | Reduce friction for rematches. | Low | Button on victory/defeat screen. |

**Sources:** [GGRecon: MW2 Play Again Feature](https://www.ggrecon.com/articles/long-awaited-mw2-play-again-lobby-feature-is-finally-being-added/)

### Accessibility

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Colorblind mode** | 8% of males are colorblind. Dice colors must be distinguishable. | Medium | Add patterns or shapes to dice, not just color. Use WCAG-compliant palette. |
| **Mobile-responsive design** | 68% of board game app usage is mobile. | Medium | Already planned in constraints. Touch-friendly bid controls. |
| **Reduced motion option** | Accessibility for vestibular disorders. | Low | Respect `prefers-reduced-motion` media query. |

**Sources:** [Can I Play That: Color-Blindness Guide](https://caniplaythat.com/2020/01/29/color-blindness-accessibility-guide/), [Mordor Intelligence: Online Board Games Market](https://www.mordorintelligence.com/industry-reports/global-online-board-games-market)

### Host Power Features

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Transfer host role** | Original host can leave without ending game. | Low | Dropdown or button to transfer. |
| **Pause game** | Handle interruptions gracefully (bathroom break, doorbell). | Medium | All players see pause screen. Host unpauses. |
| **Kick during game** | Remove bad actors mid-game. Replaced by AI. | Medium | Should be rare but necessary. |

**Sources:** [Jackbox Blog: Kick Players Feature](https://www.jackboxgames.com/blog/the-ability-to-kick-players-and-other-new-features-coming-to-party-pack-9)

---

## Anti-Features

Features to explicitly NOT build for v1. Common scope traps in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Account system / login** | Adds friction, complexity, auth infrastructure. Casual games thrive on frictionless access. | Guest nicknames with localStorage persistence. Add accounts later if needed for progression features. |
| **Text chat** | Moderation concerns, abuse potential, implementation complexity, distraction from game. | Quick reactions/emotes cover essential communication. Voice via external tools (Discord) for friends. |
| **Matchmaking / public lobbies** | Requires player base to work, moderation, anti-cheat, ranking. FunNode has ELO but targets different audience. | Private rooms via link sharing. Friends invite friends. |
| **Spectator mode** | Adds complexity (separate UI state, permissions). Low value for small friend groups. | Only players in game. Can watch friend's screen via Discord screenshare. |
| **Global leaderboards** | Requires accounts, persistent identity, anti-cheat. Low value for casual friend groups. | Game-end statistics only. No cross-game tracking. |
| **Custom avatars / profiles** | Scope creep, asset management, potential for inappropriate content. | Player colors (already in codebase) are sufficient. Maybe nickname + color selection. |
| **In-game voice chat** | Complex, requires WebRTC infrastructure, moderation impossible. | External tools (Discord) work better. |
| **Tournament mode** | Complex bracket management, requires larger player pools, more UI. | Single-game focus for v1. |
| **Game variants** | Each variant needs balancing, testing, UI. Perudo is already well-defined. | Standard Perudo rules only. Wild ones toggle is sufficient variation. |
| **Mobile app** | Platform-specific development, app store management, native code. | Responsive web works on mobile browsers. PWA can be considered later. |

---

## Feature Dependencies

```
Room Creation
    |
    +-- Join via Link
    |       |
    |       +-- Player List
    |               |
    |               +-- Host Controls
    |                       |
    |                       +-- Start Game
    |
    +-- Real-time Sync (required for everything else)
            |
            +-- Turn Management
            |       |
            |       +-- Turn Timer
            |       +-- Turn Indicator
            |
            +-- Disconnect Handling
            |       |
            |       +-- Reconnection
            |       +-- AI Takeover
            |
            +-- Game State Sync
                    |
                    +-- Action Confirmation
                    +-- Consistent Rejoin
```

**Critical Path:** Room Creation -> Join -> Player List -> Sync -> Turn Management -> Game Logic

**Parallel Track:** Host Controls, Disconnect Handling, Emotes can be added incrementally

---

## MVP Recommendation

For MVP, prioritize all table stakes plus select differentiators that align with stated goals:

### Must Have (Table Stakes)
1. Room creation with shareable link
2. Guest nickname join (no account)
3. Player list with host indicator
4. Host can start game
5. Real-time game state sync
6. Turn indicator and timer
7. Basic disconnect indication
8. Reconnection support (return to game on refresh)
9. Mute/volume controls

### Should Have (High-Value Differentiators)
1. AI takeover on disconnect (stated goal, good UX)
2. Quick reactions/emotes (stated goal, adds social layer)
3. Return to lobby for rematch (stated goal, keeps group together)
4. Host kick from lobby (moderation essential)

### Nice to Have (Can Defer)
- Push notification for your turn
- Pause game feature
- Host transfer
- Colorblind mode (important but can follow shortly after MVP)
- Game statistics display

### Explicitly Defer to Post-v1
- All anti-features listed above
- Kick during game (lobby kick is sufficient for v1)
- Game variants beyond wild ones toggle

---

## Comparable Products Reference

| Product | Key Features | What We Can Learn |
|---------|--------------|-------------------|
| **Board Game Arena** | Rules enforcement, matchmaking, ELO, premium tier | Rules enforcement is valuable; matchmaking requires scale |
| **Tabletopia** | 3D sandbox, no rules enforcement, session saves | Persistent rooms good; manual rules bad for casual |
| **skribbl.io** | Room codes, custom words, 12 players, no account | Frictionless join is key; simple room codes work |
| **Jackbox** | Room codes, audience mode, host kick, family mode | Room code hiding, kick feature, moderator tools |
| **FunNode Liar's Dice** | ELO, themes, private rooms, 2-10 players | Existing Perudo implementation; we can differentiate on UX |
| **YoAmb Liar's Dice App** | No login, room codes, AI practice, waiting mini-game | "No login required" is explicitly called out as feature |

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Table Stakes | HIGH | Consistent patterns across BGA, Tabletopia, Jackbox, skribbl.io, FunNode |
| Differentiators | HIGH | Clear value adds with evidence from comparable products |
| Anti-Features | HIGH | Strong evidence that these add complexity without proportional value for casual games |
| Complexity Estimates | MEDIUM | Based on typical implementations; actual complexity depends on existing codebase integration |

---

## Sources

### Primary Sources (HIGH confidence)
- [Heroic Labs: Lobby System Best Practices](https://forum.heroiclabs.com/t/best-practices-to-create-a-lobby-system/1735)
- [brainCloud: Multiplayer Lobbies](https://help.getbraincloud.com/en/articles/3272699-design-multiplayer-lobbies)
- [Game Developer: The Rules of the Game - Lobbies](https://www.gamedeveloper.com/design/the-rules-of-the-game-hanging-out-in-the-lobby)
- [Getgud.io: Reconnection in Multiplayer Games](https://www.getgud.io/blog/how-to-successfully-create-a-reconnect-ability-in-multiplayer-games/)
- [Unity Docs: Reconnecting Mid-Game](https://docs-multiplayer.unity3d.com/netcode/current/advanced-topics/reconnecting-mid-game/index.html)
- [Jackbox Blog: Kick Players Feature](https://www.jackboxgames.com/blog/the-ability-to-kick-players-and-other-new-features-coming-to-party-pack-9)
- [MDN: Audio for Web Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games)

### Secondary Sources (MEDIUM confidence)
- [Can I Play That: Color-Blindness Accessibility](https://caniplaythat.com/2020/01/29/color-blindness-accessibility-guide/)
- [Mordor Intelligence: Online Board Games Market](https://www.mordorintelligence.com/industry-reports/global-online-board-games-market)
- [Board Game Platform Comparison](https://www.hicreategames.com/tabletopia-vs-tabletop-simulator-vs-board-game-arena/)
- [FunNode Liar's Dice](https://www.funnode.com/games/liars-dice)
- [YoAmb Liar's Dice App](https://apps.apple.com/us/app/liars-dice-online-multiplayer/id773491532)

### Tertiary Sources (Community discussions, lower confidence but useful for patterns)
- [Colonist.io AFK Feature Request](https://colonist.featureupvote.com/suggestions/91225/afk-inactive-players-should-be-kicked-after-2-rounds)
- [GGRecon: MW2 Play Again Feature](https://www.ggrecon.com/articles/long-awaited-mw2-play-again-lobby-feature-is-finally-being-added/)
- [Photon Forum: Disconnect Handling](https://forum.photonengine.com/discussion/6448/handling-disconnects-and-reconnecting)

---

*Feature research: 2026-01-18*
