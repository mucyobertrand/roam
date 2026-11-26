/**
 * Value lists for the fields guests filter on. They must match `src/data/stays.ts` in the app
 * (StayType, Amenity, amenityLabels): the app filters and labels with those values.
 */

export const STAY_TYPES = [
  {title: 'Cabin', value: 'cabin'},
  {title: 'Beach', value: 'beach'},
  {title: 'City', value: 'city'},
  {title: 'Villa', value: 'villa'},
] as const

export const AMENITIES = [
  {title: 'Hot Tub', value: 'hot-tub'},
  {title: 'Pool', value: 'pool'},
  {title: 'Fireplace', value: 'fireplace'},
  {title: 'Wi-Fi', value: 'wifi'},
  {title: 'Kitchen', value: 'kitchen'},
  {title: 'Free Parking', value: 'parking'},
  {title: 'Sauna', value: 'sauna'},
  {title: 'Ocean View', value: 'ocean-view'},
  {title: 'Workspace', value: 'workspace'},
  {title: 'EV Charger', value: 'ev-charger'},
] as const

export const POLICY_CATEGORIES = [
  {title: 'Cancellation', value: 'cancellation'},
  {title: 'Payment', value: 'payment'},
  {title: 'Pets', value: 'pets'},
  {title: 'Safety', value: 'safety'},
  {title: 'Damage', value: 'damage'},
  {title: 'Support', value: 'support'},
] as const

export type StayType = (typeof STAY_TYPES)[number]['value']
export type Amenity = (typeof AMENITIES)[number]['value']
export type PolicyCategory = (typeof POLICY_CATEGORIES)[number]['value']

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
