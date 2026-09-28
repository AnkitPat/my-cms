import { defineType, defineField } from '@/config/types';

export const natureTrailSchema = defineType({
  name: 'natureTrail',
  title: 'Nature Trail',
  icon: '🦌',
  filterByBrand: true,
  fields: [
    defineField({ name: 'title', title: 'Trail Name', type: 'string', required: true }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', required: true }),
    defineField({ name: 'difficulty', title: 'Difficulty', type: 'string' }),
    defineField({ name: 'distanceKm', title: 'Distance (km)', type: 'number' }),
    defineField({ name: 'mapImage', title: 'Trail Map', type: 'image' }),
  ],
});
