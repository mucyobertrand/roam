/**
 * Checks sentence search end to end against live Sanity content: the parser's chips, then the
 * GROQ from src/lib/content/search.ts on the public API CDN. Every result must satisfy every
 * hard filter, sorts must hold, and soft words must rank by meaning.
 * Run: node scripts/check-search.mjs
 */
import type { Stay } from "../src/data/stays";
import { fetchCount, fetchPlaces, fetchSearch } from "../src/lib/content/search";
import { activeChips, type Filters, type Sort } from "../src/lib/search/filters";
import { parseQuery, placeTerms, placeWordsOf } from "../src/lib/search/parse-query";

type Case = {
  q: string;
  sort?: Sort;
  chips?: string[];
  empty?: boolean;
  min?: number;
  /** A stay in the top 3 must have one of these vibes. */
  topVibes?: string[];
};

const cases: Case[] = [
  { q: "quiet pet friendly cabin with a hot tub under $300 a night", chips: ["Cabins", "Under $300", "Pet Friendly", "Hot Tub", "Quiet"], min: 1 },
  { q: "beach house for 6 people with a pool", chips: ["Beach", "6+ guests", "Pool"], min: 1 },
  { q: "cozy loft downtown", chips: ["City", "Cozy"], min: 1, topVibes: ["cozy"] },
  { q: "villa in Tuscany", chips: ["Villas", "Tuscany"], min: 1 },
  { q: "cabin near tahoe for four guests", chips: ["Cabins", "Tahoe", "4+ guests"], min: 1 },
  { q: "villa under $100", chips: ["Villas", "Under $100"], empty: true },
  { q: "Cabins in California", chips: ["Cabins", "California"], min: 2 },
  // "ca" must be a whole word: Cape May (NJ) is not in California.
  { q: "beach in california", chips: ["Beach", "California"], min: 1 },
  { q: "stays in new york", chips: ["New York"], min: 1 },
  { q: "quiet secluded cabin", chips: ["Cabins", "Quiet", "Secluded"], min: 2, topVibes: ["quiet", "secluded"] },
  { q: "romantic", chips: ["Romantic"], min: 10, topVibes: ["romantic"] },
  { q: "Cabins in California", sort: "price-asc", min: 2 },
  { q: "Cabins in California", sort: "price-desc", min: 2 },
  { q: "Cabins in California", sort: "rating", min: 2 },
];

const same = (a: string[], b: string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** Every hard filter, checked in code on a returned stay. */
function violations(s: Stay, f: Filters): string[] {
  const out: string[] = [];
  if (f.maxPrice !== undefined && s.pricePerNight > f.maxPrice) out.push(`price ${s.pricePerNight}`);
  if (f.guests !== undefined && s.maxGuests < f.guests) out.push(`guests ${s.maxGuests}`);
  if (f.pets && !s.petsAllowed) out.push("no pets");
  if (f.types.length && !f.types.includes(s.type)) out.push(`type ${s.type}`);
  for (const a of f.amenities) if (!s.amenities.includes(a)) out.push(`no ${a}`);
  const words = placeWordsOf(s.city, s.region);
  if (f.places.length && !f.places.some((p) => placeTerms(p).every((w) => words.includes(w)))) out.push(`place ${s.city}, ${s.region}`);
  return out;
}

function sortProblem(results: Stay[], sort: Sort): string | undefined {
  for (let i = 1; i < results.length; i++) {
    const [a, b] = [results[i - 1], results[i]];
    if (sort === "price-asc" && a.pricePerNight > b.pricePerNight) return `price-asc broken at ${b.id}`;
    if (sort === "price-desc" && a.pricePerNight < b.pricePerNight) return `price-desc broken at ${b.id}`;
    if (sort === "rating" && a.rating < b.rating) return `rating broken at ${b.id}`;
  }
}

const places = await fetchPlaces();
let failed = 0;
for (const c of cases) {
  const sort = c.sort ?? "best";
  const filters = parseQuery(c.q, places);
  // One request at a time: they reuse the single warm connection.
  const results = await fetchSearch(filters, sort);
  const count = await fetchCount(filters);
  const chips = activeChips(filters).map((chip) => chip.label);
  const problems: string[] = [];
  if (c.chips && !same(chips, c.chips)) problems.push(`chips ${JSON.stringify(chips)} ≠ ${JSON.stringify(c.chips)}`);
  if (c.empty && results.length) problems.push(`expected no results, got ${results.length}`);
  if (c.min !== undefined && results.length < c.min) problems.push(`${results.length} results, expected at least ${c.min}`);
  if (count !== results.length) problems.push(`count() ${count} ≠ ${results.length} results`);
  for (const s of results) {
    const v = violations(s, filters);
    if (v.length) problems.push(`${s.id} breaks filters: ${v.join(", ")}`);
  }
  const sp = sortProblem(results, sort);
  if (sp) problems.push(sp);
  if (c.topVibes && !results.slice(0, 3).some((s) => s.vibes.some((v) => c.topVibes!.includes(v.toLowerCase()))))
    problems.push(`no top-3 stay has vibes ${c.topVibes.join("/")}`);

  console.log(`${problems.length ? "✗" : "✓"} "${c.q}"${c.sort ? ` (sort ${c.sort})` : ""}`);
  console.log(`   chips: ${chips.join(", ") || "(none)"}`);
  console.log(`   results: ${results.slice(0, 4).map((s) => s.id).join(", ") || "(none)"} (${results.length})`);
  for (const p of problems) console.log(`   ! ${p}`);
  if (problems.length) failed++;
}
console.log(failed ? `\n${failed} case(s) failed` : "\nall cases pass");
process.exit(failed ? 1 : 0);
