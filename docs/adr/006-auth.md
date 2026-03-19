# ADR 006 — Authentication

## Status
Accepted

## Context
Users need to create accounts and log in. The app should support social login for convenience. Apple Sign-In requires a paid Apple Developer account ($99/year) which is not available for MVP.

## Decision
**MVP:** Email + password and Google Sign-In via Supabase Auth.  
**v1.1:** Apple Sign-In added when Apple Developer account is active.

Auth tokens persisted in MMKV. Session refreshed automatically by Supabase client.

## Consequences
- No cost for MVP auth
- Google Sign-In covers the majority of social login preference on Android and iOS
- Apple Sign-In is required by App Store guidelines only when other social logins are offered — must be added before App Store submission
- `users` table includes a `role` field (user | trainer) from day one to support v2 without migration
