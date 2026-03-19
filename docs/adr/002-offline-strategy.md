# ADR 002 — Offline Strategy

## Status
Accepted — Updated

## Context
Users will be in the gym with unreliable internet. The app must work fully offline — logging sets, rest timers, habit checks. Data must sync to the cloud when connectivity is restored.

Early testing will happen via Expo Go (QR code) with 4–5 friends before any App Store submission. MMKV and WatermelonDB require native modules and are incompatible with Expo Go.

## Decision
**Milestones 1–6 (validation phase):** Use **AsyncStorage** for local persistence. Simple, works in Expo Go, no native build required. Friends test via QR code immediately.

**Milestone 7 (after product is validated):** Migrate to **WatermelonDB** as the local database and **MMKV** for key-value storage. Full offline-first with Supabase sync.

All writes go to local storage first. Supabase sync runs in the background when online.

## Consequences
- Friends can test via Expo Go with a QR code — no .apk, no TestFlight, no $99 Apple account
- AsyncStorage is slower than MMKV but acceptable for MVP data volumes
- Migration from AsyncStorage → WatermelonDB happens at Milestone 7, after core flows are validated
- WatermelonDB sync complexity is deferred until the product is worth the investment
- Conflict resolution strategy (Milestone 7): last-write-wins per record using updated_at timestamp
- No architectural change needed: services abstract storage layer, swap is contained within services only
