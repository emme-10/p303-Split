import exercises from '../data/exercises.json';
import { weekdays, type ActivityType, type SavedTemplate, type SplitAssignment, type WeeklySplit, type WeeklySplitSince, type WorkoutLog, type Weekday } from '../types/templates';

export type WorkoutDayStatus = 'logged' | 'planned' | 'skipped' | 'rest' | 'empty';

const exerciseCategories = new Map(exercises.map((exercise) => [exercise.id, exercise.category as ActivityType]));

export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayFor(date: Date): Weekday {
  return weekdays[(date.getDay() + 6) % 7];
}

function loggedDateKey(log: WorkoutLog) {
  return localDateKey(new Date(log.startedAt || log.date));
}

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
  assignmentSince,
  logs,
}: {
  dateKey: string;
  todayKey: string;
  weekday: Weekday;
  assignment: SplitAssignment | undefined;
  plannedType?: ActivityType;
  assignmentSince?: string;
  logs: WorkoutLog[];
}): WorkoutDayClassification {
  const loggedTypes = getLoggedWorkoutTypes(logs);
  const isPast = dateKey < todayKey;
  // An assignment only applies to dates on/after the day it was set — otherwise a
  // weekday assignment made today would retroactively mark prior weeks as skipped/rest.
  const assignmentIsActive = assignment !== undefined && (!assignmentSince || dateKey >= assignmentSince);
  const effectiveAssignment = assignmentIsActive ? assignment : undefined;
  const effectivePlannedType = assignmentIsActive ? plannedType : undefined;
  let status: WorkoutDayStatus = 'empty';

  if (logs.length > 0) status = 'logged';
  else if (effectiveAssignment === 'rest') status = 'rest';
  else if (effectivePlannedType && !isPast) status = 'planned';
  else if (effectivePlannedType && isPast) status = 'skipped';

  return { status, loggedTypes };
}


export type RecentDayStatus = { dateKey: string; status: WorkoutDayStatus };

export function getRecentDayStatuses({
  today,
  days,
  weeklySplit,
  weeklySplitSince,
  templates,
  workoutLogs,
}: {
  today: Date;
  days: number;
  weeklySplit: WeeklySplit;
  weeklySplitSince?: WeeklySplitSince;
  templates: SavedTemplate[];
  workoutLogs: WorkoutLog[];
}): RecentDayStatus[] {
  const todayKey = localDateKey(today);
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const logsByDate = new Map<string, WorkoutLog[]>();

  for (const log of workoutLogs) {
    const key = loggedDateKey(log);
    logsByDate.set(key, [...(logsByDate.get(key) ?? []), log]);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (days - 1 - index));
    const dateKey = localDateKey(date);
    const weekday = weekdayFor(date);
    const assignment = weeklySplit[weekday];
    const template = assignment && assignment !== 'rest' ? templateById.get(assignment) : undefined;
    const classification = classifyWorkoutDay({
      dateKey,
      todayKey,
      weekday,
      assignment,
      plannedType: template?.activityType,
      assignmentSince: weeklySplitSince?.[weekday],
      logs: logsByDate.get(dateKey) ?? [],
    });
    return { dateKey, status: classification.status };
  });
}

// Counts consecutive logged days working backward from today; an explicit skipped planned day breaks the streak
export function calculateCurrentStreak(recentDays: RecentDayStatus[]): number {
  let streak = 0;
  for (const day of [...recentDays].reverse()) {
    if (day.status === 'skipped') break;
    if (day.status === 'logged') streak += 1;
  }
  return streak;
}