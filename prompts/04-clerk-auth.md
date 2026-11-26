# 04 · Clerk auth

Status: done

## Goal
Guests create a real Clerk account (full name, email, password) and confirm it with the 6-digit email code. They sign in with email and password, and on a new device they also enter an emailed code (Clerk device trust). The session survives app restarts. `/home` can only be reached when signed in, the auth screens and onboarding only when signed out, and Sign out ends the Clerk session. The custom screens from plan 03 stay as they are.

## Decisions
- Clerk app `roam` (dev instance `ins_3MC1a9PAXEAYmLk0oMuY75X6FDt`), already linked through the Clerk CLI (`clerk whoami`). Instance settings change through `clerk config patch`, not by hand.
- SDK: the installed `@clerk/expo` 4.16.1 (Core 3). Custom flows use the default "future" hooks: `useSignUp()` → `{ signUp, errors, fetchStatus }` and `useSignIn()` → `{ signIn, errors, fetchStatus }`. Each method resolves `{ error }` and doesn't throw. No `@clerk/expo/legacy`.
- Sign-up: `signUp.password({ emailAddress, password, firstName, lastName })`, then `signUp.verifications.sendEmailCode()` → `/verify-email?mode=sign-up` → `signUp.verifications.verifyEmailCode({ code })` → `status === "complete"` → `signUp.finalize()`. Resend calls `sendEmailCode()` again.
- Sign-in (user choice: password + code): `signIn.password({ identifier: email, password })`.
  - `complete` → `signIn.finalize()` → home.
  - `needs_client_trust` or `needs_second_factor` with `email_code` → `signIn.mfa.sendEmailCode()` → `/verify-email?mode=sign-in` → `signIn.mfa.verifyEmailCode({ code })` → `finalize()`. Resend calls `mfa.sendEmailCode()` again.
  - Any other status shows a form error ("This account needs a sign-in step roam doesn't support yet. Contact support."). Nothing is silently dropped.
- Names (user choice): enable first and last name in Clerk, both optional (`user_model.first_name/last_name: { enabled: true, required: false }`). "Full name" is split at the first space: first word → `firstName`, the rest → `lastName` (may be empty). `user.name` = Clerk `fullName`, or the email if empty.
- Password (user choice): patch Clerk `auth_password.min_length` from 15 to 8 so it matches the "At least 8 characters" copy. The breached-password (HIBP) checks stay on, so Clerk can still reject a weak 8+ password with a field error.
- Social (user choice): hide the Google and Apple buttons and the "or" divider on both screens. `social-buttons.tsx` stays unused for a later OAuth plan. `signInWithProvider` leaves the auth API. No new dependencies.
- `src/lib/auth/` keeps one public API so screens only touch it:
  `useAuth()` → `{ isLoaded, isSignedIn, user: { id, name, email } | null, signUp, resendSignUpCode, verifySignUp, signIn, resendSignInCode, verifySignIn, signOut }`.
  - `signIn` resolves `"complete" | "needs_code"`.
  - Failures throw the existing `AuthError(message, field?)`. `clerk-errors.ts` maps Clerk error codes to our copy and fields: `form_identifier_exists` → email "An account with this email already exists."; `form_password_pwned`, `form_password_length_too_short`, and other `form_password_*` sign-up codes → password, using Clerk's `longMessage`; `form_code_incorrect` → code "That code isn't right. Check your email and try again."; `verification_expired` → code "That code expired. Tap Resend to get a new one."; `form_identifier_not_found` and `form_password_incorrect` → form "Email or password is incorrect." (no account enumeration); `too_many_requests` and `user_locked` → form, using Clerk's `longMessage`; anything else → Clerk's `longMessage ?? message`, else "Something went wrong. Please try again."
  - `mock-auth.ts`, `MOCK_CODE`, and the mock `AuthProvider` are deleted. `ClerkProvider` is the only provider.
- Persistent sessions: `ClerkProvider tokenCache` from `@clerk/expo/token-cache` (expo-secure-store, already installed). The splash stays up until fonts and Clerk `isLoaded` are both resolved, so a returning user never sees onboarding flash. Clerk's session lifetime stays at 7 days (instance default).
- Protected routes: root `_layout.tsx` uses Expo Router `Stack.Protected`:
  - `guard={isSignedIn}` around `home`.
  - `guard={!isSignedIn}` around `onboarding` and `(auth)`.
  - `index` and `design-system` are unguarded (`design-system` is the dev showcase).
  - `/` still redirects by `isSignedIn`.
- After a session starts, the screens keep calling `goHome()` (dismissAll + replace `/home`) so Back can't return to the forms. Sign out: `await clerk.signOut()`, then `router.replace("/onboarding")`.
- Verify screen: a `mode` param (`sign-up` | `sign-in`) picks the verify and resend calls. The copy stays the same in both modes except the subtitle ending: "verify your account" for sign-up, "finish signing in" for sign-in. If there is no sign-up or sign-in in progress (e.g. after a reload), it shows "Your sign-up expired. Please start again." with a button back to sign-up / sign-in.
- Dev hint: in `__DEV__` the mock hints become Clerk's test-mode hint: "Test email: anything+clerk_test@example.com, code 424242". Clerk dev instances accept those without sending mail.
- Secrets: the app uses only `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`. `CLERK_SECRET_KEY` stays in `.env.local` for later API routes and is never imported in app code. Add `.env.example` with both names and no values.

## Out of scope
Google and Apple OAuth, password reset, the real home screen, API routes and server session checks, PostHog identify, production instance, profile editing.

## Steps
### 1. Configure the Clerk instance
If the Clerk MCP (`clerk-remote`) is connected, check this plan against its current Expo custom-flow guidance and stop to report any conflict. Back up the dev config with `clerk config pull --keys user_model auth_password` into the scratchpad. Then `clerk config patch` with `user_model.first_name` and `last_name` `{ enabled: true, required: false }` and `auth_password.min_length: 8`. Pull again and confirm. Done: the pulled config shows the new values, and nothing else changed.

### 2. Clerk-backed auth module
In `src/lib/auth/`, replace `mock-auth.ts` and `auth-provider.tsx` with `use-auth.ts` (the hook above, built on `useAuth`, `useUser`, `useSignUp`, `useSignIn`, and `useClerk` from `@clerk/expo`), `clerk-errors.ts` (code → `AuthError` map), and `types.ts` (`User`, `AuthError`). Update `index.ts` exports. Done: `npx tsc --noEmit` only reports errors in the screens that still use the old names.

### 3. Root layout, guards, persistence
`src/app/_layout.tsx`: remove `AuthProvider`. Add an inner `RootStack` that reads `isLoaded`/`isSignedIn`, keeps the splash until fonts and Clerk are ready, and declares the `Stack.Protected` groups above. Keep the publishable-key check. `src/app/index.tsx`: unchanged logic, reads the new hook. `src/app/home.tsx`: drop its own redirect (the guard covers it), show `user.name` and email, and sign out through the hook. Done: tsc passes for these files, and a cold start goes straight to onboarding (signed out).

### 4. Screens
- `sign-up-screen.tsx`: call `signUp`, then push `/verify-email?mode=sign-up&email=…`. Remove `SocialButtons`.
- `sign-in-screen.tsx`: on `"complete"` call `goHome()`, on `"needs_code"` push `/verify-email?mode=sign-in&email=…`. Remove `SocialButtons` and update the dev hint.
- `verify-email-screen.tsx`: add the `mode` param, mode-based verify and resend, the expired state, and the dev hint.

Keep layout, tokens, and copy otherwise. Done: tsc, lint, and the token check pass.

### 5. Housekeeping
Add `.env.example`. Remove the "MOCK auth" comments. Update the `/design-system` showcase only if a primitive changed (none expected). Done: `grep -ri "mock" src/lib src/screens src/app` returns nothing relevant.

## Verification
- `npx tsc --noEmit`, `npx expo lint` (or `npx eslint src` on Node <22.13), `node scripts/check-tokens.mjs`, and `npx expo-doctor` pass.
- On Android (BlueStacks + Expo Go via adb, as in plan 03), plus iOS if available:
  1. Sign up with `roam+clerk_test@example.com`: empty submit shows field errors; a 7-character password shows the length error; then code `111111` shows the wrong-code error; Resend unlocks after 30 s; `424242` lands on home with the full name shown.
  2. The user appears in Clerk with first/last name (`clerk users list`).
  3. Sign up again with the same email → "An account with this email already exists." under Email.
  4. Sign out → onboarding. Back doesn't reach home. Deep link `roam://home` while signed out → redirected away.
  5. Sign in with a wrong password → "Email or password is incorrect."
  6. Sign in with the right password → home directly, or via the code screen (`424242`) if Clerk asks for device trust. Both paths are tried by signing in on a second emulator/device.
  7. Kill and relaunch the app → still on home (persistent session). Deep link `roam://sign-in` while signed in → redirected to home.
  8. Sign out, relaunch → onboarding.

## AGENTS.md updates
- Expo section: replace the "Auth is MOCKED…" bullet with: auth is Clerk (`@clerk/expo` Core 3 future hooks) behind `src/lib/auth` `useAuth()`. Screens never import `@clerk/expo` directly. Sessions persist through `tokenCache`. Routes are guarded with `Stack.Protected` in the root layout. Dev testing uses `+clerk_test` emails with code `424242`.
- Who owns what → Auth: Clerk instance settings change through `clerk config patch` (currently first/last name optional, min password 8, device trust on: sign-in may need an email code).
- Remove the mock credentials line.

## Result
- Built as planned. Clerk dev instance patched with `clerk config patch` (backup of the old `user_model`/`auth_password` in the session scratchpad): first/last name optional, min password 8.
- Added beyond the plan: `useAuth().isLoaded` also counts Clerk `status === "error"` as settled, so a failed first load renders signed-out instead of hanging on the splash. Found because the very first launch after `pm clear` sat on the splash with Clerk status `error`; it never reproduced after that (5/5 clean relaunches). The dev hint lives in `src/screens/auth/dev-test-hint.tsx`.
- Verified on Android (BlueStacks + Expo Go via adb): short password (client), breached password (Clerk HIBP → field), sign-up → wrong code → resend → `424242` → home with "Ada Lovelace King" (Clerk user has first "Ada", last "Lovelace King"); duplicate email → field error; wrong password → form error; right password on a trusted client → home directly; after clearing Expo Go data (new client) → device-trust code screen ("finish signing in"), wrong code error, `424242` → home; kill/relaunch keeps the session; deep links to `/sign-in` and `/onboarding` while signed in stay on home; sign out → onboarding, Back leaves the app, `/home` deep link while signed out → onboarding. tsc, eslint, token check, expo-doctor pass.
- Not verified: iOS; the offline cold-start fallback (BlueStacks ignored `svc wifi/data disable`); the expired-code screen after a reload; the Clerk MCP was never authorized this session, so the SDK shapes come from the installed `@clerk/expo` 4.16.1 / `@clerk/shared` types.
