import { PageIntegrity } from '../src/index';

describe('PageIntegrity', () => {
  let blockedEvents: any[];
  let config: any;

  beforeEach(() => {
    blockedEvents = [];
    config = {
      whitelistedHosts: ['good.com'],
      blacklistedHosts: ['bad.com'],
      onBlocked: (event: any) => blockedEvents.push(event)
    };
    // Clean up global for each test
    (window as any).PageIntegrity = undefined;
  });

  it('should require config and start automatically', () => {
    const pi = new PageIntegrity(config);
    expect(pi).toBeDefined();
  });

  it('should expose PageIntegrity globally', () => {
    new PageIntegrity(config);
    expect((window as any).PageIntegrity).toBeDefined();
  });

  it('should block scripts from blacklisted origins', () => {
    new PageIntegrity(config);
    const script = document.createElement('script');
    script.src = 'https://bad.com/evil.js';
    document.head.appendChild(script);
    expect(blockedEvents.length).toBe(1);
    expect(blockedEvents[0].type).toBe('blacklisted');
  });

  it('should allow scripts from whitelisted origins and not call callback', () => {
    new PageIntegrity(config);
    const script = document.createElement('script');
    script.src = 'https://good.com/safe.js';
    document.head.appendChild(script);
    expect(blockedEvents.length).toBe(0);
  });

  it('should call callback for scripts from unknown origins', () => {
    new PageIntegrity(config);
    const script = document.createElement('script');
    script.src = 'https://neutral.com/neutral.js';
    document.head.appendChild(script);
    expect(blockedEvents.length).toBe(1);
    expect(blockedEvents[0].type).toBe('unknown-origin');
  });

  it('should always allow inline scripts', () => {
    new PageIntegrity(config);
    const script = document.createElement('script');
    script.textContent = 'window.inlineScriptRan = true;';
    document.head.appendChild(script);
    expect((window as any).inlineScriptRan).toBe(true);
    expect(blockedEvents.length).toBe(0);
    delete (window as any).inlineScriptRan;
  });
}); 