import { View } from "react-native";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";
import { Text } from "./text";
import type { Tone } from "./tones";

const tones = {
  favorite: { container: "bg-primary-soft", text: "default", icon: "primary" },
  success: { container: "bg-success-soft", text: "success", icon: "success" },
  discount: { container: "bg-danger-soft", text: "danger", icon: "danger" },
  info: { container: "bg-info-soft", text: "info", icon: "info" },
  /** Amenities on listing cards. */
  neutral: { container: "bg-surface-muted", text: "default", icon: "default" },
} as const satisfies Record<string, { container: string; text: Tone; icon: Tone }>;

const sizes = {
  md: { container: "px-lg py-sm rounded-full", text: "caption", icon: "sm" },
  sm: { container: "px-md py-xs rounded-md", text: "label", icon: "xs" },
  /** Amenities on search result rows (search.png): compact full pill. */
  pill: { container: "px-sm py-xs rounded-full", text: "label", icon: "xs" },
} as const;

export type BadgeProps = {
  label: string;
  tone?: keyof typeof tones;
  size?: keyof typeof sizes;
  icon?: IconName;
  /** Layout only. */
  className?: string;
};

export function Badge({ label, tone = "neutral", size = "md", icon, className }: BadgeProps) {
  const t = tones[tone];
  const s = sizes[size];
  return (
    <View
      className={cn("flex-row items-center gap-xs self-start", s.container, t.container, className)}
      style={size === "sm" ? { borderCurve: "continuous" } : undefined}
    >
      {icon && <Icon name={icon} size={s.icon} tone={t.icon} />}
      <Text variant={s.text} tone={t.text}>
        {label}
      </Text>
    </View>
  );
}
