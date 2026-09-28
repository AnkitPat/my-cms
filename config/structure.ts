import { WorkspaceConfig, ContentTypeConfig, Language } from './types';

export interface StructureItem {
  id: string;
  title: string;
  icon?: string;
  type: 'folder' | 'documentTypeList';
  schemaType?: string;
  languageId?: string;
  items?: StructureItem[];
}

export function createWorkspaceStructure(workspace: WorkspaceConfig): StructureItem {
  const languages = workspace.languages || [];

  if (languages.length <= 1) {
    return {
      id: workspace.id,
      title: workspace.title,
      type: 'folder',
      items: workspace.contentTypes.map((ct: ContentTypeConfig) => ({
        id: ct.name,
        title: ct.title,
        icon: ct.icon,
        type: 'documentTypeList',
        schemaType: ct.name,
      })),
    };
  }

  // Group content types under language folders when multiple languages exist
  return {
    id: workspace.id,
    title: workspace.title,
    type: 'folder',
    items: languages.map((lang: Language) => ({
      id: lang.id,
      title: lang.title,
      icon: '📁',
      type: 'folder',
      items: workspace.contentTypes.map((ct: ContentTypeConfig) => ({
        id: `${lang.id}-${ct.name}`,
        title: ct.title,
        icon: ct.icon,
        type: 'documentTypeList',
        schemaType: ct.name,
        languageId: lang.id,
      })),
    })),
  };
}
