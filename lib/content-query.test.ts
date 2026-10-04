import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMongoFilter,
  flattenDocument,
  isPreviewRequest,
  parseLimitOffset,
  sanitizeWhere,
  wantsSingleDocument,
  type StoredDocument,
} from './content-query';

describe('flattenDocument', () => {
  const doc: StoredDocument = {
    _id: 'doc-1',
    _type: 'campsite',
    workspace: 'eurocampings',
    language: 'en',
    brands: ['eurocampings'],
    draft: { title: 'Draft Title', slug: 'draft-slug' },
    published: { title: 'Alpine Valley Camping', slug: 'alpine-valley-camping', featured: true },
  };

  it('uses published fields without preview', () => {
    const flat = flattenDocument(doc, false);
    assert.equal(flat?.slug, 'alpine-valley-camping');
    assert.equal(flat?.title, 'Alpine Valley Camping');
    assert.equal(flat?._type, 'campsite');
  });

  it('uses draft fields in preview', () => {
    const flat = flattenDocument(doc, true);
    assert.equal(flat?.slug, 'draft-slug');
    assert.equal(flat?.title, 'Draft Title');
  });

  it('returns null when unpublished and not preview', () => {
    const unpublished: StoredDocument = { ...doc, published: null };
    assert.equal(flattenDocument(unpublished, false), null);
  });

  it('falls back to published in preview when draft is empty', () => {
    const noDraft: StoredDocument = { ...doc, draft: {} };
    assert.equal(flattenDocument(noDraft, true)?.slug, 'alpine-valley-camping');
  });
});

describe('buildMongoFilter', () => {
  it('queries published.slug when not in preview', () => {
    const filter = buildMongoFilter({ type: 'post', slug: 'hello' }, false) as {
      $and: Record<string, unknown>[];
    };
    assert.ok(filter.$and.some((clause) => clause['published.slug'] === 'hello'));
    assert.ok(filter.$and.some((clause) => clause._type === 'post'));
  });

  it('queries draft.slug in preview', () => {
    const filter = buildMongoFilter({ slug: 'hello' }, true) as {
      $and: Record<string, unknown>[];
    };
    assert.ok(filter.$and.some((clause) => clause['draft.slug'] === 'hello'));
  });
});

describe('sanitizeWhere', () => {
  it('drops operator keys', () => {
    const safe = sanitizeWhere({ featured: true, $gt: 1, 'a.b': 2 });
    assert.deepEqual(safe, { featured: true });
  });
});

describe('parseLimitOffset', () => {
  it('clamps limit', () => {
    assert.equal(parseLimitOffset(1000, -3).limit, 100);
    assert.equal(parseLimitOffset(1000, -3).offset, 0);
  });
});

describe('wantsSingleDocument', () => {
  it('is true for slug or title', () => {
    assert.equal(wantsSingleDocument({ slug: 'x' }), true);
    assert.equal(wantsSingleDocument({ title: 'x' }), true);
    assert.equal(wantsSingleDocument({ type: 'post' }), false);
  });
});

describe('isPreviewRequest', () => {
  it('accepts bearer and x-preview-token when env is set', () => {
    const previous = process.env.CONTENT_PREVIEW_TOKEN;
    process.env.CONTENT_PREVIEW_TOKEN = 'secret';
    try {
      assert.equal(
        isPreviewRequest(new Headers({ authorization: 'Bearer secret' })),
        true
      );
      assert.equal(
        isPreviewRequest(new Headers({ 'x-preview-token': 'secret' })),
        true
      );
      assert.equal(isPreviewRequest(new Headers({ authorization: 'Bearer nope' })), false);
    } finally {
      if (previous === undefined) delete process.env.CONTENT_PREVIEW_TOKEN;
      else process.env.CONTENT_PREVIEW_TOKEN = previous;
    }
  });
});
