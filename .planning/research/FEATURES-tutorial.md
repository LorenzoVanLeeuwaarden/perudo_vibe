# Feature Landscape: Game Tutorial UX

**Domain:** Tutorial system for Perudo (Liar's Dice)
**Researched:** 2026-01-21
**Confidence:** HIGH (multiple authoritative sources agree)

## Context

Building a tutorial for Perudo - a bluffing dice game where players make bids about dice counts and can challenge (Dudo) or exactly match (Calza). The tutorial will be a scripted 3-player game with predetermined dice, where the player makes every move but choices are constrained to guide them through core mechanics.

Existing features in the codebase that the tutorial can leverage:
- Full BidUI component with count/value selectors
- DudoOverlay for dramatic challenge reveals
- RevealContent for showing dice results
- Animated dice (Dice, DiceCup, DyingDie, SpawningDie components)
- Player badges and color system
- Framer Motion animations throughout

---

## Table Stakes

Features users expect from any good game tutorial. Missing these makes the tutorial feel incomplete or frustrating.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Skip option** | Returning players don't want to repeat tutorials; accessibility requirement | Low | None | Single button, persist skip preference in localStorage |
| **Progress indicator** | Users need to know how far along they are and how much remains | Low | None | Simple "Step X of Y" or visual progress bar |
| **Learn by doing** | Players learn better through action than reading; text-heavy tutorials fail | Medium | Existing BidUI | Constrain UI to valid moves, player performs actual actions |
| **Clear visual cues** | Players need to know where to look and what to click | Medium | Existing components | Highlighting, arrows, pulsing indicators on interactive elements |
| **Safe environment** | Players need to make mistakes without consequences | Low | None | Scripted scenario with predetermined dice, no real game impact |
| **Concise instructions** | Long text blocks cause players to skim or skip entirely | Low | None | Keep text to 1-2 sentences per step maximum |
| **Replayable from menu** | Players forget mechanics after breaks, need to review | Low | ModeSelection | Add "How to Play" button to main menu |
| **Exit option** | Players may want to leave tutorial mid-way | Low | None | Clear back/exit button that returns to menu |

---

## Differentiators

Features that elevate a tutorial from acceptable to great. Not strictly required but significantly improve the experience.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Contextual tooltips** | Explain "why" not just "what" - helps with bluffing strategy understanding | Medium | None | Tooltip showing rationale: "They have 3 dice, so claiming 4 fives is risky..." |
| **AI "thought bubbles"** | Show what AI opponents are "thinking" to teach pattern recognition | Medium | Existing AI thinking display | Display strategic reasoning during AI turns |
| **Animated highlighting of relevant dice** | Draw attention to which dice matter for current bid | Low | Existing dice components | Pulse/glow dice that match bid value (already partially exists via selectedBidValue) |
| **Celebration on completion** | Dopamine hit reinforces learning, motivates finishing | Low | Existing VictoryScreen | Confetti, achievement toast: "You've learned the basics!" |
| **Branching paths for mistakes** | If player makes wrong choice, explain why instead of blocking | Medium | Tutorial state machine | Fork to "explanation" step, then return to retry |
| **Gradual complexity reveal** | Don't overwhelm with all rules at once (Calza, Palifico later) | Medium | Tutorial script | Multi-phase structure: basics first, advanced concepts in later steps |
| **Persistent completion state** | Remember if user completed tutorial, don't prompt again | Low | localStorage | Flag tutorial_completed, check on first launch |
| **"Show me again" per-step** | Let users re-read instruction for current step | Low | Tutorial state | Button to replay current step's instruction/animation |
| **Speed controls** | Let impatient users speed through, careful users slow down | Medium | Animation system | Variable delay between steps, fast-forward button |
| **Practice mode after tutorial** | Low-stakes games after learning before "real" play | High | AI game mode | Separate "practice" difficulty with gentler AI |

---

## Anti-Features

Things the tutorial should explicitly NOT do. Common mistakes that make tutorials tedious or annoying.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Unskippable tutorial on every launch** | Infuriates returning players, accessibility issue | Skip option + remember completion state + accessible from menu |
| **Wall of text before playing** | Players skim or abandon; learning by reading is ineffective | Interleave brief text with immediate action; max 1-2 sentences |
| **Locking all controls except one** | Feels patronizing and breaks immersion | Highlight recommended action but allow exploration |
| **Punishing mistakes harshly** | Tutorial should be safe space for learning | Gentle correction, explain what went wrong, let retry immediately |
| **Repeating information already shown** | Wastes time, implies player is stupid | Track what's been taught, skip redundant explanations |
| **Breaking immersion with "meta" UI** | Separate tutorial world feels disconnected | Integrate tutorial into a "practice game" that feels real |
| **Teaching mechanics out of context** | Abstract rules don't stick; "you'll need this later" | Introduce each mechanic right before it's needed |
| **Excessive hand-holding throughout** | Players learn by experimenting, not by being led | Start guided, then progressively remove guidance |
| **Auto-advancing before player is ready** | Different reading speeds, accessibility concerns | Wait for player acknowledgment (tap/click to continue) |
| **Hiding tutorial after first play** | Players forget after breaks, need reference | Always available from menu as "How to Play" |
| **Teaching everything at once** | Cognitive overload causes abandonment | Core loop first (bid, dudo), advanced rules later (calza, palifico, ones as wild) |
| **Tutorial longer than 5 minutes** | Attention spans are short; players want to play | Target 2-3 minutes for basics, optional advanced sections |

---

## Feature Dependencies

```
+------------------------------------------------------------------+
|                     EXISTING COMPONENTS                           |
|  BidUI, DudoOverlay, RevealContent, Dice, DiceCup, etc.          |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    TUTORIAL FOUNDATION                            |
|  - Tutorial script/state machine                                  |
|  - Predetermined dice generator                                   |
|  - Constrained UI mode (filter valid actions)                     |
|  - Tutorial overlay/tooltip component                             |
+------------------------------------------------------------------+
                              |
          +-------------------+-------------------+
          v                   v                   v
+------------------+  +------------------+  +------------------+
|  SKIP OPTION     |  |  PROGRESS BAR    |  |  VISUAL CUES     |
|  (requires:      |  |  (requires:      |  |  (requires:      |
|   localStorage)  |  |   step counter)  |  |   CSS/animation) |
+------------------+  +------------------+  +------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    DIFFERENTIATORS                                |
|  - Contextual tooltips (requires: tutorial foundation)            |
|  - AI thought bubbles (requires: tutorial foundation)             |
|  - Branching paths (requires: tutorial foundation)                |
|  - Celebration (requires: VictoryScreen adaptation)               |
+------------------------------------------------------------------+
```

---

## MVP Recommendation

For an effective MVP tutorial, prioritize:

### Must Have (Tutorial feels complete)
1. **Skip option** - Accessibility and returning player requirement
2. **Progress indicator** - Users need orientation
3. **Learn by doing** - Core tutorial philosophy
4. **Visual cues** - Players need guidance
5. **Concise text** - Prevent abandonment
6. **Replayable** - "How to Play" menu option

### Should Have (Tutorial feels polished)
7. **Contextual tooltips** - Strategic understanding for bluffing game
8. **Gradual complexity** - Don't teach Calza/Palifico until core is solid
9. **Completion celebration** - Positive reinforcement

### Defer to v2
- AI thought bubbles (complex, nice-to-have)
- Branching error paths (complex state management)
- Speed controls (polish feature)
- Practice mode (separate feature scope)

---

## Perudo-Specific Considerations

Given Perudo is a bluffing/bidding game, the tutorial should emphasize:

1. **Probability intuition** - Help players understand why bids make sense
   - "With 15 total dice, expecting about 2-3 of any face is reasonable"
   - Highlight when a bid seems too high

2. **Wild ones mechanic** - Critical rule often missed
   - Explicitly show ones counting as wild
   - Visual indicator during reveal

3. **When to Dudo vs bid higher** - Core strategic decision
   - Show probability breakdown
   - Explain risk/reward

4. **Calza as advanced move** - Teach after basics are solid
   - Optional "advanced" section
   - Explain the exact-match risk

5. **Reading other players** - Bluffing meta-game
   - Even in tutorial, hint at patterns
   - "The AI just increased the count significantly..."

---

## Tutorial Structure Recommendation

Based on research, recommended tutorial phases:

### Phase 1: Basic Bidding (60-90 seconds)
**Learning goal:** Understand what a bid is and how to make one

Steps:
1. "Welcome to Perudo! This is a game of dice and deception."
2. "You rolled your dice. Only you can see them." [Show player's dice]
3. "A bid guesses how many dice of a face value exist across ALL players."
4. "It's your turn. Make a bid!" [Constrain to single valid option]
5. AI makes bid. "They claimed there are X fives. Could be a bluff..."
6. "Each bid must be higher than the last. Raise the count or the face value."
7. Player makes another bid.

### Phase 2: Calling Dudo (60-90 seconds)
**Learning goal:** Understand when and how to challenge

Steps:
1. AI makes an aggressive bid. "That seems high..."
2. "If you think they're lying, call DUDO!"
3. Player calls Dudo. [Constrain to Dudo button]
4. Reveal sequence plays. Count shown.
5. "The bid was wrong! The bidder loses a die."
6. Show die being removed.

### Phase 3: Wild Ones (30-45 seconds)
**Learning goal:** Understand ones are wild

Steps:
1. "One more important rule: ONES are wild!"
2. "Ones count as ANY face value."
3. Show example: "If someone bids 4 fives, and there are 2 fives and 2 ones..."
4. "That's actually 4 fives! The bid would be correct."
5. Visual showing ones morphing into fives.

### Phase 4: Advanced (Optional, 60 seconds)
**Learning goal:** Introduce Calza for curious players

Steps:
1. "Ready for an advanced move? This is optional."
2. "CALZA means you think the bid is EXACTLY right."
3. "Risky but rewarding - if correct, YOU gain a die!"
4. "If wrong, YOU lose one instead."
5. Practice scenario.

### Completion
- Celebration screen
- "You're ready to play!"
- Options: Play vs AI, Play with Friends, Replay Tutorial

---

## Sources

### Primary (HIGH confidence)
- [Inworld AI: Game UX Best Practices for Tutorial Design](https://inworld.ai/blog/game-ux-best-practices-for-video-game-tutorial-design)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
- [The Impact of Tutorials on Games of Varying Complexity - CHI 2012](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf)
- [Game Developer: The Designer's Notebook - Eight Ways to Make a Bad Tutorial](https://www.gamedeveloper.com/design/the-designer-s-notebook-eight-ways-to-make-a-bad-tutorial)

### Secondary (MEDIUM confidence)
- [Apple Developer: Onboarding for Games](https://developer.apple.com/app-store/onboarding-for-games/)
- [The Acagamic: 5 Proven Game Onboarding Techniques](https://acagamic.com/newsletter/2023/04/04/dont-spook-the-newbies-unveiling-5-proven-game-onboarding-techniques/)
- [UserGuiding: Progress Trackers and Indicators](https://userguiding.com/blog/progress-trackers-and-indicators)
- [PMC: Learning to Play - Understanding In-Game Tutorials](https://pmc.ncbi.nlm.nih.gov/articles/PMC9676530/)

### Supporting (LOW confidence - community patterns)
- [Medium: How to Design a Mobile Game Tutorial](https://medium.com/udonis/how-to-design-a-mobile-game-tutorial-examples-53fe613f8ab0)
- [Medium: 3 Reasons Game Tutorials Suck](https://medium.com/@zac.milton99/3-reasons-game-tutorials-suck-471efb8ee61)
- [ResearchGate: Psychology of Rewards in Game-Based Learning](https://www.researchgate.net/publication/359651248_The_Psychology_of_Rewards_in_Digital_Game-Based_Learning_A_Comprehensive_Review)
