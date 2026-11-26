# Roam

Expo React Native rental app. Guests describe a stay in one sentence ("quiet pet friendly cabin with a hot tub under $300 a night") and get ranked stays back. They can also ask booking and policy questions about a stay, answered with exact text from Roam's own content.

This file is the project's memory: it holds every decision that is still true. Plans in `prompts/` are history.

## Commands

~~~bash
npx expo install <package>  # ALWAYS use instead of npm install: resolves SDK-compatible versions
npx expo start              # dev server (press i for the iOS simulator)
npx expo lint               # lint
npx tsc --noEmit            # type check
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npx eas-cli@latest <cmd>    # EAS builds, submits, and updates (use instead of bare `eas`)
~~~

## Expo

- Expo ships breaking changes every SDK release, so don't trust memory. Before touching an Expo, EAS, or React Native API, check the `expo` major version in `package.json` and read `https://docs.expo.dev/versions/v<major>.0.0/`. For anything else, start from https://docs.expo.dev/llms.txt and follow its links.
- Routes live in `src/app/`: every file is a screen and `_layout.tsx` files define navigators. API routes are `src/app/api/*+api.ts`. Keep components, hooks, and utils outside `src/app/`.
- Routing: `/` sends signed-in users to `/home` and everyone else to `/onboarding`. Signed-in screens are native tabs, `NativeTabs` from `expo-router/native-tabs` (not `unstable-native-tabs`, deprecated in SDK 58), in `src/app/(tabs)/`: `home`, `search`, `trips`, `profile`. `stay/[id]` and the formSheets `search-filters` (sort + filters), `stay-policies` (`?id=&section=cancellation`), `stay-host` (`?id=`) and `roam-policies` (Roam's cancellation policies, from Profile) are pushed on the root Stack, all registered with the same sheet options. The current search (sentence `q`, filter params, `sort`) lives in a session store (`src/lib/search/search-state.ts`), because a tab switch navigates to `/search` with no params. URL params are input only: send them with an `at` timestamp and a `src` (see `paramsForSentence`), and Search copies them once per `at`. Every new search gets a new store `id` and a `source`, which analytics uses to send each search once. The root `_layout.tsx` guards `(tabs)`, `stay/[id]` and the sheets with `Stack.Protected guard={isSignedIn}`, and `onboarding` and `(auth)` with `!isSignedIn` (`index`, `sso-callback` and `design-system` are open). It keeps the splash up until fonts and Clerk are ready. Native tabs are themed through `tokens.ts` (`colors`, `tabLabel`) and can't match a custom floating tab design. Auth screens live in `src/app/(auth)/` (`sign-up`, `verify-email?mode=sign-up|sign-in`, `sign-in`); their UI is in `src/screens/auth/`. The root Stack is headerless; screens opt in to a header.
- Auth is Clerk (`@clerk/expo` Core 3 "future" hooks: `useSignUp`/`useSignIn` methods resolve `{ error }`, no `/legacy`) behind `src/lib/auth` `useAuth()` (`isLoaded`, `isSignedIn`, `user`, `signUp`/`verifySignUp`/`resendSignUpCode`, `signIn` → `"complete" | "needs_code"`, `verifySignIn`/`resendSignInCode`, `hasPendingCode`, `signInWithGoogle` → `"complete" | "cancelled"`, `signOut`). Google uses Clerk `useSSO` from `@clerk/expo/experimental` (browser OAuth via `expo-auth-session`/`expo-web-browser`); its redirect is `roamapp://sso-callback` in builds and `exp://<host>/--/sso-callback` in Expo Go, each allowlisted in Clerk (`create_redirect_url`), and `src/app/sso-callback.tsx` redirects to `/`. Screens never import `@clerk/expo`; Clerk error codes become `AuthError(message, field)` in `clerk-errors.ts`. Sessions persist through `ClerkProvider tokenCache` (expo-secure-store). A failed Clerk load counts as loaded, signed out, so the splash never hangs. Dev testing: `anything+clerk_test@example.com`, code `424242`. Restart the dev server after changing `.env.local`.
- Screen-specific components live in `src/screens/<screen>/`; promote to `src/components/` only when a second screen uses them.
- Sample photos are remote Unsplash images; keep each photo's Unsplash page URL next to its image URL as credit.
- Layouts must hold from 360 to 430 dp wide. Design mocks are 390 pt: use their sizes as maximums, make fixed-size media proportional (e.g. the result photo is 40% of the row, capped by its token), and let text wrap or drop optional items (one-line badge rows hide what doesn't fit) rather than truncate. BlueStacks is 540 dp wide, so check phone widths with `adb shell wm size 720x1440` (360 dp) and `780x1560` (390 dp), then `wm size reset`.
- Size full-screen pagers from the measured layout (`onLayout`), not `useWindowDimensions()`: on Android edge-to-edge the window height excludes the status bar.
- `ios/` and `android/` are generated. Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, switch to a development build (`npx expo run:ios`).

## Design system

- Tokens (colors, Plus Jakarta Sans families, type ramp, spacing, control sizes, radii, shadows) live only in `src/global.css` `@theme`. Use token classes (`bg-primary`, `p-xl`, `rounded-lg`); never hex, px or `fontSize` in components or screens. New values go into the theme first.
- A native prop that can't take a class reads `src/theme/tokens.ts`, a mirror checked by `node scripts/check-tokens.mjs`. Keep it tiny.
- Fonts: one family token per weight (`font-jakarta-regular|medium|semibold|bold|extrabold`). Never `font-sans` (NativeWind pins it to the system font on native) and never `font-bold`/`fontWeight` with them.
- Shadows are `@utility` rules with a literal `box-shadow` in `global.css`, not `--shadow-*` tokens: react-native-css drops Tailwind's `--tw-shadow` variables on native.
- Text goes through `<Text variant tone>`, icons through `<Icon name tone>` (expo-symbols name map in `icon.tsx`). `className` on primitives is for layout only.
- Shared primitives live in `src/components/ui/` (Button, IconButton, TextField, Chip (sizes md, sm, lg, filter), Badge (md, sm, pill), Alert, SegmentedControl, Stepper, PressableScale). Shared app views live in `src/components/` (`StayCard`, `StayList` with card/row variants, `SearchPill`, `Avatar` (`lg` 84, `xl` 104), `Wordmark`, `PolicyCard`, `PolicyBody`, and `SheetFrame`/`SheetSection` in `sheet.tsx` for form sheets). Text has `price` and `stat` variants. Saved hearts are session-only (`src/lib/saved.ts`) until a Saved feature exists. With React Compiler on, read external state through `useSyncExternalStore` snapshots, never from module variables during render. Promote a view there only once two screens use it. `/design-system` is the dev showcase; add new primitives to it.
- The roam wordmark is `assets/images/brand/wordmark{.svg,.png,@2x,@3x}`, generated by `python scripts/generate-wordmark.py`: "oam" from League Spartan Bold (`scripts/fonts/`, OFL, build-time only) plus a custom rounded "r" (stem flowing into a round shoulder and a flat arm) built from the font's stem width, per the user's reference. It is the only place that face is used; app text stays Plus Jakarta Sans. Show it with `<Wordmark size>`: `sm` 16 auth header, `md` 28 onboarding, `lg` 48 brand lockup with `<Text variant="tagline">`. Change the mark by rerunning the script, never by hand.
- Motion follows `.claude/skills/expo-animation`, with constants in `src/theme/motion.ts`. Every custom pressable uses `PressableScale` (0.97, 120 ms). Animated values (scale, selected background) go in Reanimated `style` typed `CSSStyle`, not classes. List entrances only run in plain (non-virtualized) lists (`StayList`). Tabs and screens use native transitions. Reduced motion drops movement and keeps fades.
- Light mode only (`userInterfaceStyle: "light"`) until a dark design exists.
- `npx expo lint` needs Node >=22.13; on older Node run `npx eslint src`.
- `metro.config.js` sends `expo-asset`'s `react-native` import past NativeWind's rewrite: the RC0 shim lacks `AssetRegistry` (RN 0.88), which breaks every runtime font (Plus Jakarta Sans, and Android/web icons). Keep it until react-native-css exports `AssetRegistry`; after upgrading NativeWind, check that fonts and icons still load on Android.
- Line heights in `@theme` are unitless ratios. On native, react-native-css multiplies the number by the font size, so `px` line heights push text off-screen.

## Who owns what

Each tool has one job. Ask before moving a responsibility to a different tool.

- **Auth:** Clerk is the source of truth. The app keeps its own custom auth screens. Set Clerk up through the Clerk CLI (≥ 4.1; 3.x's `clerk mcp run` stdio bridge can't authenticate) and use the Clerk MCP, the HTTP server `https://mcp.clerk.com/mcp` registered by `clerk mcp install --client claude`. Its SDK snippets still show the pre-4.x API; for this SDK, trust the installed `@clerk/expo` types. Instance settings change through `clerk config patch` (now: first/last name optional, min password 8, HIBP on, device trust on, so sign-in on a new device needs an emailed code). Google sign-in is on onboarding, sign-in and sign-up (dev uses Clerk's shared Google credentials; production needs its own Google client). Apple stays hidden until configured.
- **Content:** Sanity project `fb47orcg`, dataset `production` (public). Studio is a standalone app in `roam/` (hosted at roam-app-stays.sanity.studio); deploy its schema with `npx sanity schema deploy` there, since the MCP `deploy_schema` refuses when a local Studio exists. Types: `property` (`slug` is the stay's route id, the first of `photos` is the cover), `host`, `policy`; filter value lists live in `roam/schemaTypes/constants.ts`. Seed with `npx sanity exec scripts/seed.ts --with-user-token` from `roam/`: it upserts by slug, never deletes, and writes `description` only on create. Photos come from `scripts/fetch-photos.ts` (needs `UNSPLASH_ACCESS_KEY`) into `seed/photos.json`. If Node scripts get `UND_ERR_CONNECT_TIMEOUT` on this network, run them with `NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000`.
- **Property copy:** Agent Actions, from `roam/scripts/write-copy.ts` (`--dry-run`, `--only <slug>`, `--batch a:b`). It builds facts in code (`copy-checks.ts`: type, place, guests, bedrooms, pets, amenities, vibes, house rules, times, host first name; never price or rating), generates into an in-memory document (`noWrite`) so the model sees only the facts, and saves `description` only after the code checks and an Agent Actions Prompt fact check both find nothing unsupported. Self-test: `scripts/check-copy-checks.ts`. Rerun it after changing a stay's facts.
- **App reads** published content from the public dataset through `src/lib/content` (`fetch` to the API CDN, no token, no client library; `EXPO_PUBLIC_SANITY_PROJECT_ID`/`_DATASET`). `useStays(type)`, `useStay(slug)`, `useStayDetails(slug)` (photos, times, house rules, host, cancellation policy with its Portable Text body), `useSearch(filters, sort)` and `usePlaces()` share one session cache (`useContent`); list results fill the stay entries, so details paint instantly and fill in when `details:<slug>` arrives. `node scripts/check-content.mjs` also runs the details query for every stay. Home, Search and stay details are all live. `src/data/stays.ts` holds only the `Stay` shape, types and labels. Check the projection with `node scripts/check-content.mjs`.
- **Exact constraints** (price, guests, type, amenities, pets, place): GROQ filters built in code by `src/lib/content/search.ts`, with every value passed as a param. A place matches when all its words are whole words of `string::split(lower(city + " " + region), " ")`, so "ca" never matches Cape May. The sentence is parsed in code by `src/lib/search/parse-query.ts` (US state names map to region codes; known places come from `usePlaces`), and `filters.ts` holds the `Filters` shape, chips and URL params. The filters sheet counts with `count()` (no score). Check it against live content with `node scripts/check-search.mjs` (Node maps `expo/fetch` to `scripts/expo-fetch-shim.mjs`). Stay photos are Unsplash images with a `credit`.
- **Soft intent** (quiet, cozy, secluded): Dataset Embeddings via `text::semanticSimilarity($soft)` inside `score()`, then `order(_score desc, rating desc, reviewCount desc)`. Search scores only the soft words (what the parser leaves after the hard filters), and only for Best match with soft words, since each scored query counts against the org's semantic search quota. Enabled on `production` with the projection `{_type == "property" => {title, description, vibes, houseRules, "stayType": type, "city": location.city, "region": location.region}}`; change it with `npx sanity datasets embeddings enable production --projection=…` (never `disable`, which deletes them).
- **Policy knowledge:** a Sanity Context endpoint in Knowledge Base mode. Context endpoints are created in the Dashboard's Context app and read with an organization token (Context Viewer), per https://www.sanity.io/docs/ai/context-migration-guide. One endpoint serves one mode. The Context skill still describes `sanity.agentContext` Studio documents with a project token; that route is deprecated, so don't use it.
- **Typed decisions** (which stay topics and policies answer a question): Jev, called from API routes through the AI SDK's `experimental_evaluate` with the `@ai-sdk/typesafe-ai` provider and `TYPESAFE_AI_API_KEY`. No Vercel AI Gateway. Keep `ai` and `@ai-sdk/typesafe-ai` pinned to exact versions, since the API is experimental.
- **Answer text:** none generated. Answers show the stay's own fields and policy text word for word, with their source. No LLM runs in the app. Until policy Q&A exists, stay details' "Ask about policies" opens the Policies sheet: check-in/out, pets, house rules and the full cancellation policy, as stored. Booking is not built: "Book this stay" shows "Booking is coming soon." and there is no total (no dates yet). Profile shows real account data only (Clerk name, photo and email; no invented location, tier or rating): Trips is 0 until bookings exist, Saved is the session count, and rows without a feature (and the settings gear) show "{Label} is coming soon.". Its policy card links to every `policy` with `category == "cancellation"`, word for word; never show policy claims that no policy document makes.
- **Analytics:** PostHog (`posthog-react-native`), one client in `src/lib/analytics`, created only when `EXPO_PUBLIC_POSTHOG_KEY` is set (host `EXPO_PUBLIC_POSTHOG_HOST`); no autocapture, lifecycle events, screens or replay, and every call swallows failures. `useAnalyticsIdentity` in the root layout identifies by Clerk user id only and resets on sign-out. Events: `search_results` / `search_no_results`, once per search id when results load, with `result_count`, `source`, `sort`, `stay_types`, `amenities`, `pets`, `has_price`, `has_guests`, `place_count`, `soft_word_count`. Never the sentence, places, soft words, prices or guest numbers.

## Rules

- Secret keys (Clerk secret key, TypeSafe key, Sanity organization token, Sanity write token) never reach the app bundle. Use them only in API routes and local scripts such as seeding. Never put them behind `EXPO_PUBLIC_`, which is bundled into the app. Never commit `.env`. Keep variable names, without values, in `.env.example`.
- Sanity Context needs a deployed Studio for the dataset. Redeploy Studio from `roam/` after schema changes.
- Jev is not an agent. It answers typed questions (Choice, Noul, Score) with probabilities. It never writes GROQ, calls tools, or generates text. Code builds queries from its answers.
- Prices, guest counts, and dates are parsed in code. Jev may choose between candidates code found, but never produces the value.
- Embeddings rank, they don't filter, and they only see the document itself (no references). Hard constraints are always GROQ filters, and text that should affect ranking lives on the property document.
- Policy answers show only text from the stay's data and Roam's policies, word for word. If nothing answers the question, say so and point to support.
- API routes verify the Clerk session before doing any work.
- PostHog failures never block the app. Never send what guests type, tokens, or personal data in events.
- Let Sanity generate document IDs. Model relationships as references.
- Ask before adding a dependency or service, changing the Sanity schema once content exists, or deleting data. Prefer Expo modules over third-party libraries.
- Whenever you need input from the user, ask through your tool's built-in question panel so they pick from options instead of typing. Give two to four clear options with the recommended one first. Fall back to plain text only if no such panel exists.

## How we build features

For a new feature or a change across several files. Small fixes and questions skip this.

1. **Understand.** Read the code involved. Open an earlier plan only if this feature builds directly on it (pick by file name). Read the current docs pages for the APIs you'll use, and load a matching skill if one exists (e.g. the Expo, Clerk, Sanity, Sanity Context, or TypeSafe skills). Don't write version-specific APIs from memory.
2. **Ask.** If a real decision is unclear (scope, visible behavior, data shape), ask in the question panel, batching questions into one round and following up only if the answers raise new ones. Pick defaults for the rest and list them. If a decision in this file looks wrong, raise it instead of changing it.
3. **Plan.** Copy `prompts/TEMPLATE.md` to `prompts/NN-feature-name.md` (next number) and fill it in. The plan must be self-contained, so a fresh session can build it from this file plus the plan alone.
4. **IMPORTANT: stop and wait.** Write no app code until the user approves the plan. Ask for approval in the question panel (approve, or request changes). If they request changes, update the plan and ask again. On approval, set `Status: approved`.
5. **Build** step by step, checking each one. If a step turns out wrong, stop and explain instead of redesigning.
6. **Close out.**
   - Run the plan's Verification and give the report described under Reporting.
   - Add a short `## Result` to the plan and set `Status: done`.
   - Update this file: put each lasting decision in the section it belongs to. Replace or remove rules that are no longer true instead of appending. Keep this file under 150 lines.

## Building from designs

Designs are attached in the chat. Screens must match them exactly: layout, spacing, sizes, colors, type, radii, icons, and copy.

- Icons, fonts, and brand images come from `assets/` or the chosen icon library, never recreated from a screenshot. Sample property photos may be remote placeholder images. If an asset is missing, use a marked placeholder and list it.
- Map every color, font, spacing value, and radius to a design-system token. List values with no token in the plan as proposed new tokens instead of hardcoding them. When creating the design system itself, derive the tokens from the designs.
- UI plans describe the design (elements, states, tokens, assets) well enough to build without the image. If building in a new session, ask for the design to be attached again.
- After building, open the screen in the iOS simulator (deep link with `xcrun simctl openurl booted <url>` when it isn't the first screen; the scheme is in `app.json`), take a screenshot (`xcrun simctl io booted screenshot <path>`), and compare it with the design. List every difference, fix, and repeat. Report which values were estimated from an image.

## Reporting

End every piece of work that changes code (features and fixes, not answers to questions) with this report. Use these headings in this order, and leave out any section that would be empty.

- **Done:** one line on the outcome, then the files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence (command output, screenshot). List what wasn't checked as ❌ with the reason. Never mark something ✅ without running it.
- **You need to:** numbered actions only the user can take, such as keys, dashboard settings, manual steps in Sanity, or assets to provide.
- **Test it yourself:** numbered steps to reproduce the result from a fresh start, ending with `Expected:` and what the user should see.
- **Notes:** defaults picked, trade-offs, and anything left for later.

## Checks

- Lint and type check pass before any task is called done.
- Screens that load data handle loading, error, and empty states.
- AI features are tried against realistic inputs, and failures are explained by cause: missing data, the decision Jev made, the query, or the code.