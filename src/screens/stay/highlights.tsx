import { View } from "react-native";

import { Icon, Text, type IconName } from "@/components/ui";
import { amenityIcons, amenityLabels, type Stay } from "@/data/stays";

const MAX = 4;

/** Up to 4 highlights from the stay's own fields: Pet Friendly first, then amenities as stored. */
function highlightsOf(stay: Stay): { key: string; icon: IconName; label: string }[] {
  return [
    ...(stay.petsAllowed ? [{ key: "pets", icon: "paw" as IconName, label: "Pet Friendly" }] : []),
    ...stay.amenities.map((a) => ({ key: a, icon: amenityIcons[a], label: amenityLabels[a] })),
  ].slice(0, MAX);
}

/** The icon row under the title, property-details.png. Equal columns; labels wrap at word breaks. */
export function Highlights({ stay }: { stay: Stay }) {
  const items = highlightsOf(stay);
  if (items.length === 0) return null;
  return (
    <View className="flex-row gap-sm" accessibilityRole="list" accessibilityLabel="Highlights">
      {items.map((h) => (
        <View key={h.key} className="flex-1 items-center gap-xs" accessible accessibilityLabel={h.label}>
          <Icon name={h.icon} />
          {/* Long single words ("Workspace") shrink a little at 360 dp instead of breaking mid-word. */}
          <Text variant="caption" tone="default" className="text-center" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {h.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
