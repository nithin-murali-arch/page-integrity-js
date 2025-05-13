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

    it('should notify about unknown origins', () => {
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
  });
}); 