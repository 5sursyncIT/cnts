
import { describe, it, expect, vi } from 'vitest';
import { createApiClient } from '@cnts/api';

describe('CMS Client Integration', () => {
  it('fetches homepage articles with correct parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: () => Promise.resolve([]),
    });

    const client = createApiClient({
      baseUrl: 'http://test-api',
      fetchImpl: fetchMock as any,
    });

    await client.articles.list({ published_only: true, limit: 3 });

    // Verify the URL contains the expected query parameters
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/articles');
    expect(url).toContain('published_only=true');
    expect(url).toContain('limit=3');
  });

  it('fetches press releases (COMMUNIQUE) with correct parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: () => Promise.resolve([]),
    });

    const client = createApiClient({
      baseUrl: 'http://test-api',
      fetchImpl: fetchMock as any,
    });

    await client.articles.list({ category: 'COMMUNIQUE', published_only: true });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('category=COMMUNIQUE');
    expect(url).toContain('published_only=true');
  });

  it('fetches resources (RESSOURCE) with correct parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: () => Promise.resolve([]),
    });

    const client = createApiClient({
      baseUrl: 'http://test-api',
      fetchImpl: fetchMock as any,
    });

    await client.articles.list({ category: 'RESSOURCE', published_only: true });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('category=RESSOURCE');
    expect(url).toContain('published_only=true');
  });
});
