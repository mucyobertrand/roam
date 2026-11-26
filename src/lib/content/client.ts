import { fetch } from "expo/fetch";

import { appLog } from "@/lib/analytics/logs";

/**
 * Reads published content from Sanity's API CDN. The dataset is public, so there is no token:
 * never add one here (this file ships in the app bundle). Values always go in as GROQ params.
 */
const PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET;
const API_VERSION = "v2026-11-01";
const TIMEOUT_MS = 10_000;

export class ContentError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 for network failures and timeouts. */
    readonly status: number,
  ) {
    super(message);
    this.name = "ContentError";
  }
}

export type GroqParams = Record<string, string | number | boolean | null | string[]>;

export async function groq<T>(query: string, params: GroqParams = {}): Promise<T> {
  if (!PROJECT_ID || !DATASET) {
    throw new ContentError("EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET must be set", 0);
  }
  const search = new URLSearchParams({ query, perspective: "published" });
  for (const [name, value] of Object.entries(params)) search.set(`$${name}`, JSON.stringify(value));
  const url = `https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}?${search}`;

  const controller = new AbortController();
  const startedAt = Date.now();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new ContentError(`Content request failed (${response.status})`, response.status);
    const body = (await response.json()) as { result: T };
    appLog.contentRequestCompleted(response.status, Date.now() - startedAt);
    return body.result;
  } catch (error) {
    const contentError =
      error instanceof ContentError ? error : new ContentError(controller.signal.aborted ? "Content request timed out" : "Network error", 0);
    appLog.contentRequestFailed(contentError.status, Date.now() - startedAt, controller.signal.aborted);
    throw contentError;
  } finally {
    clearTimeout(timer);
  }
}
