import { ScriptInterceptor, interceptScriptElement, interceptGlobalMethods } from '../src/utils/script-interceptor';
import { ScriptBlocker } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { PageIntegrityConfig } from '../src/types';

describe('Script Interceptor', () => {
  let mockScriptBlocker: jest.Mocked<ScriptBlocker>;
  let mockCacheManager: jest.Mocked<CacheManager>;
  let config: PageIntegrityConfig;

  beforeEach(() => {
    mockCacheManager = {
      getCachedResponse: jest.fn(),
      setCachedResponse: jest.fn(),
      clearCache: jest.fn()
    } as any;

    config = {
      strictMode: false,
      whiteListedScripts: [],
      blackListedScripts: []
    };

    mockScriptBlocker = new ScriptBlocker(mockCacheManager, config) as jest.Mocked<ScriptBlocker>;
    mockScriptBlocker.shouldBlockScript = jest.fn().mockResolvedValue({ blocked: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ScriptInterceptor class', () => {
    let interceptor: ScriptInterceptor;

    beforeEach(() => {
      interceptor = new ScriptInterceptor(mockScriptBlocker);
    });

    it('should create instance', () => {
      expect(interceptor).toBeInstanceOf(ScriptInterceptor);
    });

    it('should create instance using static method', () => {
      const instance = ScriptInterceptor.createInstance(mockScriptBlocker);
      expect(instance).toBeInstanceOf(ScriptInterceptor);
    });

    it('should start interception', () => {
      interceptor.start();
      expect(mockScriptBlocker.shouldBlockScript).not.toHaveBeenCalled();
    });

    it('should not start if already started', () => {
      interceptor.start();
      interceptor.start();
      expect(mockScriptBlocker.shouldBlockScript).not.toHaveBeenCalled();
    });

    it('should stop interception', () => {
      interceptor.start();
      interceptor.stop();
      expect(mockScriptBlocker.shouldBlockScript).not.toHaveBeenCalled();
    });
  });

  describe('interceptScriptElement', () => {
    it('should handle script with src', async () => {
      const script = document.createElement('script');
      script.src = 'https://example.com/script.js';
      await interceptScriptElement(script, mockScriptBlocker);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('https://example.com/script.js', '');
    });

    it('should handle script with textContent', async () => {
      const script = document.createElement('script');
      script.textContent = 'console.log("test");';
      await interceptScriptElement(script, mockScriptBlocker);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('inline', 'console.log("test");');
    });

    it('should handle null scriptBlocker', async () => {
      const script = document.createElement('script');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await interceptScriptElement(script, null as unknown as ScriptBlocker);
      expect(consoleSpy).toHaveBeenCalledWith('ScriptBlocker is not initialized');
      consoleSpy.mockRestore();
    });

    it('should remove script if blocked', async () => {
      mockScriptBlocker.shouldBlockScript.mockResolvedValueOnce({ blocked: true, reason: 'Blocked' });
      const script = document.createElement('script');
      script.src = 'https://example.com/script.js';
      document.body.appendChild(script);
      await interceptScriptElement(script, mockScriptBlocker);
      expect(script.parentNode).toBeNull();
    });
  });

  describe('interceptGlobalMethods', () => {
    it('should intercept eval', async () => {
      interceptGlobalMethods(mockScriptBlocker);
      await window.eval('console.log("test");');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('eval', 'console.log("test");');
    });

    it('should block eval when script is blocked', async () => {
      mockScriptBlocker.shouldBlockScript.mockResolvedValueOnce({ blocked: true, reason: 'Blocked' });
      interceptGlobalMethods(mockScriptBlocker);
      const result = await window.eval('console.log("test");');
      expect(result).toBeUndefined();
    });

    it('should intercept Function constructor', () => {
      const originalFunction = Function;
      interceptGlobalMethods(mockScriptBlocker);
      new Function('console.log("test");');
      expect(mockScriptBlocker.shouldBlockScript).not.toHaveBeenCalled();
      Function = originalFunction;
    });

    it('should intercept setTimeout', async () => {
      interceptGlobalMethods(mockScriptBlocker);
      await window.setTimeout('console.log("test");', 0);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('setTimeout', 'console.log("test");');
    });

    it('should block setTimeout when script is blocked', async () => {
      mockScriptBlocker.shouldBlockScript.mockResolvedValueOnce({ blocked: true, reason: 'Blocked' });
      interceptGlobalMethods(mockScriptBlocker);
      const result = await window.setTimeout('console.log("test");', 0);
      expect(result).toBe(0);
    });

    it('should intercept setInterval', async () => {
      interceptGlobalMethods(mockScriptBlocker);
      await window.setInterval('console.log("test");', 0);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('setInterval', 'console.log("test");');
    });

    it('should block setInterval when script is blocked', async () => {
      mockScriptBlocker.shouldBlockScript.mockResolvedValueOnce({ blocked: true, reason: 'Blocked' });
      interceptGlobalMethods(mockScriptBlocker);
      const result = await window.setInterval('console.log("test");', 0);
      expect(result).toBe(0);
    });

    it('should throw error when XHR is blocked', async () => {
      mockScriptBlocker.shouldBlockScript.mockResolvedValueOnce({ blocked: true, reason: 'Blocked' });
      interceptGlobalMethods(mockScriptBlocker);
      const xhr = new XMLHttpRequest();
      await expect(xhr.open('GET', 'test.js')).rejects.toThrow('Blocked script: Blocked');
    });

    it('should throw error when fetch is blocked', async () => {
      mockScriptBlocker.shouldBlockScript.mockResolvedValueOnce({ blocked: true, reason: 'Blocked' });
      interceptGlobalMethods(mockScriptBlocker);
      await expect(window.fetch('test.js')).rejects.toThrow('Blocked script: Blocked');
    });
  });
}); 