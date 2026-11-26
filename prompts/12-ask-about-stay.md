# 12 · Ask about this stay (chat, sample answers)

Status: approved

## Goal
From stay details, "Ask about policies" opens a full-screen **Ask about this stay** chat. A guest taps a topic chip or types a question. Each reply is one **answer card per topic**, showing the stay's own stored text word for word with a **source label**, not a written paragraph. There's no backend yet: topics are matched in code and the answers come from the `useStayDetails` data the details page has already loaded.

## Decisions
- **User choices:**
  - No mockup: the screen follows the existing design language (property-details.png lavender cards, chips, type ramp). Every size below is **estimated**.
  - Answers are the **stay's real stored text** (check-in and checkout, pets, house rules, cancellation, amenities, host), not made-up sample text.
  - **Typed questions** go through a keyword matcher in code that maps words to topics. If nothing matches, the reply says it can't answer and points to support. This is temporary until Jev picks the topics (see the Rules in AGENTS.md).
  - The **"Ask about policies" card opens the chat**. The cancellation card still opens the Policies sheet, and so does tapping an answer's source label.
- **Route:** `src/app/stay-ask.tsx` (`?id=<slug>`), a full-screen push on the root Stack (not a formSheet, because the keyboard and a growing thread need the whole screen), guarded by `isSignedIn` like `stay/[id]`. The UI lives in `src/screens/stay-ask/`.
- **Topics** (`src/lib/ask/topics.ts`, pure and with no React): `checkin`, `pets`, `rules`, `cancellation`, `amenities`, `host`. Each topic has:
  - a chip label: Check-in, Pets, House rules, Cancellation, Amenities, Host
  - an icon: clock, paw, list, document, sparkles, user
  - the question a chip sends: "What time is check-in and checkout?", "Can I bring my pet?", "What are the house rules?", "What's the cancellation policy?", "What amenities are there?", "Who is the host?"
  - keywords, matched as whole words or phrases in the lowercased question, for example:
    - pets: pet, pets, dog, cat, puppy
    - cancellation: cancel, refund
    - checkin: check in, check-in, checkout, arrive, late, early
    - rules: rule, smoke, party, quiet hours, noise
    - amenities: wifi, hot tub, pool, parking, kitchen…, built from `amenityLabels` plus synonyms
    - host: host, owner, who
  - `matchTopics(question)` returns the matched topics in a fixed order, so one question can return several cards.
- **Answers** (`answerFor(topic, details)` → `{ topic, title, icon, body, source }`), using stored values only:
  - checkin: "Check-in after 4:00 PM" / "Checkout before 11:00 AM" (`to12h`, moved from `sheets.tsx` to `src/lib/ask` or a shared util). Source: "Stay details", which opens the Policies sheet.
  - pets: "Pets allowed" / "No pets", the same text as the Policies sheet. Source: "Stay details", which opens the Policies sheet.
  - rules: the house rules as bullets, word for word. Source: "House rules", which opens the Policies sheet. If the stay has no rules, the card says "This stay hasn't listed house rules."
  - cancellation: the policy `summary` (emphasis), then the full body through `PolicyBody`. Source: "Roam · {policy title}", which opens the Policies sheet at `section=cancellation`.
  - amenities: icon and label for each amenity (`amenityLabels`/`amenityIcons`). Source: "Stay details", which isn't tappable because no sheet lists amenities.
  - host: name, "Hosting since 2017", languages. Source: "Host profile", which opens the Host sheet.
  - A topic with no data (no host, no cancellation policy) gets the no-answer card for that topic, and its chip is hidden.
- **Layout (top to bottom):**
  - **Header** (safe-area top, `px-xl`): an `IconButton` with `outline`, `chevron-left`, "Back"; then "Ask about this stay" `title` with the stay title as a muted caption under it (one line, may wrap).
  - **Thread** (`ScrollView`, `px-xl gap-lg`, scrolls to the end when a message is added):
    - Intro, always first: a small `rounded-lg bg-lavender-soft p-lg` card with a `sparkles` icon (accent) and the caption "Answers come straight from this stay's details and Roam's policies, word for word."
    - **Guest question:** right-aligned bubble, max 80% of the width, `bg-primary rounded-xl px-lg py-md`, `body` ink.
    - **Reply:** left-aligned, a stack of answer cards (`gap-md`). Each **answer card** is `rounded-lg bg-surface border border-border p-lg gap-md` (est.). It has a header row with the topic icon in a `size-control-md rounded-md bg-lavender-tile` tile (accent) and the topic title `title`; the body (`body`); then a divider and a **source row**: `document` icon xs muted, then "Source: House rules" `label` muted, plus `chevron-right` xs when tappable. The source row is a `PressableScale` button with "Opens the policies" as its accessibility hint.
    - **No match card:** `info` icon, "I can't answer that from this stay's details yet." and "Try a topic below, or contact Roam support." No source row, and no support link (there's no support screen yet).
  - **Composer**, pinned to the bottom, `bg-surface border-t border-border`, safe-area bottom padding:
    - a horizontally scrolling chip row (`Chip size="filter"` with the topic icon, `px-xl gap-sm`); a tapped chip sends its question at once
    - under it, a `TextField` with `icon="chat"` (the message icon), placeholder "Ask about check-in, pets, rules…", `returnKeyType="send"`, and a trailing send `IconButton` (new icon `send`: SF `arrow.up`, Material `arrow_upward`, size sm). Send is disabled when the field is empty or only spaces. Sending clears the field and keeps the keyboard open.
  - Keyboard: React Native `KeyboardAvoidingView` (behavior `padding`), so the composer rides above the keyboard. No new dependency. If Android edge-to-edge misbehaves, stop and ask before adding `react-native-keyboard-controller`.
- **Thread state:** local `useState` in the screen, cleared on leave. Replies appear right after the question, with no fake "typing" delay.
- **Motion:** new messages fade in and rise slightly (Reanimated `entering`, using the `motion.ts` durations). With reduced motion they only fade. Chips and the source rows use `PressableScale`.
- **States:**
  - Details loading: the header and intro show, chips and send are disabled, with a spinner in the thread.
  - Details error: an `Alert` and Retry.
  - Not found: "We couldn't find that stay" and Back.
- **Accessibility:** each reply card is grouped for screen readers as "{topic}. {text}. Source: {source}". A new reply is announced (`AccessibilityInfo.announceForAccessibility` with the topic titles). Chips use `accessibilityRole="button"` and the hint "Asks: {question}".
- **No analytics** in this step, because typed questions must never be sent and topic events can wait for the real backend.
- **Tokens:** no new tokens expected. The one new icon is `send`. If the bubble needs a value with no token, it gets proposed here first.

## Out of scope
- Any backend: the API route, Sanity Context, Jev, and the Clerk check on the route. Answers to questions outside the six topics. Saving the thread. Analytics events. A support screen or link. Booking.

## Steps
### 1. Topics, matcher and answers
Create `src/lib/ask/topics.ts`: the topics, `matchTopics(question)`, and `answerFor(topic, details)` returning plain data, with body parts typed as `text | bullets | policy | amenities | host` so the UI renders them without guessing. Move `to12h` there and import it from `sheets.tsx`. Add `scripts/check-ask.ts` and `scripts/check-ask.mjs` (a jiti runner like `check-search.mjs`), which:
- (a) asserts about 25 realistic questions map to the expected topics, including multi-topic ones ("can I bring my dog and when is check-in", "is there wifi", "refund if I cancel?", "can we have a party", and no-match cases such as "is it near the beach?" and "hello")
- (b) fetches details for every live stay and checks each topic either builds a non-empty answer or is marked unavailable

Done when the check passes.

### 2. Screen and route
Build these in `src/screens/stay-ask/`: `ask-screen.tsx`, `answer-card.tsx`, `question-bubble.tsx`, `composer.tsx`. Add `src/app/stay-ask.tsx`, register it in the root `_layout.tsx` inside `Stack.Protected guard={isSignedIn}`, and add the `send` icon. Done when tsc and lint pass and the screen renders on device with chips, typing, and answer cards.

### 3. Entry point and showcase
In `stay-screen.tsx`, the "Ask about policies" card pushes `/stay-ask?id=` (hint "Opens a chat about this stay"). Add `AnswerCard` to `/design-system` only if a second screen uses it later. It stays screen-local for now, so there's no showcase entry. Done when the card opens the chat.

## Verification
- tsc, lint, check-tokens, check-content, check-ask.
- BlueStacks at 360 dp (and 390 dp):
  - Open Modern Cabin, then "Ask about policies", and the chat opens.
  - Tap each chip: a guest bubble, then one card with the stay's text, matching the Policies sheet word for word.
  - Type "can I bring my dog and when is check-in?": two cards, Pets then Check-in.
  - Type "is it near the beach": the no-match card.
  - Tap the Cancellation source and the Policies sheet opens at Cancellation. Tap the Host source and the Host sheet opens.
  - Send is disabled when the field is empty. The composer stays above the keyboard and the thread scrolls to the newest message.
  - Back returns to details.
- The states (loading, an offline error with Retry, a bad slug as not found).
- Screenshots at 360 dp, reviewed for wrapping (no truncated text) and spacing, with every estimated value listed.

## AGENTS.md updates
- Expo, routing: `stay-ask` (`?id=`) is a full-screen push on the root Stack, guarded like `stay/[id]`. "Ask about policies" opens it.
- Who owns what, answer text: replace the "Until policy Q&A exists…" sentence. The Ask chat shows one answer card per topic with the stay's stored text word for word and a source label that opens its sheet. For now, topics are chosen by a keyword matcher in code (`src/lib/ask/topics.ts`, checked by `node scripts/check-ask.mjs`), and Jev replaces it behind an API route later. No answers are written.
