# Phase 25 Plan 01: Expand Tutorial Content Summary

Expanded tutorial script from 9 to 19 steps, teaching wild ones (1s count as any value) and Calza (exact match challenge) in addition to existing Bid and Dudo teaching.

## Changes Made

### Task 1: Update TutorialTooltipData type
- Added `'calza-button'` to `targetElement` union in `TutorialTooltipData` interface
- Added `'calza'` to `highlightButton` union in `TutorialStep` interface
- Commit: e669157

### Task 2: Add wild ones teaching steps
- Added step 9 (round2-roll): Introduces wild 1s with joker highlighting
- Added step 10 (ones-bid): Player bids 5x fives using wilds (2 fives + 2 wild ones = 4)
- Added step 11 (ones-ai-dudo): Alex incorrectly calls Dudo
- Added step 12 (ones-reveal): Reveals 6 fives (including wilds), Alex loses
- Dice setup: Player [1,1,5,5,3], Alex [3,3,1,6,2], Sam [5,4,4,2,6]
- Commit: cbc1548

### Task 3: Add Calza teaching steps
- Added step 13 (round3-roll): Round 3 setup, Alex starts
- Added step 14 (alex-bids-calza): Alex bids 3x fours
- Added step 15 (sam-bids-calza): Sam raises to 5x fours (exactly right)
- Added step 16 (calza-intro): Explains Calza mechanic
- Added step 17 (calza-call): Player calls Calza on exact bid
- Added step 18 (calza-reveal): Shows successful Calza (exactly 5 fours)
- Dice setup: Player [4,4,2,6,3], Alex [4,1,5,5,2], Sam [3,3,6,6,1]
- Commit: 4a93004

### Task 4: Update tutorialStore totalSteps
- Changed `totalSteps` from 9 to 19 to match expanded script
- Commit: bd75203

## Files Modified

| File | Change |
|------|--------|
| `src/lib/tutorial/types.ts` | Added calza-button target and calza highlight support |
| `src/lib/tutorial/script.ts` | Added 10 new steps for ones and calza teaching |
| `src/stores/tutorialStore.ts` | Updated totalSteps to 19 |

## Tutorial Teaching Order

The tutorial now teaches all core rules in order:
1. **Bid** (steps 0-4): How to make and raise bids
2. **Dudo** (steps 5-8): When and how to call Dudo
3. **Ones/Wilds** (steps 9-12): 1s count as any face value
4. **Calza** (steps 13-18): Exact match challenge for gaining dice

## Content Tone

All new tooltips follow CONTEXT.md guidelines:
- Playful and encouraging: "You're right! Alex loses a die."
- Direct 'you' voice: "Your two 1s can count as 5s, 3s, or whatever you need."
- Brief explanations: 1-2 sentences per teaching moment

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript compilation: PASS
- Build: PASS
- Step count: 19 (correct)
- Types include calza-button: PASS
- Store totalSteps = 19: PASS

## Duration

~2 minutes 30 seconds
