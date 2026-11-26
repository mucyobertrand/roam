import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";
import { Text } from "./text";

export type SegmentedOption<T extends string> = { value: T; label: string; icon?: IconName };

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Layout only. */
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="tablist" className={cn("flex-row rounded-full bg-surface-muted p-xs", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        const tone = selected ? "inverse" : "default";
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              "h-control-sm flex-1 flex-row items-center justify-center gap-sm rounded-full px-xl",
              selected ? "bg-ink" : "bg-transparent active:opacity-70",
            )}
          >
            {option.icon && <Icon name={option.icon} size="sm" tone={tone} />}
            <Text variant="caption" tone={tone}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
