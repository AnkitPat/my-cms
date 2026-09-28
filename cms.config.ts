import { WorkspaceConfig, Language, ContentTypeConfig, FieldDefinition } from './config/types';
import { eurocampingsWorkspace } from './config/workspaces/eurocampings';
import { suncampWorkspace } from './config/workspaces/suncamp';
import { euronatureWorkspace } from './config/workspaces/euronature';
import { campingcardWorkspace } from './config/workspaces/campingcard';

export type { Language, ContentTypeConfig, FieldDefinition, WorkspaceConfig };

export interface CmsConfig {
  workspaces: WorkspaceConfig[];
}

export const cmsConfig: CmsConfig = {
  workspaces: [
    eurocampingsWorkspace,
    suncampWorkspace,
    euronatureWorkspace,
    campingcardWorkspace
  ],
};
