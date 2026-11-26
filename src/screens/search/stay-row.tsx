import { Image } from "expo-image";
import { router } from "expo-router";
import { View } from "react-native";

import { Badge, Icon, PressableScale, Text, type IconName } from "@/components/ui";
import { amenityIcons, amenityLabels, type Stay } from "@/data/stays";
import { withClient } from "@/lib/analytics/client";
import { useSaved } from "@/lib/saved";
import type { Filters } from "@/lib/search/filters";

/**
 * Two badges, as in search.png: amenities the guest filtered on first, then the stay's lead
 * amenity, then Pet Friendly, then its other amenities.
 */
function badgesFor(stay: Stay, filters: Filters): { label: string; icon: IconName }[] {
  const matched = filters.amenities.filter((a) => stay.amenities.includes(a));
  const rest = stay.amenities.filter((a) => !matched.includes(a));
  const amenity = (a: Stay["amenities"][number]) => ({ label: amenityLabels[a], icon: amenityIcons[a] });
  return [
    ...matched.map(amenity),
    ...rest.slice(0, 1).map(amenity),
    ...(stay.petsAllowed ? [{ label: "Pet Friendly", icon: "paw" as const }] : []),
    ...rest.slice(1).map(amenity),
  ].slice(0, 2);
}

// The design's photo is 140 × 148 at a 390-pt width: 40% of the row, capped at that size on
// wider screens (tokens result-photo-w/h), so narrow phones keep room for the text.
export const PHOTO_ASPECT = 140 / 148;

/**
 * A search result row from search.png: photo, title + heart, place, rating, badges, price.
 * Responsive: the photo scales with the screen, titles take up to 3 lines, and badges stay on
 * one line (a second badge that doesn't fit is hidden rather than wrapping).
 */
export function StayRow({ stay, filters }: { stay: Stay; filters: Filters }) {
  const [saved, toggleSaved] = useSaved(stay.id);
  const openStay = () => {
    withClient((posthog) => posthog.capture("stay_opened", { stay_id: stay.id, stay_type: stay.type, source: "search" }));
    router.push({ pathname: "/stay/[id]", params: { id: stay.id } });
  };
  const toggleSave = () => {
    withClient((posthog) => posthog.capture(saved ? "stay_unsaved" : "stay_saved", { stay_id: stay.id, stay_type: stay.type, source: "search" }));
    toggleSaved();
  };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${stay.title}, ${stay.city}, ${stay.region}, rated ${stay.rating}, $${stay.pricePerNight} a night`}
      accessibilityHint="Opens the stay"
      onPress={openStay}
      className="flex-row gap-md"
    >
      <View
        className="max-w-result-photo-w self-start overflow-hidden rounded-lg bg-surface-muted"
        style={{ width: "40%", aspectRatio: PHOTO_ASPECT, borderCurve: "continuous" }}
      >
        <Image source={{ uri: stay.image }} contentFit="cover" transition={200} accessible={false} style={{ width: "100%", height: "100%" }} />
      </View>

      <View className="flex-1 gap-xs">
        {/* The heart is pinned top-right so a one-line title doesn't push the rest down. */}
        <View>
          <Text variant="title" numberOfLines={3} className="pr-control-sm mr-sm">
            {stay.title}
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={saved ? `Remove ${stay.title} from saved` : `Save ${stay.title}`}
            accessibilityState={{ selected: saved }}
            onPress={toggleSave}
            hitSlop={4}
            className="size-control-sm items-center justify-center rounded-full bg-surface-muted"
            pressableClassName="absolute right-0 top-0"
          >
            <Icon name={saved ? "heart-fill" : "heart"} tone={saved ? "danger" : "default"} />
          </PressableScale>
        </View>

        <View className="flex-row items-center gap-xs">
          <Icon name="map-pin" size="sm" tone="muted" />
          <Text variant="caption" tone="muted" numberOfLines={1} className="flex-1">
            {stay.city}, {stay.region}
          </Text>
        </View>

        <View className="flex-row items-center gap-xs">
          <Icon name="star" size="sm" tone="primary" />
          <Text variant="body" tone="default">
            {stay.rating.toFixed(1)}
          </Text>
          <Text variant="body">({stay.reviewCount})</Text>
        </View>

        <View className="h-badge-pill flex-row flex-wrap gap-xs overflow-hidden">
          {badgesFor(stay, filters).map((b) => (
            <Badge key={b.label} label={b.label} icon={b.icon} size="pill" />
          ))}
        </View>

        <View className="flex-row items-baseline gap-xs">
          <Text variant="price">${stay.pricePerNight}</Text>
          <Text variant="caption" tone="muted">
            / night
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
