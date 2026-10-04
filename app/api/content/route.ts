import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import {
  buildMongoFilter,
  ensureContentIndexes,
  flattenDocument,
  isPreviewRequest,
  parseLimitOffset,
  parseQueryParams,
  wantsSingleDocument,
  type StoredDocument,
} from '@/lib/content-query';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);
    const preview = isPreviewRequest(request.headers);
    const { limit, offset } = parseLimitOffset(params.limit, params.offset);

    const client = await clientPromise;
    const collection = client.db('my_cms').collection('documents');
    await ensureContentIndexes(collection);

    const filter = buildMongoFilter(params, preview);
    const docs = (await collection
      .find(filter)
      .skip(offset)
      .limit(wantsSingleDocument(params) ? 1 : limit)
      .toArray()) as StoredDocument[];

    const flattened = docs
      .map((doc) => flattenDocument(doc, preview))
      .filter((doc): doc is NonNullable<typeof doc> => doc !== null);

    if (wantsSingleDocument(params)) {
      if (flattened.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, document: flattened[0], preview });
    }

    return NextResponse.json({
      success: true,
      documents: flattened,
      preview,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch content';
    console.error('Failed to fetch content:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
