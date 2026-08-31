/**
 * SplitLog design tokens — color
 *
 * Direction: dark, high-contrast, restrained accent palette.
 * Inspired by Oura / Ultrahuman — moody dark surfaces, one or two
 * deliberate accent colors, "device readout" numerals for big stats.
 *
 * Color = workout type, consistently across every screen:
 *   strength -> amber/orange
 *   cardio   -> cyan/blue
 *   streak / milestone moments -> lime (used sparingly, not a workout type)
 */

export const colors = {
  // Base surfaces
  background: '#0B0B0D',
  surface: '#17171A',
  surfaceRaised: '#1F1F23', // for cards that sit above other cards (e.g. active workout panel)

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#8A8A8E',
  textDisabled: '#4A4A4D',

  // Workout-type accents (use consistently: Split, Calendar, Templates, Progress)
  // NOTE: strength and cardio are both cool hues (~40° apart on the wheel) —
  // distinguishable via saturation/lightness, but closer than a warm/cool
  // split would be. Pair every use with the matching icon (dumbbell /
  // run-shoe or similar), not color alone — see BRIEF.md "Style" section.
  strength: '#6E9DE9', // space blue-purple
  strengthMuted: '#1C2138', // dark navy-violet — background/chip fill
  cardio: '#7FE8E2', // glacier turquoise
  cardioMuted: '#11302C', // dark teal — background/chip fill

  // Rest day / neutral state
  rest: '#A6A6AB',
  restMuted: '#232326',

  // Milestone / streak — NOT a workout type, reserve for celebratory moments only
  streak: '#D0ED93', // sage-green, softer/greener than a neon lime

  // Feedback states
  success: '#4FD68C',
  warning: '#F0A93A', // true amber — independent from `strength` now that strength is blue
  error: '#F26D6D',

  // Borders / dividers
  border: '#2A2A2E',
} as const;

export type ColorToken = keyof typeof colors;
