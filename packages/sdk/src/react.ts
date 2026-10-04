'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createClient,
  type CreateClientOptions,
  type FlattenedDocument,
  type GetParams,
  type QueryParams,
} from './client.js';

export type UseDocumentArgs = GetParams & {
  client?: CreateClientOptions;
};

export type UseQueryArgs = QueryParams & {
  client?: CreateClientOptions;
};

function resolveClientOptions(override?: CreateClientOptions): CreateClientOptions {
  if (override) return override;
  const baseUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CMS_URL) ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  if (!baseUrl) {
    throw new Error('createClient options.baseUrl or NEXT_PUBLIC_CMS_URL is required');
  }
  return { baseUrl };
}

export function useDocument(args: UseDocumentArgs) {
  const { client: clientOptions, ...params } = args;
  const [data, setData] = useState<FlattenedDocument | null>(null);
  const [error, setError] = useState<Error | null>(null);
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
        if (!cancelled) setData(doc);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures params
  }, [key, clientOptions]);

  return { data, error, isLoading };
}

export function useQuery(args: UseQueryArgs) {
  const { client: clientOptions, ...params } = args;
  const [data, setData] = useState<FlattenedDocument[]>([]);
  const [error, setError] = useState<Error | null>(null);
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
        if (!cancelled) setData(docs);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures params
  }, [key, clientOptions]);

  return { data, error, isLoading };
}
