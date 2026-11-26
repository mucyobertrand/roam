# 08 · Content model and seed

Status: done

## Goal
Roam's stays, hosts and policies live in Sanity (project `fb47orcg`, dataset `production`) with a schema built from the screens so far, and a seed script that loads 30 realistic stays. Running the script again updates the same documents instead of duplicating them. The app keeps reading local data until a later plan switches it over.

## Decisions
- **Screens drive the fields (user answers).** Result rows keep their current fields: photo, title, city/region, rating + review count, two badges (amenities / Pet Friendly), price. Stay details adds a **photo gallery**. Host card, map and room details are not needed yet. Ratings are **numbers on the stay**, with no review documents. Photos are **Unsplash URLs + credit**, not Sanity assets.
- **Three document types.** `property` (one per stay), `host` (shared, referenced by properties) and `policy` (shared Roam policies; properties reference one cancellation policy).
- **Filter fields are typed, with fixed value lists matching `src/data/stays.ts`.**
  - `type`: string, list `cabin | beach | city | villa`, radio.
  - `pricePerNight`: number, integer, min 1, USD.
  - `maxGuests`, `bedrooms`: number, integer, min 1.
  - `petsAllowed`: boolean, required, initial false. Pets are a strict yes/no filter today; the pet rules text lives in the shared pet policy.
  - `amenities`: array of strings, list `hot-tub pool fireplace wifi kitchen parking sauna ocean-view workspace ev-charger` (Studio titles from `amenityLabels`), unique.
  - `location`: object with `city` (string, required), `region` (string, required; US two-letter code uppercase like `CA`, otherwise a region name like `Tuscany`, matching today's data and `US_STATES` in `parse-query.ts`) and `country` (string, ISO 3166 alpha-2 like `US`, required).
  - `rating`: number, 0–5, precision 0.1. `reviewCount`: integer, min 0. Both are used for sorting.
- **Descriptive text lives on the property** so a future embeddings index sees it without references: `description` (text, required, 200–700 chars), `vibes` (array of strings, tags layout: soft words like quiet, cozy, secluded) and `houseRules` (array of strings, rules specific to this stay). `checkInTime`/`checkOutTime` are strings like `15:00`, validated as HH:MM.
- **Photos:** `photos` is an array of a `remotePhoto` object (`url` https URL to images.unsplash.com, `credit` the Unsplash page URL, `alt` text), required, 3–6 per stay. The first photo is the cover and replaces today's `image`/`credit`. Each photo keeps its credit, per AGENTS.md.
- **`slug`** (from title, required, unique) on property and host, and a `key` slug on policy. This is the stay's route id (`/stay/[id]`, today's `id`) and how the seed finds existing documents. Sanity generates every `_id`; references point to `_id`s the script looked up or got back from a create.
- **`host`:** `name` (required), `slug`, `photo` (remotePhoto), `bio` (text), `hostingSince` (integer year), `languages` (array of strings). 10 hosts, each with 2–4 stays.
- **`policy`:** `title`, `key` (slug), `category` (list `cancellation | payment | pets | safety | damage | support`), `summary` (string, one line), `body` (Portable Text, normal paragraphs + bullet lists + bold only). Answers will quote `body` word for word, so it is written as final copy. Seed: 3 cancellation tiers (Flexible, Moderate, Strict) plus one each of payment, pets, safety, damage and support: 8 policies.
- **`property.cancellationPolicy`** is a required reference to a `policy`, filtered to `category == "cancellation"`. The other policies apply Roam-wide (looked up by category), so properties don't reference them.
- **`property.host`:** a required reference to `host`.
- **Studio:** the schema lives in `roam/schemaTypes/{documents,objects}/` in kebab-case files, using `defineType`/`defineField`/`defineArrayMember`, an icon on each type (`@sanity/icons/<Name>` subpaths, already installed with `sanity`), and previews showing title, city and cover photo. Fields are grouped `Details / Filters / Photos / Rules`.
- **Seed** (`roam/scripts/seed.ts`, run with `npx sanity exec scripts/seed.ts --with-user-token` from `roam/`). It uses `getCliClient()` from `sanity/cli`, so no new dependency and no write token in files. Data lives in `roam/seed/{stays,hosts,policies}.ts`.
  - The script fetches existing `_id`s by slug or key, then runs one transaction per type in the order policies → hosts → properties. Existing documents get `patch.set` on every seeded field; missing ones are `create`d without `_id`, so Sanity generates it. It never deletes.
  - Running it again is a no-op apart from resetting seeded fields to the seed values; this is noted in the script header.
  - Documents are written published, not as drafts. The script refuses to run if it finds two documents with the same slug.
- **The 30 stays:** the 13 in `src/data/stays.ts`, with their text and photos kept, plus 17 new ones, for 7–8 of each type. Places are spread across US states and a few international regions. Prices run $95–$1,200, guests 2–14, and 10–12 stays are pet friendly. Every amenity appears on at least 3 stays, and the texts use vibe words realistically, so search checks have something to separate.
- **Photos are real and verified.** New photos come from Unsplash's public search (`unsplash.com/napi/search/photos?query=…`, no personal data sent). The script checks every image URL with an HTTP request before writing anything, and stops if any request fails. No photo IDs are invented.

## Out of scope
- Switching the app from `src/data/stays.ts` to Sanity (GROQ queries, client, API routes).
- TypeGen, the embeddings index, the Context endpoint, Jev, review documents, host card, map, beds/baths, Sanity image assets, availability and dates.

## Steps
### 1. Schema in the Studio
Create `roam/schemaTypes/objects/remote-photo.ts`, `documents/property.ts`, `documents/host.ts` and `documents/policy.ts` exactly as described under Decisions, and register them in `roam/schemaTypes/index.ts`. Add `roam/schemaTypes/constants.ts` with the stay type and amenity value lists (value + title) so Studio and seed share them. Done when `npx tsc --noEmit` and `npx sanity schema validate`, both run in `roam/`, pass.

### 2. Deploy the schema and Studio
Deploy from the local Studio (user choice): `npx sanity schema deploy` and `npx sanity deploy` in `roam/`. The MCP `deploy_schema` refuses to run when a local Studio exists. Then use the Sanity MCP to confirm the deployed schema has `property`, `host`, `policy` and `remotePhoto` (`list_workspace_schemas` / `get_schema`).

### 3. Seed data
Write `roam/seed/policies.ts` (8), `hosts.ts` (10) and `stays.ts` (30) as typed arrays keyed by slug, with stays referencing hosts and cancellation policies by slug. Collect real Unsplash photos for the new stays and the galleries, each image URL with its page URL.

### 4. Seed script
Write `roam/scripts/seed.ts` as described under Decisions. It first validates every stay against the value lists and checks every photo URL, then upserts. It prints `created N / updated M` per type.

### 5. Run and verify
Run the seed, check the counts with the Sanity MCP, run it again, and check the counts are unchanged.

## Verification
- `npx sanity schema validate` passes in `roam/`. `npx tsc --noEmit` passes in `roam/` and at the root, and `npx eslint src` at the root (the app is unchanged).
- After the first seed run, the MCP `query_documents` returns `count(*[_type=="property"]) == 30`, `host == 10` and `policy == 8`. No property has a dangling `host` or `cancellationPolicy` reference (`count(*[_type=="property" && (!defined(host->_id) || !defined(cancellationPolicy->_id))]) == 0`), and every cancellation reference points to category `cancellation`.
- A second seed run reports `created 0`, the counts are unchanged, and the `_id`s are the same as after the first run (compare a sorted `_id` list).
- Filter spot checks through MCP GROQ with params:
  - `type == $t` gives 7–8 stays for each type.
  - `pricePerNight <= 300 && petsAllowed && "hot-tub" in amenities` returns at least 1 stay (the onboarding example sentence).
  - `location.region == "CA"` returns several stays.
- Studio opens (`npx sanity dev` in `roam/`) and a property shows grouped fields, its cover preview and a working host reference.

## AGENTS.md updates
- Content: the Studio lives in `roam/` (replacing "`studio/`" everywhere it appears).
- Content: document types `property`, `host` and `policy`; `property.slug` is the stay's route id; the first entry in `photos` is the cover; filter field value lists live in `roam/schemaTypes/constants.ts` and must match `src/data/stays.ts` until the app reads from Sanity.
- Content: seed with `npx sanity exec scripts/seed.ts --with-user-token` from `roam/`. It upserts by slug, is safe to rerun and never deletes.
- Content: how the schema is deployed (from the approval answer).

## Result
Finished as step 1 of plan 09 (2026-11-21). Photos fetched (30 stays, 10 hosts; four host searches broadened because every result was premium). The seed's URL check now retries dropped connections. Seed: policy 8, host 10, property 30; no dangling references; 7–8 per type; the onboarding sentence matches 2 stays; CA has 8. The rerun reported `created 0 / updated 30` and the `_id`s were unchanged. Later change: the seed writes `description` only on create (plan 09).
