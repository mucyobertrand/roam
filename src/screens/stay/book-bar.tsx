import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, View, type LayoutChangeEvent } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Alert, Button, Text } from "@/components/ui";
import type { StayType } from "@/data/stays";
import { withClient } from "@/lib/analytics/client";
import { duration, EASE_OUT } from "@/theme/motion";
import { spacing } from "@/theme/tokens";

const COMING_SOON = "Booking is coming soon.";
const SHOW_MS = 3000;

/**
 * Sticky price bar (property-details.png): "$289 / night" and "Book this stay". Booking is out
 * of scope, so Book shows a short info message above the bar that hides itself. No total:
 * there are no dates yet.
 */
export function BookBar({ price, stayId, stayType, onHeight }: { price: number; stayId: string; stayType: StayType; onHeight: (height: number) => void }) {
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const book = () => {
    withClient((posthog) => posthog.capture("booking_interest_shown", { stay_id: stayId, stay_type: stayType, price_per_night: price }));
    clearTimeout(timer.current);
    setNotice(true);
    AccessibilityInfo.announceForAccessibility(COMING_SOON);
    timer.current = setTimeout(() => setNotice(false), SHOW_MS);
  };

  return (
    <View className="absolute bottom-0 left-0 right-0" onLayout={(e: LayoutChangeEvent) => onHeight(e.nativeEvent.layout.height)}>
      {notice && (
        <Animated.View
          entering={FadeIn.duration(duration.enter).easing(EASE_OUT)}
          exiting={FadeOut.duration(duration.exit)}
          className="absolute bottom-full left-xl right-xl mb-md"
        >
          <Alert tone="info" message={COMING_SOON} />
        </Animated.View>
      )}
      <View
        className="flex-row items-center gap-lg border-t border-border bg-surface px-xl pt-lg"
        style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}
      >
        <View className="flex-row items-baseline gap-xs" accessible accessibilityLabel={`$${price} a night`}>
          <Text variant="price-lg">{`$${price}`}</Text>
          <Text variant="body" tone="default">
            / night
          </Text>
        </View>
        <Button title="Book this stay" onPress={book} className="flex-1" />
      </View>
    </View>
  );
}
