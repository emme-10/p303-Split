# Data Model

Local-only data — no backend, no real API. The exercise catalog is seeded
in `src/data/`; user-created templates and the weekly split are persisted
with AsyncStorage. This doc describes the intended shapes; update it if the
actual structures diverge during build.

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
  activityType: "strength" | "cardio"
  selectedMuscleGroups: string[]
  notes: string
  exercises: [
    {
      exercise: Exercise
      notes: string
      strengthSets: { id: number, weight: string, reps: string }[]
      distance: string
      timeOrPace: string
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
  wednesday: templateId | "rest",
  thursday: templateId | "rest",
  friday: templateId | "rest",
  saturday: templateId | "rest",
  sunday: templateId | "rest"
}
```

## Persisted app snapshot
AsyncStorage stores one versioned JSON snapshot under `@splitlog/app-state/v1`.
The shared context hydrates it before showing screens and writes the snapshot
when any collection changes. Workout logs are included in the same snapshot
shape so Active Workout can use the existing persistence path.
```
{
  version: 1,
  templates: SavedTemplate[],
  weeklySplit: {
    monday: templateId | "rest",
    tuesday: templateId | "rest",
  ...
  },
  workoutLogs: WorkoutLog[]
}
```

## `logs.json`
Historical logged workouts (seeded with ~6-8 weeks of fake history).
```
{
  id: string
  date: string (ISO)
  startedAt: string (ISO)
  completedAt: string (ISO)
  durationSeconds: number
  templateId?: string           // omitted if freeform
  entries: [
    {
      exerciseId: string
      completed: boolean
      setsCompleted?: { reps: number, weight: number }[]
      distance?: number
      time?: number
      timeOrPace?: string
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
