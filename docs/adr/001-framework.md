# ADR 001 — Mobile Framework

## Status
Accepted

## Context
The app needs to run on both iOS and Android. The developer has strong experience with React and TypeScript but not with Swift or Kotlin. The app requires offline support, push notifications, and future Apple Health integration.

## Decision
Use **Expo (React Native)** with TypeScript.

## Consequences
- iOS and Android from a single codebase
- Familiar React/TypeScript DX — no new language to learn
- Expo Go allows friend testing via QR code before any App Store submission
- Apple Health integration is possible in v2 via Expo native modules or bare workflow
- PWA was rejected: poor iOS push notification support, no HealthKit access, offline limitations
- Flutter was rejected: different language (Dart), harder to leverage existing JS/TS knowledge
