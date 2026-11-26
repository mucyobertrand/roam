import { Image } from "expo-image";
import { router } from "expo-router";
import { View } from "react-native";

import { Icon, PressableScale, Text } from "@/components/ui";
import type { Stay } from "@/data/stays";
import { withClient } from "@/lib/analytics/client";
import { colors } from "@/theme/tokens";

// Transparent ink → 75% ink, so white text stays readable on any photo.
const PHOTO_SHADE = `linear-gradient(to bottom, ${colors.ink}00 0%, ${colors.scrimStrong} 100%)`;

/**
 * Big photo card from home.png: rating pill, location, title and a chevron over a bottom
 * shade. The whole card opens the stay; the chevron is part of it, not a second target.
 */
export function StayCard({ stay }: { stay: Stay }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${stay.title}, ${stay.city}, ${stay.region}, rated ${stay.rating}`}
      accessibilityHint="Opens the stay"
      onPress={() => {
        withClient((posthog) => posthog.capture("stay_opened", { stay_id: stay.id, stay_type: stay.type, source: "home" }));
        router.push({ pathname: "/stay/[id]", params: { id: stay.id } });
      }}
      className="h-stay-card overflow-hidden rounded-xl bg-surface-muted"
      style={{ borderCurve: "continuous" }}
    >
      <Image
        source={{ uri: stay.image }}
        contentFit="cover"
        transition={200}
        accessible={false}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0 h-3/5"
        style={{ experimental_backgroundImage: PHOTO_SHADE }}
      />

      <View className="absolute right-lg top-lg flex-row items-center gap-xs rounded-full bg-surface px-md py-sm">
        <Icon name="star" size="sm" />
        <Text variant="title">{stay.rating.toFixed(1)}</Text>
      </View>

      <View className="absolute inset-x-0 bottom-0 flex-row items-end gap-md p-xl">
        <View className="flex-1 gap-xs">
          <View className="flex-row items-center gap-xs">
            <Icon name="map-pin" size="sm" tone="inverse" />
            <Text variant="caption" tone="inverse" numberOfLines={1}>
              {stay.city}, {stay.region}
            </Text>
          </View>
          <Text variant="heading" tone="inverse" numberOfLines={2}>
            {stay.title}
          </Text>
        </View>
        <View className="size-control items-center justify-center rounded-full bg-surface">
          <Icon name="chevron-right" />
        </View>
      </View>
    </PressableScale>
  );
}
