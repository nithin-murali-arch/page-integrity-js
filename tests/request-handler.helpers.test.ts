import {
  fetchAndClone,
  shouldAnalyzeScript,
  analyzeAndCacheScript,
  cacheNonScript
} from '../src/utils/request-handler';
import { CacheManager } from '../src/utils/cache-manager';
import { analyzeScript } from '../src/utils/script-analyzer';

jest.mock('../src/utils/cache-manager');
jest.mock('../src/utils/script-analyzer');

describe('request-handler helpers', () => {
  describe('fetchAndClone', () => {
    it('fetches and clones a response, returning both response and text', async () => {
      const request = new Request('https://example.com/test.js');
      const response = new Response('console.log("test");');
      global.fetch = jest.fn().mockResolvedValue(response);
      const result = await fetchAndClone(request);
      expect(result.response).toBe(response);
      expect(result.text).toBe('console.log("test");');
    });
  });

  describe('shouldAnalyzeScript', () => {
    it('returns true for .js URL', () => {
      const request = new Request('https://example.com/test.js');
      const response = new Response('', { headers: { 'content-type': 'text/plain' } });
      expect(shouldAnalyzeScript(request, response)).toBe(true);
    });
    it('returns true for javascript content-type', () => {
      const request = new Request('https://example.com/test.txt');
      const response = new Response('', { headers: { 'content-type': 'application/javascript' } });
      expect(shouldAnalyzeScript(request, response)).toBe(true);
    });
    it('returns false for non-js URL and non-js content-type', () => {
      const request = new Request('https://example.com/test.txt');
      const response = new Response('', { headers: { 'content-type': 'text/plain' } });
      expect(shouldAnalyzeScript(request, response)).toBe(false);
    });
  });

  describe('analyzeAndCacheScript', () => {
    it('analyzes script and caches the result', async () => {
      const text = 'console.log("test");';
      const url = 'https://example.com/test.js';
      const mockCacheManager = {
        cacheResponse: jest.fn()
      } as unknown as CacheManager;
      (analyzeScript as jest.Mock).mockReturnValue({ isMalicious: false });
      const result = await analyzeAndCacheScript(text, url, mockCacheManager);
      expect(analyzeScript).toHaveBeenCalledWith(text);
      expect(mockCacheManager.cacheResponse).toHaveBeenCalled();
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('analysis');
    });
  });

  describe('cacheNonScript', () => {
    it('caches non-script content', async () => {
      const text = '{"key": "value"}';
      const url = 'https://example.com/data.json';
      const mockCacheManager = {
        cacheResponse: jest.fn()
      } as unknown as CacheManager;
      const result = await cacheNonScript(text, url, mockCacheManager);
      expect(mockCacheManager.cacheResponse).toHaveBeenCalled();
      expect(result).toHaveProperty('hash');
    });
  });
}); 