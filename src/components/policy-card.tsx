import { View } from "react-native";

import { Icon, PressableScale, Text, type IconName } from "@/components/ui";
import { cn } from "@/lib/cn";

type PolicyCardProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  /** Puts the icon on a lavender tile (the "Ask about policies" card). */
  tile?: boolean;
  onPress: () => void;
  accessibilityHint: string;
};

/** A lavender link card (property-details.png): icon, title, one line of detail, chevron. */
export function PolicyCard({ icon, title, subtitle, tile = false, onPress, accessibilityHint }: PolicyCardProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      className="flex-row items-center gap-lg rounded-lg bg-lavender-soft p-lg"
      style={{ borderCurve: "continuous" }}
    >
      <View
        className={cn("size-control-md items-center justify-center rounded-md", tile && "bg-lavender-tile")}
        style={{ borderCurve: "continuous" }}
      >
        <Icon name={icon} tone="accent" />
      </View>
      <View className="flex-1 gap-xs">
        <Text variant="title">{title}</Text>
        <Text variant="caption" tone="muted">
          {subtitle}
        </Text>
      </View>
      <Icon name="chevron-right" tone="accent" />
    </PressableScale>
  );
}
