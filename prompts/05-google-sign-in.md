# 05 · Continue with Google

Status: approved

## Goal
A guest taps "Continue with Google" on onboarding, sign-in, or sign-up, picks a Google account in the browser sheet, and lands on home signed in. A new Google user gets a Clerk account with their Google name and email. An existing roam account with the same email is signed in, not duplicated.

## Decisions
- Flow: Clerk's browser-based OAuth through `useSSO` from `@clerk/expo/experimental` (Core 3 "future" API, matching plan 04). `startSSOFlow({ strategy: "oauth_google" })` opens the Google sheet with `expo-web-browser`, signs in (or transfers to a sign-up for new users), and calls `finalize()` itself.
- New dependency (user approved): `expo-auth-session`, installed with `npx expo install`. It is in Expo Go, so no development build is needed. `expo-web-browser` is already installed.
- Clerk dev instance: Google is already on (`connection_oauth_google.enabled: true`) with Clerk's shared dev credentials. No config change is needed for development.
- Redirect URL: the hook default, `AuthSession.makeRedirectUri({ path: "sso-callback" })`. That is `roamapp://sso-callback` in a dev or production build and `exp://<host>/--/sso-callback` in Expo Go. Allowlist `roamapp://sso-callback` on the dev instance with the Clerk MCP (`create_redirect_url`). If Expo Go's `exp://` URL is rejected, allowlist the exact URL the app logs, and note it.
- `src/app/sso-callback.tsx`: an unguarded route that renders nothing and redirects to `/`. On Android the OAuth redirect can also open the app at `/sso-callback`; without this route Expo Router shows "Unmatched route". `/` then sends the guest to home or onboarding.
- `src/lib/auth` API: add `signInWithGoogle(): Promise<"complete" | "cancelled">`.
  - `"cancelled"` when the browser sheet is closed (`authSessionResult.type` is not `"success"`) or no session was created. The screen shows nothing.
  - Errors go through `toAuthError`; there is no field, so they show as form-level messages. Extra mapping: `oauth_access_denied` → "Google sign-in was cancelled.", `external_account_exists` and `form_identifier_exists` → "This Google account is already linked to another roam account."
  - `useSSO` is only called inside `use-auth.ts`. Screens never import `@clerk/expo`.
- Buttons (user choice: all three):
  - Sign-in and sign-up: bring back `SocialButtons` with Google only (the "or" divider, then "Continue with Google"). Apple stays hidden until it is configured. The `Provider` type narrows to `"google"`. On success → `goHome()`. The email form and the Google button disable each other while either is busy.
  - Onboarding: the existing "Continue with Google" button starts the same flow, with a loading state on the button. On success → `router.replace("/home")`. Errors show in an `Alert` above the buttons; the guest can dismiss it and retry.
- Device trust doesn't apply: an OAuth sign-in goes straight to a session.
- Production (later): needs its own Google OAuth client (ID and secret) in Clerk, plus `roamapp://sso-callback` allowlisted on the production instance. Listed under "You need to"; nothing is built for it now.

## Out of scope
Sign in with Apple, native Google sign-in (`@clerk/expo-google-signin`), linking or unlinking Google on an existing signed-in account, the production instance.

## Steps
### 1. Dependency and Clerk setup
Run `npx expo install expo-auth-session`. With the Clerk MCP, read `connection_oauth_google` (enabled) and run `create_redirect_url` for `roamapp://sso-callback` on the development instance. Done: `package.json` lists `expo-auth-session` at the SDK 58 version, `npx expo-doctor` passes, and `list_redirect_urls` shows the URL.

### 2. Auth module
In `src/lib/auth/use-auth.ts`, add `signInWithGoogle` built on `useSSO().startSSOFlow({ strategy: "oauth_google" })` from `@clerk/expo/experimental`, returning `"complete" | "cancelled"`. Add the two error mappings to `clerk-errors.ts`. Done: `npx tsc --noEmit` passes.

### 3. SSO callback route
Add `src/app/sso-callback.tsx` (`<Redirect href="/" />`) and declare it in the root Stack outside the guards. Done: tsc passes, and deep-linking `/sso-callback` lands on `/` → home or onboarding.

### 4. Screens
- `src/screens/auth/social-buttons.tsx`: Google only; keep the pending/disabled behavior.
- `sign-in-screen.tsx` and `sign-up-screen.tsx`: render `SocialButtons` again under the main button. On press, call `signInWithGoogle`: `"complete"` → `goHome()`, `"cancelled"` → nothing, error → form `Alert`. The submit button and Google button disable each other while busy.
- `src/screens/onboarding/onboarding-screen.tsx`: the Google button calls `signInWithGoogle` with a loading state, shows errors in an `Alert`, and on success goes to `/home`.

Keep layout, tokens, and copy otherwise. Done: tsc, lint, and the token check pass.

## Verification
- `npx tsc --noEmit`, `npx eslint src`, `node scripts/check-tokens.mjs`, `npx expo-doctor` pass.
- On Android (BlueStacks + Expo Go via adb):
  1. Onboarding → Continue with Google → the Google sheet opens. Close it → back on onboarding, no error.
  2. Sign in with a Google account → home shows the Google name and email. Kill and relaunch → still home.
  3. The user exists in Clerk with a Google external account (Clerk MCP `get_user`).
  4. Sign out → sign-in screen → Continue with Google → home again (existing Google user, no duplicate account).
  5. Sign-up screen → Continue with Google → home.
  6. While the email form is submitting, the Google button is disabled, and the other way round.
- Logging into a real Google account needs a person at the keyboard. If no account can be used in the emulator, steps 2–5 go under "Test it yourself" and are reported ❌ with that reason.

## AGENTS.md updates
- Expo → Auth bullet: add `signInWithGoogle()` → `"complete" | "cancelled"` (Clerk `useSSO` from `@clerk/expo/experimental`, browser OAuth via `expo-auth-session`/`expo-web-browser`, redirect `roamapp://sso-callback`, `src/app/sso-callback.tsx` redirects to `/`).
- Who owns what → Auth: replace "Google and Apple buttons are hidden until an OAuth plan wires them" with "Google sign-in is live on onboarding, sign-in, and sign-up (dev uses Clerk's shared Google credentials; production needs its own Google client). Apple stays hidden until configured."

## Result (verification pending, so Status stays approved)
- Built steps 1–4. `expo-auth-session ~58.0.19` added. `expo-web-browser` moved to `~58.1.0`, because expo-auth-session pulled in a duplicate copy; that also added its config plugin to `app.json`.
- Redirect URLs allowlisted on the dev instance (Clerk MCP): `roamapp://sso-callback`, `exp://127.0.0.1:8082/--/sso-callback` (emulator via adb reverse), `exp://10.11.73.229:8081/--/sso-callback` (phone on the PC's Wi-Fi IP).
- Deviation: no Google-specific copy for `form_identifier_exists`. Field errors from a Google attempt show as a form-level message instead.
- Emulator (BlueStacks, Expo Go): the button opens Google's chooser in a Chrome Custom Tab. Closing the sheet returns to onboarding with no error. Choosing an account → consent "Continue" → Google's page kept loading (3 tries), so the return to the app was not reached.
- Seen once: tapping Google again after closing the sheet threw "Cannot find native module 'ExpoCrypto'" (from expo-auth-session's PKCE import). Expo Go had opened a second ExperienceActivity when the tab closed. It doesn't happen from a fresh start. Not diagnosed; may be specific to Expo Go on the emulator.
- Pending: the user tests on a physical phone in Expo Go (sign-in, close-and-retry, relaunch).
