import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import exercises from '../data/exercises.json';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing, typography } from '../theme';
import { generateDemoProgressLogs } from '../utils/demoProgressData';
import { classifyWorkoutDay } from '../utils/workoutDayStatus';
import { weekdays, type Weekday, type WorkoutLog } from '../types/templates';

type ProgressScreenProps = { onBack: () => void };
type CardioSession = { date: Date; exerciseName: string; distance: number };
type WeeklyMileage = { start: Date; label: string; miles: number; sessions: CardioSession[] };

const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const chartPlotHeight = spacing['2xl'] * 2 + spacing.md;
const chartTop = spacing.md;
const chartBottom = chartPlotHeight - spacing.md;
// Evidence-based hypertrophy guideline, not a project-specific choice
const setsGuidelineMin = 10;
const setsGuidelineMax = 20;

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mondayFor(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function weekdayFor(date: Date): Weekday {
  return weekdays[(date.getDay() + 6) % 7];
}

function loggedDate(log: WorkoutLog) {
  return localDateKey(new Date(log.startedAt || log.date));
}

function setsForEntry(log: WorkoutLog, exerciseId: string) {
  const entry = log.entries.find((item) => item.exerciseId === exerciseId);
  if (!entry) return 0;

  if (entry.setsCompleted) return entry.setsCompleted.length;
  return entry.setsLogged?.filter((set) => set.completed).length ?? 0;
}

function formatSets(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatWeek(date: Date) {
  const monthInitial = date.toLocaleDateString(undefined, { month: 'short' }).charAt(0).toUpperCase();
  return `${monthInitial}${date.getDate()}`;
}

function chartPoint(index: number, miles: number, maxMiles: number, width: number) {
  const x = (index + 0.5) * width / 8;
  const y = chartBottom - (miles / maxMiles) * (chartBottom - chartTop);
  return { x, y };
}

export default function ProgressScreen({ onBack }: ProgressScreenProps) {
  const { templates, weeklySplit, workoutLogs, replaceDemoWorkoutLogs } = useAppState();
  const [demoSeedCount, setDemoSeedCount] = useState<number | null>(null);
  const hasDemoData = workoutLogs.some((log) => log.source === 'demo');
  const [chartPlotWidth, setChartPlotWidth] = useState(0);
  const [selectedMileageIndex, setSelectedMileageIndex] = useState<number | null>(null);
  const today = new Date();
  const todayKey = localDateKey(today);
  const currentMonday = mondayFor(today);
  const firstMonday = new Date(currentMonday);
  firstMonday.setDate(firstMonday.getDate() - 7 * 7);
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const logsByDate = new Map<string, WorkoutLog[]>();

  for (const log of workoutLogs) {
    const key = loggedDate(log);
    logsByDate.set(key, [...(logsByDate.get(key) ?? []), log]);
  }

  const setsByMuscle = new Map<string, number>();
  const weeklyMileage: WeeklyMileage[] = [];

  for (let weekIndex = 0; weekIndex < 8; weekIndex += 1) {
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + weekIndex * 7);
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(weekStart.getDate() + 7);
    let miles = 0;
    const sessions: CardioSession[] = [];

    for (const log of workoutLogs) {
      const dateKey = loggedDate(log);
      if (dateKey < localDateKey(weekStart) || dateKey >= localDateKey(nextWeekStart) || dateKey > todayKey) continue;

      for (const entry of log.entries) {
        const exercise = exerciseById.get(entry.exerciseId);
        if (!exercise) continue;

        if (exercise.category === 'cardio') {
          const distance = entry.distance ?? 0;
          miles += distance;
          if (distance > 0) sessions.push({ date: new Date(log.startedAt || log.date), exerciseName: exercise.name, distance });
        } else {
          const sets = setsForEntry(log, entry.exerciseId);
          for (const group of exercise.muscleGroups) {
            setsByMuscle.set(group, (setsByMuscle.get(group) ?? 0) + sets);
          }
        }
      }
    }

    weeklyMileage.push({ start: weekStart, label: formatWeek(weekStart), miles, sessions });
  }

  const muscleSets = [...setsByMuscle.entries()]
    .map(([group, totalSets]) => ({ group, avgSets: totalSets / 8 }))
    .filter((item) => item.avgSets > 0)
    .sort((a, b) => b.avgSets - a.avgSets)
    .slice(0, 8);
  const setsScaleMax = Math.max(setsGuidelineMax, ...muscleSets.map((item) => item.avgSets));
  const maxMiles = Math.max(1, ...weeklyMileage.map((item) => item.miles));
  const yAxisMax = Math.max(10, Math.ceil(maxMiles / 10) * 10);
  const yAxisTicks = Array.from({ length: yAxisMax / 10 + 1 }, (_, index) => yAxisMax - index * 10);
  const points = weeklyMileage.map((item, index) => chartPoint(index, item.miles, yAxisMax, chartPlotWidth));
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ');
  const selectedMileageWeek = selectedMileageIndex === null ? undefined : weeklyMileage[selectedMileageIndex];
  const mileageY = (miles: number) => chartBottom - (miles / yAxisMax) * (chartBottom - chartTop);

  const recentDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (13 - index));
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
      logs: logsByDate.get(dateKey) ?? [],
    });
    return { dateKey, status: classification.status };
  });
  const consistencyDays = recentDays.filter((day) => day.status === 'logged').length;
  let currentStreak = 0;
  for (const day of [...recentDays].reverse()) {
    if (day.status === 'skipped') break;
    if (day.status === 'logged') currentStreak += 1;
  }

  const seedDemoData = () => {
    const demoLogs = generateDemoProgressLogs(templates, weeklySplit, today, workoutLogs);
    replaceDemoWorkoutLogs(demoLogs);
    setDemoSeedCount(demoLogs.length);
  };

  if (workoutLogs.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyScreen}>
          <View style={styles.emptyContent}>
            <Text style={styles.eyebrow}>PROGRESS</Text>
            <Text style={styles.title}>Your training, over time</Text>
            <Text style={styles.emptyMessage}>Log your first workout to see your progress here.</Text>
            <Pressable accessibilityRole="button" onPress={onBack} style={styles.emptyAction}><Text style={styles.emptyActionText}>GO TO WEEKLY SPLIT</Text></Pressable>
          </View>
          <DevSeedControl onSeed={seedDemoData} hasDemoData={hasDemoData || demoSeedCount !== null} seededCount={demoSeedCount} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.screenHeader}><Text style={styles.eyebrow}>TRAINING TRENDS</Text><Text style={styles.title}>Progress</Text></View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Weekly sets per muscle group</Text><Text style={styles.windowLabel}>LAST 8 WEEKS</Text></View>
          {muscleSets.length === 0 ? <Text style={styles.sectionEmpty}>No strength sets recorded in this window.</Text> : <View style={styles.volumeChart}>
            {muscleSets.map((item) => <View key={item.group} style={styles.volumeRow}>
              <Text style={styles.muscleLabel}>{capitalize(item.group)}</Text>
              <View style={styles.volumeTrack}>
                <View style={[styles.volumeGuidelineBand, {
                  left: `${(setsGuidelineMin / setsScaleMax) * 100}%`,
                  width: `${((setsGuidelineMax - setsGuidelineMin) / setsScaleMax) * 100}%`,
                }]} />
                <View style={[styles.volumeFill, {
                  width: `${(item.avgSets / setsScaleMax) * 100}%`,
                  opacity: item.avgSets < setsGuidelineMin ? 0.5 : 1,
                }]} />
              </View>
              <Text style={styles.volumeValue}>{formatSets(item.avgSets)}</Text>
            </View>)}
            <Text style={styles.chartFootnote}>AVG SETS / WEEK · Typical effective range: {setsGuidelineMin}-{setsGuidelineMax} sets/week</Text>
          </View>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Weekly running mileage</Text><Text style={styles.windowLabel}>LAST 8 WEEKS</Text></View>
          <View style={styles.chartAxisLabelRow}><Text style={styles.chartAxisLabel}>MILES / WEEK</Text></View>
          <View style={styles.chartPlotRow}>
            <View style={styles.chartYAxis}>
              {yAxisTicks.map((tick) => <Text key={tick} style={[styles.chartYAxisLabel, { top: mileageY(tick) - typography.size.xs / 2 }]}>{tick}</Text>)}
            </View>
            <View onLayout={(event) => setChartPlotWidth(event.nativeEvent.layout.width)} style={styles.chartPlot}>
              <Pressable accessibilityRole="button" accessibilityLabel="Dismiss mileage detail" onPress={() => setSelectedMileageIndex(null)} style={styles.chartPlotDismiss} />
              {chartPlotWidth > 0 && <Svg style={{ pointerEvents: 'none' }} width="100%" height="100%" viewBox={`0 0 ${chartPlotWidth} ${chartPlotHeight}`}>
                {yAxisTicks.map((tick) => <Line key={tick} x1={0} y1={mileageY(tick)} x2={chartPlotWidth} y2={mileageY(tick)} stroke={colors.border} strokeWidth={1} />)}
                <Polyline points={pointString} fill="none" stroke={colors.cardio} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
                {points.map((point, index) => <Circle key={index} cx={point.x} cy={point.y} r={spacing.xs} fill={colors.cardio} />)}
              </Svg>}
              {chartPlotWidth > 0 && points.map((point, index) => <Pressable
                key={weeklyMileage[index].label}
                accessibilityRole="button"
                accessibilityLabel={`${weeklyMileage[index].label} week: ${formatMileage(weeklyMileage[index].miles)} miles`}
                accessibilityState={{ selected: selectedMileageIndex === index }}
                onPress={() => setSelectedMileageIndex((current) => current === index ? null : index)}
                style={[styles.chartPointTarget, { left: point.x - (spacing.lg + spacing.sm) / 2, top: point.y - (spacing.lg + spacing.sm) / 2 }]}
              />)}
            </View>
          </View>
          <View style={styles.chartLabels}>
            {weeklyMileage.map((week) => <View key={week.label} style={styles.chartTick}>
              <Text style={styles.chartWeekLabel}>{week.label}</Text>
            </View>)}
          </View>
          {selectedMileageWeek && <View style={styles.mileageDetailSheet}>
            <View style={styles.mileageDetailHeader}>
              <View><Text style={styles.mileageDetailTitle}>Week of {selectedMileageWeek.label}</Text><Text style={styles.mileageDetailTotal}>{formatMileage(selectedMileageWeek.miles)} MILES</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close mileage details" onPress={() => setSelectedMileageIndex(null)} style={styles.sheetCloseButton}><Text style={styles.sheetCloseText}>×</Text></Pressable>
            </View>
            <View style={styles.mileageSessionList}>
              {selectedMileageWeek.sessions.length ? selectedMileageWeek.sessions.map((session, index) => <View key={`${session.date.toISOString()}-${session.exerciseName}-${index}`} style={styles.mileageSessionRow}>
                <View style={styles.mileageSessionText}><Text style={styles.mileageSessionName}>{session.exerciseName}</Text><Text style={styles.mileageSessionDate}>{session.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text></View>
                <Text style={styles.mileageSessionDistance}>{formatMileage(session.distance)} mi</Text>
              </View>) : <Text style={styles.mileageNoSessions}>No cardio sessions logged this week.</Text>}
            </View>
          </View>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Streak & consistency</Text><Text style={styles.windowLabel}>LAST 14 DAYS</Text></View>
          <View style={styles.consistencyPanel}>
            <View style={styles.streakSummary}>
              <Text style={styles.streakValue}>{currentStreak}</Text>
              <View><Text style={styles.streakUnit}>{currentStreak === 1 ? 'TRAINING DAY' : 'TRAINING DAYS'}</Text><Text style={styles.streakCaption}>since the last skipped planned day</Text></View>
            </View>
            <View style={styles.consistencyHeader}><Text style={styles.consistencyTitle}>Training days</Text><Text style={styles.consistencyValue}>{consistencyDays} / 14</Text></View>
            <View style={styles.consistencyTrack}><View style={[styles.consistencyFill, { width: `${(consistencyDays / 14) * 100}%` }]} /></View>
          </View>
        </View>
        <DevSeedControl onSeed={seedDemoData} hasDemoData={hasDemoData || demoSeedCount !== null} seededCount={demoSeedCount} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DevSeedControl({ onSeed, hasDemoData, seededCount }: { onSeed: () => void; hasDemoData: boolean; seededCount: number | null }) {
  return (
    <View style={styles.devSeedArea}>
      <Pressable accessibilityRole="button" accessibilityLabel="DEV ONLY: Seed or replace demo data" onPress={onSeed} style={styles.devSeedButton}>
        <Text style={styles.devSeedText}>{hasDemoData ? 'DEV ONLY · REPLACE DEMO DATA' : 'DEV ONLY · SEED DEMO DATA'}</Text>
      </Pressable>
      <Text style={styles.devSeedNote}>{seededCount === null ? 'Temporary fixture utility — remove or gate before submission.' : `Replaced demo logs with ${seededCount} sample sessions.`}</Text>
    </View>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMileage(miles: number) {
  return Number.isInteger(miles) ? String(miles) : miles.toFixed(1);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  emptyScreen: { flex: 1, padding: spacing.lg },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.4 },
  title: { marginTop: spacing.xs, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size['3xl'], fontWeight: typography.weight.bold },
  emptyMessage: { maxWidth: spacing['2xl'] * 5, marginTop: spacing.md, textAlign: 'center', color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.base, fontWeight: typography.weight.regular },
  emptyAction: { minHeight: spacing['2xl'], justifyContent: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg, borderRadius: radius.sm, backgroundColor: colors.strength },
  emptyActionText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  screenHeader: { marginTop: spacing.sm, marginBottom: spacing.xl },
  section: { marginTop: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  sectionTitle: { flex: 1, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  windowLabel: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.6 },
  sectionEmpty: { marginTop: spacing.md, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.sm, fontWeight: typography.weight.regular },
  volumeChart: { marginTop: spacing.md, gap: spacing.sm },
  volumeRow: { minHeight: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  muscleLabel: { width: spacing['2xl'] + spacing.lg, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  volumeTrack: { position: 'relative', flex: 1, height: spacing.sm, overflow: 'hidden', borderRadius: radius.full, backgroundColor: colors.surfaceRaised },
  volumeGuidelineBand: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.strengthMuted },
  volumeFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.strength },
  volumeValue: { width: spacing['2xl'], textAlign: 'right', color: colors.textPrimary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.xs, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] },
  chartAxisLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.xs },
  chartAxisLabel: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  chartScaleLabel: { color: colors.textSecondary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.xs, fontWeight: typography.weight.medium, fontVariant: ['tabular-nums'] },
  chartPlotRow: { flexDirection: 'row', alignItems: 'stretch' },
  chartYAxis: { position: 'relative', width: spacing.lg, height: chartPlotHeight },
  chartYAxisLabel: { position: 'absolute', right: spacing.xs, width: spacing.lg, textAlign: 'right', color: colors.textSecondary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.xs, fontWeight: typography.weight.medium, fontVariant: ['tabular-nums'] },
  chartPlot: { position: 'relative', flex: 1, height: chartPlotHeight, minWidth: 0 },
  chartPlotDismiss: { ...StyleSheet.absoluteFill, zIndex: 0 },
  chartPointTarget: { position: 'absolute', zIndex: 2, width: spacing.lg + spacing.sm, height: spacing.lg + spacing.sm, borderRadius: radius.full },
  chartLabels: { flexDirection: 'row', marginLeft: spacing.lg },
  chartTick: { flex: 1, alignItems: 'center', minWidth: 0 },
  chartValue: { color: colors.textPrimary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.xs, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] },
  chartWeekLabel: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  mileageDetailSheet: { marginTop: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface },
  mileageDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  mileageDetailTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  mileageDetailTotal: { marginTop: spacing.xs, color: colors.cardio, fontFamily: typography.fontFamily.stat, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  sheetCloseButton: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceRaised },
  sheetCloseText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xl },
  mileageSessionList: { flexGrow: 0 },
  mileageSessionRow: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  mileageSessionText: { flex: 1 },
  mileageSessionName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  mileageSessionDate: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xs, fontWeight: typography.weight.regular },
  mileageSessionDistance: { color: colors.cardio, fontFamily: typography.fontFamily.stat, fontSize: typography.size.base, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] },
  mileageNoSessions: { paddingVertical: spacing.lg, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.sm, fontWeight: typography.weight.regular },
  chartFootnote: { marginTop: spacing.xs, color: colors.textDisabled, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  consistencyPanel: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  streakSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  streakValue: { color: colors.streak, fontFamily: typography.fontFamily.stat, fontSize: typography.size['3xl'], fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] },
  streakUnit: { color: colors.streak, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  streakCaption: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xs, fontWeight: typography.weight.regular },
  consistencyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  consistencyTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  consistencyValue: { color: colors.streak, fontFamily: typography.fontFamily.stat, fontSize: typography.size.sm, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] },
  consistencyTrack: { height: spacing.sm, overflow: 'hidden', marginTop: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surfaceRaised },
  consistencyFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.streak },
  devSeedArea: { alignItems: 'center', marginTop: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  devSeedButton: { minHeight: spacing.xl, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface },
  devSeedText: { color: colors.textDisabled, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.6 },
  devSeedNote: { marginTop: spacing.xs, textAlign: 'center', color: colors.textDisabled, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xs, fontWeight: typography.weight.regular },
});