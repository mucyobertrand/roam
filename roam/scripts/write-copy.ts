/**
 * Writes each stay's `description` with Agent Actions, from facts built in code, and saves it
 * only when it invents nothing:
 *  1. Generate writes copy into an in-memory document (`targetDocument: create` + `noWrite`), so
 *     the model sees only the facts, never the current description or other fields.
 *  2. copy-checks.ts runs code checks (amenities, pets, numbers, places, distances, price).
 *  3. A Prompt (JSON) lists any claim the facts don't support. It must return none.
 * A failed attempt is retried up to twice with the reasons added. After 3 failures the stay keeps
 * its current description and is reported. Writes use ifRevisionId, so a Studio edit made while
 * this runs is never overwritten.
 *
 *   cd roam && npx sanity exec scripts/write-copy.ts --with-user-token                       # all stays
 *   cd roam && npx sanity exec scripts/write-copy.ts --with-user-token -- --dry-run          # nothing written
 *   cd roam && npx sanity exec scripts/write-copy.ts --with-user-token -- --only <slug>      # one stay
 *   cd roam && npx sanity exec scripts/write-copy.ts --with-user-token -- --batch 0:10       # stays 0–9 by slug
 *
 * The full report (facts, copy and checks for every attempt) goes to scripts/out/copy-report.json.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'

import {getCliClient} from 'sanity/cli'

import type {Amenity, StayType} from '../schemaTypes/constants'
import {buildFacts, checkCopy, knownPlaces, type Facts} from './copy-checks'

/** Deployed schema used by Agent Actions (`npx sanity schema list`). */
const SCHEMA_ID = '_.schemas.default'
const MAX_ATTEMPTS = 3

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined
const BATCH = args.includes('--batch') ? args[args.indexOf('--batch') + 1].split(':').map(Number) : undefined
const REPORT = resolve(process.cwd(), 'scripts', 'out', 'copy-report.json')

const client = getCliClient({apiVersion: 'vX'})

type Property = {
  _id: string
  _rev: string
  slug: string
  title: string
  type: StayType
  location: {city: string; region: string; country: string}
  maxGuests: number
  bedrooms: number
  petsAllowed: boolean
  amenities: Amenity[] | null
  vibes: string[] | null
  houseRules: string[] | null
  checkInTime: string
  checkOutTime: string
  description: string
  hostName: string | null
}

type Attempt = {copy: string; codeReasons: string[]; unsupported: {claim: string; reason: string}[]}

const GENERATE = `
You write the description for one vacation rental listing on Roam.

Facts (JSON). These are the only things you know about the stay:
$facts

Write 2 to 4 sentences, 250 to 600 characters, warm and plain, in the description field.
Rules:
- State only what the facts say or directly imply. If a detail isn't in the facts, leave it out.
- Don't mention price, rating, reviews, distances, travel times, views, nearby places, landmarks,
  activities, or features that are not listed in amenities, vibes or house rules.
- Name no place other than the stay's city, region and country.
- Use the vibes as the mood of the copy, without listing them.
- Numbers must come from the facts (guests, bedrooms, check-in and check-out).
- Mention pets only if pets are allowed, or if a house rule talks about them.
- Don't repeat the title word for word, don't use exclamation marks, and don't address the host.
- Don't open with "Settle into", "Welcome to" or "Escape to". Lead with what makes this stay itself.
$feedback`.trim()

const CHECK = `
You are a strict fact checker for vacation rental copy.

Facts (JSON):
$facts

Copy:
$copy

List every claim in the copy that the facts don't state or directly imply: invented features,
amenities, rooms, views, places, distances, activities, numbers or rules. Mood words that match
the vibes are fine. Rephrasings of facts are fine. Respond in JSON with exactly this shape:
{"unsupported": [{"claim": "the words from the copy", "reason": "why the facts don't support it"}]}
Return {"unsupported": []} when every claim is supported.`.trim()

async function generate(facts: Facts, feedback: string[]): Promise<string> {
  const result = await client.agent.action.generate({
    schemaId: SCHEMA_ID,
    noWrite: true,
    targetDocument: {operation: 'create', _type: 'property'},
    target: {path: 'description'},
    instruction: GENERATE,
    instructionParams: {
      facts: {type: 'constant', value: JSON.stringify(facts, null, 2)},
      feedback: {
        type: 'constant',
        value: feedback.length ? `\nAn earlier draft was rejected for these reasons. Avoid them:\n- ${feedback.join('\n- ')}` : '',
      },
    },
    temperature: 0.3,
  })
  const copy = (result as {description?: unknown}).description
  if (typeof copy !== 'string' || !copy.trim()) throw new Error('Generate returned no description')
  return copy.trim()
}

async function factCheck(facts: Facts, copy: string) {
  // The client types prompt() as string here even with format 'json', so cast the parsed JSON.
  const result = (await client.agent.action.prompt({
    format: 'json',
    temperature: 0,
    instruction: CHECK,
    instructionParams: {
      facts: {type: 'constant', value: JSON.stringify(facts, null, 2)},
      copy: {type: 'constant', value: copy},
    },
  })) as unknown as {unsupported?: {claim: string; reason: string}[]} | null
  if (!Array.isArray(result?.unsupported)) throw new Error(`Fact check returned an unexpected shape: ${JSON.stringify(result)}`)
  return result.unsupported
}

async function main() {
  const all = await client.fetch<Property[]>(
    `*[_type == "property" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(slug.current asc) {
      _id, _rev, "slug": slug.current, title, type, location, maxGuests, bedrooms, petsAllowed,
      amenities, vibes, houseRules, checkInTime, checkOutTime, description, "hostName": host->name
    }`,
  )
  if (all.length === 0) throw new Error('No properties found. Run scripts/seed.ts first.')
  const places = knownPlaces(all.map((p) => p.location))
  const targets = ONLY ? all.filter((p) => p.slug === ONLY) : BATCH ? all.slice(BATCH[0], BATCH[1]) : all
  if (ONLY && targets.length === 0) throw new Error(`No property with slug "${ONLY}"`)

  const {projectId, dataset} = client.config()
  console.log(`${DRY_RUN ? 'Dry run on' : 'Writing copy in'} ${projectId}/${dataset}: ${targets.length} stay(s)\n`)

  const report: {slug: string; facts: Facts; attempts: Attempt[]; passed: boolean; written: boolean; error?: string}[] = []
  for (const p of targets) {
    const facts = buildFacts(
      {...p, ...p.location, amenities: p.amenities ?? [], vibes: p.vibes ?? [], houseRules: p.houseRules ?? []},
      p.hostName ?? 'your host',
    )
    const entry = {slug: p.slug, facts, attempts: [] as Attempt[], passed: false, written: false, error: undefined as string | undefined}
    report.push(entry)
    try {
      let feedback: string[] = []
      while (entry.attempts.length < MAX_ATTEMPTS && !entry.passed) {
        const copy = await generate(facts, feedback)
        const codeReasons = checkCopy(copy, facts, places)
        // The AI check only runs on copy that already passed the free code checks.
        const unsupported = codeReasons.length ? [] : await factCheck(facts, copy)
        entry.attempts.push({copy, codeReasons, unsupported})
        entry.passed = codeReasons.length === 0 && unsupported.length === 0
        feedback = [...codeReasons, ...unsupported.map((u) => `"${u.claim}": ${u.reason}`)]
      }
      if (entry.passed && !DRY_RUN) {
        const copy = entry.attempts.at(-1)!.copy
        await client.patch(p._id).ifRevisionId(p._rev).set({description: copy}).commit({visibility: 'async'})
        entry.written = true
      }
    } catch (error) {
      entry.error = (error as Error).message
    }

    const last = entry.attempts.at(-1)
    const why = entry.error ?? (entry.passed ? '' : [...(last?.codeReasons ?? []), ...(last?.unsupported.map((u) => u.claim) ?? [])].join('; '))
    console.log(`${entry.passed ? 'pass' : 'FAIL'}  ${p.slug.padEnd(40)} attempts ${entry.attempts.length}${entry.written ? '  written' : ''}${why ? `  ${why}` : ''}`)
  }

  // Merge with earlier runs (batches, --only), keyed by slug, so the report covers every stay.
  mkdirSync(resolve(REPORT, '..'), {recursive: true})
  const earlier: typeof report = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : []
  const merged = [...earlier.filter((e) => !report.some((r) => r.slug === e.slug)), ...report].sort((a, b) => a.slug.localeCompare(b.slug))
  writeFileSync(REPORT, JSON.stringify(merged, null, 2))
  const passed = report.filter((r) => r.passed).length
  console.log(`\n${passed}/${report.length} passed, ${report.filter((r) => r.written).length} written. Report: scripts/out/copy-report.json`)
  if (passed < report.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
