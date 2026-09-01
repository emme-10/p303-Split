import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

type ActivityType = 'strength' | 'cardio';

export type TemplateDetails = {
  name: string;
  activityType: ActivityType;
  selectedMuscleGroups: string[];
  notes: string;
};

type TemplateDetailsScreenProps = {
  onNext: (details: TemplateDetails) => void;
};

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves'];

const activityStyles: Record<ActivityType, { accent: string; muted: string }> = {
  strength: { accent: colors.strength, muted: colors.strengthMuted },
  cardio: { accent: colors.cardio, muted: colors.cardioMuted },
};

export default function TemplateDetailsScreen({ onNext }: TemplateDetailsScreenProps) {
  const [name, setName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('strength');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const isNameMissing = name.trim().length === 0;

  const toggleMuscleGroup = (muscleGroup: string) => {
    setSelectedMuscleGroups((currentGroups) =>
      currentGroups.includes(muscleGroup)
        ? currentGroups.filter((group) => group !== muscleGroup)
        : [...currentGroups, muscleGroup],
    );
  };

  const handleNext = () => {
    if (isNameMissing) {
      return;
    }

    onNext({ name: name.trim(), activityType, selectedMuscleGroups, notes });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>NEW TEMPLATE</Text>
          <Text style={styles.title}>Template details</Text>
          <Text style={styles.subtitle}>Set the basics before adding exercises.</Text>
        </View>

        <View style={styles.stepIndicator} accessibilityLabel="Step 1 of 2">
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
          <Text style={styles.stepText}>STEP 1 OF 2</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>TEMPLATE NAME</Text>
          <TextInput
            accessibilityLabel="Template name"
            autoCapitalize="words"
            onChangeText={setName}
            placeholder="e.g. Upper Body Power"
            placeholderTextColor={colors.textDisabled}
            style={styles.nameInput}
            value={name}
          />
          {isNameMissing && <Text style={styles.hint}>Add a name to continue.</Text>}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>ACTIVITY TYPE</Text>
          <View style={styles.activityToggle} accessibilityRole="radiogroup">
            {(['strength', 'cardio'] as const).map((type) => {
              const isSelected = activityType === type;
              const activity = activityStyles[type];

              return (
                <Pressable
                  key={type}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={type}
                  onPress={() => setActivityType(type)}
                  style={[
                    styles.activityOption,
                    isSelected && { backgroundColor: activity.muted, borderColor: activity.accent },
                  ]}
                >
                  <View style={[styles.activityMark, { backgroundColor: activity.accent }]} />
                  <Text style={[styles.activityText, isSelected && { color: colors.textPrimary }]}>
                    {type.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>TARGET MUSCLE GROUPS</Text>
          <Text style={styles.fieldDescription}>Select all that apply.</Text>
          <View style={styles.chipList}>
            {muscleGroups.map((muscleGroup) => {
              const isSelected = selectedMuscleGroups.includes(muscleGroup);
              const activity = activityStyles[activityType];

              return (
                <Pressable
                  key={muscleGroup}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => toggleMuscleGroup(muscleGroup)}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: activity.muted, borderColor: activity.accent },
                  ]}
                >
                  <Text style={[styles.chipText, isSelected && { color: activity.accent }]}>{muscleGroup}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>NOTES <Text style={styles.optional}>OPTIONAL</Text></Text>
          <TextInput
            accessibilityLabel="Template notes"
            multiline
            onChangeText={setNotes}
            placeholder="Add a focus, training cue, or plan for this session..."
            placeholderTextColor={colors.textDisabled}
            style={styles.notesInput}
            textAlignVertical="top"
            value={notes}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isNameMissing }}
          disabled={isNameMissing}
          onPress={handleNext}
          style={({ pressed }) => [styles.nextButton, isNameMissing && styles.nextButtonDisabled, pressed && styles.nextButtonPressed]}
        >
          <Text style={[styles.nextButtonText, isNameMissing && styles.nextButtonTextDisabled]}>NEXT</Text>
          <Text style={[styles.nextButtonArrow, isNameMissing && styles.nextButtonTextDisabled]}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  header: { marginTop: spacing.sm },
  eyebrow: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.6,
  },
  title: {
    marginTop: spacing.xs,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.regular,
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
  },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  stepDot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.full, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.strength },
  stepLine: { width: spacing.xl, height: 1, backgroundColor: colors.border },
  stepText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  formSection: { marginTop: spacing.xl },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  optional: { color: colors.textDisabled },
  fieldDescription: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.regular,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  nameInput: {
    minHeight: spacing['2xl'],
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.ui.medium,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  hint: {
    marginTop: spacing.xs,
    color: colors.warning,
    fontFamily: typography.fontFamily.ui.medium,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  activityToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  activityOption: {
    flex: 1,
    minHeight: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  activityMark: { width: spacing.sm, height: spacing.sm, borderRadius: radius.full },
  activityText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.8,
  },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    minHeight: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  chipText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.medium,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  notesInput: {
    minHeight: spacing['2xl'] * 2,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.ui.regular,
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
  },
  nextButton: {
    minHeight: spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    borderRadius: radius.md,
    backgroundColor: colors.strength,
  },
  nextButtonDisabled: { backgroundColor: colors.surfaceRaised },
  nextButtonPressed: { opacity: 0.78 },
  nextButtonText: {
    color: colors.background,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  nextButtonTextDisabled: { color: colors.textDisabled },
  nextButtonArrow: {
    color: colors.background,
    fontFamily: typography.fontFamily.ui.regular,
    fontSize: typography.size.xl,
  },
});