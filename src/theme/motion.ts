import { cubicBezier, Easing } from "react-native-reanimated";

/**
 * Motion constants (expo-animation skill). Durations stay under 300 ms; nothing on UI
 * uses ease-in. Tab switches and screen transitions use the platform defaults.
 */

/** Strong ease-out for withTiming / layout animations. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** The same curve for Reanimated CSS transitions (raw "cubic-bezier()" strings are rejected). */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

export const duration = {
  /** Press feedback: tens of times a day, so near-imperceptible. */
  press: 120,
  /** Chip / toggle state change. */
  state: 150,
  /** List reflow when a filter changes. */
  reflow: 200,
  /** First-load entrance of content the guest is waiting on. */
  enter: 250,
  exit: 150,
} as const;

/** Delay between items in an entrance (30–80 ms reads as a sequence, not a crowd). */
export const STAGGER = 40;
/** Only the first few items stagger; later ones appear with the group. */
export const STAGGER_LIMIT = 3;

/** Press scale for button-like pressables. */
export const PRESS_SCALE = 0.97;
