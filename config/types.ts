export interface Language {
  id: string;
  title: string;
  isDefault?: boolean;
}

export interface GroupConfig {
  name: string;
  title: string;
  icon?: string;
}

export interface FieldDefinition {
  name: string;
  title: string;
  icon?: string;
  type: 'string' | 'text' | 'slug' | 'boolean' | 'number' | 'image' | 'reference' | 'object' | 'array';
  required?: boolean;
  max?: number;
  to?: { type: string }[];
  of?: FieldDefinition[];
  fields?: FieldDefinition[];
  group?: string | string[];
  validation?: (rule: any) => any;
}

export interface ContentTypeConfig {
  name: string;
  title: string;
  icon?: string;
  type?: 'document' | 'object';
  filterByBrand?: boolean;
  groups?: GroupConfig[];
  fields: FieldDefinition[];
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  title: string;
  icon?: string;
  languages: Language[];
  contentTypes: ContentTypeConfig[];
}

/**
 * Helper function to define a content type schema with strict type inference (Sanity style).
 */
export function defineType<T extends ContentTypeConfig>(schemaDefinition: T): T {
  return schemaDefinition;
}

/**
 * Helper function to define a field definition with strict type inference (Sanity style).
 */
export function defineField<T extends FieldDefinition>(fieldDefinition: T): T {
  return fieldDefinition;
}

/**
 * Helper function to define an array member definition with strict type inference (Sanity style).
 */
export function defineArrayMember<T extends FieldDefinition>(memberDefinition: T): T {
  return memberDefinition;
}
