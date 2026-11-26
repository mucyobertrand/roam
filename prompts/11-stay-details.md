# 11 · Stay details screen from the design

Status: done

## Goal
`/stay/[id]` matches `assets/prompt-imgs/property-details.png`, from live Sanity data: a photo gallery, title, rating, place, highlights, a policies card and a cancellation card that open the stay's own house rules, check-in/out and cancellation policy word for word, the host, and a sticky price bar. "Book this stay" shows a short "coming soon" message.

## Decisions
- **User choices:**
  - "Ask about policies" opens a **Policies sheet** with the stay's own text, word for word: check-in/out, pets, house rules, and the full cancellation policy. Asking questions comes later (Context + Jev).
  - **No total line** under the price ("$867 total" needs dates). Just "$289 / night".
  - **Host line shows "Hosting since 2017"** from `hostingSince`, in place of "Superhost". No schema change.
- **Data:** `fetchStayDetails(slug)` in `src/lib/content/stays.ts` returns `StayDetails = Stay & {photos[{url, alt}], checkInTime, checkOutTime, houseRules, host{name, photo, hostingSince, languages, bio}, cancellation{title, summary, body}}` in one GROQ query (`host->`, `cancellationPolicy->`, slug as a param). `useStayDetails(slug)` is cached under `details:<slug>`. The screen paints instantly from the cached `Stay` (from Home/Search) and fills the rest when details arrive.
- **Layout (top to bottom), design 390 pt, values estimated from the image:**
  - **Gallery:** full-width horizontal pager of all photos (live stays have 3–6), sized from `onLayout`, height proportional (width × 0.85, est. 332 at 390). Each image uses its `alt`. Floating white circles: Back (top left), Share and Heart (top right), new token `--spacing-hero-button: 60px` (est.), `shadow-card`. Counter pill bottom right "1 / 4" on `bg-scrim`, white caption, updates on swipe.
  - **Sheet body** overlaps the photo by `radius-xl` with rounded top corners, `bg-surface`.
  - **Title row:** title `heading` (28, ExtraBold; the mock is ~30) wrapping freely. Rating tile on the right: `rounded-lg bg-surface-muted`, star (primary) + "4.9" `title` emphasis, "(342)" caption muted under it.
  - **Place:** map-pin (ink) + "Lake Arrowhead, CA" `body` ink.
  - **Highlights:** one row of up to 4 equal columns, icon md over a caption label: Pet Friendly first when pets are allowed, then amenities in stored order (labels from `amenityLabels`, so "Wi-Fi", not "Fast Wi-Fi"; nothing invented such as "Forest Views"). Divider below.
  - **Policy cards:** `rounded-lg bg-lavender-soft p-lg`, title `title`, subtitle caption muted, chevron-right `lavender-strong`.
    - "Ask about policies", "Cancellation, house rules, pets, check-in and more.", with a chat icon on a tile (new token `--color-lavender-tile: #e6ddff`, est.; `rounded-md`, 52 pt = `size-control-md`) → Policies sheet.
    - The stay's cancellation policy: its `title` (e.g. "Moderate cancellation") and `summary`, document icon without a tile → Policies sheet, scrolled to Cancellation.
  - Divider, then the **host row:** 60 pt photo (`hero-button` size, white ring), "Hosted by Maya" `title`, "Hosting since 2017" caption muted with a small icon, chevron-right → Host sheet (photo, name, hosting since, languages, bio). Uses the host's first name.
  - **About this stay:** the description below the host (the mock is cut off there; the generated copy belongs on this screen).
  - **Bottom bar,** fixed, `bg-surface`, top border, safe-area padding: "$289" `price` + "/ night" caption muted on the left; "Book this stay" primary Button on the right (flex-1).
- **Coming soon:** tapping Book shows an `Alert tone="info"` "Booking is coming soon." just above the bar, fading in, auto-hiding after 3 s, announced to screen readers. No native dialog.
- **Policies sheet** (`src/app/stay-policies.tsx`, formSheet like search-filters, `?id=&section=`):
  - Check-in after 4:00 PM, Checkout before 11:00 AM (12-hour, from the stored times).
  - Pets: "Pets allowed" / "No pets".
  - House rules: bullet list, word for word.
  - Cancellation: title, summary, then the full Portable Text body (paragraphs, bullets, bold) through a small renderer, no new dependency.
- **Host sheet** (`src/app/stay-host.tsx`, formSheet, `?id=`).
- **Share:** React Native `Share` with the title and `roamapp://stay/<slug>`. No new dependency.
- **States:** loading (no cached stay: spinner); details loading (skeleton blocks for cards and host); errors (no stay: the existing error + Retry; details failed: inline Alert + Retry, the basics stay); not found (existing screen).
- Hearts use `useSaved` (session only).

## Out of scope
- Booking, dates, totals. Policy questions (Context + Jev). Reviews. Superhost. A full-screen photo viewer. Photo credits on screen (kept in data).

## Steps
### 1. Details data
`StayDetails` type, the details query and `useStayDetails`. Extend `scripts/check-content.mjs` to run the details query for every stay and check photos, times, rules, host and cancellation are present. Done: the check passes.

### 2. Screen
Rebuild `src/screens/stay/stay-screen.tsx` (with `gallery.tsx`, `highlights.tsx`, `policy-card.tsx`, `host-row.tsx`, `book-bar.tsx` in `src/screens/stay/`). Add the two tokens to `global.css` (and `tokens.ts` only if a native prop needs them). Done: tsc and lint pass, and the screen renders on device.

### 3. Sheets
`stay-policies` and `stay-host` routes (registered and guarded in the root `_layout.tsx` like `search-filters`), with `policy-body.tsx` for Portable Text. Done: both open from the screen with live text.

## Verification
- tsc, lint, check-tokens, check-content, check-search.
- BlueStacks at 360 dp (and 390 dp if adb allows): open Modern Cabin from Search; swipe the gallery (counter 1 → 4); heart toggles; Share opens the share sheet; highlights show Pet Friendly, Hot Tub, Fireplace, Wi-Fi; the policies card opens the sheet with times, pets, the 5 house rules and the cancellation text matching Sanity word for word; the cancellation card opens it at Cancellation; the host row opens Maya's sheet; Book shows "Booking is coming soon." which hides itself; a bad slug shows not found.
- Screenshot compared with property-details.png, listing every difference.

## AGENTS.md updates
- Expo routing: `stay-policies` and `stay-host` formSheets pushed on the root Stack, guarded like `search-filters`.
- App reads: `useStayDetails(slug)` (photos, times, rules, host, cancellation) cached under `details:<slug>`.
- Answer text: the Policies sheet shows stored text only, until policy Q&A exists. Booking shows "coming soon".

## Result
- Built as planned. `fetchStayDetails`/`useStayDetails` add photos, times, house rules, host and the cancellation policy in one query. The screen (`stay-screen.tsx` with `gallery`, `highlights`, `policy-card`, `host-row`, `book-bar`) paints from the cached `Stay` and fills in the rest. `stay-policies` and `stay-host` are formSheets (`sheets.tsx`, `policy-body.tsx` for Portable Text). New tokens `hero-button` (60) and `lavender-tile`; new `info` Alert tone; new icons `info`, `medal`, `clock`.
- Changed while building:
  - The round buttons scroll with the photo instead of floating over the content (they covered the text once scrolled).
  - Long one-word highlight labels ("Workspace") shrink slightly instead of breaking mid-word at 360 dp.
  - `check-content.mjs` now runs the details query for all 30 stays.
- Verified on BlueStacks at 360 dp (Expo Go):
  - Search → Modern Cabin painted instantly, with skeletons, then the cards and host.
  - Gallery 1 → 2 / 4. Highlights Pet Friendly, Hot Tub, Fireplace, Wi-Fi.
  - Book shows "Booking is coming soon." and hides it after 3 s.
  - Both cards open the Policies sheet (4:00 PM / 11:00 AM, Pets allowed, the 5 rules and the cancellation text with its bold span, word for word); the cancellation card opens it at Cancellation.
  - The host row opens Maya's sheet. Share opens the system sheet. The heart toggles.
  - The stay, details and sheet error states appeared on real timeouts, and Retry recovered each.
  - tsc, lint (0 errors), check-tokens and check-content pass.
- Seen once, not reproduced: on the first run, tapping a card mounted the sheet off-screen. After restarting Metro with file watching, every tap opened it correctly (10+ tries).
- Not verified: 390 dp, iOS, the not-found screen for a bad slug (code unchanged).
- Differences from property-details.png:
  - Live data: "Moderate cancellation" in place of "Free cancellation", and Maya in place of Alex.
  - "Hosting since 2017" in place of Superhost; no total line (user choices).
  - "Wi-Fi" in place of "Fast Wi-Fi"; no invented "Forest Views".
  - The title is Bold 28, not ExtraBold ~30. The price is the 22 `price` variant (the mock is ~29). The star is outlined on Android.
  - An "About this stay" section with the description is added below the host.
- Estimated from the image: photo height (0.85 × width), button size 60, tile color, all spacing.
- Follow-up (2026-11-24): the title is now `hero-xs` (ExtraBold 30) and the price `price-lg` (ExtraBold 28) with "/ night" in ink `body`, closer to the mock. New tokens `--text-hero-xs` and `--text-price-lg`. The star stays outlined on Android: expo-symbols 58 draws icons from the outlined Material Symbols font, which has no filled version. Not yet checked on a device.
