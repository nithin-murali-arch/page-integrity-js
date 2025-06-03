import { ScriptBlocker } from './script-blocker';
import { TrustedScript, TrustedURL } from '../types';

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

  // Intercept eval
  const originalEval = window.eval;
  window.eval = async function(code: TrustedScript | string): Promise<any> {
    const codeStr = String(code);
    const result = await scriptBlocker.shouldBlockScript('eval', codeStr);
    if (result.blocked) {
      console.warn(`Blocked eval: ${result.reason}`);
      return undefined;
    }
    // Pass the original code to the original eval
    return originalEval.call(window, code);
  };

  // Intercept Function constructor
  const originalFunction = window.Function;
  window.Function = function(...args: (TrustedScript | string)[]): Function {
    // Get the function body (last argument)
    const body = args[args.length - 1];
    const bodyStr = String(body);
    
    // Create the function first
    const fn = originalFunction.apply(window, args);
    
    // Wrap it to check on execution
    return function(this: any, ...execArgs: any[]) {
      // Check if the function body should be blocked
      scriptBlocker.shouldBlockScript('Function', bodyStr).then(result => {
        if (result.blocked) {
          console.warn(`Blocked Function execution: ${result.reason}`);
          throw new Error(`Blocked function execution: ${result.reason}`);
        }
      });
      
      // Call the original function
      return fn.apply(this, execArgs);
    } as unknown as Function;
  } as any;

  // Intercept setTimeout
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = async function(handler: TimerHandler, timeout?: number, ...args: unknown[]): Promise<NodeJS.Timeout> {
    if (typeof handler === 'string' || typeof handler === 'object') {
      const handlerStr = String(handler);
      const result = await scriptBlocker.shouldBlockScript('setTimeout', handlerStr);
      if (result.blocked) {
        console.warn(`Blocked setTimeout: ${result.reason}`);
        return 0 as unknown as NodeJS.Timeout;
      }
    }
    // Pass the original handler to the original setTimeout
    // @ts-ignore - TypeScript is too strict about timer function arguments
    return originalSetTimeout(handler, timeout, ...args) as unknown as NodeJS.Timeout;
  } as unknown as typeof setTimeout;

  // Intercept setInterval
  const originalSetInterval = window.setInterval;
  window.setInterval = async function(handler: TimerHandler, timeout?: number, ...args: unknown[]): Promise<NodeJS.Timeout> {
    if (typeof handler === 'string' || typeof handler === 'object') {
      const handlerStr = String(handler);
      const result = await scriptBlocker.shouldBlockScript('setInterval', handlerStr);
      if (result.blocked) {
        console.warn(`Blocked setInterval: ${result.reason}`);
        return 0 as unknown as NodeJS.Timeout;
      }
    }
    // Pass the original handler to the original setInterval
    // @ts-ignore - TypeScript is too strict about timer function arguments
    return originalSetInterval(handler, timeout, ...args) as unknown as NodeJS.Timeout;
  } as unknown as typeof setInterval;

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = async function(method: string, url: string | URL | TrustedURL, async: boolean = true, username: string | null = null, password: string | null = null): Promise<void> {
    const urlStr = String(url);
    if (urlStr.endsWith('.js')) {
      const result = await scriptBlocker.shouldBlockScript(urlStr, '');
      if (result.blocked) {
        throw new Error(`Blocked script: ${result.reason}`);
      }
    }
    // Pass the original url to the original open
    return originalXHROpen.call(this, method, url, async, username, password);
  };

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL | TrustedURL, init?: RequestInit): Promise<Response> {
    let url: string;
    if (input instanceof Request) {
      url = String(input.url);
    } else {
      url = String(input);
    }
    if (url.endsWith('.js')) {
      const result = await scriptBlocker.shouldBlockScript(url, '');
      if (result.blocked) {
        throw new Error(`Blocked script: ${result.reason}`);
      }
    }
    // Pass the original input to the original fetch
    return originalFetch.call(window, input, init);
  };
}

/**
 * Manages script interception and monitoring.
 */
export class ScriptInterceptor {
  private scriptBlocker: ScriptBlocker;
  private isStarted: boolean = false;

  public constructor(scriptBlocker: ScriptBlocker) {
    this.scriptBlocker = scriptBlocker;
  }

  public static createInstance(scriptBlocker: ScriptBlocker): ScriptInterceptor {
    return new ScriptInterceptor(scriptBlocker);
  }

  public start(): void {
    if (this.isStarted) {
      return;
    }
    this.isStarted = true;
    interceptGlobalMethods(this.scriptBlocker);
  }

  public stop(): void {
    this.isStarted = false;
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

  const srcStr = String(src || 'inline');
  const contentStr = String(content);

  const result = await scriptBlocker.shouldBlockScript(srcStr, contentStr);
  if (result.blocked) {
    console.warn(`Blocked script: ${result.reason}`);
    script.remove();
  }
} 