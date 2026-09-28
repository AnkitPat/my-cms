export type FieldType =
  | 'string'
  | 'text'
  | 'slug'
  | 'boolean'
  | 'number'
  | 'image'
  | 'reference'
  | 'object'
  | 'array';

export interface FieldValidation {
  required?: boolean;
  max?: number;
  min?: number;
}

export interface FieldDefinition {
  name: string;
  title: string;
  type: FieldType;
  validation?: FieldValidation;
  to?: { type: string }[];
  of?: FieldDefinition[];
  fields?: FieldDefinition[];
}

export interface DocumentSchema {
  name: string;
  title: string;
  type: 'document';
  fields: FieldDefinition[];
}
