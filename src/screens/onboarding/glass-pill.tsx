import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { cn } from "@/lib/cn";

const liquidGlass = isLiquidGlassAvailable();

const fallback = {
  light: "bg-glass border border-border",
  dark: "bg-scrim border border-glass-border",
} as const;

export type GlassPillProps = {
  tone?: keyof typeof fallback;
  /** Size, padding and layout of the pill. */
  className?: string;
  children: ReactNode;
};

/** Pill on top of a photo: liquid glass on iOS 26+, a translucent fill elsewhere. */
export function GlassPill({ tone = "light", className, children }: GlassPillProps) {
  return (
    <View
      className={cn("flex-row items-center overflow-hidden rounded-full", !liquidGlass && fallback[tone], className)}
    >
      {liquidGlass && (
        <GlassView glassEffectStyle="regular" colorScheme={tone} style={StyleSheet.absoluteFill} />
      )}
      {children}
    </View>
  );
}
