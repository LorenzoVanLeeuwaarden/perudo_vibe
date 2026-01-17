# Testing Patterns

**Analysis Date:** 2025-01-17

## Test Framework

**Runner:**
- No test framework configured
- No Jest, Vitest, Playwright, or Cypress config files present
- No test dependencies in `package.json`

**Assertion Library:**
- Not applicable (no testing setup)

**Run Commands:**
```bash
# No test commands configured
# package.json only has: dev, build, start, lint
```

## Test File Organization

**Location:**
- No test files exist in the project
- No `__tests__/` directories
- No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files in `src/`

**Naming:**
- Not established (no tests exist)

**Structure:**
- Not applicable

## Test Structure

**Suite Organization:**
- Not established

**Patterns:**
- Not established

## Mocking

**Framework:**
- Not applicable (no testing)

**Patterns:**
- Not established

**What to Mock:**
- Not established

**What NOT to Mock:**
- Not established

## Fixtures and Factories

**Test Data:**
- Not applicable

**Location:**
- Not applicable

## Coverage

**Requirements:**
- No coverage requirements (no tests)
- No coverage tool configured

**View Coverage:**
```bash
# Not configured
```

## Test Types

**Unit Tests:**
- Not implemented
- Candidate functions for unit testing in `src/lib/gameLogic.ts`:
  - `isValidBid()` - bid validation with complex Perudo rules
  - `countMatching()` - dice counting with wild/joker logic
  - `shouldAICallDudo()` - AI decision logic
  - `shouldAICallCalza()` - AI decision logic
  - `generateAIBid()` - AI bid generation
  - `rollDice()` - dice rolling utility

**Integration Tests:**
- Not implemented
- Candidate areas:
  - Game state transitions (Lobby -> Rolling -> Bidding -> Reveal)
  - AI turn sequencing
  - Round winner/loser determination

**E2E Tests:**
- Not implemented
- Candidate flows:
  - Complete game from start to victory/defeat
  - User bidding and Dudo/Calza interactions
  - Settings panel interactions

## Recommended Test Setup

**Suggested Framework:**
- Vitest (fast, Vite-native, TypeScript support)
- Or Jest with ts-jest for broader ecosystem

**Suggested Structure:**
```
src/
├── lib/
│   ├── gameLogic.ts
│   └── gameLogic.test.ts    # Co-located unit tests
├── components/
│   ├── Dice.tsx
│   └── Dice.test.tsx        # Co-located component tests
└── __tests__/
    └── integration/         # Integration tests
```

**Suggested Test Utilities:**
- `@testing-library/react` for component testing
- `vitest` or `jest` for test runner
- Mock `Math.random()` for deterministic AI behavior tests

**Priority Test Targets:**
1. `src/lib/gameLogic.ts` - Pure functions, high business logic value
2. `src/components/BidUI.tsx` - Critical user interaction
3. `src/components/Dice.tsx` - Visual correctness
4. Main game flow integration tests

## Common Patterns (Recommended)

**Async Testing:**
```typescript
// If using Vitest with React Testing Library
import { render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';

test('dice roll completes', async () => {
  // Test animation completion
  await waitFor(() => {
    expect(screen.getByText('Your Turn')).toBeInTheDocument();
  });
});
```

**Error Testing:**
```typescript
import { expect, test } from 'vitest';
import { isValidBid } from './gameLogic';

test('invalid bid returns reason', () => {
  const result = isValidBid(
    { count: 0, value: 6 },
    null,
    10,
    false
  );
  expect(result.valid).toBe(false);
  expect(result.reason).toBe('Invalid count');
});
```

**AI Logic Testing:**
```typescript
import { expect, test, vi } from 'vitest';
import { shouldAICallDudo, generateAIBid } from './gameLogic';

test('AI calls dudo on unlikely bid', () => {
  // Mock random for deterministic behavior
  vi.spyOn(Math, 'random').mockReturnValue(0.9);

  const result = shouldAICallDudo(
    { count: 20, value: 6 },  // Very high bid
    [2, 3, 4, 5, 6],         // AI hand
    25,                       // Total dice
    false                     // Not palifico
  );

  expect(result).toBe(true);
  vi.restoreAllMocks();
});
```

---

*Testing analysis: 2025-01-17*
