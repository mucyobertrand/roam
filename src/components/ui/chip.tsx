import { Pressable, type PressableProps } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/tokens";

import { Icon, type IconName } from "./icon";
import { PressableScale } from "./pressable-scale";
import { Text } from "./text";

const sizes = {
  /** Filter chips: lavender when selected. */
  md: { container: "h-control-sm px-xl", selected: "bg-lavender border-lavender", text: "button", icon: "sm" },
  /** Category chips with an icon: yellow when selected. */
  sm: { container: "h-icon-button-sm px-lg", selected: "bg-primary border-primary", text: "caption", icon: "xs" },
  /** Home categories (home.png): yellow when selected, grey otherwise, no border. */
  lg: { container: "h-icon-button px-md", selected: "", text: "button", icon: "sm" },
  /** Search filters (search.png): lavender when selected, grey otherwise, no border. */
  filter: { container: "h-icon-button-sm px-xl", selected: "", text: "caption", icon: "sm" },
} as const;

export type ChipProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  selected?: boolean;
  icon?: IconName;
  size?: keyof typeof sizes;
  disabled?: boolean;
  /** Layout only. */
  className?: string;
};

export function Chip({
  label,
  selected = false,
  icon,
  size = "md",
  disabled = false,
  className,
  ...props
}: ChipProps) {
  const s = sizes[size];

  if (size === "lg" || size === "filter") {
    // Press scale + a 150 ms background cross-fade when selection changes.
    const selectedColor = size === "lg" ? colors.primary : colors.lavender;
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        className={cn("flex-row items-center gap-sm rounded-full", s.container, disabled && "opacity-40", className)}
        style={{ backgroundColor: selected ? selectedColor : colors.surfaceMuted }}
        {...props}
      >
        {icon && <Icon name={icon} size={s.icon} />}
        <Text variant={s.text} emphasis={size === "filter" && selected}>
          {label}
        </Text>
      </PressableScale>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      className={cn(
        "flex-row items-center gap-sm rounded-full border",
        s.container,
        selected ? s.selected : "bg-surface border-border",
        disabled ? "opacity-40" : "active:opacity-70",
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={s.icon} />}
      <Text variant={s.text}>{label}</Text>
    </Pressable>
  );
}
