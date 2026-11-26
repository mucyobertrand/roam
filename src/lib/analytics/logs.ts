import { withClient } from "./client";

/**
 * The only app logger exported to PostHog. Keep attributes non-sensitive and
 * add new log points here so every exported application log is reviewable.
 */
export const appLog = {
  contentRequestCompleted(status: number, durationMs: number) {
    withClient((client) =>
      client.logger.info("content_request_completed", {
        request_target: "sanity_content_cdn",
        status,
        duration_ms: durationMs,
      }),
    );
  },

  contentRequestFailed(status: number, durationMs: number, timedOut: boolean) {
    withClient((client) =>
      client.logger.warn("content_request_failed", {
        request_target: "sanity_content_cdn",
        status,
        duration_ms: durationMs,
        timed_out: timedOut,
      }),
    );
  },
};
