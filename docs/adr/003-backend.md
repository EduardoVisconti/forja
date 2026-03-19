# ADR 003 — Backend and Database

## Status
Accepted

## Context
The project requires user authentication, cloud data persistence, and future real-time features (trainer → student in v2). Must be free for MVP.

## Decision
Use **Supabase** as the backend: PostgreSQL database, built-in Auth, Realtime, and Storage.

## Consequences
- Free tier covers the entire MVP phase comfortably
- Auth, DB, and Realtime in one service — no need to manage separate infrastructure
- PostgreSQL enables complex queries for history and progress features
- Row Level Security (RLS) enforces data isolation per user from day one
- Trainer → student multi-tenancy (v2) is achievable with RLS policy updates — no schema rewrite needed
- Vendor lock-in risk is low: Supabase is open source and self-hostable
