import type { Stay, StayType } from "@/data/stays";

import { groq } from "./client";

/** Projects a property document onto the app's `Stay`. The first photo is the cover. */
export const STAY_FIELDS = `
  "id": slug.current, title, type,
  "city": location.city, "region": location.region,
  pricePerNight, rating, reviewCount, maxGuests, bedrooms, petsAllowed,
  "amenities": coalesce(amenities, []), "vibes": coalesce(vibes, []),
  description, "image": photos[0].url, "credit": photos[0].credit
`;

const STAYS_QUERY = `*[_type == "property" && defined(slug.current) && ($type == null || type == $type)]
  | order(rating desc, reviewCount desc) {${STAY_FIELDS}}`;

const STAY_QUERY = `*[_type == "property" && slug.current == $slug][0]{${STAY_FIELDS}}`;

/** Drops documents missing what a card needs, instead of rendering a broken card. */
export const isComplete = (s: Partial<Stay> | null): s is Stay =>
  !!s && !!s.id && !!s.title && !!s.image && typeof s.pricePerNight === "number";

export async function fetchStays(type: StayType | null): Promise<Stay[]> {
  const rows = await groq<Partial<Stay>[]>(STAYS_QUERY, { type });
  return rows.filter(isComplete);
}

/** `null` when no published stay has this slug. */
export async function fetchStay(slug: string): Promise<Stay | null> {
  const row = await groq<Partial<Stay> | null>(STAY_QUERY, { slug });
  return isComplete(row) ? row : null;
}

/** A Portable Text block from a policy body: paragraphs and bullets with bold spans only. */
export type PolicyBlock = {
  _key: string;
  listItem?: "bullet";
  children: { _key: string; text: string; marks?: string[] }[];
};

/** A Roam policy as stored: title, one-line summary and full body, shown word for word. */
export type Policy = { key: string; title: string; summary: string; body: PolicyBlock[] };

/** The policy fields, shared by the stay's cancellation policy and Roam's policy list. */
const POLICY_FIELDS = `"key": key.current, title, summary, "body": coalesce(body, [])[_type == "block"]{_key, listItem, "children": children[]{_key, text, marks}}`;

const POLICIES_QUERY = `*[_type == "policy" && category == $category] | order(title asc){${POLICY_FIELDS}}`;

/** Roam's policies in one category (e.g. "cancellation"), by title. Drops incomplete ones. */
export async function fetchPolicies(category: string): Promise<Policy[]> {
  const rows = await groq<Partial<Policy>[]>(POLICIES_QUERY, { category });
  return rows.filter((p): p is Policy => !!p.title && !!p.summary && Array.isArray(p.body) && p.body.length > 0);
}

/** Everything the stay details screen shows beyond the card fields. */
export type StayDetails = Stay & {
  photos: { url: string; alt: string | null }[];
  checkInTime: string;
  checkOutTime: string;
  houseRules: string[];
  host: { name: string; photo: string | null; hostingSince: number | null; languages: string[]; bio: string | null } | null;
  cancellation: { title: string; summary: string; body: PolicyBlock[] } | null;
};

const DETAILS_QUERY = `*[_type == "property" && slug.current == $slug][0]{${STAY_FIELDS},
  "photos": photos[defined(url)]{url, alt},
  checkInTime, checkOutTime, "houseRules": coalesce(houseRules, []),
  "host": host->{name, "photo": photo.url, hostingSince, "languages": coalesce(languages, []), bio},
  "cancellation": cancellationPolicy->{${POLICY_FIELDS}}
}`;

/** `null` when no published stay has this slug. */
export async function fetchStayDetails(slug: string): Promise<StayDetails | null> {
  const row = await groq<Partial<StayDetails> | null>(DETAILS_QUERY, { slug });
  return isComplete(row) && Array.isArray((row as Partial<StayDetails>).photos) ? (row as StayDetails) : null;
}
