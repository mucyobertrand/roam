import { Icon, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

import { GlassPill } from "./glass-pill";

export function LocationChip({ location, className }: { location: string; className?: string }) {
  return (
    <GlassPill tone="dark" className={cn("h-icon-button-sm gap-sm self-start px-lg", className)}>
      <Icon name="map-pin" size="sm" tone="inverse" />
      <Text variant="caption" tone="inverse" accessibilityLabel={`Location: ${location}`}>
        {location}
      </Text>
    </GlassPill>
  );
}
