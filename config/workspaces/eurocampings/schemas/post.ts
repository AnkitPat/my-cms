import { defineType, defineField } from '@/config/types';

export const postSchema = defineType({
  name: 'post',
  title: 'Camping Blog Post',
  icon: '📰',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', required: true,  }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', required: true }),
    defineField({ name: 'body', title: 'Body Content', type: 'text' }),
    defineField({ name: 'mainImage', title: 'Main Image', type: 'image' }),
  ],
});
