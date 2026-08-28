# Data Model

Seeded, local-only data — no backend, no real API. Lives in `src/data/`
once implemented. This doc describes the intended shape; update it if the
actual JSON structure diverges during build.

## `exercises.json`
List of exercises in the library.
```
{
  id: string
  name: string
  category: "strength" | "cardio"
  muscleGroups: string[]       // e.g. ["back", "biceps"]
  unit: "sets_reps" | "distance_time"
}
```

## `templates.json`
Reusable workout templates.
```
{
  id: string
  name: string                  // e.g. "Back & Bicep"
  type: "strength" | "cardio"
  exercises: [
    {
      exerciseId: string
      targetSets?: number
      targetReps?: number
      targetDistance?: number   // for cardio
      order: number
    }
  ]
}
```

## `split.json`
Weekly schedule.
```
{
  monday: templateId | "rest",
  tuesday: templateId | "rest",
  ...
}
```

## `logs.json`
Historical logged workouts (seeded with ~6-8 weeks of fake history).
```
{
  id: string
  date: string (ISO)
  templateId?: string           // omitted if freeform
  entries: [
    {
      exerciseId: string
      setsCompleted?: { reps: number, weight: number }[]
      distance?: number
      time?: number
    }
  ]
  notes?: string
}
```

## Open questions
- [ ] Units: lbs vs kg — pick one for the prototype (lbs, likely, unless
      you want to demo a settings toggle)
- [ ] How much seeded history is enough to make Progress charts feel real
      without over-investing in fake data generation?
