import { type CreateClientOptions, type FlattenedDocument, type GetParams, type QueryParams } from './client.js';
export type UseDocumentArgs = GetParams & {
    client?: CreateClientOptions;
};
export type UseQueryArgs = QueryParams & {
    client?: CreateClientOptions;
};
export declare function useDocument(args: UseDocumentArgs): {
    data: FlattenedDocument | null;
    error: Error | null;
    isLoading: boolean;
};
export declare function useQuery(args: UseQueryArgs): {
    data: FlattenedDocument[];
    error: Error | null;
    isLoading: boolean;
};
//# sourceMappingURL=react.d.ts.map