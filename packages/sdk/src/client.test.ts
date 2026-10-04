import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ContentApiError, createClient } from './client.ts';

function mockFetch(handler: (url: string, init?: RequestInit) => { status: number; body: unknown }) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const { status, body } = handler(url, init);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

describe('createClient', () => {
  it('getBySlug requests /api/content with type and slug', async () => {
    const cms = createClient({
      baseUrl: 'https://cms.example.com',
      workspace: 'eurocampings',
      fetch: mockFetch((url) => {
        const parsed = new URL(url);
        assert.equal(parsed.pathname, '/api/content');
        assert.equal(parsed.searchParams.get('type'), 'post');
        assert.equal(parsed.searchParams.get('slug'), 'alpine-valley-camping');
        assert.equal(parsed.searchParams.get('workspace'), 'eurocampings');
        return {
          status: 200,
          body: {
            success: true,
            document: { _id: '1', _type: 'post', slug: 'alpine-valley-camping' },
          },
        };
      }) as typeof fetch,
    });

    const doc = await cms.getBySlug('post', 'alpine-valley-camping');
    assert.equal(doc?.slug, 'alpine-valley-camping');
  });

  it('getByTitle returns null on 404', async () => {
    const cms = createClient({
      baseUrl: 'https://cms.example.com',
      fetch: mockFetch(() => ({
        status: 404,
        body: { success: false, error: 'Document not found' },
      })) as typeof fetch,
    });

    const doc = await cms.getByTitle('campsite', 'Missing');
    assert.equal(doc, null);
  });

  it('query posts to /api/content/query with preview token', async () => {
    const cms = createClient({
      baseUrl: 'https://cms.example.com',
      token: 'preview-secret',
      fetch: mockFetch((url, init) => {
        assert.equal(new URL(url).pathname, '/api/content/query');
        assert.equal(init?.method, 'POST');
        const headers = new Headers(init?.headers);
        assert.equal(headers.get('authorization'), 'Bearer preview-secret');
        const body = JSON.parse(String(init?.body));
        assert.equal(body.type, 'campsite');
        assert.equal(body.where.featured, true);
        return {
          status: 200,
          body: { success: true, documents: [{ _id: '1', _type: 'campsite', featured: true }] },
        };
      }) as typeof fetch,
    });

    const docs = await cms.query({ type: 'campsite', where: { featured: true } });
    assert.equal(docs.length, 1);
  });

  it('throws ContentApiError on server failure', async () => {
    const cms = createClient({
      baseUrl: 'https://cms.example.com',
      fetch: mockFetch(() => ({
        status: 500,
        body: { success: false, error: 'boom' },
      })) as typeof fetch,
    });

    await assert.rejects(() => cms.get({ type: 'post' }), (err: unknown) => {
      assert.ok(err instanceof ContentApiError);
      assert.equal(err.status, 500);
      return true;
    });
  });
});
