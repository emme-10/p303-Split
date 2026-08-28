/**
 * SplitLog design tokens — spacing & radius
 *
 * Generous whitespace, rounded surfaces (matches the soft-card look across
 * all reference apps). Thumb-reachable spacing matters most on the Active
 * Workout screen specifically — see BRIEF.md "Style" section.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24, // default card radius — matches the soft, pill-ish card look in references
  full: 9999, // pills, circular buttons
} as const;
