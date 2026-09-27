export type ActivityType = 'strength' | 'cardio';

export type TemplateDetails = {
  name: string;
  activityType: ActivityType;
  selectedMuscleGroups: string[];
  notes: string;
};

export type Exercise = {
  id: string;
  name: string;
  category: ActivityType;
  muscleGroups: string[];
  unit: 'sets_reps' | 'distance_time';
};

export type StrengthSet = { id: number; weight: string; reps: string };

export type TemplateExercise = {
  exercise: Exercise;
  notes: string;
  strengthSets: StrengthSet[];
  distance: string;
  timeOrPace: string;
};

export type SavedTemplate = TemplateDetails & { id: string; exercises: TemplateExercise[] };

export type WorkoutLog = {
  id: string;
  source?: 'demo';
  date: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  sessionType: 'template' | 'freeform';
  sessionName: string;
  templateId?: string;
  entries: Array<{
    exerciseId: string;
    completed: boolean;
    setsCompleted?: Array<{ reps: number; weight: number }>;
    setsLogged?: Array<{ reps?: number; weight?: number; completed: boolean }>;
    distance?: number;
    time?: number;
    timeOrPace?: string;
  }>;
  notes?: string;
};

export const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof weekdays)[number];
export type SplitAssignment = string | 'rest';
export type WeeklySplit = Partial<Record<Weekday, SplitAssignment>>;

export const createEmptyWeeklySplit = (): WeeklySplit => ({});