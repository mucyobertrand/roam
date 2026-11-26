import type { ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, View, type PressableProps } from "react-native";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";
import { Text } from "./text";
import { textTones, type Tone } from "./tones";

const variants = {
  primary: { container: "bg-primary", tone: "default" },
  secondary: { container: "bg-surface border border-border", tone: "default" },
  ghost: { container: "bg-transparent", tone: "default" },
} as const satisfies Record<string, { container: string; tone: Tone }>;

const sizes = {
  md: { container: "h-control px-2xl", text: "button", trailing: "right-2xl" },
  sm: { container: "h-control-sm px-xl", text: "caption", trailing: "right-xl" },
} as const;

// NativeWind maps the spinner's text-color class to its color prop on native;
// on web it inherits the class through currentColor.
const webTint = Platform.OS === "web" ? "currentColor" : undefined;

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  title: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Icon before the title. */
  icon?: IconName;
  /** Custom mark before the title, e.g. a provider logo image. */
  leading?: ReactNode;
  /** Icon pinned to the trailing edge (arrow-right on "Book this stay"). */
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Layout only (width, margin, self-alignment). */
  className?: string;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon,
  leading,
  trailingIcon,
  loading = false,
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      className={cn(
        "flex-row items-center justify-center gap-md rounded-full",
        s.container,
        v.container,
        disabled ? "opacity-40" : !loading && "active:opacity-70",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={webTint} className={textTones[v.tone]} />
      ) : (
        <>
          {/*
            The trailing icon is pinned to the edge, out of the flow. Icon-sized spacers on both
            sides reserve its room: a content-width button (e.g. in an items-center column) grows
            so the icon never covers the title, and a full-width one keeps the title centered.
          */}
          {trailingIcon && <View className="size-icon-md" />}
          {leading}
          {icon && <Icon name={icon} size="sm" tone={v.tone} />}
          <Text variant={s.text} tone={v.tone} numberOfLines={1}>
            {title}
          </Text>
          {trailingIcon && (
            <>
              <View className="size-icon-md" />
              <View className={cn("absolute", s.trailing)}>
                <Icon name={trailingIcon} size="md" tone={v.tone} />
              </View>
            </>
          )}
        </>
      )}
    </Pressable>
  );
}
