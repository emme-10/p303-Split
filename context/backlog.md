# Backlog

Deferred ideas and scope cuts — things worth remembering, not worth
building for the initial case study review. Add to this whenever a
"good idea, not now" comes up mid-session, so it doesn't just live in
chat history and get forgotten.

Each entry: what it is, why it was deferred, and any context that'll
matter if it gets picked up later.

---

## Activity types beyond Strength / Cardio
**What:** Original template-builder concept included 4 activity types —
Strength, Cardio, Hybrid, Mobility.
**Why deferred:** `src/theme/colors.ts` only defines color treatments
for Strength and Cardio (plus Rest and Streak, which aren't workout
types). Adding Hybrid/Mobility means deciding new colors that fit the
existing space-blue/glacier-turquoise palette without muddying the
"color = workout type" rule — worth a deliberate pass, not a rushed one.
**If picked up later:** decide whether Hybrid is a genuinely distinct
type or just a template that mixes Strength + Cardio exercises (which
is already supported — see Template Builder). Mobility likely needs its
own accent; consider a neutral/desaturated option so it doesn't compete
visually with the two primary types.

## Anatomical body figure for muscle group selection
**What:** Selecting target muscle groups via an interactive body diagram
(tap a muscle region) instead of a flat list.
**Why deferred:** Real SVG/interaction complexity for what's otherwise a
straightforward form step. Multi-select chips unblock the flow now;
the figure is a polish upgrade, not core functionality.
**If picked up later:** would replace the muscle-group chip selector in
Template Builder Screen 1. Look at how the reference apps (see
design-tokens.md inspiration) handle this — likely an SVG with tappable
regions, front/back toggle.

## AI-assisted template guidance
**What:** Educational tips during template building — e.g. exercise
ordering (compound-before-isolation) or run-before-vs-after-lifting
depending on strength vs. endurance goals.
**Why deferred:** Originally scoped as a BRIEF.md stretch goal — real
value, but adds external API dependency and scope beyond core build.
**If picked up later:** see BRIEF.md "Stretch Goals" for original framing.

## Smart exercise substitution
**What:** If planned equipment is unavailable mid-workout, suggest an
alternative exercise targeting the same muscle group without breaking
flow.
**Why deferred:** Same as above — BRIEF.md stretch goal, real-world
useful, not core-path.
**If picked up later:** could start as a static lookup table by muscle
group rather than requiring live availability data — see BRIEF.md.
