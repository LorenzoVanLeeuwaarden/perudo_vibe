# Requirements: Perudo Vibe v2.0

**Defined:** 2026-01-19
**Core Value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction — just share a link and play.

## v2.0 Requirements

Requirements for Cloudflare deployment. Each maps to roadmap phases.

### Backend Deployment

- [ ] **BACK-01**: Cloudflare account created and configured for deployment
- [ ] **BACK-02**: PartyKit backend deployed to Cloudflare Workers
- [ ] **BACK-03**: Backend WebSocket endpoint accessible via public URL

### Frontend Deployment

- [ ] **FRONT-01**: Next.js app deployed to Cloudflare Pages
- [ ] **FRONT-02**: Frontend accessible via public Cloudflare Pages URL
- [ ] **FRONT-03**: Static assets (CSS, JS, images) served correctly

### Configuration

- [ ] **CONF-01**: Production environment variables configured in Cloudflare
- [ ] **CONF-02**: NEXT_PUBLIC_PARTYKIT_HOST points to production backend URL
- [ ] **CONF-03**: Build process completes successfully in Cloudflare

### Verification

- [ ] **VERF-01**: Room creation works in production environment
- [ ] **VERF-02**: Players can join rooms via shareable link
- [ ] **VERF-03**: Real-time multiplayer gameplay functional (bidding, Dudo, Calza)
- [ ] **VERF-04**: Disconnect/reconnect handling works in production

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom domain | Cloudflare URLs sufficient for v2.0, can add later |
| CI/CD pipeline | Manual deployment acceptable for now |
| Multiple environments (staging) | Single production environment for initial launch |
| Monitoring/alerting | Can add in future milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BACK-01 | Phase 10 | Pending |
| BACK-02 | Phase 10 | Pending |
| BACK-03 | Phase 10 | Pending |
| FRONT-01 | Phase 11 | Pending |
| FRONT-02 | Phase 11 | Pending |
| FRONT-03 | Phase 11 | Pending |
| CONF-01 | Phase 11 | Pending |
| CONF-02 | Phase 11 | Pending |
| CONF-03 | Phase 11 | Pending |
| VERF-01 | Phase 12 | Pending |
| VERF-02 | Phase 12 | Pending |
| VERF-03 | Phase 12 | Pending |
| VERF-04 | Phase 12 | Pending |

**Coverage:**
- v2.0 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after roadmap creation*
