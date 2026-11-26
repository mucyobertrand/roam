import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, type ReactNode } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StayList } from "@/components/stay-list";
import { Alert, Button, Chip, Icon, PressableScale, Text } from "@/components/ui";
import { trackSearch } from "@/lib/analytics";
import { usePlaces, useSearch } from "@/lib/content/use-search";
import {
  activeChips,
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  hasFilters,
  sortFromParams,
  sortLabels,
  suggestionChips,
  type FilterChip,
  type Filters,
  type SearchParams,
  type Sort,
} from "@/lib/search/filters";
import { pickSearchParams, setSearchState, sourceFromParam, useSearchState, type SearchSource } from "@/lib/search/search-state";
import { paramsForSentence } from "@/lib/search/sentence";
import { colors, spacing } from "@/theme/tokens";

import { SearchField } from "./search-field";
import { PHOTO_ASPECT, StayRow } from "./stay-row";

// Short enough to fit one chip line on a 360-pt-wide screen.
const EXAMPLES = ["Cabins in California", "pet friendly cabin under $300", "beach house for 6 with a pool"];

function goBack() {
  if (router.canGoBack()) router.back();
  else router.navigate("/home");
}

/** The search id last sent to analytics. Read only in effects, so a revisit never resends. */
let lastTrackedId = 0;

/**
 * Search tab, from assets/prompt-imgs/search.png. The search (`q`, the sentence as typed; the
 * filters parsed from it, then edited by chips or the sheet; `sort`) lives in a session store,
 * so switching tabs keeps it. URL params are input: a navigation carrying `at` (Home, the
 * sheet) replaces the stored search. Results come live from Sanity (src/lib/content/search.ts).
 */
export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SearchParams & { focus?: string; at?: string; src?: string }>();
  const state = useSearchState();
  const places = usePlaces();

  // A new search arrived through the URL: store it (once per `at`).
  const incoming = params.at;
  useEffect(() => {
    if (incoming) setSearchState(pickSearchParams(params), sourceFromParam(params.src));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `at` identifies the navigation; params is a new object every render.
  }, [incoming]);

  const filters = useMemo(() => filtersFromParams(state.params), [state.params]);
  const sort = sortFromParams(state.params);
  const q = state.params.q ?? "";
  const searching = q !== "" || hasFilters(filters);

  const runSentence = (text: string, source: SearchSource) => setSearchState(pickSearchParams(paramsForSentence(text, places)), source);
  const openSheet = () => router.push({ pathname: "/search-filters", params: { q: state.params.q, ...filtersToParams(filters), sort } });
  const contentStyle = { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.lg };

  const header = (
    <View className="flex-row items-center gap-md px-xl">
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        className="size-control-md items-center justify-center rounded-full bg-surface-muted"
      >
        <Icon name="chevron-left" />
      </PressableScale>
      {/* key: a new sentence from Home or an example resets the field to it. */}
      <SearchField
        key={q}
        initialValue={q}
        autoFocus={!searching || params.focus === "1"}
        onSubmit={(text) => runSentence(text, "sentence")}
        onOpenFilters={openSheet}
      />
    </View>
  );

  if (!searching) {
    return (
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerClassName="grow gap-lg"
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {header}
        <View className="gap-lg px-xl pt-sm">
          <View className="gap-xs">
            <Text variant="title">Describe your stay in one sentence</Text>
            <Text variant="body">
              Price, guests, pets, type, amenities and place are matched exactly; words like quiet or cozy rank the results.
            </Text>
          </View>
          <View className="items-start gap-sm">
            {EXAMPLES.map((example) => (
              <Chip key={example} label={example} icon="sparkles" size="filter" onPress={() => runSentence(example, "example")} />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <SearchResults
      header={header}
      contentStyle={contentStyle}
      q={q}
      filters={filters}
      sort={sort}
      searchId={state.id}
      source={state.source}
      onOpenSheet={openSheet}
      onSetFilters={(next) =>
        setSearchState({ q: state.params.q, sort: state.params.sort, ...pickSearchParams(filtersToParams(next)) }, "chip")
      }
      onClearSearch={() => runSentence("", "chip")}
    />
  );
}

type ResultsProps = {
  header: ReactNode;
  contentStyle: { paddingTop: number; paddingBottom: number };
  q: string;
  filters: Filters;
  sort: Sort;
  searchId: number;
  source: SearchSource;
  onOpenSheet: () => void;
  onSetFilters: (next: Filters) => void;
  onClearSearch: () => void;
};

/** Chips, count + sort, and the live results with their loading, error and empty states. */
function SearchResults({ header, contentStyle, q, filters, sort, searchId, source, onOpenSheet, onSetFilters, onClearSearch }: ResultsProps) {
  const { stays, error, loading, reload } = useSearch(filters, sort);

  // Send each search once, when its results arrive. Failed requests send nothing.
  const resultCount = stays?.length;
  useEffect(() => {
    if (resultCount === undefined || searchId === lastTrackedId) return;
    lastTrackedId = searchId;
    trackSearch({ filters, sort, source, resultCount });
  }, [resultCount, searchId, filters, sort, source]);

  const chips: (FilterChip & { selected: boolean })[] = [
    ...activeChips(filters).map((c) => ({ ...c, selected: true })),
    ...suggestionChips(filters).map((c) => ({ ...c, selected: false })),
  ];

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="grow gap-lg"
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl refreshing={loading && stays !== undefined} onRefresh={reload} tintColor={colors.ink} colors={[colors.ink]} />
      }
    >
      {header}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-sm px-xl"
        accessibilityLabel="Filters"
        className="grow-0"
      >
        {chips.map((c) => (
          <Chip key={c.key} label={c.label} size="filter" selected={c.selected} onPress={() => onSetFilters(c.toggle(filters))} />
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-between px-xl">
        {stays === undefined ? (
          <ActivityIndicator color={colors.ink} accessibilityLabel="Searching" />
        ) : (
          <Text variant="body" tone="default" accessibilityLiveRegion="polite">
            {stays.length === 1 ? "1 stay" : `${stays.length} stays`}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${sortLabels[sort]}`}
          accessibilityHint="Opens sort and filters"
          onPress={onOpenSheet}
          hitSlop={spacing.sm}
          className="flex-row items-center gap-xs active:opacity-70"
        >
          <Text variant="caption" tone="muted">
            Sort by
          </Text>
          <Text variant="caption" emphasis>
            {sortLabels[sort]}
          </Text>
          <Icon name="chevron-down" size="sm" />
        </Pressable>
      </View>

      {stays === undefined ? (
        error ? (
          <View className="gap-md px-xl">
            <Alert tone="error" message="We couldn't search stays. Check your connection and try again." />
            <Button title="Retry" variant="secondary" loading={loading} onPress={reload} />
          </View>
        ) : (
          <ResultsLoading />
        )
      ) : (
        <>
          {error && (
            <View className="px-xl">
              <Alert tone="error" message="Couldn't refresh. Showing results from earlier." />
            </View>
          )}
          {stays.length > 0 ? (
            // key: a new sentence replays the first-load entrance; chip/sort changes reflow.
            <StayList
              key={q}
              variant="row"
              stays={stays}
              renderItem={(stay) => <StayRow stay={stay} filters={filters} />}
              className="px-xl"
            />
          ) : (
            <View className="items-start gap-md px-xl">
              <Text variant="title">No stays match all of that</Text>
              <Text variant="body">
                {`Nothing fits ${activeChips(filters)
                  .map((c) => c.label)
                  .join(", ")} together. Try removing one of them.`}
              </Text>
              <View className="flex-row gap-sm">
                <Button
                  title="Clear filters"
                  variant="secondary"
                  size="sm"
                  onPress={() => onSetFilters({ ...EMPTY_FILTERS, softWords: filters.softWords })}
                />
                <Button title="Clear search" variant="ghost" size="sm" onPress={onClearSearch} />
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

/** Two row-shaped placeholders: the photo (40% of the row, capped by its token) and text lines. */
function ResultsLoading() {
  return (
    <View className="gap-lg px-xl" accessibilityLabel="Loading stays" accessible>
      {[0, 1].map((i) => (
        <View key={i} className="flex-row gap-md">
          <View
            className="max-w-result-photo-w rounded-lg bg-surface-muted"
            style={{ width: "40%", aspectRatio: PHOTO_ASPECT, borderCurve: "continuous" }}
          />
          <View className="flex-1 gap-sm pt-xs">
            <View className="h-lg w-4/5 rounded-sm bg-surface-muted" />
            <View className="h-md w-3/5 rounded-sm bg-surface-muted" />
            <View className="h-md w-2/5 rounded-sm bg-surface-muted" />
          </View>
        </View>
      ))}
    </View>
  );
}
