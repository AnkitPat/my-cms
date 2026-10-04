import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import {
  buildMongoFilter,
  ensureContentIndexes,
  flattenDocument,
  isPreviewRequest,
  parseLimitOffset,
  type ContentQueryParams,
  type StoredDocument,
} from '@/lib/content-query';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContentQueryParams;
    const preview = isPreviewRequest(request.headers);
    const { limit, offset } = parseLimitOffset(body.limit, body.offset);

    const client = await clientPromise;
    const collection = client.db('my_cms').collection('documents');
    await ensureContentIndexes(collection);

    const filter = buildMongoFilter(body, preview);
    const docs = (await collection.find(filter).skip(offset).limit(limit).toArray()) as StoredDocument[];
    const documents = docs
      .map((doc) => flattenDocument(doc, preview))
      .filter((doc): doc is NonNullable<typeof doc> => doc !== null);

    return NextResponse.json({ success: true, documents, preview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to query content';
    console.error('Failed to query content:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
