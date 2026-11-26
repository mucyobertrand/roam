import { View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

/** Hairline rule, optionally with a centered label such as "or". */
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <View className={cn("h-px bg-border", className)} />;
  return (
    <View className={cn("flex-row items-center gap-md", className)} accessibilityRole="text" accessibilityLabel={label}>
      <View className="h-px flex-1 bg-border" />
      <Text variant="caption" tone="muted" importantForAccessibility="no">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
