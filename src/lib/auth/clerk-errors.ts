import { isClerkAPIResponseError } from "@clerk/expo";

import { AuthError } from "./types";

const GENERIC = "Something went wrong. Please try again.";

type ClerkErrorLike = { code?: string; message?: string; longMessage?: string };

/** The first API error if Clerk returned a list, otherwise the error itself. */
function firstError(error: unknown): ClerkErrorLike {
  if (isClerkAPIResponseError(error) && error.errors.length > 0) return error.errors[0];
  if (error && typeof error === "object") return error as ClerkErrorLike;
  return {};
}

/** Maps a Clerk error to roam's copy and the form field it belongs to. */
export function toAuthError(error: unknown): AuthError {
  const { code = "", message, longMessage } = firstError(error);
  const clerkCopy = longMessage ?? message ?? GENERIC;

  switch (code) {
    case "form_identifier_exists":
      return new AuthError("An account with this email already exists.", "email");
    case "form_identifier_not_found":
    case "form_password_incorrect":
      // One message for both, so the form doesn't reveal which emails have accounts.
      return new AuthError("Email or password is incorrect.");
    case "form_code_incorrect":
      return new AuthError("That code isn't right. Check your email and try again.", "code");
    case "verification_expired":
      return new AuthError("That code expired. Tap Resend to get a new one.", "code");
    case "oauth_access_denied":
      return new AuthError("Google sign-in was cancelled.");
    case "external_account_exists":
      return new AuthError("This Google account is already linked to another roam account.");
    case "form_param_format_invalid":
      return new AuthError("Enter a valid email address.", "email");
  }
  if (code.startsWith("form_password")) return new AuthError(clerkCopy, "password");
  return new AuthError(clerkCopy);
}

/** Throws the mapped error when a Clerk future-API call resolved with `{ error }`. */
export function check(result: { error: unknown }) {
  if (result.error) throw toAuthError(result.error);
}
