# Design Tokens

**Status: defined.** Implemented as code in `src/theme/` (`colors.ts`,
`typography.ts`, `spacing.ts`, `index.ts`). This doc is the human-readable
explanation of *why* — keep both in sync if either changes.

## Inspiration
Oura, Ultrahuman, and a handful of moodboard references (dark athletic
dashboards, dotted-matrix data visualizations, radial gauges). Common
thread: dark surfaces, restrained accent color, "device readout" numerals
for big stats rather than plain body-text numbers.

## Core rule: color = workout type
Applied consistently across every screen (Weekly Split, Calendar,
Templates, Progress):
- **Strength** → amber/orange (`#F5A623`)
- **Cardio** → cyan/blue (`#4FC3F7`)
- **Rest day** → neutral gray (`#5A5A5E`)
- **Streak / milestone** → lime (`#D4FF4F`) — reserved for celebratory
  moments only (e.g. a workout streak, a new PR), NOT a workout-type
  color, so it doesn't get diluted

## Surfaces
- Background: near-black charcoal (`#0B0B0D`), not pure OLED black —
  softer, matches the reference apps' mood
- Cards: slightly lifted dark gray (`#17171A`), with gradient treatment
  reserved for one "featured" card per screen (e.g. today's workout),
  not applied everywhere — keeps it premium rather than busy

## Typography
- UI text: Inter — clean, legible at a glance mid-gym
- Big stat numerals (weight, reps, distance, streak count): tabular/
  monospace treatment — this is the detail that gives the references
  their "device" feel rather than looking like a generic list app

## Texture
- Dotted-matrix pattern (seen across references) borrowed sparingly —
  e.g. subtle background texture behind the Progress screen's hero stat.
  Not used everywhere; it's a signature accent, not wallpaper.

## Deliberately deferred
- Icon set — decide when building first screens, pick something that
  reads clearly at small sizes one-handed
- Exact font loading mechanism (expo-font / google-fonts) — wire up when
  first screen work starts
