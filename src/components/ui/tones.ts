/** Foreground color classes shared by Text and Icon. */
export const textTones = {
  default: "text-ink",
  muted: "text-ink-muted",
  /** Soft blue-grey, e.g. the brand tagline. */
  subtle: "text-ink-subtle",
  inverse: "text-surface",
  accent: "text-lavender-strong",
  primary: "text-primary",
  success: "text-success",
  danger: "text-danger",
  info: "text-info",
} as const;

export type Tone = keyof typeof textTones;
