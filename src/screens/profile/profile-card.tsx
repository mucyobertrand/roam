import { View } from "react-native";

import { Avatar } from "@/components/avatar";
import { Icon, Text } from "@/components/ui";
import type { User } from "@/lib/auth";

/**
 * Photo, name and email (profile.png's top card). The design's location line becomes the
 * email, and its "Roam Explorer" badge is left out: Clerk has no location and there are no tiers.
 */
export function ProfileCard({ user }: { user: User | null }) {
  return (
    <View className="flex-row items-center gap-lg rounded-xl bg-surface-muted p-lg" style={{ borderCurve: "continuous" }}>
      <Avatar user={user} size="xl" />
      <View className="flex-1 gap-xs">
        <Text variant="heading" accessibilityRole="header">
          {user?.name ?? ""}
        </Text>
        {!!user?.email && user.email !== user.name && (
          <View className="flex-row items-center gap-xs">
            <Icon name="mail" size="sm" tone="muted" />
            <Text variant="body" className="flex-1">
              {user.email}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
