# 06 · Home, Search, native tabs

Status: done

## Goal
A signed-in guest lands on Home (design: `assets/prompt-imgs/home.png`). They see a greeting, a search pill, category chips and big stay cards built from realistic local data. Typing a sentence in the pill and submitting opens the Search tab, which lists ranked results for that sentence. The app has four native tabs: Home, Search, Trips, Profile. Tapping a card opens a simple stay screen. Motion is subtle: press feedback, chip state, list reflow and first-load entrances, following `.claude/skills/expo-animation`.

## Decisions
- **Tabs (user request):** `NativeTabs` from `expo-router/unstable-native-tabs` in `src/app/(tabs)/_layout.tsx`. Triggers in order: `home`, `search`, `trips`, `profile`.
  - Icons, iOS SF / Android Material: `house` (`house.fill` when selected) / `home`; `magnifyingglass` / `search`; `calendar` / `calendar_today`; `person` (`person.fill` when selected) / `person`.
  - Themed with tokens through `src/theme/tokens.ts`: `tintColor` ink, `indicatorColor` primary (the Android pill behind the selected icon), `iconColor` ink, labels in Plus Jakarta SemiBold 12.
  - **Known difference:** the design draws a custom floating glass pill with a yellow circle on the selected tab. Native tabs are the platform's own bar (iOS system/liquid-glass bar, Android Material 3 bottom bar with a yellow indicator pill), so that shape can't be matched exactly. This is accepted because native tabs were requested.
  - No `role="search"`: that iOS role turns the tab into a system search field, but our Search tab has its own pill.
  - Tab switches don't animate (skill rule).
- **Routes:**
  - `src/app/(tabs)/home.tsx`, `search.tsx`, `trips.tsx`, `profile.tsx`. URLs stay `/home`, `/search?q=…`, `/trips`, `/profile`, so `/` and `goHome()` keep working.
  - `src/app/stay/[id].tsx` is pushed on the root Stack, above the tabs.
  - In the root `_layout.tsx`, `Stack.Protected guard={isSignedIn}` wraps `(tabs)` and `stay/[id]`.
  - The old `src/app/home.tsx` is deleted, and its Sign out moves to Profile.
- **Data (user request: realistic local data):** `src/data/stays.ts`, 12 stays with 3 of each type: cabin, beach, city, villa. The shape mirrors the future Sanity property document:
  - `id`, `title`, `type`, `city`, `region` (e.g. "Lake Arrowhead", "CA"), `pricePerNight` (USD), `rating`, `reviewCount`, `maxGuests`, `bedrooms`, `petsAllowed`, `amenities` (fixed list: `hot-tub`, `pool`, `fireplace`, `wifi`, `kitchen`, `parking`, `sauna`, `ocean-view`, `workspace`, `ev-charger`), `vibes` (soft words such as quiet, cozy, secluded, romantic, lively, family), `description`, `image`, `credit`.
  - Photos are remote Unsplash images with the photo's Unsplash page as `credit` (AGENTS rule). Each URL is checked to return 200 before it's used.
  - The first stay is "Modern Cabin with Hot Tub", Lake Arrowhead, CA, 4.9.
- **Search (user choice: parse + rank):** `src/lib/search/`.
  - `parse-query.ts` turns a sentence into `{ maxPrice?, guests?, pets?, types[], amenities[], place?, softWords[] }`, parsed in code:
    - price: "under / below / less than / max / up to $300", "$300 or less", "$300 a night";
    - guests: "4 guests / people / adults", "for 4";
    - pets: "pet(s) / pet friendly / dog(s) / cat(s)";
    - type words and synonyms: cabin/cottage/chalet/lodge → cabin, beach/beachfront/oceanfront/coastal → beach, city/apartment/loft/downtown → city, villa/mansion → villa;
    - amenity phrases ("hot tub", "jacuzzi", "pool", "fireplace", "wifi", "sauna", "ocean view", "workspace" …);
    - place: any word matching a stay's city or region;
    - the rest, minus stop words, become `softWords`.
  - `search-stays.ts` uses the hard fields as filters (price, guests, pets, types, amenities, place). It ranks by the number of soft words found in `vibes`, `title` and `description`, then by rating. It returns the results and the parsed filters.
  - This stands in for GROQ filters plus embeddings and is replaced when Sanity search lands. An empty query returns every stay, ranked by rating.
- **Home (from the design; px values are estimated from the 680-px-wide mock ÷ 1.744 → pt):**
  - Background `bg-surface`; screen padding `px-xl`. The top inset comes from safe-area and the bottom from the native tab bar (automatic content insets).
  - Header row: `<Wordmark>` at a new `home` size (est. 34) on the left. On the right, an avatar circle (est. 84) on `bg-primary-soft`: the Clerk profile photo when `user.hasImage`, otherwise initials in `heading` ExtraBold. The avatar opens Profile.
  - Greeting: "Hey, {firstName} 👋" in `title` SemiBold `tone="muted"`. Falls back to "Hey there 👋" with no first name.
  - Headline: "Find your\nnext stay" in `hero` ExtraBold. To its right, a search tile (est. 60×84, `rounded-xl`, `bg-surface-muted`) with the `search` icon md; it opens Search with the field focused.
  - Search pill: `h-field` (60), `rounded-full`, `bg-lavender`, `pl-lg pr-sm`. It has a `sparkles` icon, a TextInput in `body` Medium `ink` with placeholder "quiet pet friendly cabin with hot tub", and a white circle button (`size-icon-button`, 48) with the `arrow-up-right` icon. The placeholder is drawn in `ink` as the design shows; typed text looks the same. Submitting (keyboard search key or the arrow) goes to `/search?q=<text>`. Empty text just opens Search.
  - Category chips wrap in rows (`flex-row flex-wrap gap-sm`): All Stays (`home-fill`), Cabins (`cabin`), Beach (`beach`, a waves glyph), City (`city`), Villas (`villa`). A new Chip size `lg`: `h-icon-button` (48), `px-lg`, `gap-sm`, icon md, `button` Medium; selected `bg-primary`, otherwise `bg-surface-muted` with no border. Single choice; filters the cards below. Added to `/design-system`.
  - Stay card (`src/components/stay-card.tsx`, shared by Home and Search):
    - full width, photo height new token `stay-card` (est. 264), `rounded-xl`, `overflow-hidden`;
    - rating pill top-right: `bg-surface rounded-full px-md py-sm`, `star` icon sm + `title` Bold;
    - a bottom gradient from transparent to `scrim-strong` (new token, est. rgba(11,11,26,0.75)), drawn with RN's `experimental_backgroundImage: linear-gradient(...)` and the color read from `tokens.ts` (no new dependency);
    - on it: `map-pin` + "City, Region" in `caption` `tone="inverse"`, the title in `heading` Bold `tone="inverse"` (max 2 lines), and a white circle button (`size-control`, 56) with `chevron-right`;
    - card and button both open `/stay/<id>`. Cards are spaced `gap-2xl`. The button is decorative for screen readers; the card carries the label "Title, City, rating X".
  - Assets: no new images. Icons come from `expo-symbols` through `icon.tsx`, which gets these entries: `sparkles` (sparkles / auto_awesome), `arrow-up-right` (arrow.up.right / north_east), `home-fill` (house.fill / home), `waves` for beach (water.waves / waves), `inverse` text tone if missing. "Villas" uses the existing `villa` symbol; the design's palm tree has no matching SF Symbol (difference noted).
- **Search screen (user choice: from the design system):**
  - Same safe-area and padding as Home; title "Search" in `heading-lg` ExtraBold.
  - The same lavender pill, editable and pre-filled from `q`. It auto-focuses when `q` is empty. Submitting updates `q`.
  - Below it, a row of read-only Badges showing what code understood ("Under $300", "Pets", "Cabin", "Hot tub", "4 guests", "Lake Tahoe"), then "N stays" in `caption` `tone="muted"`, then the stay cards.
  - Empty state (no `q`): "Describe your stay in one sentence" with 3 example sentences as chips that run a search.
  - No-results state: "No stays match all of that", listing the filters, with a "Clear search" button.
  - Data is local and synchronous, so there's no loading state; the error state is the no-results state.
- **Stay screen (user choice: simple):** `src/app/stay/[id].tsx`, headerless.
  - A photo of height `stay-card` with an IconButton back (`chevron-left`, outline, on `bg-surface`) over it.
  - Below: title `heading` ExtraBold; `map-pin` City, Region; `star` rating (reviews); "$X / night" `title` Bold; "Up to N guests · N bedrooms · Pets allowed / No pets"; amenities as `Badge`s; description `body`.
  - Unknown id → "We couldn't find that stay" with a Back button.
- **Trips / Profile (user choice: stubs):**
  - Trips: "No trips yet" (`heading` ExtraBold), a `body` muted line, and a "Find a stay" Button that opens Search.
  - Profile: avatar (same as Home), full name, email, and Sign out (moved from the old home, same error handling).
- **Auth module:** `User` gains `firstName` and `imageUrl` (null when Clerk's `hasImage` is false).
- **Motion (expo-animation skill; Reanimated 4.7.1 is installed; no new dependencies, no haptics because `expo-haptics` isn't installed):**
  - `src/components/ui/pressable-scale.tsx` (new primitive, shown in `/design-system`): a Reanimated CSS transition on `transform` to `scale: 0.97`, 120 ms, `cubicBezier(0.23, 1, 0.32, 1)`, `hitSlop`/`pressRetentionOffset`. Used by stay cards, chips (lg), the search tile, and the arrow and chevron buttons. Purpose: feedback; frequency tier: tens/day → under 150 ms.
  - Chip selection: a CSS transition on `backgroundColor`, 150 ms ease-out. Purpose: state indication.
  - Category filter reflow on Home: cards use `LinearTransition.duration(200).easing(EASE_OUT)`, `FadeIn` 200 ms entering and `FadeOut` 150 ms exiting (a plain `ScrollView` + map, not a virtualized list). Purpose: spatial consistency.
  - First load of Home and each new Search result set: `FadeInDown.duration(250)` with a 40 ms stagger, only on the first 3 cards (the rest appear without delay). On Home it runs on first mount only (tabs keep their state), not on every tab focus. On Search it runs when results change. Purpose: preventing a jarring pop-in of photos.
  - Rejected: tab switch animation (100+/day; native default), header or parallax effects (no purpose named), animated search pill focus (frequent, and the keyboard is the feedback).
  - Reduced motion: layout animations use `.reduceMotion(ReduceMotion.System)`. Entrances drop translation and keep the fade (`FadeIn` instead of `FadeInDown` when `useReducedMotion()`), and the press scale is skipped.
  - Constants live in `src/theme/motion.ts` (`EASE_OUT`, `CSS_EASE_OUT`, durations).
- **Proposed new tokens** (estimated, listed per AGENTS "Building from designs"): `--spacing-avatar-lg: 84px`, `--spacing-wordmark-home: 34px`, `--spacing-search-tile-w: 60px`, `--spacing-search-tile-h: 84px`, `--spacing-stay-card: 264px`, `--color-scrim-strong: rgba(11, 11, 26, 0.75)`. Mirrored in `tokens.ts` only where a native prop needs them (the gradient color, tab colors, the tab font).

## Out of scope
Real search (Sanity GROQ, embeddings, Jev), booking, saving/favorites, trips data, profile editing, the stay detail design, haptics, a custom (non-native) tab bar, iOS verification (no iOS simulator on this Windows machine).

## Steps
### 1. Data and search logic
Pick 12 Unsplash photos (Unsplash's public search JSON from the host, no personal data). Check each image URL returns 200, then write `src/data/stays.ts`. Write `src/lib/search/parse-query.ts` and `search-stays.ts`, plus `scripts/check-search.ts` (run with `npx tsx` if available, otherwise a plain `.mjs` copy of the parse cases) asserting realistic sentences:
- "quiet pet friendly cabin with a hot tub under $300 a night" → cabin, pets, hot-tub, ≤300, soft "quiet";
- "beach house for 6 people with a pool";
- "cozy loft downtown";
- "villa in Tuscany";
- "something romantic under 200";
- "".

Done: the script prints each query's parsed filters and top 3 results, and every assertion passes.

### 2. Tokens, icons, primitives
Add the proposed tokens to `global.css` (and to `tokens.ts` with `check-tokens` updated). Add the icon entries and the `inverse` tone if missing. Add the `home` Wordmark size, `PressableScale`, Chip `lg` with the color transition, and `src/theme/motion.ts`. Add PressableScale and Chip lg to `/design-system`. Done: tsc, lint and the token check pass.

### 3. Routes and tabs
Create `src/app/(tabs)/_layout.tsx` (NativeTabs, themed as above) and stub screens. Update the root `_layout.tsx` guards to wrap `(tabs)` and `stay/[id]`, and delete `src/app/home.tsx`. Add `firstName`/`imageUrl` to `User`. Build Profile (with Sign out) and Trips. Done: signed in, the four tabs show and switch; signed out, `/home`, `/search`, `/profile` and `/stay/x` redirect to onboarding; Sign out works from Profile.

### 4. Home
Build `src/screens/home/` (header, greeting, search pill, category chips) and `src/components/stay-card.tsx` with the motion above. Done: matches the design within the known differences; chips filter with reflow; submitting the pill opens `/search?q=…`.

### 5. Search and stay screens
Build `src/screens/search/` (pill, understood-filter badges, count, results, empty and no-results states) and `src/app/stay/[id].tsx` (+ `src/screens/stay/`). Done: the step 1 sentences give the expected results on device, and a card opens its stay screen.

## Verification
- `npx tsc --noEmit`, `npx eslint src`, `node scripts/check-tokens.mjs`, `npx expo-doctor` (the existing patch-version warning aside), and the search check script pass.
- On Android (BlueStacks + Expo Go), with screenshots:
  1. Home vs `home.png`: list every difference, fix, and repeat. Report estimated values and the known native-tab difference.
  2. Chips: each category filters cards with a smooth reflow; All Stays restores them.
  3. Type "quiet pet friendly cabin with a hot tub under $300 a night" and submit → the Search tab shows badges Under $300 / Pets / Cabin / Hot tub and only matching stays, Modern Cabin first.
  4. Search: edit to "beach house for 6 people with a pool" → new results with entrance; "villa on the moon" → the no-results state, then Clear search → the empty state with examples.
  5. Tap a card → stay screen; Back returns; an unknown id shows the not-found state.
  6. Tabs: Trips' "Find a stay" opens Search; Profile shows name and email, and Sign out → onboarding; the tabs can't be reached when signed out.
  7. Reduced motion on (Android "Remove animations") → no translate or scale, fades only.
- Not possible here: an iOS simulator screenshot (Windows) and a release-build feel check. Both are reported ❌ with these reasons.

## AGENTS.md updates
- Expo → Routing: tabs are `NativeTabs` in `src/app/(tabs)/` (home, search, trips, profile); `stay/[id]` is pushed on the root Stack; both are guarded by `isSignedIn`. Native tabs are themed through `tokens.ts` and can't match a custom floating tab design.
- Design system: `PressableScale` is the press feedback for every custom pressable; motion constants are in `src/theme/motion.ts`; animations follow the expo-animation skill (no tab animations, reduced motion respected). Chip has an `lg` size. `StayCard` lives in `src/components/` (Home and Search).
- Who owns what / Rules: until Sanity search exists, `src/lib/search` parses sentences in code (price, guests, pets, type, amenities, place) and ranks soft words over local `src/data/stays.ts`. Its result shape matches what the real search will return.

## Result
- Built as planned: native tabs (Home, Search, Trips, Profile), Home from home.png, 12 local stays (Unsplash photos, each URL checked 200), parse + rank search on `/search?q=`, a simple stay screen, Trips/Profile stubs, and Reanimated motion (PressableScale, chip background cross-fade, filter reflow, first-load fades, reduced-motion fallbacks).
- Changed while building:
  - Native tabs import from `expo-router/native-tabs`; `unstable-native-tabs` logs a deprecation warning in SDK 58 (the expo-router skill still shows the old path).
  - The no-results example is "villa under $100", not "villa on the moon": soft words only rank, so they can't empty the list (AGENTS rule).
  - The search examples are shortened so each fits one chip line.
  - The Android cabin icon is Material `forest` (pine trees, as in the design), not `cabin`.
  - The search check runs with `node scripts/check-search.mjs`, through `jiti` (already in node_modules as a transitive dependency).
  - The press-scale styles are plain objects typed `CSSStyle`; RN 0.88's `ViewStyle` types reject Reanimated transition values inside `StyleSheet.create`.
- Verified on Android (BlueStacks + Expo Go), with screenshots:
  - Home layout vs home.png.
  - Chips filter; the Cabins and Villas lists change.
  - Typing on Home and submitting → Search badges Cabin / Under $300 / Pets / Hot tub → 1 stay, Modern Cabin.
  - The beach example → Montauk and Malibu.
  - The no-results state and Clear search.
  - A card opens the stay screen; Back returns; an unknown id shows not-found.
  - Trips and Profile.
  - Signed out, /home, /search, /profile and /stay/… redirect to onboarding.
  - tsc, eslint, the token check and the search check pass.
- Known differences from home.png:
  - The tab bar is the native Material 3 bar (yellow indicator), not the floating pill.
  - The star is outlined on Android; Material's `star` has no filled variant through expo-symbols here.
  - The avatar shows initials for accounts without a photo.
  - Card titles wrap by device width (the test device is about 411 dp wide vs the 390-pt mock).
  - Villas uses `villa`, not a palm tree.
- Estimated from the image: wordmark 34, avatar 84, search tile 60×84, card photo 264, scrim 75% ink, and all spacing.
- Not verified: iOS (no simulator on Windows), motion feel in a release build, and reduced-motion on device. Photos load slowly on the emulator's network (500–900 ms round trips).
