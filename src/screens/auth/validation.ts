import { router } from "expo-router";

import { AuthError } from "@/lib/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

export const validators = {
  name: (v: string) => (v.trim() ? undefined : "Enter your full name."),
  email: (v: string) => {
    if (!v.trim()) return "Enter your email address.";
    return EMAIL.test(v.trim()) ? undefined : "Enter a valid email address.";
  },
  newPassword: (v: string) => (v.length >= MIN_PASSWORD ? undefined : `Use at least ${MIN_PASSWORD} characters.`),
  password: (v: string) => (v ? undefined : "Enter your password."),
};

/** Routes a failed request to its field when it names one, otherwise to the form-level message. */
export function showAuthError(
  error: unknown,
  setFieldError: (field: NonNullable<AuthError["field"]>, message: string) => void,
  setFormError: (message: string) => void,
) {
  if (error instanceof AuthError && error.field) setFieldError(error.field, error.message);
  else setFormError(error instanceof AuthError ? error.message : "Something went wrong. Please try again.");
}

/** Leaves the auth flow for the signed-in home, so Back can't return to the forms. */
export function goHome() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/home");
}

