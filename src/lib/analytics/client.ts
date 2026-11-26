import Constants from "expo-constants";
import PostHog from "posthog-react-native";

const projectToken = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isConfigured = Boolean(projectToken && host);

if (__DEV__ && !projectToken) {
  throw new Error(
    "POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_PROJECT_TOKEN is configured",
  );
}

if (__DEV__ && !host) {
  throw new Error(
    "POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_HOST is configured",
  );
}

/** The one PostHog client, configured from Expo app config extras. */
export const posthog = isConfigured
  ? new PostHog(projectToken!, {
      host: host!,
      logs: {
        serviceName: "roam-app",
        environment: __DEV__ ? "development" : "production",
        serviceVersion: Constants.expoConfig?.version,
      },
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          // Console logs are not part of this app's error-monitoring scope.
          console: [],
        },
      },
    })
  : null;

/** Runs a PostHog call, swallowing any failure: analytics never breaks the app. */
export function withClient(run: (client: PostHog) => unknown) {
  if (!posthog) return;
  try {
    const result = run(posthog);
    if (result instanceof Promise) result.catch(() => {});
  } catch {
    // ignore
  }
}
