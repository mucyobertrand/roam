import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {POLICY_CATEGORIES} from '../constants'

/**
 * A Roam policy, shared across stays. Policy answers quote `body` word for word, so it is
 * final copy: keep it plain (paragraphs, bullets, bold).
 */
export const policy = defineType({
  name: 'policy',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'key',
      description: 'Stable identifier, e.g. "cancellation-flexible".',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: {list: [...POLICY_CATEGORIES], layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      description: 'One line shown before the full text.',
      type: 'string',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [{title: 'Bullet', value: 'bullet'}],
          marks: {decorators: [{title: 'Strong', value: 'strong'}], annotations: []},
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'category'},
  },
})
