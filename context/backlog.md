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

## Calendar screen — visual & UX polish
**What:** A round of tweaks identified after the first working build of
Calendar.

**Status: partially done.**
- ✅ DONE — Header hierarchy: removed the redundant/inaccurate "TRAINING 
  HISTORY" eyebrow (it implied history-only, but the screen also shows 
  future planned days); reduced the "‹ WEEKLY SPLIT" breadcrumb's visual 
  weight so it reads as secondary navigation, not competing with the 
  "Calendar" title
- ✅ DONE — Moved month-navigation arrows (‹ ›) down to sit alongside the 
  month/year line ("September 2026"), rather than the screen title
- ⬜ STILL OPEN — Rest-day color (and the muted fill treatment 
  generally) still needs visual refinement — explore a gradient or 
  glassmorphism-style treatment for a more refined look. NOTE: this is 
  likely bigger than Calendar alone — worth treating as an app-wide 
  styling exploration (src/theme/, design-tokens.md) rather than a 
  Calendar-only fix, since other screens use these same fills
- ⬜ STILL OPEN — Legend readability: currently one flat list mixing two 
  different taxonomies — COLOR (strength/cardio/both = activity type) 
  and SHAPE/FILL (planned/skipped/rest/today = status). Likely fix is 
  splitting into two grouped mini-legends (Activity Type vs. Status) 
  rather than just reflowing the current single list. Look at how other 
  apps/dashboards handle multi-dimensional legends before redesigning.

**Why deferred (remaining items):** Core Calendar functionality (day 
states, data sourcing, tap-to-detail) works and was reviewed as good 
enough to proceed — these are refinement passes, not blockers.

**If picked up later:** Legend restructure and rest/gradient styling 
are better done together once the app-wide styling exploration happens, 
since they're related (both about how "muted/refined" reads across 
the whole app, not just here).

---

## Sub-layer distinction for strength days (upper vs. lower body)
**What:** Visually distinguish upper-body vs. lower-body strength days 
on the Calendar, not just "strength" as one undifferentiated color.

**Why deferred:** This is an OPEN DESIGN QUESTION, not a decided 
feature — two unresolved problems before this can be built:
1. **Data gap:** templates/logs currently only carry 
   `category: strength | cardio` (see context/data-model.md) — there's 
   no upper/lower tagging yet. Would need either (a) templates tagged 
   with a sub-type explicitly, or (b) deriving it from the majority 
   muscle group of that day's logged exercises — these have different 
   implementation costs and different accuracy trade-offs
2. **Visual encoding gap:** color is already fully committed to 
   activity type (strength/cardio) per the core design-tokens.md rule — 
   a sub-layer can't just be "another color" without breaking that 
   rule. Would need a different visual dimension entirely (pattern, 
   small icon, texture) layered on top of the existing circle treatment

**If picked up later:** resolve the data question first (probably (a), 
explicit tagging, since deriving from muscle groups is fragile for 
mixed-focus days) before touching the visual layer. Note: building 
Progress's "volume per muscle group" feature may naturally surface data 
that partially answers the data-gap question above — worth checking 
before solving this twice. Prototype the visual encoding separately 
from Calendar itself (e.g. on a single sample circle) before committing 
to it across the whole month grid.