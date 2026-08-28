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

## [next session] — Design tokens + data model
- (fill in once style pass and data-model.md are done)

## [next session] — First screens
- (fill in once Weekly Split / Template Builder are underway)
