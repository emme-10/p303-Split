import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

type WorkoutType = 'strength' | 'cardio' | 'rest';

type WeekDay = {
  day: string;
  date: string;
  template: string | null;
  type: WorkoutType;
};

const week: WeekDay[] = [
  { day: 'MON', date: '26', template: 'Back & Bicep', type: 'strength' },
  { day: 'TUE', date: '27', template: 'Easy Run', type: 'cardio' },
  { day: 'WED', date: '28', template: null, type: 'rest' },
  { day: 'THU', date: '29', template: 'Push Day', type: 'strength' },
  { day: 'FRI', date: '30', template: null, type: 'rest' },
  { day: 'SAT', date: '31', template: 'Long Run', type: 'cardio' },
  { day: 'SUN', date: '01', template: null, type: 'rest' },
];

const workoutStyles: Record<WorkoutType, { accent: string; muted: string; icon: string }> = {
  strength: { accent: colors.strength, muted: colors.strengthMuted, icon: '+' },
  cardio: { accent: colors.cardio, muted: colors.cardioMuted, icon: '>' },
  rest: { accent: colors.rest, muted: colors.restMuted, icon: '-' },
};

export default function WeeklySplitScreen() {
  const handleDayPress = (day: WeekDay) => {
    console.log(`Assign a template to ${day.day}:`, day.template ?? 'Rest');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>WEEKLY SPLIT</Text>
            <Text style={styles.title}>Your week</Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeLabel}>WEEK</Text>
            <Text style={styles.weekBadgeValue}>35</Text>
          </View>
        </View>
        <Text style={styles.dateRange}>AUG 26 - SEP 01, 2026</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryValue}>4</Text>
          <Text style={styles.summaryLabel}>TRAINING DAYS</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryValue}>3</Text>
          <Text style={styles.summaryLabel}>REST DAYS</Text>
        </View>
        <View style={styles.dayList}>
          {week.map((day) => {
            const workout = workoutStyles[day.type];
            const isRest = day.type === 'rest';
            return (
              <Pressable
                key={day.day}
                accessibilityRole="button"
                accessibilityLabel={`${day.day} ${day.template ?? 'Rest'}`}
                onPress={() => handleDayPress(day)}
                style={({ pressed }) => [styles.dayRow, pressed && styles.dayRowPressed]}
              >
                <View style={styles.dayDate}>
                  <Text style={styles.dayLabel}>{day.day}</Text>
                  <Text style={styles.dateLabel}>{day.date}</Text>
                </View>
                <View style={[styles.typeMark, { backgroundColor: workout.muted }]}>
                  <Text style={[styles.typeIcon, { color: workout.accent }]}>{workout.icon}</Text>
                </View>
                <View style={styles.dayDetails}>
                  <Text style={styles.templateName}>{day.template ?? 'Rest'}</Text>
                  <Text style={[styles.typeLabel, { color: workout.accent }]}>
                    {isRest ? 'RECOVERY' : day.type.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.footerHint}>TAP A DAY TO ASSIGN A TEMPLATE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
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
  weekBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  weekBadgeLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  weekBadgeValue: {
    marginTop: spacing.xs,
    color: colors.strength,
    fontFamily: typography.fontFamily.stat,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  dateRange: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.medium,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.8,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.stat,
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.8,
  },
  summaryDivider: { width: 1, height: spacing.lg, marginHorizontal: spacing.md, backgroundColor: colors.border },
  dayList: { marginTop: spacing.lg, gap: spacing.sm },
  dayRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dayRowPressed: { opacity: 0.72 },
  dayDate: { width: spacing.xl },
  dayLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
  },
  dateLabel: {
    marginTop: spacing.xs,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.stat,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  typeMark: {
    width: spacing.xl,
    height: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  typeIcon: {
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  dayDetails: { flex: 1 },
  templateName: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.ui.semibold,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  typeLabel: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.2,
  },
  chevron: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.ui.regular,
    fontSize: typography.size.xl,
  },
  footerHint: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textDisabled,
    fontFamily: typography.fontFamily.ui.bold,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
});