/**
 * JS mirror of the few tokens that must be raw values in code (native props
 * that can't take a class: icon size, Switch track color). The source of truth
 * is src/global.css; scripts/check-tokens.mjs fails if these drift from it.
 */
export const iconSize = {
  xs: 16, // --spacing-icon-xs
  sm: 20, // --spacing-icon-sm
  md: 24, // --spacing-icon-md
} as const;

/** For safe-area math (insets are numbers), e.g. `insets.top + spacing.sm`. */
export const spacing = {
  sm: 8, // --spacing-sm
  lg: 16, // --spacing-lg
} as const;

export const colors = {
  primary: "#ffc629", // --color-primary
  surface: "#ffffff", // --color-surface
  surfaceMuted: "#f4f5f7", // --color-surface-muted
  lavender: "#c9b4ff", // --color-lavender
  ink: "#0b0b1a", // --color-ink
  inkMuted: "#6b7280", // --color-ink-muted
  scrimStrong: "#0b0b1abf", // --color-scrim-strong
} as const;

/** Native sheet corner radius (sheetCornerRadius is a number). */
export const radius = {
  xl: 24, // --radius-xl
} as const;

/** Native tab bar labels (a native prop, not a class). */
export const tabLabel = {
  fontFamily: "PlusJakartaSans_600SemiBold", // --font-jakarta-semibold
  fontSize: 12, // --text-label
} as const;
