# Decisions Log

A running log of key product and design decisions, in the order they were
made. This exists so the BRIEF.md's plan and the actual build stay
connected — and so context docs show they were updated across sessions,
not written once and abandoned.

Add a new entry each session, even a short one.

---

## 2026-08-28 — Project kickoff, scaffolding
- Chose React Native + Expo over fully-native (Swift/Kotlin) so the
  project can still deploy to a reviewable Vercel URL via
  react-native-web, while getting real native UI/navigation experience
  during the build
- Confirmed persona: hybrid athlete, gym-context, one-handed usage during
  Active Workout specifically
- Scoped OUT for v1: AI-assisted template guidance, smart exercise
  substitution (both moved to Stretch Goals in BRIEF.md) — keeping v1
  scope to plan → template → log → calendar → progress
- Repo scaffolding created: README, LICENSE, BRIEF.md, .claude/ and
  /context directories, base folder structure under src/

## 2026-08-28 — Design tokens defined
- Pulled visual direction from Oura, Ultrahuman, and a set of moodboard
  references (dark athletic dashboards, dotted-matrix data viz, radial
  gauges) — dark surfaces, restrained accent color, tabular numerals for
  big stat readouts
- Locked the core rule: color = workout type, consistently across every
  screen (strength = amber, cardio = cyan, rest = neutral gray)
- Reserved a separate lime accent for streaks/milestones specifically —
  not a workout-type color, so it stays meaningful when it appears
- Implemented as code in src/theme/ (colors.ts, typography.ts,
  spacing.ts, index.ts); explanation lives in context/design-tokens.md
- Deferred: icon set choice, exact font-loading mechanism — both to be
  decided once first screen work starts

## 2026-08-28 — Accent palette revised
- Swapped initial amber/cyan (warm/cool) pairing for space blue-purple
  (strength) + glacier turquoise (cardio) — more cohesive with the
  Oura/Ultrahuman mood, but both cool hues (~40° apart), a quieter
  at-a-glance split than warm/cool
- Mitigated by treating icon pairing (not just color) as required for
  every strength/cardio tag, and leaning on the saturation/lightness gap
  between the two (strength more saturated/violet, cardio paler)
- Streak accent shifted from neon lime to a softer sage-green, same hue
  family, just less saturated — reads calmer, still clearly distinct
  from both workout-type colors
- `warning` decoupled from `strength` (previously intentionally aliased
  since both were amber) — now has its own true amber, since strength is
  no longer warm-colored and the collision risk is gone

## [next session] — Data model
- (fill in once data-model.md's JSON structure is implemented as real
  seed data in src/data/)

## 2026-08-28 — Weekly Split and typography
- Built the Weekly Split home screen with seven mock days, assigned template
  names, explicit Rest states, and tappable day rows that currently log a
  placeholder assignment action
- Loaded Inter through expo-font and @expo-google-fonts/inter, with
  weight-specific font-family tokens for regular, medium, semibold, and bold
- Applied tabular numerals to the week number, summary counts, and day dates
  using React Native's `fontVariant: ['tabular-nums']`
- Raised the rest-day accent to `#A6A6AB` after checking contrast, bringing
  the RECOVERY label and rest marker above WCAG AA against their dark surfaces
