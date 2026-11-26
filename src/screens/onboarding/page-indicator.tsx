import { View } from "react-native";

import { cn } from "@/lib/cn";

export function PageIndicator({ count, active }: { count: number; active: number }) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Page ${active + 1} of ${count}`}
      className="flex-row gap-sm"
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className={cn("h-indicator w-3xl rounded-full", i === active ? "bg-lavender" : "bg-border")} />
      ))}
    </View>
  );
}
