export * from './workspace';
export * from './schema';

import { WorkspaceConfig } from './workspace';
import { DocumentSchema } from './schema';

export interface CmsConfig {
  workspaces: WorkspaceConfig[];
  schemas?: DocumentSchema[];
}
