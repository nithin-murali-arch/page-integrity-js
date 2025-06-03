import { ScriptBlocker } from './script-blocker';

interface BlockResult {
  blocked: boolean;
  reason?: string;
  analysis?: any;
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
    // Always analyze eval since it's inherently risky
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
    // Always analyze Function constructor since it's inherently risky
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
      // Only analyze string-based timeouts
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
      // Only analyze string-based intervals
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
      // Only analyze JavaScript files
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
      // Only analyze JavaScript files
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
  private _isRunning: boolean = false;

  public constructor(scriptBlocker: ScriptBlocker) {
    this.scriptBlocker = scriptBlocker;
  }

  public static createInstance(scriptBlocker: ScriptBlocker): ScriptInterceptor {
    return new ScriptInterceptor(scriptBlocker);
  }

  public start(): void {
    if (this._isRunning) return;
    this._isRunning = true;
    interceptGlobalMethods(this.scriptBlocker);
  }

  public stop(): void {
    if (!this._isRunning) return;
    this._isRunning = false;
    // Note: We can't easily restore the original methods
    // as they might have been modified by other code
  }
}

/**
 * Intercepts a script element and checks if it should be blocked.
 * @param script The script element to intercept
 * @param scriptBlocker The script blocker instance
 */
export async function interceptScriptElement(script: HTMLScriptElement, scriptBlocker: ScriptBlocker): Promise<void> {
  if (!scriptBlocker) {
    console.error('ScriptBlocker is not initialized');
    return;
  }

  const src = script.src;
  const content = script.textContent || '';

  const result = await scriptBlocker.shouldBlockScript(src || 'inline', content);
  if (result?.blocked) {
    console.warn(`Blocked script: ${result.reason}`);
    script.remove();
  }
} 