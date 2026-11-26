import { useCallback, useSyncExternalStore } from "react";

/**
 * Saved stays for this app session only (in memory; cleared on restart). Stands in for a
 * real Saved feature; keep the `useSaved` shape so screens don't change when it lands.
 */
const saved = new Set<string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toggleSaved(id: string) {
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  listeners.forEach((l) => l());
}

/**
 * Whether a stay is saved, and a toggle. The value comes from the store snapshot, never from
 * reading the Set during render: React Compiler memoizes render reads of module state.
 */
export function useSaved(id: string): [boolean, () => void] {
  const isSaved = useSyncExternalStore(subscribe, () => saved.has(id));
  const toggle = useCallback(() => toggleSaved(id), [id]);
  return [isSaved, toggle];
}

/** How many stays are saved this session (Profile's Saved stat). */
export function useSavedCount(): number {
  return useSyncExternalStore(subscribe, () => saved.size);
}
