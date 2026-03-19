# ADR 008 — Navigation

## Status
Accepted

## Context
The app has authenticated and unauthenticated routes, a bottom tab structure for main features, and nested screens for active workout sessions.

## Decision
Use **Expo Router** (file-based routing).

Route groups:
- `(auth)/` — login, register (unauthenticated)
- `(tabs)/` — home, workout, cardio, habits, history (authenticated, bottom tabs)
- `workout/[id]` — active session screen (full screen, no tabs)

## Consequences
- File-based routing matches Next.js conventions — familiar mental model
- Route groups allow different layouts without extra configuration
- Deep linking works out of the box
- Active workout session is a full-screen route outside tabs — prevents accidental navigation away mid-session
