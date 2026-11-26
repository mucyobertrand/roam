import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { SearchPill } from "@/components/search-pill";
import { StayList } from "@/components/stay-list";
import { Alert, Button, Chip, Icon, PressableScale, Text, type IconName } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import type { StayType } from "@/data/stays";
import { useAuth } from "@/lib/auth";
import { usePlaces } from "@/lib/content/use-search";
import { useStays } from "@/lib/content/use-stays";
import { paramsForSentence } from "@/lib/search/sentence";
import { colors, spacing } from "@/theme/tokens";

type Category = "all" | StayType;

const categories: { id: Category; label: string; icon: IconName }[] = [
  { id: "all", label: "All Stays", icon: "home-fill" },
  { id: "cabin", label: "Cabins", icon: "cabin" },
  { id: "beach", label: "Beach", icon: "waves" },
  { id: "city", label: "City", icon: "city" },
  { id: "villa", label: "Villas", icon: "villa" },
];

/** Home tab, from assets/prompt-imgs/home.png. */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>("all");
  const { stays, error, loading, reload } = useStays(category === "all" ? null : category);
  const places = usePlaces();
  const label = categories.find((c) => c.id === category)!.label;

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="gap-xl px-xl"
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.lg }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={loading && stays !== undefined} onRefresh={reload} tintColor={colors.ink} colors={[colors.ink]} />}
    >
      <View className="flex-row items-start justify-between">
        <Wordmark size="home" className="mt-md" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={() => router.navigate("/profile")}
          className="active:opacity-80"
        >
          <Avatar user={user} />
        </Pressable>
      </View>

      <View className="gap-xs">
        <Text variant="title" tone="muted" emphasis>
          {user?.firstName ? `Hey, ${user.firstName} 👋` : "Hey there 👋"}
        </Text>
        <View className="flex-row items-center gap-lg">
          <Text variant="hero" accessibilityRole="header" className="flex-1">
            {"Find your\nnext stay"}
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Open search"
            onPress={() => router.navigate({ pathname: "/search", params: { focus: "1" } })}
            className="h-search-tile-h w-search-tile-w items-center justify-center rounded-xl bg-surface-muted"
            style={{ borderCurve: "continuous" }}
          >
            <Icon name="search" />
          </PressableScale>
        </View>
      </View>

      <SearchPill onSubmit={(q) => router.navigate({ pathname: "/search", params: { ...paramsForSentence(q, places), src: "home" } })} />

      <View className="flex-row flex-wrap gap-sm" accessibilityRole="radiogroup" accessibilityLabel="Stay type">
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            icon={c.icon}
            size="lg"
            selected={category === c.id}
            onPress={() => setCategory(c.id)}
          />
        ))}
      </View>

      {stays === undefined ? (
        error ? (
          <LoadError onRetry={reload} retrying={loading} />
        ) : (
          <StaysLoading />
        )
      ) : (
        <>
          {error && <Alert tone="error" message="Couldn't refresh. Showing stays from earlier." />}
          {stays.length === 0 ? (
            <View className="items-start gap-md mt-xs">
              <Text variant="title">{category === "all" ? "No stays yet" : `No ${label.toLowerCase()} yet`}</Text>
              {category !== "all" && (
                <Button title="Show all stays" variant="secondary" size="sm" onPress={() => setCategory("all")} />
              )}
            </View>
          ) : (
            // Remount per category so each one plays the first-load entrance.
            <StayList key={category} stays={stays} className="mt-xs" />
          )}
        </>
      )}
    </ScrollView>
  );
}

/** Two card-sized placeholders while the first request runs. */
function StaysLoading() {
  return (
    <View className="mt-xs gap-2xl" accessibilityLabel="Loading stays" accessible>
      <View className="h-stay-card rounded-xl bg-surface-muted" style={{ borderCurve: "continuous" }} />
      <View className="h-stay-card rounded-xl bg-surface-muted" style={{ borderCurve: "continuous" }} />
    </View>
  );
}

function LoadError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <View className="mt-xs gap-md">
      <Alert tone="error" message="We couldn't load stays. Check your connection and try again." />
      <Button title="Retry" variant="secondary" loading={retrying} onPress={onRetry} />
    </View>
  );
}
