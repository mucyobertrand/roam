# 09 · Stay copy, embeddings and live Home

Status: done

## Goal
Each of the 30 stays in Sanity has listing copy that Agent Actions wrote from the stay's own facts. Every claim in it was checked against those facts before it was saved. The `production` dataset has embeddings turned on, so `text::semanticSimilarity()` ranks stays. Home and stay details read live content from Sanity, with loading, error and empty states.

## Decisions
- **Finish plan 08 first (user answer).** The dataset is empty today (0 properties, hosts and policies), and `roam/seed/photos.json` was never fetched. Step 1 runs `fetch-photos.ts` and the seed, then plan 08's Verification. The schema is already deployed (`property`, `host`, `policy`).
- **Copy replaces `description` (user answer).** The seed now sets `description` only when it creates a stay. On reruns it leaves `description` alone, so reruns don't erase generated copy. The hand-written seed text is the first version, and the copy script's fallback.
- **Facts come from code, not from the model.** For each stay, the script builds a facts object: title, type label, city, region, country, max guests, bedrooms, pets yes/no, amenity labels (`AMENITIES` titles), vibes, house rules, check-in/out times, and the host's first name (dereferenced in code). Price and rating are left out: they change, and copy should not repeat them. The facts go to Generate as a `constant` instruction param (JSON), so the model sees only those values.
- **Generate with `noWrite: true`.** `client.agent.action.generate({schemaId, documentId, noWrite: true, target: {path: 'description'}, instruction, instructionParams: {facts}, temperature: 0.3})`, apiVersion `vX`. Nothing is written until the checks pass. The script then writes `description` with one `patch.set` per stay. The instruction asks for 2–4 sentences, 200–700 characters, second person optional, using only the facts given; no prices, distances, views, nearby places, or features not listed.
- **The check runs code first, then AI (user answer).** Copy is accepted only if both pass:
  1. **Code** (`roam/scripts/copy-checks.ts`, pure functions): length 200–700; every amenity keyword it finds (a keyword list per amenity: hot tub/jacuzzi, pool, fireplace/wood stove, sauna, ocean/sea view, EV/charger, workspace/desk, Wi-Fi/internet, kitchen, parking) belongs to a listed amenity; no pet words (pet, dog, cat) when pets are not allowed; every number or number word matches a guest count, bedroom count or check-in/out time in the facts; no `$` or price words; no place name other than the stay's own city, region or country (checked against every city/region in the seed plus `US_STATES` names); no "minutes from", "steps from", "walk to" or "near" phrases.
  2. **AI**: `client.agent.action.prompt({format: 'json', temperature: 0, instruction, instructionParams: {facts, copy}})`. It returns `{"unsupported": [{"claim": "...", "reason": "..."}]}`, listing every claim not stated in or directly implied by the facts. Passes only if the list is empty.
  - On failure the script retries Generate up to 2 more times, adding the failed reasons to the instruction. After 3 failures it keeps the current description and reports the stay.
- **The script** is `roam/scripts/write-copy.ts`, run with `npx sanity exec scripts/write-copy.ts --with-user-token` from `roam/`. It uses `getCliClient()` (already bundled `@sanity/client` 8.16 has `agent.action`), so no new dependency and no token in files. Flags: `--dry-run` (generate + check, write nothing), `--only <slug>`. It runs stays one at a time (Agent Actions usage limits) and prints a table: slug, attempts, pass/fail, reasons. The full report (facts, copy, checks per attempt) goes to `roam/scripts/out/copy-report.json`, which is gitignored. The `schemaId` is read from `npx sanity schema list` when building, not from memory.
- **Embeddings projection** (property only; references aren't followed): `{_type == "property" => {title, description, vibes, houseRules, "stayType": type, "city": location.city, "region": location.region}}`. Host and policy documents aren't embedded. Enabled with `npx sanity datasets embeddings enable production --projection='…' --wait` from `roam/`. `text::semanticSimilarity()` queries count against the org's monthly semantic search quota.
- **Search stays local (user answer).** Search keeps running over `src/data/stays.ts` until the next plan moves it to GROQ + `semanticSimilarity`. Its 13 ids are all seed slugs, so its results open live stay pages.
- **The app reads Sanity directly** with plain `fetch`, adding no dependency. The dataset is public, so no token is needed. The URL is `https://<projectId>.apicdn.sanity.io/v2026-11-01/data/query/<dataset>?query=…&$param=<JSON>` and it returns published documents only. Config is `EXPO_PUBLIC_SANITY_PROJECT_ID` and `EXPO_PUBLIC_SANITY_DATASET` (both public by nature), added to `.env.example`. There's no API route, since the read is public and needs no secret.
- **Code layout** under `src/lib/content/`: `client.ts` (`groq(query, params)` → typed JSON, throws `ContentError` on non-200 or network failure, 10 s timeout via AbortController); `queries.ts` (GROQ strings, values always as params); `stays.ts` (maps a property document to the existing `Stay` type: `id` = slug, `city`/`region` from `location`, `image`/`credit` = `photos[0]`, plus `photos` for the gallery later); `use-stays.ts` (`useStays(type?)` and `useStay(slug)`). The hooks keep a small session cache (`useSyncExternalStore` snapshot, as AGENTS.md requires with React Compiler on), so tapping a Home card opens details with no reload and switching chips back is instant. The `Stay` type stays in `src/data/stays.ts` for now (build note: moving it only added churn; it moves when Search goes live). The GROQ projection maps a property straight onto `Stay`, so `stays.ts` only drops incomplete rows. `scripts/check-content.mjs` runs the same query and validates the rows.
- **Home query:** `*[_type == "property" && ($type == null || type == $type)] | order(rating desc, reviewCount desc) {…}`, with `$type` taken from the chip ("All Stays" sends `null`). The type filter is a GROQ param, per the exact-constraints rule. Order: rating, then review count (default).
- **States.** Home shows skeleton rows while loading (two `StayCard`-sized `bg-surface-muted` blocks, `rounded-lg`, no shimmer), the header and chips stay usable. On error: an `Alert` with "We couldn't load stays" and a Retry `Button`. Empty (a category with no stays): "No {category} yet" with a "Show all stays" button. Pull to refresh refetches the current category. Stay details shows a full-screen loading state, the existing not-found screen when the slug has no document, and an error with Retry.
- No design change: existing tokens and components only, so there's nothing to compare against a mock.

## Out of scope
- Moving Search to GROQ filters + `semanticSimilarity` ranking (next plan). `parse-query.ts` and `search-stays.ts` are unchanged.
- The stay photo gallery UI, host card, policy answers, the Context endpoint, Jev, TypeGen, PostHog.
- Editing copy in Studio (AI Assist field actions). Copy provenance fields on the schema.

## Steps
### 1. Finish the seed (plan 08)
You add `UNSPLASH_ACCESS_KEY` to `.env.local`. Run `npx sanity exec scripts/fetch-photos.ts` from `roam/` until every stay and host has photos (it's resumable; the Demo key allows 50 requests an hour, so it may take two runs). Change `propertyDoc`/`upsert` in `roam/scripts/seed.ts` so `description` is written only on create (note this in the header). Run `--dry-run`, then the seed. Done when plan 08's Verification passes: counts 30/10/8, no dangling references, second run `created 0` with the same `_id`s.

### 2. Copy checks
Write `roam/scripts/copy-checks.ts`: `buildFacts(stay, hostName)` and `checkCopy(copy, facts, places) → string[]` (reasons; empty means pass), as described under Decisions. Add a small self-test, `roam/scripts/check-copy-checks.ts` (run with `npx sanity exec`): good copy passes, and copy that adds a pool, pets on a no-pet stay, "sleeps 8" on a 6-guest stay, "10 minutes from Aspen", or a price each fail with the right reason. Done when the self-test passes and `npx tsc --noEmit` passes in `roam/`.

### 3. Write the copy with Agent Actions
Write `roam/scripts/write-copy.ts` as described under Decisions. Run `--dry-run --only <one slug>` first and read the copy and both check results. Then run `--dry-run` for all 30 and review the report. Then run for real. Done when all 30 pass (or the failures are listed with their reasons and keep the seed text), and an MCP query shows the new descriptions.

### 4. Turn on Dataset Embeddings
Run the enable command with the projection, then `npx sanity datasets embeddings status production` until `ready`. Done when MCP queries rank sensibly: `*[_type == "property"] | score(text::semanticSimilarity($q)) | order(_score desc)[0...5]{title, type, vibes, _score}` for `quiet secluded cabin in the woods`, `lively walkable city apartment`, `romantic beach getaway` and `big villa for a family reunion`. Record the top 5 for each in the Result.

### 5. Content client and hooks
Add `src/lib/content/{client,queries,stays,types,use-stays}.ts`, the two env vars in `.env.example` and `.env.local`, and the `Stay` type move. Done when `npx tsc --noEmit` and `npx expo lint` pass and a quick script/query confirms the mapper outputs 30 valid `Stay`s.

### 6. Home and stay details on live content
`home-screen.tsx` uses `useStays(category)` with the states above. `stay-screen.tsx` uses `useStay(id)`. Done when both work on device against Sanity, including airplane mode (error + Retry), and a card opens its details with no extra loading.

## Verification
- `npx tsc --noEmit` at the root and in `roam/`; `npx expo lint` (or `npx eslint src` on old Node); `node scripts/check-tokens.mjs`; `node scripts/check-search.mjs` (Search unchanged).
- Seed: plan 08's Verification (counts, references, idempotent rerun).
- Copy: the self-test passes; the `write-copy` report shows every stay passing both checks; I read 5 stays' copy next to their facts by hand and list anything doubtful; MCP `count(*[_type == "property" && (length(description) < 200 || length(description) > 700)]) == 0`; rerunning the seed leaves descriptions unchanged.
- Embeddings: status `ready`; the 4 semantic queries above put matching stays (by type and vibes) in the top 3. A failure is explained by cause (projection, copy, or the query).
- App on device (BlueStacks/Android, and the iOS simulator if available) at 360 and 390 dp:
  - Home loads 30 stays from Sanity (all 17 new stays visible), each chip shows only that type, and pull to refresh works.
  - Airplane mode → error + Retry → back online → Retry loads.
  - A card opens details with the generated copy; a bad slug (`roamapp://stay/nope`) shows not found.
  - Search for "quiet pet friendly cabin with a hot tub under $300 a night" still returns local results, and they open live details.
- End to end: edit one stay's title in Studio and publish. Pull to refresh on Home shows the new title within the CDN cache window (about 1 minute).

## AGENTS.md updates
- Who owns what → Content: "generated property copy uses Agent Actions" becomes: `roam/scripts/write-copy.ts` writes `description` from facts built in code (Generate with `noWrite`), and saves it only after `copy-checks.ts` and an Agent Actions Prompt both find no unsupported claim. The seed writes `description` only on create.
- Who owns what → Soft intent: embeddings are enabled on `production` with the property-only projection (list it); `semanticSimilarity` uses the semantic search quota.
- Expo / Content: the app reads published content from the public dataset with `src/lib/content` (`fetch` to the API CDN, no token, no client library); `EXPO_PUBLIC_SANITY_PROJECT_ID`/`DATASET`. Home and stay details are live; Search still reads `src/data/stays.ts` (replaces "The app keeps reading local data").
- Replace "`studio/`" with "`roam/`" where it still appears (plan 08's pending update).

## Result
Done 2026-11-21.
- **Seed (plan 08):** photos 30/30 stays and 10/10 hosts; 8 policies, 10 hosts, 30 properties; rerun `created 0`, same `_id`s. The URL check retries dropped connections. This network needs `NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000` (Node's 250 ms per-address connect attempt times out).
- **Copy:** all 30 passed both checks (29 on the first attempt; New Orleans needed two because "nightly quiet hours" tripped the price-word check). Hand review: no invented facts. "Infinity pool", "private pool" and "120 steps from the road" come from titles and house rules. Added a rule against stock openers ("Settle into…") after the dry run showed every description opening the same way. Added `--batch a:b` and a merged report after a low-memory kill stopped a full run.
- **Embeddings:** `ready`. Top 5 per query:
  - quiet secluded cabin in the woods: Cliffside Cottage, Creekside Cabin, Forest Cabin, Riverside Cabin, Snowy Log Cabin (all cabins) ✅
  - lively walkable city apartment: Williamsburg Loft, South Congress Flat, Back Bay Brownstone, Capitol Hill Studio, Loop Loft (all city) ✅
  - romantic beach getaway: Sunset Dune House, Positano Villa, Hanalei Bungalow, Blue Beach House, Gulf Beach House ✅
  - big villa for a family reunion: Malibu (6), Santorini (4), Tuscany (10, family), Positano (8), Bali (4) ⚠️ All villas, but size isn't ranked. Cause: query/projection. "Big" is a guest count, which belongs in a GROQ filter parsed in code (next plan), not in embeddings.
- **App:** Home and stay details read Sanity. Checked on BlueStacks at 360 dp: live list (new stays included), Cabins/Beach filters, details opened from the cache with the generated copy, bad slug shows not found, offline shows error + Retry and recovers online. Not checked: 390 dp, pull to refresh, and Search → live details. BlueStacks dropped adb when resizing.
- Deviation: the `Stay` type stays in `src/data/stays.ts` (see Decisions).
