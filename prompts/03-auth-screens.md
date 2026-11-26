# 03 · Auth screens (mocked)

Status: done

## Goal
A guest can create an account (name, email, password), confirm the email with a 6-digit code, or sign in to an existing account, with Google and Apple shortcuts. They land on a placeholder home and can sign out. Every screen matches the visual language of `assets/prompt-imgs/auth.png`. Authentication is mocked in-memory behind an interface shaped like Clerk's, so the next plan only swaps the implementation.

## Decisions
- After verification, sign-in or a social shortcut, the user lands on a placeholder `/home` ("You're signed in as {name}" + Sign out → onboarding). `/` sends signed-in users to `/home` and signed-out users to `/onboarding` (user choice).
- Verification is a 6-digit email code: six boxes, auto-submit on the sixth digit, Verify button, "Resend code" with a 30 s cooldown (user choice; matches Clerk's email-code flow).
- Google and Apple mock a successful sign-in as a sample user after a short loading state (user choice).
- Mock rules (in `src/lib/auth/mock-auth.ts`, simulated ~700 ms latency):
  - Seeded account: `demo@roam.app` / `password123` (name "Joanna Smith", from the mocks).
  - Sign-up with an existing email → "An account with this email already exists." on the email field.
  - Verification code `424242` succeeds; anything else → "That code isn't right. Check your email and try again."
  - Sign-in with an unknown email or wrong password → one form-level error: "Email or password is incorrect."
  - Accounts created this session can sign in. State is in memory only; reloading the app signs you out. No storage dependency.
- Auth API (`src/lib/auth/`): `AuthProvider` + `useAuth()` → `{ isSignedIn, user, signOut }`, and actions `signUp`, `verifyEmail`, `resendCode`, `signIn`, `signInWithProvider`. The names and shapes follow Clerk's flow (create → prepare/attempt verification → session), so Clerk replaces the mock file, not the screens.
- Apple appears on iOS only (Apple's guidance; the mock is an iPhone), drawn with the SF Symbol `apple.logo`. Google uses the official G asset already in `assets/images/brand/`.
- Forms: validate on submit, then re-validate each field as it changes. Errors show under the field (`TextField error`), and request errors show in an `Alert` above the button. Buttons show loading and block double submits. Return key moves to the next field and submits on the last. Autofill hints are `name`, `email`, `new-password` / `password`, and `one-time-code`. The keyboard never covers the focused field (KeyboardAvoidingView + ScrollView).
- No new dependencies.

### Design → tokens (measured from auth.png at 390 pt; ⚠ = estimate)
| Element | Spec |
|---|---|
| Header | `IconButton outline` back (`chevron-left`) left, `<Wordmark size="sm">` right, safe-area top + `sm` |
| Title | new `hero-sm`: Plus Jakarta ExtraBold 34 / 38 (measured: "your account" = 220 pt wide → 34 pt) |
| Subtitle | `body` (muted). The mock measures 15/21; kept on the design-system body token like onboarding. |
| Fields | new `TextField` prop `label`: icon left, label (`caption`-weight ⚠ Medium 16, ink) stacked over the input (placeholder muted), height new token `field` 60, `rounded-lg`, `bg-surface-muted`, gap `lg` (16), screen inset `2xl` (24). Focus/error states as today. |
| Primary | `Button` "Create account" / "Sign in" / "Verify" + `arrow-right` |
| Divider | hairline `bg-border` lines with "or" (`caption`, muted) between, `my-lg` |
| Social | `Button secondary` "Continue with Google" (G asset) and "Continue with Apple" (iOS) |
| Footer | "Already have an account? **Sign in**" / "New to roam? **Create account**" (caption, link underlined ink) |
| Code boxes | 6 × `flex-1` boxes, `h-control`, `rounded-lg`, `bg-surface-muted`; the active box gets the focused field style (`bg-lavender-soft`, `border-lavender`); digit in `title` |
| Known differences | Buttons 56 (mock 50/46) and body 16/24 (mock 15/21), keeping the system tokens as decided in plan 02. |

### Screens
- **Sign up** (`/sign-up`, designed): Full name (`user`, "e.g. Adrian Hajdin"), Email address (`mail` (new icon), "you@example.com"), Password (`lock`, "At least 8 characters", show/hide). "Create account" → `/verify-email?email=…`.
- **Verify email** (`/verify-email`, new): title "Check your email", subtitle "We sent a 6-digit code to **{email}**." Code boxes, "Verify", "Didn't get a code? Resend" (countdown "Resend in 0:24"), "Wrong email? Go back".
- **Sign in** (`/sign-in`, new): title "Welcome back", subtitle "Sign in to see your saved stays and pick up where you left off." Email, Password, "Sign in", or, social buttons, footer "New to roam? Create account". "Forgot password?" is left out (no design or flow yet).
- **Home** (`/home`, placeholder): wordmark, "You're signed in as {name}", email, "Sign out".

## Out of scope
Clerk, real Google/Apple OAuth, password reset, persisting the session, the real home screen.

## Steps
### 1. Mock auth
`src/lib/auth/mock-auth.ts` (rules above), `auth-provider.tsx` (context, `useAuth`), `index.ts`. Wrap the root layout in `AuthProvider`. `src/app/index.tsx` redirects on `isSignedIn`. Done: tsc passes.

### 2. Tokens and primitives
Add `--text-hero-sm`, `--spacing-field`. Text variant `hero-sm`. `TextField`: optional `label` (stacked layout, `h-field`), forward a ref for focus chaining, and pass autofill props through. Icon `mail` (`envelope` / `mail`) and `apple` (`apple.logo`, iOS only). New `src/components/ui/code-input.tsx` (6 boxes over one hidden `TextInput`, `oneTimeCode`, number pad, paste-friendly) and `divider.tsx` ("or"). Add both to the design-system showcase. Done: showcase renders them.

### 3. Shared auth layout
Extend `src/screens/auth/auth-screen.tsx`: header, title (`hero-sm`), subtitle (supports a bold email), keyboard handling, `children`, footer link. `src/screens/auth/social-buttons.tsx` (Google, Apple on iOS, divider, loading per button).

### 4. Screens
`(auth)/sign-up.tsx`, `(auth)/verify-email.tsx`, `(auth)/sign-in.tsx`, `src/app/home.tsx`. Form state and validation in `src/screens/auth/use-form.ts` (small hook: values, errors, touched, validate). Navigation: sign-up → `router.push("/verify-email", {email})`; verify, sign-in and social → `router.dismissAll()` + `router.replace("/home")`; footer links `replace` between sign-in and sign-up; home Sign out → `replace("/onboarding")`; `/home` redirects to `/onboarding` when signed out. Done: every path below works.

### 5. Close out
Verification, Result, AGENTS.md.

## Verification
- tsc, eslint, token check and drift grep pass.
- Android (BlueStacks) and web at 390 px, screenshotted and compared with `auth.png` for the sign-up screen; verify and sign-in reviewed for consistency.
- Flows:
  1. Onboarding → Get started → sign-up → empty submit shows 3 field errors → fix them → errors clear as you type.
  2. Sign-up with `demo@roam.app` → "already exists" on email.
  3. Valid sign-up → verify screen shows the email → wrong code → error, boxes cleared → `424242` auto-submits → home shows the name → Sign out → onboarding.
  4. Resend: disabled with a countdown, then sends again.
  5. Sign in with wrong password → form error; `demo@roam.app`/`password123` → home.
  6. Google / Apple (iOS) → loading → home.
  7. Return key chains fields; the keyboard doesn't cover fields; back buttons and links behave.
- Screen reader labels on fields, code input ("Verification code, 3 of 6 digits entered"), and buttons.

## AGENTS.md updates
- Auth is mocked in `src/lib/auth/` behind a Clerk-shaped API (`useAuth`, `signUp`, `verifyEmail`, `signIn`, `signInWithProvider`). Screens only use that module; the Clerk plan replaces `mock-auth.ts`. Mock credentials are documented in that file.
- `/` routes by `isSignedIn`: `/home` when signed in, `/onboarding` otherwise.

## Result
Built as planned: `/sign-up` (from auth.png), `/verify-email` (6-digit code), `/sign-in`, placeholder `/home`. Auth is mocked in `src/lib/auth/` behind `useAuth()`; `/` routes by `isSignedIn`.
- New primitives: `TextField label` (stacked, `h-field` 60), `CodeInput`, `Divider`, `Text emphasis`, `hero-sm` (34/38 ExtraBold, measured), icons `mail`/`apple`, all in the showcase.
- Found while testing: the Clerk setup added to `_layout.tsx` meanwhile (ClerkProvider + tokenCache) needed `expo-secure-store` (installed with approval), and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` only reaches the app after the dev server restarts. The mock `AuthProvider` is nested inside `ClerkProvider`, which nothing uses yet. Code input: on Android, disabling a focused TextInput drops focus for good, so it stays editable and ignores keys while a check is in flight.
- Verified on Android (BlueStacks, Expo Go) via adb: empty submit shows 3 field errors that clear as you type; the return key chains fields and submits; duplicate email error; wrong code shows an error and keeps focus; the right code auto-submits to home; Back on home leaves the app (no auth screens left in the stack); sign out → onboarding; wrong password → form error; sign-in with an account created this session; Google → home; resend locked for 30 s, then sends and restarts; "Go back" returns to sign-up. tsc, eslint, token check and drift grep pass.
- Not verified: iOS (including the Apple button), screen reader, large text, software keyboard covering fields (BlueStacks uses a hardware keyboard).
- Known differences from the mock: buttons 56 vs 50/46 pt, body 16/24 vs 15/21, field label/input 14/16 vs ~13 (system tokens).
