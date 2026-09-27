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
- Consolidated card Swap, Remove, and Reorder actions into a `...` menu;
  reordering uses a draft sheet so Cancel discards and Save applies only to
  the active session
- Connected the Today-card freeform entry to the same workout screen with
  an empty session; finishing requires at least one exercise
- Added explicit `sessionType` and `sessionName` log fields so later screens
  can identify freeform sessions without inferring from a missing template ID

## 2026-09-26 — Calendar month view
- Added a read-only month grid that uses actual logged exercise categories
  for past days and split assignments for today/future days
- Distinguished logged strength/cardio/mixed sessions, planned sessions,
  skipped planned sessions, explicit Rest, and unplanned empty days; marked
  today and added read-only day details with a route back to Weekly Split
- Made weekly split assignments optional per weekday so an omitted key means
  untouched/unplanned while the explicit `rest` value remains a planned rest
- Replaced separate date numbers and status dots with state-colored date
  circles, split-color circles for mixed logs, dashed skipped rings, and a
  separate translucent Today glow
- Blended logged and Rest fills toward the background at 65% using a shared
  color utility; base workout tokens remain unchanged and date contrast stays
  legible against the softened fills
- Calendar detects performed type from completed entries or workout values
  actually recorded in unchecked sets/cardio fields, so partial saved sessions
  no longer appear as Rest

## 2026-09-26 — Progress windows and charts
- Use eight Monday-based weeks for muscle volume and running mileage, giving
  twice the four-week chronic baseline for visible trend context
- Keep streak and consistency separate at a rolling 14-day window; explicit
  skipped planned days break the streak, while Rest and unplanned days do not
- Reuse Calendar's shared workout-day classifier; count recorded strength
  volume by exercise muscle groups and cardio mileage by logged distance
- Added a clearly labeled temporary Progress demo-data seed control that
  replaces only demo-tagged logs while preserving real workouts; remove or
  gate this control before submission review
- Kept mileage values and compact week ticks in responsive text rows outside
  the SVG plot, with MILES / WEEK beside the vertical scale to prevent labels
  from stretching or colliding on wide and mobile layouts
- Seed fixture uses real exercise IDs, progressive strength loads, variable
  weekly mileage, and intentional omissions on assigned plan days to exercise
  Calendar skipped states and Progress consistency

## 2026-09-26 — Progress screen: time window grounded in training science
- Researched how sports science approaches training-load time windows 
  before picking an arbitrary number for Progress's charts
- Landed on the Acute:Chronic Workload Ratio (ACWR) framework used in 
  sports science for monitoring training load/injury risk: "acute" 
  load = most recent 7 days, "chronic" load = rolling 28-day (4-week) 
  baseline average. Widely used windowing convention, though the ratio 
  itself has debate in the field about statistical validity — we're 
  borrowing the windowing logic, not claiming clinical rigor
- Decided: Progress's volume/mileage charts use an 8-week window — 
  roughly 2x the chronic (4-week) baseline, giving enough history to 
  show a trend emerging against that baseline, not just the baseline 
  itself. This is a deliberate, cited design choice, not a round 
  number picked arbitrarily
- Streak/consistency uses a SHORTER window (7-14 days) than the volume 
  charts — reasoning: consistency as a felt experience is about recent 
  behavior, not an 8-week average; conflating the two windows would 
  make the streak number lag behind what the user actually feels
- Sources: scienceforsport.com/acutechronic-workload-ratio, 
  frontiersin.org (Impellizzeri et al., ACWR research)

## 2026-09-26 — Progress screen: sets/week replaces volume for muscle balance
- Replaced "Volume per muscle group" (sum of weight × reps) with "Weekly
  sets per muscle group" (avg sets logged per week over the same 8-week
  window) — weight × reps is dominated by compound lower-body lifts moving
  heavier absolute loads, not an actual measure of training balance across
  muscle groups; sets/week is the standard, load-agnostic comparison metric
- Overlaid a reference band for the commonly cited hypertrophy guideline of
  10-20 sets/week per muscle group directly on each bar's track, using the
  existing muted strength color rather than a new hue
- Below-range values get reduced bar opacity as a secondary cue (no new
  color introduced); within/above-range isn't visually distinguished further
  to avoid over-designing a rarely-hit edge case
- Kept the same horizontal bar layout/interaction from the volume version —
  this was a data/meaning change, not a layout redesign
