# ADR 004 — State Management

## Status
Accepted

## Context
The app has several independent domains: active workout session, habit check state, auth, user preferences. State needs to be accessible across screens without prop drilling.

## Decision
Use **Zustand** for global client state.

Server/database state is managed by custom hooks wrapping WatermelonDB queries — not Zustand.

## Consequences
- Zustand is minimal, no boilerplate, TypeScript-friendly
- Active workout session state (current exercise, set count, rest timer) lives in a Zustand store — survives navigation between screens
- Auth state lives in a Zustand store, persisted via MMKV
- No Redux — overkill for this scale
- React Query / TanStack Query was considered but rejected: WatermelonDB has its own reactive query system that makes it redundant
