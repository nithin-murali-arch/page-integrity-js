import { RequestHandler } from '../src/utils/request-handler';
import { CacheManager } from '../src/utils/cache-manager';
import { analyzeScript } from '../src/utils/script-analyzer';
import { createHash } from '../src/utils/hash';

jest.mock('../src/utils/cache-manager');
jest.mock('../src/utils/script-analyzer');
jest.mock('../src/utils/hash');

describe('RequestHandler', () => {
  let requestHandler: RequestHandler;
  let mockCacheManager: jest.Mocked<CacheManager>;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockCacheManager = {
      getCachedResponse: jest.fn(),
      clearCache: jest.fn(),
      cacheResponse: jest.fn(),
    } as unknown as jest.Mocked<CacheManager>;

    mockFetch = jest.fn();
    global.fetch = mockFetch;

    (createHash as jest.Mock).mockReturnValue('mock-hash');
    (analyzeScript as jest.Mock).mockReturnValue({
      isMalicious: false,
      threats: [],
      score: 0,
      details: []
    });

    requestHandler = RequestHandler.createInstance(mockCacheManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleFetch', () => {
    it('should handle JavaScript file with .js extension', async () => {
      const request = new Request('https://example.com/script.js');
      const response = new Response('console.log("hello world");');
      mockFetch.mockResolvedValue(response);

      const result = await requestHandler.handleFetch(request);

      expect(result).toBe(response);
      expect(mockCacheManager.cacheResponse).toHaveBeenCalledWith(
        'mock-hash',
        'https://example.com/script.js',
        expect.any(Object)
      );
      expect(analyzeScript).toHaveBeenCalledWith('console.log("hello world");');
    });

    it('should handle JavaScript file with content-type header', async () => {
      const request = new Request('https://example.com/script');
      const response = new Response('console.log("hello world");', {
        headers: { 'content-type': 'application/javascript' }
      });
      mockFetch.mockResolvedValue(response);

      const result = await requestHandler.handleFetch(request);

      expect(result).toBe(response);
      expect(mockCacheManager.cacheResponse).toHaveBeenCalledWith(
        'mock-hash',
        'https://example.com/script',
        expect.any(Object)
      );
      expect(analyzeScript).toHaveBeenCalledWith('console.log("hello world");');
    });

    it('should handle non-JavaScript file', async () => {
      const request = new Request('https://example.com/data.json');
      const response = new Response('{"key": "value"}', {
        headers: { 'content-type': 'application/json' }
      });
      mockFetch.mockResolvedValue(response);

      const result = await requestHandler.handleFetch(request);

      expect(result).toBe(response);
      expect(mockCacheManager.cacheResponse).toHaveBeenCalledWith(
        'mock-hash',
        'https://example.com/data.json'
      );
      expect(analyzeScript).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      const request = new Request('https://example.com/script.js');
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(requestHandler.handleFetch(request)).rejects.toThrow('Network error');
      expect(mockCacheManager.cacheResponse).not.toHaveBeenCalled();
    });
  });

  describe('handleXhrRequest', () => {
    it('should handle XHR request successfully', async () => {
      const url = 'https://example.com/script.js';
      const method = 'GET';
      const response = new Response('console.log("hello world");');
      mockFetch.mockResolvedValue(response);

      const result = await requestHandler.handleXhrRequest(url, method);

      expect(result).toEqual({
        hash: 'mock-hash',
        analysis: expect.any(Object)
      });
      expect(mockCacheManager.cacheResponse).toHaveBeenCalledWith(
        'mock-hash',
        url,
        expect.any(Object)
      );
      expect(analyzeScript).toHaveBeenCalledWith('console.log("hello world");');
    });

    it('should handle XHR request with body', async () => {
      const url = 'https://example.com/script.js';
      const method = 'POST';
      const body = '{"data": "test"}';
      const response = new Response('console.log("hello world");');
      mockFetch.mockResolvedValue(response);

      const result = await requestHandler.handleXhrRequest(url, method, body);

      expect(result).toEqual({
        hash: 'mock-hash',
        analysis: expect.any(Object)
      });
      expect(mockFetch).toHaveBeenCalledWith(url, { method, body });
    });

    it('should handle XHR request errors', async () => {
      const url = 'https://example.com/script.js';
      const method = 'GET';
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(requestHandler.handleXhrRequest(url, method)).rejects.toThrow('Network error');
      expect(mockCacheManager.cacheResponse).not.toHaveBeenCalled();
    });
  });

  describe('handleScriptRequest', () => {
    it('should handle script request successfully', async () => {
      const url = 'https://example.com/script.js';
      const response = new Response('console.log("hello world");');
      mockFetch.mockResolvedValue(response);

      const result = await requestHandler.handleScriptRequest(url);

      expect(result).toEqual({
        hash: 'mock-hash',
        analysis: expect.any(Object)
      });
      expect(mockCacheManager.cacheResponse).toHaveBeenCalledWith(
        'mock-hash',
        url,
        expect.any(Object)
      );
      expect(analyzeScript).toHaveBeenCalledWith('console.log("hello world");');
    });

    it('should handle script request errors', async () => {
      const url = 'https://example.com/script.js';
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(requestHandler.handleScriptRequest(url)).rejects.toThrow('Network error');
      expect(mockCacheManager.cacheResponse).not.toHaveBeenCalled();
    });
  });
}); 