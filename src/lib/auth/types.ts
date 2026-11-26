export type User = {
  id: string;
  /** Full name, or the email when the account has no name. */
  name: string;
  firstName: string | null;
  email: string;
  /** Profile photo (e.g. from Google), or null when Clerk only has its default image. */
  imageUrl: string | null;
};

/** Which flow the email code finishes: a new account, or a new-device sign-in check. */
export type CodeFlow = "sign-up" | "sign-in";

/** A failed request. `field` names the form field the message belongs to, if any. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly field?: "name" | "email" | "password" | "code",
  ) {
    super(message);
  }
}
