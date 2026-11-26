# 07 · Search screen from the design

Status: done

## Goal
The Search tab matches `assets/prompt-imgs/search.png`:
- a back button, and a grey search field holding the sentence, with a sliders button;
- a scrolling row of filter chips that toggle filters;
- "N stays" with "Sort by Best match ⌄";
- horizontal result rows: photo, title, heart, location, rating (reviews), two amenity badges, "$289 / night".

The sliders button and "Sort by" open one native sheet with sort and filters. Hearts save stays for the session. The sample data matches the stays shown in the design.

## Decisions
- **Chips toggle filters (user choice).** Search state is the sentence `q` plus explicit filters, kept in the URL so Home, the chips and the sheet share it:
  - `/search?q=…&types=cabin&max=300&guests=4&pets=1&amen=hot-tub,pool&places=ca&soft=quiet&sort=best`.
  - Submitting a sentence (Home pill or the Search field) parses it once, and the URL filters reset to what was parsed.
  - Chips and the sheet change only the filter params. `q` stays as typed and is shown in the field.
  - Chip row, horizontally scrollable: active filters first, selected (lavender), each removable. Then up to 4 suggestions, unselected, that aren't already active, from: "Under $300", "Pet Friendly", "Hot tub", "Pool", "Quiet". Tapping a suggestion adds it.
  - Labels follow the design: type plural ("Cabins", "Villas", "Beach", "City"), "Under $X", "N+ guests", "Pet Friendly", amenity names, place names, and soft words title-cased ("Quiet"). Soft-word chips only re-rank; they never filter (AGENTS rule).
- **Search module:**
  - `src/lib/search/filters.ts`: a `Filters` type (types, maxPrice, guests, pets, amenities, places, softWords), `filtersFromParams` / `filtersToParams`, and `chipLabel`.
  - `search-stays.ts` becomes `searchStays(filters, sort, all)`. `parseQuery(sentence)` still turns a sentence into `Filters`.
  - Sort: `best` (soft-word score, then rating, then reviews — today's order), `price-asc`, `price-desc`, `rating` (rating, then reviews).
- **Places and states (user choice: match the design):** the parser learns US state names → abbreviations (all 50 + DC), e.g. "California" → `ca`.
  - Place filters compare **whole words** against each stay's city words and its region, so "ca" can't match "Cape May".
  - The chip shows the name as typed, title-cased ("California").
- **Data (user choice: match the design):** `src/data/stays.ts` changes:
  - Modern Cabin with Hot Tub: $289, 342 reviews.
  - Glass House above the Ocean (Malibu) → "Oceanview Villa with Private Pool", type villa, $412, 4.8 (128), amenities pool, ocean-view, hot-tub, wifi, kitchen, parking. Same photo.
  - Snowline A-Frame (Big Bear) → "A-Frame in the Redwoods", Monte Rio, CA, $236, 4.9 (96), pets allowed, amenities fireplace, wifi, kitchen, parking, sauna. Same photo (a cabin among tall trees). Id becomes `a-frame-monte-rio`.
  - New: "Designer Home in Wine Country", Healdsburg, CA, villa, $365, 4.7 (201), 8 guests, 4 bedrooms, no pets, amenities pool, workspace, wifi, kitchen, parking, ev-charger, vibes modern/quiet/views/wine. Photo: Unsplash `photo-1608476037397-7b53ace4c871` (credit `https://unsplash.com/photos/brown-and-white-concrete-house-near-green-trees-under-blue-sky-during-daytime-lbZG3-qm2ac`), checked to return 200 first.
  - That makes 13 stays. `scripts/check-search.ts` cases are updated and gain "Cabins in California" → the 3 California cabins (Lake Arrowhead, Monte Rio, South Lake Tahoe).
  - The design's "124 stays" is placeholder copy; we show the real count.
- **Hearts (user choice: session):** `src/lib/saved.ts` is a tiny in-memory store (`useSaved(id)` → `[saved, toggle]`, built on `useSyncExternalStore`). It resets on app restart and gets replaced by a real Saved feature. The heart shows `heart` / `heart-fill` (filled in `danger`, est.) on a `bg-surface-muted` circle.
- **Sort + filters sheet (user choice: one sheet, no design, so built from the design system):** `src/app/search-filters.tsx` on the root Stack, guarded by `isSignedIn`.
  - Presentation: `presentation: "formSheet"`, `sheetAllowedDetents: [0.85]`, `sheetGrabberVisible: true`, `sheetCornerRadius` from the `xl` radius in `tokens.ts`.
  - It reads the current search params. Contents:
    - Sort: `SegmentedControl` or radio rows (Best match, Price: low to high, Price: high to low, Top rated);
    - Type: Chip filter ×4;
    - Max price: chips (Any, $150, $200, $300, $500);
    - Guests: `Stepper` (Any…12);
    - Pets: `Switch` on the `primary` color;
    - Amenities: chips.
  - Footer: "Reset" (ghost) and "Show N stays" (primary, live count). Applying calls `router.dismissTo({ pathname: "/search", params })`.
  - Opened by the sliders button (`sliders` icon) and by "Sort by …".
- **Search screen layout (from the design; px ÷ 1.826 → pt, estimated):**
  - `bg-surface`, `px-xl`, top inset + `lg`.
  - Header row, `gap-md`:
    - back button: a `size-control-md` circle (52, new token), `bg-surface-muted`, `chevron-left`. It goes `router.back()` when possible, otherwise to `/home`.
    - search field: `h-control-md`, `rounded-full`, `bg-surface-muted`, `pl-lg pr-sm`; `search` icon, a TextInput in `body` Medium ink with placeholder "Describe your stay" in `placeholder`, and a `sliders` IconButton (ghost, md icon). The keyboard's search key submits the sentence.
  - Chip row: `mt-lg`, horizontal ScrollView (bleeds to the screen edges, content `px-xl gap-sm`). New Chip size `filter`: `h-icon-button-sm` (36), `px-xl`, `caption` Medium (SemiBold when selected); selected `bg-lavender`, unselected `bg-surface-muted`, no border; background cross-fade through `PressableScale`.
  - Meta row: "N stays" in `body` Medium ink on the left; on the right "Sort by" `caption` muted + the sort label in `caption` Bold + `chevron-down` sm (new icon), pressable.
  - Result rows (`src/screens/search/stay-row.tsx`, used only here), `flex-row gap-md`, rows `gap-lg`:
    - photo `w-result-photo` (140) × `h-result-photo` (148), new tokens, `rounded-lg`;
    - right column `flex-1 gap-xs`:
      - title in `title` Bold (max 2 lines), with the heart (`size-control-sm` 44) top-right;
      - `map-pin` sm muted + "City, Region" `caption` muted;
      - `star` sm `primary` + rating `body` Medium ink + "(reviews)" `body` muted;
      - 2 badges (new Badge size `pill`: `px-md py-xs rounded-full`, `caption`, icon sm, neutral tone). They show filter-matching amenities first, then "Pet Friendly" when pets are allowed, then the stay's first amenities;
      - "$289" in new text `price` (22/28, est.) ExtraBold + " / night" `caption` muted.
    - The whole row opens `/stay/<id>`; the heart toggles without opening.
  - States: no `q` and no filters → the existing empty state with example chips (restyled to the new header). No results → "No stays match all of that", listing the active filter labels, with "Clear filters" (keeps `q`'s soft words) and "Clear search".
- **Icons (`icon.tsx`):**
  - New: `chevron-down` (chevron.down / expand_more), `pool` (figure.pool.swim / pool), `flame` (flame / local_fire_department), `wifi` (wifi / wifi), `kitchen` (fork.knife / restaurant), `car` (car / local_parking), `sauna` (heat.waves / sauna), `laptop` (laptopcomputer / laptop), `ev` (bolt.car / ev_station), `ocean` (water.waves / water).
  - Existing: `hot-tub`, `paw`, `heart`, `heart-fill`, `sliders`.
  - An amenity → icon map lives in `src/data/stays.ts`.
  - The design shows a Wi-Fi glyph for "Pool" and a mountain for "Ocean View"; we use matching glyphs (difference noted). The star is outlined on Android (expo-symbols has no filled Material star, as in plan 06).
- **Motion (expo-animation skill):** `StayList` gets a `variant: "card" | "row"` so Search keeps:
  - the first-load fade-up (first 3 rows staggered 40 ms) when the sentence changes;
  - the reflow when chips, filters or sort change (removed rows fade out 150 ms, new rows fade in 200 ms, the rest glide 200 ms ease-out), so a re-sort visibly reorders;
  - press scale on rows, chips, heart, back and sort;
  - the sheet uses native presentation, and the heart is an instant icon swap (state indication, no extra animation);
  - reduced motion: fades only.
- **Proposed new tokens (estimated):** `--spacing-control-md: 52px`, `--spacing-result-photo-w: 140px`, `--spacing-result-photo-h: 148px`, `--text-price: 22px` / `--text-price--line-height: 1.272727`. `tokens.ts` mirrors the sheet corner radius (`--radius-xl`).

## Out of scope
A real Saved/favorites feature and persistence, a server-side search, a map view, an iOS check (no simulator on Windows), and a design for the filters sheet (built from the design system until one exists).

## Steps
### 1. Data and search module
Check the new photo URL. Update `stays.ts` (the 3 edits, the new stay, the amenity icon map). Add state names and whole-word place matching to `parse-query.ts`. Add `filters.ts` and refactor `search-stays.ts` to `(filters, sort)`. Update `check-search.ts`: existing cases plus "Cabins in California" plus each sort order. Done: `node scripts/check-search.mjs` passes, tsc passes.

### 2. Tokens and primitives
Add the tokens, icons, Chip `filter`, Badge `pill` and the `price` text variant; show the new Chip and Badge sizes in `/design-system`. Add `src/lib/saved.ts`. Give `StayList` the `row` variant. Done: tsc, lint and the token check pass.

### 3. Search screen
Rebuild `src/screens/search/search-screen.tsx` (header, chip row, meta row, rows, states) with `stay-row.tsx`. Home's pill submits through the same parse → params helper. Done: matches search.png within the listed differences.

### 4. Sort + filters sheet
Add `src/app/search-filters.tsx` (+ `src/screens/search/filters-sheet.tsx`), register it in the root Stack as a formSheet inside the signed-in guard, and wire the sliders and "Sort by". Done: changing sort or filters and tapping "Show N stays" updates the results with reflow.

## Verification
- `npx tsc --noEmit`, `npx eslint src`, `node scripts/check-tokens.mjs`, `node scripts/check-search.mjs` pass.
- On Android (BlueStacks + Expo Go), with screenshots compared to search.png (every difference listed and fixed or justified):
  1. Home pill "Cabins in California" → Search shows "Cabins in California" in the field, chips Cabins + California (selected) then suggestions, "3 stays", and rows Modern Cabin ($289, 4.9 (342), Hot Tub + Pet Friendly), A-Frame in the Redwoods, Creekside Cabin.
  2. Tap "Under $300" → Creekside ($340) fades out and the rest glide. Tap Cabins (deselect) → California stays of every type.
  3. Sort → Price: low to high → the rows reorder ascending. The count in "Show N stays" matches the list.
  4. Sliders → the sheet: set Pets on + Pool → only matching stays; Reset → the sentence's filters again.
  5. Heart a row → filled; switch tabs and come back → still filled; relaunch → cleared (session only).
  6. Back → previous tab/Home. A row → its stay screen.
  7. "villa under $100" → no-results state; Clear filters / Clear search work. No query → the empty state.
- Not possible here: iOS screenshots and a release-build feel check; both reported ❌.

## AGENTS.md updates
- Expo → Routing: `search-filters` is a root-Stack formSheet (guarded). Search state lives in `/search` URL params (`q` plus explicit filters and `sort`); the chips and the sheet change filters, and submitting a sentence re-parses.
- Who owns what → Exact constraints note: places match whole words, and US state names map to abbreviations. Sort options: best, price-asc, price-desc, rating.
- Design system: Chip sizes md, sm, lg, filter; Badge size pill; text `price`; `StayList` variants card/row. Saved hearts are session-only (`src/lib/saved.ts`) until a Saved feature exists.

## Result
- Built as planned: header (back + grey field + sliders), toggle chips, count + Sort by, result rows, one formSheet for sort + filters, session hearts, data aligned to the design (13 stays) and US state names in search.
- Changed while building:
  - **Search state moved from the URL to a session store** (`src/lib/search/search-state.ts`). Switching tabs navigates to `/search` with no params, which replaced them and wiped the search. URL params are now input only: Home, the example chips and the sheet send them with an `at` timestamp, and the screen copies them into the store once per `at`.
  - `useSaved` returns its value from the `useSyncExternalStore` snapshot. Reading the module `Set` during render was memoized by React Compiler, so the heart never updated.
  - The heart is pinned top-right (`PressableScale` gained `pressableClassName`), so one-line titles don't leave a gap above the location.
  - Badge order follows the design: filtered amenities, then the lead amenity, then Pet Friendly. Suggestions are ordered Under $300, Pet Friendly, Quiet, Hot Tub, Pool.
  - The "Best match" label uses `emphasis` (SemiBold), not a bold class: `className` on Text is layout only.
- Verified on Android (BlueStacks + Expo Go), screenshots vs search.png:
  - Home "Cabins in California" → Cabins + California selected, 3 stays (Modern Cabin $289 4.9 (342) Hot Tub · Pet Friendly, A-Frame in the Redwoods $236, Creekside $340).
  - Under $300 → 2 stays; the search survives switching to Trips and back.
  - Sort by → sheet (state reflected, live count) → Price: low to high → A-Frame before Modern Cabin.
  - The heart toggles and survives tab switches.
  - A row opens its stay; Back → Home.
  - "villa under 100" → the no-results state; Clear filters keeps soft words (13 stays).
  - tsc, lint (0 errors), token check (15) and the search check (13 cases) pass.
- Known differences from search.png:
  - The star is outlined on Android.
  - Pool and Ocean View use pool/water glyphs (the design shows Wi-Fi and mountain glyphs).
  - Titles fit on one line on the wider test device.
  - The count is real (3), not the design's "124".
  - The tab bar is native.
  - The filters sheet has no design yet.
- Estimated from the image: control-md 52, result photo 140×148, price text 22/28, all spacing.
- Not verified: iOS, release-build motion feel, the sheet's Pets + Pool combination and Reset on device (logic shared with the checked chips), and session hearts clearing on relaunch.
