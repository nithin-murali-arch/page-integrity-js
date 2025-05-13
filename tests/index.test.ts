import { PageIntegrity } from '../src';
import { ScriptBlocker } from '../src/script-blocking';
import { MutationMonitor } from '../src/mutation-monitor';

describe('PageIntegrity', () => {
  let pageIntegrity: PageIntegrity;
  let blockedEvents: any[];

  beforeEach(() => {
    // Ensure document.body exists
    if (!document.body) {
      document.body = document.createElement('body');
    }

    blockedEvents = [];
    pageIntegrity = new PageIntegrity({
      strictMode: true,
      allowDynamicInline: true,
      onBlocked: (info) => {
        blockedEvents.push(info);
      }
    });

    // Clear document body and reset blocked events before each test
    document.body.innerHTML = '';
    blockedEvents = [];
  });

  describe('Script Creation', () => {
    it('should allow script creation with allowed URL and call callback for unknown origin', () => {
      const script = document.createElement('script');
      script.src = 'https://good.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(1);
      expect(blockedEvents[0].type).toBe('unknown-origin');
      expect(document.querySelector('script')).not.toBeNull();
    });

    it('should always allow inline script creation', () => {
      const script = document.createElement('script');
      script.textContent = 'console.log("test inline allowed")';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(0);
      expect(document.querySelector('script')).not.toBeNull();
    });

    it('should allow script creation with whitelisted origin (no block, no callback)', () => {
      pageIntegrity.updateConfig({
        whitelistedHosts: ['good.com'],
        blacklistedHosts: ['evil.com']
      });
      const script = document.createElement('script');
      script.src = 'https://good.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(0);
      expect(document.querySelector('script')).not.toBeNull();
    });

    it('should block script creation with blacklisted origin and call callback', () => {
      pageIntegrity.updateConfig({
        whitelistedHosts: ['good.com'],
        blacklistedHosts: ['evil.com']
      });
      const script = document.createElement('script');
      script.src = 'https://evil.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(1);
      expect(blockedEvents[0].type).toBe('blacklisted');
      expect(document.querySelector('script')).toBeNull();
    });

    it('should call callback for script from neutral origin (not in whitelist or blacklist)', () => {
      pageIntegrity.updateConfig({
        whitelistedHosts: ['good.com'],
        blacklistedHosts: ['evil.com']
      });
      const script = document.createElement('script');
      script.src = 'https://neutral.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(1);
      expect(blockedEvents[0].type).toBe('unknown-origin');
      expect(document.querySelector('script')).not.toBeNull();
    });
  });

  describe('DOM Mutation', () => {
    it('should allow mutation of any element type', () => {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      expect(blockedEvents).toHaveLength(0);
      expect(document.querySelector('iframe')).not.toBeNull();
    });

    it('should allow mutation of custom elements', () => {
      const custom = document.createElement('my-custom-element');
      document.body.appendChild(custom);
      expect(blockedEvents).toHaveLength(0);
      expect(document.querySelector('my-custom-element')).not.toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultConfig = new PageIntegrity();
      expect(defaultConfig).toBeDefined();
    });
  });

  describe('Configuration Updates', () => {
    it('should update script blocking behavior when config changes', () => {
      pageIntegrity.updateConfig({
        whitelistedHosts: ['good.com'],
        blacklistedHosts: ['evil.com']
      });
      const script = document.createElement('script');
      script.src = 'https://good.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(0);
      expect(document.querySelector('script')).not.toBeNull();

      pageIntegrity.updateConfig({
        whitelistedHosts: [],
        blacklistedHosts: ['good.com']
      });
      const script2 = document.createElement('script');
      script2.src = 'https://good.com/script.js';
      document.body.appendChild(script2);
      expect(blockedEvents).toHaveLength(1);
      expect(blockedEvents[0].type).toBe('blacklisted');
      expect(document.querySelectorAll('script').length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid script URLs gracefully', () => {
      const script = document.createElement('script');
      script.src = 'invalid-url';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(0);
      expect(document.querySelector('script')).not.toBeNull();
    });
  });

  describe('Multiple Scripts', () => {
    it('should handle multiple scripts correctly', () => {
      pageIntegrity.updateConfig({
        whitelistedHosts: ['good.com'],
        blacklistedHosts: ['evil.com']
      });
      const script1 = document.createElement('script');
      script1.src = 'https://good.com/script1.js';
      document.body.appendChild(script1);
      const script2 = document.createElement('script');
      script2.src = 'https://evil.com/script2.js';
      document.body.appendChild(script2);
      const script3 = document.createElement('script');
      script3.src = 'https://neutral.com/script3.js';
      document.body.appendChild(script3);
      expect(blockedEvents).toHaveLength(2);
      expect(blockedEvents[0].type).toBe('blacklisted');
      expect(blockedEvents[1].type).toBe('unknown-origin');
      expect(document.querySelectorAll('script').length).toBe(2);
    });
  });

  describe('Dynamic Script Loading', () => {
    it('should handle dynamically loaded scripts correctly', () => {
      const script = document.createElement('script');
      script.src = 'https://good.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(1);
      expect(blockedEvents[0].type).toBe('unknown-origin');
      expect(document.querySelector('script')).not.toBeNull();
    });
  });

  describe('Script Removal', () => {
    it('should remove scripts from the DOM when blocked', () => {
      pageIntegrity.updateConfig({
        blacklistedHosts: ['evil.com']
      });
      const script = document.createElement('script');
      script.src = 'https://evil.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(1);
      expect(blockedEvents[0].type).toBe('blacklisted');
      expect(document.querySelector('script')).toBeNull();
    });
  });

  describe('Callback Consistency', () => {
    it('should call the callback exactly once per script append for unknown origins', () => {
      const script = document.createElement('script');
      script.src = 'https://neutral.com/script.js';
      document.body.appendChild(script);
      expect(blockedEvents).toHaveLength(1);
      expect(blockedEvents[0].type).toBe('unknown-origin');
      expect(document.querySelector('script')).not.toBeNull();
    });
  });
}); 