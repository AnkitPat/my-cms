import { defineType, defineField } from '@/config/types';

export const campsiteSchema = defineType({
  name: 'campsite',
  title: 'Campsite',
  icon: '🏕️',
  filterByBrand: true,
  groups: [
    { name: 'content', title: 'Content & Details', icon: '📝' },
    { name: 'settings', title: 'Publishing & Settings', icon: '⚙️' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Campsite Name', type: 'string', required: true, max: 100, group: 'content' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', required: true, group: 'content' }),
    defineField({ name: 'description', title: 'Description', type: 'text', group: 'content' }),
    defineField({ name: 'rating', title: 'Rating (1-5)', type: 'number', group: 'settings' }),
    defineField({ name: 'featured', title: 'Featured Campsite', type: 'boolean', group: 'settings' }),
    defineField({ name: 'image', title: 'Main Photo', type: 'image', group: 'settings' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }], group: 'settings' }),
  ],
});
