// Runs scripts/check-ask.ts through jiti with the app's "@/" alias (tsconfig paths),
// `expo/fetch` mapped to Node's fetch, and the Sanity env vars from .env.local.
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^(EXPO_PUBLIC_SANITY_\w+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}
const jiti = createJiti(import.meta.url, {
  alias: {
    "@/": `${path.join(root, "src")}${path.sep}`,
    "expo/fetch": path.join(root, "scripts", "expo-fetch-shim.mjs"),
    "@/lib/analytics/logs": path.join(root, "scripts", "app-log-shim.mjs"),
  },
});
await jiti.import(path.join(root, "scripts", "check-ask.ts"));
