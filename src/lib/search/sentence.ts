import { filtersToParams, type SearchParams } from "./filters";
import { parseQuery } from "./parse-query";

/**
 * /search params for a newly submitted sentence: the sentence itself plus the filters parsed
 * from it; the sort resets to Best match. `places` are the live stays' locations (usePlaces),
 * so known city words become place filters. `at` makes every submit a new navigation, so
 * re-running the same sentence still resets chips edited since.
 */
export function paramsForSentence(sentence: string, places: readonly { city: string; region: string }[]): SearchParams & { at: string } {
  const q = sentence.trim();
  return { q: q || undefined, ...filtersToParams(parseQuery(q, places)), sort: undefined, at: Date.now().toString() };
}
