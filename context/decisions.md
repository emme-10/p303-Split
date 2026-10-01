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

  ## 2026-09-26 — Progress: volume-per-muscle-group replaced with sets/week
- Reviewed the initial "Volume per muscle group" chart (total weight × 
  reps summed per muscle group) and found it measures the wrong thing: 
  compound lower-body lifts (squats, deadlifts) move far heavier 
  absolute loads than isolation upper-body lifts, so the comparison 
  was dominated by biomechanics, not actual training balance — a user 
  could be well-balanced and still see wildly lopsided bars
- Researched how training volume is actually measured for the "is my 
  training balanced" question: sets-per-muscle-group-per-week is the 
  standard, comparable metric (a set is a set regardless of load), with 
  an evidence-based effective range of roughly 10-20 sets/week for 
  hypertrophy across multiple reviews
- Replaced the section with average weekly sets per muscle group 
  (8-week average, smoothing week-to-week noise, consistent with the 
  ACWR-informed windowing already used elsewhere on this screen), shown 
  against that 10-20 set reference band
- Considered, and deliberately scoped OUT: comparing a user's strength 
  to population norms by age/weight (like strengthlevel.com's strength 
  standards). This solves a different problem (how do I compare to 
  others) than balance (am I neglecting a muscle group), and would 
  require real normed population data to be credible — not something 
  to fabricate with seed data. Logged as a separate backlog item.
- Sources: BodySpec sets-per-week guide, Weightology's evidence-based 
  set-volume review, Frontiers (Sports and Active Living) weekly 
  strength-training volume quantification, Titan Forge Fitness

## Strength-level percentile comparison (vs. population norms)
**What:** Show a user how their strength compares to others of similar 
age/bodyweight for a given lift — the pattern strengthlevel.com uses 
(e.g. "your dumbbell curl is stronger than 65% of lifters your weight").

**Why deferred:** This solves a genuinely different problem than the 
"weekly sets per muscle group" balance view (see decisions.md, 
2026-09-26 entry) — balance is about YOUR OWN training distribution; 
this is about comparing yourself to a population. To be credible, it 
needs real normed population data (age/bodyweight/gender-adjusted 
percentiles per lift) — not something that can be faked convincingly 
with invented seed data, and out of scope for a design case study 
without a real dataset or API behind it (e.g. strengthlevel.com's own 
data, if a usable API/dataset exists, or a similar source).

**If picked up later:** would need either (a) a licensed/public dataset 
of strength norms to source real percentile calculations, or (b) 
partnering the feature with a disclosed "for illustration only, not 
based on real population data" framing if built with placeholder 
numbers — the second option risks looking unpolished/dishonest in a 
portfolio piece, so (a) is strongly preferred if this is ever built.

## 2026-09-27 — Checkpoint

Core build is functionally complete — all 5 screens exist and work 
end-to-end. Pausing here to work on the other capstone projects before 
returning for polish + deploy. This entry is the punch list to pick 
back up from.

### What's built and working
- Weekly Split (home) — Today card, weekly list, tap-to-assign
- Template Builder + Template Library — create/edit/delete, combobox 
  exercise picker, conditional strength/cardio fields
- Active Workout — template-driven AND freeform, add/delete/swap/
  reorder exercises, partial completion allowed, finish/summary flow
- Calendar — day-state logic (logged/planned/skipped/rest), muted fill 
  treatment, header/breadcrumb cleanup done
- Progress — sets-per-week-per-muscle-group (evidence-grounded, see 
  earlier entry), weekly mileage with Y-axis + tap-to-reveal detail, 
  streak/consistency
- Shared state (AppStateContext) + persistence via AsyncStorage/
  localStorage — survives refresh
- Design tokens (color, type, spacing) — defined, documented, revised 
  once already

### Punch list to finish before submission, in priority order
1. **Add persistent bottom tab navigation** — currently relies on 
   scattered breadcrumb links, which doesn't read as a real mobile app 
   and risks the rubric's "confusing/hard to navigate" Redo criterion. 
   Proposed 4 tabs: Split (home) / Calendar / Progress / Templates. 
   Active Workout and Template Builder stay OFF the tab bar — they're 
   flows entered FROM a tab, not destinations themselves. Once nav 
   exists, remove the now-redundant "‹ Weekly Split" breadcrumb links 
   on Calendar/Progress.
2. **Remove the dev-only "Seed Demo Data" utility** 
   (src/utils/demoProgressData.ts + its button on Progress) — was kept 
   intentionally through the UI polish pass so screens could be 
   evaluated with realistic data, but MUST come out before submission. 
   A reviewer shouldn't be able to fabricate fake data in the demo. 
   After removing, verify the Progress empty state still looks 
   intentional for a zero-data user (don't let it have been quietly 
   relying on seeded data to look right).
3. **Empty states pass across all 5 screens** — BRIEF.md commits to 
   handling these gracefully; each screen was built with SOME empty 
   state handling inline, but worth a dedicated end-to-end check now 
   that everything exists, rather than trusting each prompt caught it.
4. **Full end-to-end flow test** — create a template → assign to 
   Weekly Split → log a workout (both template AND freeform) → confirm 
   correct in Calendar → confirm correct in Progress → refresh browser 
   → confirm everything persisted. Haven't run one clean pass through 
   the whole chain since Progress was added.
5. **Deploy to Vercel + password-protect** — local `dist` export was 
   tested weeks ago (`npx expo export -p web`, output dir `dist`, 
   preset "Other" on Vercel) but never actually pushed live.
6. **Backlog cleanup pass** — decide which open backlog items (Calendar 
   legend restructure, rest-color/gradient/glassmorphism exploration, 
   upper/lower-body sub-layer, strength-standards percentile 
   comparison, AI template guidance, smart exercise substitution) are 
   worth tackling vs. staying explicitly deferred. Either is fine — 
   just make it a conscious call, not a time-runs-out default.
7. **Final decisions.md wrap-up entry** — once everything above is 
   settled, write a closing entry tying back to BRIEF.md's original 
   plan so a reviewer can trace plan → build cleanly.
8. **Grep the repo for client/company-specific info** before submitting 
   — required by the program's own instructions.

### Notes for picking this back up
- The bottom-nav work (#1) is the biggest remaining lift — everything 
  else is comparatively quick. Worth tackling it in its own fresh 
  session/chat given its scope touches every screen's navigation.
- If resuming in a NEW chat/session, point it at BRIEF.md, 
  .claude/context.md, and this decisions.md entry specifically — it's 
  a self-contained status snapshot.

## 2026-09-30 — Persistent bottom tab navigation

Picked up punch-list item #1 from the 2026-09-27 checkpoint: scattered
breadcrumb links didn't read as a real mobile app and risked the rubric's
"confusing/hard to navigate" Redo criterion.

- Added `src/navigation/BottomTabBar.tsx` — a custom tab bar (no new
  navigation library; the app already drives screens from a manual state
  switch in `App.tsx` rather than Expo Router/react-navigation, so a
  lightweight component kept that pattern consistent) with 4 tabs: Split
  (home) / Calendar / Progress / Templates
- Active Workout and Template Builder (Template Details + Add Exercises)
  deliberately stay OFF the tab bar — they're flows entered FROM a tab
  (Split or Templates), not destinations themselves, so they push over
  the tab bar and hide it rather than becoming a 5th tab
- `App.tsx` now tracks whether the current screen is one of the 4 tab
  screens and only renders the tab bar in that case; flow screens keep
  their existing in-flow cancel/back affordances (e.g. Template Details'
  "‹ TEMPLATES")
- Reused existing tokens only — active-tab indicator and label use
  `colors.strength`/`colors.textPrimary`, matching the precedent already
  set elsewhere (e.g. Template Library's add button) of using the
  strength accent as the general "primary/active" UI color, not just a
  workout-type tag; no new colors or spacing values introduced
- Removed the now-redundant "‹ WEEKLY SPLIT" breadcrumb from Calendar and
  Progress per the original plan, and also from Template Library — it had
  the identical pattern/purpose (a way back to the home screen) and is
  equally redundant now that Templates is a tab itself
- Kept Calendar's "GO TO WEEKLY SPLIT" day-detail link and Progress's
  empty-state "GO TO WEEKLY SPLIT" CTA — both are contextual actions
  (assign a day / log a first workout), not breadcrumbs, so they stay
- Verified by walking all 4 tabs plus entering/exiting Template Builder
  in the running app: tab bar persists and highlights correctly across
  Split/Calendar/Progress/Templates, disappears during Template Builder,
  and cancelling returns to the correct tab

## 2026-09-30 — Empty-state pass across all 5 screens

Picked up punch-list item #3: audited all 5 screens against BRIEF.md's
"empty states are explicit, not blank screens" commitment, assuming zero
real user data (no templates, no logged workouts, nothing seeded).

- Already handled, no changes needed: Weekly Split (Rest-day today card,
  freeform fallback, "no templates yet" day-assignment picker), Calendar
  ("Nothing on the calendar yet" when the whole visible month is empty),
  Templates (no-templates empty state with an Add Template CTA), and
  Template Builder's Add Exercises step (disabled Save + "Add at least
  one exercise..." hint) — all already matched the brief
- Progress's top-level zero-workouts state was already handled, but its
  per-chart degradation was not: the weekly mileage line chart had no
  empty-state guard, so a window with workouts logged but zero cardio
  distance would have rendered a flat, unexplained line at the chart
  floor. Added a `hasMileageData` check that swaps the chart for a
  "No cardio distance logged in this window." message, mirroring the
  sets-per-muscle-group section's existing empty-text pattern
- Active Workout's freeform flow (0 exercises at session start) read as
  a near-blank screen below the header — added an explicit
  "No exercises in this session yet — add one to get started." hint
  above the Add Exercise button, reusing the same textSecondary/regular
  treatment as other empty-state copy in the app
- No new components introduced; both fixes reused existing `section`/
  text-style conventions already established on their respective screens

## 2026-09-30 — Full end-to-end flow test + two bug fixes

Ran punch-list item #4: create template → assign → log template workout
→ log freeform workout → verify Calendar → verify Progress → reload.
Most of the chain worked correctly (template creation, assignment,
logging, chart/streak math, and AsyncStorage persistence all checked
out). Found and fixed two real issues along the way:

**Bug: retroactive "Skipped"/"Rest" on historical Calendar days.** Weekly
Split assignments are recurring by weekday with no notion of *when* an
assignment took effect, so Calendar's classifier read "is this weekday
assigned" for every date in view — assigning Monday to a template today
instantly marked every past Monday as "Skipped," including dates weeks
before the template existed.
- Added `WeeklySplitSince` (`src/types/templates.ts`): a per-weekday
  dateKey recording when that weekday's current assignment was last set
- `AppStateContext.assignTemplate` now stamps `weeklySplitSince[day]` to
  today on every change; `deleteTemplate`'s fallback-to-rest does the
  same for affected days, since that's also an effective assignment
  change. Existing persisted data with no stamp falls back to the old
  (unrestricted) behavior rather than fabricating history — only
  assignments made after this fix get the new protection
- `classifyWorkoutDay` (`src/utils/workoutDayStatus.ts`) gained an
  `assignmentSince` param: an assignment is only treated as active for a
  given date if that date is on/after its since-date; otherwise the day
  falls back to its un-assigned state ("No plan") instead of "Skipped"
  or "Rest." `getRecentDayStatuses` and Calendar's `getMonthCells` both
  thread the per-weekday since-date through
- Verified: reassigning Monday and Wednesday today immediately turned
  every prior occurrence of those weekdays (Aug 31 → Sep 28) from
  "Skipped"/"Rest" into "No plan" in Calendar, while future occurrences
  (Oct 5, Oct 7) correctly still show "Planned"

**UX gap: no freeform entry point once today has an assigned template.**
The Today card's "Start a freeform workout instead" link only rendered
in the Rest-day branch; once a template was assigned, there was no way
to start a freeform session without first unassigning the day.
- Added the same freeform link as a secondary action in the
  template-assigned branch too, alongside (not replacing) "START
  WORKOUT" — reuses the existing `freeformLink` style, no new component
- Verified: freeform is now reachable both when today is Rest and when
  today has a template assigned, without changing the day's assignment

