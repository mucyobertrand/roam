import { Fragment } from "react";
import { View } from "react-native";

import { Divider, Icon, PressableScale, Text, type IconName } from "@/components/ui";

export type SettingsRow = { label: string; icon: IconName; onPress: () => void; hint?: string };

/** A titled group of link rows on a white inset list (profile.png's Account and Preferences). */
export function SettingsSection({ title, rows }: { title: string; rows: SettingsRow[] }) {
  return (
    <View className="gap-sm rounded-xl bg-surface-muted p-sm" style={{ borderCurve: "continuous" }}>
      <Text variant="title" accessibilityRole="header" className="px-md pt-sm">
        {title}
      </Text>
      <View className="rounded-lg bg-surface" style={{ borderCurve: "continuous" }}>
        {rows.map((row, i) => (
          <Fragment key={row.label}>
            {i > 0 && (
              // Inset to start under the label: tile width + row gap.
              <View className="flex-row px-md">
                <View className="w-icon-button-sm mr-lg" />
                <Divider className="flex-1" />
              </View>
            )}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={row.label}
              accessibilityHint={row.hint}
              onPress={row.onPress}
              className="flex-row items-center gap-lg px-md py-sm"
            >
              <View className="size-icon-button-sm items-center justify-center rounded-md bg-surface-muted" style={{ borderCurve: "continuous" }}>
                <Icon name={row.icon} />
              </View>
              <Text variant="body" tone="default" className="flex-1">
                {row.label}
              </Text>
              <Icon name="chevron-right" size="sm" />
            </PressableScale>
          </Fragment>
        ))}
      </View>
    </View>
  );
}
