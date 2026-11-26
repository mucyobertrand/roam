import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Chip, Icon, IconButton, Stepper, Text } from "@/components/ui";
import { amenityIcons, amenityLabels, stayTypeLabels, type Amenity, type StayType } from "@/data/stays";
import {
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  sortFromParams,
  sortLabels,
  type Filters,
  type SearchParams,
  type Sort,
} from "@/lib/search/filters";
import { withClient } from "@/lib/analytics/client";
import { fetchCount } from "@/lib/content/search";
import { colors, spacing } from "@/theme/tokens";

const SORTS = Object.keys(sortLabels) as Sort[];
const TYPES = Object.keys(stayTypeLabels) as StayType[];
const AMENITIES = Object.keys(amenityLabels) as Amenity[];
const PRICES = [undefined, 150, 200, 300, 500] as const;
const MAX_GUESTS = 12;

const toggle = <T,>(items: T[], item: T) => (items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-md">
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const COUNT_DELAY_MS = 250;

/**
 * How many stays the draft filters match, from a GROQ count() (no embeddings, so no quota),
 * debounced while the guest taps. Keeps the last count while a new one loads; `undefined`
 * until the first answer, or if counting failed.
 */
function useLiveCount(draft: Filters) {
  const [count, setCount] = useState<number>();
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      fetchCount(draft).then(
        (n) => current && setCount(n),
        () => current && setCount(undefined),
      );
    }, COUNT_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [draft]);
  return count;
}

/**
 * Sort + filters sheet (no design yet; built from the design system). Opened from Search's
 * sliders button and "Sort by". Edits a draft, then "Show N stays" applies it to /search.
 */
export function FiltersSheet() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SearchParams>();
  const [draft, setDraft] = useState<Filters>(() => filtersFromParams(params));
  const [sort, setSort] = useState<Sort>(() => sortFromParams(params));
  const count = useLiveCount(draft);

  const update = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));
  const apply = () => {
    withClient((posthog) =>
      posthog.capture("filters_applied", {
        sort,
        stay_types: draft.types,
        amenities: draft.amenities,
        pets: draft.pets,
        has_price: draft.maxPrice !== undefined,
        has_guests: draft.guests !== undefined,
        place_count: draft.places.length,
        soft_word_count: draft.softWords.length,
        result_count: count,
      }),
    );
    router.dismissTo({
      pathname: "/search",
      // q is passed back unchanged; `at` marks this as a new set of filters to apply.
      params: { q: params.q, ...filtersToParams(draft), sort: sort === "best" ? undefined : sort, src: "sheet", at: Date.now().toString() },
    });
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between px-xl pb-sm pt-xl">
        <Text variant="heading" accessibilityRole="header">
          Sort & filters
        </Text>
        <IconButton icon="close" variant="muted" size="sm" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-2xl px-xl py-lg">
        <Section title="Sort by">
          <View className="gap-xs" accessibilityRole="radiogroup">
            {SORTS.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ checked: sort === s }}
                onPress={() => setSort(s)}
                className="h-control-sm flex-row items-center justify-between active:opacity-70"
              >
                <Text variant="body" tone="default" emphasis={sort === s}>
                  {sortLabels[s]}
                </Text>
                {sort === s && <Icon name="check-circle" tone="accent" />}
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Type of stay">
          <View className="flex-row flex-wrap gap-sm">
            {TYPES.map((t) => (
              <Chip key={t} label={stayTypeLabels[t]} size="filter" selected={draft.types.includes(t)} onPress={() => update({ types: toggle(draft.types, t) })} />
            ))}
          </View>
        </Section>

        <Section title="Price per night">
          <View className="flex-row flex-wrap gap-sm">
            {PRICES.map((p) => (
              <Chip
                key={p ?? "any"}
                label={p === undefined ? "Any" : `Under $${p}`}
                size="filter"
                selected={draft.maxPrice === p}
                onPress={() => update({ maxPrice: p })}
              />
            ))}
          </View>
        </Section>

        <Section title="Guests">
          <View className="flex-row items-center justify-between">
            <Text variant="body" tone="default">
              {draft.guests ? `${draft.guests}+ guests` : "Any number"}
            </Text>
            <Stepper
              value={draft.guests ?? 0}
              onChange={(n) => update({ guests: n > 0 ? n : undefined })}
              min={0}
              max={MAX_GUESTS}
              accessibilityLabel="Guests"
            />
          </View>
        </Section>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-sm">
            <Icon name="paw" />
            <Text variant="title">Pet friendly</Text>
          </View>
          <Switch
            accessibilityLabel="Pet friendly"
            value={draft.pets}
            onValueChange={(pets) => update({ pets })}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        <Section title="Amenities">
          <View className="flex-row flex-wrap gap-sm">
            {AMENITIES.map((a) => (
              <Chip
                key={a}
                label={amenityLabels[a]}
                icon={amenityIcons[a]}
                size="filter"
                selected={draft.amenities.includes(a)}
                onPress={() => update({ amenities: toggle(draft.amenities, a) })}
              />
            ))}
          </View>
        </Section>
      </ScrollView>

      <View className="flex-row gap-md border-t border-border px-xl pt-lg" style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
        <Button
          title="Reset"
          variant="secondary"
          onPress={() => {
            setDraft({ ...EMPTY_FILTERS, places: draft.places, softWords: draft.softWords });
            setSort("best");
          }}
        />
        <Button
          title={count === undefined ? "Show stays" : count === 1 ? "Show 1 stay" : `Show ${count} stays`}
          onPress={apply}
          disabled={count === 0}
          className="flex-1"
        />
      </View>
    </View>
  );
}
