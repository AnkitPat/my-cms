import { defineType, defineField } from '@/config/types';

export const homePageSchema = defineType({
  name: 'homePage',
  title: 'Home Page',
  icon: 'H',
  fields: [
    defineField({ name: 'title', title: 'Home Name', type: 'string', required: true }),
    
  ],
});
