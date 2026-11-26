/**
 * Checks "Ask about this stay": (a) realistic questions map to the expected topics, and (b) for
 * every live stay, each topic either builds a non-empty answer from stored fields or is hidden.
 * Run: node scripts/check-ask.mjs
 */
import { groq } from "../src/lib/content/client";
import { fetchStayDetails } from "../src/lib/content/stays";
import { answerFor, matchTopics, TOPICS, type TopicId } from "../src/lib/ask/topics";

const cases: [string, TopicId[]][] = [
  ["What time is check-in?", ["checkin"]],
  ["when can we arrive", ["checkin"]],
  ["Is late checkout possible?", ["checkin"]],
  ["can I bring my dog and when is check-in?", ["checkin", "pets"]],
  ["Are pets allowed?", ["pets"]],
  ["is it ok to bring 2 cats", ["pets"]],
  ["What are the house rules?", ["rules"]],
  ["can we have a party", ["rules"]],
  ["Is smoking allowed on the deck?", ["rules"]],
  ["what are the quiet hours", ["rules"]],
  ["What's the cancellation policy?", ["cancellation"]],
  ["refund if I cancel?", ["cancellation"]],
  ["Can I get my money back", ["cancellation"]],
  ["is there wifi", ["amenities"]],
  ["Does it have a hot tub?", ["amenities"]],
  ["is there free parking for 2 cars", ["amenities"]],
  ["Is there a Wi-Fi password and a desk to work at?", ["amenities"]],
  ["Who is the host?", ["host"]],
  ["Can I message the owner?", ["host"]],
  ["Do dogs need to follow the house rules about noise?", ["pets", "rules"]],
  ["If I cancel can I still bring my pet later?", ["pets", "cancellation"]],
  ["is it near the beach?", []],
  ["hello", []],
  ["how many bedrooms", []],
  ["checking the place out", []],
];

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

console.log("Matcher");
for (const [q, expected] of cases) {
  const got = matchTopics(q);
  if (JSON.stringify(got) === JSON.stringify(expected)) console.log(`  ✓ ${q} → ${got.join(", ") || "(none)"}`);
  else fail(`${q} → ${got.join(", ") || "(none)"}, expected ${expected.join(", ") || "(none)"}`);
}
for (const t of TOPICS) {
  if (JSON.stringify(matchTopics(t.question)) !== JSON.stringify([t.id])) fail(`chip "${t.label}" question doesn't match only ${t.id}`);
}

console.log("Answers for every live stay");
const slugs = await groq<string[]>(`*[_type == "property" && defined(slug.current)].slug.current`);
const hidden: string[] = [];
for (const slug of slugs) {
  const d = await fetchStayDetails(slug);
  if (!d) {
    fail(`${slug}: no details`);
    continue;
  }
  for (const t of TOPICS) {
    const a = answerFor(t.id, d);
    if (!a) {
      hidden.push(`${slug}:${t.id}`);
      continue;
    }
    const b = a.body;
    const empty =
      (b.kind === "lines" && (!b.lines.length || b.lines.some((l) => !l.trim()))) ||
      (b.kind === "bullets" && b.items.some((i) => !i.trim())) ||
      (b.kind === "policy" && (!b.summary.trim() || !b.blocks.length)) ||
      (b.kind === "amenities" && b.items.some((i) => !i.label));
    if (empty || !a.source.label) fail(`${slug}: ${t.id} has an empty answer or source`);
  }
}
console.log(`  ${slugs.length} stays × ${TOPICS.length} topics checked; hidden (no data): ${hidden.join(", ") || "none"}`);

console.log(failures ? `\n${failures} failure(s)` : "\nAll ask checks passed");
process.exit(failures ? 1 : 0);
