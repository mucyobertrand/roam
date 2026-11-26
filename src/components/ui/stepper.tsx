import { View } from "react-native";

import { cn } from "@/lib/cn";

import { IconButton } from "./icon-button";
import { Text } from "./text";

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** What is being counted, e.g. "Guests". Read by screen readers. */
  accessibilityLabel: string;
  min?: number;
  max?: number;
  step?: number;
  /** Layout only. */
  className?: string;
};

export function Stepper({
  value,
  onChange,
  accessibilityLabel,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  className,
}: StepperProps) {
  const canDecrement = value - step >= min;
  const canIncrement = value + step <= max;
  const decrement = () => {
    if (canDecrement) onChange(value - step);
  };
  const increment = () => {
    if (canIncrement) onChange(value + step);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === "increment" ? increment() : decrement())}
      className={cn(
        "h-icon-button flex-row items-center gap-sm self-start rounded-full border border-border bg-surface px-xs",
        className,
      )}
    >
      <IconButton
        icon="minus"
        accessibilityLabel={`Decrease ${accessibilityLabel}`}
        variant="plain"
        size="sm"
        disabled={!canDecrement}
        onPress={decrement}
      />
      <Text variant="title" className="min-w-2xl text-center">
        {value}
      </Text>
      <IconButton
        icon="plus"
        accessibilityLabel={`Increase ${accessibilityLabel}`}
        variant="plain"
        size="sm"
        disabled={!canIncrement}
        onPress={increment}
      />
    </View>
  );
}
