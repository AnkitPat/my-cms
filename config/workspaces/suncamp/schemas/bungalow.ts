import { defineType, defineField } from '@/config/types';

export const bungalowSchema = defineType({
  name: 'bungalow',
  title: 'Bungalow / Accommodation',
  icon: '🏡',
  filterByBrand: true,
  fields: [
    defineField({ name: 'title', title: 'Accommodation Name', type: 'string', required: true }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', required: true }),
    defineField({ name: 'pricePerNight', title: 'Price per Night (€)', type: 'number', required: true }),
    defineField({ name: 'capacity', title: 'Max Guests', type: 'number' }),
    defineField({ name: 'image', title: 'Photos', type: 'image' }),
  ],
});
