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
export declare class ContentApiError extends Error {
    status: number;
    constructor(message: string, status: number);
}
export declare function createClient(options: CreateClientOptions): {
    get: (params?: GetParams) => Promise<FlattenedDocument | FlattenedDocument[] | null>;
    getBySlug: (type: string, slug: string, params?: Omit<GetParams, "type" | "slug">) => Promise<FlattenedDocument | null>;
    getByTitle: (type: string, title: string, params?: Omit<GetParams, "type" | "title">) => Promise<FlattenedDocument | null>;
    query: (params?: QueryParams) => Promise<FlattenedDocument[]>;
};
export type CmsClient = ReturnType<typeof createClient>;
//# sourceMappingURL=client.d.ts.map