import { CacheManager, CacheEntry } from '../src/utils/cache-manager';
import { ScriptAnalysis } from '../src/utils/script-analyzer';

// Mock the global caches API
let cacheData: { [key: string]: any } = {};

const mockCache = {
  delete: jest.fn().mockImplementation(async () => {
    cacheData = {};
    return true;
  }),
  open: jest.fn().mockResolvedValue({
    put: jest.fn().mockImplementation((hash, response) => {
      cacheData[hash] = response;
      return Promise.resolve(undefined);
    }),
    match: jest.fn().mockImplementation((hash) => {
      if (cacheData[hash]) {
        return Promise.resolve(cacheData[hash]);
      }
      return Promise.resolve(null);
    }),
    keys: jest.fn().mockResolvedValue([])
  }),
  has: jest.fn().mockResolvedValue(false),
  keys: jest.fn().mockResolvedValue([]),
  match: jest.fn().mockResolvedValue(null)
};

global.caches = mockCache;

describe('Cache Manager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    // Clear cache before each test
    cacheData = {};
    caches.delete('response-cache');
    cacheManager = new CacheManager();
  });

  afterEach(async () => {
    await cacheManager.clearCache();
  });

  it('should cache and retrieve a response', async () => {
    const hash = 'test-hash';
    const url = 'https://example.com/test.js';
    const analysis: ScriptAnalysis = {
      isMalicious: false,
      threats: [],
      score: 0,
      details: []
    };

    await cacheManager.cacheResponse(hash, url, analysis);
    const result = await cacheManager.getCachedResponse(hash);

    expect(result).toBeDefined();
    expect(result?.url).toBe(url);
    expect(result?.analysis).toEqual(analysis);
  });

  it('should cache response without analysis', async () => {
    const hash = 'test-hash';
    const url = 'https://example.com/test.html';

    await cacheManager.cacheResponse(hash, url);
    const result = await cacheManager.getCachedResponse(hash);

    expect(result).toBeDefined();
    expect(result?.url).toBe(url);
    expect(result?.analysis).toBeUndefined();
  });

  it('should return null for non-existent hash', async () => {
    const result = await cacheManager.getCachedResponse('non-existent-hash');
    expect(result).toBeNull();
  });

  it('should clear cache', async () => {
    const hash = 'test-hash';
    const url = 'https://example.com/test.js';

    await cacheManager.cacheResponse(hash, url);
    await cacheManager.clearCache();

    const result = await cacheManager.getCachedResponse(hash);
    expect(result).toBeNull();
  });
}); 