import { defineType, defineField } from '@/config/types';

export const authorSchema = defineType({
  name: 'author',
  title: 'Author',
  icon: '✍️',
  fields: [
    defineField({ name: 'name', title: 'Full Name', type: 'string', required: true }),
    defineField({ name: 'email', title: 'Email Address', type: 'string' }),
    defineField({ name: 'avatar', title: 'Avatar Image', type: 'image' }),
  ],
});
