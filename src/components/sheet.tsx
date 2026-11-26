import { router } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, View, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconButton, Text, type IconName } from "@/components/ui";
import { spacing } from "@/theme/tokens";

/** Form sheet frame: title with a close button, then a scrolling body. Used by the stay and Roam policy sheets. */
export function SheetFrame({
  title,
  children,
  scrollRef,
}: {
  title: string;
  children: ReactNode;
  scrollRef?: React.RefObject<ScrollViewInstance | null>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between px-xl pb-sm pt-xl">
        <Text variant="heading" accessibilityRole="header" className="flex-1">
          {title}
        </Text>
        <IconButton icon="close" variant="muted" size="sm" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-2xl px-xl py-lg"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** A titled block inside a sheet: accent icon, title, content. */
export function SheetSection({
  icon,
  title,
  children,
  onLayoutY,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  onLayoutY?: (y: number) => void;
}) {
  return (
    <View className="gap-md" onLayout={onLayoutY ? (e) => onLayoutY(e.nativeEvent.layout.y) : undefined}>
      <View className="flex-row items-center gap-sm">
        <Icon name={icon} tone="accent" />
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
