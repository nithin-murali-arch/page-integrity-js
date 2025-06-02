import { ScriptBlocker } from './script-blocker';

interface BlockResult {
  blocked: boolean;
  reason?: string;
  analysis?: any;
}

/**
 * Intercepts a script element and checks if it should be blocked.
 * @param script The script element to check
 * @param scriptBlocker The script blocker instance
 */
export async function interceptScriptElement(script: HTMLScriptElement, scriptBlocker: ScriptBlocker): Promise<void> {
  if (!scriptBlocker) {
    console.error('ScriptBlocker is not initialized');
    return;
  }

  try {
    let result;
    if (script.src) {
      result = await scriptBlocker.shouldBlockScript(script.src, '');
    } else if (script.textContent) {
      result = await scriptBlocker.shouldBlockScript('inline', script.textContent);
    }

    if (result?.blocked) {
      // Remove the script element
      script.remove();
      console.warn(`Blocked script: ${script.src || 'inline'} - ${result.reason}`);
    }
  } catch (error) {
    console.error('Error intercepting script:', error);
  }
}

/**
 * Intercepts global methods that can execute scripts.
 * @param scriptBlocker The script blocker instance
 */
export function interceptGlobalMethods(scriptBlocker: ScriptBlocker): void {
  if (!scriptBlocker) {
    console.error('ScriptBlocker is not initialized');
    return;
  }

  const originalEval = window.eval;
  const originalFunction = Function;
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalFetch = window.fetch;

  window.eval = function(code: string): any {
    const result = scriptBlocker.shouldBlockScript('eval', code);
    if (result instanceof Promise) {
      return result.then((res: BlockResult) => {
        if (res?.blocked) {
          console.warn(`Blocked eval: ${res.reason}`);
          return undefined;
        }
        return originalEval.call(window, code);
      });
    }
    return originalEval.call(window, code);
  };

  Function = function(...args: string[]): Function {
    const code = args[args.length - 1];
    const result = scriptBlocker.shouldBlockScript('Function', code);
    if (result instanceof Promise) {
      console.warn('Async script blocking not supported for Function constructor');
      return function() { return undefined; };
    }
    const blockResult = result as BlockResult;
    if (blockResult?.blocked) {
      console.warn(`Blocked Function: ${blockResult.reason}`);
      return function() { return undefined; };
    }
    return originalFunction.apply(null, args);
  } as any;

  window.setTimeout = function(handler: TimerHandler, timeout?: number, ...args: any[]): ReturnType<typeof setTimeout> {
    if (typeof handler === 'string') {
      const result = scriptBlocker.shouldBlockScript('setTimeout', handler);
      if (result instanceof Promise) {
        const promise = result.then((res: BlockResult) => {
          if (res?.blocked) {
            console.warn(`Blocked setTimeout: ${res.reason}`);
            return 0;
          }
          return originalSetTimeout.call(window, handler as unknown as (...args: any[]) => void, timeout, ...args as []);
        });
        return promise as unknown as ReturnType<typeof setTimeout>;
      }
    }
    return originalSetTimeout.call(window, handler as unknown as (...args: any[]) => void, timeout, ...args as []);
  } as unknown as typeof setTimeout;

  window.setInterval = function(handler: TimerHandler, timeout?: number, ...args: any[]): ReturnType<typeof setInterval> {
    if (typeof handler === 'string') {
      const result = scriptBlocker.shouldBlockScript('setInterval', handler);
      if (result instanceof Promise) {
        const promise = result.then((res: BlockResult) => {
          if (res?.blocked) {
            console.warn(`Blocked setInterval: ${res.reason}`);
            return 0;
          }
          return originalSetInterval.call(window, handler as unknown as (...args: any[]) => void, timeout, ...args as []);
        });
        return promise as unknown as ReturnType<typeof setInterval>;
      }
    }
    return originalSetInterval.call(window, handler as unknown as (...args: any[]) => void, timeout, ...args as []);
  } as unknown as typeof setInterval;

  XMLHttpRequest.prototype.open = async function(method: string, url: string | URL, async: boolean = true, username: string | null = null, password: string | null = null): Promise<void> {
    if (url.toString().endsWith('.js')) {
      try {
        const result = await scriptBlocker.shouldBlockScript(url.toString(), '');
        if (result?.blocked) {
          console.warn(`Blocked XHR: ${result.reason}`);
          throw new Error(`Blocked script: ${result.reason}`);
        }
      } catch (error) {
        console.error('Error in XHR open:', error);
        throw error;
      }
    }
    return originalXHROpen.call(this, method, url, async, username, password);
  };

  XMLHttpRequest.prototype.send = function(body?: XMLHttpRequestBodyInit | null): void {
    return originalXHRSend.call(this, body);
  };

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = input instanceof Request ? input.url : input.toString();
    if (url.endsWith('.js')) {
      try {
        const result = await scriptBlocker.shouldBlockScript(url, '');
        if (result?.blocked) {
          console.warn(`Blocked fetch: ${result.reason}`);
          throw new Error(`Blocked script: ${result.reason}`);
        }
      } catch (error) {
        console.error('Error in fetch:', error);
        throw error;
      }
    }
    return originalFetch.call(window, input, init);
  };
}

/**
 * Manages script interception and monitoring.
 */
export class ScriptInterceptor {
  private scriptBlocker: ScriptBlocker;
  private originalCreateElement: typeof document.createElement;
  private originalSetAttribute: typeof Element.prototype.setAttribute;
  private originalAppendChild: typeof Node.prototype.appendChild;
  private originalInsertBefore: typeof Node.prototype.insertBefore;
  private originalReplaceChild: typeof Node.prototype.replaceChild;
  private _isRunning: boolean = false;

  public constructor(scriptBlocker: ScriptBlocker) {
    this.scriptBlocker = scriptBlocker;
    this.originalCreateElement = document.createElement;
    this.originalSetAttribute = Element.prototype.setAttribute;
    this.originalAppendChild = Node.prototype.appendChild;
    this.originalInsertBefore = Node.prototype.insertBefore;
    this.originalReplaceChild = Node.prototype.replaceChild;
  }

  public static createInstance(scriptBlocker: ScriptBlocker): ScriptInterceptor {
    return new ScriptInterceptor(scriptBlocker);
  }

  public start(): void {
    if (this._isRunning) return;
    this._isRunning = true;

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