/**
 * Checks the live content the app reads: runs the same GROQ as src/lib/content/stays.ts against
 * the public API CDN and verifies every row is a complete `Stay` with known values. No token.
 *
 *   node scripts/check-content.mjs
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^EXPO_PUBLIC_SANITY_/.test(l))
    .map((l) => l.trim().split("=")),
);
const project = env.EXPO_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.EXPO_PUBLIC_SANITY_DATASET;
if (!project || !dataset) throw new Error("Set EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET in .env.local");

// Keep in sync with src/lib/content/stays.ts.
const source = readFileSync(new URL("../src/lib/content/stays.ts", import.meta.url), "utf8");
const fields = source.match(/const STAY_FIELDS = `([\s\S]*?)`;/)[1];
const listQuery = source.match(/const STAYS_QUERY = `([\s\S]*?)`;/)[1].replace("${STAY_FIELDS}", fields);
const policyFields = source.match(/const POLICY_FIELDS = `([\s\S]*?)`;/)[1];
const detailsQuery = source.match(/const DETAILS_QUERY = `([\s\S]*?)`;/)[1].replace("${STAY_FIELDS}", fields).replace("${POLICY_FIELDS}", policyFields);
const policiesQuery = source.match(/const POLICIES_QUERY = `([\s\S]*?)`;/)[1].replace("${POLICY_FIELDS}", policyFields);

async function groq(query, params) {
  const search = new URLSearchParams({ query, perspective: "published" });
  for (const [k, v] of Object.entries(params)) search.set(`$${k}`, JSON.stringify(v));
  const res = await fetch(`https://${project}.apicdn.sanity.io/v2026-11-01/data/query/${dataset}?${search}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

const TYPES = ["cabin", "beach", "city", "villa"];
const AMENITIES = ["hot-tub", "pool", "fireplace", "wifi", "kitchen", "parking", "sauna", "ocean-view", "workspace", "ev-charger"];
const errors = [];

const all = await groq(listQuery, { type: null });
for (const s of all) {
  const at = s.id ?? "(no slug)";
  for (const k of ["id", "title", "city", "region", "description", "image", "credit"]) if (typeof s[k] !== "string" || !s[k]) errors.push(`${at}: missing ${k}`);
  for (const k of ["pricePerNight", "rating", "reviewCount", "maxGuests", "bedrooms"]) if (typeof s[k] !== "number") errors.push(`${at}: ${k} is not a number`);
  if (typeof s.petsAllowed !== "boolean") errors.push(`${at}: petsAllowed is not a boolean`);
  if (!TYPES.includes(s.type)) errors.push(`${at}: unknown type ${s.type}`);
  for (const a of s.amenities) if (!AMENITIES.includes(a)) errors.push(`${at}: unknown amenity ${a}`);
}
for (let i = 1; i < all.length; i++) if (all[i - 1].rating < all[i].rating) errors.push(`not sorted by rating at ${all[i].id}`);

const counts = {};
for (const t of TYPES) counts[t] = (await groq(listQuery, { type: t })).length;
if (Object.values(counts).reduce((a, b) => a + b, 0) !== all.length) errors.push(`type counts ${JSON.stringify(counts)} don't add up to ${all.length}`);

// The details screen's query, for every stay: what its sections need must be there.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
for (const { id } of all) {
  const d = await groq(detailsQuery, { slug: id });
  if (!d) {
    errors.push(`${id}: details query returned nothing`);
    continue;
  }
  if (!Array.isArray(d.photos) || d.photos.length < 3 || d.photos.some((p) => !p.url)) errors.push(`${id}: needs 3+ photos with urls`);
  if (!TIME.test(d.checkInTime ?? "") || !TIME.test(d.checkOutTime ?? "")) errors.push(`${id}: check-in/out must be HH:MM`);
  if (!Array.isArray(d.houseRules) || d.houseRules.some((r) => typeof r !== "string" || !r)) errors.push(`${id}: bad house rules`);
  if (!d.host?.name) errors.push(`${id}: no host name`);
  if (!d.cancellation?.title || !d.cancellation?.summary || !d.cancellation.body?.length) errors.push(`${id}: incomplete cancellation policy`);
  for (const b of d.cancellation?.body ?? []) if (!b.children?.every((c) => typeof c.text === "string")) errors.push(`${id}: policy block ${b._key} has no text`);
}

// Profile's policies sheet: Roam's cancellation policies, each complete.
const policies = await groq(policiesQuery, { category: "cancellation" });
if (policies.length === 0) errors.push("no cancellation policies");
for (const p of policies) {
  if (!p.title || !p.summary || !p.body?.length) errors.push(`policy ${p.key ?? "(no key)"}: incomplete`);
  for (const b of p.body ?? []) if (!b.children?.every((c) => typeof c.text === "string")) errors.push(`policy ${p.key}: block ${b._key} has no text`);
}

console.log(`${policies.length} cancellation policies: ${policies.map((p) => p.title).join(", ")}`);
console.log(`${all.length} stays live; by type ${JSON.stringify(counts)}; details checked for each`);
if (errors.length) {
  console.error(`${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("✓ content matches what the app expects");
