import type { Amenity, StayType } from "@/data/stays";

import type { Filters } from "./filters";

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
const NUM = `(\\d+|${Object.keys(NUMBER_WORDS).join("|")})`;
const toNumber = (raw: string) => NUMBER_WORDS[raw] ?? Number(raw);

/** US state names → the region code stays use. */
export const US_STATES: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca", colorado: "co", connecticut: "ct",
  delaware: "de", "district of columbia": "dc", florida: "fl", georgia: "ga", hawaii: "hi", idaho: "id", illinois: "il",
  indiana: "in", iowa: "ia", kansas: "ks", kentucky: "ky", louisiana: "la", maine: "me", maryland: "md",
  massachusetts: "ma", michigan: "mi", minnesota: "mn", mississippi: "ms", missouri: "mo", montana: "mt", nebraska: "ne",
  nevada: "nv", "new hampshire": "nh", "new jersey": "nj", "new mexico": "nm", "new york": "ny", "north carolina": "nc",
  "north dakota": "nd", ohio: "oh", oklahoma: "ok", oregon: "or", pennsylvania: "pa", "rhode island": "ri",
  "south carolina": "sc", "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt", virginia: "va",
  washington: "wa", "west virginia": "wv", wisconsin: "wi", wyoming: "wy",
};
// Longest first, so "west virginia" wins over "virginia".
const STATE_NAMES = Object.keys(US_STATES).sort((a, b) => b.length - a.length);

const PRICE_PATTERNS = [
  /(?:under|below|less than|max(?:imum)?|up to|no more than|at most|cheaper than|<)\s*\$?\s*(\d+)/,
  /\$\s*(\d+)\s*(?:or less|or under|max|tops)/,
  /\$\s*(\d+)\s*(?:a|per|\/)\s*night/,
];
const GUEST_PATTERNS = [
  new RegExp(`\\b${NUM}\\s*(?:guests?|people|persons?|adults?|friends|of us)\\b`),
  new RegExp(`\\bfor\\s+${NUM}\\b(?!\\s*(?:nights?|days?|dollars|\\$))`),
  new RegExp(`\\bsleeps\\s+${NUM}\\b`),
];
const PETS = /\b(?:pets?|pet[- ]friendly|dogs?|cats?|puppy|puppies)\b/g;

const TYPE_WORDS: Record<StayType, RegExp> = {
  cabin: /\b(?:cabins?|cottages?|chalets?|lodges?|a-frames?)\b/g,
  beach: /\b(?:beach(?:front)?|oceanfront|seaside|coastal|surf)\b/g,
  city: /\b(?:city|apartments?|lofts?|flats?|downtown|condos?|urban)\b/g,
  villa: /\b(?:villas?|mansions?|estates?)\b/g,
};

const AMENITY_WORDS: Record<Amenity, RegExp> = {
  "hot-tub": /\b(?:hot ?tubs?|jacuzzis?|spa)\b/g,
  pool: /\b(?:pools?|swimming)\b/g,
  fireplace: /\b(?:fireplaces?|fire place|wood stove|fire pit)\b/g,
  wifi: /\b(?:wi-?fi|internet)\b/g,
  kitchen: /\bkitchens?\b/g,
  parking: /\b(?:parking|garage)\b/g,
  sauna: /\bsaunas?\b/g,
  "ocean-view": /\b(?:ocean|sea) ?views?\b/g,
  workspace: /\b(?:workspace|desk|work from|remote work)\b/g,
  "ev-charger": /\b(?:ev charger|ev charging|charger|tesla)\b/g,
};

/** Words that never carry meaning on their own. */
const STOP_WORDS = new Set(
  "a an the with and or for in on at to of near by some something somewhere place stay stays house home houses that is are i we me my our want need looking find please night nights per a-night under below max up less than more no have has it its this".split(
    " ",
  ),
);

/** Location words too generic to name a place by themselves. */
const GENERIC_PLACE_WORDS = new Set(["lake", "south", "north", "big", "cape", "little", "new", "san", "city", "monte"]);

/** Whole words of a stay's city and region, e.g. ["south", "lake", "tahoe", "ca"]. */
export const placeWordsOf = (city: string, region: string) => `${city} ${region}`.toLowerCase().split(/\s+/);

/**
 * The words a stay's city + region must all contain for a place to match. A US state name
 * becomes its region code; anything else is matched word by word, so "ca" never matches
 * "Cape May". The GROQ in src/lib/content/search.ts compares these against whole words.
 */
export function placeTerms(place: string): string[] {
  const state = US_STATES[place];
  return state ? [state] : place.split(/\s+/).filter(Boolean);
}

/** Reads the hard filters out of a one-sentence search, in code; the rest become soft words. */
export function parseQuery(input: string, knownPlaces: readonly { city: string; region: string }[]): Filters {
  let text = ` ${input.toLowerCase().replace(/[“”"]/g, " ").replace(/\s+/g, " ")} `;
  const remove = (pattern: RegExp) => {
    text = text.replace(pattern, " ");
  };
  const take = (pattern: RegExp) => {
    pattern.lastIndex = 0; // global regexes keep lastIndex between .test() calls
    const hit = pattern.test(text);
    pattern.lastIndex = 0;
    if (hit) remove(pattern);
    return hit;
  };

  let maxPrice: number | undefined;
  for (const p of PRICE_PATTERNS) {
    const m = text.match(p);
    if (m) {
      maxPrice = Number(m[1]);
      remove(p);
      break;
    }
  }

  let guests: number | undefined;
  for (const p of GUEST_PATTERNS) {
    const m = text.match(p);
    if (m) {
      guests = toNumber(m[1]);
      remove(p);
      break;
    }
  }

  const pets = take(PETS);
  remove(/\bfriendly\b/g);

  const types = (Object.keys(TYPE_WORDS) as StayType[]).filter((t) => take(TYPE_WORDS[t]));
  const amenities = (Object.keys(AMENITY_WORDS) as Amenity[]).filter((a) => take(AMENITY_WORDS[a]));

  // Places: US state names (possibly two words) first, then single words of known stay locations.
  const places: string[] = [];
  for (const state of STATE_NAMES) {
    const pattern = new RegExp(`\\b${state}\\b`, "g");
    if (take(pattern)) places.push(state);
  }
  const knownWords = new Set(
    knownPlaces.flatMap((p) => placeWordsOf(p.city, p.region)).filter((w) => w.length >= 3 && !GENERIC_PLACE_WORDS.has(w)),
  );
  const words = text.split(/[^a-z0-9-]+/).filter(Boolean);
  for (const w of words) if (knownWords.has(w) && !places.includes(w)) places.push(w);

  const softWords = words.filter((w) => !places.includes(w) && !STOP_WORDS.has(w) && !/^\$?\d+$/.test(w) && w.length > 2);

  return { types, maxPrice, guests, pets, amenities, places, softWords: [...new Set(softWords)] };
}
