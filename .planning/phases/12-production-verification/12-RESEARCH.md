# Phase 12: Production Verification - Research

**Researched:** 2026-01-19
**Domain:** Production Testing, Manual QA, End-to-End Verification
**Confidence:** HIGH

## Summary

Phase 12 is a verification phase, not a development phase. The goal is to confirm that the deployed Perudo multiplayer game works end-to-end in production. This requires a hybrid testing approach: automated health checks for infrastructure (URL accessibility, WebSocket endpoints), combined with manual step-by-step testing for interactive gameplay features.

The research confirms that production verification testing should be structured around observable behaviors with clear pass/fail criteria. The existing codebase has comprehensive game mechanics (bidding, Dudo, Calza, disconnect/reconnect, turn timers, AI takeover) that all need verification in the production environment.

**Primary recommendation:** Create a structured verification plan with automated infrastructure checks followed by guided manual testing scenarios, documenting all findings in VERIFICATION.md and tracking issues in ISSUES.md.

## Standard Stack

This is a verification phase - no new libraries needed. Testing uses:

### Core Tools
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| curl | HTTP/HTTPS endpoint health checks | Universal CLI tool, no dependencies |
| Browser DevTools | WebSocket inspection, network monitoring | Built into all target browsers |
| Manual testing | Interactive gameplay verification | Only way to verify real user experience |

### Supporting Tools
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Chrome DevTools Network tab | WebSocket frame inspection | Debugging connection issues |
| Browser responsive mode | Mobile viewport testing | Verifying responsive design |
| Multiple browser profiles | Simulating multiple players | Testing multiplayer scenarios |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual multi-player | Selenium/Playwright | Overkill for one-time verification |
| curl WebSocket | wscat/websocat | More complex setup, minimal benefit |
| Browser DevTools | External monitoring | DevTools is sufficient for verification |

## Architecture Patterns

### Verification Documentation Structure
```
.planning/phases/12-production-verification/
├── 12-CONTEXT.md          # User decisions (exists)
├── 12-RESEARCH.md         # This file
├── 12-01-PLAN.md          # Verification plan
├── 12-VERIFICATION.md     # Final verification report
└── 12-ISSUES.md           # Issue tracking (if needed)
```

### Pattern 1: Automated Health Checks First
**What:** Run programmatic checks before manual testing
**When to use:** Start of every verification session
**Example:**
```bash
# Frontend accessibility check
curl -s -o /dev/null -w "%{http_code}" https://faroleo.pages.dev
# Expected: 200

# Backend endpoint check (404 expected - WebSocket only)
curl -s -o /dev/null -w "%{http_code}" https://perudo-vibe.lorenzovanleeuwaarden.partykit.dev
# Expected: 404 (confirms server is running)

# TLS certificate verification
curl -vI https://perudo-vibe.lorenzovanleeuwaarden.partykit.dev 2>&1 | grep "SSL certificate"
# Expected: Valid certificate info
```

### Pattern 2: Step-by-Step Manual Testing
**What:** Guide user through one test at a time, wait for confirmation
**When to use:** Interactive feature verification
**Example:**
```markdown
### Test 1: Room Creation
**Action:**
1. Open https://faroleo.pages.dev in Chrome
2. Click "Play with Friends"
3. Click "Create Room"

**Expected:**
- Room code displayed (6 characters)
- Shareable URL shown
- "Waiting for players" message

**Status:** [ ] Pass [ ] Fail
**Notes:** _______________
```

### Pattern 3: Issue Categorization
**What:** Classify issues by severity to prioritize fixes
**When to use:** When documenting failures
**Example:**
```markdown
| Severity | Definition | Action |
|----------|------------|--------|
| Critical | Blocks gameplay entirely | Must fix before phase complete |
| Major | Degrades experience significantly | Should fix before phase complete |
| Minor | Cosmetic or edge case | Document for future |
```

### Anti-Patterns to Avoid
- **Testing everything at once:** Run one test, confirm, then proceed to next
- **Fixing issues during testing:** Document and continue, fix later
- **Skipping browsers:** All three browsers (Chrome, Safari, Firefox) must be verified
- **Single-device only:** Test both desktop and mobile viewports

## Don't Hand-Roll

Problems that should use existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket monitoring | Custom logging | Browser DevTools | Built-in, comprehensive |
| Multi-browser testing | Custom scripts | Manual + DevTools | One-time verification |
| HTTP health checks | Custom code | curl commands | Universal, reliable |
| Mobile simulation | Real device farms | Browser responsive mode | Sufficient for this phase |

**Key insight:** This is verification, not test automation. Simple tools are better than complex frameworks for one-time end-to-end testing.

## Common Pitfalls

### Pitfall 1: Incomplete Multiplayer Testing
**What goes wrong:** Testing with only 2 players misses group dynamics
**Why it happens:** Easier to set up 2 browsers than 4+
**How to avoid:** User decision requires 4+ players; use multiple browser windows/profiles
**Warning signs:** Tests pass with 2 players but fail with larger groups

### Pitfall 2: Missing SPA Routing Verification
**What goes wrong:** Direct URL navigation fails on Cloudflare Pages
**Why it happens:** Static export + SPA routing needs 404.html fallback
**How to avoid:** Test direct URL navigation to room pages (not just click-through)
**Warning signs:** Room URLs work when navigating in-app but 404 when pasted directly

### Pitfall 3: WebSocket Connection Races
**What goes wrong:** Connection established before client ID ready
**Why it happens:** Next.js static export quirks with client-side hooks
**How to avoid:** Verify connection guard works (useRoomConnection checks clientId)
**Warning signs:** "undefined" room code errors, connection failures on first load

### Pitfall 4: Cross-Browser Visual Inconsistencies
**What goes wrong:** Layout works in Chrome but breaks in Safari/Firefox
**Why it happens:** Different CSS rendering engines (Blink vs WebKit vs Gecko)
**How to avoid:** Test all three browsers, especially for dice display, animations
**Warning signs:** "Works on my machine" - always verify on target browsers

### Pitfall 5: Disconnect/Reconnect Not Actually Working
**What goes wrong:** Reconnection logic fails in production but works locally
**Why it happens:** Network conditions, PartyKit behavior differences
**How to avoid:** Simulate real disconnects (airplane mode, network toggle)
**Warning signs:** Testing with page refresh only - need actual network interruption

### Pitfall 6: AI Takeover Timing Issues
**What goes wrong:** AI doesn't take over or takes over too early
**Why it happens:** Unified alarm system complexity, timezone/clock issues
**How to avoid:** Test both turn timeout (30s) and disconnect grace (5s then 60s)
**Warning signs:** Timer runs out but nothing happens, or AI acts immediately

## Code Examples

### Automated Health Check Script Pattern
```bash
#!/bin/bash
# Source: Best practices for production verification

FRONTEND_URL="https://faroleo.pages.dev"
BACKEND_URL="https://perudo-vibe.lorenzovanleeuwaarden.partykit.dev"

echo "=== Infrastructure Health Checks ==="

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" == "200" ]; then
  echo "[PASS] Frontend accessible (HTTP $FRONTEND_STATUS)"
else
  echo "[FAIL] Frontend returned HTTP $FRONTEND_STATUS"
fi

# Check backend (404 expected - WebSocket server)
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL")
if [ "$BACKEND_STATUS" == "404" ]; then
  echo "[PASS] Backend running (HTTP $BACKEND_STATUS - expected for WS)"
else
  echo "[WARN] Backend returned HTTP $BACKEND_STATUS"
fi

# Check SPA routing
ROOM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/room/TEST123/")
if [ "$ROOM_STATUS" == "200" ]; then
  echo "[PASS] SPA routing working (HTTP $ROOM_STATUS)"
else
  echo "[FAIL] SPA routing returned HTTP $ROOM_STATUS"
fi
```

### Manual Test Case Template
```markdown
### Test: [Test Name]
**ID:** TC-XX
**Category:** [Room Creation | Join Flow | Gameplay | Disconnect]
**Browser:** [Chrome | Safari | Firefox]
**Device:** [Desktop | Mobile]

**Preconditions:**
- [State needed before test]

**Steps:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Expected Result:**
- [Observable outcome 1]
- [Observable outcome 2]

**Actual Result:**
- [ ] Pass
- [ ] Fail: [Description of failure]

**Screenshot:** [Only if failed]
**Notes:** [Observations]
```

### Issue Report Template
```markdown
## Issue: [Brief Description]
**Severity:** [Critical | Major | Minor]
**Browser:** [Chrome | Safari | Firefox | All]
**Device:** [Desktop | Mobile | All]
**Test Case:** TC-XX

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Screenshot
[If applicable]

### Additional Context
[Any other relevant information]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloudflare Pages only | Pages deprecated, Workers recommended | April 2025 | Existing deployment still works, but note for future |
| Complex test frameworks | Hybrid manual + automated | 2025 | Better for one-time verification |
| Single-browser testing | Cross-browser mandatory | Industry standard | Chrome, Safari, Firefox all required |

**Deprecated/outdated:**
- N/A for verification phase - using standard tools

## Test Scenarios Derived from Game Mechanics

Based on codebase analysis, these game mechanics need production verification:

### Room Management
- Room creation with code generation
- Shareable link generation and usage
- Host privileges (kick, settings, start game)
- Player join/leave notifications

### Core Gameplay (from gameLogic.ts, BidUI.tsx)
- Bidding: count/value selection, validation
- Dudo calls: challenge reveals all hands
- Calza calls: exact match verification
- Palifico rounds: value locked after first bid

### Round Flow (from party/index.ts)
- Dice rolling (phase: rolling)
- Bidding phase with turn order
- Reveal phase showing all hands
- Round result: loser loses die, calza winner gains die
- Game end: last player standing wins

### Disconnect/Reconnect (from Phase 8 verification)
- Immediate WifiOff icon
- 5-second delay before grayed-out visual
- AI takeover after 5s grace on their turn
- 60-second elimination timer
- Reconnection restores full state
- "Welcome back" toast for returning player

### Timer System (from Phase 7)
- Configurable turn timeout (10-120 seconds)
- Visual countdown
- AI takeover on timeout
- Bot badge indicator

## Open Questions

Things that couldn't be fully resolved:

1. **Cloudflare Pages Deprecation Status**
   - What we know: Deprecated April 2025, Workers recommended
   - What's unclear: Timeline for removal, impact on existing deploys
   - Recommendation: Proceed with testing current deployment, monitor for migration needs

2. **Mobile Browser Specific Issues**
   - What we know: Responsive design implemented, touch events supported
   - What's unclear: Any PartyKit/WebSocket issues on mobile browsers
   - Recommendation: Test on actual mobile device in addition to responsive mode

3. **Sound Files Placeholder Status**
   - What we know: victory.mp3, pop.mp3, dice-rattle.mp3 are placeholders
   - What's unclear: Whether placeholder sounds affect user experience
   - Recommendation: Note in verification if sounds play but don't block on quality

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `party/index.ts`, `src/hooks/useRoomConnection.ts`, `src/lib/gameLogic.ts`
- Prior phase verifications: `08-VERIFICATION.md`, `10-VERIFICATION.md`, `11-VERIFICATION.md`
- User decisions in `12-CONTEXT.md`

### Secondary (MEDIUM confidence)
- [QA Mentor - Production Verification & Acceptance Testing](https://www.qamentor.com/testing-coverage/test-phases/production-verification-acceptance-testing-phase/)
- [Software Testing Help - Post Release Testing](https://www.softwaretestinghelp.com/post-release-testing/)
- [VideoSDK - WebSocket Tests Guide 2025](https://www.videosdk.live/developer-hub/websocket/websocket-tests)
- [Frugal Testing - Cross-Browser Testing Checklist](https://www.frugaltesting.com/blog/cross-browser-testing-checklist-steps-to-ensure-compatibility-across-all-browsers)
- [ACCELQ - Cross Browser Testing Checklist 2025](https://www.accelq.com/blog/cross-browser-testing-checklist/)

### Tertiary (LOW confidence)
- General WebSearch findings on production testing best practices

## Metadata

**Confidence breakdown:**
- Test structure/patterns: HIGH - Based on industry standards and project context
- Game mechanics to test: HIGH - Derived directly from codebase analysis
- Infrastructure checks: HIGH - Standard curl/DevTools approaches
- Cross-browser concerns: MEDIUM - General best practices, not project-specific

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (verification is point-in-time)
