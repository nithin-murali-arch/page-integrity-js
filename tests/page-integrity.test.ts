import { PageIntegrity, mergeConfig, exposeGlobally } from '../src/index';
import { ScriptBlocker } from '../src/script-blocking';
import { CacheManager } from '../src/utils/cache-manager';
import { PageIntegrityConfig } from '../src/types';

jest.mock('../src/script-blocking');
jest.mock('../src/utils/cache-manager');

describe('PageIntegrity', () => {
  let mockScriptBlocker: jest.Mocked<ScriptBlocker>;
  let mockCacheManager: jest.Mocked<CacheManager>;
  let blockedEvents: any[];
  let config: PageIntegrityConfig;

  beforeEach(() => {
    blockedEvents = [];
    config = {
      whitelistedHosts: ['good.com'],
      blacklistedHosts: ['bad.com'],
      onBlocked: (event: any) => blockedEvents.push(event)
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
    it('should create instance with default config', () => {
      const pi = new PageIntegrity(config);
      expect(pi).toBeDefined();
      expect(mockScriptBlocker.shouldBlockScript).not.toHaveBeenCalled();
    });

    it('should expose PageIntegrity globally', () => {
      new PageIntegrity(config);
      expect((window as any).PageIntegrity).toBe(PageIntegrity);
    });

    it('should initialize with merged config', () => {
      const pi = new PageIntegrity(config);
      expect(pi['config']).toEqual({
        allowDynamicInline: true,
        ...config
      });
    });
  });

  describe('updateConfig', () => {
    it('should update config and reinitialize script blocker', () => {
      const pi = new PageIntegrity(config);
      const newConfig = {
        whitelistedHosts: ['new-good.com'],
        blacklistedHosts: ['new-bad.com']
      };

      pi.updateConfig(newConfig);

      expect(pi['config']).toEqual({
        allowDynamicInline: true,
        ...config,
        ...newConfig
      });
      expect(ScriptBlocker).toHaveBeenCalledTimes(2);
    });
  });

  describe('script blocking', () => {
    it('should allow scripts from whitelisted origins', async () => {
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

    it('should handle unknown origins', async () => {
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
      const defaults = {
        allowDynamicInline: true,
        whitelistedHosts: ['default.com']
      };
      const custom = {
        whitelistedHosts: ['custom.com'],
        blacklistedHosts: ['bad.com']
      };

      const result = mergeConfig(defaults, custom);

      expect(result).toEqual({
        allowDynamicInline: true,
        whitelistedHosts: ['custom.com'],
        blacklistedHosts: ['bad.com']
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
}); 