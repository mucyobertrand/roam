import { useAuth as useClerkAuth, useClerk, useSignIn, useSignUp, useUser } from "@clerk/expo";
import { useSSO } from "@clerk/expo/experimental";
import { useMemo } from "react";

import { check, toAuthError } from "./clerk-errors";
import { AuthError, type User } from "./types";

const normalize = (email: string) => email.trim().toLowerCase();

/** "Ada Lovelace King" → first "Ada", last "Lovelace King". */
function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || undefined };
}

const SIGN_UP_EXPIRED = "Your sign-up expired. Please start again.";
const SIGN_IN_EXPIRED = "Your sign-in expired. Please start again.";

/**
 * roam's auth API, backed by Clerk (Core 3 "future" custom-flow hooks). Screens use only this.
 *
 * - Sign-up: password → email code → session.
 * - Sign-in: password → session, or password → email code → session when Clerk asks for a
 *   new-device check (device trust) or an email second factor.
 */
export function useAuth() {
  const { isLoaded: authLoaded, isSignedIn } = useClerkAuth();
  const { isLoaded: userLoaded, user: clerkUser } = useUser();
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const { startSSOFlow } = useSSO();

  const user = useMemo<User | null>(() => {
    if (!clerkUser) return null;
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    return {
      id: clerkUser.id,
      name: clerkUser.fullName?.trim() || email,
      firstName: clerkUser.firstName?.trim() || null,
      email,
      imageUrl: clerkUser.hasImage ? clerkUser.imageUrl : null,
    };
  }, [clerkUser]);

  /** Whether the sign-in waits for an emailed code before it can finish. */
  const signInNeedsEmailCode = () =>
    (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") &&
    signIn.supportedSecondFactors.some((f) => f.strategy === "email_code");

  return {
    /**
     * False until Clerk has restored (or ruled out) a saved session. A failed load (e.g. a
     * cold start offline) also counts as settled, signed out, so the app never hangs on the
     * splash; Clerk keeps retrying, and the route guards follow once it recovers.
     */
    isLoaded: (authLoaded && userLoaded) || clerk.status === "error",
    isSignedIn: !!isSignedIn,
    user,

    /** Creates the account and emails a verification code. */
    async signUp(input: { name: string; email: string; password: string }) {
      check(await signUp.password({ emailAddress: normalize(input.email), password: input.password, ...splitName(input.name) }));
      check(await signUp.verifications.sendEmailCode());
    },

    async resendSignUpCode() {
      if (!signUp.id) throw new AuthError(SIGN_UP_EXPIRED);
      check(await signUp.verifications.sendEmailCode());
    },

    /** Confirms the email and starts the session. */
    async verifySignUp(code: string) {
      if (!signUp.id) throw new AuthError(SIGN_UP_EXPIRED);
      check(await signUp.verifications.verifyEmailCode({ code }));
      if (signUp.status !== "complete") throw new AuthError("We couldn't finish creating your account. Please contact support.");
      check(await signUp.finalize());
    },

    /** Resolves "complete" when signed in, or "needs_code" when Clerk emailed a code to confirm. */
    async signIn(input: { email: string; password: string }): Promise<"complete" | "needs_code"> {
      check(await signIn.password({ identifier: normalize(input.email), password: input.password }));
      if (signIn.status === "complete") {
        check(await signIn.finalize());
        return "complete";
      }
      if (signInNeedsEmailCode()) {
        check(await signIn.mfa.sendEmailCode());
        return "needs_code";
      }
      throw new AuthError("This account needs a sign-in step roam doesn't support yet. Please contact support.");
    },

    async resendSignInCode() {
      if (!signInNeedsEmailCode()) throw new AuthError(SIGN_IN_EXPIRED);
      check(await signIn.mfa.sendEmailCode());
    },

    /** Confirms the new-device code and starts the session. */
    async verifySignIn(code: string) {
      if (!signInNeedsEmailCode()) throw new AuthError(SIGN_IN_EXPIRED);
      check(await signIn.mfa.verifyEmailCode({ code }));
      if (signIn.status !== "complete") throw new AuthError("We couldn't finish signing you in. Please contact support.");
      check(await signIn.finalize());
    },

    /**
     * Google OAuth in the system browser sheet (redirects to roamapp://sso-callback). Signs in
     * an existing account or creates one, and activates the session. "cancelled" when the
     * guest closes the sheet.
     */
    async signInWithGoogle(): Promise<"complete" | "cancelled"> {
      try {
        const { createdSessionId, authSessionResult } = await startSSOFlow({ strategy: "oauth_google" });
        return authSessionResult?.type === "success" && createdSessionId ? "complete" : "cancelled";
      } catch (error) {
        throw toAuthError(error);
      }
    },

    /** Whether a code flow is still in progress (false after a reload or once it finished). */
    hasPendingCode(flow: "sign-up" | "sign-in") {
      return flow === "sign-up" ? !!signUp.id && signUp.status !== "complete" : signInNeedsEmailCode();
    },

    signOut: () => clerk.signOut(),
  };
}
