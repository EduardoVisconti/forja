# ADR 005 — UI Component Library and Styling

## Status
Accepted

## Context
The app needs a consistent, accessible UI that works on iOS and Android, supports dark/light mode automatically, and allows custom styling where needed.

## Decision
Use **Gluestack UI v2** as the component library with **NativeWind** (Tailwind CSS for React Native) for custom styling.

Theme follows the device system setting (auto dark/light).

## Consequences
- Gluestack UI v2 is built on top of NativeWind — they are designed to work together
- Accessible components out of the box (ARIA, keyboard nav)
- Developer already knows Tailwind — NativeWind has near-identical class syntax
- Dark/light mode handled at the theme provider level — no manual color switching per component
- All code and component names stay in English regardless of UI language
