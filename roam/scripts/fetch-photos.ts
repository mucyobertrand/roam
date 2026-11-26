/**
 * Finds real Unsplash photos for the seed and writes them to seed/photos.json (committed), so
 * the seed itself never calls Unsplash. Resumable: slugs already in photos.json are skipped.
 *
 * Needs UNSPLASH_ACCESS_KEY (a free Unsplash "Demo" app's Access Key) in the repo's .env.local.
 * Server-only, never EXPO_PUBLIC_. Demo apps get 50 requests an hour; this makes one search per
 * stay/host (a second only when the first returns too few photos) and stops early when the
 * limit runs out. Run it again later to finish.
 *
 *   cd roam && npx sanity exec scripts/fetch-photos.ts
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'

import {hosts} from '../seed/hosts'
import {stays} from '../seed/stays'
import type {SeedPhoto} from '../seed/types'

// Run from roam/ (sanity exec needs the Studio's sanity.cli.ts there).
const STUDIO = process.cwd()
const ROOT = resolve(STUDIO, '..')
const OUT = resolve(STUDIO, 'seed', 'photos.json')

/** Photos per stay including the cover (schema allows 3–6). */
const GALLERY_SIZE = 4

type PhotosFile = {stays: Record<string, SeedPhoto[]>; hosts: Record<string, SeedPhoto>}

type UnsplashResult = {
  id: string
  premium?: boolean
  plus?: boolean
  alt_description: string | null
  description: string | null
  urls: {raw: string}
  links: {html: string}
}

function readKey(): string {
  if (process.env.UNSPLASH_ACCESS_KEY) return process.env.UNSPLASH_ACCESS_KEY
  const envFile = resolve(ROOT, '.env.local')
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('UNSPLASH_ACCESS_KEY='))
    const value = line?.slice('UNSPLASH_ACCESS_KEY='.length).trim().replace(/^["']|["']$/g, '')
    if (value) return value
  }
  throw new Error('UNSPLASH_ACCESS_KEY is missing. Add it to .env.local at the repo root.')
}

class RateLimited extends Error {}

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

async function search(key: string, query: string, orientation: 'landscape' | 'squarish'): Promise<UnsplashResult[]> {
  const url = new URL('https://api.unsplash.com/search/photos')
  url.search = new URLSearchParams({query, per_page: '15', orientation, content_filter: 'high'}).toString()
  const res = await fetch(url, {headers: {Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1'}})
  if (res.status === 403 || res.status === 429) throw new RateLimited(`Unsplash rate limit reached (${res.status})`)
  if (!res.ok) throw new Error(`Unsplash search "${query}" failed: ${res.status} ${await res.text()}`)
  const remaining = res.headers.get('x-ratelimit-remaining')
  console.log(`  searched "${query}" (${remaining ?? '?'} requests left this hour)`)
  const body = (await res.json()) as {results: UnsplashResult[]}
  return body.results.filter(
    (r) => !r.premium && !r.plus && r.urls.raw.startsWith('https://images.unsplash.com/') && r.links.html.startsWith('https://unsplash.com/'),
  )
}

function toPhoto(r: UnsplashResult, fallbackAlt: string, size: string): SeedPhoto {
  const base = r.urls.raw.split('?')[0]
  return {
    url: `${base}?${size}&q=80&fm=jpg&fit=crop`,
    credit: r.links.html,
    alt: sentence((r.alt_description ?? r.description ?? fallbackAlt).trim()).slice(0, 160),
  }
}

const photoId = (url: string) => url.split('?')[0]

async function main() {
  const key = readKey()
  const file: PhotosFile = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {stays: {}, hosts: {}}
  // Never use one photo twice across the whole seed.
  const used = new Set<string>([
    ...stays.flatMap((s) => (s.cover ? [photoId(s.cover.url)] : [])),
    ...Object.values(file.stays).flat().map((p) => photoId(p.url)),
    ...Object.values(file.hosts).map((p) => photoId(p.url)),
  ])
  const save = () => writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`)

  try {
    for (const stay of stays) {
      if (file.stays[stay.slug]) continue
      const need = GALLERY_SIZE - (stay.cover ? 1 : 0)
      const picked: SeedPhoto[] = []
      for (const query of stay.photoQueries) {
        if (picked.length >= need) break
        for (const r of await search(key, query, 'landscape')) {
          const photo = toPhoto(r, `${stay.title} in ${stay.city}`, 'w=1200')
          if (picked.length >= need || used.has(photoId(photo.url))) continue
          used.add(photoId(photo.url))
          picked.push(photo)
        }
      }
      if (picked.length + (stay.cover ? 1 : 0) < 3) throw new Error(`Only ${picked.length} photos found for ${stay.slug}; change its photoQueries`)
      file.stays[stay.slug] = [...(stay.cover ? [stay.cover] : []), ...picked]
      save()
      console.log(`${stay.slug}: ${file.stays[stay.slug].length} photos`)
    }

    for (const host of hosts) {
      if (file.hosts[host.slug]) continue
      const r = (await search(key, host.photoQuery, 'squarish')).find((x) => !used.has(photoId(toPhoto(x, '', 'w=400').url)))
      if (!r) throw new Error(`No portrait found for ${host.slug}; change its photoQuery`)
      const photo = toPhoto(r, `Portrait of ${host.name}`, 'w=400&h=400')
      used.add(photoId(photo.url))
      file.hosts[host.slug] = photo
      save()
      console.log(`${host.slug}: portrait`)
    }
  } catch (error) {
    if (error instanceof RateLimited) {
      console.log(`${error.message}. Progress is saved; run again in an hour to finish.`)
      process.exitCode = 2
      return
    }
    throw error
  }

  console.log(`Done: ${Object.keys(file.stays).length}/${stays.length} stays, ${Object.keys(file.hosts).length}/${hosts.length} hosts in seed/photos.json`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
