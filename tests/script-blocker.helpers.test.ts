import { checkCachedResponse, analyzeAndBlockScript } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { analyzeScript } from '../src/utils/script-analyzer';

jest.mock('../src/utils/cache-manager');
jest.mock('../src/utils/script-analyzer');

describe('script-blocker helpers', () => {
  describe('checkCachedResponse', () => {
    it('returns blocked result if cached analysis is malicious', async () => {
      const hash = 'test-hash';
      const mockCacheManager = {
        getCachedResponse: jest.fn().mockResolvedValue({
          url: 'https://example.com/cached.js',
          analysis: { isMalicious: true }
        })
      } as unknown as CacheManager;
      const result = await checkCachedResponse(hash, mockCacheManager);
      expect(result).toEqual({
        blocked: true,
        reason: 'Malicious script detected',
        analysis: { isMalicious: true }
      });
    });

    it('returns non-blocked result if cached analysis is not malicious', async () => {
      const hash = 'test-hash';
      const mockCacheManager = {
        getCachedResponse: jest.fn().mockResolvedValue({
          url: 'https://example.com/cached.js',
          analysis: { isMalicious: false }
        })
      } as unknown as CacheManager;
      const result = await checkCachedResponse(hash, mockCacheManager);
      expect(result).toEqual({
        blocked: false,
        analysis: { isMalicious: false }
      });
    });

    it('returns null if no cached response is found', async () => {
      const hash = 'test-hash';
      const mockCacheManager = {
        getCachedResponse: jest.fn().mockResolvedValue(null)
      } as unknown as CacheManager;
      const result = await checkCachedResponse(hash, mockCacheManager);
      expect(result).toBeNull();
    });
  });

  describe('analyzeAndBlockScript', () => {
    it('blocks script if analysis is malicious', async () => {
      const content = 'eval("alert(1)");';
      const url = 'https://example.com/malicious.js';
      const mockCacheManager = {} as unknown as CacheManager;
      const blockedScripts = new Map();
      (analyzeScript as jest.Mock).mockReturnValue({
        isMalicious: true,
        threats: ['covertExecution'],
        score: 3,
        details: [{ pattern: 'eval', matches: ['eval("alert(1)")'] }]
      });
      const result = await analyzeAndBlockScript(content, url, mockCacheManager, blockedScripts);
      expect(result).toEqual({
        blocked: true,
        reason: 'Malicious script detected',
        analysis: {
          isMalicious: true,
          threats: ['covertExecution'],
          score: 3,
          details: [{ pattern: 'eval', matches: ['eval("alert(1)")'] }]
        }
      });
      expect(blockedScripts.get(url)).toBeDefined();
    });

    it('does not block script if analysis is not malicious', async () => {
      const content = 'console.log("hello world");';
      const url = 'https://example.com/safe.js';
      const mockCacheManager = {} as unknown as CacheManager;
      const blockedScripts = new Map();
      (analyzeScript as jest.Mock).mockReturnValue({
        isMalicious: false,
        threats: [],
        score: 0,
        details: []
      });
      const result = await analyzeAndBlockScript(content, url, mockCacheManager, blockedScripts);
      expect(result).toEqual({
        blocked: false,
        analysis: {
          isMalicious: false,
          threats: [],
          score: 0,
          details: []
        }
      });
      expect(blockedScripts.get(url)).toBeUndefined();
    });
  });
}); 