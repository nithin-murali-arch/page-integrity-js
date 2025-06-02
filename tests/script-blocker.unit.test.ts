import { ScriptBlocker } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { analyzeScript } from '../src/utils/script-analyzer';
import { PageIntegrityConfig } from '../src/types';

jest.mock('../src/utils/cache-manager');
jest.mock('../src/utils/script-analyzer');

describe('ScriptBlocker', () => {
  let scriptBlocker: ScriptBlocker;
  let mockCacheManager: jest.Mocked<CacheManager>;
  let mockConfig: PageIntegrityConfig;

  beforeEach(() => {
    mockCacheManager = {
      getCachedResponse: jest.fn(),
      clearCache: jest.fn(),
      cacheResponse: jest.fn(),
    } as unknown as jest.Mocked<CacheManager>;

    mockConfig = {
      blacklistedHosts: ['malicious.com'],
      whitelistedHosts: ['trusted.com']
    };

    scriptBlocker = new ScriptBlocker(mockCacheManager, mockConfig);
  });

  it('should block blacklisted scripts', async () => {
    const result = await scriptBlocker.shouldBlockScript('https://malicious.com/script.js', 'any content');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('Blacklisted script');
  });

  it('should not block non-blacklisted scripts', async () => {
    const safeContent = 'console.log("hello world");';
    (analyzeScript as jest.Mock).mockReturnValue({
      threats: [],
      score: 0,
      details: []
    });
    const result = await scriptBlocker.shouldBlockScript('https://example.com/safe.js', safeContent);
    expect(result.blocked).toBe(false);
  });

  it('should analyze and track all scripts', async () => {
    const content = 'console.log("hello world");';
    const analysis = {
      threats: [],
      score: 0,
      details: []
    };
    (analyzeScript as jest.Mock).mockReturnValue(analysis);
    
    const result = await scriptBlocker.shouldBlockScript('https://example.com/script.js', content);
    expect(result.blocked).toBe(false);
    expect(result.analysis).toBe(analysis);
    expect(scriptBlocker.isScriptBlocked('https://example.com/script.js')).toBe(true);
  });

  it('should track blocked scripts', async () => {
    await scriptBlocker.shouldBlockScript('https://malicious.com/script.js', 'any content');
    expect(scriptBlocker.isScriptBlocked('https://malicious.com/script.js')).toBe(true);
    expect(scriptBlocker.getBlockedScriptsCount()).toBe(1);
  });

  it('should clear blocked scripts', async () => {
    await scriptBlocker.shouldBlockScript('https://malicious.com/script.js', 'any content');
    scriptBlocker.clearBlockedScripts();
    expect(scriptBlocker.getBlockedScriptsCount()).toBe(0);
  });
}); 