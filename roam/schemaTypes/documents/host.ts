import {UserIcon} from '@sanity/icons/User'
import {defineArrayMember, defineField, defineType} from 'sanity'

/** A host, shared by every stay they run. */
export const host = defineType({
  name: 'host',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'photo', type: 'remotePhoto'}),
    defineField({name: 'bio', type: 'text', rows: 4, validation: (rule) => rule.max(600)}),
    defineField({
      name: 'hostingSince',
      description: 'Year they started hosting on Roam.',
      type: 'number',
      validation: (rule) => rule.integer().min(2000).max(new Date().getFullYear()),
    }),
    defineField({
      name: 'languages',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'hostingSince'},
    prepare: ({title, subtitle}) => ({title, subtitle: subtitle ? `Hosting since ${subtitle}` : undefined}),
  },
})
