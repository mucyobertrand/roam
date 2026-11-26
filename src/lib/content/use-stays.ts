import { useCallback, useEffect, useSyncExternalStore } from "react";

import type { Stay, StayType } from "@/data/stays";

import { fetchPolicies, fetchStay, fetchStayDetails, fetchStays } from "./stays";

/**
 * A session cache of content requests, read through useSyncExternalStore snapshots (React
 * Compiler memoizes render reads of module state). Entries are replaced, never mutated, so a
 * snapshot only changes when its entry does. A refresh keeps the old data on screen; a failed
 * refresh keeps it too and sets `error`.
 */
type Entry<T> = { data?: T; error?: Error; loading: boolean };

const IDLE: Entry<never> = { loading: false };
const entries = new Map<string, Entry<unknown>>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set(key: string, entry: Entry<unknown>) {
  entries.set(key, entry);
  listeners.forEach((l) => l());
}

function load<T>(key: string, fetcher: () => Promise<T>, onData?: (data: T) => void) {
  const prev = entries.get(key) ?? IDLE;
  if (prev.loading) return;
  set(key, { data: prev.data, loading: true });
  fetcher().then(
    (data) => {
      onData?.(data);
      set(key, { data, loading: false });
    },
    (error: Error) => set(key, { data: entries.get(key)?.data, error, loading: false }),
  );
}

/**
 * One cached request. Only the first use of a key fetches; later screens reuse the entry.
 * `fetcher` and `onData` must be stable (useCallback or module functions).
 */
export function useContent<T>(key: string, fetcher: () => Promise<T>, onData?: (data: T) => void) {
  const entry = useSyncExternalStore(subscribe, () => (entries.get(key) ?? IDLE) as Entry<T>);
  useEffect(() => {
    if (!entries.has(key)) load(key, fetcher, onData);
  }, [key, fetcher, onData]);
  const reload = useCallback(() => load(key, fetcher, onData), [key, fetcher, onData]);
  return { ...entry, reload };
}

const stayKey = (slug: string) => `stay:${slug}`;

/** Fills the detail cache from a list, so opening a card needs no second request. */
export function cacheStays(stays: Stay[]) {
  for (const stay of stays) {
    const key = stayKey(stay.id);
    if (!entries.get(key)?.loading) entries.set(key, { data: stay, loading: false });
  }
}

/** Stays of one type (or all), best rated first. */
export function useStays(type: StayType | null) {
  const fetcher = useCallback(() => fetchStays(type), [type]);
  const { data, error, loading, reload } = useContent(`stays:${type ?? "all"}`, fetcher, cacheStays);
  return { stays: data, error, loading, reload };
}

/** One stay by slug. `stay` is `null` once loaded when no stay has that slug. */
export function useStay(slug: string) {
  const fetcher = useCallback(() => fetchStay(slug), [slug]);
  const { data, error, loading, reload } = useContent(stayKey(slug), fetcher);
  return { stay: data, error, loading, reload };
}

/** The details screen's extra fields (photos, times, rules, host, cancellation) for one stay. */
export function useStayDetails(slug: string) {
  const fetcher = useCallback(() => fetchStayDetails(slug), [slug]);
  const { data, error, loading, reload } = useContent(`details:${slug}`, fetcher);
  return { details: data, error, loading, reload };
}

/** Roam's policies in one category (e.g. "cancellation"), for the Profile's policies sheet. */
export function usePolicies(category: string) {
  const fetcher = useCallback(() => fetchPolicies(category), [category]);
  const { data, error, loading, reload } = useContent(`policies:${category}`, fetcher);
  return { policies: data, error, loading, reload };
}
