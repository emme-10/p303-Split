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
  date: string;
  templateId?: string;
  entries: Array<{
    exerciseId: string;
    setsCompleted?: Array<{ reps: number; weight: number }>;
    distance?: number;
    time?: number;
  }>;
  notes?: string;
};

export const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof weekdays)[number];
export type SplitAssignment = string | 'rest';
export type WeeklySplit = Record<Weekday, SplitAssignment>;

export const createEmptyWeeklySplit = (): WeeklySplit => ({
  monday: 'rest',
  tuesday: 'rest',
  wednesday: 'rest',
  thursday: 'rest',
  friday: 'rest',
  saturday: 'rest',
  sunday: 'rest',
});