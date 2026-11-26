import { PageIntegrity } from '../src/index';
import { BlockedEventInfo } from '../src/types';

describe('PageIntegrity lifecycle', () => {
  const nativeEval = window.eval;
  const nativeAppendChild = Node.prototype.appendChild;
  let blocked: BlockedEventInfo[];
  let pi: PageIntegrity | undefined;

  const appendExternalScript = (src: string): HTMLScriptElement => {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
    return script;
  };

  beforeEach(() => {
    blocked = [];
    document.head.innerHTML = '';
  });

  afterEach(() => pi?.destroy());

  it('destroy() puts the native globals back', () => {
    pi = new PageIntegrity({ strictMode: false, whiteListedScripts: [], blackListedScripts: ['evil.example'] });
    expect(window.eval).not.toBe(nativeEval);
    pi.destroy();
    expect(window.eval).toBe(nativeEval);
    expect(Node.prototype.appendChild).toBe(nativeAppendChild);
  });

  it('updateConfig() replaces the wrappers instead of stacking them', () => {
    pi = new PageIntegrity({
      strictMode: false,
      whiteListedScripts: [],
      blackListedScripts: ['evil.example'],
      onBlocked: event => blocked.push(event)
    });
    pi.updateConfig({ blackListedScripts: ['other.example'] });

    expect(appendExternalScript('https://evil.example/a.js').type).toBe('');
    expect(appendExternalScript('https://other.example/a.js').type).toBe('javascript/blocked');
    expect(blocked.map(event => event.url)).toEqual(['https://other.example/a.js']);

    pi.destroy();
    expect(window.eval).toBe(nativeEval);
    expect(Node.prototype.appendChild).toBe(nativeAppendChild);
  });
});
