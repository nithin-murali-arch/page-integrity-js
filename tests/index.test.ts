import { PageIntegrity, mergeConfig, exposeGlobally } from '../src/index';
import { ScriptBlocker } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { PageIntegrityConfig, BlockedEventInfo, BlockedEventType } from '../src/types';
import { DEFAULT_ANALYSIS_CONFIG } from '../src/utils/script-analyzer';

// Mock the script interceptor and script blocker
jest.mock('../src/utils/script-interceptor', () => ({
  ScriptInterceptor: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn()
  }))
}));

jest.mock('../src/utils/script-blocker', () => ({
  ScriptBlocker: jest.fn().mockImplementation(() => ({
    shouldBlockScript: jest.fn().mockResolvedValue({ blocked: false })
  }))
}));

jest.mock('../src/utils/cache-manager', () => ({
  CacheManager: jest.fn().mockImplementation(() => ({
    getCachedResponse: jest.fn(),
    clearCache: jest.fn(),
    cacheResponse: jest.fn()
  }))
}));

describe('PageIntegrity', () => {
  let mockScriptBlocker: jest.Mocked<ScriptBlocker>;
  let mockCacheManager: jest.Mocked<CacheManager>;
  let blockedEvents: BlockedEventInfo[];
  let config: PageIntegrityConfig;

  beforeEach(() => {
    blockedEvents = [];
    config = {
      strictMode: false,
      whiteListedScripts: ['good.com'],
      blackListedScripts: ['bad.com'],
      analysisConfig: DEFAULT_ANALYSIS_CONFIG
    };

    mockScriptBlocker = {
      shouldBlockScript: jest.fn(),
      isScriptBlocked: jest.fn(),
      getBlockedScript: jest.fn(),
      getAllBlockedScripts: jest.fn(),
      getBlockedScriptsCount: jest.fn(),
      clearBlockedScripts: jest.fn()
    } as any;

    mockCacheManager = {
      getCachedResponse: jest.fn(),
      clearCache: jest.fn(),
      cacheResponse: jest.fn()
    } as any;

    (ScriptBlocker as unknown as jest.Mock).mockImplementation(() => mockScriptBlocker);
    (CacheManager as unknown as jest.Mock).mockImplementation(() => mockCacheManager);

    // Clean up global for each test
    (window as any).PageIntegrity = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with merged config', () => {
      const pi = new PageIntegrity(config);
      expect(pi['config']).toEqual(config);
    });

    it('should initialize with default config if none provided', () => {
      const pi = new PageIntegrity();
      expect(pi['config']).toEqual({
        strictMode: false,
        whiteListedScripts: [],
        blackListedScripts: [],
        analysisConfig: DEFAULT_ANALYSIS_CONFIG
      });
    });

    it('should expose PageIntegrity globally', () => {
      new PageIntegrity(config);
      expect((window as any).PageIntegrity).toBe(PageIntegrity);
    });
  });

  describe('updateConfig', () => {
    it('should update config and reinitialize script blocker', () => {
      const pi = new PageIntegrity(config);
      const newConfig: Partial<PageIntegrityConfig> = {
        blackListedScripts: ['new-bad.com']
      };
      pi.updateConfig(newConfig);
      expect(pi['config']).toEqual({
        ...config,
        ...newConfig
      });
    });
  });

  describe('script blocking', () => {
    it('should allow scripts from allowed domains', async () => {
      const pi = new PageIntegrity(config);
      const script = document.createElement('script');
      script.src = 'https://good.com/safe.js';

      mockScriptBlocker.shouldBlockScript.mockResolvedValue({
        blocked: false
      });

      document.head.appendChild(script);
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operations

      expect(blockedEvents.length).toBe(0);
    });

    it('should handle unknown domains', async () => {
      const pi = new PageIntegrity(config);
      const script = document.createElement('script');
      script.src = 'https://neutral.com/neutral.js';

      mockScriptBlocker.shouldBlockScript.mockResolvedValue({
        blocked: false
      });

      document.head.appendChild(script);
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operations

      expect(blockedEvents.length).toBe(0);
    });
  });

  describe('mergeConfig', () => {
    it('should merge configs correctly', () => {
      const defaults: PageIntegrityConfig = {
        strictMode: false,
        whiteListedScripts: [],
        blackListedScripts: [],
        analysisConfig: DEFAULT_ANALYSIS_CONFIG
      };

      const custom: Partial<PageIntegrityConfig> = {
        whiteListedScripts: ['custom.com'],
        blackListedScripts: ['bad.com']
      };

      const result = mergeConfig(defaults, custom);
      expect(result).toEqual({
        ...defaults,
        ...custom
      });
    });
  });

  describe('exposeGlobally', () => {
    it('should expose class to window object', () => {
      const TestClass = class {};
      exposeGlobally(TestClass, 'TestClass');
      expect((window as any).TestClass).toBe(TestClass);
    });

    it('should not throw when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => exposeGlobally(class {}, 'TestClass')).not.toThrow();

      (global as any).window = originalWindow;
    });
  });

  describe('configuration', () => {
    it('should handle strict mode configuration', () => {
      const strictConfig: PageIntegrityConfig = {
        ...config,
        strictMode: true
      };
      const pi = new PageIntegrity(strictConfig);
      expect(pi['config'].strictMode).toBe(true);
    });

    it('should handle analysis configuration', () => {
      const analysisConfig: PageIntegrityConfig = {
        ...config,
        analysisConfig: {
          minScore: 5,
          maxThreats: 3,
          checkSuspiciousStrings: true,
          weights: {
            evasion: 4,
            covertExecution: 4,
            securityBypass: 3,
            maliciousIntent: 3
          },
          scoringRules: {
            minSafeScore: 5,
            maxThreats: 3,
            suspiciousStringWeight: 2
          }
        }
      };
      const pi = new PageIntegrity(analysisConfig);
      expect(pi['config'].analysisConfig).toEqual(analysisConfig.analysisConfig);
    });
  });

  describe('callbacks', () => {
    it('should call onBlocked when script is blocked', () => {
      const pi = new PageIntegrity({
        ...config,
        onBlocked: (event) => blockedEvents.push(event)
      });

      const event: BlockedEventInfo = {
        type: 'script' as BlockedEventType,
        timestamp: Date.now(),
        url: 'https://blocked.com/script.js',
        source: 'external',
        details: {
          reason: 'Blacklisted script'
        }
      };

      pi['config'].onBlocked?.(event);
      expect(blockedEvents).toContainEqual(event);
    });
  });
}); 