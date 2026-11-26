# 13 · Profile screen

Status: approved

## Goal
The Profile tab matches `assets/prompt-imgs/profile.png` using only real data: the guest's photo and name, their trip and saved counts, Account and Preferences lists, a link to Roam's cancellation policies, and a Sign out button (not in the design, added on request).

## Decisions
- **Real data only.** Name and photo come from Clerk (`useAuth().user`). The design's location line ("San Francisco, CA") becomes the guest's **email** with a `mail` icon, since Clerk has no location. The "Roam Explorer" badge is hidden, because there are no guest tiers.
- **Stats:**
  - Trips is `0`, since there are no bookings yet.
  - Saved is the live session count of saved stays, from a new `useSavedCount()` in `src/lib/saved.ts` (a `useSyncExternalStore` snapshot of `saved.size`).
  - Rating shows a star and "–", with the accessibility label "No rating yet". Guests have no ratings.
- **Policy card:** the design's "Free cancellation / Full refund up to 7 days before check-in." isn't used, because no Roam policy says that and policy text must be exact. The card reads **"Cancellation policies"** / **"See how refunds work on Roam."** (our own words, with no refund promise). It opens a new sheet, `roam-policies`, that lists every `policy` with `category == "cancellation"` (Flexible, Moderate, Strict). Each one shows its title, summary (emphasis) and full body, word for word.
- **Row taps:** the Trips row and the Trips stat go to the Trips tab (`router.navigate("/trips")`). Personal info, Payment methods, Notifications, Help & support and the settings gear show a floating info `Alert`, "{Label} is coming soon.", above the bottom edge for 3 s. It is announced to screen readers and works like BookBar's notice. Saved and Rating can't be tapped.
- **Sign out:** a `secondary` `Button` "Sign out" goes last, below the policy card. It keeps today's behaviour: loading state, `router.replace("/onboarding")`, and an error `Alert` on failure.
- **Tab bar:** stays native (NativeTabs). It can't match the floating yellow pill in the mock, as AGENTS.md already notes.
- **Promotions** (a second screen now uses them):
  - `src/screens/stay/policy-card.tsx` moves to `src/components/policy-card.tsx`.
  - `src/screens/stay/policy-body.tsx` moves to `src/components/policy-body.tsx`.
  - `SheetFrame` and `Section` from `src/screens/stay/sheets.tsx` become `src/components/sheet.tsx` (`SheetFrame`, `SheetSection`).
  - Imports are updated in stay and stay-ask.
- **Content:** add `fetchPolicies(category)` to `src/lib/content/stays.ts`. The query is `*[_type == "policy" && category == $category] | order(title asc){title, summary, body…}`, with the same body projection as `DETAILS_QUERY`. Add `usePolicies(category)` in `use-stays.ts` through `useContent` (key `policies:<category>`). No schema change.
- No analytics events.

## Design (profile.png, 390 pt; values est. from the image unless they are existing tokens)
- **Screen:** `ScrollView bg-surface`, `px-xl`, `gap-lg`, top padding `insets.top + spacing.lg`, bottom `spacing.lg`.
- **Header row:** `Wordmark size="home"` (left, `mt-md` like Home). On the right, an `IconButton` with icon `settings`, variant `muted`, size md (48) and label "Settings".
- **Profile card:** `rounded-xl bg-surface-muted p-lg`, a row with `gap-lg`, items centered.
  - Avatar: `Avatar` with a new size **`avatar-xl` 104 px** (proposed token; the mock is ≈105 pt). `Avatar` gains `size?: "lg" | "xl"`, and the initials fallback uses `heading-lg` at xl.
  - Text column (`flex-1 gap-xs`): name in `heading` (28 Bold; the mock looks ExtraBold, close enough) that wraps and never truncates. Below it, a row with `mail` icon sm muted and the email in `body` muted, which wraps.
- **Stats card:** `rounded-xl border border-border bg-surface py-lg`, a row of three equal `flex-1 items-center gap-xs` columns separated by `w-px bg-border` vertical rules (inset `my-xs`).
  - Number: new text variant **`stat`**, `--text-stat: 24px`, line height `1.25` (30), ExtraBold. These are proposed tokens. The Rating number has a `star` icon (tone `primary`) before it.
  - Label: `body` muted ("Trips", "Saved", "Rating").
  - Each column is one accessible element ("0 trips", "3 saved", "No rating yet"). The Trips column is a `PressableScale` button.
- **Section card** (Account, Preferences): `rounded-xl bg-surface-muted p-sm gap-sm`, containing:
  - the title `title` ("Account"/"Preferences", `accessibilityRole="header"`), padded `px-md pt-sm`
  - an inner list `rounded-lg bg-surface`
  - Rows are `PressableScale`, `flex-row items-center gap-lg px-md py-sm`. Each row has:
    - an icon tile, `size-icon-button-sm rounded-md bg-surface-muted`, with the icon md ink
    - the label in `body` tone default, `flex-1`
    - a `chevron-right` sm ink
  - Rows are split by a `Divider` inset to start at the label (`ml-[tile+gap]` via a spacer view, not a px class).
  - Account: Personal info (`user`), Payment methods (`credit-card`), Trips (`suitcase`).
  - Preferences: Notifications (new icon **`bell`**: SF `bell`, Material `notifications`), Help & support (new icon **`help`**: SF `questionmark.circle`, Material `help`).
- **Policy card:** the promoted `PolicyCard` with `icon="document"`, no tile, title "Cancellation policies", subtitle "See how refunds work on Roam.", and hint "Opens Roam's cancellation policies". It matches the mock's lavender card.
- **Sign out:** `Button variant="secondary"`, full width, `mt-sm`, with the error `Alert` above it when set.
- **Coming-soon notice:** an absolutely positioned `Alert tone="info"` with `left-xl right-xl bottom-lg`, `FadeIn`/`FadeOut` from `motion.ts`, a 3 s timer cleared on unmount, and `announceForAccessibility`.
- **Roam policies sheet** (`roam-policies`): `SheetFrame title="Cancellation policies"`, with one `SheetSection icon="document"` per policy: the summary in `body` default emphasis, then `PolicyBody`. States:
  - loading: a spinner
  - error: an `Alert` and Retry
  - empty: "No policies yet."
- **Layout at 360–430 dp:** text wraps and nothing truncates. The three stat columns share the width.
- **Assets:** none new. The photo comes from Clerk, or initials if there is none.

## Out of scope
- Editing the profile, payments, notification settings, a help screen, and settings.
- Guest location, tiers/badges, guest ratings, and a persisted Saved list. The real booking count waits for bookings.

## Steps
### 1. Tokens, icons, primitives
- `global.css`: add `--spacing-avatar-xl: 104px` (est.), plus `--text-stat: 24px` and `--text-stat--line-height: 1.25` (est.).
- `text.tsx`: add a `stat` variant (`font-jakarta-extrabold text-stat`).
- `icon.tsx`: add the `bell` and `help` icons.
- `avatar.tsx`: add `size`.
- `saved.ts`: add `useSavedCount()`.
- Add `stat` and the new icons to `/design-system`.

Done when tsc, lint and `node scripts/check-tokens.mjs` pass.

### 2. Promote shared views
Move `PolicyCard` and `PolicyBody`/`Bullet` to `src/components/`. Extract `SheetFrame`/`SheetSection` to `src/components/sheet.tsx`, then update the imports in `src/screens/stay/*` and `src/screens/stay-ask/answer-card.tsx`. Done when tsc and lint pass and the stay Policies and Host sheets look unchanged.

### 3. Policies content and sheet
- Add `fetchPolicies` and `usePolicies`.
- Add `src/screens/profile/policies-sheet.tsx` and `src/app/roam-policies.tsx`.
- Register `roam-policies` in the root `_layout.tsx` sheet list, inside `Stack.Protected guard={isSignedIn}`.
- Extend `scripts/check-content.mjs` to run the policies query and assert at least one cancellation policy with a non-empty body.

Done when the check passes.

### 4. Profile screen
Rewrite `src/screens/profile/profile-screen.tsx` per the Design section, with screen-local pieces in `src/screens/profile/` (`profile-card.tsx`, `stats-card.tsx`, `settings-section.tsx`, `coming-soon.tsx`). Done when tsc and lint pass and the screen renders.

## Verification
- tsc, lint (`npx eslint src` if Node < 22.13), `check-tokens`, `check-content`.
- BlueStacks at 360 dp and 390 dp, screenshots compared with profile.png:
  - The header, profile card (photo or initials, name and email wrapping), stats (Trips 0; Saved goes up after hearting a stay on Home; Rating "–"), both sections and the policy card.
  - Trips row and Trips stat open the Trips tab. Each other row and the gear shows "{Label} is coming soon.", which hides after 3 s.
  - The policy card opens the sheet with Flexible, Moderate and Strict, word for word as in `roam/seed/policies.ts`. Offline, it shows the error and Retry.
  - Sign out returns to onboarding. The stay Policies and Host sheets still work after the move.
- Every value estimated from the image is listed in the report.

## AGENTS.md updates
- Expo, routing: add the `roam-policies` formSheet (Roam's cancellation policies, opened from Profile) to the sheet list registered with the same options.
- Design system: shared views now also include `PolicyCard`, `PolicyBody` and `SheetFrame`/`SheetSection` (`src/components/sheet.tsx`). `Avatar` has sizes `lg`/`xl`. Text has a `stat` variant.
- Who owns what, answer text: Profile shows real account data only (no invented location, tier, or rating). Trips is 0 until bookings exist, and Saved is the session count. Rows without a feature show "{Label} is coming soon."
