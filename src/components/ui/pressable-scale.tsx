import { useState, type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useReducedMotion, type CSSStyle } from "react-native-reanimated";

import { CSS_EASE_OUT, duration, PRESS_SCALE } from "@/theme/motion";

export type PressableScaleProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  /** Visual classes for the scaling surface (background, radius, padding, layout). */
  className?: string;
  /** Layout classes for the outer touch target, e.g. absolute positioning. */
  pressableClassName?: string;
  /**
   * Animated style. `backgroundColor` changes cross-fade over 150 ms, so selection state
   * can live here (classes don't transition).
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Press feedback for custom pressables: scales to 0.97 on press-in over 120 ms (Reanimated
 * CSS transition, UI thread), back on release. Skipped when the system asks for reduced
 * motion; the action itself never waits for the animation.
 */
export function PressableScale({
  children,
  className,
  pressableClassName,
  style,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return (
    <Pressable
      className={pressableClassName}
      pressRetentionOffset={16}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...props}
    >
      <Animated.View className={className} style={[styles.surface, pressed && !reduced && styles.pressed, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Plain objects typed as Reanimated CSS styles: RN 0.88's own ViewStyle declares
// transition props with web-string types that reject Reanimated's values.
const styles = {
  surface: {
    transform: [{ scale: 1 }],
    transitionProperty: ["transform", "backgroundColor"],
    transitionDuration: [duration.press, duration.state],
    transitionTimingFunction: CSS_EASE_OUT,
  } satisfies CSSStyle<ViewStyle>,
  pressed: { transform: [{ scale: PRESS_SCALE }] } satisfies CSSStyle<ViewStyle>,
};
