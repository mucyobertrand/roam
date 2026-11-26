import { useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, ReduceMotion, useReducedMotion } from "react-native-reanimated";

import { StayCard } from "@/components/stay-card";
import type { Stay } from "@/data/stays";
import { cn } from "@/lib/cn";
import { duration, EASE_OUT, STAGGER, STAGGER_LIMIT } from "@/theme/motion";

// Built at module scope where possible (Reanimated advises against rebuilding builders
// every render); the staggered one depends on the index, and only runs at a card's mount.
const enterFirst = (i: number) =>
  FadeInDown.duration(duration.enter)
    .delay(Math.min(i, STAGGER_LIMIT) * STAGGER)
    .easing(EASE_OUT);
const enterLater = FadeIn.duration(duration.reflow).easing(EASE_OUT);
const enterReduced = FadeIn.duration(duration.enter).reduceMotion(ReduceMotion.Never);
const exit = FadeOut.duration(duration.exit);
const reflow = LinearTransition.duration(duration.reflow).easing(EASE_OUT);

export type StayListProps = {
  stays: readonly Stay[];
  /** How each stay draws; defaults to the big photo card (Home). Search passes its rows. */
  renderItem?: (stay: Stay) => ReactNode;
  /** Spacing between items: `card` (big photo cards) or `row` (compact result rows). */
  variant?: "card" | "row";
  /** Layout only (margins). */
  className?: string;
};

const renderCard = (stay: Stay) => <StayCard stay={stay} />;

/**
 * Stays (cards or rows) in a plain (non-virtualized) column, so layout animations are safe:
 * - first mount: cards fade up, the first 3 staggered 40 ms apart;
 * - later (a filter or sort changed): new items fade in, removed ones fade out, the rest glide.
 * Remount with a new `key` to replay the first-load entrance (Search does, per query).
 * Reduced motion: fades only, no movement.
 */
export function StayList({ stays, renderItem = renderCard, variant = "card", className }: StayListProps) {
  const reduced = useReducedMotion();
  // Set once the first layout has committed; cards mounted after that are filter changes.
  const [settled, setSettled] = useState(false);

  return (
    <View className={cn(variant === "row" ? "gap-lg" : "gap-2xl", className)} onLayout={() => !settled && setSettled(true)}>
      {stays.map((stay, i) => (
        <Animated.View
          key={stay.id}
          entering={reduced ? enterReduced : settled ? enterLater : enterFirst(i)}
          exiting={exit}
          layout={reduced ? undefined : reflow}
        >
          {renderItem(stay)}
        </Animated.View>
      ))}
    </View>
  );
}
