# 10 · Live Search on Sanity, with search analytics

Status: done

## Goal
The Search tab (already built from `assets/prompt-imgs/search.png` in plan 07) shows stays from Sanity: hard filters are GROQ filters, Best match is ranked by Dataset Embeddings on the soft words. Every search that returns results, and every search that returns nothing, is tracked in PostHog without sending anything the guest typed.

## Decisions
- **The design stays as built** (plan 07): back button + grey search field with sliders; scrolling filter chips (active lavender first, then up to 4 suggestions); "N stays" + "Sort by Best match ⌄"; result rows (photo 40% of row capped by its token, title, heart, location pin, star rating (reviews), two amenity badges, "$289 / night"). Only the data source changes. Titles, prices and counts now come from Sanity, so they differ from the mock's sample values (e.g. "Forest Cabin with Hot Tub", real counts instead of "124"). Known plan-07 differences stay (outlined star on Android, native tab bar, pool/water glyphs).
- **Query (user choice: rank on soft words).** `src/lib/content/search.ts` builds the GROQ from `Filters` + `Sort`. Code writes the clauses; every value is a param:
  - `($max == null || pricePerNight <= $max) && ($guests == null || maxGuests >= $guests) && (!$pets || petsAllowed == true) && (count($types) == 0 || type in $types) && count($amenities[@ in ^.amenities]) == count($amenities)`.
  - Places: one clause per place, `count($place0[@ in string::split(lower(^.location.city + " " + ^.location.region), " ")]) == count($place0)`, where `$place0` is the place's words (a US state name becomes its code, e.g. `["ca"]`). Places are OR'd, as today. This keeps whole-word matching ("ca" never matches Cape May), checked against the live API.
  - Best match with soft words: `| score(text::semanticSimilarity($soft)) | order(_score desc, rating desc, reviewCount desc)`, `$soft` = soft words joined by spaces. Without soft words (or any other sort) no semantic score is used, so no quota: `best`/`rating` → rating, reviews; `price-asc`/`price-desc` → price, then rating. Checked on the public CDN with no token (works).
  - `client.ts` `GroqParams` accepts string arrays.
- **Known places for the parser** come from Sanity: a cached `*[_type == "property"]{city, region}` list (`usePlaces`), loaded by Home and Search. `paramsForSentence(sentence, places)` takes it. If it hasn't loaded, place words fall through to soft words and still rank via embeddings.
- **Caching:** `use-stays.ts`'s session cache gets a generic `useContent(key, fetcher)`; `useSearch(filters, sort)` keys on the normalized filters + sort and fills the `stay:<slug>` entries, so a row opens its stay instantly.
- **States:** loading → two row skeletons; error → Alert + Retry; a failed refresh keeps the old results with an inline Alert; empty → the existing "No stays match all of that" with Clear filters / Clear search; pull to refresh.
- **Filters sheet count:** a `count(*[…])` query for the draft (no score), debounced 250 ms. The button keeps the last count while one loads and is disabled at 0.
- **Local sample data goes:** the `stays` array in `src/data/stays.ts` and `src/lib/search/search-stays.ts` are removed. The file keeps `Stay`, `StayType`, `Amenity`, labels and icons. Its header changes to say it holds the app's stay types.
- **PostHog (user choice: add it, user pastes the key).** `npx expo install posthog-react-native@4 expo-file-system expo-application expo-device expo-localization`. `EXPO_PUBLIC_POSTHOG_KEY` / `EXPO_PUBLIC_POSTHOG_HOST` (project keys are public by design) in `.env.example` without values. `src/lib/analytics/`:
  - One client: `new PostHog(key, {host, disabled: !key, captureAppLifecycleEvents: false})`. No autocapture, no screens, no touches, no session replay. With no key, everything no-ops and the app works.
  - Identified through Clerk: `identify(user.id)` once signed in (no email, no name), `reset()` on sign-out, from the root layout.
  - Every call is wrapped so a PostHog failure never throws into the app.
- **Events (user choice: two events).** `search_results` and `search_no_results`, with `result_count`, `source` (`sentence` | `example` | `chip` | `sheet` | `home`), `sort`, `stay_types` and `amenities` (closed lists), `pets`, `has_price`, `has_guests`, `place_count`, `soft_word_count`. Never the sentence, place names, soft words, prices or guest numbers. Sent once per distinct search when its results load: the search state carries a `source` and an `id` that changes on every new search, so tab switches, re-renders and cache hits don't send it again. Failed requests send nothing.

## Out of scope
- Screen tracking and other events. Session replay.
- Moving the parser to Jev. Guests stay a GROQ filter, not part of the semantic text.
- A design for the filters sheet. Dark mode.

## Steps
### 1. Live search query
Add `src/lib/content/search.ts` (`buildSearch(filters, sort)` → `{query, params}`, `fetchSearch`, `fetchCount`, `fetchPlaces`), with array params in `client.ts`. Move `placeWordsOf`/state mapping so the builder and parser share it. Rewrite `scripts/check-search.ts` to run the parser cases and then the built GROQ against the CDN: expected chips per sentence, every result satisfying its hard filters, "beach in california" empty, "villa under $100" empty, sort orders correct, and "quiet secluded cabin" ranking a cabin with a quiet vibe in the top 3. Done: the check passes.

### 2. Hooks and Search screen
Generic `useContent` in `use-stays.ts`; `useSearch`, `usePlaces`. Search screen reads `useSearch`, with the four states and pull to refresh. Sheet count uses `fetchCount`, debounced. `paramsForSentence` takes places. Search state gains `source` and `id`; Home, examples, chips, sheet and field set them. Remove the sample array and `search-stays.ts`; drop the local-id check from `scripts/check-content.mjs`. Done: tsc, lint, checks pass, and the screen works on device.

### 3. PostHog
Install, add `src/lib/analytics` (client, `useIdentify` in the root layout, `trackSearch`), call `trackSearch` from Search when a search id's results load. Add the env names to `.env.example`. Done: with no key the app runs and logs nothing; with a key, events show in PostHog's activity view with only the listed properties.

## Verification
- `npx tsc --noEmit`, `npx expo lint`, `node scripts/check-tokens.mjs`, `node scripts/check-search.mjs`, `node scripts/check-content.mjs`.
- Device (BlueStacks, 360 and 390 dp): Home "Cabins in California" → Cabins + California chips, live cabins in CA only; tap Under $300 and Quiet → results change; Sort by → sheet count updates, Price: low to high reorders; "villa under 100" → empty state, Clear filters; a row opens its stay instantly; airplane mode → error + Retry recovers; pull to refresh.
- Compare a screenshot with search.png and list every difference.
- Analytics: with no key, no errors. With the key, one `search_results` per search above and one `search_no_results` for "villa under 100", checked in PostHog's activity view (or the debug log if the key isn't there yet). Switching tabs sends nothing new.

## AGENTS.md updates
- App reads: Search is live too (`useSearch`, `usePlaces`); `src/data/stays.ts` holds only types. Remove "Search still reads src/data/stays.ts" and the local-id check note.
- Exact constraints: replace the "until Sanity search exists" paragraph with the GROQ builder in `src/lib/content/search.ts` (place words via `string::split`, values as params), the parser still in `src/lib/search`, and the new check.
- Soft intent: Best match scores the soft words only when there are any.
- Analytics: posthog-react-native client in `src/lib/analytics`, disabled without a key, identified by Clerk user id only; the two search events and their allowed properties.

## Result
- Built as planned. Search is live on Sanity: `src/lib/content/search.ts` builds the GROQ (filters as params, places via `string::split`, `semanticSimilarity` on soft words only for Best match), `use-search.ts` adds `useSearch`/`usePlaces` on the shared `useContent` cache, and the screen has loading skeleton rows, error + Retry, refresh-error alert, empty state and pull to refresh. The filters sheet counts live with a debounced `count()`. The local sample array and `search-stays.ts` are gone.
- PostHog `posthog-react-native@^4.87.1` (+ expo-file-system, expo-application, expo-localization; expo-device was already there). `src/lib/analytics`: no client without a key, identify by Clerk user id, `search_results`/`search_no_results` once per search id.
- Changed while building:
  - `scripts/check-search.ts` now checks live content by invariants (every result satisfies every hard filter, sort orders, `count()` equals results, top-3 vibes for soft words) instead of fixed ids. It runs through `scripts/expo-fetch-shim.mjs`, which drops the app's 10 s timeout and retries connects: Node's DNS + first connect on this network took 6–22 s.
  - Clear filters / Clear search are tracked with source `chip`.
- Verified: tsc, lint (0 errors, 3 old warnings), token check, check-search (14 live cases), check-content. On BlueStacks at 360 dp: Home error + Retry recovered on a slow first load; "Cabins in California" → skeleton, then 5 live stays; Under $300 → 4; sheet live count 4 → 5 with Beach; Price: low to high applied ($175, $195, …); "villa under 100" → empty state; "quiet secluded cabin" ranks Creekside (4.7) above Modern Cabin (4.9), so ranking is by meaning; the search survives a tab switch; a stay opens instantly from the cache; no runtime errors with no PostHog key.
- Not verified: Search's own offline error (BlueStacks ignores network toggles), pull to refresh (capture inconclusive), 390 dp, events arriving in PostHog (no key yet), iOS.
- Differences from search.png: live titles, prices and counts (the mock's sample data); at 360 dp Modern Cabin shows only Hot Tub because Pet Friendly doesn't fit on one line (plan 07 rule); plus plan 07's known differences.
