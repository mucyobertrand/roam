/**
 * Facts and code checks for stay copy written by Agent Actions (scripts/write-copy.ts).
 * Pure functions: no network, no Sanity client. Self-test: scripts/check-copy-checks.ts.
 *
 * The model only ever sees `Facts`. A check fails when the copy names something the facts
 * don't support. Words that appear anywhere in the facts' own text (title, vibes, house rules)
 * are always allowed, so a house rule like "No pets" lets the copy say pets aren't allowed.
 */
import {AMENITIES, STAY_TYPES, type Amenity, type StayType} from '../schemaTypes/constants'

export type FactsInput = {
  title: string
  type: StayType
  city: string
  region: string
  country: string
  maxGuests: number
  bedrooms: number
  petsAllowed: boolean
  amenities: Amenity[]
  vibes: string[]
  houseRules: string[]
  checkInTime: string
  checkOutTime: string
}

export type Facts = {
  title: string
  stayType: string
  city: string
  region: string
  country: string
  maxGuests: number
  bedrooms: number
  petsAllowed: boolean
  amenities: string[]
  vibes: string[]
  houseRules: string[]
  checkIn: string
  checkOut: string
  hostFirstName: string
}

/** US state code → name. Mirrors US_STATES in the app's src/lib/search/parse-query.ts. */
export const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

const countryNames = new Intl.DisplayNames(['en'], {type: 'region'})
const regionName = (region: string, country: string) => (country === 'US' ? (US_STATE_NAMES[region] ?? region) : region)

/** 24-hour "16:00" → "4 pm". */
function twelveHour(time: string) {
  const [h, m] = time.split(':').map(Number)
  const hour = h % 12 || 12
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`
}

export function buildFacts(stay: FactsInput, hostName: string): Facts {
  return {
    title: stay.title,
    stayType: STAY_TYPES.find((t) => t.value === stay.type)!.title,
    city: stay.city,
    region: regionName(stay.region, stay.country),
    country: countryNames.of(stay.country) ?? stay.country,
    maxGuests: stay.maxGuests,
    bedrooms: stay.bedrooms,
    petsAllowed: stay.petsAllowed,
    amenities: stay.amenities.map((a) => AMENITIES.find((x) => x.value === a)!.title),
    vibes: stay.vibes,
    houseRules: stay.houseRules,
    checkIn: twelveHour(stay.checkInTime),
    checkOut: twelveHour(stay.checkOutTime),
    hostFirstName: hostName.split(' ')[0],
  }
}

/** Words that mean an amenity. A hit is fine if the amenity is listed or the facts' text has it. */
const AMENITY_WORDS: Record<string, RegExp> = {
  'Hot Tub': /\b(hot[- ]tubs?|jacuzzis?|spa tubs?|whirlpools?)\b/i,
  Pool: /\b(pools?|plunge pools?|swimming)\b/i,
  Fireplace: /\b(fireplaces?|wood[- ]?stoves?|wood[- ]burn\w*|hearths?)\b/i,
  'Wi-Fi': /\b(wi-?fi|internet|broadband|wireless)\b/i,
  Kitchen: /\b(kitchens?|kitchenettes?)\b/i,
  'Free Parking': /\b(parking|garage|driveway|carport)\b/i,
  Sauna: /\b(saunas?|steam rooms?)\b/i,
  'Ocean View': /\b(ocean|sea)[- ]?views?\b|\bviews? (of|over|across) the (ocean|sea)\b/i,
  Workspace: /\b(workspaces?|desks?|home office|office space|work from)\b/i,
  'EV Charger': /\b(ev|electric[- ]vehicle|car)[- ]?charg\w*\b|\bchargers?\b/i,
}

const PET_WORDS = /\b(pets?|dogs?|cats?|pupp(y|ies)|four-legged|furry)\b/i
const PRICE_WORDS = /\$|\b(prices?|priced|dollars?|per night|nightly|rates?|cheap|budget|affordable|bargain|deal)\b/i
const PROXIMITY = /\b(minutes? (from|to|away)|steps (from|to|away)|walk(ing distance)? (to|from)|nearby|close to|near|next to|just off|around the corner|drive (from|to))\b/i
/** "One" is left out: it is mostly an idiom ("one of the", "the one"), not a count. */
const NUMBER_WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, twenty: 20, dozen: 12,
}

/** Every city and region in the seed plus every US state, for the "other places" check. */
export function knownPlaces(stays: {city: string; region: string; country: string}[]) {
  const places = new Set<string>(Object.values(US_STATE_NAMES))
  for (const s of stays) {
    places.add(s.city)
    places.add(regionName(s.region, s.country))
  }
  return [...places]
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hasPhrase = (text: string, phrase: string) => new RegExp(`\\b${escape(phrase)}\\b`, 'i').test(text)

/** Reasons the copy fails. An empty list means it passes. */
export function checkCopy(copy: string, facts: Facts, places: string[]): string[] {
  const reasons: string[] = []
  const factsText = [facts.title, ...facts.vibes, ...facts.houseRules].join(' \n ')
  const listed = new Set(facts.amenities)

  if (copy.length < 200 || copy.length > 700) reasons.push(`length ${copy.length} (needs 200–700)`)

  for (const [amenity, words] of Object.entries(AMENITY_WORDS)) {
    const hit = copy.match(words)?.[0]
    if (hit && !listed.has(amenity) && !words.test(factsText)) reasons.push(`mentions "${hit}" but ${amenity} isn't listed`)
  }

  const pet = copy.match(PET_WORDS)?.[0]
  if (pet && !facts.petsAllowed && !PET_WORDS.test(factsText)) reasons.push(`mentions "${pet}" but pets aren't allowed`)

  const price = copy.match(PRICE_WORDS)?.[0]
  if (price) reasons.push(`mentions price ("${price}")`)

  const near = copy.match(PROXIMITY)?.[0]
  if (near && !hasPhrase(factsText, near)) reasons.push(`claims a distance or nearby place ("${near}")`)

  // Numbers: digits and number words must come from the facts (guests, bedrooms, times, rules, title).
  const allowedNumbers = new Set<string>([String(facts.maxGuests), String(facts.bedrooms)])
  for (const t of [facts.checkIn, facts.checkOut]) for (const n of t.match(/\d+/g) ?? []) allowedNumbers.add(n)
  for (const n of factsText.match(/\d+/g) ?? []) allowedNumbers.add(n)
  for (const n of copy.match(/\d+/g) ?? []) if (!allowedNumbers.has(n)) reasons.push(`number ${n} isn't in the facts`)
  // Guest and bedroom counts must match their own fact, not just any number in the facts.
  const count = (s: string) => (/^\d+$/.test(s) ? Number(s) : NUMBER_WORDS[s.toLowerCase()])
  const numberish = `(\\d+|${Object.keys(NUMBER_WORDS).join('|')})`
  for (const m of copy.matchAll(new RegExp(`\\b(?:sleeps\\s+${numberish}|${numberish}\\s+(?:guests?|people|travell?ers|adults))\\b`, 'gi'))) {
    const n = count(m[1] ?? m[2])
    if (n !== undefined && n > facts.maxGuests) reasons.push(`says ${n} guests but the stay sleeps ${facts.maxGuests}`)
  }
  for (const m of copy.matchAll(new RegExp(`\\b${numberish}[- ]bed(?:room)?s?\\b`, 'gi'))) {
    const n = count(m[1])
    if (n !== undefined && n !== facts.bedrooms) reasons.push(`says ${n} bedrooms but the stay has ${facts.bedrooms}`)
  }

  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (!hasPhrase(copy, word)) continue
    if (!allowedNumbers.has(String(value)) && !hasPhrase(factsText, word)) reasons.push(`number "${word}" isn't in the facts`)
  }

  const own = [facts.city, facts.region, facts.country].map((p) => p.toLowerCase())
  for (const place of places) {
    const p = place.toLowerCase()
    if (own.some((o) => o === p || o.includes(p) || p.includes(o))) continue
    if (hasPhrase(copy, place) && !hasPhrase(factsText, place)) reasons.push(`names another place ("${place}")`)
  }

  return reasons
}
