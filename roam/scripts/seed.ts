/**
 * Seeds policies, hosts and stays. Safe to run more than once:
 * - Documents are matched by slug (`policy.key`, `host.slug`, `property.slug`). Existing ones
 *   get every seeded field set again; missing ones are created and Sanity generates the `_id`.
 * - It never deletes. Edits to seeded fields in Studio are overwritten on the next run;
 *   fields the seed doesn't set are left alone.
 * - `description` is written only when a stay is created. After that it belongs to
 *   scripts/write-copy.ts (Agent Actions copy), so reruns never erase generated copy.
 * - Everything is checked before writing: value lists, references, counts, and every image
 *   URL must respond. Nothing is written if any check fails.
 *
 *   cd roam && npx sanity exec scripts/seed.ts --with-user-token            # seed
 *   cd roam && npx sanity exec scripts/seed.ts --with-user-token -- --dry-run # checks only
 */
import {existsSync, readFileSync} from 'node:fs'
import {resolve} from 'node:path'

import {getCliClient} from 'sanity/cli'

import {AMENITIES, POLICY_CATEGORIES, STAY_TYPES, TIME_PATTERN} from '../schemaTypes/constants'
import {hosts} from '../seed/hosts'
import {policies} from '../seed/policies'
import {stays} from '../seed/stays'
import type {PolicyBlock, SeedPhoto} from '../seed/types'

const DRY_RUN = process.argv.includes('--dry-run')
const PHOTOS_FILE = resolve(process.cwd(), 'seed', 'photos.json')

const client = getCliClient({apiVersion: '2026-11-01'})

type PhotosFile = {stays: Record<string, SeedPhoto[]>; hosts: Record<string, SeedPhoto>}
type Doc = Record<string, unknown> & {_type: string}

// ---------- Build documents ----------

/** `**bold**` → strong spans. Keys are derived from position so reruns write identical content. */
function spans(text: string, prefix: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part, i) => {
      const strong = part.startsWith('**') && part.endsWith('**')
      return {_type: 'span', _key: `${prefix}s${i}`, text: strong ? part.slice(2, -2) : part, marks: strong ? ['strong'] : []}
    })
}

function portableText(blocks: PolicyBlock[]) {
  return blocks.flatMap((block, i) =>
    typeof block === 'string'
      ? [{_type: 'block', _key: `b${i}`, style: 'normal', markDefs: [], children: spans(block, `b${i}`)}]
      : block.bullets.map((item, j) => ({
          _type: 'block',
          _key: `b${i}l${j}`,
          style: 'normal',
          listItem: 'bullet',
          level: 1,
          markDefs: [],
          children: spans(item, `b${i}l${j}`),
        })),
  )
}

const photoField = (p: SeedPhoto, key?: string) => ({_type: 'remotePhoto', ...(key ? {_key: key} : {}), url: p.url, credit: p.credit, alt: p.alt})
const slug = (current: string) => ({_type: 'slug', current})
const ref = (_ref: string) => ({_type: 'reference', _ref})

function policyDoc(p: (typeof policies)[number]): Doc {
  return {_type: 'policy', title: p.title, key: slug(p.key), category: p.category, summary: p.summary, body: portableText(p.body)}
}

function hostDoc(h: (typeof hosts)[number], photos: PhotosFile): Doc {
  const photo = photos.hosts[h.slug]
  return {
    _type: 'host',
    name: h.name,
    slug: slug(h.slug),
    bio: h.bio,
    hostingSince: h.hostingSince,
    languages: h.languages,
    ...(photo ? {photo: photoField(photo)} : {}),
  }
}

function propertyDoc(s: (typeof stays)[number], photos: PhotosFile, hostIds: Map<string, string>, policyIds: Map<string, string>): Doc {
  return {
    _type: 'property',
    title: s.title,
    slug: slug(s.slug),
    description: s.description,
    vibes: s.vibes,
    host: ref(hostIds.get(s.host)!),
    rating: s.rating,
    reviewCount: s.reviewCount,
    type: s.type,
    location: {city: s.city, region: s.region, country: s.country},
    pricePerNight: s.pricePerNight,
    maxGuests: s.maxGuests,
    bedrooms: s.bedrooms,
    petsAllowed: s.petsAllowed,
    amenities: s.amenities,
    photos: photos.stays[s.slug].map((p, i) => photoField(p, `photo${i}`)),
    checkInTime: s.checkInTime,
    checkOutTime: s.checkOutTime,
    houseRules: s.houseRules,
    cancellationPolicy: ref(policyIds.get(s.cancellation)!),
  }
}

// ---------- Checks ----------

function checkSeed(photos: PhotosFile): string[] {
  const errors: string[] = []
  const fail = (msg: string) => errors.push(msg)
  const dupes = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i)

  const types = STAY_TYPES.map((t) => t.value as string)
  const amenities = AMENITIES.map((a) => a.value as string)
  const categories = POLICY_CATEGORIES.map((c) => c.value as string)
  const policyKeys = new Set(policies.map((p) => p.key))
  const hostSlugs = new Set(hosts.map((h) => h.slug))

  for (const d of dupes(policies.map((p) => p.key))) fail(`duplicate policy key ${d}`)
  for (const d of dupes(hosts.map((h) => h.slug))) fail(`duplicate host slug ${d}`)
  for (const d of dupes(stays.map((s) => s.slug))) fail(`duplicate stay slug ${d}`)
  for (const p of policies) if (!categories.includes(p.category)) fail(`policy ${p.key}: unknown category ${p.category}`)

  for (const s of stays) {
    const at = `stay ${s.slug}`
    if (!types.includes(s.type)) fail(`${at}: unknown type ${s.type}`)
    for (const a of s.amenities) if (!amenities.includes(a)) fail(`${at}: unknown amenity ${a}`)
    if (dupes(s.amenities).length) fail(`${at}: duplicate amenities`)
    if (!hostSlugs.has(s.host)) fail(`${at}: unknown host ${s.host}`)
    if (!policyKeys.has(s.cancellation) || policies.find((p) => p.key === s.cancellation)?.category !== 'cancellation')
      fail(`${at}: ${s.cancellation} is not a cancellation policy`)
    if (s.description.length < 200 || s.description.length > 700) fail(`${at}: description is ${s.description.length} chars (200–700)`)
    if (!TIME_PATTERN.test(s.checkInTime) || !TIME_PATTERN.test(s.checkOutTime)) fail(`${at}: check-in/out must be HH:MM`)
    if (!Number.isInteger(s.pricePerNight) || s.pricePerNight < 1) fail(`${at}: bad price`)
    if (!Number.isInteger(s.maxGuests) || s.maxGuests < 1) fail(`${at}: bad maxGuests`)
    if (s.rating < 0 || s.rating > 5) fail(`${at}: bad rating`)
    if (!/^[A-Z]{2}$/.test(s.country)) fail(`${at}: country must be ISO alpha-2`)
    if (s.country === 'US' && !/^[A-Z]{2}$/.test(s.region)) fail(`${at}: US region must be a state code`)
    const gallery = photos.stays[s.slug]
    if (!gallery) fail(`${at}: no photos in seed/photos.json (run scripts/fetch-photos.ts)`)
    else if (gallery.length < 3 || gallery.length > 6) fail(`${at}: ${gallery.length} photos (3–6)`)
  }
  for (const h of hosts) if (!photos.hosts[h.slug]) fail(`host ${h.slug}: no portrait in seed/photos.json`)

  const allPhotos = [...Object.values(photos.stays).flat(), ...Object.values(photos.hosts)]
  for (const p of allPhotos) {
    if (!p.url.startsWith('https://images.unsplash.com/')) fail(`photo ${p.url}: not an images.unsplash.com URL`)
    if (!p.credit.startsWith('https://unsplash.com/')) fail(`photo ${p.url}: credit is not an unsplash.com page`)
    if (!p.alt) fail(`photo ${p.url}: missing alt`)
  }
  for (const d of dupes(allPhotos.map((p) => p.url.split('?')[0]))) fail(`photo used twice: ${d}`)
  return errors
}

async function checkUrls(urls: string[]): Promise<string[]> {
  const failed: string[] = []
  const queue = [...new Set(urls)]
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      // Network errors (dropped connections) are retried; an HTTP error status fails at once.
      for (let attempt = 1; ; attempt++) {
        try {
          const res = await fetch(url, {method: 'HEAD'})
          if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) failed.push(`${res.status} ${url}`)
          break
        } catch (error) {
          if (attempt === 5) {
            failed.push(`${(error as Error).message} ${url}`)
            break
          }
          await new Promise((r) => setTimeout(r, 1000 * attempt))
        }
      }
    }
  }
  await Promise.all(Array.from({length: 8}, worker))
  return failed
}

// ---------- Upsert ----------

/** slug → published _id for one type. Fails if two published documents share a slug. */
async function existingIds(type: string, slugField: 'slug' | 'key'): Promise<Map<string, string>> {
  const rows = await client.fetch<{_id: string; slug: string}[]>(
    `*[_type == $type && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(${slugField}.current)]{_id, "slug": ${slugField}.current}`,
    {type},
  )
  const ids = new Map<string, string>()
  for (const row of rows) {
    if (ids.has(row.slug)) throw new Error(`Two ${type} documents share the slug "${row.slug}" (${ids.get(row.slug)}, ${row._id}). Fix that in Studio first.`)
    ids.set(row.slug, row._id)
  }
  return ids
}

/** Fields set only on create, never patched on reruns. */
const CREATE_ONLY: Record<string, string[]> = {property: ['description']}

async function upsert(type: string, slugField: 'slug' | 'key', docs: {slug: string; doc: Doc}[]) {
  const ids = await existingIds(type, slugField)
  const tx = client.transaction()
  let created = 0
  let updated = 0
  for (const {slug: s, doc} of docs) {
    const id = ids.get(s)
    if (id) {
      const {_type, ...fields} = doc
      for (const field of CREATE_ONLY[type] ?? []) delete fields[field]
      tx.patch(id, (p) => p.set(fields))
      updated++
    } else {
      tx.create(doc)
      created++
    }
  }
  await tx.commit({visibility: 'sync'})
  console.log(`${type}: created ${created} / updated ${updated}`)
  return existingIds(type, slugField)
}

async function main() {
  if (!existsSync(PHOTOS_FILE)) throw new Error('seed/photos.json is missing. Run scripts/fetch-photos.ts first.')
  const photos: PhotosFile = JSON.parse(readFileSync(PHOTOS_FILE, 'utf8'))

  const errors = checkSeed(photos)
  if (errors.length) throw new Error(`Seed data has ${errors.length} problem(s):\n- ${errors.join('\n- ')}`)

  const urls = [...Object.values(photos.stays).flat(), ...Object.values(photos.hosts)].map((p) => p.url)
  const broken = await checkUrls(urls)
  if (broken.length) throw new Error(`${broken.length} image URL(s) failed:\n- ${broken.join('\n- ')}`)
  console.log(`Checks passed: ${policies.length} policies, ${hosts.length} hosts, ${stays.length} stays, ${new Set(urls).size} image URLs respond`)

  if (DRY_RUN) {
    console.log('Dry run: nothing written.')
    return
  }

  const {projectId, dataset} = client.config()
  console.log(`Seeding ${projectId}/${dataset}`)
  const policyIds = await upsert('policy', 'key', policies.map((p) => ({slug: p.key, doc: policyDoc(p)})))
  const hostIds = await upsert('host', 'slug', hosts.map((h) => ({slug: h.slug, doc: hostDoc(h, photos)})))
  await upsert('property', 'slug', stays.map((s) => ({slug: s.slug, doc: propertyDoc(s, photos, hostIds, policyIds)})))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
