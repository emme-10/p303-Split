# SplitLog - Project Brief
### P303: Mobile Experience

## What is this?
A mobile-first workout planning and logging app for hybrid athletes — people
training for both strength and endurance (e.g. lifting + running) who need
one place to plan their weekly split, follow a template mid-workout, and
track progress over time. Think Hevy or Strong, but built around hybrid
training instead of single-discipline lifting.

## Persona
**The hybrid athlete.** Trains 4-6 days/week, mixing strength days (e.g.
"Back & Bicep," "Push," "Legs") with running (easy runs, intervals, long
runs). Needs to move fast mid-session — most usage happens standing in a
gym, phone in one hand, between sets. Planning happens elsewhere (couch,
commute); logging happens in the gym.

## Core Task
Create a weekly workout split made of reusable templates (e.g. assign
"Back & Bicep" to Monday), then follow that template during a live gym
session — check off sets/reps or log run distance/pace — with minimal
typing and no dead ends if something changes mid-workout.

## Data
Generate a fake local dataset (`src/data/`) covering a seeded user with
~6-8 weeks of history:
- `exercises.json` — exercise library: name, muscle group(s), category
  (strength / cardio), default unit (weight+reps, or distance+pace)
- `templates.json` — 4-6 saved workout templates (e.g. "Back & Bicep,"
  "Push Day," "Easy Run," "Leg Day"), each a list of exercises with target
  sets/reps or target distance
- `split.json` — a weekly schedule mapping days of the week to a template ID
  (or rest day)
- `logs.json` — historical logged workouts: date, template used (or
  freeform), actual sets/reps/weight or distance/time per exercise,
  optional notes
- No API calls, no auth backend — all data local/seeded for the prototype

## Screens & Flows
1. **Weekly Split (home)** — the week at a glance, each day showing its
   assigned template or "Rest." Tapping a day opens that day's template or
   lets the user assign one.
2. **Template Builder** — create/edit a template: add exercises from the
   library, set target sets/reps (strength) or distance/pace (cardio),
   reorder exercises.
3. **Active Workout / Log** — the in-gym flow: pull up today's template
   (or start freeform), check off each set as completed, log actual
   weight/reps or distance/time, mark the session done.
4. **Calendar** — month view of past and scheduled workouts, color-coded
   by type (strength/cardio/rest); tapping a day shows what was
   planned/logged.
5. **Progress** — trends over time: volume lifted per muscle group,
   weekly running mileage, workout streak/consistency. Simple charts,
   not a full analytics suite.

## Interactions
- Assigning a template to a day updates the Weekly Split immediately
- Starting a workout from the split pre-fills the Active Workout screen
  with that day's template; user can also start freeform (no template)
- During an active workout, users can swap in a different exercise
  on the fly without losing their place (addresses gym-equipment
  availability — see Stretch Goals for the "suggested alternative"
  version of this)
- Completed workouts write to the log and immediately reflect in
  Calendar and Progress
- Empty states are explicit, not blank screens: no split configured yet,
  a rest day, a week with no logs, a brand-new template with no
  exercises added

## Style
- Mobile-first, single-hand reachable — primary actions (log a set, mark
  complete) sit in the thumb zone, not the top of the screen
- Dark theme by default — gym environments, easier on the eyes glancing
  mid-set
- High-contrast, minimal-text UI during Active Workout specifically —
  large tap targets, numeric inputs over typing where possible
  (steppers for reps/weight)
- Clear visual distinction between strength days and cardio days
  (color/iconography) carried consistently across Split, Calendar, and
  Templates
- Calendar and Progress screens can be denser/more information-rich
  than Active Workout, since they're used outside the gym

## Tech
- React Native + Expo (TypeScript)
- Expo Router for native navigation
- react-native-web export target, deployed to Vercel for review access
- Local/seeded JSON data, no backend
- Victory Native or React Native SVG-based charts for Progress
- Site password-protected per submission guidelines

## Stretch Goals (Phase 2 — not required for initial review)
- **AI-assisted template guidance**: when building a template, surface
  short educational tips on exercise ordering and training-goal tradeoffs
  (e.g. compound-before-isolation, run-before-vs-after-lifting depending
  on strength vs. endurance goals)
- **Smart exercise substitution**: if planned equipment is unavailable
  mid-workout, suggest an alternative exercise targeting the same muscle
  group, without breaking the flow of the session
