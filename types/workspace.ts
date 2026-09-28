export interface Language {
  id: string;
  title: string;
  isDefault?: boolean;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  title: string;
  languages: Language[];
}
