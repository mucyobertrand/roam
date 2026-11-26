import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { Text } from "@/components/ui";

/** Photo height as a share of the width (est. 332 at 390, property-details.png). */
export const GALLERY_ASPECT = 0.85;

type Photo = { url: string; alt: string | null };

/**
 * Full-width photo pager with a "1 / 4" counter. Sized from the measured width (onLayout), not
 * the window, per AGENTS.md. Shows the cover alone until the details arrive.
 */
export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const height = width * GALLERY_ASPECT;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View onLayout={onLayout} className="w-full bg-surface-muted" style={{ aspectRatio: 1 / GALLERY_ASPECT }}>
      {width > 0 && (
        <FlatList
          data={photos}
          keyExtractor={(p, i) => `${i}:${p.url}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item, index: i }) => (
            <Image
              source={{ uri: item.url }}
              contentFit="cover"
              transition={200}
              accessible
              accessibilityLabel={item.alt ?? `${title}, photo ${i + 1} of ${photos.length}`}
              style={{ width, height }}
            />
          )}
        />
      )}
      {photos.length > 1 && (
        <View
          className="absolute bottom-3xl right-lg rounded-full bg-scrim px-md py-xs"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}
        >
          <Text variant="caption" tone="inverse">
            {`${index + 1} / ${photos.length}`}
          </Text>
        </View>
      )}
    </View>
  );
}
