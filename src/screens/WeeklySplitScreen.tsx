import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing, typography } from '../theme';
import { weekdays, type Weekday } from '../types/templates';

type DayType = 'strength' | 'cardio' | 'rest';
type WeeklySplitScreenProps = { onOpenTemplates: () => void };

const dayLabels: Record<Weekday, string> = {
  monday: 'MON', tuesday: 'TUE', wednesday: 'WED', thursday: 'THU',
  friday: 'FRI', saturday: 'SAT', sunday: 'SUN',
};

const workoutStyles: Record<DayType, { accent: string; muted: string; icon: string }> = {
  strength: { accent: colors.strength, muted: colors.strengthMuted, icon: '+' },
  cardio: { accent: colors.cardio, muted: colors.cardioMuted, icon: '>' },
  rest: { accent: colors.rest, muted: colors.restMuted, icon: '-' },
};

export default function ConnectedWeeklySplitScreen({ onOpenTemplates }: WeeklySplitScreenProps) {
  const { templates, weeklySplit, assignTemplate } = useAppState();
  const [selectedDay, setSelectedDay] = useState<Weekday | null>(null);
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekDays = weekdays.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { day, label: dayLabels[day], date: date.toLocaleDateString(undefined, { day: '2-digit' }) };
  });
  const trainingDays = weekdays.filter((day) => weeklySplit[day] !== 'rest').length;
  const formatDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }).toUpperCase();
  const dateRange = `${formatDate(monday)} - ${formatDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6))}, ${monday.getFullYear()}`;
  const getDayType = (templateId: string): DayType => templateId === 'rest' ? 'rest' : templates.find((template) => template.id === templateId)?.activityType ?? 'rest';
  const chooseAssignment = (assignment: string) => {
    if (selectedDay) assignTemplate(selectedDay, assignment);
    setSelectedDay(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>WEEKLY SPLIT</Text><Text style={styles.title}>Your week</Text></View>
          <View style={styles.weekBadge}><Text style={styles.weekBadgeLabel}>WEEK</Text><Text style={styles.weekBadgeValue}>{getWeekNumber(monday)}</Text></View>
        </View>
        <Text style={styles.dateRange}>{dateRange}</Text>
        <Pressable accessibilityRole="button" onPress={onOpenTemplates} style={styles.libraryButton}><Text style={styles.libraryButtonText}>TEMPLATE LIBRARY <Text style={styles.libraryButtonArrow}>›</Text></Text></Pressable>
        <View style={styles.summary}>
          <Text style={styles.summaryValue}>{trainingDays}</Text><Text style={styles.summaryLabel}>TRAINING DAYS</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryValue}>{7 - trainingDays}</Text><Text style={styles.summaryLabel}>REST DAYS</Text>
        </View>
        <View style={styles.dayList}>
          {weekDays.map((day) => {
            const templateId = weeklySplit[day.day];
            const template = templateId === 'rest' ? undefined : templates.find((item) => item.id === templateId);
            const type = getDayType(templateId);
            const workout = workoutStyles[type];
            return (
              <Pressable key={day.day} accessibilityRole="button" accessibilityLabel={`${day.label} ${template?.name ?? 'Rest'}, change assignment`} onPress={() => setSelectedDay(day.day)} style={({ pressed }) => [styles.dayRow, pressed && styles.dayRowPressed]}>
                <View style={styles.dayDate}><Text style={styles.dayLabel}>{day.label}</Text><Text style={styles.dateLabel}>{day.date}</Text></View>
                <View style={[styles.typeMark, { backgroundColor: workout.muted }]}><Text style={[styles.typeIcon, { color: workout.accent }]}>{workout.icon}</Text></View>
                <View style={styles.dayDetails}><Text style={styles.templateName}>{template?.name ?? 'Rest'}</Text><Text style={[styles.typeLabel, { color: workout.accent }]}>{type === 'rest' ? 'RECOVERY' : type.toUpperCase()}</Text></View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.footerHint}>TAP A DAY TO ASSIGN A TEMPLATE</Text>
      </ScrollView>
      <Modal animationType="fade" transparent visible={selectedDay !== null} onRequestClose={() => setSelectedDay(null)}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.picker}>
            <Text style={styles.pickerTitle}>Assign {selectedDay ? dayLabels[selectedDay] : ''}</Text>
            {templates.length === 0 && <View style={styles.pickerEmpty}><Text style={styles.pickerEmptyText}>No templates yet. Build one first, then assign it to your week.</Text><Pressable accessibilityRole="button" onPress={() => { setSelectedDay(null); onOpenTemplates(); }} style={styles.createTemplateButton}><Text style={styles.createTemplateText}>BUILD A TEMPLATE</Text></Pressable></View>}
            <ScrollView style={styles.optionsList}>
              {templates.map((template) => {
                const activity = workoutStyles[template.activityType];
                return <Pressable key={template.id} accessibilityRole="button" onPress={() => chooseAssignment(template.id)} style={styles.optionRow}><View style={[styles.optionMark, { backgroundColor: activity.muted }]}><Text style={[styles.optionMarkText, { color: activity.accent }]}>{activity.icon}</Text></View><View style={styles.optionDetails}><Text style={styles.optionName}>{template.name}</Text><Text style={[styles.optionType, { color: activity.accent }]}>{template.activityType.toUpperCase()}</Text></View><Text style={styles.chevron}>›</Text></Pressable>;
              })}
              <Pressable accessibilityRole="button" onPress={() => chooseAssignment('rest')} style={styles.optionRow}><View style={[styles.optionMark, { backgroundColor: colors.restMuted }]}><Text style={[styles.optionMarkText, { color: colors.rest }]}>-</Text></View><View style={styles.optionDetails}><Text style={styles.optionName}>Rest</Text><Text style={[styles.optionType, { color: colors.rest }]}>RECOVERY</Text></View><Text style={styles.chevron}>›</Text></Pressable>
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setSelectedDay(null)} style={styles.cancelButton}><Text style={styles.cancelText}>CANCEL</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getWeekNumber(date: Date) {
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000) + 1;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, eyebrow: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.6 }, title: { marginTop: spacing.xs, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size['3xl'], fontWeight: typography.weight.bold },
  weekBadge: { alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }, weekBadgeLabel: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 }, weekBadgeValue: { marginTop: spacing.xs, color: colors.strength, fontFamily: typography.fontFamily.stat, fontSize: typography.size.xl, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] },
  dateRange: { marginTop: spacing.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.sm, fontWeight: typography.weight.medium, letterSpacing: 0.8 }, libraryButton: { alignSelf: 'flex-start', minHeight: spacing.xl, justifyContent: 'center', marginTop: spacing.sm }, libraryButtonText: { color: colors.cardio, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 }, libraryButtonArrow: { fontSize: typography.size.lg },
  summary: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface }, summaryValue: { color: colors.textPrimary, fontFamily: typography.fontFamily.stat, fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] }, summaryLabel: { marginLeft: spacing.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, summaryDivider: { width: 1, height: spacing.lg, marginHorizontal: spacing.md, backgroundColor: colors.border },
  dayList: { marginTop: spacing.lg, gap: spacing.sm }, dayRow: { minHeight: 80, flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface }, dayRowPressed: { opacity: 0.72 }, dayDate: { width: spacing.xl }, dayLabel: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.5 }, dateLabel: { marginTop: spacing.xs, color: colors.textPrimary, fontFamily: typography.fontFamily.stat, fontSize: typography.size.lg, fontWeight: typography.weight.bold, fontVariant: ['tabular-nums'] },
  typeMark: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.md, borderRadius: radius.full }, typeIcon: { fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.lg, fontWeight: typography.weight.bold }, dayDetails: { flex: 1 }, templateName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.base, fontWeight: typography.weight.semibold }, typeLabel: { marginTop: spacing.xs, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.2 }, chevron: { marginLeft: spacing.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.xl }, footerHint: { marginTop: spacing.lg, textAlign: 'center', color: colors.textDisabled, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background }, picker: { maxHeight: '85%', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }, pickerTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xl, fontWeight: typography.weight.bold }, pickerEmpty: { alignItems: 'center', paddingVertical: spacing.lg }, pickerEmptyText: { textAlign: 'center', color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.base, fontWeight: typography.weight.regular }, createTemplateButton: { minHeight: spacing['2xl'], justifyContent: 'center', marginTop: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.strength }, createTemplateText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, optionsList: { marginTop: spacing.md },
  optionRow: { minHeight: spacing['2xl'], flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, optionMark: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderRadius: radius.full }, optionMarkText: { fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.lg, fontWeight: typography.weight.bold }, optionDetails: { flex: 1 }, optionName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.base, fontWeight: typography.weight.semibold }, optionType: { marginTop: spacing.xs, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, cancelButton: { minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surface }, cancelText: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 1 },
});