import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import exercises from '../data/exercises.json';
import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing, typography } from '../theme';
import { withOpacity } from '../utils/colors';
import { classifyWorkoutDay, type WorkoutDayStatus } from '../utils/workoutDayStatus';
import { weekdays, type ActivityType, type WorkoutLog, type Weekday } from '../types/templates';

type CalendarDay = {
  date: Date;
  dateKey: string;
  weekday: Weekday;
  inMonth: boolean;
  isToday: boolean;
  status: WorkoutDayStatus;
  logs: WorkoutLog[];
  loggedTypes: ActivityType[];
  plannedTemplateName?: string;
  plannedType?: ActivityType;
};

type CalendarScreenProps = { onBack: () => void; onOpenWeeklySplit: () => void };

const weekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const categoryColors: Record<ActivityType, string> = { strength: colors.strength, cardio: colors.cardio };
const calendarFillAlpha = 0.65;
const todayGlowColor = withAlpha(colors.strength, 0.38);

function withAlpha(hexColor: string, opacity: number) {
  const channels = hexColor.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16)) ?? [0, 0, 0];
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${opacity})`;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthCells(year: number, month: number, todayKey: string, firstDayKey: string, logsByDate: Map<string, WorkoutLog[]>, weeklySplit: Record<Weekday, string | undefined>, templateById: Map<string, { name: string; activityType: ActivityType }>): CalendarDay[] {
  const monthStart = new Date(year, month, 1);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = localDateKey(date);
    const weekday = weekdays[(date.getDay() + 6) % 7];
    const logs = logsByDate.get(dateKey) ?? [];
    const assignment = weeklySplit[weekday];
    const assignedTemplate = assignment && assignment !== 'rest' ? templateById.get(assignment) : undefined;
    const classification = classifyWorkoutDay({
      dateKey,
      todayKey: firstDayKey,
      weekday,
      assignment,
      plannedType: assignedTemplate?.activityType,
      logs,
    });

    return {
      date,
      dateKey,
      weekday,
      inMonth: date.getMonth() === month,
      isToday: dateKey === todayKey,
      status: classification.status,
      logs,
      loggedTypes: classification.loggedTypes,
      plannedTemplateName: assignedTemplate?.name,
      plannedType: assignedTemplate?.activityType,
    };
  });
}

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CalendarScreen({ onBack, onOpenWeeklySplit }: CalendarScreenProps) {
  const { templates, weeklySplit, workoutLogs } = useAppState();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = new Date();
  const todayKey = localDateKey(today);
  const firstDayKey = todayKey;
  const logsByDate = new Map<string, WorkoutLog[]>();
  for (const log of workoutLogs) {
    const dateKey = localDateKey(new Date(log.startedAt || log.date));
    logsByDate.set(dateKey, [...(logsByDate.get(dateKey) ?? []), log]);
  }
  const templateById = new Map(templates.map((template) => [template.id, { name: template.name, activityType: template.activityType }]));
  const splitRecord = weeklySplit as Record<Weekday, string | undefined>;
  const monthDays = getMonthCells(visibleMonth.getFullYear(), visibleMonth.getMonth(), todayKey, firstDayKey, logsByDate, splitRecord, templateById);
  const monthIsEmpty = monthDays.every((day) => !day.inMonth || day.status === 'empty');
  const selectedDay = selectedDate ? monthDays.find((day) => day.dateKey === localDateKey(selectedDate)) : undefined;

  const shiftMonth = (amount: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const renderDayCircle = (day: CalendarDay) => {
    const circleStyles: ViewStyle[] = [styles.dayCircle];
    let numberColor: string = colors.textPrimary;
    let isMixed = false;

    if (day.status === 'logged') {
      if (day.loggedTypes.length > 1) {
        isMixed = true;
        numberColor = colors.textPrimary;
      } else {
        const fill = day.loggedTypes.length === 1 ? categoryColors[day.loggedTypes[0]] : colors.textSecondary;
        circleStyles.push({ backgroundColor: withOpacity(fill, calendarFillAlpha) });
        numberColor = day.loggedTypes[0] === 'cardio' ? colors.background : colors.textPrimary;
      }
    } else if (day.status === 'planned' && day.plannedType) {
      circleStyles.push(styles.plannedCircle, { borderColor: categoryColors[day.plannedType] });
      numberColor = categoryColors[day.plannedType];
    } else if (day.status === 'skipped' && day.plannedType) {
      circleStyles.push(styles.skippedCircle, { borderColor: categoryColors[day.plannedType] });
      numberColor = colors.textSecondary;
    } else if (day.status === 'rest') {
      circleStyles.push({ backgroundColor: withOpacity(colors.rest, calendarFillAlpha) });
      numberColor = colors.textPrimary;
    } else {
      circleStyles.push(styles.emptyCircle);
      numberColor = colors.textSecondary;
    }

    if (day.isToday) circleStyles.push(styles.todayGlow);

    return (
      <View style={circleStyles}>
        {isMixed && <View style={styles.splitCircle}>
          <View style={[styles.splitHalf, { backgroundColor: withOpacity(colors.strength, calendarFillAlpha) }]} />
          <View style={[styles.splitHalf, { backgroundColor: withOpacity(colors.cardio, calendarFillAlpha) }]} />
        </View>}
        <Text style={[styles.dayNumber, { color: numberColor }, isMixed && styles.mixedNumber]}>{day.date.getDate()}</Text>
      </View>
    );
  };

  const statusLabel = (day: CalendarDay) => {
    if (day.status === 'logged') return 'Logged';
    if (day.status === 'planned') return 'Planned';
    if (day.status === 'skipped') return 'Skipped';
    if (day.status === 'rest') return 'Rest';
    return 'No plan';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹ WEEKLY SPLIT</Text></Pressable>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
        </View>
        <View style={styles.monthRow}>
          <Text style={styles.monthTitle}>{visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
          <View style={styles.monthControls}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shiftMonth(-1)} style={styles.monthArrow}><Text style={styles.monthArrowText}>‹</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shiftMonth(1)} style={styles.monthArrow}><Text style={styles.monthArrowText}>›</Text></Pressable>
          </View>
        </View>
        <View style={styles.weekdayHeader}>{weekdayLabels.map((label) => <Text key={label} style={styles.weekdayLabel}>{label}</Text>)}</View>
        <View style={styles.calendarGrid}>
          {monthDays.map((day) => (
            <Pressable key={day.dateKey} accessibilityRole="button" accessibilityLabel={`${dayLabel(day.date)}: ${statusLabel(day)}${day.isToday ? ', today' : ''}`} disabled={!day.inMonth} onPress={() => setSelectedDate(day.date)} style={[styles.dayCell, !day.inMonth && styles.outsideMonthCell]}>
              {day.inMonth && renderDayCircle(day)}
            </Pressable>
          ))}
        </View>
        <View style={styles.legend}>
          <LegendMarker label="Logged strength" color={colors.strength} filled />
          <LegendMarker label="Logged cardio" color={colors.cardio} filled />
          <View style={styles.legendItem}><View style={[styles.legendCircle, styles.legendSplit]}><View style={[styles.legendSplitHalf, { backgroundColor: withOpacity(colors.strength, calendarFillAlpha) }]} /><View style={[styles.legendSplitHalf, { backgroundColor: withOpacity(colors.cardio, calendarFillAlpha) }]} /></View><Text style={styles.legendText}>Both logged</Text></View>
          <LegendMarker label="Planned" color={colors.textPrimary} outlined />
          <LegendMarker label="Skipped" color={colors.textSecondary} muted />
          <LegendMarker label="Rest" color={colors.rest} filled />
          <View style={styles.legendItem}><View style={[styles.legendCircle, styles.legendEmpty]} /><Text style={styles.legendText}>No plan</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendCircle, styles.legendToday]} /><Text style={styles.legendText}>Today</Text></View>
        </View>
        {monthIsEmpty && <View style={styles.emptyState}><Text style={styles.emptyTitle}>Nothing on the calendar yet</Text><Text style={styles.emptyMessage}>Logged workouts and planned sessions will appear here.</Text></View>}
      </ScrollView>

      {selectedDate !== null && <Modal animationType="slide" transparent visible onRequestClose={() => setSelectedDate(null)}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.detailSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{selectedDay ? dayLabel(selectedDay.date) : ''}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close day details" onPress={() => setSelectedDate(null)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            {selectedDay?.status === 'logged' && selectedDay.logs.map((log) => {
              const sessionName = log.sessionType === 'freeform' ? 'Freeform' : log.sessionName || templateById.get(log.templateId ?? '')?.name || 'Workout';
              return <View key={log.id} style={styles.detailBlock}>
                <Text style={styles.detailSessionName}>{sessionName}</Text>
                {log.entries.map((entry, index) => {
                  const exercise = exercises.find((item) => item.id === entry.exerciseId);
                  const category = exercise?.category as ActivityType | undefined;
                  return <View key={`${log.id}-${entry.exerciseId}-${index}`} style={styles.detailExerciseRow}>
                    <View style={[styles.detailTypeDot, { backgroundColor: category ? categoryColors[category] : colors.textSecondary }]} />
                    <View style={styles.detailExerciseText}>
                      <Text style={styles.detailExerciseName}>{exercise?.name ?? entry.exerciseId}</Text>
                      <Text style={styles.detailExerciseMeta}>{entry.completed ? 'COMPLETED' : 'PARTIAL'}{entry.setsCompleted?.length ? ` · ${entry.setsCompleted.length} SETS` : ''}{entry.distance ? ` · ${entry.distance} DISTANCE` : ''}</Text>
                    </View>
                  </View>;
                })}
              </View>;
            })}
            {selectedDay?.status === 'planned' && <View style={styles.detailBlock}><Text style={styles.detailSessionName}>{selectedDay.plannedTemplateName}</Text><Text style={[styles.detailStatus, { color: selectedDay.plannedType ? categoryColors[selectedDay.plannedType] : colors.textSecondary }]}>{selectedDay.plannedType?.toUpperCase()} · PLANNED</Text></View>}
            {selectedDay?.status === 'rest' && <View style={styles.detailBlock}><Text style={styles.detailSessionName}>Rest</Text><Text style={[styles.detailStatus, { color: colors.rest }]}>RECOVERY</Text></View>}
            {selectedDay?.status === 'skipped' && <View style={styles.detailBlock}><Text style={styles.detailSessionName}>{selectedDay.plannedTemplateName}</Text><Text style={[styles.detailStatus, styles.skippedDetail]}>PLANNED · NOT COMPLETED</Text></View>}
            {selectedDay?.status === 'empty' && <View style={styles.detailBlock}><Text style={styles.emptyMessage}>No workout planned or logged.</Text></View>}
            {selectedDay && selectedDay.dateKey >= todayKey && <Pressable accessibilityRole="button" onPress={() => { setSelectedDate(null); onOpenWeeklySplit(); }} style={styles.weeklySplitLink}><Text style={styles.weeklySplitLinkText}>GO TO WEEKLY SPLIT</Text></Pressable>}
          </View>
        </View>
      </Modal>}
    </SafeAreaView>
  );
}

function LegendMarker({ label, color, outlined = false, muted = false, filled = false }: { label: string; color: string; outlined?: boolean; muted?: boolean; filled?: boolean }) {
  const markerBackground = filled ? withOpacity(color, calendarFillAlpha) : outlined ? colors.background : muted ? colors.surface : color;
  return <View style={styles.legendItem}><View style={[styles.legendCircle, outlined && styles.legendOutlined, muted && styles.legendMuted, { borderColor: color, backgroundColor: markerBackground }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  backButton: { alignSelf: 'flex-start', minHeight: spacing.lg, justifyContent: 'center' },
  backText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  eyebrow: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.4 },
  title: { marginTop: spacing.xs, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size['3xl'], fontWeight: typography.weight.bold },
  monthControls: { flexDirection: 'row', gap: spacing.xs },
  monthArrow: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceRaised },
  monthArrowText: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.xl, fontWeight: typography.weight.medium },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.md },
  monthTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.xl, fontWeight: typography.weight.semibold },
  weekdayHeader: { flexDirection: 'row', marginBottom: spacing.xs },
  weekdayLabel: { flex: 1, textAlign: 'center', color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', aspectRatio: 0.92, alignItems: 'center', justifyContent: 'center' },
  outsideMonthCell: { opacity: 0 },
  dayCircle: { width: '88%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: radius.full, backgroundColor: colors.background },
  emptyCircle: { backgroundColor: colors.background },
  plannedCircle: { borderWidth: 2, backgroundColor: colors.background },
  skippedCircle: { borderWidth: 1, borderStyle: 'dashed', opacity: 0.62, backgroundColor: colors.background },
  todayGlow: { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: spacing.md, spreadDistance: spacing.xs, color: todayGlowColor }] },
  splitCircle: { ...StyleSheet.absoluteFill, flexDirection: 'row', borderRadius: radius.full, overflow: 'hidden' },
  splitHalf: { flex: 1 },
  dayNumber: { zIndex: 1, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  mixedNumber: { paddingHorizontal: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.background },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendCircle: { width: spacing.md, height: spacing.md, borderRadius: radius.full },
  legendOutlined: { borderWidth: 1, backgroundColor: colors.background },
  legendMuted: { borderWidth: 1, borderStyle: 'dashed', opacity: 0.62, backgroundColor: colors.surface },
  legendSplit: { flexDirection: 'row', overflow: 'hidden' },
  legendSplitHalf: { flex: 1 },
  legendEmpty: { backgroundColor: colors.background },
  legendToday: { backgroundColor: colors.background, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: spacing.sm, spreadDistance: spacing.xs, color: todayGlowColor }] },
  legendText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xs, fontWeight: typography.weight.regular },
  emptyState: { alignItems: 'center', marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface },
  emptyTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  emptyMessage: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.sm, fontWeight: typography.weight.regular },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.background },
  detailSheet: { maxHeight: '78%', padding: spacing.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: colors.surface },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sheetTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  closeButton: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceRaised },
  closeText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xl },
  detailBlock: { marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  detailSessionName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  detailStatus: { marginTop: spacing.xs, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  skippedDetail: { color: colors.textSecondary },
  detailExerciseRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  detailTypeDot: { width: spacing.sm, height: spacing.sm, marginRight: spacing.sm, borderRadius: radius.full },
  detailExerciseText: { flex: 1 },
  detailExerciseName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  detailExerciseMeta: { marginTop: spacing.xs, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  weeklySplitLink: { minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
  weeklySplitLinkText: { color: colors.cardio, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
});