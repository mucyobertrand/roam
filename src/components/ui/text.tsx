import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { cn } from "@/lib/cn";

import { textTones, type Tone } from "./tones";

const variants = {
  display: "font-jakarta-bold text-display",
  hero: "font-jakarta-extrabold text-hero",
  "hero-sm": "font-jakarta-extrabold text-hero-sm",
  /** Stay title, property-details.png. */
  "hero-xs": "font-jakarta-extrabold text-hero-xs",
  "heading-lg": "font-jakarta-bold text-heading-lg",
  heading: "font-jakarta-bold text-heading",
  title: "font-jakarta-bold text-title",
  /** Result prices ("$289"), search.png. */
  price: "font-jakarta-extrabold text-price",
  /** Stay price bar ("$289 / night"), property-details.png. */
  "price-lg": "font-jakarta-extrabold text-price-lg",
  /** Profile stats ("12", "4.9"), profile.png. */
  stat: "font-jakarta-extrabold text-stat",
  tagline: "font-jakarta-regular text-tagline",
  body: "font-jakarta-regular text-body",
  button: "font-jakarta-medium text-button",
  caption: "font-jakarta-medium text-caption",
  label: "font-jakarta-medium text-label",
} as const;

export type TextVariant = keyof typeof variants;

/** Variants whose default color isn't ink. */
const defaultTones: Partial<Record<TextVariant, Tone>> = { body: "muted", tagline: "subtle" };

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** Defaults to `muted` for body, `subtle` for tagline, and ink for everything else. */
  tone?: Tone;
  /** SemiBold, e.g. an email or name inside a sentence. */
  emphasis?: boolean;
  /** Layout only (margin, flex, alignment). Color comes from `tone`. */
  className?: string;
};

export function Text({ variant = "body", tone, emphasis = false, className, ...props }: TextProps) {
  const resolvedTone = tone ?? defaultTones[variant] ?? "default";
  return (
    <RNText
      className={cn(emphasis ? variants[variant].replace(/font-jakarta-\S+/, "font-jakarta-semibold") : variants[variant], textTones[resolvedTone], className)}
      {...props}
    />
  );
}
