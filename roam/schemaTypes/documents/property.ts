import {HomeIcon} from '@sanity/icons/Home'
import {createElement} from 'react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {AMENITIES, STAY_TYPES, TIME_PATTERN} from '../constants'

const time = (value?: string) => !value || TIME_PATTERN.test(value) || 'Use 24-hour HH:MM, e.g. 15:00'

/**
 * A stay. Fields guests filter on are typed (Filters group). Descriptive text stays on this
 * document so embeddings see it without following references.
 */
export const property = defineType({
  name: 'property',
  title: 'Stay',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'details', title: 'Details', default: true},
    {name: 'filters', title: 'Filters'},
    {name: 'photos', title: 'Photos'},
    {name: 'rules', title: 'Rules'},
  ],
  fields: [
    defineField({name: 'title', type: 'string', group: 'details', validation: (rule) => rule.required().max(80)}),
    defineField({
      name: 'slug',
      description: 'The stay’s id in app links (/stay/<slug>).',
      type: 'slug',
      group: 'details',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 5,
      group: 'details',
      validation: (rule) => rule.required().min(200).max(700),
    }),
    defineField({
      name: 'vibes',
      description: 'Soft words the stay is known for (quiet, cozy, secluded). They rank results; they never filter.',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      validation: (rule) => rule.unique().max(8),
    }),
    defineField({
      name: 'host',
      type: 'reference',
      group: 'details',
      to: [{type: 'host'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rating',
      type: 'number',
      group: 'details',
      validation: (rule) => rule.min(0).max(5).precision(1),
    }),
    defineField({
      name: 'reviewCount',
      type: 'number',
      group: 'details',
      initialValue: 0,
      validation: (rule) => rule.integer().min(0),
    }),

    defineField({
      name: 'type',
      type: 'string',
      group: 'filters',
      options: {list: [...STAY_TYPES], layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      type: 'object',
      group: 'filters',
      options: {columns: 3},
      fields: [
        defineField({name: 'city', type: 'string', validation: (rule) => rule.required()}),
        defineField({
          name: 'region',
          description: 'US: two-letter state code (CA). Elsewhere: region name (Tuscany).',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'country',
          description: 'ISO code, e.g. US, IT.',
          type: 'string',
          validation: (rule) => rule.required().regex(/^[A-Z]{2}$/, {name: 'ISO 3166 alpha-2'}),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pricePerNight',
      description: 'USD per night.',
      type: 'number',
      group: 'filters',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'maxGuests',
      type: 'number',
      group: 'filters',
      validation: (rule) => rule.required().integer().min(1).max(30),
    }),
    defineField({
      name: 'bedrooms',
      type: 'number',
      group: 'filters',
      validation: (rule) => rule.required().integer().min(0).max(20),
    }),
    defineField({
      name: 'petsAllowed',
      type: 'boolean',
      group: 'filters',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'amenities',
      type: 'array',
      group: 'filters',
      of: [defineArrayMember({type: 'string'})],
      options: {list: [...AMENITIES], layout: 'grid'},
      validation: (rule) => rule.unique(),
    }),

    defineField({
      name: 'photos',
      description: 'The first photo is the cover.',
      type: 'array',
      group: 'photos',
      of: [defineArrayMember({type: 'remotePhoto'})],
      validation: (rule) => rule.required().min(3).max(6),
    }),

    defineField({
      name: 'checkInTime',
      type: 'string',
      group: 'rules',
      placeholder: '15:00',
      validation: (rule) => rule.required().custom(time),
    }),
    defineField({
      name: 'checkOutTime',
      type: 'string',
      group: 'rules',
      placeholder: '11:00',
      validation: (rule) => rule.required().custom(time),
    }),
    defineField({
      name: 'houseRules',
      description: 'Rules specific to this stay. Roam-wide rules live in policies.',
      type: 'array',
      group: 'rules',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'cancellationPolicy',
      type: 'reference',
      group: 'rules',
      to: [{type: 'policy'}],
      options: {filter: 'category == "cancellation"'},
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', city: 'location.city', region: 'location.region', price: 'pricePerNight', photo: 'photos.0.url'},
    prepare: ({title, city, region, price, photo}) => ({
      title,
      media: photo
        ? createElement('img', {src: `${photo.split('?')[0]}?w=120&h=120&fit=crop&q=60`, alt: '', style: {objectFit: 'cover'}})
        : HomeIcon,
      subtitle: [city && region ? `${city}, ${region}` : city, price ? `$${price}/night` : undefined]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
