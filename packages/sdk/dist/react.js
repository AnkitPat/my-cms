'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient, } from './client.js';
function resolveClientOptions(override) {
    if (override)
        return override;
    const baseUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CMS_URL) ||
        (typeof window !== 'undefined' ? window.location.origin : '');
    if (!baseUrl) {
        throw new Error('createClient options.baseUrl or NEXT_PUBLIC_CMS_URL is required');
    }
    return { baseUrl };
}
export function useDocument(args) {
    const { client: clientOptions, ...params } = args;
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const key = useMemo(() => JSON.stringify(params), [params]);
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        const cms = createClient(resolveClientOptions(clientOptions));
        const run = params.slug
            ? cms.getBySlug(params.type ?? '', params.slug, params)
            : params.title
                ? cms.getByTitle(params.type ?? '', params.title, params)
                : cms.get(params).then((result) => (Array.isArray(result) ? result[0] ?? null : result));
        run
            .then((doc) => {
            if (!cancelled)
                setData(doc);
        })
            .catch((err) => {
            if (!cancelled)
                setError(err);
        })
            .finally(() => {
            if (!cancelled)
                setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures params
    }, [key, clientOptions]);
    return { data, error, isLoading };
}
export function useQuery(args) {
    const { client: clientOptions, ...params } = args;
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const key = useMemo(() => JSON.stringify(params), [params]);
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        const cms = createClient(resolveClientOptions(clientOptions));
        cms
            .query(params)
            .then((docs) => {
            if (!cancelled)
                setData(docs);
        })
            .catch((err) => {
            if (!cancelled)
                setError(err);
        })
            .finally(() => {
            if (!cancelled)
                setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures params
    }, [key, clientOptions]);
    return { data, error, isLoading };
}
//# sourceMappingURL=react.js.map