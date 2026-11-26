import { Image } from "expo-image";
import { View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { User } from "@/lib/auth";

function initials(name: string) {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export type AvatarProps = {
  user: Pick<User, "name" | "imageUrl"> | null;
  /** `lg` 84 (Home header), `xl` 104 (Profile card). */
  size?: "lg" | "xl";
  /** Layout only. */
  className?: string;
};

const sizes = {
  lg: { container: "size-avatar-lg", initials: "heading" },
  xl: { container: "size-avatar-xl", initials: "heading-lg" },
} as const;

/** The guest's profile photo, or their initials on soft yellow (home.png header). Used by Home and Profile. */
export function Avatar({ user, size = "lg", className }: AvatarProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={user ? `${user.name}'s profile photo` : "Profile photo"}
      className={cn(sizes[size].container, "items-center justify-center overflow-hidden rounded-full bg-primary-soft", className)}
    >
      {user?.imageUrl ? (
        <Image source={{ uri: user.imageUrl }} contentFit="cover" style={{ width: "100%", height: "100%" }} transition={150} />
      ) : (
        <Text variant={sizes[size].initials}>{initials(user?.name ?? "")}</Text>
      )}
    </View>
  );
}
