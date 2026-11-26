# 01 · Design system

Status: done

## Goal
Every screen draws its fonts, colors, spacing, radii, shadows and text styles from one theme (`src/global.css`) and is built from a small set of shared primitives (Text, Button, IconButton, TextField, Chip, Badge, Alert, SegmentedControl, Stepper, Icon) that match the reference design `assets/prompt-imgs/design.png`.

## Decisions
- Styling is NativeWind v5 RC0 (already set up). Tokens live **only** in `src/global.css` inside `@theme`, as CSS variables, and are used through classes (`bg-primary`, `text-ink`, `p-lg`, `rounded-xl`, `font-display`). No hex, px font size or spacing literal outside `src/global.css`.
- Font: Plus Jakarta Sans, loaded at runtime via `@expo-google-fonts/plus-jakarta-sans` + `useFonts` in `src/app/_layout.tsx`, holding the splash screen until loaded. Works in Expo Go and web without a native rebuild. Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold. Each weight is its own family token (NativeWind: `font-bold` sets fontWeight, not the family, so never use `font-bold` with this font).
- Icons: `expo-symbols` (`SymbolView`) behind one `Icon` component with a name map (SF Symbol name on iOS, Material Symbol name on Android/web per the SDK 58 expo-symbols docs). Screens use `Icon` names, never raw symbol names.
- Light mode only: `app.json` `userInterfaceStyle` becomes `"light"`. No dark tokens until a dark design exists.
- Scope: tokens + shared primitives. Listing card, policy card, profile row and the glass tab bar are built with the screens that first use them, from these tokens.
- Shared primitives live in `src/components/ui/`, one file per component, exported from `src/components/ui/index.ts`. Each follows the contract: `variant`, `size`, states (pressed, disabled, loading where relevant), `className` merged last, accessibility role/label/state.
- Pressed feedback: opacity 0.7 for filled controls, `bg-surface-muted` swap for outlined ones; disabled is opacity 0.4.
- Colors needed as JS props (icon `tintColor`, `Switch` `trackColor`) come from the same CSS tokens via NativeWind `styled(..., { className: { target: false, nativeStyleMapping: { color: ... } } })`. If that mapping can't target `tintColor`, fall back to `src/theme/colors.ts` mirroring only those few tokens, plus a script `scripts/check-tokens.mjs` (run in Verification) that fails if any mirrored value differs from `global.css`.
- Toggle stays the native `Switch` (not wrapped), tinted with `primary`.
- A dev-only showcase route `src/app/design-system.tsx` renders every token and primitive for visual comparison with the design. `src/app/index.tsx` goes back to a plain placeholder that uses the primitives.
- The “roam” wordmark is a brand asset, not recreated from the screenshot. Until it's provided, the showcase uses a marked text placeholder (“roam” in `font-jakarta-extrabold`, labelled PLACEHOLDER in code).

### Tokens (from the design; ⚠ = estimated from the image, proposed new token)
Colors
| Token | Value | Use |
|---|---|---|
| `primary` | `#FFC629` | primary actions, active states, star |
| `lavender` | `#C9B4FF` | secondary actions, highlights, selected chip, focused border |
| `ink` | `#0B0B1A` | headings, primary text, segmented selected bg |
| `ink-muted` | `#6B7280` | body / secondary text |
| `surface` | `#FFFFFF` | cards, sheets, modals |
| `surface-muted` | `#F4F5F7` | app background, input fields |
| `border` | `#E5E7EB` | dividers, borders |
| `glass` | `rgba(255,255,255,0.7)` | tab bar, glass surfaces |
| ⚠ `placeholder` | `#9CA3AF` | input placeholder |
| ⚠ `lavender-soft` | `#F3EEFF` | focused field bg, policy card bg |
| ⚠ `lavender-strong` | `#7C5CFF` | icons on lavender-soft |
| ⚠ `primary-soft` | `#FFF6D6` | “Guest favorite” badge bg |
| ⚠ `success` / `success-soft` | `#16A34A` / `#E8F5EC` | success alert, “New” badge |
| ⚠ `danger` / `danger-soft` | `#E11D48` / `#FDECEF` | error alert, “20% off” badge |
| ⚠ `info` / `info-soft` | `#3B5BDB` / `#E8EEFF` | “Superhost” badge |

Typography (family / size / line height)
| Token | Spec |
|---|---|
| `display` | Bold, 56 / 56 (design 56–64, lh 1.0), ⚠ letter-spacing −1 |
| `heading` | Bold, 28 / 34 (design 28–32, lh 1.2) |
| `heading-lg` | Bold, 32 / 38 |
| ⚠ `title` | Bold, 18 / 24 (listing card title, section titles) |
| `body` | Regular, 16 / 24 (lh 1.5) |
| `caption` | Medium, 14 / 20 |
| `button` | Medium, 17 / 22 (design 17–18) |
| ⚠ `label` | Medium, 12 / 16 (tab labels, small chips, badges sm) |
Families: `font-sans` (Regular, also the default), `font-jakarta-medium`, `font-jakarta-semibold`, `font-jakarta-bold`, `font-jakarta-extrabold`. Text styles are exposed only through `<Text variant>`, which pairs the family + size + line height + default color.

Spacing (4-pt grid, px, named by size): `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 20`, `2xl 24`, `3xl 32`, `4xl 48`. Screen edge padding = `xl` (20) ⚠. Layout rhythm uses `gap-*`.

Radius: `sm 8`, `md 12`, `lg 16`, `xl 24`, `full` (pills: buttons, chips, icon buttons, segmented control, stepper). Inputs/alerts/policy cards `lg` ⚠, cards `xl` ⚠. Non-pill radii use `borderCurve: "continuous"` where supported.

Shadows ⚠ (very soft in the design): `card` `0 1px 2px rgba(11,11,26,0.04), 0 4px 16px rgba(11,11,26,0.06)`; `raised` `0 8px 24px rgba(11,11,26,0.12)` (tab bar, floating). Applied via `boxShadow`, never legacy shadow props.

Sizes ⚠: control height 56 (Button md, TextField), Button sm 44, IconButton 48, Chip md 44 / sm 36, Stepper 48, icons 24 (md) / 20 (sm) / 16 (xs).

## Out of scope
Listing card, policy card, profile row, glass tab bar (built with their screens). Dark mode. The Google logo asset for “Continue with Google” (Button accepts any leading element; the auth screen supplies it). Animations beyond pressed feedback.

## Steps
### 1. Fonts and light mode
`npx expo install @expo-google-fonts/plus-jakarta-sans expo-font expo-splash-screen`. In `src/app/_layout.tsx` load the five weights with `useFonts`, keep the splash visible until loaded (`SplashScreen.preventAutoHideAsync` / `hideAsync`), keep `import "../global.css"`. Set `userInterfaceStyle: "light"` in `app.json`. Done: app boots with fonts loaded on iOS and web.

### 2. Tokens in `src/global.css`
Add one `@theme` block with every token in the tables above: `--color-*`, `--font-*` (map each family token to the exact loaded font name, e.g. `"PlusJakartaSans_700Bold"`, and override `--font-sans` with Regular), `--text-*` with `--text-*--line-height` (and letter-spacing for display), `--spacing-*` named steps in px, `--radius-*` in px (override Tailwind defaults so only our scale exists), `--shadow-*`. Done: `npx expo export --platform web` CSS contains the utilities (`bg-primary`, `text-display`, `p-xl`, `rounded-xl`, `shadow-card`, `font-jakarta-bold`); spot-check that they render on iOS and web in step 5's showcase.

### 3. Text and Icon
`src/components/ui/text.tsx`: `Text` with `variant: display | heading-lg | heading | title | body | caption | button | label` (default `body`) and `tone: default | muted | inverse | primary | danger | success`, `className` merged last, font scaling left on. `src/components/ui/icon.tsx`: `Icon` with `name` (home, search, heart, calendar, user, settings, map-pin, sliders, share, bookmark, lock, eye-off, chevron-right, arrow-right, star, list, map, check-circle, alert-circle, close, plus, minus, paw, hot-tub, cabin, beach, city, villa, credit-card, briefcase, chat, document), `size: xs | sm | md`, color from a text-color class. Verify the color-mapping decision here and pick the fallback if needed.

### 4. Controls
- `Button`: variants `primary` (yellow bg, ink text), `secondary` (surface bg, border, ink text), `ghost`; sizes `md` / `sm`; optional `leading` / `trailing` element (arrow-right on primary); `loading` (spinner, label kept as `accessibilityLabel`), `disabled`; pill.
- `IconButton`: `icon`, required `accessibilityLabel`, variants `surface` (white circle on muted bg) / `muted`, sizes `md` / `sm`, optional `selected` (e.g. filled heart).
- `TextField`: wraps `TextInput`; `leading` icon, optional `trailing` element; states default (`surface-muted`, no border), focused (`lavender-soft` bg + `lavender` 1.5px border), error (danger border + caption message), disabled; `secure` adds an eye/eye-off toggle with an accessible label; `variant="search"` (white bg, `border`, sliders trailing slot).
- `Chip`: `selected`, optional `icon`; sizes `md` (category: unselected `surface-muted`, selected `lavender` bg) and `sm` with icon (unselected `surface`, selected `primary` bg); accessibilityRole `button` + `selected` state.
- `Badge`: tones `favorite | success | discount | info | neutral`, optional `icon`, sizes `md` / `sm` (sm for listing amenities: `surface-muted`, icon + label).
- `Alert`: tones `success | error`, icon, message, optional `onDismiss` (close IconButton); `accessibilityRole="alert"`.
- `SegmentedControl`: `options: {value,label,icon}[]`, `value`, `onChange`; selected pill `ink` bg + white text; `tablist`/`tab` roles with selected state.
- `Stepper`: `value`, `min`, `max`, `onChange`; − / + IconButtons disabled at bounds; value announced (`adjustable` role with increment/decrement actions).
Export all from `src/components/ui/index.ts`.

### 5. Showcase + placeholder screen
`src/app/design-system.tsx` reproducing the design's sections 01–06 and 11–15 with the primitives (and a native `Switch` tinted `primary`). Link to it from `src/app/index.tsx`, which becomes a simple screen built with the primitives. Done: showcase visually matches the reference.

### 6. Close out
Run Verification, write `## Result`, set Status: done, apply AGENTS.md updates.

## Verification
- `npx tsc --noEmit` and `npx expo lint` pass.
- `npx expo export --platform ios` and `--platform web` succeed; web CSS contains every token utility listed in step 2.
- Drift check: grep `src/` (excluding `src/global.css`) for `#[0-9a-fA-F]{3,8}`, `rgba?\(`, `fontSize`, `fontWeight`, `StyleSheet.create` → no hits (except the fallback mirror if used, checked by `scripts/check-tokens.mjs`).
- Showcase on web (`npx expo start --web`, `/design-system`): screenshot and compare with the design section by section; list every difference, fix, repeat. On iOS simulator the same via `xcrun simctl openurl booted roamapp://design-system` (needs a Mac; this machine is Windows, so iOS visual check is the user's).
- Interaction: focus a TextField (lavender state), toggle password visibility, tap chips/segments (selection moves, screen reader state), Stepper stops at min/max, Button loading shows a spinner and blocks presses, Alert dismiss.
- Large text: set the largest accessibility text size and confirm buttons, fields and chips grow instead of clipping.

## AGENTS.md updates
New `## Design system` section:
- Tokens live only in `src/global.css` `@theme`; use token classes, never hex/px literals in components or screens. New values go into the theme first.
- Fonts: Plus Jakarta Sans, one family token per weight (`font-jakarta-*`); never `font-bold`/`fontWeight` with it.
- Text goes through `<Text variant>`; icons through `<Icon name>` (expo-symbols).
- Shared primitives in `src/components/ui/`; promote a view there only when two screens use it.
- Light mode only until a dark design exists.

## Result
Built as planned. Tokens in `src/global.css`; primitives in `src/components/ui/`; showcase at `/design-system`.
- Deviations: `--radius-full` added explicitly (radius defaults are reset). Pressed feedback uses NativeWind `active:opacity-70` (supported natively via press handlers). `styled()` with `nativeStyleMapping` blew up TypeScript (TS2590) for ActivityIndicator and Switch, so: ActivityIndicator uses NativeWind's built-in color mapping, and the Switch track color uses the planned fallback mirror `src/theme/tokens.ts` (also holds icon sizes), guarded by `node scripts/check-tokens.mjs`. Icons color via `styled(SymbolView)` on native and `currentColor` on web.
- Verified: tsc, eslint, token check, drift grep, iOS + web export, web screenshots of every section. `npx expo lint` refuses Node 20 (needs >=22.13), so eslint ran directly.
- Not verified: iOS/Android on device (Windows machine), large-text sizes, VoiceOver.
- Web-only: the Switch thumb renders teal on web (react-native-web default); native is unaffected.
- Follow-up: the user asked for a generated wordmark. `scripts/generate-wordmark.py` builds it from Plus Jakarta Sans ExtraBold (tracking -0.005em, +0.035em stroke for weight) into `assets/images/brand/`. `<Wordmark>` (`src/components/wordmark.tsx`) replaces the showcase placeholder and appears on the index screen.
- Follow-up 2: the wordmark is now League Spartan Bold (single-story "a", matched to design.png: ink aspect 4.85 vs 4.84). Brand lockup = `lg` wordmark + new `tagline` text style (20/24, Plus Jakarta Regular) in new `ink-subtle` (#9aa0bc, sampled). Wordmark heights are tokens (`wordmark-sm|md|lg`: 16/28/48, est. from auth/onboarding/design).
- Native fixes found on Android (BlueStacks, Expo Go): px line heights were multiplied by font size (now unitless ratios); theme shadows compiled to transparent (now `@utility` box-shadows); `font-sans` is pinned to the system font (now `font-jakarta-regular`); NativeWind's react-native shim lacks `AssetRegistry`, so no runtime font loaded (fixed in `metro.config.js`). All verified on the emulator.
