import type {Amenity, PolicyCategory, StayType} from '../schemaTypes/constants'

/** Paragraphs and bullet lists; `**bold**` marks strong text. Turned into Portable Text by the seed. */
export type PolicyBlock = string | {bullets: string[]}

export type SeedPolicy = {
  key: string
  title: string
  category: PolicyCategory
  summary: string
  body: PolicyBlock[]
}

export type SeedHost = {
  slug: string
  name: string
  bio: string
  hostingSince: number
  languages: string[]
  /** Unsplash search used by `fetch-photos.ts` for the portrait. */
  photoQuery: string
}

export type SeedPhoto = {url: string; credit: string; alt: string}

export type SeedStay = {
  slug: string
  title: string
  type: StayType
  city: string
  region: string
  country: string
  pricePerNight: number
  rating: number
  reviewCount: number
  maxGuests: number
  bedrooms: number
  petsAllowed: boolean
  amenities: Amenity[]
  vibes: string[]
  description: string
  checkInTime: string
  checkOutTime: string
  houseRules: string[]
  host: string
  cancellation: 'cancellation-flexible' | 'cancellation-moderate' | 'cancellation-strict'
  /** Known cover photo (the 13 stays carried over from the app). Galleries come from photos.json. */
  cover?: SeedPhoto
  /** Unsplash searches used by `fetch-photos.ts` for the gallery, most specific first. */
  photoQueries: string[]
}
