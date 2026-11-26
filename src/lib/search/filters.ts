import { amenityLabels, type Amenity, type StayType } from "@/data/stays";

/**
 * What a search looks for. Hard fields filter; `softWords` only rank (they stand in for
 * embeddings until Sanity search exists). Parsed from a sentence once, then edited by chips
 * and the filters sheet. Lives in the /search URL so every screen shares it.
 */
export type Filters = {
  types: StayType[];
  maxPrice?: number;
  guests?: number;
  pets: boolean;
  amenities: Amenity[];
  /** Place words as typed, lowercase: "tahoe", "california", "new york". */
  places: string[];
  softWords: string[];
};

export type Sort = "best" | "price-asc" | "price-desc" | "rating";

export const sortLabels: Record<Sort, string> = {
  best: "Best match",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
};

export const EMPTY_FILTERS: Filters = { types: [], pets: false, amenities: [], places: [], softWords: [] };

/** URL params for /search. Every value is a string; lists are comma-separated. */
export type SearchParams = {
  q?: string;
  types?: string;
  max?: string;
  guests?: string;
  pets?: string;
  amen?: string;
  places?: string;
  soft?: string;
  sort?: string;
};

const list = (v?: string) => (v ? v.split(",").filter(Boolean) : []);
const num = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : undefined;
};

const STAY_TYPES: readonly StayType[] = ["cabin", "beach", "city", "villa"];
const AMENITIES = Object.keys(amenityLabels) as Amenity[];
const SORTS = Object.keys(sortLabels) as Sort[];

export function filtersFromParams(p: SearchParams): Filters {
  return {
    types: list(p.types).filter((t): t is StayType => STAY_TYPES.includes(t as StayType)),
    maxPrice: num(p.max),
    guests: num(p.guests),
    pets: p.pets === "1",
    amenities: list(p.amen).filter((a): a is Amenity => AMENITIES.includes(a as Amenity)),
    places: list(p.places),
    softWords: list(p.soft),
  };
}

export const sortFromParams = (p: SearchParams): Sort => (SORTS.includes(p.sort as Sort) ? (p.sort as Sort) : "best");

/** Params for router.setParams / navigate. Empty values are `undefined`, which clears them. */
export function filtersToParams(f: Filters): Omit<SearchParams, "q" | "sort"> {
  const join = (v: string[]) => (v.length ? v.join(",") : undefined);
  return {
    types: join(f.types),
    max: f.maxPrice?.toString(),
    guests: f.guests?.toString(),
    pets: f.pets ? "1" : undefined,
    amen: join(f.amenities),
    places: join(f.places),
    soft: join(f.softWords),
  };
}

export const hasFilters = (f: Filters) =>
  f.types.length + f.amenities.length + f.places.length + f.softWords.length > 0 ||
  f.pets ||
  f.maxPrice !== undefined ||
  f.guests !== undefined;

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const typePlural: Record<StayType, string> = { cabin: "Cabins", beach: "Beach", city: "City", villa: "Villas" };

/** A chip in the filter row: a label and how tapping it changes the filters. */
export type FilterChip = { key: string; label: string; toggle: (f: Filters) => Filters };

const without = <T,>(items: T[], item: T) => items.filter((i) => i !== item);

/** One selected chip per active filter, in a stable order. */
export function activeChips(f: Filters): FilterChip[] {
  return [
    ...f.types.map((t) => ({ key: `type:${t}`, label: typePlural[t], toggle: (x: Filters) => ({ ...x, types: without(x.types, t) }) })),
    ...f.places.map((p) => ({ key: `place:${p}`, label: titleCase(p), toggle: (x: Filters) => ({ ...x, places: without(x.places, p) }) })),
    ...(f.maxPrice !== undefined
      ? [{ key: "max", label: `Under $${f.maxPrice}`, toggle: (x: Filters) => ({ ...x, maxPrice: undefined }) }]
      : []),
    ...(f.guests !== undefined ? [{ key: "guests", label: `${f.guests}+ guests`, toggle: (x: Filters) => ({ ...x, guests: undefined }) }] : []),
    ...(f.pets ? [{ key: "pets", label: "Pet Friendly", toggle: (x: Filters) => ({ ...x, pets: false }) }] : []),
    ...f.amenities.map((a) => ({
      key: `amen:${a}`,
      label: amenityLabels[a],
      toggle: (x: Filters) => ({ ...x, amenities: without(x.amenities, a) }),
    })),
    ...f.softWords.map((w) => ({ key: `soft:${w}`, label: titleCase(w), toggle: (x: Filters) => ({ ...x, softWords: without(x.softWords, w) }) })),
  ];
}

const SUGGESTIONS: (FilterChip & { active: (f: Filters) => boolean })[] = [
  { key: "max", label: "Under $300", active: (f) => f.maxPrice !== undefined, toggle: (f) => ({ ...f, maxPrice: 300 }) },
  { key: "pets", label: "Pet Friendly", active: (f) => f.pets, toggle: (f) => ({ ...f, pets: true }) },
  { key: "soft:quiet", label: "Quiet", active: (f) => f.softWords.includes("quiet"), toggle: (f) => ({ ...f, softWords: [...f.softWords, "quiet"] }) },
  {
    key: "amen:hot-tub",
    label: amenityLabels["hot-tub"],
    active: (f) => f.amenities.includes("hot-tub"),
    toggle: (f) => ({ ...f, amenities: [...f.amenities, "hot-tub"] }),
  },
  { key: "amen:pool", label: amenityLabels.pool, active: (f) => f.amenities.includes("pool"), toggle: (f) => ({ ...f, amenities: [...f.amenities, "pool"] }) },
];

/** Unselected chips that add a common filter, up to 4, skipping ones already active. */
export function suggestionChips(f: Filters): FilterChip[] {
  return SUGGESTIONS.filter((s) => !s.active(f))
    .slice(0, 4)
    .map(({ key, label, toggle }) => ({ key, label, toggle }));
}
