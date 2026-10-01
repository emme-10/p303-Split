import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type TabKey = 'split' | 'calendar' | 'progress' | 'library';

export type BottomTabBarProps = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'split', label: 'SPLIT' },
  { key: 'calendar', label: 'CALENDAR' },
  { key: 'progress', label: 'PROGRESS' },
  { key: 'library', label: 'TEMPLATES' },
];

export default function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  tab: { flex: 1, minHeight: spacing['2xl'], alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  indicator: { width: spacing.md, height: 3, borderRadius: radius.full, backgroundColor: 'transparent' },
  indicatorActive: { backgroundColor: colors.strength },
  label: { color: colors.textSecondary, fontFamily: typography.fontFamily.ui.bold, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 0.8 },
  labelActive: { color: colors.textPrimary },
});
