import { WorkspaceConfig } from '../../types';
import { euronatureLanguages } from './languages';
import { campsiteSchema } from './schemas/campsite';
import { homePageSchema } from './schemas/homepage';
import { natureTrailSchema } from './schemas/natureTrail';

export const campingcardWorkspace: WorkspaceConfig = {
  id: 'campingcard',
  name: 'campingcard',
  title: 'Campingcard',
  icon: '🌲',
  languages: euronatureLanguages,
  contentTypes: [ campsiteSchema],
};
