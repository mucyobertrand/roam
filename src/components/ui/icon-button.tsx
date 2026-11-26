import { Pressable, type PressableProps } from "react-native";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";
import type { Tone } from "./tones";

const variants = {
  /** Light grey circle: toolbars and the design's icon-button row. */
  muted: "bg-surface-muted",
  /** White circle with a soft shadow: on photos and coloured surfaces. */
  surface: "bg-surface shadow-card",
  /** White circle with a hairline border: header back buttons. */
  outline: "bg-surface border border-border",
  /** No fill: inline actions inside fields, alerts and steppers. */
  plain: "bg-transparent",
} as const;

const sizes = {
  md: { container: "size-icon-button", icon: "md" },
  sm: { container: "size-icon-button-sm", icon: "sm" },
} as const;

export type IconButtonProps = Omit<PressableProps, "children" | "style"> & {
  icon: IconName;
  /** Required: icon-only controls have no visible text. */
  accessibilityLabel: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  tone?: Tone;
  disabled?: boolean;
  /** Layout only. */
  className?: string;
};

export function IconButton({
  icon,
  variant = "muted",
  size = "md",
  tone = "default",
  disabled = false,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={size === "sm" ? 6 : undefined}
      className={cn(
        "items-center justify-center rounded-full",
        sizes[size].container,
        variants[variant],
        disabled ? "opacity-40" : "active:opacity-70",
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={sizes[size].icon} tone={tone} />
    </Pressable>
  );
}
