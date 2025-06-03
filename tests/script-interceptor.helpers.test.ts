import { interceptScriptElement, interceptGlobalMethods } from '../src/utils/script-interceptor';
import { ScriptBlocker } from '../src/utils/script-blocker';
import { CacheManager } from '../src/utils/cache-manager';
import { PageIntegrityConfig } from '../src/types';

describe('Script Interceptor Helpers', () => {
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

  describe('interceptScriptElement', () => {
    it('should call shouldBlockScript with src if script has src', async () => {
      const script = document.createElement('script');
      script.src = 'http://example.com/script.js';
      await interceptScriptElement(script, mockScriptBlocker);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('http://example.com/script.js', '');
    });

    it('should call shouldBlockScript with inline content if script has textContent', async () => {
      const script = document.createElement('script');
      script.textContent = 'console.log("test");';
      await interceptScriptElement(script, mockScriptBlocker);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('inline', 'console.log("test");');
    });

    it('should not call shouldBlockScript if scriptBlocker is not initialized', async () => {
      const script = document.createElement('script');
      script.src = 'http://example.com/script.js';
      await interceptScriptElement(script, null as unknown as ScriptBlocker);
      expect(mockScriptBlocker.shouldBlockScript).not.toHaveBeenCalled();
    });
  });

  describe('interceptGlobalMethods', () => {
    it('should intercept eval', async () => {
      interceptGlobalMethods(mockScriptBlocker);
      await window.eval('console.log("test");');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('eval', 'console.log("test");');
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

    it('should intercept setInterval', async () => {
      interceptGlobalMethods(mockScriptBlocker);
      await window.setInterval('console.log("test");', 0);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('setInterval', 'console.log("test");');
    });

    it('should intercept XHR open', async () => {
      interceptGlobalMethods(mockScriptBlocker);
      const xhr = new XMLHttpRequest();
      await xhr.open('GET', 'test.js');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('test.js', '');
    });

    it('should intercept fetch', async () => {
      interceptGlobalMethods(mockScriptBlocker);
      await window.fetch('http://example.com/test.js');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('http://example.com/test.js', '');
    });

    it('should handle null scriptBlocker', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      interceptGlobalMethods(null as unknown as ScriptBlocker);
      expect(consoleSpy).toHaveBeenCalledWith('ScriptBlocker is not initialized');
      consoleSpy.mockRestore();
    });
  });
}); 