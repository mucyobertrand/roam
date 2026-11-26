/**
 * The app's stay types and value labels. Stays themselves come from Sanity (src/lib/content);
 * `Stay` is what the GROQ projection there returns. StayType and Amenity must match
 * roam/schemaTypes/constants.ts.
 */

import type { IconName } from "@/components/ui";

export type StayType = "cabin" | "beach" | "city" | "villa";

export type Amenity =
  | "hot-tub"
  | "pool"
  | "fireplace"
  | "wifi"
  | "kitchen"
  | "parking"
  | "sauna"
  | "ocean-view"
  | "workspace"
  | "ev-charger";

export type Stay = {
  id: string;
  title: string;
  type: StayType;
  city: string;
  region: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  petsAllowed: boolean;
  amenities: Amenity[];
  /** Soft words the stay is known for; search ranks on these. */
  vibes: string[];
  description: string;
  image: string;
  credit: string;
};

export const amenityLabels: Record<Amenity, string> = {
  "hot-tub": "Hot Tub",
  pool: "Pool",
  fireplace: "Fireplace",
  wifi: "Wi-Fi",
  kitchen: "Kitchen",
  parking: "Free Parking",
  sauna: "Sauna",
  "ocean-view": "Ocean View",
  workspace: "Workspace",
  "ev-charger": "EV Charger",
};

export const amenityIcons: Record<Amenity, IconName> = {
  "hot-tub": "hot-tub",
  pool: "pool",
  fireplace: "flame",
  wifi: "wifi",
  kitchen: "kitchen",
  parking: "car",
  sauna: "sauna",
  "ocean-view": "ocean",
  workspace: "laptop",
  "ev-charger": "ev",
};

export const stayTypeLabels: Record<StayType, string> = {
  cabin: "Cabin",
  beach: "Beach",
  city: "City",
  villa: "Villa",
};
