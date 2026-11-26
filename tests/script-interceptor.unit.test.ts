import { ScriptInterceptor } from '../src/utils/script-interceptor';
import { ScriptBlocker } from '../src/utils/script-blocker';
import { BlockedEventInfo, PageIntegrityConfig } from '../src/types';

const MALICIOUS = 'document.domain = "*"; window.__ran = "malicious";';

describe('ScriptInterceptor', () => {
  let blocked: BlockedEventInfo[];
  let interceptor: ScriptInterceptor;

  const start = (overrides: Partial<PageIntegrityConfig> = {}): void => {
    interceptor = new ScriptInterceptor(new ScriptBlocker({
      strictMode: false,
      whiteListedScripts: ['trusted.example'],
      blackListedScripts: ['evil.example'],
      onBlocked: event => blocked.push(event),
      ...overrides
    }));
    interceptor.start();
  };

  const appendScript = (setup: (script: HTMLScriptElement) => void): HTMLScriptElement => {
    const script = document.createElement('script');
    setup(script);
    document.head.appendChild(script);
    return script;
  };

  beforeEach(() => {
    blocked = [];
    delete (window as any).__ran;
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  afterEach(() => interceptor.stop());

  describe('eval', () => {
    it('returns the evaluated value synchronously', () => {
      start();
      expect(window.eval('1 + 1')).toBe(2);
    });

    it('returns undefined for malicious code without running it', () => {
      start();
      expect(window.eval(MALICIOUS)).toBeUndefined();
      expect((window as any).__ran).toBeUndefined();
      expect(blocked.map(event => event.url)).toEqual(['eval']);
    });
  });

  describe('Function', () => {
    it('builds working functions that are still instances of Function', () => {
      start();
      const add = new window.Function('a', 'b', 'return a + b');
      expect(add(2, 3)).toBe(5);
      expect((() => 0) instanceof window.Function).toBe(true);
    });

    it('throws at creation for malicious bodies', () => {
      start();
      expect(() => new window.Function(MALICIOUS)).toThrow(EvalError);
      expect(blocked.map(event => event.url)).toEqual(['Function']);
    });
  });

  describe('timers', () => {
    it('returns a timer id that clearTimeout cancels', async () => {
      start();
      let ran = false;
      const id = window.setTimeout(() => { ran = true; }, 0);
      expect(typeof id).toBe('number');
      window.clearTimeout(id);
      await new Promise(resolve => window.setTimeout(resolve, 10));
      expect(ran).toBe(false);
    });

    it.each(['setTimeout', 'setInterval'] as const)('%s returns 0 for a malicious string handler', name => {
      start();
      expect((window[name] as (handler: string, timeout: number) => number)(MALICIOUS, 0)).toBe(0);
      expect(blocked.map(event => event.url)).toEqual([name]);
    });
  });

  describe('XMLHttpRequest.open', () => {
    it('opens allowed script URLs synchronously', () => {
      start();
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://trusted.example/app.js');
      expect(xhr.readyState).toBe(XMLHttpRequest.OPENED);
    });

    it('throws synchronously for blocked script URLs', () => {
      start();
      const xhr = new XMLHttpRequest();
      expect(() => xhr.open('GET', 'https://evil.example/app.js')).toThrow('Blocked script: Blacklisted script');
    });
  });

  describe('fetch', () => {
    it('rejects blocked script URLs', async () => {
      start();
      await expect(window.fetch('https://evil.example/app.js')).rejects.toThrow('Blocked script: Blacklisted script');
    });
  });

  describe('script elements', () => {
    it('runs allowed inline scripts', () => {
      start();
      appendScript(script => { script.text = 'window.__ran = "ok";'; });
      expect((window as any).__ran).toBe('ok');
    });

    it('does not run malicious inline scripts', () => {
      start();
      const script = appendScript(s => { s.text = MALICIOUS; });
      expect((window as any).__ran).toBeUndefined();
      expect(script.type).toBe('javascript/blocked');
      expect(blocked.map(event => event.url)).toEqual(['inline']);
    });

    it('neutralizes blocked external scripts before insertion', () => {
      start();
      const script = appendScript(s => { s.src = 'https://evil.example/tracker.js'; });
      expect(script.type).toBe('javascript/blocked');
      expect(blocked.map(event => event.url)).toEqual(['https://evil.example/tracker.js']);
    });

    it('checks scripts nested inside inserted elements', () => {
      start();
      const wrapper = document.createElement('div');
      const script = document.createElement('script');
      script.src = 'https://evil.example/nested.js';
      wrapper.appendChild(script);
      document.body.append(wrapper);
      expect(script.type).toBe('javascript/blocked');
    });

    it('checks only the inserted node, not the reference node', () => {
      start();
      const existing = appendScript(s => { s.type = 'text/plain'; s.text = MALICIOUS; });
      existing.type = '';
      const fresh = document.createElement('script');
      fresh.text = 'window.__ran = "fresh";';
      document.head.insertBefore(fresh, existing);
      expect(existing.type).toBe('');
      expect(blocked).toEqual([]);
    });

    it('leaves non-JavaScript script types alone', () => {
      start();
      const script = appendScript(s => { s.type = 'application/ld+json'; s.text = MALICIOUS; });
      expect(script.type).toBe('application/ld+json');
      expect(blocked).toEqual([]);
    });
  });

  it('stop() restores every patched global and DOM method', () => {
    const originals = {
      eval: window.eval,
      Function: window.Function,
      setTimeout: window.setTimeout,
      setInterval: window.setInterval,
      fetch: window.fetch,
      open: XMLHttpRequest.prototype.open,
      appendChild: Node.prototype.appendChild,
      insertBefore: Node.prototype.insertBefore,
      append: Element.prototype.append
    };
    start();
    expect(window.eval).not.toBe(originals.eval);
    interceptor.stop();
    expect({
      eval: window.eval,
      Function: window.Function,
      setTimeout: window.setTimeout,
      setInterval: window.setInterval,
      fetch: window.fetch,
      open: XMLHttpRequest.prototype.open,
      appendChild: Node.prototype.appendChild,
      insertBefore: Node.prototype.insertBefore,
      append: Element.prototype.append
    }).toEqual(originals);
  });
});
