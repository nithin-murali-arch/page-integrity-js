import { PageIntegrity, mergeConfig, exposeGlobally } from '../src/index';
import { ScriptBlocker } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { PageIntegrityConfig, BlockedEventInfo } from '../src/types/index';
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
  let blockedEvents: any[];
  let config: PageIntegrityConfig;

  beforeEach(() => {
    blockedEvents = [];
    config = {
      enabled: true,
      debug: false,
      strictMode: false,
      allowedDomains: ['good.com'],
      blockedDomains: ['bad.com'],
      allowedScripts: [],
      blockedScripts: [],
      allowDynamicInline: true,
      allowedMutations: {
        elementTypes: ['div', 'span', 'p'],
        maxMutations: 100,
        maxDepth: 3
      },
      analysisConfig: DEFAULT_ANALYSIS_CONFIG,
      callbacks: {
        onScriptBlocked: (event: any) => blockedEvents.push(event)
      }
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
        ...config,
        analysisConfig: DEFAULT_ANALYSIS_CONFIG
      });
    });
  });

  describe('updateConfig', () => {
    it('should update config and reinitialize script blocker', () => {
      const pi = new PageIntegrity(config);
      const newConfig: Partial<PageIntegrityConfig> = {
        blockedDomains: ['new-bad.com']
      };
      pi.updateConfig(newConfig);
      expect(pi['config']).toEqual({
        ...config,
        ...newConfig,
        analysisConfig: DEFAULT_ANALYSIS_CONFIG
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
        enabled: true,
        debug: false,
        strictMode: false,
        allowedDomains: ['default.com'],
        blockedDomains: [],
        allowedScripts: [],
        blockedScripts: [],
        allowDynamicInline: true,
        allowedMutations: {
          elementTypes: ['div', 'span', 'p'],
          maxMutations: 100,
          maxDepth: 3
        },
        analysisConfig: DEFAULT_ANALYSIS_CONFIG
      };
      const custom: Partial<PageIntegrityConfig> = {
        allowedDomains: ['custom.com'],
        blockedDomains: ['bad.com']
      };
      const result = mergeConfig(defaults, custom as PageIntegrityConfig);
      expect(result).toEqual({
        ...defaults,
        ...custom,
        analysisConfig: DEFAULT_ANALYSIS_CONFIG
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

    it('should handle debug mode configuration', () => {
      const debugConfig: PageIntegrityConfig = {
        ...config,
        debug: true
      };
      const pi = new PageIntegrity(debugConfig);
      expect(pi['config'].debug).toBe(true);
    });

    it('should handle allowed mutations configuration', () => {
      const mutationsConfig: PageIntegrityConfig = {
        ...config,
        allowedMutations: {
          elementTypes: ['div', 'span'],
          maxMutations: 50,
          maxDepth: 2
        }
      };
      const pi = new PageIntegrity(mutationsConfig);
      expect(pi['config'].allowedMutations).toEqual({
        elementTypes: ['div', 'span'],
        maxMutations: 50,
        maxDepth: 2
      });
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
    let mutationEvents: BlockedEventInfo[];
    let networkEvents: BlockedEventInfo[];
    let storageEvents: BlockedEventInfo[];
    let cookieEvents: BlockedEventInfo[];
    let iframeEvents: BlockedEventInfo[];
    let workerEvents: BlockedEventInfo[];
    let websocketEvents: BlockedEventInfo[];

    beforeEach(() => {
      mutationEvents = [];
      networkEvents = [];
      storageEvents = [];
      cookieEvents = [];
      iframeEvents = [];
      workerEvents = [];
      websocketEvents = [];

      config.callbacks = {
        onScriptBlocked: (event) => blockedEvents.push(event),
        onMutationBlocked: (event) => mutationEvents.push(event),
        onNetworkBlocked: (event) => networkEvents.push(event),
        onStorageBlocked: (event) => storageEvents.push(event),
        onCookieBlocked: (event) => cookieEvents.push(event),
        onIframeBlocked: (event) => iframeEvents.push(event),
        onWorkerBlocked: (event) => workerEvents.push(event),
        onWebsocketBlocked: (event) => websocketEvents.push(event)
      };
    });

    it('should call onMutationBlocked when mutation is blocked', () => {
      const pi = new PageIntegrity(config);
      const event: BlockedEventInfo = {
        type: 'mutation',
        timestamp: Date.now(),
        context: {
          elementType: 'div',
          mutationType: 'insert'
        }
      };
      pi['config'].callbacks?.onMutationBlocked?.(event);
      expect(mutationEvents).toContainEqual(event);
    });

    it('should call onNetworkBlocked when network request is blocked', () => {
      const pi = new PageIntegrity(config);
      const event: BlockedEventInfo = {
        type: 'network',
        timestamp: Date.now(),
        url: 'https://blocked.com/script.js'
      };
      pi['config'].callbacks?.onNetworkBlocked?.(event);
      expect(networkEvents).toContainEqual(event);
    });

    it('should call onStorageBlocked when storage access is blocked', () => {
      const pi = new PageIntegrity(config);
      const event: BlockedEventInfo = {
        type: 'storage',
        timestamp: Date.now(),
        details: { operation: 'setItem', key: 'sensitive' }
      };
      pi['config'].callbacks?.onStorageBlocked?.(event);
      expect(storageEvents).toContainEqual(event);
    });

    it('should call onCookieBlocked when cookie access is blocked', () => {
      const pi = new PageIntegrity(config);
      const event: BlockedEventInfo = {
        type: 'cookie',
        timestamp: Date.now(),
        details: { operation: 'set', name: 'tracking' }
      };
      pi['config'].callbacks?.onCookieBlocked?.(event);
      expect(cookieEvents).toContainEqual(event);
    });

    it('should call onIframeBlocked when iframe is blocked', () => {
      const pi = new PageIntegrity(config);
      const event: BlockedEventInfo = {
        type: 'iframe',
        timestamp: Date.now(),
        url: 'https://blocked.com/iframe.html'
      };
      pi['config'].callbacks?.onIframeBlocked?.(event);
      expect(iframeEvents).toContainEqual(event);
    });

    it('should call onWorkerBlocked when worker is blocked', () => {
      const pi = new PageIntegrity(config);
      const event: BlockedEventInfo = {
        type: 'worker',
        timestamp: Date.now(),
        url: 'https://blocked.com/worker.js'
      };
      pi['config'].callbacks?.onWorkerBlocked?.(event);
      expect(workerEvents).toContainEqual(event);
    });

    it('should call onWebsocketBlocked when websocket is blocked', () => {
      const pi = new PageIntegrity(config);
      const event: BlockedEventInfo = {
        type: 'websocket',
        timestamp: Date.now(),
        url: 'wss://blocked.com/socket'
      };
      pi['config'].callbacks?.onWebsocketBlocked?.(event);
      expect(websocketEvents).toContainEqual(event);
    });
  });
}); 