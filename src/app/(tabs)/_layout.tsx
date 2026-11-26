import { NativeTabs } from "expo-router/native-tabs";

import { colors, tabLabel } from "@/theme/tokens";

/**
 * The platform's own tab bar (iOS system bar, Android Material 3 bar), themed with tokens.
 * It can't take the custom floating pill drawn in home.png. Tab switches don't animate.
 */
export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.ink}
      iconColor={{ default: colors.inkMuted, selected: colors.ink }}
      indicatorColor={colors.primary}
      backgroundColor={colors.surface}
      labelStyle={{ default: { ...tabLabel, color: colors.inkMuted }, selected: { ...tabLabel, color: colors.ink } }}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_today" />
        <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
