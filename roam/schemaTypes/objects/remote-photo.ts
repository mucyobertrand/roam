import {ImageIcon} from '@sanity/icons/Image'
import {defineField, defineType} from 'sanity'

/** A remote Unsplash photo with its credit page. Not a Sanity asset (see prompts/08). */
export const remotePhoto = defineType({
  name: 'remotePhoto',
  title: 'Photo',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Image URL',
      type: 'url',
      validation: (rule) =>
        rule
          .required()
          .uri({scheme: ['https']})
          .custom((url) =>
            !url || url.startsWith('https://images.unsplash.com/') ? true : 'Use an images.unsplash.com URL',
          ),
    }),
    defineField({
      name: 'credit',
      title: 'Credit (Unsplash page)',
      type: 'url',
      validation: (rule) =>
        rule
          .required()
          .custom((url) =>
            !url || url.startsWith('https://unsplash.com/') ? true : 'Use the photo’s unsplash.com page URL',
          ),
    }),
    defineField({
      name: 'alt',
      title: 'Alternative Text',
      type: 'string',
      validation: (rule) => rule.required().max(160),
    }),
  ],
  preview: {
    select: {title: 'alt', subtitle: 'credit'},
  },
})
