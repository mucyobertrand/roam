// Node stand-in for src/lib/analytics/logs.ts in check scripts: the real one loads PostHog and
// expo-constants, which don't run in Node, so app logs are no-ops here.
export const appLog = new Proxy({}, { get: () => () => {} });
