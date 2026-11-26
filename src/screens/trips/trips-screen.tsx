import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Text } from "@/components/ui";
import { spacing } from "@/theme/tokens";

/** Trips tab stub: empty state until bookings exist. */
export function TripsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 gap-2xl bg-surface px-xl" style={{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.lg }}>
      <Text variant="heading-lg" accessibilityRole="header">
        Trips
      </Text>
      <View className="flex-1 items-center justify-center gap-lg">
        <View className="size-avatar-lg items-center justify-center rounded-full bg-lavender-soft">
          <Icon name="suitcase" tone="accent" />
        </View>
        <View className="items-center gap-sm">
          <Text variant="heading">No trips yet</Text>
          <Text variant="body" className="text-center">
            When you book a stay, it shows up here with your dates and check-in details.
          </Text>
        </View>
        <Button title="Find a stay" trailingIcon="arrow-right" onPress={() => router.navigate("/search")} />
      </View>
    </View>
  );
}
