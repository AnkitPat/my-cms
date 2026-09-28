import { defineType, defineField } from '@/config/types';

export const reviewSchema = defineType({
  name: 'review',
  title: 'Customer Review',
  icon: '⭐',
  fields: [
    defineField({ name: 'title', title: 'Review Title', type: 'string', required: true }),
    defineField({ name: 'score', title: 'Score', type: 'number' }),
    defineField({ name: 'comment', title: 'Comment', type: 'text' }),
  ],
});
