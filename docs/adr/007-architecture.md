# ADR 007 — Application Architecture

## Status
Accepted

## Context
The codebase needs to scale from MVP to v2 (trainer/student roles, Apple Health, payments) without heavy refactors. Multiple developers may contribute in the future.

## Decision
Use **feature-based architecture** with strict layer separation.

Data flow is always: `service → hook → component → screen`

```
features/
  workout/
    components/   ← renders UI
    hooks/        ← orchestrates data flow
    services/     ← talks to DB / API
    schemas/      ← Zod validation
    types/        ← TypeScript types
```

Global code (auth, theme, i18n, database setup) lives in `core/`.  
Screens in `app/` (Expo Router) are thin — they compose feature components only.

## Consequences
- Each feature is self-contained — can be modified or deleted without touching other features
- Services never imported directly in components — always through hooks
- Adding trainer role in v2 = new feature folder, not a refactor of existing ones
- New developers can understand the scope of a change by looking at one folder
