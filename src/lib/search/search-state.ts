import { useSyncExternalStore } from "react";

import type { SearchParams } from "./filters";

/** Where a search came from, for analytics. */
export type SearchSource = "sentence" | "example" | "chip" | "sheet" | "home";

/**
 * The current search for this app session: the params (sentence, filters, sort), where it
 * came from, and an `id` that changes with every new search (so it's tracked once, however
 * often the screen renders or the tab is revisited). Search reads it from here, not from the
 * URL: switching tabs navigates to /search with no params, which would otherwise wipe it. URL
 * params are only input (Home, the filters sheet).
 */
export type SearchState = { params: SearchParams; source: SearchSource; id: number };

let current: SearchState = { params: {}, source: "sentence", id: 0 };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSearchState(params: SearchParams, source: SearchSource) {
  current = { params, source, id: current.id + 1 };
  listeners.forEach((l) => l());
}

export function useSearchState(): SearchState {
  return useSyncExternalStore(subscribe, () => current);
}

const SEARCH_KEYS = ["q", "types", "max", "guests", "pets", "amen", "places", "soft", "sort"] as const;
const SOURCES: readonly SearchSource[] = ["sentence", "example", "chip", "sheet", "home"];

/** Only the search fields of a params object (drops `focus`, `at`, `src` and undefined values). */
export function pickSearchParams(params: Record<string, string | string[] | undefined>): SearchParams {
  const out: SearchParams = {};
  for (const key of SEARCH_KEYS) {
    const value = params[key];
    if (typeof value === "string" && value !== "") out[key] = value;
  }
  return out;
}

/** The `src` URL param as a source; anything else counts as a typed sentence. */
export const sourceFromParam = (src: unknown): SearchSource =>
  SOURCES.includes(src as SearchSource) ? (src as SearchSource) : "sentence";
