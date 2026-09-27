import exercises from '../data/exercises.json';
import { weekdays, type ActivityType, type Exercise, type SavedTemplate, type TemplateExercise, type Weekday, type WeeklySplit, type WorkoutLog } from '../types/templates';

const exerciseCatalog = exercises as Exercise[];
const defaultWeekPlan: Partial<Record<Weekday, ActivityType>> = {
  monday: 'strength',
  tuesday: 'cardio',
  wednesday: 'strength',
  friday: 'strength',
  saturday: 'cardio',
};
const weeklyMileageTrend = [9, 12, 8, 15, 11, 17, 10, 14];
const strengthExerciseIds = ['barbell-bench-press', 'lat-pulldown', 'back-squat', 'romanian-deadlift', 'overhead-press', 'barbell-row', 'bicep-curl'];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function makeStrengthEntry(exercise: Exercise, weekIndex: number, sessionIndex: number, exerciseIndex: number, planned?: TemplateExercise) {
  const plannedReps = Number.parseInt(planned?.strengthSets[0]?.reps ?? '', 10);
  const reps = Number.isFinite(plannedReps) ? plannedReps : 8 + ((weekIndex + sessionIndex) % 3) * 2;
  const plannedWeight = Number.parseFloat(planned?.strengthSets[0]?.weight ?? '');
  const baseWeight = (Number.isFinite(plannedWeight) ? plannedWeight : 55 + sessionIndex * 5) + weekIndex * 2;
  const setCount = Math.max(3, planned?.strengthSets.length ?? 0);
  const setsLogged = Array.from({ length: setCount }, (_, setIndex) => ({ weight: baseWeight + exerciseIndex * 10 + setIndex * 5, reps, completed: true }));
  return { exerciseId: exercise.id, completed: true, setsCompleted: setsLogged.map(({ weight, reps: setReps }) => ({ weight, reps: setReps })), setsLogged };
}

function makeCardioEntry(exercise: Exercise, weekIndex: number, sessionIndex: number) {
  const weeklyMiles = weeklyMileageTrend[weekIndex];
  const share = sessionIndex % 2 === 0 ? 0.36 : 0.64;
  const distance = Number((weeklyMiles * share).toFixed(1));
  const minutes = Math.round(distance * (share < 0.5 ? 9.5 : 10.2));
  return { exerciseId: exercise.id, completed: true, distance, time: minutes * 60, timeOrPace: `${minutes}:00` };
}

function makeEntries(weekIndex: number, sessionIndex: number, activityType: ActivityType, template?: SavedTemplate) {
  if (template && template.exercises.length > 0) {
    return template.exercises.map((item, index) => item.exercise.category === 'strength'
      ? makeStrengthEntry(item.exercise, weekIndex, sessionIndex, index, item)
      : makeCardioEntry(item.exercise, weekIndex, sessionIndex + index));
  }

  if (activityType === 'cardio') {
    const run = exerciseCatalog.find((item) => item.id === (sessionIndex % 2 === 0 ? 'easy-run' : 'long-run'));
    return run ? [makeCardioEntry(run, weekIndex, sessionIndex)] : [];
  }

  return strengthExerciseIds
    .map((id) => exerciseCatalog.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => exercise !== undefined)
    .slice(sessionIndex % 3, (sessionIndex % 3) + 3)
    .map((exercise, index) => makeStrengthEntry(exercise, weekIndex, sessionIndex, index));
}

// TEMPORARY DEV-ONLY fixture generator. Remove or gate before submission.
export function generateDemoProgressLogs(templates: SavedTemplate[], weeklySplit: WeeklySplit, now = new Date(), existingLogs: WorkoutLog[] = []): WorkoutLog[] {
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const existingWorkoutDates = new Set(existingLogs.filter((log) => log.source !== 'demo').map((log) => formatLocalDate(new Date(log.startedAt || log.date))));
  const firstMonday = new Date(now);
  firstMonday.setHours(0, 0, 0, 0);
  firstMonday.setDate(firstMonday.getDate() - ((firstMonday.getDay() + 6) % 7) - 49);
  const todayKey = formatLocalDate(now);
  const missedWeeks = new Set([1, 4, 6]);
  const assignedDays = weekdays.filter((day) => {
    const assignment = weeklySplit[day];
    return typeof assignment === 'string' && assignment !== 'rest' && templateById.has(assignment);
  });
  const logs: WorkoutLog[] = [];
  let sessionIndex = 0;

  for (let weekIndex = 0; weekIndex < 8; weekIndex += 1) {
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + weekIndex * 7);
    const missedDay = missedWeeks.has(weekIndex) && assignedDays.length > 0
      ? assignedDays[weekIndex % assignedDays.length]
      : null;

    for (const weekday of weekdays) {
      const dayDate = new Date(weekStart);
      const weekdayIndex = weekdays.indexOf(weekday);
      dayDate.setDate(weekStart.getDate() + weekdayIndex);
      const dateKey = formatLocalDate(dayDate);
      if (dateKey > todayKey) continue;
      if (existingWorkoutDates.has(dateKey)) continue;

      const assignment = weeklySplit[weekday];
      const assignedTemplate = typeof assignment === 'string' ? templateById.get(assignment) : undefined;
      const activityType = assignedTemplate?.activityType ?? defaultWeekPlan[weekday];
      if (!activityType) continue;
      if (weekday === missedDay) continue;

      const entries = makeEntries(weekIndex, sessionIndex, activityType, assignedTemplate);
      if (entries.length === 0) continue;

      const start = new Date(dayDate);
      start.setHours(17, 0, 0, 0);
      const startedAt = start.toISOString();
      const completedAt = new Date(start.getTime() + 45 * 60 * 1000).toISOString();
      logs.push({
        id: `demo-${dateKey}-${sessionIndex}`,
        source: 'demo',
        date: startedAt,
        startedAt,
        completedAt,
        durationSeconds: 45 * 60,
        sessionType: assignedTemplate ? 'template' : 'freeform',
        sessionName: assignedTemplate?.name ?? 'Freeform',
        ...(assignedTemplate ? { templateId: assignedTemplate.id } : {}),
        entries,
      });
      sessionIndex += 1;
    }
  }

  return logs;
}