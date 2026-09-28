import { WorkspaceConfig } from '../../types';
import { suncampLanguages } from './languages';
import { bungalowSchema } from './schemas/bungalow';
import { reviewSchema } from './schemas/review';

export const suncampWorkspace: WorkspaceConfig = {
  id: 'suncamp',
  name: 'suncamp',
  title: 'Suncamp',
  icon: '☀️',
  languages: suncampLanguages,
  contentTypes: [bungalowSchema, reviewSchema],
};
