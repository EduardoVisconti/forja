# ADR 005 — UI Component Library and Styling

## Status
Accepted — Updated (Milestone 1)

## Context
The app needs a consistent, accessible UI that works on iOS and Android, supports dark/light mode, and allows custom styling where needed.

**Gluestack UI v1 was initially chosen**, but proved incompatible with React 19 and Expo SDK 54/55 due to deep dependency conflicts with `@react-native-aria/*` packages requiring React 16/17.

## Decision
Use **React Native Paper v5** as the component library with **NativeWind** (Tailwind CSS for React Native) for custom layout and utility styling.

- **React Native Paper** — provides form inputs, buttons, dialogs, navigation bars. Fully compatible with React 19 and Expo SDK 54+.
- **NativeWind (Tailwind)** — handles layout, spacing, colors, and custom styles via `className` prop.

Theme follows the device system setting via Paper's `PaperProvider`.

**Apple Sign-In:** Deferred to v1.1 as planned (no change).

## Consequences
- React Native Paper v5 is actively maintained and React 19-compatible
- Material Design 3 (MD3) components out of the box — accessible, keyboard navigable
- NativeWind fills the gap for layout utilities that Paper doesn't cover
- Tailwind `dark:` classes handle dark mode for custom layout areas
- Paper's theme token system can be customized in `AppProvider` when needed in future milestones
- Migration path from Gluestack: components swapped at the feature layer only — no changes to hooks, services, or stores
