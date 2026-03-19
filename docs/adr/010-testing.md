# ADR 010 — Testing Strategy

## Status
Accepted

## Context
MVP needs to ship fast. Full test coverage from day one would slow development significantly. However, critical flows must be reliable.

## Decision
**MVP testing priorities (in order):**
1. Unit tests for business logic: score calculation, streak logic, volume calculation, PR detection
2. Integration tests for critical services: workout session service, habit check service, sync logic
3. Manual testing for UI flows via Expo Go with real users

**Tools:** Jest + React Native Testing Library

E2E tests (Detox or Maestro) are deferred to post-MVP when flows are stable.

## Consequences
- Business logic bugs are caught before they reach users
- UI tests are manual during MVP — faster iteration
- Test files live alongside their feature: `features/workout/services/__tests__/`
- Each milestone ends with a manual smoke test of all critical paths before moving on
