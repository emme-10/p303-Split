import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppState } from '../context/AppStateContext';
import { colors, radius, spacing, typography } from '../theme';
import type { SavedTemplate } from '../types/templates';

type TemplateLibraryScreenProps = {
  onAddTemplate: () => void;
  onEditTemplate: (template: SavedTemplate) => void;
  onBack: () => void;
};

export default function TemplateLibraryScreen({ onAddTemplate, onEditTemplate, onBack }: TemplateLibraryScreenProps) {
  const { templates, deleteTemplate: removeTemplate } = useAppState();
  const [menuTemplateId, setMenuTemplateId] = useState<string | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<SavedTemplate | null>(null);

  const confirmDelete = () => {
    if (!deleteTemplate) return;
    removeTemplate(deleteTemplate.id);
    setDeleteTemplate(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backButtonText}>‹ WEEKLY SPLIT</Text></Pressable>
            <Text style={styles.eyebrow}>TEMPLATE LIBRARY</Text>
            <Text style={styles.title}>Your templates</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add template" onPress={onAddTemplate} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No templates yet</Text>
            <Text style={styles.emptyText}>Build a reusable session for your weekly split.</Text>
            <Pressable accessibilityRole="button" onPress={onAddTemplate} style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>ADD TEMPLATE</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.templateList}>
            {templates.map((template) => {
              const isStrength = template.activityType === 'strength';
              const accent = isStrength ? colors.strength : colors.cardio;
              const muted = isStrength ? colors.strengthMuted : colors.cardioMuted;
              const isMenuOpen = menuTemplateId === template.id;
              return (
                <View key={template.id} style={styles.templateCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardMain}>
                      <View style={[styles.typeMark, { backgroundColor: muted }]}><Text style={[styles.typeMarkText, { color: accent }]}>{isStrength ? '+' : '>'}</Text></View>
                      <View style={styles.cardDetails}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={[styles.templateType, { color: accent }]}>{template.activityType.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Template options for ${template.name}`} onPress={() => setMenuTemplateId(isMenuOpen ? null : template.id)} style={styles.menuButton}>
                      <Text style={styles.menuButtonText}>...</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.exerciseCount}>{template.exercises.length} {template.exercises.length === 1 ? 'EXERCISE' : 'EXERCISES'}</Text>
                  {isMenuOpen && <View style={styles.menu}>
                    <Pressable accessibilityRole="button" onPress={() => { setMenuTemplateId(null); onEditTemplate(template); }} style={styles.menuItem}><Text style={styles.menuItemText}>Edit template</Text></Pressable>
                    <Pressable accessibilityRole="button" onPress={() => { setMenuTemplateId(null); setDeleteTemplate(template); }} style={styles.menuItem}><Text style={styles.deleteMenuItemText}>Delete template</Text></Pressable>
                  </View>}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal animationType="fade" transparent visible={deleteTemplate !== null} onRequestClose={() => setDeleteTemplate(null)}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text style={styles.dialogTitle}>Delete Template</Text>
            <Text style={styles.dialogText}>Are you sure you want to delete &quot;{deleteTemplate?.name}&quot;?</Text>
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" onPress={() => setDeleteTemplate(null)} style={styles.cancelButton}><Text style={styles.cancelButtonText}>CANCEL</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.deleteButton}><Text style={styles.deleteButtonText}>DELETE</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: spacing.sm }, backButton: { minHeight: spacing.lg, justifyContent: 'center' }, backButtonText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 }, eyebrow: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1.6 }, title: { marginTop: spacing.xs, color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size['3xl'], fontWeight: typography.weight.bold },
  addButton: { width: spacing['2xl'], height: spacing['2xl'], alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.strength }, addButtonText: { color: colors.background, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size['3xl'], fontWeight: typography.weight.regular, lineHeight: spacing['2xl'] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['2xl'] }, emptyTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xl, fontWeight: typography.weight.bold }, emptyText: { maxWidth: 250, marginTop: spacing.sm, textAlign: 'center', color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.base, fontWeight: typography.weight.regular }, emptyAction: { minHeight: spacing['2xl'], justifyContent: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.strength }, emptyActionText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 1 },
  templateList: { marginTop: spacing.xl, gap: spacing.md }, templateCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between' }, cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' }, typeMark: { width: spacing.xl, height: spacing.xl, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderRadius: radius.full }, typeMarkText: { fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.lg, fontWeight: typography.weight.bold }, cardDetails: { flex: 1 }, templateName: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.semibold, fontSize: typography.size.lg, fontWeight: typography.weight.semibold }, templateType: { marginTop: spacing.xs, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 1 }, menuButton: { width: spacing.lg, height: spacing.lg, alignItems: 'center', justifyContent: 'center' }, menuButtonText: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.lg, fontWeight: typography.weight.bold }, exerciseCount: { marginTop: spacing.md, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, menu: { marginTop: spacing.md, overflow: 'hidden', borderRadius: radius.sm, backgroundColor: colors.surfaceRaised }, menuItem: { minHeight: spacing['2xl'], justifyContent: 'center', paddingHorizontal: spacing.md }, menuItemText: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium }, deleteMenuItemText: { color: colors.error, fontFamily: typography.fontFamily.ui.medium, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background }, dialog: { width: '100%', maxWidth: 400, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }, dialogTitle: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xl, fontWeight: typography.weight.bold }, dialogText: { marginTop: spacing.sm, color: colors.textSecondary, fontFamily: typography.fontFamily.ui.regular, fontSize: typography.size.base, fontWeight: typography.weight.regular }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xl }, cancelButton: { minHeight: spacing['2xl'], justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surface }, cancelButtonText: { color: colors.textPrimary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 0.8 }, deleteButton: { minHeight: spacing['2xl'], justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.error }, deleteButtonText: { color: colors.background, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.sm, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
});