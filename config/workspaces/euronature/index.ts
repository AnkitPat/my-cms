import { WorkspaceConfig } from '../../types';
import { euronatureLanguages } from './languages';
import { campsiteSchema } from './schemas/campsite';
import { homePageSchema } from './schemas/homepage';
import { natureTrailSchema } from './schemas/natureTrail';

export const euronatureWorkspace: WorkspaceConfig = {
  id: 'euronature',
  name: 'euronature',
  title: 'Euronature',
  icon: '🌲',
  languages: euronatureLanguages,
  contentTypes: [homePageSchema, natureTrailSchema, campsiteSchema],
};
