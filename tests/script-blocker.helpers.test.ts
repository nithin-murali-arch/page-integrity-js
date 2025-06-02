import { checkCachedResponse, analyzeAndBlockScript } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { ScriptBlocker } from '../src/utils/script-blocker';
import { PageIntegrityConfig } from '../src/types';

describe('Script Blocker Helpers', () => {
  let mockCacheManager: CacheManager;
  let mockConfig: PageIntegrityConfig;

  beforeEach(() => {
    mockCacheManager = {
      getCachedResponse: jest.fn(),
      setCachedResponse: jest.fn(),
      clearCache: jest.fn()
    } as unknown as CacheManager;

    mockConfig = {
      analysisConfig: {
        minScore: 3,
        maxThreats: 2,
        checkSuspiciousStrings: true
      }
    } as PageIntegrityConfig;
  });

  describe('checkCachedResponse', () => {
    it('should return blocked if script is cached and blocked', async () => {
      const url = 'https://example.com/script.js';
      const content = 'console.log("test")';
      const hash = 'test-hash';
      (mockCacheManager.getCachedResponse as jest.Mock).mockResolvedValue({
        blocked: true,
        reason: 'test',
        analysis: { score: 5 }
      });

      const result = await checkCachedResponse(mockCacheManager, url, content);
      expect(result.blocked).toBe(true);
      expect(result.reason).toBe('test');
      expect(result.analysis).toBeDefined();
    });

    it('should return not blocked if script is cached but not blocked', async () => {
      const url = 'https://example.com/script.js';
      const content = 'console.log("test")';
      const hash = 'test-hash';
      (mockCacheManager.getCachedResponse as jest.Mock).mockResolvedValue({
        blocked: false,
        analysis: { score: 1 }
      });

      const result = await checkCachedResponse(mockCacheManager, url, content);
      expect(result.blocked).toBe(false);
      expect(result.analysis).toBeDefined();
    });

    it('should return not blocked if script is not cached', async () => {
      const url = 'https://example.com/script.js';
      const content = 'console.log("test")';
      const hash = 'test-hash';
      (mockCacheManager.getCachedResponse as jest.Mock).mockResolvedValue(null);

      const result = await checkCachedResponse(mockCacheManager, url, content);
      expect(result.blocked).toBe(false);
    });
  });

  describe('analyzeAndBlockScript', () => {
    it('should analyze and block script if malicious', async () => {
      const url = 'https://example.com/script.js';
      const content = 'eval("malicious code")';
      const scriptBlocker = new ScriptBlocker(mockCacheManager, mockConfig);

      const result = await analyzeAndBlockScript(scriptBlocker, url, content);
      expect(result.blocked).toBe(true);
      expect(result.analysis).toBeDefined();
    });

    it('should analyze and not block script if not malicious', async () => {
      const url = 'https://example.com/script.js';
      const content = 'console.log("safe code")';
      const scriptBlocker = new ScriptBlocker(mockCacheManager, mockConfig);

      const result = await analyzeAndBlockScript(scriptBlocker, url, content);
      expect(result.blocked).toBe(false);
      expect(result.analysis).toBeDefined();
    });
  });
}); 