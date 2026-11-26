// Fails if a mirrored token in src/theme/tokens.ts differs from src/global.css.
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/global.css", import.meta.url), "utf8");
const ts = readFileSync(new URL("../src/theme/tokens.ts", import.meta.url), "utf8");

const cssVars = Object.fromEntries(
  [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim().replace(/^"|"$/g, "").toLowerCase()]),
);

let failures = 0;
let checked = 0;
for (const [, value, name] of ts.matchAll(/:\s*"?([^",]+)"?,\s*\/\/\s*(--[\w-]+)/g)) {
  checked++;
  const expected = cssVars[name];
  const actual = /^\d+$/.test(value) ? `${value}px` : value.toLowerCase();
  if (expected !== actual) {
    failures++;
    console.error(`✗ ${name}: global.css has ${expected ?? "(missing)"}, tokens.ts has ${actual}`);
  }
}
if (checked === 0) {
  console.error("✗ no mirrored tokens found");
  process.exit(1);
}
console.log(failures ? `${failures} token(s) drifted` : `✓ ${checked} mirrored tokens match global.css`);
process.exit(failures ? 1 : 0);
