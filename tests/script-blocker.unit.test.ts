import { ScriptBlocker } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { analyzeScript } from '../src/utils/script-analyzer';

jest.mock('../src/utils/cache-manager');
jest.mock('../src/utils/script-analyzer');

describe('ScriptBlocker', () => {
  let scriptBlocker: ScriptBlocker;
  let mockCacheManager: jest.Mocked<CacheManager>;

  beforeEach(() => {
    mockCacheManager = {
      getCachedResponse: jest.fn(),
      clearCache: jest.fn(),
      cacheResponse: jest.fn(),
    } as unknown as jest.Mocked<CacheManager>;

    scriptBlocker = ScriptBlocker.createInstance(mockCacheManager);
  });

  it('should block malicious scripts', async () => {
    const maliciousContent = 'eval("alert(1)");';
    mockCacheManager.getCachedResponse.mockResolvedValue(null);
    (analyzeScript as jest.Mock).mockReturnValue({
      isMalicious: true,
      threats: ['covertExecution'],
      score: 3,
      details: [{ pattern: 'eval', matches: ['eval("alert(1)")'] }]
    });
    const result = await scriptBlocker.shouldBlockScript('https://example.com/malicious.js', maliciousContent);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('Malicious script detected');
  });

  it('should not block safe scripts', async () => {
    const safeContent = 'console.log("hello world");';
    mockCacheManager.getCachedResponse.mockResolvedValue(null);
    (analyzeScript as jest.Mock).mockReturnValue({
      isMalicious: false,
      threats: [],
      score: 0,
      details: []
    });
    const result = await scriptBlocker.shouldBlockScript('https://example.com/safe.js', safeContent);
    expect(result.blocked).toBe(false);
  });

  it('should use cached response if available', async () => {
    const cachedAnalysis = {
      isMalicious: true,
      threats: ['covertExecution'],
      score: 3,
      details: [{ pattern: 'eval', matches: ['eval("alert(1)")'] }]
    };
    mockCacheManager.getCachedResponse.mockResolvedValue({ url: 'https://example.com/cached.js', analysis: cachedAnalysis });
    const result = await scriptBlocker.shouldBlockScript('https://example.com/cached.js', 'any content');
    expect(result.blocked).toBe(true);
    expect(result.analysis).toBe(cachedAnalysis);
  });

  it('should track blocked scripts', async () => {
    const maliciousContent = 'eval("alert(1)");';
    mockCacheManager.getCachedResponse.mockResolvedValue(null);
    (analyzeScript as jest.Mock).mockReturnValue({
      isMalicious: true,
      threats: ['covertExecution'],
      score: 3,
      details: [{ pattern: 'eval', matches: ['eval("alert(1)")'] }]
    });
    await scriptBlocker.shouldBlockScript('https://example.com/malicious.js', maliciousContent);
    expect(scriptBlocker.isScriptBlocked('https://example.com/malicious.js')).toBe(true);
    expect(scriptBlocker.getBlockedScriptsCount()).toBe(1);
  });

  it('should clear blocked scripts', async () => {
    const maliciousContent = 'eval("alert(1)");';
    mockCacheManager.getCachedResponse.mockResolvedValue(null);
    (analyzeScript as jest.Mock).mockReturnValue({
      isMalicious: true,
      threats: ['covertExecution'],
      score: 3,
      details: [{ pattern: 'eval', matches: ['eval("alert(1)")'] }]
    });
    await scriptBlocker.shouldBlockScript('https://example.com/malicious.js', maliciousContent);
    scriptBlocker.clearBlockedScripts();
    expect(scriptBlocker.getBlockedScriptsCount()).toBe(0);
  });
}); 