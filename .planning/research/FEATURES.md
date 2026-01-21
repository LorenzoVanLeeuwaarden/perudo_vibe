# Feature Landscape: Gauntlet Mode

**Domain:** Endless/gauntlet mode for dice game (Perudo)
**Researched:** 2026-01-21
**Overall confidence:** HIGH

## Executive Summary

Research across roguelike endless modes (Slay the Spire, Balatro), gauntlet modes in competitive games (Battlefield, FC 26), mobile streak systems, and dice game implementations reveals clear patterns for gauntlet/endless mode design. The proposed Gauntlet design (rapid 1v1 duels, dice carry-over, escalating AI difficulty, streak-based scoring) aligns well with proven patterns.

Key findings:
1. **Streak systems drive engagement** - Loss aversion psychology means protecting a streak is 2.3x more motivating than starting fresh
2. **Escalating difficulty is table stakes** - Every successful endless mode has clear difficulty progression
3. **Leaderboards need careful design** - Anti-cheat, nickname validation, and periodic resets are expected
4. **Achievement milestones sustain long-term play** - Tiered milestones at multiple points keep players returning

---

## Table Stakes

Features users expect for any gauntlet/endless mode. Missing = mode feels incomplete.

### Core Gauntlet Loop

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Carry-over state between duels** | Defining characteristic of gauntlet modes. Balatro, Slay the Spire, roguelikes all do this. Player dice persisting creates tension. | Medium | Already designed: player dice carry over, opponent always 5 |
| **Escalating difficulty** | Universal in endless modes. "Quick progressive difficulty" is a documented game pattern. Slay the Spire has 20 ascension levels. | Medium | Turtle -> Calculator -> Shark personality progression is good start |
| **Clear lose condition** | Player must know when run ends. Balatro: Ante 8 is "win", post-Ante 8 is endless until fail. | Low | Run ends when player loses all dice |
| **Streak counter (score)** | Primary metric for endless modes. Opponents defeated = score is intuitive and comparable. | Low | Display prominently during play and on game over |
| **Single-session design** | Casual endless modes should complete in one sitting. Mobile games optimize for short sessions. | Low | 1v1 duels are naturally short; run length is player-skill-dependent |
| **Immediate restart** | After game over, one-tap restart is expected. Reduces friction. | Low | "Try Again" button on game over screen |

**Sources:** [Game Design Patterns in Endless Mobile Minigames](https://www.diva-portal.org/smash/get/diva2:1479905/FULLTEXT01.pdf), [Slay the Spire Endless Mode Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1719337474)

### Leaderboard Essentials

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Global leaderboard display** | Competition is core motivator for endless modes. 65% of players cite in-game rewards as motivation. | Medium | Show top N scores with player nicknames |
| **Nickname entry (anonymous)** | No-account games use nicknames. Must respect constraints (30 chars max, alphanumeric + basic symbols). | Low | Existing name validation from lobby can be reused |
| **Score submission after run** | Automatic or one-tap submission. Prompt for nickname if first time. | Low | Store nickname in localStorage for repeat plays |
| **Personal best tracking** | Players want to see their own progression. "Trying to top your own and others' high scores always gives you something new to play for." | Low | Track locally + show on leaderboard |
| **Score limits for fraud prevention** | Basic anti-cheat. Reject impossible scores. "Limits are optional values that define the lower and upper limits of scores." | Low | Reject scores > reasonable maximum (e.g., 1000 opponents defeated) |

**Sources:** [Heroic Labs Leaderboard Best Practices](https://heroiclabs.com/docs/nakama/concepts/leaderboards/best-practices/), [GDevelop Leaderboards](https://wiki.gdevelop.io/gdevelop5/all-features/leaderboards/)

### Achievement Basics

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Milestone notifications** | Celebration at key points. Duolingo saw +1.7% retention from milestone animations. | Low | Toast/popup at achievement unlock |
| **Progressive milestones** | "Use tiers to create milestones - a goal of 10,000 can feel very far away." Android dev guidelines recommend 40+ achievements. | Low | 3 defeats, 5, 10, 25, 50, 100+ tiers |
| **Visible achievement progress** | Players need to see "next thing" even after reaching a milestone. | Low | Show "Next: Defeat 10 opponents" during run |
| **Persistent achievement state** | Achievements should survive browser close. | Low | localStorage or simple backend storage |

**Sources:** [Android Achievements Documentation](https://developer.android.com/games/pgs/achievements), [Plotline: Streaks and Milestones for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)

---

## Differentiators

Features that would make Gauntlet mode stand out. Not expected but valued.

### Enhanced Progression

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI personality reveal** | Show opponent's personality name + description before duel. Creates anticipation and helps player strategize. | Low | Already have 6 personalities with descriptions |
| **Difficulty tier badges** | Visual indicator of current difficulty tier (Bronze/Silver/Gold or similar). Creates "zone" feeling. | Low | e.g., Opponents 1-3: "Warming Up", 4-7: "Getting Serious", 8+: "Gauntlet Master" |
| **Mid-run stats display** | Show current streak, duels won, rounds played. Adds context to achievement. | Low | Non-intrusive stats panel |
| **"Personal best" notification** | Alert when player beats their previous best during a run. Extra dopamine hit. | Low | "NEW PERSONAL BEST!" banner |

### Leaderboard Excellence

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Near you" section** | Show scores immediately above and below player's rank. "Offer multiple leaderboards so players at all levels have attainable goals." | Medium | Requires fetching specific rank range |
| **Daily/weekly resets** | Periodic resets "lower the entry barrier and keep the experience fresh." Cogmind resets with each version. | Medium | Separate daily vs all-time leaderboards |
| **Rank badges** | Top 10, Top 50, Top 100 visual indicators. Status rewards drive competition. | Low | Icon next to nickname on leaderboard |
| **Recent scores feed** | Show recent submissions (live feel). "Many games have leaderboards online to compete against other players globally." | Medium | Real-time updates or polling |

**Sources:** [Medium: Climbing the Ranks in Mobile Gaming](https://medium.com/@alidrsn/climbing-the-ranks-a-guide-to-leaderboards-in-mobile-gaming-67f4f808e147)

### Achievement Depth

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Hidden achievements** | Surprise and delight. "Use hidden achievements for an element of surprise." | Low | e.g., "Win a duel with only 1 die remaining" |
| **Achievement gallery** | View unlocked and locked achievements. Locked ones show requirements or are hidden. | Medium | Separate achievement browsing screen |
| **Challenge achievements** | Beyond streak count: "Win 3 duels without calling Dudo", "Perfect round (no dice lost)". | Medium | Requires tracking additional state |
| **Shareable achievements** | Share achievement unlock to social. Increases viral potential. | Low | Share button with pre-formatted text |

**Sources:** [Trophy: Streaks Gamification Case Study](https://trophy.so/blog/streaks-gamification-case-study)

### Experience Polish

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Victory lap" animation** | Special animation when defeating tough opponent (e.g., first Shark). | Low | Reuse existing victory effects with enhancement |
| **Opponent entrance animation** | New opponent slides in with personality flair. Builds anticipation. | Low | Framer Motion, personality-specific |
| **Streak sound escalation** | Audio intensity increases with streak. Creates "flow state" feeling. | Low | Volume or complexity scaling |
| **"Almost there" notifications** | "1 more win to beat your personal best!" Loss aversion is 2x stronger than gain motivation. | Low | Triggered when within 1-2 of personal best |

---

## Anti-Features

Features to explicitly NOT build for Gauntlet v1. Common scope traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Account system for leaderboard** | Friction. Casual mode needs casual entry. "Sending scores for anonymous players (with a nickname)" is sufficient. | Nickname + localStorage. Consider accounts later for cross-device sync. |
| **Complex matchmaking** | Gauntlet is single-player vs AI. No need for player matching, ELO, or wait times. | Fixed AI progression path. Simple and predictable. |
| **Unlockable characters/items** | Scope creep. Roguelike meta-progression is a whole system. | All AI personalities available from start. No unlock gating. |
| **Healing/power-ups** | Changes core Gauntlet design. "Player dice carry over (no healing)" is the tension mechanic. | Keep dice carry-over pure. Healing removes stakes. |
| **Pause mid-duel** | Single-player doesn't need pause for fairness. Pausing reduces flow state. | Let browser tab handle "pause" naturally (timer doesn't run in background). |
| **Custom difficulty** | Undermines leaderboard validity. Everyone should face same progression. | Fixed difficulty curve. Leaderboard scores are comparable. |
| **Tournament brackets** | Complex bracket management, requires multiple concurrent games, UI complexity. | Single-player streak focus for v1. |
| **Team/co-op gauntlet** | Multiplayer adds sync complexity, balancing issues, wait times. | Pure single-player experience for v1. |
| **AI difficulty "cheating"** | Don't make AI see player's dice or cheat. Loses trust. Balatro's design philosophy: "skill, strategy, and decision-making." | Existing AI uses probability + personality. Keep it fair. |
| **Complex streak mechanics** | Some games have "streak multipliers" or combo systems. Adds complexity without much value for Perudo. | Simple streak = opponents defeated. Clean and clear. |

---

## Complexity Assessment

| Feature Category | Overall Complexity | Notes |
|------------------|-------------------|-------|
| **Core Loop** | Medium | Dice carry-over needs state management; AI progression is straightforward using existing personalities |
| **Leaderboard** | Medium | Needs backend storage (PartyKit can handle); nickname validation exists; anti-cheat is basic |
| **Achievements** | Low-Medium | localStorage for local; backend for global persistence; UI is simple toasts |
| **Polish/Differentiators** | Low | Mostly UI/UX; leverage existing animation system |

### Detailed Complexity Breakdown

| Feature | Complexity | Depends On | Notes |
|---------|------------|------------|-------|
| Core gauntlet loop | Medium | Existing game logic | New game mode, not new game mechanics |
| Dice carry-over state | Low | Game state | Simple: don't reset player dice |
| AI difficulty progression | Low | Existing AI system | Map streak count to personality |
| Streak counter | Low | UI | Simple state + display |
| Leaderboard display | Medium | Backend storage | Need to store/retrieve scores |
| Nickname handling | Low | Existing validation | Reuse lobby name logic |
| Score submission | Low | Backend API | Simple POST endpoint |
| Score fraud limits | Low | Backend | Basic validation |
| Personal best tracking | Low | localStorage | Client-side only initially |
| Achievement milestones | Low | localStorage/backend | Track and display |
| Achievement notifications | Low | UI | Toast component |
| Daily leaderboard reset | Medium | Backend | Requires scheduled job or date-based bucketing |
| "Near you" rankings | Medium | Backend query | Specific rank range fetch |
| Hidden achievements | Low | Achievement system | Flag on achievement definition |
| Challenge achievements | Medium | Game state tracking | Need to track additional conditions |

---

## Dependencies on Existing Features

| Gauntlet Feature | Existing Dependency | Status |
|------------------|---------------------|--------|
| AI opponents | 6 AI personalities | Built |
| Game mechanics | Perudo game logic | Built |
| UI components | Dice, bid UI, result screens | Built |
| Sound effects | Sound system | Built |
| Animations | Framer Motion setup | Built |
| Name validation | Lobby name constraints | Built |
| localStorage | Client identity hook | Built |

**All core dependencies are satisfied.** Gauntlet mode builds on existing infrastructure.

---

## Feature Phasing Recommendation

### Phase 1: Core Gauntlet (MVP)
1. Single-player gauntlet mode entry
2. Dice carry-over between duels
3. Escalating AI difficulty (Turtle -> Calculator -> Shark)
4. Streak counter display
5. Game over screen with restart
6. Local personal best tracking

### Phase 2: Leaderboard
1. Global leaderboard storage (PartyKit or separate)
2. Nickname entry on first submission
3. Top N leaderboard display
4. Basic fraud limits

### Phase 3: Achievements
1. Streak milestone achievements (5, 10, 25, 50, 100)
2. Achievement notifications
3. Achievement persistence

### Phase 4: Polish
1. Daily/weekly leaderboards
2. "Near you" rankings
3. Hidden/challenge achievements
4. Enhanced animations and sound

---

## Comparable Implementations

| Game | Endless/Gauntlet Design | What We Can Learn |
|------|------------------------|-------------------|
| **Slay the Spire** | Ascension levels add cumulative difficulty; Endless mode unlocked after beating game | Cumulative difficulty modifiers; clear progression milestones |
| **Balatro** | Ante 8 = "win", endless continues with exponential scaling; Ante 12 unlocks joker | Natural difficulty curve; specific unlock tied to milestone |
| **Circadian Dice** | Streak reward choice system; endless Chaos Realm mode | Streak rewards as motivator; infinite potential appeals to completionists |
| **Slice & Dice** | Generated mode with party rerolls; must reach floor 3 to reroll | Prevent "restart farming" patterns |
| **Battlefield Gauntlet** | Loadout-ready, no RNG loot; "every fight matters" | Remove friction, focus on skill; every encounter is meaningful |
| **Monster Train 2** | Endless Mode + Daily Runs; Pyre Hearts as meta progression | Dual modes (daily vs endless); unlock progression over time |

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Table Stakes | HIGH | Consistent patterns across roguelikes, mobile games, and gauntlet implementations |
| Differentiators | HIGH | Clear value-adds with evidence from comparable products |
| Anti-Features | HIGH | Strong evidence these add complexity without proportional value for v1 |
| Complexity Estimates | MEDIUM | Based on existing codebase analysis; actual complexity depends on backend architecture for leaderboards |
| Phasing | MEDIUM | Logical progression but may need adjustment based on playtesting |

---

## Sources

### Primary Sources (HIGH confidence)
- [Heroic Labs: Leaderboard Best Practices](https://heroiclabs.com/docs/nakama/concepts/leaderboards/best-practices/)
- [Android Developers: Achievements](https://developer.android.com/games/pgs/achievements)
- [Plotline: Streaks and Milestones for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [Trophy: Streaks Gamification Case Study](https://trophy.so/blog/streaks-gamification-case-study)
- [GDevelop: Leaderboards Documentation](https://wiki.gdevelop.io/gdevelop5/all-features/leaderboards/)

### Secondary Sources (MEDIUM confidence)
- [Slay the Spire Wiki: Ascension](https://slay-the-spire.fandom.com/wiki/Ascension)
- [Steam: Slay the Spire Endless Mode Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1719337474)
- [GameRant: Balatro Endless Mode](https://gamerant.com/balatro-what-to-know-about-endless-mode/)
- [Balatro Wiki: Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes)
- [Battlefield Gauntlet Mode Review](https://www.theflagshipeclipse.com/2025/10/30/battlefield-gauntlet-mode-is-the-best-thing-to-ever-happen-to-battle-royales/)

### Tertiary Sources (Community discussions, patterns)
- [Medium: Climbing the Ranks in Mobile Gaming](https://medium.com/@alidrsn/climbing-the-ranks-a-guide-to-leaderboards-in-mobile-gaming-67f4f808e147)
- [UX Magazine: Psychology of Hot Streak Game Design](https://uxmag.medium.com/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame-3dde153f239c)
- [Steam: Circadian Dice Streak Discussion](https://steamcommunity.com/app/1893620/discussions/0/5696507684083632129/)
- [Game UI Database: Achievement Notifications](https://gameuidatabase.com/index.php?scrn=158)

---

*Feature research for Gauntlet mode: 2026-01-21*
