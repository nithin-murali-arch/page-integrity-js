import { interceptScriptElement, interceptGlobalMethods } from '../src/utils/script-interceptor';
import { ScriptBlocker } from '../src/utils/script-blocker';

describe('Script Interceptor Helpers', () => {
  let mockScriptBlocker: jest.Mocked<ScriptBlocker>;

  beforeEach(() => {
    mockScriptBlocker = {
      shouldBlockScript: jest.fn().mockResolvedValue({ blocked: false, reason: '', analysis: {} }),
    } as unknown as jest.Mocked<ScriptBlocker>;
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
    it('should intercept eval and call shouldBlockScript', () => {
      const originalEval = window.eval;
      interceptGlobalMethods(mockScriptBlocker);
      window.eval('console.log("test");');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('eval', 'console.log("test");');
      window.eval = originalEval;
    });

    it('should intercept Function and call shouldBlockScript', () => {
      const originalFunction = Function;
      interceptGlobalMethods(mockScriptBlocker);
      new Function('console.log("test");');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('Function', 'console.log("test");');
      Function = originalFunction;
    });

    it('should intercept setTimeout and call shouldBlockScript if handler is a string', () => {
      const originalSetTimeout = window.setTimeout;
      interceptGlobalMethods(mockScriptBlocker);
      window.setTimeout('console.log("test");', 0);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('setTimeout', 'console.log("test");');
      window.setTimeout = originalSetTimeout;
    });

    it('should intercept setInterval and call shouldBlockScript if handler is a string', () => {
      const originalSetInterval = window.setInterval;
      interceptGlobalMethods(mockScriptBlocker);
      window.setInterval('console.log("test");', 0);
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('setInterval', 'console.log("test");');
      window.setInterval = originalSetInterval;
    });

    it('should intercept XHR open and call shouldBlockScript if url ends with .js', () => {
      const originalXHROpen = XMLHttpRequest.prototype.open;
      interceptGlobalMethods(mockScriptBlocker);
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://example.com/script.js');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('http://example.com/script.js', '');
      XMLHttpRequest.prototype.open = originalXHROpen;
    });

    it('should intercept fetch and call shouldBlockScript if url ends with .js', async () => {
      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '' }) as any;
      interceptGlobalMethods(mockScriptBlocker);
      await window.fetch('http://example.com/script.js');
      expect(mockScriptBlocker.shouldBlockScript).toHaveBeenCalledWith('http://example.com/script.js', '');
      window.fetch = originalFetch;
    });
  });
}); 