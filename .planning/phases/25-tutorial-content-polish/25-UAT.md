---
status: testing
phase: 25-tutorial-content-polish
source: 25-01-SUMMARY.md, 25-02-SUMMARY.md
started: 2026-01-23T10:00:00Z
updated: 2026-01-23T10:00:00Z
---

## Current Test

number: 1
name: Tutorial Launch
expected: |
  Click "How to Play" on main menu. Tutorial starts with you and 2 AI opponents (Alex, Sam).
awaiting: user response

## Tests

### 1. Tutorial Launch
expected: Click "How to Play" on main menu. Tutorial starts with you and 2 AI opponents (Alex, Sam).
result: [pending]

### 2. Basic Bidding Flow
expected: Tutorial guides you through making your first bid with tooltips explaining the concept. Only the intended bid is selectable.
result: [pending]

### 3. Dudo Teaching
expected: After AI bids, tutorial teaches you to call Dudo. Clicking Dudo triggers reveal showing the outcome.
result: [pending]

### 4. Wild Ones Introduction
expected: In round 2, tooltip explains that 1s are wild (count as any face value). Your 1s are highlighted.
result: [pending]

### 5. Wild Ones Reveal
expected: When dice are revealed, the count includes 1s as wilds. Tooltip confirms the total.
result: [pending]

### 6. Calza Button Visible
expected: In round 3 after Sam bids, a green "Calza" button appears and pulses/highlights.
result: [pending]

### 7. Calza Teaching
expected: Tooltip explains Calza (exact match challenge) before you click it.
result: [pending]

### 8. Calza Success
expected: Clicking Calza triggers reveal showing exactly 5 fours. Tooltip celebrates the successful Calza.
result: [pending]

### 9. Completion Confetti
expected: After finishing all tutorial steps, confetti animation plays.
result: [pending]

### 10. Auto Return to Menu
expected: After confetti, automatically returns to main menu within ~2 seconds (no button needed).
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0

## Gaps

[none yet]
