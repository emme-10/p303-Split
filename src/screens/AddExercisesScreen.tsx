import { useState } from 'react';
import type { Ref } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import exercises from '../data/exercises.json';
import { colors, radius, spacing, typography } from '../theme';
import type { TemplateDetails } from './TemplateDetailsScreen';

type ActivityType = 'strength' | 'cardio';
type Exercise = Omit<(typeof exercises)[number], 'category'> & { category: ActivityType };
type StrengthSet = { id: number; weight: string; reps: string };
type AddedExercise = { exercise: Exercise; notes: string; strengthSets: StrengthSet[]; distance: string; timeOrPace: string };
const exerciseCatalog = exercises as Exercise[];

type AddExercisesScreenProps = {
  details: TemplateDetails;
  onBack: () => void;
};

const activityStyles = {
  strength: { accent: colors.strength, muted: colors.strengthMuted },
  cardio: { accent: colors.cardio, muted: colors.cardioMuted },
};

type SortableExerciseCardProps = {
  exerciseId: string;
  children: React.ReactNode;
};

function SortableExerciseCard({ exerciseId, children }: SortableExerciseCardProps) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exerciseId });
  const webStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.72 : 1,
  } as unknown as ViewStyle;
  const webDragProps = listeners as unknown as Record<string, unknown>;

  return <View ref={setNodeRef as unknown as Ref<View>} style={webStyle} {...webDragProps}>{children}</View>;
}

export default function AddExercisesScreen({ details, onBack }: AddExercisesScreenProps) {
  const [query, setQuery] = useState('');
  const [addedExercises, setAddedExercises] = useState<AddedExercise[]>([]);
  const matches = exerciseCatalog.filter((exercise) => exercise.name.toLowerCase().includes(query.trim().toLowerCase()));
  const visibleMatches = query.trim().length > 0 ? matches.slice(0, 6) : [];
  const missingExercise = addedExercises.length === 0;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const addExercise = (exercise: Exercise) => {
    if (addedExercises.some((added) => added.exercise.id === exercise.id)) {
      setQuery('');
      return;
    }
    setAddedExercises((current) => [
      ...current,
      { exercise, notes: '', strengthSets: [{ id: Date.now(), weight: '', reps: '' }], distance: '', timeOrPace: '' },
    ]);
    setQuery('');
  };

  const updateExercise = (exerciseId: string, update: Partial<AddedExercise>) => {
    setAddedExercises((current) => current.map((added) => added.exercise.id === exerciseId ? { ...added, ...update } : added));
  };

  const updateSet = (exerciseId: string, setId: number, update: Partial<StrengthSet>) => {
    const added = addedExercises.find((item) => item.exercise.id === exerciseId);
    if (!added) return;
    updateExercise(exerciseId, { strengthSets: added.strengthSets.map((set) => set.id === setId ? { ...set, ...update } : set) });
  };

  const handleSave = () => {
    if (missingExercise) return;
    console.log('Template ready to save:', { ...details, exercises: addedExercises });
  };

  const reorderStrengthExercises = (activeId: string, overId: string) => {
    if (activeId === overId) return;

    setAddedExercises((current) => {
      const strengthExercises = current.filter((item) => item.exercise.category === 'strength');
      const oldIndex = strengthExercises.findIndex((item) => item.exercise.id === activeId);
      const newIndex = strengthExercises.findIndex((item) => item.exercise.id === overId);
      if (oldIndex < 0 || newIndex < 0) return current;

      const reorderedStrength = arrayMove(strengthExercises, oldIndex, newIndex);
      let strengthIndex = 0;
      return current.map((item) => item.exercise.category === 'strength' ? reorderedStrength[strengthIndex++] : item);
    });
  };

  const renderExerciseCard = (added: AddedExercise) => {
    const { exercise } = added;
    const activity = activityStyles[exercise.category];
    const isStrength = exercise.category === 'strength';

    return (
      <View key={exercise.id} style={styles.exerciseCard}>
        <View style={styles.cardHeader}>
          <View style={styles.exerciseHeading}>
            <View style={[styles.resultMark, { backgroundColor: activity.accent }]} />
            <View>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={[styles.resultCategory, { color: activity.accent }]}>{exercise.category.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${exercise.name}`} onPress={() => setAddedExercises((current) => current.filter((item) => item.exercise.id !== exercise.id))} style={styles.removeButton}><Text style={styles.removeText}>×</Text></Pressable>
          </View>
        </View>
        {isStrength ? <>
          <View style={styles.notesField}>
            <Text style={styles.setHeaderText}>NOTES <Text style={styles.optional}>OPTIONAL</Text></Text>
            <TextInput accessibilityLabel={`${exercise.name} notes`} multiline onChangeText={(notes) => updateExercise(exercise.id, { notes })} placeholder="Add a cue or variation..." placeholderTextColor={colors.textDisabled} style={styles.exerciseNotesInput} textAlignVertical="top" value={added.notes} />
          </View>
          <View style={styles.setGrid}>
            <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text><Text style={[styles.setHeaderText, styles.flexColumn]}>LBS</Text><Text style={[styles.setHeaderText, styles.flexColumn]}>REPS</Text><View style={styles.actionColumn} />
          </View>
          {added.strengthSets.map((set, setIndex) => <View key={set.id} style={styles.setGrid}><Text style={[styles.setNumber, styles.setColumn]}>{setIndex + 1}</Text><TextInput accessibilityLabel={`${exercise.name} set ${setIndex + 1} pounds`} keyboardType="decimal-pad" onChangeText={(weight) => updateSet(exercise.id, set.id, { weight })} placeholder="--" placeholderTextColor={colors.textDisabled} style={[styles.compactInput, styles.flexColumn]} value={set.weight} /><TextInput accessibilityLabel={`${exercise.name} set ${setIndex + 1} reps`} keyboardType="number-pad" onChangeText={(reps) => updateSet(exercise.id, set.id, { reps })} placeholder="--" placeholderTextColor={colors.textDisabled} style={[styles.compactInput, styles.flexColumn]} value={set.reps} /><Pressable accessibilityRole="button" accessibilityLabel={`Delete set ${setIndex + 1} for ${exercise.name}`} onPress={() => updateExercise(exercise.id, { strengthSets: added.strengthSets.filter((row) => row.id !== set.id) })} style={styles.deleteSetButton}><Text style={styles.deleteSetText}>×</Text></Pressable></View>)}
          <Pressable accessibilityRole="button" onPress={() => updateExercise(exercise.id, { strengthSets: [...added.strengthSets, { id: Date.now(), weight: '', reps: '' }] })} style={styles.addSetButton}><Text style={[styles.addSetText, { color: activity.accent }]}>+ ADD SET</Text></Pressable>
        </> : <View style={styles.cardioFields}><View style={styles.cardioField}><Text style={styles.setHeaderText}>TARGET DISTANCE</Text><TextInput accessibilityLabel={`${exercise.name} target distance`} keyboardType="decimal-pad" onChangeText={(distance) => updateExercise(exercise.id, { distance })} placeholder="e.g. 3 mi" placeholderTextColor={colors.textDisabled} style={styles.fullInput} value={added.distance} /></View><View style={styles.cardioField}><Text style={styles.setHeaderText}>TARGET TIME OR PACE</Text><TextInput accessibilityLabel={`${exercise.name} target time or pace`} onChangeText={(timeOrPace) => updateExercise(exercise.id, { timeOrPace })} placeholder="e.g. 30:00 or 9:30 / mi" placeholderTextColor={colors.textDisabled} style={styles.fullInput} value={added.timeOrPace} /></View></View>}
      </View>
    );
  };

  const exerciseCards = addedExercises.map((added) => {
    const card = renderExerciseCard(added);
    return Platform.OS === 'web' && added.exercise.category === 'strength'
      ? <SortableExerciseCard key={added.exercise.id} exerciseId={added.exercise.id}>{card}</SortableExerciseCard>
      : card;
  });

  const strengthExerciseIds = addedExercises
    .filter((added) => added.exercise.category === 'strength')
    .map((added) => added.exercise.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel="Back to template details" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ DETAILS</Text>
        </Pressable>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>NEW TEMPLATE</Text>
          <Text style={styles.title}>Add exercises</Text>
          <Text style={styles.subtitle}>{details.name}</Text>
        </View>
        <View style={styles.stepIndicator} accessibilityLabel="Step 2 of 2">
          <View style={[styles.stepDot, { backgroundColor: colors.strength }]} />
          <View style={[styles.stepLine, { backgroundColor: colors.strength }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.strength }]} />
          <Text style={styles.stepText}>STEP 2 OF 2</Text>
        </View>
        <View style={styles.pickerSection}>
          <Text style={styles.label}>EXERCISES</Text>
          <TextInput accessibilityLabel="Search exercises" autoCapitalize="words" onChangeText={setQuery} placeholder="Search exercises" placeholderTextColor={colors.textDisabled} style={styles.searchInput} value={query} />
          {visibleMatches.length > 0 && (
            <View style={styles.results}>
              {visibleMatches.map((exercise) => {
                const activity = activityStyles[exercise.category];
                return <Pressable key={exercise.id} onPress={() => addExercise(exercise)} style={styles.resultRow}>
                  <View style={[styles.resultMark, { backgroundColor: activity.accent }]} />
                  <View style={styles.resultText}><Text style={styles.resultName}>{exercise.name}</Text><Text style={[styles.resultCategory, { color: activity.accent }]}>{exercise.category.toUpperCase()}</Text></View>
                </Pressable>;
              })}
            </View>
          )}
        </View>
        {Platform.OS === 'web' ? (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => over && reorderStrengthExercises(String(active.id), String(over.id))}
            sensors={sensors}
          >
            <SortableContext items={strengthExerciseIds} strategy={verticalListSortingStrategy}>
              {exerciseCards}
            </SortableContext>
          </DndContext>
        ) : exerciseCards}
        {missingExercise && <Text style={styles.hint}>Add at least one exercise to save this template.</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: missingExercise }} disabled={missingExercise} onPress={handleSave} style={({ pressed }) => [styles.saveButton, missingExercise && styles.saveButtonDisabled, pressed && styles.buttonPressed]}><Text style={[styles.saveButtonText, missingExercise && styles.saveButtonTextDisabled]}>SAVE TEMPLATE</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  backButton: { alignSelf: 'flex-start', minHeight: spacing.lg, justifyContent: 'center' }, backButtonText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 },
  header: { marginTop: spacing.md }, eyebrow: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.6 }, title: { marginTop: spacing.xs, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size['3xl'], fontWeight: typography.weight.bold }, subtitle: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl }, stepDot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.full }, stepLine: { width: spacing.xl, height: 1 }, stepText: { marginLeft: spacing.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 },
  pickerSection: { marginTop: spacing.xl }, label: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 }, searchInput: { minHeight: spacing['2xl'], marginTop: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  results: { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }, resultRow: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md }, resultMark: { width: spacing.sm, height: spacing.sm, marginRight: spacing.sm, borderRadius: radius.full }, resultText: { flex: 1 }, resultName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, resultCategory: { marginTop: spacing.xs, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  exerciseCard: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface }, cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, exerciseHeading: { flex: 1, flexDirection: 'row', alignItems: 'center' }, cardActions: { flexDirection: 'row', gap: spacing.sm }, exerciseName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.base, fontWeight: typography.weight.semibold }, removeButton: { width: spacing.lg, height: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceRaised }, removeText: { color: colors.error, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xl, fontWeight: typography.weight.regular },
  notesField: { marginTop: spacing.md, gap: spacing.sm }, exerciseNotesInput: { minHeight: spacing['2xl'], padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.sm, fontWeight: typography.weight.regular }, setGrid: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }, setHeaderText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, setColumn: { width: spacing.xl, textAlign: 'center' }, flexColumn: { flex: 1, minWidth: 0 }, actionColumn: { width: spacing.lg }, setNumber: { color: colors.textSecondary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.base, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] }, compactInput: { minHeight: spacing.lg, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.base, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] }, deleteSetButton: { width: spacing.lg, height: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm }, deleteSetText: { color: colors.error, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xl, fontWeight: typography.weight.regular }, addSetButton: { alignSelf: 'flex-start', minHeight: spacing.lg, justifyContent: 'center', marginTop: spacing.sm }, addSetText: { fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, optional: { color: colors.textDisabled },
  cardioFields: { marginTop: spacing.lg, gap: spacing.md }, cardioField: { gap: spacing.sm }, fullInput: { minHeight: spacing.lg, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  hint: { marginTop: spacing.md, color: colors.warning, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, saveButton: { minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, borderRadius: radius.md, backgroundColor: colors.strength }, saveButtonDisabled: { backgroundColor: colors.surfaceRaised }, buttonPressed: { opacity: 0.78 }, saveButtonText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.base, fontWeight: typography.weight.bold, letterSpacing: 1 }, saveButtonTextDisabled: { color: colors.textDisabled },
});