import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import "../global.css";

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider } from "posthog-react-native";
import { useEffect } from "react";

import { useAnalyticsIdentity } from "@/lib/analytics";
import { posthog, withClient } from "@/lib/analytics/client";
import { useAuth } from "@/lib/auth";
import { radius } from "@/theme/tokens";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.local.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server.");
}

SplashScreen.preventAutoHideAsync();

/**
 * Routes guarded by the Clerk session. Waits for Clerk to restore a saved session before
 * rendering, so a returning guest never sees onboarding flash.
 */
function RootStack({ fontsReady }: { fontsReady: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  useAnalyticsIdentity();
  const ready = fontsReady && isLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    withClient((client) => client.screen(pathname));
  }, [pathname]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sso-callback" />
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="stay/[id]" />
        <Stack.Screen name="stay-ask" />
        {["search-filters", "stay-policies", "stay-host", "roam-policies"].map((name) => (
          <Stack.Screen
            key={name}
            name={name}
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.85],
              sheetGrabberVisible: true,
              sheetCornerRadius: radius.xl,
            }}
          />
        ))}
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="design-system" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Keep the splash screen up until fonts resolve; on failure, render with system fonts.
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {posthog ? (
        <PostHogProvider client={posthog} autocapture={{ captureScreens: false }}>
          <RootStack fontsReady={loaded || !!error} />
        </PostHogProvider>
      ) : (
        <RootStack fontsReady={loaded || !!error} />
      )}
    </ClerkProvider>
  );
}