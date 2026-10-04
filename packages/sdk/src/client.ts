export type GetParams = {
  type?: string;
  slug?: string;
  title?: string;
  language?: string;
  workspace?: string;
  id?: string;
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
};

export type QueryParams = GetParams;

export type FlattenedDocument = {
  _id: string;
  _type: string;
  workspace?: string;
  language?: string;
  brands?: string[];
  [key: string]: unknown;
};

export type CreateClientOptions = {
  baseUrl: string;
  workspace?: string;
  token?: string;
  fetch?: typeof fetch;
};

export class ContentApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ContentApiError';
    this.status = status;
  }
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['x-preview-token'] = token;
  }
  return headers;
}

function buildSearchParams(params: GetParams): URLSearchParams {
  const q = new URLSearchParams();
  if (params.workspace) q.set('workspace', params.workspace);
  if (params.type) q.set('type', params.type);
  if (params.slug) q.set('slug', params.slug);
  if (params.title) q.set('title', params.title);
  if (params.language) q.set('language', params.language);
  if (params.id) q.set('id', params.id);
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  if (params.where) q.set('where', JSON.stringify(params.where));
  return q;
}

export function createClient(options: CreateClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const doFetch = options.fetch ?? fetch;

  async function requestJson(url: string, init?: RequestInit) {
    const res = await doFetch(url, {
      ...init,
      headers: { ...authHeaders(options.token), ...init?.headers },
    });
    const data = (await res.json()) as {
      success?: boolean;
      error?: string;
      document?: FlattenedDocument;
      documents?: FlattenedDocument[];
    };
    if (!res.ok || data.success === false) {
      throw new ContentApiError(data.error || `Request failed (${res.status})`, res.status);
    }
    return data;
  }

  function withWorkspace(params: GetParams = {}): GetParams {
    return {
      ...params,
      workspace: params.workspace ?? options.workspace,
    };
  }

  async function get(params: GetParams = {}): Promise<FlattenedDocument | FlattenedDocument[] | null> {
    const merged = withWorkspace(params);
    const query = buildSearchParams(merged);
    const data = await requestJson(`${baseUrl}/api/content?${query.toString()}`);
    if (data.document) return data.document;
    return data.documents ?? [];
  }

  async function getBySlug(
    type: string,
    slug: string,
    params: Omit<GetParams, 'type' | 'slug'> = {}
  ): Promise<FlattenedDocument | null> {
    try {
      const result = await get({ ...params, type, slug });
      return Array.isArray(result) ? result[0] ?? null : result;
    } catch (error) {
      if (error instanceof ContentApiError && error.status === 404) return null;
      throw error;
    }
  }

  async function getByTitle(
    type: string,
    title: string,
    params: Omit<GetParams, 'type' | 'title'> = {}
  ): Promise<FlattenedDocument | null> {
    try {
      const result = await get({ ...params, type, title });
      return Array.isArray(result) ? result[0] ?? null : result;
    } catch (error) {
      if (error instanceof ContentApiError && error.status === 404) return null;
      throw error;
    }
  }

  async function query(params: QueryParams = {}): Promise<FlattenedDocument[]> {
    const merged = withWorkspace(params);
    const data = await requestJson(`${baseUrl}/api/content/query`, {
      method: 'POST',
      body: JSON.stringify(merged),
    });
    return data.documents ?? [];
  }

  return { get, getBySlug, getByTitle, query };
}

export type CmsClient = ReturnType<typeof createClient>;
