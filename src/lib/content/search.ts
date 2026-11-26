import type { Stay } from "@/data/stays";
import type { Filters, Sort } from "@/lib/search/filters";
import { placeTerms } from "@/lib/search/parse-query";

import { groq, type GroqParams } from "./client";
import { isComplete, STAY_FIELDS } from "./stays";

/**
 * Search over published properties. Hard constraints are GROQ filters; code writes the
 * clauses and every value goes in as a param. Soft words only rank, through Dataset
 * Embeddings, and only when the sort is Best match and there are soft words (each scored
 * query counts against the semantic search quota).
 */
export type Place = { city: string; region: string };

const ORDER: Record<Sort, string> = {
  best: "rating desc, reviewCount desc",
  rating: "rating desc, reviewCount desc",
  "price-asc": "pricePerNight asc, rating desc, reviewCount desc",
  "price-desc": "pricePerNight desc, rating desc, reviewCount desc",
};

/** The filter expression and its params, shared by the result and count queries. */
function buildFilter(f: Filters): { filter: string; params: GroqParams } {
  const params: GroqParams = {
    max: f.maxPrice ?? null,
    guests: f.guests ?? null,
    pets: f.pets,
    types: f.types,
    amenities: f.amenities,
  };
  const clauses = [
    `_type == "property"`,
    `defined(slug.current)`,
    `($max == null || pricePerNight <= $max)`,
    `($guests == null || maxGuests >= $guests)`,
    `(!$pets || petsAllowed == true)`,
    `(count($types) == 0 || type in $types)`,
    `count($amenities[@ in coalesce(^.amenities, [])]) == count($amenities)`,
  ];
  // Places are OR'd. Each one's words must all be whole words of the city + region.
  if (f.places.length) {
    const words = `string::split(lower(^.location.city + " " + ^.location.region), " ")`;
    const options = f.places.map((place, i) => {
      params[`place${i}`] = placeTerms(place);
      return `count($place${i}[@ in ${words}]) == count($place${i})`;
    });
    clauses.push(`(${options.join(" || ")})`);
  }
  return { filter: clauses.join(" && "), params };
}

export function buildSearch(f: Filters, sort: Sort): { query: string; params: GroqParams } {
  const { filter, params } = buildFilter(f);
  const scored = sort === "best" && f.softWords.length > 0;
  if (scored) params.soft = f.softWords.join(" ");
  const query = scored
    ? `*[${filter}] | score(text::semanticSimilarity($soft)) | order(_score desc, ${ORDER.best}) {${STAY_FIELDS}}`
    : `*[${filter}] | order(${ORDER[sort]}) {${STAY_FIELDS}}`;
  return { query, params };
}

export async function fetchSearch(f: Filters, sort: Sort): Promise<Stay[]> {
  const { query, params } = buildSearch(f, sort);
  const rows = await groq<Partial<Stay>[]>(query, params);
  return rows.filter(isComplete);
}

/** How many stays pass the hard filters. No score, so no semantic quota. */
export async function fetchCount(f: Filters): Promise<number> {
  const { filter, params } = buildFilter(f);
  return groq<number>(`count(*[${filter}])`, params);
}

/** Every stay's city and region, so the sentence parser can recognise place names. */
export async function fetchPlaces(): Promise<Place[]> {
  const rows = await groq<Partial<Place>[]>(
    `*[_type == "property" && defined(location.city)]{"city": location.city, "region": location.region}`,
  );
  return rows.filter((p): p is Place => typeof p.city === "string" && typeof p.region === "string");
}
