import type { Collection } from 'mongodb';

export type ContentQueryParams = {
  workspace?: string;
  type?: string;
  slug?: string;
  title?: string;
  language?: string;
  id?: string;
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
};

export type StoredDocument = {
  _id: string;
  _type: string;
  workspace?: string;
  language?: string;
  brands?: string[];
  draft?: Record<string, unknown> | null;
  published?: Record<string, unknown> | null;
  _createdAt?: string;
  _updatedAt?: string;
};

export type FlattenedDocument = {
  _id: string;
  _type: string;
  workspace?: string;
  language?: string;
  brands?: string[];
  [key: string]: unknown;
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export function isPreviewRequest(headers: Headers): boolean {
  const envToken = process.env.CONTENT_PREVIEW_TOKEN;
  if (!envToken) return false;

  const auth = headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerToken = headers.get('x-preview-token')?.trim() ?? '';
  const token = bearer || headerToken;
  return token === envToken;
}

export function flattenDocument(
  doc: StoredDocument,
  preview: boolean
): FlattenedDocument | null {
  const source = preview
    ? (hasPayload(doc.draft) ? doc.draft : doc.published)
    : doc.published;

  if (!hasPayload(source)) return null;

  const { brands: sourceBrands, ...fields } = source;

  return {
    ...fields,
    _id: String(doc._id),
    _type: doc._type,
    workspace: doc.workspace ?? (fields.workspace as string | undefined),
    language: doc.language ?? (fields.language as string | undefined),
    brands: doc.brands ?? (sourceBrands as string[] | undefined),
  };
}

function hasPayload(value: Record<string, unknown> | null | undefined): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0;
}

function fieldPrefix(preview: boolean): 'draft' | 'published' {
  return preview ? 'draft' : 'published';
}

export function sanitizeWhere(where: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!where) return {};
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(where)) {
    if (!key || key.startsWith('$') || key.includes('.')) continue;
    safe[key] = value;
  }
  return safe;
}

export function parseLimitOffset(limit?: number, offset?: number): { limit: number; offset: number } {
  const parsedLimit = Number.isFinite(limit) ? Math.floor(limit as number) : DEFAULT_LIMIT;
  const parsedOffset = Number.isFinite(offset) ? Math.floor(offset as number) : 0;
  return {
    limit: Math.min(MAX_LIMIT, Math.max(1, parsedLimit)),
    offset: Math.max(0, parsedOffset),
  };
}

export function buildMongoFilter(
  params: ContentQueryParams,
  preview: boolean
): Record<string, unknown> {
  const and: Record<string, unknown>[] = [];
  const prefix = fieldPrefix(preview);

  if (params.id) {
    and.push({ _id: params.id });
  }
  if (params.type) {
    and.push({ _type: params.type });
  }
  if (params.workspace) {
    and.push({
      $or: [{ workspace: params.workspace }, { brands: params.workspace }],
    });
  }
  if (params.language) {
    and.push({
      $or: [
        { language: params.language },
        { [`${prefix}.language`]: params.language },
      ],
    });
  }
  if (params.slug) {
    and.push({ [`${prefix}.slug`]: params.slug });
  }
  if (params.title) {
    and.push({ [`${prefix}.title`]: params.title });
  }

  const where = sanitizeWhere(params.where);
  for (const [key, value] of Object.entries(where)) {
    and.push({ [`${prefix}.${key}`]: value });
  }

  if (!preview) {
    and.push({ published: { $type: 'object' } });
    and.push({ [`published.0`]: { $exists: false } });
  }

  if (and.length === 0) {
    return preview ? {} : { published: { $type: 'object' } };
  }
  return { $and: and };
}

export async function ensureContentIndexes(collection: Collection): Promise<void> {
  await collection.createIndexes([
    { key: { 'published.slug': 1 } },
    { key: { 'published.title': 1 } },
    { key: { _type: 1 } },
    { key: { workspace: 1 } },
    { key: { language: 1 } },
  ]);
}

export function parseQueryParams(searchParams: URLSearchParams): ContentQueryParams {
  const whereRaw = searchParams.get('where');
  let where: Record<string, unknown> | undefined;
  if (whereRaw) {
    try {
      const parsed = JSON.parse(whereRaw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        where = parsed as Record<string, unknown>;
      }
    } catch {
      where = undefined;
    }
  }

  const limitRaw = searchParams.get('limit');
  const offsetRaw = searchParams.get('offset');

  return {
    workspace: searchParams.get('workspace') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    slug: searchParams.get('slug') ?? undefined,
    title: searchParams.get('title') ?? undefined,
    language: searchParams.get('language') ?? undefined,
    id: searchParams.get('id') ?? undefined,
    where,
    limit: limitRaw ? Number(limitRaw) : undefined,
    offset: offsetRaw ? Number(offsetRaw) : undefined,
  };
}

export function wantsSingleDocument(params: ContentQueryParams): boolean {
  return Boolean(params.id || params.slug || params.title);
}
