import type { Filters, Sort } from "@/lib/search/filters";
import type { SearchSource } from "@/lib/search/search-state";

import { withClient } from "./client";

/**
 * One event per distinct search, once its results load: `search_results` or
 * `search_no_results`. Never anything the guest typed: no sentence, place names, soft words,
 * prices or guest numbers. Only counts, flags and closed value lists.
 */
export function trackSearch({ filters, sort, source, resultCount }: { filters: Filters; sort: Sort; source: SearchSource; resultCount: number }) {
  withClient((p) =>
    p.capture(resultCount > 0 ? "search_results" : "search_no_results", {
      result_count: resultCount,
      source,
      sort,
      stay_types: filters.types,
      amenities: filters.amenities,
      pets: filters.pets,
      has_price: filters.maxPrice !== undefined,
      has_guests: filters.guests !== undefined,
      place_count: filters.places.length,
      soft_word_count: filters.softWords.length,
    }),
  );
}
