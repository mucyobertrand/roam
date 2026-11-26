import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { styled } from "nativewind";
import { Platform } from "react-native";

import { cn } from "@/lib/cn";
import { iconSize } from "@/theme/tokens";

import { textTones, type Tone } from "./tones";

type PlatformSymbol = Required<Pick<Extract<SymbolViewProps["name"], object>, "ios" | "android">>;

/** App icon names → SF Symbol (iOS) and Material Symbol (Android, web). */
const symbols = {
  home: { ios: "house", android: "home" },
  "home-fill": { ios: "house.fill", android: "home" },
  search: { ios: "magnifyingglass", android: "search" },
  heart: { ios: "heart", android: "favorite" },
  "heart-fill": { ios: "heart.fill", android: "favorite" },
  calendar: { ios: "calendar", android: "calendar_today" },
  user: { ios: "person", android: "person" },
  settings: { ios: "gearshape", android: "settings" },
  "map-pin": { ios: "mappin.and.ellipse", android: "location_on" },
  sliders: { ios: "slider.horizontal.3", android: "tune" },
  share: { ios: "square.and.arrow.up", android: "ios_share" },
  bookmark: { ios: "bookmark", android: "bookmark" },
  lock: { ios: "lock", android: "lock" },
  mail: { ios: "envelope", android: "mail" },
  // Apple's mark exists only as an SF Symbol; Sign in with Apple is shown on iOS only.
  apple: { ios: "apple.logo", android: "phone_iphone" },
  eye: { ios: "eye", android: "visibility" },
  "eye-off": { ios: "eye.slash", android: "visibility_off" },
  "chevron-right": { ios: "chevron.right", android: "chevron_right" },
  "chevron-left": { ios: "chevron.left", android: "chevron_left" },
  "chevron-down": { ios: "chevron.down", android: "expand_more" },
  "arrow-right": { ios: "arrow.right", android: "arrow_forward" },
  star: { ios: "star.fill", android: "star" },
  list: { ios: "list.bullet", android: "format_list_bulleted" },
  map: { ios: "map", android: "map" },
  "check-circle": { ios: "checkmark.circle.fill", android: "check_circle" },
  "alert-circle": { ios: "exclamationmark.circle.fill", android: "error" },
  close: { ios: "xmark", android: "close" },
  plus: { ios: "plus", android: "add" },
  minus: { ios: "minus", android: "remove" },
  paw: { ios: "pawprint", android: "pets" },
  "hot-tub": { ios: "bathtub", android: "hot_tub" },
  pool: { ios: "figure.pool.swim", android: "pool" },
  flame: { ios: "flame", android: "local_fire_department" },
  wifi: { ios: "wifi", android: "wifi" },
  kitchen: { ios: "fork.knife", android: "restaurant" },
  car: { ios: "car", android: "local_parking" },
  sauna: { ios: "heat.waves", android: "sauna" },
  laptop: { ios: "laptopcomputer", android: "laptop" },
  ev: { ios: "bolt.car", android: "ev_station" },
  ocean: { ios: "water.waves", android: "water" },
  cabin: { ios: "tree", android: "forest" },
  beach: { ios: "beach.umbrella", android: "beach_access" },
  waves: { ios: "water.waves", android: "waves" },
  sparkles: { ios: "sparkles", android: "auto_awesome" },
  "arrow-up-right": { ios: "arrow.up.right", android: "north_east" },
  city: { ios: "building.2", android: "location_city" },
  villa: { ios: "house.lodge", android: "villa" },
  "credit-card": { ios: "creditcard", android: "credit_card" },
  suitcase: { ios: "suitcase", android: "luggage" },
  chat: { ios: "bubble.left", android: "chat_bubble" },
  document: { ios: "doc.text", android: "description" },
  info: { ios: "info.circle.fill", android: "info" },
  medal: { ios: "medal", android: "military_tech" },
  clock: { ios: "clock", android: "schedule" },
  send: { ios: "arrow.up", android: "arrow_upward" },
  bell: { ios: "bell", android: "notifications" },
  help: { ios: "questionmark.circle", android: "help" },
} as const satisfies Record<string, PlatformSymbol>;

export type IconName = keyof typeof symbols;
export type IconSize = keyof typeof iconSize;

// Native: the text color class becomes the symbol's tintColor.
const StyledSymbol = styled(SymbolView, {
  className: { target: "style", nativeStyleMapping: { color: "tintColor" } },
});

// Web renders the symbol as a font glyph; currentColor inherits the class color.
const webTint = Platform.OS === "web" ? "currentColor" : undefined;

export type IconProps = {
  name: IconName;
  size?: IconSize;
  tone?: Tone;
  /** Layout only (margin, alignment). Color comes from `tone`. */
  className?: string;
};

export function Icon({ name, size = "md", tone = "default", className }: IconProps) {
  const symbol = symbols[name];
  return (
    <StyledSymbol
      name={{ ios: symbol.ios, android: symbol.android, web: symbol.android }}
      size={iconSize[size]}
      tintColor={webTint}
      accessible={false}
      className={cn(textTones[tone], className)}
    />
  );
}
