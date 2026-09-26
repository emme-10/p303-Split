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

## 2026-08-28 — Template Builder scoping
- Scoped Template Builder to 2 screens: Details (name, activity type,
  muscle groups, notes) → Add Exercises (combobox picker from
  exercises.json, conditional strength/cardio card fields)
- Confirmed templates can mix strength + cardio exercises in one
  template (e.g. a jog + a lifting block) — intentional, supports the
  hybrid-athlete persona
- Deferred: activity types beyond Strength/Cardio, anatomical
  muscle-group figure — both logged in context/backlog.md rather than
  built now
- Added context/backlog.md as a new scaffolding doc to track deferred
  ideas going forward, linked from .claude/context.md
- Edit reuses the same 2-screen flow pre-filled; Delete requires a
  confirmation dialog naming the template

## 2026-09-26 — Shared state and persistence
- Added `AppStateContext` as the shared owner for saved templates, the
  weekday-to-template weekly split, and a reserved workout-log collection
- Persisted those collections as one versioned AsyncStorage snapshot and
  gated the app screens on initial hydration to avoid flashing empty state
- Connected Weekly Split to saved templates, with a day picker for template
  or Rest assignments; template deletion clears affected assignments
- Made Weekly Split the home screen and added navigation to the Template
  Library; verified a created template and Monday assignment survive reload

## 2026-09-26 — Weekly Split Today card
- Added a dynamically dated Today card driven by the current weekday's
  persisted assignment, with an activity-colored Start Workout CTA or a
  quieter recovery/freeform state
- Marked today's row in the weekly list with a subtle activity-colored
  outline while preserving its assignment picker behavior
- Routed both workout actions to a temporary Active Workout placeholder

## 2026-09-26 — Template-driven Active Workout
- Replaced the assigned-template Start Workout placeholder with a
  scrollable session screen that preloads editable strength/cardio targets
- Added per-set and per-cardio completion, extra strength sets, and
  session-only exercise swapping without modifying the source template
- Added a partial-completion summary and persisted the completed session
  through AppStateContext; freeform workout entry remains deferred
- Added session-only exercise insertion from the shared exercise catalog,
  guarded set deletion, and a visible completion-column checkmark header
