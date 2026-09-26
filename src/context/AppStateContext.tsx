import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createEmptyWeeklySplit, weekdays, type SavedTemplate, type SplitAssignment, type WeeklySplit, type Weekday, type WorkoutLog } from '../types/templates';

const STORAGE_KEY = '@splitlog/app-state/v1';

export type AppSnapshot = {
  version: 1;
  templates: SavedTemplate[];
  weeklySplit: WeeklySplit;
  workoutLogs: WorkoutLog[];
};

type AppStateContextValue = AppSnapshot & {
  isHydrated: boolean;
  upsertTemplate: (template: SavedTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  assignTemplate: (day: Weekday, assignment: SplitAssignment) => void;
  addWorkoutLog: (log: WorkoutLog) => void;
};

const emptySnapshot = (): AppSnapshot => ({
  version: 1,
  templates: [],
  weeklySplit: createEmptyWeeklySplit(),
  workoutLogs: [],
});

const AppStateContext = createContext<AppStateContextValue | null>(null);

function parseSnapshot(rawValue: string | null): AppSnapshot {
  if (!rawValue) return emptySnapshot();

  const parsed: unknown = JSON.parse(rawValue);
  if (!parsed || typeof parsed !== 'object') return emptySnapshot();
  const stored = parsed as Partial<AppSnapshot>;
  const weeklySplit = createEmptyWeeklySplit();

  if (stored.weeklySplit && typeof stored.weeklySplit === 'object') {
    for (const day of weekdays) {
      const assignment = stored.weeklySplit[day];
      if (typeof assignment === 'string') weeklySplit[day] = assignment;
    }
  }

  return {
    version: 1,
    templates: Array.isArray(stored.templates) ? stored.templates : [],
    weeklySplit,
    workoutLogs: Array.isArray(stored.workoutLogs) ? stored.workoutLogs : [],
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        const hydratedSnapshot = parseSnapshot(storedValue);
        if (isActive) setSnapshot(hydratedSnapshot);
      } catch (error) {
        console.error('Unable to load saved SplitLog data:', error);
      } finally {
        if (isActive) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch((error: unknown) => {
      console.error('Unable to save SplitLog data:', error);
    });
  }, [isHydrated, snapshot]);

  const value = useMemo<AppStateContextValue>(() => ({
    ...snapshot,
    isHydrated,
    upsertTemplate: (template) => setSnapshot((current) => ({
      ...current,
      templates: current.templates.some((saved) => saved.id === template.id)
        ? current.templates.map((saved) => saved.id === template.id ? template : saved)
        : [...current.templates, template],
    })),
    deleteTemplate: (templateId) => setSnapshot((current) => ({
      ...current,
      templates: current.templates.filter((template) => template.id !== templateId),
      weeklySplit: Object.fromEntries(weekdays.map((day) => [day, current.weeklySplit[day] === templateId ? 'rest' : current.weeklySplit[day]])) as WeeklySplit,
    })),
    assignTemplate: (day: Weekday, assignment: SplitAssignment) => setSnapshot((current) => ({
      ...current,
      weeklySplit: { ...current.weeklySplit, [day]: assignment },
    })),
    addWorkoutLog: (log) => setSnapshot((current) => ({ ...current, workoutLogs: [...current.workoutLogs, log] })),
  }), [isHydrated, snapshot]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}