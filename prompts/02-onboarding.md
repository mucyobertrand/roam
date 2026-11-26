# 02 · Onboarding

Status: done

## Goal
A signed-out guest opens the app on a three-page onboarding that matches `assets/prompt-imgs/onboarding.png`, swipes or taps through it, and lands in the authentication flow (sign-up, with a path to sign-in).

## Decisions
- Three swipeable pages; page 1 is the designed page, pages 2–3 reuse its layout with their own photo, location chip and copy (user choice).
- "Get started" advances to the next page; on the last page it opens sign-up. "Continue with Google" and "Skip" open sign-up (user choice). Google sign-in itself comes with Clerk.
- Auth screens are route stubs in this plan: `src/app/(auth)/sign-up.tsx` and `sign-in.tsx` with the header from `auth.png` (back button, small wordmark), title and subtitle, and a link between the two. The form and Clerk come in the next plan (user choice).
- Onboarding shows on every launch while signed out. `src/app/index.tsx` redirects to `/onboarding`; once Clerk exists, signed-in users go home instead. No storage dependency (user choice).
- No new dependencies. Uses installed `expo-image` (photos, prefetch, cache), `react-native-safe-area-context`, `expo-status-bar`, `expo-glass-effect` (liquid glass on iOS 26+, translucent fallback elsewhere).
- Photos are remote Unsplash images (AGENTS.md allows remote placeholders for sample photos), sized `w=1200`, listed with their Unsplash page URL as credit in one data file:
  1. `photo-1636886519725-6a048800b5b4` (unsplash.com/photos/bHmCOJt5Sz0), lakeside lodge under mountains, chip "Emerald Lake, BC".
  2. `photo-1754793566421-44b55f0cdf28` (unsplash.com/photos/zgklkgba15o), wooden house among pines below snowy peaks, chip "Canmore, AB".
  3. `photo-1512100643720-dbe5c2540c40` (unsplash.com/photos/PdNoXi1Q9AI), oceanfront pool under a pink sky, chip "Playa Colorado, Nicaragua".
  All three have light skies, so the ink wordmark reads as in the design.
- Copy:
  1. "Find a stay that fits your story" / "From mountain cabins to oceanfront villas, roam helps you find unforgettable stays for every kind of trip." (from the design)
  2. "Search the way you talk" / "Describe your stay in one sentence, like "quiet pet friendly cabin with a hot tub under $300", and get stays ranked for you."
  3. "Answers straight from the source" / "Ask about pets, check-in or cancellation and get the stay's own policy, word for word."
- The Google "G" comes from Google's official sign-in branding assets (PNG, `assets/images/brand/google-g.png`), not redrawn. If it can't be downloaded, a marked placeholder is used and listed.
- Onboarding pieces used only here live in `src/screens/onboarding/` (slides data, slide, page indicator, sheet shape, glass pill, location chip). Shared primitives stay in `src/components/ui/`.

### Design → tokens (measured from onboarding.png at 390 pt wide; ⚠ = estimate)
| Element | Spec |
|---|---|
| Photo | full-bleed, `contentFit="cover"`, fills the screen behind everything |
| Wordmark | `<Wordmark size="md">` (28), left `2xl` (24), top safe-area + `sm` |
| Skip | glass pill, `h-control-sm`, `px-xl`, `rounded-full`, `caption`-size ink text ⚠ (liquid glass on iOS 26, else `bg-glass`) |
| Location chip | dark glass pill, `h-icon-button-sm` (36), `px-lg`, map-pin `sm` + `caption` text, white; fallback new token `scrim` `rgba(11,11,26,0.45)` ⚠ + 1px new token `glass-border` `rgba(255,255,255,0.5)` ⚠; sits `lg` above the sheet's top-left |
| Sheet | `bg-surface`, top ≈ 40% of screen height from the bottom; top edge slopes down to the right with large rounded corners (left ~`xl`, right larger) ⚠, drawn as an oversized rounded View rotated a few degrees behind the content, with no SVG dependency. Tuned against the design. |
| Indicator | 3 dashes, `w-3xl` (32) × 5 ⚠ new token `indicator` height, `gap-sm`, active `bg-lavender`, inactive `bg-border`; ~30 pt below the sheet top |
| Heading | `<Text variant="heading-lg">` (32/38), ~20 pt below the indicator |
| Body | `<Text variant="body">` (muted), `mt-md` |
| Text inset | `2xl` + `xs` (28 ⚠, text sits slightly inside the buttons) |
| Buttons | `Button primary` "Get started" + `arrow-right`; `Button secondary` "Continue with Google" + G logo; `gap-md`; horizontal `2xl`; bottom = safe-area bottom (min `lg`). Known difference: the mock's buttons measure ~50 pt and ours are the system `control` (56). Kept for consistency unless you'd rather match the mock. |
| Status bar | dark content |

## Out of scope
Clerk, real Google sign-in, the sign-up form fields (next plan). Remembering that onboarding was seen. Home screen. Blur on Android (translucent fallback only).

## Steps
### 1. Routing
`src/app/_layout.tsx`: Stack with `headerShown: false` by default (the design-system route keeps its header via its own options). `src/app/index.tsx` → `<Redirect href="/onboarding" />` with a comment that signed-in users go home once Clerk exists. Add `src/app/onboarding.tsx` and `src/app/(auth)/_layout.tsx` (headerless Stack). The design-system showcase stays reachable at `roamapp://design-system`. Done: app opens on onboarding; tsc passes.

### 2. Tokens and asset
Add `--color-scrim`, `--color-glass-border`, `--spacing-indicator` (5px) to `src/global.css`. Download Google's official "G" mark to `assets/images/brand/google-g.png` (@2x/@3x if provided). Done: classes compile (check web CSS); asset present or placeholder listed.

### 3. Onboarding pieces (`src/screens/onboarding/`)
- `slides.ts`: the three slides (id, image URL, credit URL, location, title, body).
- `page-indicator.tsx`: dashes with `accessibilityLabel="Page n of 3"`.
- `sheet.tsx`: the curved white sheet background.
- `glass-pill.tsx`: `GlassView` when `isLiquidGlassAvailable()`, else a translucent View; `tone: light | dark`.
- `location-chip.tsx`: dark glass pill with map-pin `Icon` (tone inverse) and caption text.
- `onboarding-screen.tsx`: horizontal paging `FlatList` of full-screen slides (photo, location chip, sheet with heading and body); fixed overlay of wordmark, Skip, indicator and buttons; `onMomentumScrollEnd` updates the page; Get started scrolls to the next page or `router.push("/sign-up")` on the last; prefetch all photos with `Image.prefetch`.
Done: matches the design on web and Android at 390 pt width.

### 4. Auth stubs
`src/app/(auth)/sign-up.tsx` and `sign-in.tsx`: safe-area screen, header row with `IconButton` back (`router.back()`, falls back to `/onboarding`) and `<Wordmark size="sm">` on the right, then "Create your account" / "Welcome back" (`heading-lg`) and the subtitle from `auth.png`, a link to the other screen, and a code comment marking the form as the next plan. Done: Skip, Google and the last Get started all land on sign-up; back returns to onboarding.

### 5. Close out
Verification, `## Result`, AGENTS.md updates.

## Verification
- `npx tsc --noEmit`, `npx eslint src scripts`, token check and drift grep pass.
- Android (BlueStacks, Expo Go): screenshot page 1 and compare with `onboarding.png` element by element (positions, sizes, sheet curve, chip, Skip, indicator). List the differences, fix, repeat. Swipe to pages 2 and 3 (indicator follows); Get started advances, then opens sign-up; Skip and Google open sign-up; back returns.
- Web at 390 px: same visual check.
- Images: first paint shows a neutral placeholder colour, not white flashes; photos stay cached on revisit.
- Accessibility: screen-reader labels on Skip, buttons, chip and indicator; large text doesn't overlap the buttons (the sheet grows).
- iOS: not testable here (Windows). Listed for you to check.

## AGENTS.md updates
- Routing: `index` redirects to `/onboarding` while signed out; auth screens live in `src/app/(auth)/`. Root Stack is headerless by default.
- Screen-specific components live in `src/screens/<screen>/`; promote to `src/components/` only when a second screen uses them.
- Remote sample photos: Unsplash, with the photo page URL kept next to the image URL as credit.

## Result
Built as planned: `/` redirects to `/onboarding` (3 swipeable pages); Get started advances, then opens sign-up; Skip and Google open sign-up; `(auth)/sign-up` and `sign-in` stubs link to each other and back to onboarding.
- Deviations: the heading uses a new `hero` style (Plus Jakarta ExtraBold 40, line height 1.1), measured from the mock; `heading-lg` (32 Bold) was visibly too small. 1.1 instead of the mock's 1.0 because Android clips descenders at 1.0. The sheet's sloped top is a short rotated cap over a plain body (skewY exposed the photo on Android, which fakes skew with a rotation). Pages are sized from the screen's measured layout, because the window height excludes the status bar on Android edge-to-edge. IconButton gained an `outline` variant for the auth back button. The light glass fallback got a hairline border so Skip stays visible on bright skies.
- Assets: Google's official "G" from Google's sign-in branding assets (the icon-only button SVG with its container removed, rendered to 24/48/72 px) in `assets/images/brand/google-g*.png`.
- Verified on Android (BlueStacks, Expo Go): all 3 pages, swipe and Get started paging, Skip, Google and last-page Get started open sign-up, Back returns, the Sign in / Create account links switch screens. Web at 390x844 compared side by side with the mock; no console errors. tsc, eslint, token check and drift grep pass.
- Not verified: iOS (liquid glass pills only render on iOS 26+), screen reader, largest text sizes.
- Known differences from the mock: buttons 56 vs ~50 pt (system token, by decision); body line height 24 vs ~20 (design-system body token); photos are real Unsplash images, not the mock's illustration.
- Follow-up: pages are clipped (`overflow-hidden`), since each sheet cap's 8pt overhang painted a white strip on the previous page's right edge. Headings use balanced line breaking (`textBreakStrategy="balanced"`, `text-balance`). Auth stub titles use `hero`. The wordmark's "r" is now a custom rounded glyph (`scripts/generate-wordmark.py` draws outlines itself with nonzero fill, because League Spartan's contours overlap). Verified on BlueStacks.
- Follow-up: the sheet's top edge is now `assets/images/onboarding/sheet-edge.svg`, a curve traced point by point from the mock (rounded top-left corner, a shallow arc lowest ~87pt in, a late drop into the right side), drawn with expo-image above a plain white body. The earlier rotated cap was a straight slope, steeper than the mock across the left half. Tokens: `sheet-cap` 80 (SVG height), `sheet-edge` 72 (where the body starts); the sheet radius tokens were removed. Don't put `--` inside XML comments in SVGs: browsers reject the file (Android doesn't). Verified against the mock's edge points at 390pt on web, and on Android.
