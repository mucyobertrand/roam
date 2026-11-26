import { useCallback } from "react";

import type { Filters, Sort } from "@/lib/search/filters";

import { fetchPlaces, fetchSearch } from "./search";
import { cacheStays, useContent } from "./use-stays";

/**
 * Live search results for filters + sort, from the session cache. `stays` is undefined until
 * the first response; a failed refresh keeps the previous results and sets `error`.
 */
export function useSearch(filters: Filters, sort: Sort) {
  const key = `search:${JSON.stringify([filters, sort])}`;
  const fetcher = useCallback(() => fetchSearch(filters, sort), [filters, sort]);
  const { data, error, loading, reload } = useContent(key, fetcher, cacheStays);
  return { stays: data, error, loading, reload };
}

/** Every stay's city and region, for the sentence parser. Empty until loaded. */
export function usePlaces() {
  return useContent("places", fetchPlaces).data ?? NO_PLACES;
}

const NO_PLACES: never[] = [];
