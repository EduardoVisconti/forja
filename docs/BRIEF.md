# Project Brief — Forja

> Single source of truth. Every implementation decision starts here.

---

## 1. Product Summary

Forja is a mobile app for people who already train and want to track their workouts step-by-step and monitor their daily health habits — all in one place, offline-first, with no bloat.

---

## 2. Problem Being Solved

- People who train seriously still use spreadsheets mid-workout — slow, inconvenient, breaks focus
- No app combines structured workout execution with a daily health protocol check in a simple way
- Existing apps are too complex, too generic, or don't work well offline

---

## 3. Target Users

**Primary (MVP):** People who already train consistently, have their own workout plan, and want a better way to execute and track it. Brazilian audience, 20–40 years old, iPhone or Android.

**Not the target:** Beginners who need a coach to tell them what to do. People who don't train yet.

---

## 4. User Roles — MVP

| Role | Description |
|---|---|
| `user` | Creates workouts, executes them, logs cardio, checks daily habits |

> **Future role (v2):** `trainer` — sends plans to students. Architecture must be prepared for this without requiring a full rewrite.

---

## 5. Value Proposition

> Your workout in your pocket — no spreadsheet. Plus a daily health protocol that actually holds you accountable.

Two things no competitor combines well:
1. Step-by-step workout execution with rest timer and free reordering
2. Daily 8-item habit check with streak and score

---

## 6. Final MVP Scope

### Workout Module
- Create, edit, delete workout templates (e.g. Pull, Push, Legs)
- Each template has exercises with: name, sets, reps, weight (lbs or kg), rest time (per exercise), notes
- Execute workout: step-by-step, series-by-series, rest timer auto-starts after each set
- Freely reorder or skip exercises during active session
- Each exercise has an info icon → opens Google search for the exercise name
- End of session: summary with total volume, duration, PRs hit
- Seed data: one default Push/Pull/Legs plan pre-loaded on first launch

### Cardio / Running Log
- Separate section from gym workouts
- Log entry fields:
  - Date
  - Category: Zone 1–5 / Walk / Regenerative / Intervals / Long run
  - Duration (minutes)
  - Distance (km or miles)
  - Avg pace (min/km or min/mile)
  - Avg HR (bpm)
  - Notes / Effort (free text)
- List of past cardio sessions with filters by category

### Daily Habit Check
- 8 fixed habits (toggles):
  1. Morning sun exposure
  2. Slept 7h+
  3. Drank 3–4L water
  4. No caffeine after 3pm
  5. Ate 80%+ healthy
  6. Exercised
  7. Read something light
  8. Digital balance
- Daily score: checked / 8
- Streak counter
- Push notification at 9pm as reminder

### History & Progress
- Calendar view: workout days, cardio days, habit check days
- Weekly habit score chart
- Weekly volume chart (per muscle group)
- PR log per exercise

### Auth
- Email + password (MVP)
- Google Sign-In (MVP)
- Apple Sign-In (v1.1 — requires $99 Apple Developer account)

---

## 7. Explicitly Out of Scope — v1

| Feature | Version |
|---|---|
| Apple Sign-In | v1.1 |
| Apple Health / HealthKit integration | v2 |
| Trainer → student plan sharing | v2 |
| Social / community features | v2 |
| AI workout suggestions | v2 |
| Payments / subscriptions | v2 |
| English UI | v2 (i18n structure ready in v1) |
| Exercise video library | v2 |

---

## 8. Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Expo (React Native) + TypeScript | iOS + Android, familiar DX, no need to rewrite for native |
| Navigation | Expo Router | File-based, works like Next.js |
| UI Components | Gluestack UI v2 | Accessible, performant, works with NativeWind |
| Styling | NativeWind (Tailwind) | You already know Tailwind |
| State management | Zustand | Simple, no boilerplate |
| Local storage (offline) | MMKV | Fastest key-value store for RN |
| Local DB (offline) | WatermelonDB | Reactive, offline-first, sync-ready |
| Backend / Auth | Supabase | Free tier, Auth + Postgres + Realtime |
| Offline sync | WatermelonDB ↔ Supabase | Structured sync layer, conflict-safe |
| Push notifications | Expo Notifications | Free, cross-platform |
| i18n | i18next + react-i18next | Structure ready, PT default, EN later |
| Build | EAS Build (Expo) | Free tier for testing, TestFlight/Play Store when ready |
| Testing (friends) | Expo Go | QR code, no App Store needed |

**Everything free.** No paid services required for MVP.

---

## 9. Architecture Rules

1. **Feature-based folder structure** — code lives with its feature, not by type
2. **Data flow:** `service → hook → component → screen` — never skip layers
3. **Services** talk to Supabase or WatermelonDB — never inside components
4. **Hooks** orchestrate data, mutations, and derived state
5. **Components** render UI and handle user interaction only
6. **Screens** compose components and stay thin
7. **Global code** (auth, theme, i18n, providers) lives in `src/core/`
8. **Offline first** — all user data writes to WatermelonDB first, syncs to Supabase when online
9. **No direct Supabase calls in components** — always go through service layer
10. **Trainer role prepared** — `user` table has a `role` field from day one; multi-tenancy data model is ready

---

## 10. Folder Structure

```
src/
├── app/                        # Expo Router screens (thin)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx           # Home / today
│   │   ├── workout.tsx         # Workout list
│   │   ├── cardio.tsx          # Cardio log
│   │   ├── habits.tsx          # Daily check
│   │   └── history.tsx         # Progress
│   └── workout/
│       ├── [id].tsx            # Active workout session
│       └── edit/[id].tsx       # Edit template
│
├── core/                       # Global, shared by entire app
│   ├── auth/
│   ├── database/               # WatermelonDB setup
│   ├── supabase/               # Supabase client
│   ├── providers/
│   ├── i18n/
│   ├── theme/
│   └── notifications/
│
├── features/
│   ├── workout/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types/
│   ├── cardio/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── types/
│   ├── habits/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── history/
│       ├── components/
│       ├── hooks/
│       └── services/
│
├── components/                 # Truly shared UI components
│   ├── ui/
│   └── layout/
│
└── lib/                        # Utilities, helpers
    └── utils/
```

---

## 11. Data Entities

### users
```
id, email, name, role (user | trainer), unit_preference (kg | lbs), created_at
```

### workout_templates
```
id, user_id, name, type (gym | cardio), order_index, created_at
```

### exercises
```
id, template_id, name, sets, reps, weight, rest_seconds, notes, order_index
```

### workout_sessions
```
id, user_id, template_id, started_at, finished_at, duration_minutes, total_volume, notes
```

### set_logs
```
id, session_id, exercise_id, set_number, reps_done, weight_used, rest_seconds, completed_at
```

### cardio_logs
```
id, user_id, date, category (z1|z2|z3|z4|z5|walk|regenerative|intervals|long), 
duration_minutes, distance, avg_pace, avg_hr, notes, created_at
```

### habit_checks
```
id, user_id, date, sun_exposure, sleep_7h, water, no_late_caffeine, 
ate_healthy, exercised, read, digital_balance, score, created_at
```

---

## 12. ADR Summary

| # | Decision | Choice | Reason |
|---|---|---|---|
| 001 | Mobile framework | Expo (React Native) | iOS + Android, familiar stack, no PWA limitations |
| 002 | Offline strategy | WatermelonDB + MMKV | Offline-first, sync-ready, battle-tested |
| 003 | Backend | Supabase | Free tier, Auth + DB + Realtime in one |
| 004 | State management | Zustand | Simple, scalable, no boilerplate |
| 005 | UI library | Gluestack UI v2 + NativeWind | Accessible, performant, Tailwind-compatible |
| 006 | Auth (MVP) | Email + Google | Apple Sign-In requires paid dev account |
| 007 | Architecture | Feature-based | Scales without heavy refactors |
| 008 | Data flow | service → hook → component → screen | Predictable, testable, maintainable |
| 009 | i18n | i18next (PT default) | Structure ready for EN in v2, no migration needed |
| 010 | Trainer role | Data model prepared, UI in v2 | `role` field on users, tenant-safe queries from day one |

---

## 13. Implementation Roadmap

### Milestone 0 — Setup (Week 1)
- Expo project initialized with TypeScript
- Expo Router configured
- NativeWind + Gluestack UI installed
- WatermelonDB + MMKV configured
- Supabase project created + client configured
- Folder structure created
- i18n configured (PT)
- Theme (light/dark auto) configured
- docs/adr files created

### Milestone 1 — Auth (Week 1–2)
- Register with email + password
- Login with email + password
- Google Sign-In
- Auth state persistence (stays logged in)
- Protected routes

### Milestone 2 — Workout Templates (Week 2–3)
- Create / edit / delete workout template
- Add / reorder / delete exercises within template
- Seed data: default Push / Pull / Legs plan
- Unit preference: kg or lbs

### Milestone 3 — Active Workout Session (Week 3–4)
- Start workout from template
- Step-by-step: exercise → set → rest timer → next set
- Freely reorder or skip exercises mid-session
- Exercise info icon → Google search
- End session: summary (volume, duration, PRs)

### Milestone 4 — Cardio Log (Week 4–5)
- Log cardio entry (all fields)
- List past cardio sessions
- Filter by category

### Milestone 5 — Daily Habit Check (Week 5–6)
- 8-item toggle check
- Score + streak
- Push notification at 9pm

### Milestone 6 — History & Progress (Week 6–7)
- Calendar view
- Weekly habit score chart
- Weekly volume chart
- PR log per exercise

### Milestone 7 — Offline Sync (Week 7–8)
- WatermelonDB ↔ Supabase sync
- Conflict resolution strategy
- Sync status indicator

### Milestone 8 — Polish & Testing (Week 8–9)
- Share via Expo Go with friends (4–5 users)
- Fix critical bugs
- Performance pass
- App icon + splash screen

---

## 14. Biggest Risks

| Risk | Mitigation |
|---|---|
| WatermelonDB sync complexity | Implement sync last (M7), validate core product first |
| Apple Sign-In cost ($99) | Defer to v1.1, email + Google is enough for MVP |
| Scope creep | This brief is the boundary. Any new feature = new milestone |
| No real users | Friends test at M8 via Expo Go — no App Store needed |
| Market saturation | Differentiation is the combo workout + habit check. Make it visible on the home screen |

---

## 15. Testing Priorities

1. Workout session flow — most critical, must work offline
2. Rest timer accuracy
3. Habit check + streak calculation
4. Offline → online sync correctness
5. Auth flows (login, register, persist)

---

*Last updated: March 2026*  
*Status: Discovery complete — ready for scaffold*
