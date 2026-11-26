import { ScriptBlocker } from './script-blocker';

interface Patch {
  target: any;
  key: string;
  original: unknown;
}

const BLOCKED_SCRIPT_TYPE = 'javascript/blocked';

/** `insertedArgs` is how many leading arguments are nodes being inserted; the rest are reference nodes. */
const INSERTION_METHODS: { target: () => any; methods: string[]; insertedArgs: number }[] = [
  { target: () => Node.prototype, methods: ['appendChild', 'insertBefore', 'replaceChild'], insertedArgs: 1 },
  { target: () => Element.prototype, methods: ['append', 'prepend', 'before', 'after', 'replaceWith'], insertedArgs: Infinity }
];

function isExecutableType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  return normalized === '' || normalized === 'module' || normalized.includes('javascript') || normalized.includes('ecmascript');
}

/**
 * Checks a script element before it is inserted. A blocked script gets a non-executable
 * `type`, so the browser neither fetches nor runs it once it is in the document.
 * @returns whether the script was blocked
 */
export function interceptScriptElement(script: HTMLScriptElement, scriptBlocker: ScriptBlocker): boolean {
  if (!isExecutableType(script.type)) {
    return false;
  }
  const url = script.src || 'inline';
  const result = scriptBlocker.shouldBlockScript(url, script.src ? '' : script.text);
  if (result.blocked) {
    console.warn(`Blocked script: ${url} - ${result.reason}`);
    script.type = BLOCKED_SCRIPT_TYPE;
  }
  return result.blocked;
}

function interceptInsertedNode(node: unknown, scriptBlocker: ScriptBlocker): void {
  if (node instanceof HTMLScriptElement) {
    interceptScriptElement(node, scriptBlocker);
  } else if (node instanceof Element || node instanceof DocumentFragment) {
    node.querySelectorAll('script').forEach(script => interceptScriptElement(script, scriptBlocker));
  }
}

/**
 * Replaces the globals that can run script text or load script URLs, and the DOM methods
 * that insert script elements. `stop()` puts every original back.
 */
export class ScriptInterceptor {
  private scriptBlocker: ScriptBlocker;
  private patches: Patch[] = [];

  public constructor(scriptBlocker: ScriptBlocker) {
    this.scriptBlocker = scriptBlocker;
  }

  public static createInstance(scriptBlocker: ScriptBlocker): ScriptInterceptor {
    return new ScriptInterceptor(scriptBlocker);
  }

  public start(): void {
    if (this.patches.length > 0) {
      return;
    }
    const blocker = this.scriptBlocker;

    this.patch(window, 'eval', (originalEval: typeof eval) => function(code: unknown): unknown {
      const result = blocker.shouldBlockScript('eval', String(code));
      if (result.blocked) {
        console.warn(`Blocked eval: ${result.reason}`);
        return undefined;
      }
      return originalEval.call(window, code as string);
    });

    this.patch(window, 'Function', (OriginalFunction: FunctionConstructor) => {
      const PatchedFunction = function(...args: string[]): Function {
        const result = blocker.shouldBlockScript('Function', String(args[args.length - 1] ?? ''));
        if (result.blocked) {
          console.warn(`Blocked Function: ${result.reason}`);
          throw new EvalError(`Blocked function creation: ${result.reason}`);
        }
        return OriginalFunction(...args);
      };
      PatchedFunction.prototype = OriginalFunction.prototype;
      return PatchedFunction;
    });

    for (const name of ['setTimeout', 'setInterval'] as const) {
      this.patch(window, name, (originalTimer: typeof setTimeout) => function(handler: TimerHandler, timeout?: number, ...args: unknown[]): number {
        if (typeof handler === 'string' || typeof handler === 'object') {
          const result = blocker.shouldBlockScript(name, String(handler));
          if (result.blocked) {
            console.warn(`Blocked ${name}: ${result.reason}`);
            return 0;
          }
        }
        return (originalTimer as (...a: unknown[]) => number).call(window, handler, timeout, ...args);
      });
    }

    this.patch(XMLHttpRequest.prototype, 'open', (originalOpen: XMLHttpRequest['open']) => function(this: XMLHttpRequest, ...args: Parameters<XMLHttpRequest['open']>): void {
      const url = String(args[1]);
      if (url.endsWith('.js')) {
        const result = blocker.shouldBlockScript(url, '');
        if (result.blocked) {
          throw new Error(`Blocked script: ${result.reason}`);
        }
      }
      return (originalOpen as (...a: unknown[]) => void).apply(this, args);
    });

    this.patch(window, 'fetch', (originalFetch: typeof fetch) => function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith('.js')) {
        const result = blocker.shouldBlockScript(url, '');
        if (result.blocked) {
          return Promise.reject(new Error(`Blocked script: ${result.reason}`));
        }
      }
      return originalFetch.call(window, input, init);
    });

    for (const { target, methods, insertedArgs } of INSERTION_METHODS) {
      for (const method of methods) {
        this.patch(target(), method, (original: (...a: unknown[]) => unknown) => function(this: Node, ...args: unknown[]): unknown {
          args.slice(0, insertedArgs).forEach(node => interceptInsertedNode(node, blocker));
          return original.apply(this, args);
        });
      }
    }
  }

  public stop(): void {
    for (const { target, key, original } of this.patches.reverse()) {
      target[key] = original;
    }
    this.patches = [];
  }

  private patch<T>(target: any, key: string, wrap: (original: T) => unknown): void {
    const original = target[key] as T;
    this.patches.push({ target, key, original });
    target[key] = wrap(original);
  }
}
