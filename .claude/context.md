# Claude Context — SplitLog

This file orients Claude (or any AI coding tool) working in this repo.
Update it as the project evolves — don't let it go stale.

## Project in one line
A mobile-first (React Native + Expo) workout planner/logger for hybrid
athletes, built as a Protogen P303 case study.

## Source of truth
- Product intent, persona, and scope: [`/BRIEF.md`](../BRIEF.md)
- Design tokens (color, type, spacing): [`/context/design-tokens.md`](../context/design-tokens.md)
- Data shape: [`/context/data-model.md`](../context/data-model.md)
- Deferred features / scope cuts: [`/context/backlog.md`](../context/backlog.md)
- Running decision log: [`/context/decisions.md`](../context/decisions.md)

Always check `BRIEF.md` before proposing new features or screens —
scope is intentionally tight (see "Stretch Goals" section for what's
explicitly OUT of the initial build).

## Constraints Claude should respect
- No real backend, no real auth — all data is local/seeded JSON in
  `src/data/`
- No client-specific or company-specific data or references anywhere
  in the codebase, comments, or seed data
- This is a *responsive web export* of a React Native app (via
  react-native-web), deployed to Vercel — don't introduce
  web-only libraries that would break the native build target
- Primary actions during the "Active Workout" flow must be thumb-reachable
  and usable one-handed — this is a hard design constraint, not a
  preference
- Dark theme is default, not optional

## Current focus
See [`/context/decisions.md`](../context/decisions.md) for the latest
entry — that's the up-to-date "what are we working on right now."

## Conventions
- TypeScript throughout, strict mode
- Screens live in `src/screens/`, one file per screen
- Shared UI in `src/components/`
- Expo Router for navigation (file-based routing under `src/app/` if/when
  that structure is adopted — see decisions.md for when this changes)
