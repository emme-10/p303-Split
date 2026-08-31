/**
 * SplitLog design tokens — typography
 *
 * UI text: Inter (clean geometric sans, easy to read at a glance mid-gym)
 * Stat numerals: tabular/monospace treatment for big readouts (weight, reps,
 * distance, streak count) — this is what gives the "device readout" feel
 * seen in the Oura/Ultrahuman references, rather than looking like a
 * generic list-based app.
 *
 * Note: exact font loading (Inter via expo-font / expo-google-fonts) gets
 * wired up in src/theme/index.ts once we're building real screens. This
 * file defines the scale and intent; App-level font loading is a separate
 * step.
 */

export const typography = {
  fontFamily: {
    ui: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
     semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
    stat: 'Inter_700Bold', // big numeric readouts — fallback to monospace if not loaded
  },

  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    statHero: 56, // e.g. the big "3.3 Liter" style readout
  },

  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
