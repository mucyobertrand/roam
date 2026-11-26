import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Alert, Button, Text } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { AuthError, useAuth } from "@/lib/auth";
import { spacing } from "@/theme/tokens";

import { GlassPill } from "./glass-pill";
import { LocationChip } from "./location-chip";
import { PageIndicator } from "./page-indicator";
import { Sheet } from "./sheet";
import { slides, type Slide } from "./slides";

const googleMark = require("@/assets/images/brand/google-g.png");

function goToSignUp() {
  router.push("/sign-up");
}

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // Pages are sized from the screen's measured layout, not the window: with Android
  // edge-to-edge the window height excludes the status bar, so pages came up short.
  const [size, setSize] = useState({ width: window.width, height: window.height });
  const { width, height } = size;
  const listRef = useRef<FlatList<Slide>>(null);
  const [page, setPage] = useState(0);
  // Height of the fixed button block, so each page's sheet leaves room for it.
  const [actionsHeight, setActionsHeight] = useState(0);
  const { signInWithGoogle } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const continueWithGoogle = async () => {
    setGoogleError(null);
    setGoogleBusy(true);
    try {
      if ((await signInWithGoogle()) === "complete") router.replace("/home");
    } catch (error) {
      setGoogleError(error instanceof AuthError ? error.message : "Something went wrong. Please try again.");
    } finally {
      setGoogleBusy(false);
    }
  };

  useEffect(() => {
    Image.prefetch(slides.map((slide) => slide.image));
  }, []);

  const isLast = page === slides.length - 1;

  const next = () => {
    if (isLast) return goToSignUp();
    const index = page + 1;
    listRef.current?.scrollToIndex({ index, animated: true });
    setPage(index);
  };

  return (
    <View
      className="flex-1 bg-surface"
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <StatusBar style="dark" />

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(slide) => slide.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index }) => (
          <OnboardingPage
            slide={item}
            index={index}
            width={width}
            height={height}
            bottomSpace={actionsHeight}
          />
        )}
      />

      {/* Fixed chrome: wordmark and Skip stay put while pages swipe underneath. */}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 top-0 flex-row items-center justify-between px-2xl"
        style={{ paddingTop: insets.top + spacing.sm }}
      >
        <Wordmark size="md" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip"
          accessibilityHint="Skips the introduction and opens account creation"
          onPress={goToSignUp}
          className="active:opacity-70"
        >
          <GlassPill tone="light" className="h-control-sm px-xl">
            <Text variant="button">Skip</Text>
          </GlassPill>
        </Pressable>
      </View>

      <View
        pointerEvents="box-none"
        onLayout={(e) => setActionsHeight(e.nativeEvent.layout.height)}
        className="absolute inset-x-0 bottom-0 gap-md px-2xl pt-lg"
        style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}
      >
        {googleError && <Alert tone="error" message={googleError} onDismiss={() => setGoogleError(null)} />}
        <Button
          title={isLast ? "Get started": "Continue"}
          trailingIcon="arrow-right"
          accessibilityHint={isLast ? "Opens account creation" : "Shows the next page"}
          onPress={next}
        />
        <Button
          title="Continue with Google"
          variant="secondary"
          leading={
            <View className="size-icon-md">
              <Image source={googleMark} accessible={false} style={{ width: "100%", height: "100%" }} />
            </View>
          }
          loading={googleBusy}
          onPress={continueWithGoogle}
        />
      </View>
    </View>
  );
}

function OnboardingPage({
  slide,
  index,
  width,
  height,
  bottomSpace,
}: {
  slide: Slide;
  index: number;
  width: number;
  height: number;
  bottomSpace: number;
}) {
  return (
    // overflow-hidden: each page's sheet cap overhangs its edges slightly; without
    // clipping, the next page's overhang paints a white strip on this page's right edge.
    <View className="overflow-hidden bg-border" style={{ width, height }}>
      <Image
        source={slide.image}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        accessible={false}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <View className="flex-1 justify-end">
        <LocationChip location={slide.location} className="mb-2xl ml-2xl" />
        <Sheet>
          <View className="gap-lg px-2xl pt-3xl" style={{ paddingBottom: bottomSpace }}>
            <View className="px-xs">
              <PageIndicator count={slides.length} active={index} />
            </View>
            <View className="gap-md px-xs">
              <Text
                variant="hero"
                accessibilityRole="header"
                // Even line lengths, like the design ("Find a stay that / fits your story").
                textBreakStrategy="balanced"
                className="text-balance"
              >
                {slide.title}
              </Text>
              <Text variant="body">{slide.body}</Text>
            </View>
          </View>
        </Sheet>
      </View>
    </View>
  );
}
