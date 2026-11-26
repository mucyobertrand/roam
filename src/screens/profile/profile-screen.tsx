import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PolicyCard } from "@/components/policy-card";
import { Alert, Button, IconButton } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { useAuth } from "@/lib/auth";
import { useSavedCount } from "@/lib/saved";
import { spacing } from "@/theme/tokens";

import { ComingSoonNotice, useComingSoon } from "./coming-soon";
import { ProfileCard } from "./profile-card";
import { SettingsSection } from "./settings-section";
import { StatsCard } from "./stats-card";

/** No bookings exist yet. */
const TRIPS = 0;

const openTrips = () => router.navigate("/trips");

/**
 * Profile tab, from assets/prompt-imgs/profile.png, with real data only (see prompts/13-profile.md).
 * Sign out isn't in the design; it sits last.
 */
export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const saved = useSavedCount();
  const comingSoon = useComingSoon();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/onboarding");
    } catch {
      setError("Couldn't sign out. Check your connection and try again.");
      setSigningOut(false);
    }
  };

  const soon = (label: string) => () => comingSoon.show(label);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-lg px-xl"
        contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.lg }}
      >
        <View className="flex-row items-start justify-between">
          <Wordmark size="home" className="mt-md" />
          <IconButton icon="settings" accessibilityLabel="Settings" onPress={soon("Settings")} />
        </View>

        <ProfileCard user={user} />
        <StatsCard trips={TRIPS} saved={saved} onTripsPress={openTrips} />

        <SettingsSection
          title="Account"
          rows={[
            { label: "Personal info", icon: "user", onPress: soon("Personal info") },
            { label: "Payment methods", icon: "credit-card", onPress: soon("Payment methods") },
            { label: "Trips", icon: "suitcase", onPress: openTrips, hint: "Opens the Trips tab" },
          ]}
        />
        <SettingsSection
          title="Preferences"
          rows={[
            { label: "Notifications", icon: "bell", onPress: soon("Notifications") },
            { label: "Help & support", icon: "help", onPress: soon("Help & support") },
          ]}
        />

        <PolicyCard
          icon="document"
          title="Cancellation policies"
          subtitle="See how refunds work on Roam."
          accessibilityHint="Opens Roam's cancellation policies"
          onPress={() => router.push("/roam-policies")}
        />

        {error && <Alert tone="error" message={error} onDismiss={() => setError(null)} />}
        <Button title="Sign out" variant="secondary" loading={signingOut} onPress={handleSignOut} className="mt-sm" />
      </ScrollView>
      <ComingSoonNotice message={comingSoon.message} />
    </View>
  );
}
