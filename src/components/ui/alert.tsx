import { View } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { IconButton } from "./icon-button";
import { Text } from "./text";

const tones = {
  success: { container: "bg-success-soft", icon: "check-circle", tone: "success" },
  error: { container: "bg-danger-soft", icon: "alert-circle", tone: "danger" },
  info: { container: "bg-info-soft", icon: "info", tone: "info" },
} as const;

export type AlertProps = {
  tone: keyof typeof tones;
  message: string;
  /** Shows a close button when provided. */
  onDismiss?: () => void;
  /** Layout only. */
  className?: string;
};

export function Alert({ tone, message, onDismiss, className }: AlertProps) {
  const t = tones[tone];
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn("flex-row items-center gap-md rounded-lg py-md pl-lg pr-sm", t.container, className)}
      style={{ borderCurve: "continuous" }}
    >
      <Icon name={t.icon} size="md" tone={t.tone} />
      <Text variant="caption" tone={t.tone} className="flex-1">
        {message}
      </Text>
      {onDismiss && (
        <IconButton
          icon="close"
          accessibilityLabel="Dismiss"
          variant="plain"
          size="sm"
          tone={t.tone}
          onPress={onDismiss}
        />
      )}
    </View>
  );
}
