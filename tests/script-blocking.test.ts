import { PageIntegrity } from '../src';
import { createHash } from '../src/utils/hash';

describe('ScriptBlocker', () => {
  let pageIntegrity: PageIntegrity;
  let mockOnBlocked: jest.Mock;
  let mockServiceWorker: ServiceWorker;

  beforeEach(() => {
    mockOnBlocked = jest.fn();
    mockServiceWorker = {
      postMessage: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as any;

    // Mock service worker registration
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        controller: mockServiceWorker,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      writable: true
    });

    pageIntegrity = new PageIntegrity({
      whitelistedHosts: ['trusted.com'],
      blacklistedHosts: ['evil.com'],
      onBlocked: mockOnBlocked
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('script element blocking', () => {
    it('should allow scripts from whitelisted origins', () => {
      const script = document.createElement('script');
      script.src = 'https://trusted.com/script.js';
      
      const result = pageIntegrity['scriptBlocker'].checkAndBlockScript(script);
      
      expect(result).toBe(false);
      expect(mockOnBlocked).not.toHaveBeenCalled();
    });

    it('should block scripts from blacklisted origins', () => {
      const script = document.createElement('script');
      script.src = 'https://evil.com/script.js';
      
      const result = pageIntegrity['scriptBlocker'].checkAndBlockScript(script);
      
      expect(result).toBe(true);
      expect(mockOnBlocked).toHaveBeenCalledWith(expect.objectContaining({
        type: 'blacklisted',
        context: {
          source: 'external',
          origin: 'https://evil.com'
        }
      }));
    });

    it('should notify about unknown origins when reportUnknownScripts is true', () => {
      pageIntegrity.updateConfig({ reportUnknownScripts: true });
      const script = document.createElement('script');
      script.src = 'https://unknown.com/script.js';
      
      const result = pageIntegrity['scriptBlocker'].checkAndBlockScript(script);
      
      expect(result).toBe(false);
      expect(mockOnBlocked).toHaveBeenCalledWith(expect.objectContaining({
        type: 'unknown-origin',
        context: {
          source: 'external',
          origin: 'https://unknown.com'
        }
      }));
    });

    it('should not notify about unknown origins when reportUnknownScripts is false', () => {
      pageIntegrity.updateConfig({ reportUnknownScripts: false });
      const script = document.createElement('script');
      script.src = 'https://unknown.com/script.js';
      
      const result = pageIntegrity['scriptBlocker'].checkAndBlockScript(script);
      
      expect(result).toBe(false);
      expect(mockOnBlocked).not.toHaveBeenCalled();
    });

    it('should block scripts matching URL patterns', () => {
      pageIntegrity.updateConfig({
        blacklistedUrlPatterns: ['https://*.malicious.com/*', 'http://dangerous.net/*']
      });

      const script1 = document.createElement('script');
      script1.src = 'https://sub.malicious.com/script.js';
      expect(pageIntegrity['scriptBlocker'].checkAndBlockScript(script1)).toBe(true);
      expect(mockOnBlocked).toHaveBeenCalledWith(expect.objectContaining({
        type: 'pattern-match',
        context: {
          source: 'external',
          origin: 'https://sub.malicious.com'
        }
      }));

      const script2 = document.createElement('script');
      script2.src = 'http://dangerous.net/script.js';
      expect(pageIntegrity['scriptBlocker'].checkAndBlockScript(script2)).toBe(true);
      expect(mockOnBlocked).toHaveBeenCalledWith(expect.objectContaining({
        type: 'pattern-match',
        context: {
          source: 'external',
          origin: 'http://dangerous.net'
        }
      }));
    });

    it('should block Chrome extensions when blockExtensions is true', () => {
      pageIntegrity.updateConfig({ blockExtensions: true });
      const script = document.createElement('script');
      script.src = 'chrome-extension://abcdefghijklmnopqrstuvwxyz/script.js';
      
      const result = pageIntegrity['scriptBlocker'].checkAndBlockScript(script);
      
      expect(result).toBe(true);
      expect(mockOnBlocked).toHaveBeenCalledWith(expect.objectContaining({
        type: 'extension',
        context: {
          source: 'external',
          origin: 'chrome-extension://abcdefghijklmnopqrstuvwxyz'
        }
      }));
    });

    it('should allow Chrome extensions when blockExtensions is false', () => {
      pageIntegrity.updateConfig({ blockExtensions: false });
      const script = document.createElement('script');
      script.src = 'chrome-extension://abcdefghijklmnopqrstuvwxyz/script.js';
      
      const result = pageIntegrity['scriptBlocker'].checkAndBlockScript(script);
      
      expect(result).toBe(false);
      expect(mockOnBlocked).not.toHaveBeenCalled();
    });
  });
}); 