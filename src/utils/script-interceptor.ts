import { ScriptBlocker } from './script-blocker';

export async function interceptScriptElement(script: HTMLScriptElement, scriptBlocker: ScriptBlocker): Promise<void> {
  if (!scriptBlocker) {
    console.error('ScriptBlocker is not initialized');
    return;
  }
  if (script.src) {
    await scriptBlocker.shouldBlockScript(script.src, '');
  } else if (script.textContent) {
    await scriptBlocker.shouldBlockScript('inline', script.textContent);
  }
}

export function interceptGlobalMethods(scriptBlocker: ScriptBlocker): void {
  const originalEval = window.eval;
  const originalFunction = Function;
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalFetch = window.fetch;

  window.eval = function(code: string): any {
    scriptBlocker.shouldBlockScript('eval', code);
    return originalEval.call(window, code);
  };

  Function = function(...args: string[]): Function {
    const code = args[args.length - 1];
    scriptBlocker.shouldBlockScript('Function', code);
    return originalFunction.apply(null, args);
  } as any;

  window.setTimeout = function(handler: TimerHandler, timeout?: number, ...args: any[]): ReturnType<typeof setTimeout> {
    if (typeof handler === 'string') {
      scriptBlocker.shouldBlockScript('setTimeout', handler);
    }
    return originalSetTimeout.call(window, handler as (...args: any[]) => void, timeout, ...args as []);
  } as unknown as typeof setTimeout;

  window.setInterval = function(handler: TimerHandler, timeout?: number, ...args: any[]): ReturnType<typeof setInterval> {
    if (typeof handler === 'string') {
      scriptBlocker.shouldBlockScript('setInterval', handler);
    }
    return originalSetInterval.call(window, handler as (...args: any[]) => void, timeout, ...args as []);
  } as unknown as typeof setInterval;

  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username: string | null = null, password: string | null = null): void {
    if (url.toString().endsWith('.js')) {
      scriptBlocker.shouldBlockScript(url.toString(), '');
    }
    return originalXHROpen.call(this, method, url, async, username, password);
  };

  XMLHttpRequest.prototype.send = function(body?: XMLHttpRequestBodyInit | null): void {
    return originalXHRSend.call(this, body);
  };

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = input instanceof Request ? input.url : input.toString();
    if (url.endsWith('.js')) {
      scriptBlocker.shouldBlockScript(url, '');
    }
    return originalFetch.call(window, input, init);
  };
}

export class ScriptInterceptor {
  private static instance: ScriptInterceptor;
  private scriptBlocker: ScriptBlocker;
  private originalCreateElement: typeof document.createElement = document.createElement;
  private originalSetAttribute: typeof Element.prototype.setAttribute = Element.prototype.setAttribute;
  private originalAppendChild: typeof Node.prototype.appendChild = Node.prototype.appendChild;
  private originalInsertBefore: typeof Node.prototype.insertBefore = Node.prototype.insertBefore;
  private originalReplaceChild: typeof Node.prototype.replaceChild = Node.prototype.replaceChild;
  private _isRunning: boolean = false;

  private constructor(scriptBlocker: ScriptBlocker) {
    this.scriptBlocker = scriptBlocker;
  }

  public static getInstance(): ScriptInterceptor {
    if (!ScriptInterceptor.instance) {
      ScriptInterceptor.instance = new ScriptInterceptor(ScriptBlocker.getInstance());
    }
    return ScriptInterceptor.instance;
  }

  public static createInstance(scriptBlocker: ScriptBlocker): ScriptInterceptor {
    return new ScriptInterceptor(scriptBlocker);
  }

  public start(): void {
    if (this._isRunning) return;
    this._isRunning = true;

    // Store original methods
    this.originalCreateElement = document.createElement;
    this.originalSetAttribute = Element.prototype.setAttribute;
    this.originalAppendChild = Node.prototype.appendChild;
    this.originalInsertBefore = Node.prototype.insertBefore;
    this.originalReplaceChild = Node.prototype.replaceChild;

    // Set up interceptors
    this.interceptCreateElement();
    this.interceptSetAttribute();
    this.interceptAppendChild();
    this.interceptInsertBefore();
    this.interceptReplaceChild();
    interceptGlobalMethods(this.scriptBlocker);
  }

  public stop(): void {
    if (!this._isRunning) return;
    this._isRunning = false;

    // Restore original methods
    document.createElement = this.originalCreateElement;
    Element.prototype.setAttribute = this.originalSetAttribute;
    Node.prototype.appendChild = this.originalAppendChild;
    Node.prototype.insertBefore = this.originalInsertBefore;
    Node.prototype.replaceChild = this.originalReplaceChild;
  }

  private interceptCreateElement(): void {
    const self = this;
    document.createElement = function(tagName: string, options?: ElementCreationOptions): HTMLElement {
      const element = self.originalCreateElement.call(document, tagName, options);
      if (tagName.toLowerCase() === 'script') {
        const script = element as HTMLScriptElement;
        Promise.resolve().then(() => interceptScriptElement(script, self.scriptBlocker));
      }
      return element;
    };
  }

  private interceptSetAttribute(): void {
    const self = this;
    Element.prototype.setAttribute = function(name: string, value: string): void {
      self.originalSetAttribute.call(this, name, value);
      if (this instanceof HTMLScriptElement) {
        const script = this as HTMLScriptElement;
        Promise.resolve().then(() => interceptScriptElement(script, self.scriptBlocker));
      }
    };
  }

  private interceptAppendChild(): void {
    const self = this;
    Node.prototype.appendChild = function<T extends Node>(newChild: T): T {
      if (newChild instanceof HTMLScriptElement) {
        Promise.resolve().then(() => interceptScriptElement(newChild as HTMLScriptElement, self.scriptBlocker));
      }
      return self.originalAppendChild.call(this, newChild) as T;
    };
  }

  private interceptInsertBefore(): void {
    const self = this;
    Node.prototype.insertBefore = function<T extends Node>(newChild: T, refChild: Node | null): T {
      if (newChild instanceof HTMLScriptElement) {
        Promise.resolve().then(() => interceptScriptElement(newChild as HTMLScriptElement, self.scriptBlocker));
      }
      return self.originalInsertBefore.call(this, newChild, refChild) as T;
    };
  }

  private interceptReplaceChild(): void {
    const self = this;
    Node.prototype.replaceChild = function<T extends Node>(newChild: Node, oldChild: T): T {
      if (newChild instanceof HTMLScriptElement) {
        Promise.resolve().then(() => interceptScriptElement(newChild as HTMLScriptElement, self.scriptBlocker));
      }
      return self.originalReplaceChild.call(this, newChild, oldChild) as T;
    };
  }
} 