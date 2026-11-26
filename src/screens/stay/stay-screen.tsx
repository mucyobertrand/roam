import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Alert, Button, Divider, Icon, PressableScale, Text, type IconName } from "@/components/ui";
import type { Stay } from "@/data/stays";
import { withClient } from "@/lib/analytics/client";
import { useStay, useStayDetails } from "@/lib/content/use-stays";
import { useSaved } from "@/lib/saved";
import { colors, spacing } from "@/theme/tokens";

import { BookBar } from "./book-bar";
import { Gallery } from "./gallery";
import { Highlights } from "./highlights";
import { HostRow } from "./host-row";
import { PolicyCard } from "@/components/policy-card";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/home");
}

/** A white round button floating on the photo (back, share, heart). */
function HeroButton({ icon, label, onPress, tone }: { icon: IconName; label: string; onPress: () => void; tone?: "default" | "danger" }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-hero-button items-center justify-center rounded-full bg-surface shadow-card"
    >
      <Icon name={icon} tone={tone} />
    </PressableScale>
  );
}

function shareStay(stay: Stay) {
  Share.share({ title: stay.title, message: `${stay.title} in ${stay.city}, ${stay.region} on Roam: roamapp://stay/${stay.id}` })
    .then(() => withClient((posthog) => posthog.capture("stay_shared", { stay_id: stay.id, stay_type: stay.type })))
    .catch(() => {});
}

/**
 * Stay details, from assets/prompt-imgs/property-details.png. Paints at once from the cached
 * `Stay` (Home/Search), then fills photos, the policy cards and the host from `useStayDetails`.
 * Everything shown is the stay's own stored text; nothing is generated here.
 */
export function StayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { stay, error, loading, reload } = useStay(id);
  const details = useStayDetails(id);
  const [saved, toggleSaved] = useSaved(id);
  const [barHeight, setBarHeight] = useState(0);

  if (stay === undefined) {
    return (
      <View className="flex-1 justify-center gap-lg bg-surface px-xl" style={{ paddingTop: insets.top }}>
        {error ? (
          <>
            <Text variant="heading">We couldn&apos;t load this stay</Text>
            <Text variant="body">Check your connection and try again.</Text>
            <Button title="Retry" loading={loading} onPress={reload} />
            <Button title="Back" variant="secondary" onPress={goBack} />
          </>
        ) : (
          <ActivityIndicator color={colors.ink} accessibilityLabel="Loading stay" />
        )}
      </View>
    );
  }

  if (stay === null || details.details === null) {
    return (
      <View className="flex-1 justify-center gap-lg bg-surface px-xl" style={{ paddingTop: insets.top }}>
        <Text variant="heading">We couldn&apos;t find that stay</Text>
        <Text variant="body">It may have been removed. Head back and pick another one.</Text>
        <Button title="Back" variant="secondary" onPress={goBack} />
      </View>
    );
  }

  const d = details.details;
  const photos = d?.photos.length ? d.photos : [{ url: stay.image, alt: null }];
  const openPolicies = (section?: "cancellation") => router.push({ pathname: "/stay-policies", params: { id: stay.id, section } });
  const toggleSave = () => {
    withClient((posthog) => posthog.capture(saved ? "stay_unsaved" : "stay_saved", { stay_id: stay.id, stay_type: stay.type, source: "details" }));
    toggleSaved();
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ paddingBottom: barHeight + spacing.lg }}>
        <View>
          <Gallery photos={photos} title={stay.title} />
          {/* On the photo, scrolling with it (property-details.png). */}
          <View className="absolute left-xl right-xl flex-row items-center justify-between" style={{ top: insets.top + spacing.sm }}>
            <HeroButton icon="chevron-left" label="Back" onPress={goBack} />
            <View className="flex-row gap-md">
              <HeroButton icon="share" label="Share" onPress={() => shareStay(stay)} />
              <HeroButton
                icon={saved ? "heart-fill" : "heart"}
                label={saved ? `Remove ${stay.title} from saved` : `Save ${stay.title}`}
                tone={saved ? "danger" : "default"}
                onPress={toggleSave}
              />
            </View>
          </View>
        </View>

        {/* The body overlaps the photo by its corner radius. */}
        <View className="-mt-2xl gap-xl rounded-t-xl bg-surface px-xl pt-2xl" style={{ borderCurve: "continuous" }}>
          <View className="gap-md">
            <View className="flex-row items-start gap-lg">
              <Text variant="hero-xs" accessibilityRole="header" className="flex-1">
                {stay.title}
              </Text>
              <View
                className="items-center rounded-lg bg-surface-muted px-md py-sm"
                style={{ borderCurve: "continuous" }}
                accessible
                accessibilityLabel={`Rated ${stay.rating.toFixed(1)} from ${stay.reviewCount} reviews`}
              >
                <View className="flex-row items-center gap-xs">
                  <Icon name="star" size="sm" tone="primary" />
                  <Text variant="title">{stay.rating.toFixed(1)}</Text>
                </View>
                <Text variant="caption" tone="muted">{`(${stay.reviewCount})`}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-xs">
              <Icon name="map-pin" size="sm" />
              <Text variant="body" tone="default">{`${stay.city}, ${stay.region}`}</Text>
            </View>
          </View>

          <Highlights stay={stay} />
          <Divider />

          {d === undefined ? (
            details.error ? (
              <View className="gap-md">
                <Alert tone="error" message="We couldn't load the policies and host. Check your connection and try again." />
                <Button title="Retry" variant="secondary" loading={details.loading} onPress={details.reload} />
              </View>
            ) : (
              <View className="gap-md" accessible accessibilityLabel="Loading policies and host">
                <View className="h-hero-button rounded-lg bg-surface-muted" />
                <View className="h-hero-button rounded-lg bg-surface-muted" />
                <View className="h-hero-button rounded-lg bg-surface-muted" />
              </View>
            )
          ) : (
            <>
              <View className="gap-md">
                <PolicyCard
                  icon="chat"
                  tile
                  title="Ask about policies"
                  subtitle="Cancellation, house rules, pets, check-in and more."
                  accessibilityHint="Opens a chat about this stay"
                  onPress={() => router.push({ pathname: "/stay-ask", params: { id: stay.id } })}
                />
                {d.cancellation && (
                  <PolicyCard
                    icon="document"
                    title={d.cancellation.title}
                    subtitle={d.cancellation.summary}
                    accessibilityHint="Opens the full cancellation policy"
                    onPress={() => openPolicies("cancellation")}
                  />
                )}
              </View>
              {d.host && (
                <>
                  <Divider />
                  <HostRow host={d.host} onPress={() => router.push({ pathname: "/stay-host", params: { id: stay.id } })} />
                </>
              )}
            </>
          )}

          <Divider />
          <View className="gap-sm">
            <Text variant="title" accessibilityRole="header">
              About this stay
            </Text>
            <Text variant="body">{stay.description}</Text>
          </View>
        </View>
      </ScrollView>

      <BookBar price={stay.pricePerNight} stayId={stay.id} stayType={stay.type} onHeight={setBarHeight} />
    </View>
  );
}
