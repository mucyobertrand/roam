import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Alert } from "@/components/ui";
import { duration, EASE_OUT } from "@/theme/motion";

const SHOW_MS = 3000;

/** "{Label} is coming soon." for rows whose feature doesn't exist yet. Hides itself after 3 s. */
export function useComingSoon() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((label: string) => {
    const text = `${label} is coming soon.`;
    clearTimeout(timer.current);
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setMessage(null), SHOW_MS);
  }, []);

  return { message, show };
}

/** Floats the notice over the bottom of the screen, above the tab bar. */
export function ComingSoonNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(duration.enter).easing(EASE_OUT)}
      exiting={FadeOut.duration(duration.exit)}
      className="absolute bottom-lg left-xl right-xl"
    >
      <Alert tone="info" message={message} />
    </Animated.View>
  );
}
