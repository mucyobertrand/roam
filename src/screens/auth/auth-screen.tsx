import { router, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton, Text } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { spacing } from "@/theme/tokens";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/onboarding");
}

export type AuthScreenProps = {
  title: string;
  /** String or rich text (e.g. with the email in bold). */
  subtitle: ReactNode;
  /** Footer link to the other auth screen, e.g. "Already have an account?" / "Sign in". */
  footer?: { prompt: string; label: string; href: Href };
  children?: ReactNode;
};

/**
 * Shared layout for the auth screens, from assets/prompt-imgs/auth.png: back button and
 * small wordmark, title, subtitle, form, and a footer link. Scrolls and moves above the
 * keyboard so the focused field stays visible.
 */
export function AuthScreen({ title, subtitle, footer, children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="grow gap-2xl px-2xl"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="flex-row items-center justify-between">
          <IconButton icon="chevron-left" accessibilityLabel="Back" variant="outline" onPress={goBack} />
          <Wordmark size="sm" className="self-center mt-0" />
        </View>

        <View className="gap-md">
          <Text variant="hero-sm" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body">{subtitle}</Text>
        </View>

        <View className="flex-1 gap-lg">{children}</View>

        {footer && (
          <View className="flex-row flex-wrap items-center justify-center gap-xs">
            <Text variant="caption" tone="muted">
              {footer.prompt}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace(footer.href)}
              hitSlop={spacing.sm}
              className="active:opacity-70"
            >
              <Text variant="caption" className="underline">
                {footer.label}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
