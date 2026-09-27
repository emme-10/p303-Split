import exercises from '../data/exercises.json';
import type { ActivityType, SplitAssignment, WorkoutLog, Weekday } from '../types/templates';

export type WorkoutDayStatus = 'logged' | 'planned' | 'skipped' | 'rest' | 'empty';

const exerciseCategories = new Map(exercises.map((exercise) => [exercise.id, exercise.category as ActivityType]));

export type WorkoutDayClassification = {
  status: WorkoutDayStatus;
  loggedTypes: ActivityType[];
};

export function getLoggedWorkoutTypes(logs: WorkoutLog[]): ActivityType[] {
  const types = new Set<ActivityType>();
  for (const log of logs) {
    for (const entry of log.entries) {
      const category = exerciseCategories.get(entry.exerciseId);
      if (!category) continue;

      const hasRecordedStrength = entry.completed
        || (entry.setsCompleted?.length ?? 0) > 0
        || (entry.setsLogged?.some((set) => set.completed || set.reps !== undefined || set.weight !== undefined) ?? false);
      const hasRecordedCardio = entry.completed
        || (entry.distance ?? 0) > 0
        || (entry.time ?? 0) > 0
        || Boolean(entry.timeOrPace?.trim());

      if (category === 'strength' ? hasRecordedStrength : hasRecordedCardio) types.add(category);
    }
  }
  return [...types];
}

export function classifyWorkoutDay({
  dateKey,
  todayKey,
  weekday,
  assignment,
  plannedType,
  logs,
}: {
  dateKey: string;
  todayKey: string;
  weekday: Weekday;
  assignment: SplitAssignment | undefined;
  plannedType?: ActivityType;
  logs: WorkoutLog[];
}): WorkoutDayClassification {
  const loggedTypes = getLoggedWorkoutTypes(logs);
  const isPast = dateKey < todayKey;
  let status: WorkoutDayStatus = 'empty';

  if (logs.length > 0) status = 'logged';
  else if (assignment === 'rest') status = 'rest';
  else if (plannedType && !isPast) status = 'planned';
  else if (plannedType && isPast) status = 'skipped';

  return { status, loggedTypes };
}