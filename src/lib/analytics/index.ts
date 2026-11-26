import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

import { withClient } from "./client";

export { trackSearch } from "./search";

/**
 * Ties PostHog's person to the Clerk user id (never email or name) while signed in, and
 * resets it on sign-out. Mount once, in the root layout.
 */
export function useAnalyticsIdentity() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const userId = isSignedIn ? user?.id : undefined;
  const email = user?.email;
  const firstName = user?.firstName;
  const name = user?.name;

  useEffect(() => {
    if (!isLoaded) return;
    if (userId) {
      withClient((p) =>
        p.identify(userId, {
          $set: {
            ...(email ? { email } : {}),
            ...(firstName ? { first_name: firstName } : {}),
            ...(name && name !== email ? { name } : {}),
          },
        }),
      );
    } else withClient((p) => p.reset());
  }, [email, firstName, isLoaded, name, userId]);
}
