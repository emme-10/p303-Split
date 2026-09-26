import { useState } from 'react';
import type { Ref } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import exercises from '../data/exercises.json';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing, typography } from '../theme';
import type { Exercise, SavedTemplate, WorkoutLog } from '../types/templates';

type ActiveSet = { id: number; weight: string; reps: string; completed: boolean };
type SessionExercise = {
  sessionId: number;
  exercise: Exercise;
  strengthSets: ActiveSet[];
  distance: string;
  timeOrPace: string;
  completed: boolean;
};

type SortableExerciseRowProps = { item: SessionExercise };

type ActiveWorkoutScreenProps = {
  template?: SavedTemplate;
  onCancel: () => void;
  onFinish: () => void;
};

const exerciseCatalog = exercises as Exercise[];
const activityColors = {
  strength: { accent: colors.strength, muted: colors.strengthMuted },
  cardio: { accent: colors.cardio, muted: colors.cardioMuted },
};

function SortableExerciseRow({ item }: SortableExerciseRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.sessionId });
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.72 : 1,
  } as unknown as ViewStyle;
  const dragProps = { ...attributes, ...listeners } as unknown as Record<string, unknown>;

  return (
    <View ref={setNodeRef as unknown as Ref<View>} style={[styles.reorderRow, dragStyle]}>
      <Text style={styles.reorderExerciseName}>{item.exercise.name}</Text>
      <View ref={setActivatorNodeRef as unknown as Ref<View>} {...dragProps} style={styles.dragHandle}>
        <Text style={styles.dragHandleText}>≡</Text>
      </View>
    </View>
  );
}

export default function ActiveWorkoutScreen({ template, onCancel, onFinish }: ActiveWorkoutScreenProps) {
  const { addWorkoutLog } = useAppState();
  const [startedAt] = useState(() => Date.now());
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>(() => (template?.exercises ?? []).map((item, index) => ({
    sessionId: Date.now() + index,
    exercise: item.exercise,
    strengthSets: item.exercise.category === 'strength'
      ? item.strengthSets.map((set) => ({ ...set, completed: false }))
      : [],
    distance: item.distance,
    timeOrPace: item.timeOrPace,
    completed: false,
  })));
  const [swapExerciseId, setSwapExerciseId] = useState<number | null>(null);
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showReorderSheet, setShowReorderSheet] = useState(false);
  const [reorderDraft, setReorderDraft] = useState<SessionExercise[]>([]);
  const [search, setSearch] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [finishError, setFinishError] = useState('');

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const completedSets = sessionExercises.reduce((count, item) => count + item.strengthSets.filter((set) => set.completed).length, 0);
  const completedExercises = sessionExercises.filter((item) => item.exercise.category === 'strength'
    ? item.strengthSets.some((set) => set.completed)
    : item.completed).length;
  const matches = exerciseCatalog.filter((exercise) => exercise.name.toLowerCase().includes(search.trim().toLowerCase()));
  const currentSwapExercise = sessionExercises.find((item) => item.sessionId === swapExerciseId);
  const reorderSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const updateExercise = (sessionId: number, update: Partial<SessionExercise>) => {
    setSessionExercises((current) => current.map((item) => item.sessionId === sessionId ? { ...item, ...update } : item));
  };

  const updateSet = (sessionId: number, setId: number, update: Partial<ActiveSet>) => {
    setSessionExercises((current) => current.map((item) => item.sessionId === sessionId
      ? { ...item, strengthSets: item.strengthSets.map((set) => set.id === setId ? { ...set, ...update } : set) }
      : item));
  };

  const addSet = (item: SessionExercise) => {
    const nextId = Math.max(0, ...item.strengthSets.map((set) => set.id)) + 1;
    updateExercise(item.sessionId, { strengthSets: [...item.strengthSets, { id: nextId, weight: '', reps: '', completed: false }] });
  };

  const deleteSet = (item: SessionExercise, setId: number) => {
    if (item.strengthSets.length <= 1) return;
    updateExercise(item.sessionId, { strengthSets: item.strengthSets.filter((set) => set.id !== setId) });
  };

  const addExercise = (exercise: Exercise) => {
    setSessionExercises((current) => {
      const sessionId = Math.max(Date.now(), ...current.map((item) => item.sessionId + 1));
      return [...current, {
        sessionId,
        exercise,
        strengthSets: exercise.category === 'strength' ? [{ id: 1, weight: '', reps: '', completed: false }] : [],
        distance: '',
        timeOrPace: '',
        completed: false,
      }];
    });
    setShowAddExercisePicker(false);
    setSearch('');
    setFinishError('');
  };

  const swapExercise = (replacement: Exercise) => {
    if (!currentSwapExercise) return;
    const isStrength = replacement.category === 'strength';
    updateExercise(currentSwapExercise.sessionId, {
      exercise: replacement,
      strengthSets: isStrength
        ? currentSwapExercise.exercise.category === 'strength' && currentSwapExercise.strengthSets.length > 0
          ? currentSwapExercise.strengthSets
          : [{ id: 1, weight: '', reps: '', completed: false }]
        : [],
      distance: replacement.category === 'cardio' ? currentSwapExercise.distance : '',
      timeOrPace: replacement.category === 'cardio' ? currentSwapExercise.timeOrPace : '',
      completed: false,
    });
    setSwapExerciseId(null);
    setSearch('');
  };

  const openReorder = () => {
    setReorderDraft([...sessionExercises]);
    setOpenMenuId(null);
    setShowReorderSheet(true);
  };

  const closeReorder = () => {
    setShowReorderSheet(false);
    setReorderDraft([]);
  };

  const saveReorder = () => {
    setSessionExercises(reorderDraft);
    closeReorder();
  };

  const moveReorderItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= reorderDraft.length) return;
    setReorderDraft((current) => arrayMove(current, fromIndex, toIndex));
  };

  const finishWorkout = () => {
    const completedAt = Date.now();
    const log: WorkoutLog = {
      id: String(completedAt),
      date: new Date(startedAt).toISOString(),
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      durationSeconds: Math.floor((completedAt - startedAt) / 1000),
      sessionType: template ? 'template' : 'freeform',
      sessionName: template?.name ?? 'Freeform',
      ...(template ? { templateId: template.id } : {}),
      entries: sessionExercises.map((item) => ({
        exerciseId: item.exercise.id,
        completed: item.exercise.category === 'strength' ? item.strengthSets.some((set) => set.completed) : item.completed,
        ...(item.exercise.category === 'strength'
          ? {
              setsCompleted: item.strengthSets.filter((set) => set.completed).map((set) => ({ reps: numericValue(set.reps), weight: numericValue(set.weight) })),
              setsLogged: item.strengthSets.map((set) => ({
                completed: set.completed,
                ...(optionalNumericValue(set.reps) !== undefined ? { reps: optionalNumericValue(set.reps) } : {}),
                ...(optionalNumericValue(set.weight) !== undefined ? { weight: optionalNumericValue(set.weight) } : {}),
              })),
            }
          : { distance: numericValue(item.distance), time: timeInSeconds(item.timeOrPace), timeOrPace: item.timeOrPace }),
      })),
    };
    addWorkoutLog(log);
    onFinish();
  };

  const requestFinish = () => {
    if (sessionExercises.length === 0) {
      setFinishError('Add at least one exercise before finishing.');
      return;
    }
    setFinishError('');
    setShowSummary(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.backButton}><Text style={styles.backText}>‹ WEEKLY SPLIT</Text></Pressable>
          <Text style={styles.eyebrow}>ACTIVE WORKOUT</Text>
          <Text style={styles.title}>{template?.name ?? 'Freeform'}</Text>
          <Text style={styles.subtitle}>{sessionExercises.length} EXERCISES · IN PROGRESS</Text>
        </View>

        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {sessionExercises.map((item) => {
            const isStrength = item.exercise.category === 'strength';
            const activity = activityColors[item.exercise.category];
            const targetReps = item.strengthSets[0]?.reps;
            const targetDescription = isStrength
              ? `${item.strengthSets.length} ${item.strengthSets.length === 1 ? 'SET' : 'SETS'}${targetReps ? ` × ${targetReps} REPS` : ''}`
              : [item.distance, item.timeOrPace].filter(Boolean).join(' · ') || 'CARDIO TARGET';

            return (
              <View key={item.sessionId} style={[styles.exerciseCard, item.completed && styles.completedCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.exerciseHeading}>
                    <View style={[styles.typeMark, { backgroundColor: activity.muted }]}><Text style={[styles.typeMarkText, { color: activity.accent }]}>{isStrength ? '+' : '>'}</Text></View>
                    <View style={styles.exerciseHeadingText}>
                      <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                      <Text style={[styles.exerciseCategory, { color: activity.accent }]}>{item.exercise.category.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Actions for ${item.exercise.name}`} accessibilityState={{ expanded: openMenuId === item.sessionId }} onPress={() => setOpenMenuId(openMenuId === item.sessionId ? null : item.sessionId)} style={styles.cardMenuButton}>
                    <Text style={styles.cardMenuButtonText}>...</Text>
                  </Pressable>
                </View>
                {openMenuId === item.sessionId && <View style={styles.cardMenu}>
                  <Pressable accessibilityRole="button" onPress={() => { setOpenMenuId(null); setSearch(''); setSwapExerciseId(item.sessionId); }} style={styles.cardMenuItem}><Text style={styles.cardMenuItemText}>Swap</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={openReorder} style={styles.cardMenuItem}><Text style={styles.cardMenuItemText}>Reorder</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => { setSessionExercises((current) => current.filter((exercise) => exercise.sessionId !== item.sessionId)); setOpenMenuId(null); }} style={styles.cardMenuItem}><Text style={styles.removeMenuText}>Remove</Text></Pressable>
                </View>}
                <Text style={[styles.targetText, { color: activity.accent }]}>{targetDescription}</Text>

                {isStrength ? <>
                  <View style={styles.setHeader}><Text style={[styles.columnLabel, styles.setColumn]}>SET</Text><Text style={[styles.columnLabel, styles.flexColumn]}>LBS</Text><Text style={[styles.columnLabel, styles.flexColumn]}>REPS</Text><Text style={[styles.columnLabel, styles.checkColumn]}>✓</Text><View style={styles.removeColumn} /></View>
                  {item.strengthSets.map((set, index) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={[styles.setIndex, styles.setColumn]}>{index + 1}</Text>
                      <TextInput accessibilityLabel={`${item.exercise.name}, set ${index + 1}, pounds`} keyboardType="decimal-pad" onChangeText={(weight) => updateSet(item.sessionId, set.id, { weight })} placeholder="--" placeholderTextColor={colors.textDisabled} style={[styles.numberInput, styles.flexColumn]} value={set.weight} />
                      <TextInput accessibilityLabel={`${item.exercise.name}, set ${index + 1}, reps`} keyboardType="number-pad" onChangeText={(reps) => updateSet(item.sessionId, set.id, { reps })} placeholder="--" placeholderTextColor={colors.textDisabled} style={[styles.numberInput, styles.flexColumn]} value={set.reps} />
                      <Pressable accessibilityRole="checkbox" accessibilityLabel={`Mark ${item.exercise.name} set ${index + 1} complete`} accessibilityState={{ checked: set.completed }} onPress={() => updateSet(item.sessionId, set.id, { completed: !set.completed })} style={[styles.checkButton, set.completed && styles.checkButtonDone]}>
                        <Text style={[styles.checkGlyph, set.completed && styles.checkGlyphDone]}>{set.completed ? '✓' : ''}</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.exercise.name} set ${index + 1}`} accessibilityState={{ disabled: item.strengthSets.length <= 1 }} disabled={item.strengthSets.length <= 1} onPress={() => deleteSet(item, set.id)} style={[styles.deleteSetButton, item.strengthSets.length <= 1 && styles.deleteSetButtonDisabled]}>
                        <Text style={[styles.deleteSetText, item.strengthSets.length <= 1 && styles.deleteSetTextDisabled]}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable accessibilityRole="button" onPress={() => addSet(item)} style={styles.addSetButton}><Text style={[styles.addSetText, { color: activity.accent }]}>+ ADD SET</Text></Pressable>
                </> : <>
                  <View style={styles.cardioFields}>
                    <View style={styles.cardioField}><Text style={styles.columnLabel}>DISTANCE</Text><TextInput accessibilityLabel={`${item.exercise.name} actual distance`} keyboardType="decimal-pad" onChangeText={(distance) => updateExercise(item.sessionId, { distance })} placeholder="e.g. 3 mi" placeholderTextColor={colors.textDisabled} style={styles.cardioInput} value={item.distance} /></View>
                    <View style={styles.cardioField}><Text style={styles.columnLabel}>TIME OR PACE</Text><TextInput accessibilityLabel={`${item.exercise.name} actual time or pace`} onChangeText={(timeOrPace) => updateExercise(item.sessionId, { timeOrPace })} placeholder="e.g. 30:00 or 9:30 / mi" placeholderTextColor={colors.textDisabled} style={styles.cardioInput} value={item.timeOrPace} /></View>
                  </View>
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.completed }} onPress={() => updateExercise(item.sessionId, { completed: !item.completed })} style={[styles.completeCardioButton, item.completed && styles.completeCardioButtonDone]}>
                    <Text style={[styles.completeCardioText, item.completed && styles.completeCardioTextDone]}>{item.completed ? '✓ COMPLETED' : 'MARK CARDIO COMPLETE'}</Text>
                  </Pressable>
                </>}
              </View>
            );
          })}
          <Pressable accessibilityRole="button" onPress={() => { setSearch(''); setShowAddExercisePicker(true); }} style={styles.addExerciseButton}>
            <Text style={styles.addExerciseText}>+ ADD EXERCISE</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.finishBar}>
          {finishError !== '' && <Text accessibilityRole="alert" style={styles.finishError}>{finishError}</Text>}
          <Pressable accessibilityRole="button" onPress={requestFinish} style={({ pressed }) => [styles.finishButton, pressed && styles.buttonPressed]}>
            <Text style={styles.finishButtonText}>FINISH WORKOUT</Text>
          </Pressable>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={swapExerciseId !== null || showAddExercisePicker} onRequestClose={() => { setSwapExerciseId(null); setShowAddExercisePicker(false); }}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.swapDialog}>
            <Text style={styles.dialogTitle}>{showAddExercisePicker ? 'Add exercise' : 'Swap exercise'}</Text>
            <TextInput accessibilityLabel="Search replacement exercises" autoCapitalize="words" onChangeText={setSearch} placeholder="Search exercises" placeholderTextColor={colors.textDisabled} style={styles.searchInput} value={search} />
            <ScrollView style={styles.swapResults} keyboardShouldPersistTaps="handled">
              {matches.filter((exercise) => exercise.id !== currentSwapExercise?.exercise.id).slice(0, 8).map((exercise) => {
                const activity = activityColors[exercise.category];
                return <Pressable key={exercise.id} accessibilityRole="button" onPress={() => showAddExercisePicker ? addExercise(exercise) : swapExercise(exercise)} style={styles.swapResultRow}><View style={[styles.resultMark, { backgroundColor: activity.accent }]} /><View style={styles.swapResultText}><Text style={styles.swapResultName}>{exercise.name}</Text><Text style={[styles.exerciseCategory, { color: activity.accent }]}>{exercise.category.toUpperCase()}</Text></View><Text style={styles.chevron}>›</Text></Pressable>;
              })}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => { setSwapExerciseId(null); setShowAddExercisePicker(false); setSearch(''); }} style={styles.cancelButton}><Text style={styles.cancelText}>CANCEL</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={showReorderSheet} onRequestClose={closeReorder}>
        <View style={styles.reorderBackdrop}>
          <View accessibilityViewIsModal style={styles.reorderSheet}>
            <View style={styles.reorderHeader}>
              <Pressable accessibilityRole="button" onPress={closeReorder} style={styles.reorderHeaderAction}><Text style={styles.reorderCancelText}>Cancel</Text></Pressable>
              <Text style={styles.reorderTitle}>Reorder Exercises</Text>
              <Pressable accessibilityRole="button" onPress={saveReorder} style={styles.reorderHeaderAction}><Text style={styles.reorderSaveText}>Save</Text></Pressable>
            </View>
            <Text style={styles.reorderNote}>Changes apply to this workout session only.</Text>
            <ScrollView style={styles.reorderList} keyboardShouldPersistTaps="handled">
              {Platform.OS === 'web' ? (
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={({ active, over }) => {
                    if (!over || active.id === over.id) return;
                    const fromIndex = reorderDraft.findIndex((item) => item.sessionId === active.id);
                    const toIndex = reorderDraft.findIndex((item) => item.sessionId === over.id);
                    if (fromIndex >= 0 && toIndex >= 0) moveReorderItem(fromIndex, toIndex);
                  }}
                  sensors={reorderSensors}
                >
                  <SortableContext items={reorderDraft.map((item) => item.sessionId)} strategy={verticalListSortingStrategy}>
                    {reorderDraft.map((item) => <SortableExerciseRow key={item.sessionId} item={item} />)}
                  </SortableContext>
                </DndContext>
              ) : reorderDraft.map((item, index) => (
                <View key={item.sessionId} style={styles.reorderRow}>
                  <Text style={styles.reorderExerciseName}>{item.exercise.name}</Text>
                  <View style={styles.nativeReorderActions}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Move ${item.exercise.name} up`} disabled={index === 0} onPress={() => moveReorderItem(index, index - 1)} style={styles.nativeMoveButton}><Text style={styles.nativeMoveText}>↑</Text></Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Move ${item.exercise.name} down`} disabled={index === reorderDraft.length - 1} onPress={() => moveReorderItem(index, index + 1)} style={styles.nativeMoveButton}><Text style={styles.nativeMoveText}>↓</Text></Pressable>
                    <Text style={styles.dragHandleText}>≡</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.sheetBottomSpace} />
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={showSummary} onRequestClose={() => setShowSummary(false)}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.summaryDialog}>
            <View style={styles.streakMark}><Text style={styles.streakMarkText}>✓</Text></View>
            <Text style={styles.summaryEyebrow}>SESSION SAVED</Text>
            <Text style={styles.dialogTitle}>Workout summary</Text>
            <Text style={styles.summaryTemplate}>{template?.name ?? 'Freeform'}</Text>
            <View style={styles.summaryStats}>
              <SummaryStat label="DURATION" value={formatDuration(elapsedSeconds)} />
              <SummaryStat label="EXERCISES" value={`${completedExercises}/${sessionExercises.length}`} />
              <SummaryStat label="SETS DONE" value={`${completedSets}`} />
            </View>
            <Text style={styles.summaryNote}>You can finish with exercises or sets still incomplete.</Text>
            <Pressable accessibilityRole="button" onPress={finishWorkout} style={styles.confirmFinishButton}><Text style={styles.confirmFinishText}>SAVE WORKOUT</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => setShowSummary(false)} style={styles.keepWorkingButton}><Text style={styles.keepWorkingText}>KEEP WORKING OUT</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryStat}><Text style={styles.summaryStatValue}>{value}</Text><Text style={styles.summaryStatLabel}>{label}</Text></View>;
}

function numericValue(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumericValue(value: string) {
  if (value.trim() === '') return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function timeInSeconds(value: string) {
  const time = value.match(/^(\d+):(\d{1,2})/);
  return time ? Number(time[1]) * 60 + Number(time[2]) : numericValue(value);
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, screen: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backButton: { alignSelf: 'flex-start', minHeight: spacing.lg, justifyContent: 'center' }, backText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 },
  eyebrow: { marginTop: spacing.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.4 },
  title: { marginTop: spacing.xs, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size['2xl'], fontWeight: typography.weight.bold },
  subtitle: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  reorderRow: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceRaised },
  reorderExerciseName: { flex: 1, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  dragHandle: { width: spacing['2xl'], minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  dragHandleText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  addExerciseButton: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  addExerciseText: { color: colors.strength, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  exerciseCard: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface }, completedCard: { borderWidth: 1, borderColor: colors.success },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, exerciseHeading: { flex: 1, flexDirection: 'row', alignItems: 'center' }, typeMark: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderRadius: radius.full }, typeMarkText: { fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.lg, fontWeight: typography.weight.bold }, exerciseHeadingText: { flex: 1 }, exerciseName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.base, fontWeight: typography.weight.semibold }, exerciseCategory: { marginTop: spacing.xs, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  cardMenuButton: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceRaised }, cardMenuButtonText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.base, fontWeight: typography.weight.bold }, cardMenu: { marginTop: spacing.sm, overflow: 'hidden', borderRadius: radius.sm, backgroundColor: colors.surfaceRaised }, cardMenuItem: { minHeight: spacing.xl, justifyContent: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }, cardMenuItemText: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, removeMenuText: { color: colors.error, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, targetText: { marginTop: spacing.md, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }, columnLabel: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.7 }, setColumn: { width: spacing.xl, textAlign: 'center' }, flexColumn: { flex: 1, minWidth: 0 }, checkColumn: { width: spacing.xl, textAlign: 'center' }, removeColumn: { width: spacing.lg }, setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }, setIndex: { color: colors.textSecondary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.base, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] }, numberInput: { minHeight: spacing.xl, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.base, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] }, checkButton: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised }, checkButtonDone: { borderColor: colors.success, backgroundColor: colors.success }, checkGlyph: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.base, fontWeight: typography.weight.bold }, checkGlyphDone: { color: colors.background }, deleteSetButton: { width: spacing.lg, height: spacing.xl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm }, deleteSetButtonDisabled: { opacity: 0.35 }, deleteSetText: { color: colors.error, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xl, fontWeight: typography.weight.regular }, deleteSetTextDisabled: { color: colors.textDisabled },
  addSetButton: { alignSelf: 'flex-start', minHeight: spacing.xl, justifyContent: 'center', marginTop: spacing.xs }, addSetText: { fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, cardioFields: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, cardioField: { flex: 1, gap: spacing.xs }, cardioInput: { minHeight: spacing.xl, minWidth: 0, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, completeCardioButton: { minHeight: spacing.xl, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised }, completeCardioButtonDone: { borderColor: colors.success, backgroundColor: colors.success }, completeCardioText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, completeCardioTextDone: { color: colors.background },
  reorderBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.background }, reorderSheet: { maxHeight: '85%', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: colors.surface }, reorderHeader: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, reorderHeaderAction: { width: spacing['2xl'], minHeight: spacing.xl, justifyContent: 'center' }, reorderCancelText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, reorderTitle: { flex: 1, textAlign: 'center', color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.base, fontWeight: typography.weight.semibold }, reorderSaveText: { textAlign: 'right', color: colors.strength, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold }, reorderNote: { marginTop: spacing.xs, marginBottom: spacing.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.sm, fontStyle: 'italic', fontWeight: typography.weight.regular }, reorderList: { flexGrow: 0 }, nativeReorderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, nativeMoveButton: { width: spacing.lg, height: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surface }, nativeMoveText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold }, sheetBottomSpace: { height: spacing.md },
  finishBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }, finishError: { marginBottom: spacing.sm, color: colors.warning, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, finishButton: { minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.strength }, finishButtonText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.base, fontWeight: typography.weight.bold, letterSpacing: 1 }, buttonPressed: { opacity: 0.78 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background }, swapDialog: { width: '100%', maxWidth: 460, maxHeight: '85%', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }, dialogTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xl, fontWeight: typography.weight.bold }, searchInput: { minHeight: spacing['2xl'], marginTop: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium }, swapResults: { marginTop: spacing.sm }, swapResultRow: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, resultMark: { width: spacing.sm, height: spacing.sm, marginRight: spacing.sm, borderRadius: radius.full }, swapResultText: { flex: 1 }, swapResultName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium }, chevron: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xl }, cancelButton: { minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surface }, cancelText: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 1 },
  summaryDialog: { width: '100%', maxWidth: 420, alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }, streakMark: { width: spacing['2xl'], height: spacing['2xl'], alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.streak }, streakMarkText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xl, fontWeight: typography.weight.bold }, summaryEyebrow: { marginTop: spacing.md, color: colors.streak, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.2 }, summaryTemplate: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium }, summaryStats: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }, summaryStat: { flex: 1, alignItems: 'center' }, summaryStatValue: { color: colors.textPrimary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.xl, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] }, summaryStatLabel: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.4 }, summaryNote: { marginTop: spacing.md, textAlign: 'center', color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.sm, fontWeight: typography.weight.regular }, confirmFinishButton: { width: '100%', minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, borderRadius: radius.sm, backgroundColor: colors.streak }, confirmFinishText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, keepWorkingButton: { minHeight: spacing.xl, justifyContent: 'center', marginTop: spacing.xs }, keepWorkingText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
});