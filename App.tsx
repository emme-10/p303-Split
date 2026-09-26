import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppStateProvider, useAppState } from './src/context/AppStateContext';
import AddExercisesScreen from './src/screens/AddExercisesScreen';
import type { SavedTemplate, TemplateExercise } from './src/types/templates';
import ActiveWorkoutScreen from './src/screens/ActiveWorkoutScreen';
import TemplateDetailsScreen from './src/screens/TemplateDetailsScreen';
import type { TemplateDetails } from './src/types/templates';
import TemplateLibraryScreen from './src/screens/TemplateLibraryScreen';
import WeeklySplitScreen from './src/screens/WeeklySplitScreen';
import { colors, spacing, typography } from './src/theme';

type AppScreen = 'split' | 'library' | 'details' | 'exercises' | 'activeWorkout';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <AppStateProvider><AppNavigation /></AppStateProvider>;
}

function AppNavigation() {
  const { isHydrated, upsertTemplate } = useAppState();
  const [screen, setScreen] = useState<AppScreen>('split');
  const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<SavedTemplate | null>(null);

  if (!isHydrated) {
    return <View style={styles.loading}><ActivityIndicator color={colors.strength} /><Text style={styles.loadingText}>Loading your SplitLog...</Text></View>;
  }

  const startNewTemplate = () => {
    setTemplateDetails(null);
    setTemplateExercises([]);
    setEditingTemplateId(null);
    setScreen('details');
  };

  const startEditingTemplate = (template: SavedTemplate) => {
    setTemplateDetails(template);
    setTemplateExercises(template.exercises);
    setEditingTemplateId(template.id);
    setScreen('details');
  };

  const saveTemplate = (exercises: TemplateExercise[]) => {
    if (!templateDetails) return;
    const savedTemplate: SavedTemplate = { ...templateDetails, exercises, id: editingTemplateId ?? String(Date.now()) };
    upsertTemplate(savedTemplate);
    setScreen('library');
  };

  const startTemplateWorkout = (template: SavedTemplate) => {
    setActiveTemplate(template);
    setScreen('activeWorkout');
  };

  const startFreeformWorkout = () => {
    setActiveTemplate(null);
    setScreen('activeWorkout');
  };

  const finishWorkout = () => {
    setActiveTemplate(null);
    setScreen('split');
  };

  return (
    <View style={styles.container}>
      {screen === 'split' && <WeeklySplitScreen onOpenTemplates={() => setScreen('library')} onStartWorkout={startTemplateWorkout} onStartFreeform={startFreeformWorkout} />}
      {screen === 'library' && <TemplateLibraryScreen onAddTemplate={startNewTemplate} onEditTemplate={startEditingTemplate} onBack={() => setScreen('split')} />}
      {screen === 'details' && <TemplateDetailsScreen key={editingTemplateId ?? 'new'} initialDetails={templateDetails ?? undefined} isEditing={editingTemplateId !== null} onCancel={() => setScreen('library')} onNext={(details) => { setTemplateDetails(details); setScreen('exercises'); }} />}
      {screen === 'exercises' && templateDetails && <AddExercisesScreen details={templateDetails} initialExercises={templateExercises} onBack={() => setScreen('details')} onSave={saveTemplate} />}
      {screen === 'activeWorkout' && <ActiveWorkoutScreen template={activeTemplate ?? undefined} onCancel={() => { setActiveTemplate(null); setScreen('split'); }} onFinish={finishWorkout} />}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
});