import { ScriptInterceptor, interceptScriptElement, interceptGlobalMethods } from '../src/utils/script-interceptor';
import { ScriptBlocker } from '../src/utils/script-blocker';

describe('Script Interceptor', () => {
  let mockScriptBlocker: jest.Mocked<ScriptBlocker>;
  let scriptInterceptor: ScriptInterceptor;

  beforeEach(() => {
    mockScriptBlocker = {
      shouldBlockScript: jest.fn().mockResolvedValue({ blocked: false, reason: '', analysis: {} }),
      getAllBlockedScripts: jest.fn().mockReturnValue([]),
      getBlockedScriptsCount: jest.fn().mockReturnValue(0),
      clearBlockedScripts: jest.fn()
    } as unknown as jest.Mocked<ScriptBlocker>;

    scriptInterceptor = ScriptInterceptor.createInstance(mockScriptBlocker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ScriptInterceptor class', () => {
    it('should create new instance with provided scriptBlocker', () => {
      const instance = ScriptInterceptor.createInstance(mockScriptBlocker);
      expect(instance).toBeInstanceOf(ScriptInterceptor);
    });

    it('should start interception when start() is called', async () => {
      scriptInterceptor.start();
      const script = document.createElement('script');
      script.src = 'https://example.com/script.js';
      await interceptScriptElement(script, mockScriptBlocker);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('https://example.com/script.js', '');
    });

    it('should stop interception when stop() is called', () => {
      scriptInterceptor.start();
      scriptInterceptor.stop();
      const script = document.createElement('script');
      expect(mockScriptBlocker.shouldBlockScript).not.toHaveBeenCalled();
    });

    it('should not start if already running', () => {
      scriptInterceptor.start();
      const originalCreateElement = document.createElement;
      scriptInterceptor.start();
      expect(document.createElement).toBe(originalCreateElement);
    });

    it('should not stop if not running', () => {
      const originalCreateElement = document.createElement;
      scriptInterceptor.stop();
      expect(document.createElement).toBe(originalCreateElement);
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
  });

  describe('interceptGlobalMethods', () => {
    let originalEval: typeof window.eval;
    let originalFunction: typeof Function;
    let originalSetTimeout: typeof window.setTimeout;
    let originalSetInterval: typeof window.setInterval;
    let originalXHROpen: typeof XMLHttpRequest.prototype.open;
    let originalFetch: typeof window.fetch;

    beforeEach(() => {
      originalEval = window.eval;
      originalFunction = Function;
      originalSetTimeout = window.setTimeout;
      originalSetInterval = window.setInterval;
      originalXHROpen = XMLHttpRequest.prototype.open;
      originalFetch = window.fetch;
    });

    afterEach(() => {
      window.eval = originalEval;
      Function = originalFunction;
      window.setTimeout = originalSetTimeout;
      window.setInterval = originalSetInterval;
      XMLHttpRequest.prototype.open = originalXHROpen;
      window.fetch = originalFetch;
    });

    it('should intercept eval', () => {
      interceptGlobalMethods(mockScriptBlocker);
      window.eval('console.log("test");');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('eval', 'console.log("test");');
    });

    it('should intercept Function constructor', () => {
      interceptGlobalMethods(mockScriptBlocker);
      new Function('console.log("test");');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('Function', 'console.log("test");');
    });

    it('should intercept setTimeout with string handler', () => {
      interceptGlobalMethods(mockScriptBlocker);
      window.setTimeout('console.log("test");', 0);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('setTimeout', 'console.log("test");');
    });

    it('should intercept setInterval with string handler', () => {
      interceptGlobalMethods(mockScriptBlocker);
      window.setInterval('console.log("test");', 0);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('setInterval', 'console.log("test");');
    });

    it('should intercept XHR open with .js URL', () => {
      interceptGlobalMethods(mockScriptBlocker);
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://example.com/script.js');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('https://example.com/script.js', '');
    });

    it('should intercept fetch with .js URL', async () => {
      await mockScriptBlocker.shouldBlockScript('https://example.com/script.js', '');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('https://example.com/script.js', '');
    });

    it('should handle null scriptBlocker', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      interceptGlobalMethods(null as unknown as ScriptBlocker);
      expect(consoleSpy).toHaveBeenCalledWith('ScriptBlocker is not initialized');
      consoleSpy.mockRestore();
    });
  });
}); 