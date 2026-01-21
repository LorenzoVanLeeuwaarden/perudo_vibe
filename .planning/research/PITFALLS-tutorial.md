# Tutorial Design Pitfalls

**Domain:** Game tutorial for Perudo (Liar's Dice)
**Researched:** 2026-01-21
**Confidence:** HIGH (verified via multiple game design and UX sources)

---

## Critical Pitfalls

Mistakes that cause tutorial abandonment, user frustration, or require significant rework.

---

### Pitfall 1: Wall of Text Before Play

**What goes wrong:** Opening the tutorial with multiple screens of text explaining all Perudo rules (bidding, Dudo, wild ones, Palifico, Calza) before the player touches any controls. Players skip, skim, or close the tutorial entirely.

**Why it happens:** Developers want players to understand everything before starting. Seems logical but ignores how humans learn.

**Consequences:**
- Tutorial dropout within first 30 seconds
- Players skip and then complain the game is confusing
- Information not retained even if read

**Warning signs:**
- Tutorial starts with a text modal or multiple instruction screens
- No interaction in first 10 seconds
- Player must click "Next" through explanatory pages

**Prevention:**
- First interaction within 5 seconds of tutorial start
- Teach through doing: show player's dice, prompt first action immediately
- Break explanations into inline tooltips shown at moment of relevance
- Maximum 1-2 sentences per tooltip

**Phase to address:** Phase 1 (Tutorial Flow) - Establish interaction-first pattern from the start

**Sources:** [Eight Ways to Make a Bad Tutorial - Game Developer](https://www.gamedeveloper.com/design/the-designer-s-notebook-eight-ways-to-make-a-bad-tutorial), [Automaton - Japanese developers discuss tutorial pitfalls](https://automaton-media.com/en/news/players-hate-them-and-they-wont-even-try-to-look-for-them-until-they-absolutely-have-to-japanese-game-developers-discuss-the-pitfalls-of-tutorials/)

---

### Pitfall 2: No Skip or Exit Option

**What goes wrong:** Forcing players to complete the entire tutorial with no way to skip or exit. Returning players and experienced Perudo players must re-learn concepts they already know.

**Why it happens:** Concern that skipping leads to confused players. Fear of support requests from players who skipped and got lost.

**Consequences:**
- Experienced players frustrated and may abandon game
- Accessibility issue for players with cognitive disabilities who may need to take breaks
- Replay becomes painful

**Warning signs:**
- No "Skip Tutorial" button visible
- Escape key or back button doesn't work
- No progress indicator showing how much remains

**Prevention:**
- Always show "Skip" button (top-right corner, unobtrusive but visible)
- Offer "Skip to Game" at end of each lesson section
- Store completion state so tutorial never forces replay
- Add keyboard shortcut (Escape) to open skip/exit dialog

**Phase to address:** Phase 1 (Tutorial Flow) - Add skip infrastructure before building content

**Sources:** [Game Accessibility Guidelines - Skip option](https://gameaccessibilityguidelines.com/offer-a-means-to-bypass-gameplay-elements-that-arent-part-of-the-core-mechanic-via-settings-or-in-game-skip-option/)

---

### Pitfall 3: Forced Replay of Completed Sections

**What goes wrong:** When player makes a mistake in Step 5, tutorial resets to Step 1 and re-explains everything. Small errors result in replaying 2-3 minutes of content.

**Why it happens:** Simpler to reset state than handle partial recovery. Tutorial state machine is easier to implement as one-way flow.

**Consequences:**
- Rage quit after repeating explanations for the third time
- Players develop negative association with the game
- Compounds stress of learning

**Warning signs:**
- Any mistake causes "Let's start from the beginning"
- No checkpoint or step-level state
- Same explanations repeat after errors

**Prevention:**
- Checkpoint after each major concept (bidding, Dudo, etc.)
- On error, repeat only the current step with shorter prompt
- Allow retry of current action without re-explaining
- "Try again" not "Let's restart"

**Phase to address:** Phase 2 (Scripted Scenarios) - Build checkpoint system into scenario engine

**Sources:** [Eight Ways to Make a Bad Tutorial - Game Developer](https://www.gamedeveloper.com/design/the-designer-s-notebook-eight-ways-to-make-a-bad-tutorial)

---

### Pitfall 4: Constraining Moves Without Explanation

**What goes wrong:** Player can only make specific moves (e.g., must bid exactly "3 fives") but doesn't understand why other options are disabled. Feels like the game is broken.

**Why it happens:** Tutorial needs predetermined outcomes to demonstrate specific concepts. Developer forgets to explain why controls are limited.

**Consequences:**
- Player thinks UI is broken
- Player tries other actions repeatedly, getting frustrated
- Constraint feels arbitrary and infantilizing

**Warning signs:**
- Buttons disabled without visual explanation
- Player can't figure out what action is expected
- Clicking disabled controls has no feedback

**Prevention:**
- Always explain WHY an action is constrained: "For this example, bid 3 fives"
- Visual highlight (pulse, glow) on the required action
- Disabled controls should show tooltip: "Try bidding first to see how it works"
- Brief text explaining the pedagogical goal: "Let's see what happens when..."

**Phase to address:** Phase 2 (Scripted Scenarios) - Build constraint explanation system

**Sources:** [Beyond Hand-Holding: Reclaiming Player Agency - Wayline](https://www.wayline.io/blog/reclaiming-player-agency-in-game-design), [The Paradox of Choice in Game Design - Wayline](https://www.wayline.io/blog/paradox-of-choice-game-design-limiting-player-agency)

---

### Pitfall 5: Punishing Tutorial Mistakes Too Harshly

**What goes wrong:** Player makes wrong bid, tutorial shows "WRONG!" and loses a die. Now player has negative emotional experience during learning.

**Why it happens:** Using real game consequences in tutorial mode. Not distinguishing between learning environment and actual gameplay.

**Consequences:**
- Player feels stupid and discouraged
- Anxiety about making moves
- Association of game with negative emotions

**Warning signs:**
- Actual game penalties applied during tutorial
- Harsh language ("Wrong!", "Incorrect!", "You lost!")
- Die loss animation plays in tutorial

**Prevention:**
- Tutorial mode = safe space with no real consequences
- Gentle correction: "That bid wouldn't be valid because... Let's try again"
- Never show die loss/elimination during tutorial
- Frame mistakes as learning: "Good try! Here's what happens with that bid..."

**Phase to address:** Phase 2 (Scripted Scenarios) - Ensure tutorial mode never applies real penalties

**Sources:** [Eight Ways to Make a Bad Tutorial - Game Developer](https://www.gamedeveloper.com/design/the-designer-s-notebook-eight-ways-to-make-a-bad-tutorial)

---

## Moderate Pitfalls

Mistakes that cause confusion, delays, or poor learning outcomes but don't necessarily cause abandonment.

---

### Pitfall 6: Teaching All Concepts at Once

**What goes wrong:** Tutorial tries to explain bidding, Dudo, wild ones, Palifico, AND Calza in one flow. Player is overwhelmed and retains nothing.

**Why it happens:** Fear of incomplete teaching. Wanting to be thorough. Not structuring content progressively.

**Consequences:**
- Information overload
- Player forgets earlier concepts by the time they finish
- Concepts blur together

**Warning signs:**
- Tutorial is one long unbroken flow
- All 4+ concepts covered before player does anything meaningful
- No breaks or "You've learned X, ready for Y?"

**Prevention:**
- Progressive disclosure: teach one concept, practice it, then move on
- Order: Bidding (core) > Dudo (core) > Wild Ones (modifier) > Calza (advanced) > Palifico (situational)
- Clear section breaks: "You've mastered bidding! Ready to learn about challenging?"
- Option to pause after each section

**Phase to address:** Phase 1 (Tutorial Flow) - Structure as discrete lessons

**Sources:** [NN/g - Usability Heuristics Board Games](https://www.nngroup.com/articles/usability-heuristics-board-games/), [Tooltip Best Practices - UserPilot](https://userpilot.com/blog/tooltip-best-practices/)

---

### Pitfall 7: Tooltips That Block Critical UI

**What goes wrong:** Tooltip explaining bidding covers the BidUI component. Player can't see what they're supposed to interact with.

**Why it happens:** Tooltip positioning not tested. Default positioning puts tooltip over its trigger element.

**Consequences:**
- Player confused about what to click
- Tutorial feels clunky and unpolished
- Player dismisses tooltip before reading to see UI underneath

**Warning signs:**
- Tooltip obscures the element being explained
- Tooltip covers action buttons
- No consideration for mobile viewport

**Prevention:**
- Position tooltips above/below/beside target, never overlapping
- Use arrow/pointer to indicate target element clearly
- Test on mobile viewports (existing game is mobile-optimized)
- Add semi-transparent overlay to dim non-relevant UI

**Phase to address:** Phase 3 (Tooltip System) - Build positioning system with collision detection

**Sources:** [Tooltip UI Design - Mockplus](https://www.mockplus.com/blog/post/tooltip-ui-design), [Smashing Magazine - Tooltips for Mobile](https://www.smashingmagazine.com/2021/02/designing-tooltips-mobile-user-interfaces/)

---

### Pitfall 8: Mismatched Tutorial and Real Game UI

**What goes wrong:** Tutorial uses simplified mock UI that doesn't match actual game. Player finishes tutorial, enters real game, and can't find familiar elements.

**Why it happens:** Tutorial built as separate isolated component. Real game UI evolved after tutorial was created. Different teams/sessions built each.

**Consequences:**
- Transfer failure: skills don't carry over
- Player feels deceived
- May need to "re-learn" in real game

**Warning signs:**
- Tutorial has its own component hierarchy
- Tutorial doesn't import actual game components
- Different styling or layout than main game

**Prevention:**
- Tutorial MUST use actual `GameBoard`, `BidUI`, `PlayerDiceBadge` components
- Add tutorial-specific props (e.g., `tutorialMode: boolean`) rather than building separate components
- Tutorial overlay system works ON TOP of real game components
- Any UI changes in main game automatically reflected in tutorial

**Phase to address:** Phase 1 (Tutorial Flow) - Establish reuse pattern from start

**Sources:** [NN/g - Match Between Game and Real World](https://www.nngroup.com/articles/usability-heuristics-board-games/)

---

### Pitfall 9: AI Opponents Behaving Unrealistically

**What goes wrong:** Tutorial AI makes perfect teaching moves but real game AI plays completely differently. Player learns patterns that don't apply.

**Why it happens:** Tutorial uses simplified scripted responses. Real `generateAIBid` uses sophisticated probability-based logic (as seen in existing codebase).

**Consequences:**
- False expectations about AI behavior
- Strategies learned in tutorial fail in real game
- Player feels tutorial was useless

**Warning signs:**
- Tutorial AI always makes predictable, "nice" bids
- Real AI uses `shouldAICallDudo` with 1.3x/1.8x thresholds and random factors
- Tutorial never shows AI bluffing or making aggressive moves

**Prevention:**
- Acknowledge in tutorial: "In the real game, opponents may bluff or bid aggressively"
- Scripted tutorial bids should include at least one realistic AI behavior
- Consider showing one round where AI calls Dudo unexpectedly
- Brief mention: "AI opponents use probability calculations to make decisions"

**Phase to address:** Phase 2 (Scripted Scenarios) - Design scenarios that include realistic AI patterns

---

### Pitfall 10: No Progress Indication

**What goes wrong:** Player has no idea how much tutorial remains. Could be 2 minutes or 20 minutes. Uncertainty leads to impatience.

**Why it happens:** Tutorial built as linear flow without step tracking. Progress not prioritized over content.

**Consequences:**
- Player gives up not knowing they're almost done
- Can't plan time ("I'll do the tutorial later when I have time")
- No sense of accomplishment from partial completion

**Warning signs:**
- No step counter (e.g., "Step 2 of 5")
- No progress bar
- Can't see section structure

**Prevention:**
- Show progress: "Learning Bidding (1/4)" or progress dots
- Estimate time: "About 3 minutes remaining"
- Allow section selection to jump to specific lessons
- Celebrate milestone completion: "You've completed the basics!"

**Phase to address:** Phase 1 (Tutorial Flow) - Include progress tracking from start

**Sources:** [Tooltip Best Practices - UserPilot](https://userpilot.com/blog/tooltip-best-practices/), [NN/g - Visibility of Status](https://www.nngroup.com/articles/usability-heuristics-board-games/)

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

---

### Pitfall 11: Condescending Tone

**What goes wrong:** Tutorial talks down to player: "Great job clicking the button!" for trivial actions. Or assumes player is stupid.

**Why it happens:** Overcompensating for fear of being unclear. Copy written without considering adult audience.

**Consequences:**
- Eye-roll factor
- Reduced engagement with explanatory content
- Negative brand impression

**Prevention:**
- Professional, encouraging tone
- Praise for completing concepts, not individual clicks
- Treat player as intelligent adult learning new game

**Phase to address:** Phase 4 (Polish) - Copy review pass

**Sources:** [Eight Ways to Make a Bad Tutorial - Game Developer](https://www.gamedeveloper.com/design/the-designer-s-notebook-eight-ways-to-make-a-bad-tutorial)

---

### Pitfall 12: Inconsistent Terminology

**What goes wrong:** Tutorial uses "challenge" but game UI says "DUDO!". Or explains "wild ones" but game calls them "aces" or "jokers".

**Why it happens:** Tutorial written without reference to actual game strings. Different mental models between writer and UI.

**Consequences:**
- Confusion when transitioning to real game
- Player can't find the action they learned

**Prevention:**
- Audit all game UI text before writing tutorial copy
- Use exact same terminology: "DUDO!", "Calza", "Palifico"
- If game uses "jokers" (as seen in BidUI code), tutorial should too

**Phase to address:** Phase 4 (Polish) - Terminology consistency pass

---

### Pitfall 13: Animation Conflicts with Tooltips

**What goes wrong:** Tooltip appears while dice are animating. Tooltip points to element that moves mid-explanation. Or overlay conflicts with existing game animations.

**Why it happens:** Existing game has sophisticated animations (motion framer, AnimatePresence). Tutorial overlays not coordinated with animation timing.

**Consequences:**
- Janky visual experience
- Tooltip arrow points to wrong location
- Player distracted by animations while trying to read

**Prevention:**
- Pause/disable complex animations during active tooltip display
- Use existing `useReducedMotion` hook for tutorial mode
- Ensure tooltip positioning waits for animations to complete
- Consider `isFirefox` and `useSimplifiedAnimations` patterns already in codebase

**Phase to address:** Phase 3 (Tooltip System) - Coordinate with animation system

---

### Pitfall 14: No "Learn More" Escape Hatch

**What goes wrong:** Player wants more detail about wild ones mechanics but tutorial moves on. No way to access deeper explanation.

**Why it happens:** Tutorial optimized for brevity. No layered information architecture.

**Consequences:**
- Curious players frustrated
- Rules questions after tutorial
- Need for separate rules/help section

**Prevention:**
- Add optional "Learn more" links that expand detail
- Link to full rules section from tutorial
- "?" icon on each concept that opens detailed explanation

**Phase to address:** Phase 4 (Polish) - Add supplementary content links

---

## Integration Pitfalls

Specific to integrating tutorial with existing Perudo codebase.

---

### Pitfall 15: Breaking Existing Game State Management

**What goes wrong:** Tutorial mode interferes with existing `useUIStore` or game state. After tutorial, main game has stale or corrupted state.

**Why it happens:** Tutorial sets game state values that persist. No isolation between tutorial and real game context.

**Consequences:**
- Bugs in main game after tutorial
- State leaks (revealed hands, dudo overlays stuck)
- Hard to debug timing issues

**Warning signs:**
- Tutorial directly mutates same Zustand stores as main game
- No state reset when exiting tutorial
- Same component instances used without mode flag

**Prevention:**
- Tutorial should use isolated state (separate store or scoped state)
- Clear state reset on tutorial exit: `resetUIStore()`
- Tutorial mode prop prevents real server messages
- Test: play tutorial, exit, start real game - verify clean state

**Phase to address:** Phase 1 (Tutorial Flow) - Establish state isolation pattern

---

### Pitfall 16: Multiplayer Message Confusion

**What goes wrong:** Tutorial uses same `sendMessage` pattern as real game. Accidental message to server, or server expects messages during tutorial.

**Why it happens:** Reusing `GameBoard` which expects `sendMessage` prop. Not mocking/stubbing the server connection.

**Consequences:**
- Server errors during tutorial
- Unexpected behavior when tutorial "bids" hit server
- Potential to affect other players if in room

**Prevention:**
- Tutorial must NOT use real WebSocket connection
- Pass mock `sendMessage` that only affects local tutorial state
- Or: Tutorial runs in complete offline mode
- Verify: no network requests during tutorial flow

**Phase to address:** Phase 1 (Tutorial Flow) - Mock message system

---

### Pitfall 17: Predetermined Dice Rolls Not Matching UI Expectations

**What goes wrong:** Tutorial shows predetermined dice [3,3,5,5,1] but `SortedDiceDisplay` auto-sorts them, confusing the scripted explanation that says "Your first die is a 3."

**Why it happens:** Real game sorts dice for UX. Tutorial script assumes specific order.

**Consequences:**
- Explanation doesn't match visual
- "Click on your third die" points to wrong die
- Player confused

**Prevention:**
- Script to sorted order, not roll order
- Or: Disable sorting in tutorial mode (`animateSort={false}`)
- Test: verify script matches exactly what player sees
- Don't reference dice by position; reference by value

**Phase to address:** Phase 2 (Scripted Scenarios) - Test script against actual rendered output

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|----------------|------------|
| Phase 1: Tutorial Flow | State management conflicts | Use isolated tutorial store |
| Phase 1: Tutorial Flow | No skip option | Add skip infrastructure first |
| Phase 2: Scripted Scenarios | Constraints feel broken | Always explain WHY moves are limited |
| Phase 2: Scripted Scenarios | Reset on error | Implement step-level checkpoints |
| Phase 3: Tooltip System | Blocking critical UI | Position detection + mobile testing |
| Phase 3: Tooltip System | Animation conflicts | Coordinate with existing motion system |
| Phase 4: Polish | Terminology mismatch | Audit existing game copy first |
| Phase 4: Polish | Condescending tone | Copy review with fresh eyes |

---

## Sources

### Primary Sources (HIGH confidence)
- [Eight Ways to Make a Bad Tutorial - Game Developer](https://www.gamedeveloper.com/design/the-designer-s-notebook-eight-ways-to-make-a-bad-tutorial)
- [Usability Heuristics Applied to Board Games - NN/g](https://www.nngroup.com/articles/usability-heuristics-board-games/)
- [Game Accessibility Guidelines - Skip Option](https://gameaccessibilityguidelines.com/offer-a-means-to-bypass-gameplay-elements-that-arent-part-of-the-core-mechanic-via-settings-or-in-game-skip-option/)

### Secondary Sources (MEDIUM confidence)
- [Beyond Hand-Holding: Reclaiming Player Agency - Wayline](https://www.wayline.io/blog/reclaiming-player-agency-in-game-design)
- [The Paradox of Choice in Game Design - Wayline](https://www.wayline.io/blog/paradox-of-choice-game-design-limiting-player-agency)
- [Tooltip Best Practices - UserPilot](https://userpilot.com/blog/tooltip-best-practices/)
- [Tooltip UI Design - Mockplus](https://www.mockplus.com/blog/post/tooltip-ui-design)
- [Designing Better Tooltips - Smashing Magazine](https://www.smashingmagazine.com/2021/02/designing-tooltips-mobile-user-interfaces/)

### Domain Sources (Perudo/Liar's Dice)
- [How to Play Liar's Dice - Casino.org](https://www.casino.org/blog/liars-dice/)
- [Perudo - BoardGameGeek](https://boardgamegeek.com/boardgame/45/perudo)
- [Dudo - Wikipedia](https://en.wikipedia.org/wiki/Dudo)

### Codebase Analysis
- `/src/components/GameBoard.tsx` - Main game UI to reuse
- `/src/components/BidUI.tsx` - Bid interface with animations
- `/src/lib/gameLogic.ts` - AI logic and validation to preserve
