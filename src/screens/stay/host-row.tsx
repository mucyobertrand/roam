import { Image } from "expo-image";
import { View } from "react-native";

import { Icon, PressableScale, Text } from "@/components/ui";
import type { StayDetails } from "@/lib/content/stays";

export const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

/** The host's photo, or their initial on muted grey. Ringed in white, as on property-details.png. */
export function HostPhoto({ host }: { host: NonNullable<StayDetails["host"]> }) {
  return (
    <View className="size-hero-button items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-surface-muted shadow-card">
      {host.photo ? (
        <Image source={{ uri: host.photo }} contentFit="cover" transition={150} accessible={false} style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text variant="title">{host.name[0]?.toUpperCase()}</Text>
      )}
    </View>
  );
}

/** "Hosted by Maya / Hosting since 2017" with a chevron; opens the host sheet. */
export function HostRow({ host, onPress }: { host: NonNullable<StayDetails["host"]>; onPress: () => void }) {
  const since = host.hostingSince ? `Hosting since ${host.hostingSince}` : "Roam host";
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Hosted by ${host.name}. ${since}`}
      accessibilityHint="Opens more about the host"
      onPress={onPress}
      className="flex-row items-center gap-lg"
    >
      <HostPhoto host={host} />
      <View className="flex-1 gap-xs">
        <Text variant="title">{`Hosted by ${firstName(host.name)}`}</Text>
        <View className="flex-row items-center gap-xs">
          <Icon name="medal" size="sm" tone="muted" />
          <Text variant="caption" tone="muted">
            {since}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" />
    </PressableScale>
  );
}
