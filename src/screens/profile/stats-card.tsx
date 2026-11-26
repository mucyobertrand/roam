import type { ReactNode } from "react";
import { View } from "react-native";

import { Icon, PressableScale, Text } from "@/components/ui";

type StatProps = { value: string; label: string; accessibilityLabel: string; leading?: ReactNode; onPress?: () => void };

function Stat({ value, label, accessibilityLabel, leading, onPress }: StatProps) {
  const content = (
    <>
      <View className="flex-row items-center gap-xs">
        {leading}
        <Text variant="stat">{value}</Text>
      </View>
      <Text variant="body">{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        pressableClassName="flex-1"
        className="items-center gap-xs"
      >
        {content}
      </PressableScale>
    );
  }
  return (
    <View className="flex-1 items-center gap-xs" accessible accessibilityLabel={accessibilityLabel}>
      {content}
    </View>
  );
}

const Rule = () => <View className="my-xs w-px bg-border" />;

/** Trips, Saved and Rating (profile.png). Trips is 0 until bookings exist; guests have no rating yet. */
export function StatsCard({ trips, saved, onTripsPress }: { trips: number; saved: number; onTripsPress: () => void }) {
  return (
    <View className="flex-row rounded-xl border border-border bg-surface py-lg" style={{ borderCurve: "continuous" }}>
      <Stat value={String(trips)} label="Trips" accessibilityLabel={`${trips} ${trips === 1 ? "trip" : "trips"}`} onPress={onTripsPress} />
      <Rule />
      <Stat value={String(saved)} label="Saved" accessibilityLabel={`${saved} saved`} />
      <Rule />
      <Stat value="–" label="Rating" accessibilityLabel="No rating yet" leading={<Icon name="star" tone="primary" />} />
    </View>
  );
}
