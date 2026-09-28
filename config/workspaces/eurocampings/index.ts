import { WorkspaceConfig } from '../../types';
import { eurocampingsLanguages } from './languages';
import { campsiteSchema } from './schemas/campsite';
import { authorSchema } from './schemas/author';
import { postSchema } from './schemas/post';

export const eurocampingsWorkspace: WorkspaceConfig = {
  id: 'eurocampings',
  name: 'eurocampings',
  title: 'Eurocampings',
  icon: '⛺',
  languages: eurocampingsLanguages,
  contentTypes: [campsiteSchema, authorSchema, postSchema],
};
