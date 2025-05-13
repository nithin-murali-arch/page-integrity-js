import { BlockedEventInfo, PageIntegrityConfig, ScriptSource } from './types';

export class ScriptBlocker {
  private config: PageIntegrityConfig;
  private blockedOrigins!: Set<string> | null;
  private whitelistedOrigins!: Set<string> | null;
  private readonly originalCreateElement: typeof document.createElement;
  private readonly originalAppendChild: typeof Node.prototype.appendChild;
  private readonly originalInnerHTML: PropertyDescriptor;
  private isPatched = false;

  constructor(config: PageIntegrityConfig) {
    this.config = config;
    this.setOriginsFromConfig(config);
    this.originalCreateElement = document.createElement;
    this.originalAppendChild = Node.prototype.appendChild;
    this.originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')!;
    this.monitorEval();
  }

  private setOriginsFromConfig(config: PageIntegrityConfig) {
    this.blockedOrigins = (config.blacklistedHosts && config.blacklistedHosts.length > 0)
      ? new Set(config.blacklistedHosts)
      : null;
    this.whitelistedOrigins = (config.whitelistedHosts && config.whitelistedHosts.length > 0)
      ? new Set(config.whitelistedHosts)
      : null;
  }

  public updateConfig(newConfig: PageIntegrityConfig): void {
    Object.assign(this.config, newConfig);
    this.setOriginsFromConfig(this.config);
  }

  private getConfig() {
    return this.config;
  }

  // Monitor eval usage
  private monitorEval(): void {
    const self = this;
    const originalEval = window.eval;
    window.eval = function(...args: any[]) {
      if (self.config.onBlocked) {
        const stack = new Error().stack || '';
        self.config.onBlocked({
          type: 'dynamic-inline',
          target: document.documentElement,
          stackTrace: stack,
          context: { source: 'eval' as any, origin: window.location.origin }
        });
      } else {
        console.warn('Eval usage detected:', args);
      }
      return originalEval(typeof args[0] === 'string' ? args[0] : '');
    };
  }

  public checkAndBlockScript(script: HTMLScriptElement): boolean {
    // Inline scripts are always allowed
    if (!script.src && script.textContent) {
      return false;
    }

    if (script.src) {
      try {
        const scriptUrl = new URL(script.src, window.location.origin);
        const hostname = scriptUrl.hostname;
        // 1. Ignore whitelisted
        if (this.whitelistedOrigins && this.whitelistedOrigins.has(hostname)) {
          return false; // Do nothing, not even callback
        }
        // 2. Block blacklisted
        if (this.blockedOrigins && this.blockedOrigins.has(hostname)) {
          this.handleUnauthorizedExecution('blacklisted', script, {
            source: 'external',
            origin: scriptUrl.origin
          });
          script.remove();
          return true;
        }
        // 3. Call callback for unknown (not whitelisted, not blacklisted), only for absolute URLs and not localhost
        if ((scriptUrl.protocol === 'http:' || scriptUrl.protocol === 'https:') && scriptUrl.hostname !== window.location.hostname) {
          if (!script.hasAttribute('data-pi-checked')) {
            script.setAttribute('data-pi-checked', '1');
            if (this.config.onBlocked) {
              this.config.onBlocked({
                type: 'unknown-origin',
                target: script,
                stackTrace: new Error().stack || '',
                context: {
                  source: 'external',
                  origin: scriptUrl.origin
                }
              });
            }
          }
        }
        return false;
      } catch (e) {
        console.warn(`Failed to validate script URL: ${script.src}`);
        return false; // Skip callback for invalid URLs
      }
    }
    return false;
  }

  private setupCreateElementBlocking(): void {
    // No blocking here, just return the element
    const self = this;
    document.createElement = function(tagName: string, options?: ElementCreationOptions): HTMLElement {
      return self.originalCreateElement.call(document, tagName, options);
    };
  }

  private setupAppendChildBlocking(): void {
    const self = this;
    Element.prototype.appendChild = function<T extends Node>(newChild: T): T {
      if (newChild instanceof HTMLScriptElement) {
        const script = newChild;
        if (self.checkAndBlockScript(script)) {
          return newChild;
        }
      }
      return self.originalAppendChild.call(this, newChild) as T;
    };
  }

  private setupInnerHTMLBlocking(): void {
    const self = this;
    const originalSet = this.originalInnerHTML?.set;
    const originalGet = this.originalInnerHTML?.get;

    if (!originalSet || !originalGet) {
      console.warn('innerHTML getter/setter not found');
      return;
    }

    Object.defineProperty(Element.prototype, 'innerHTML', {
      set(html: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const scripts = doc.getElementsByTagName('script');

        for (let i = 0; i < scripts.length; i++) {
          const script = scripts[i];
          if (self.checkAndBlockScript(script)) {
            script.remove();
          }
        }

        originalSet.call(this, html);
      },
      get: originalGet
    });
  }

  private handleUnauthorizedExecution(
    type: BlockedEventInfo['type'],
    target: Element | HTMLScriptElement,
    context: BlockedEventInfo['context']
  ): void {
    const stack = new Error().stack || '';
    const info: BlockedEventInfo = {
      type,
      target,
      stackTrace: stack,
      context
    };

    this.config.onBlocked?.(info);

    if (target instanceof HTMLScriptElement) {
      target.remove();
    }
  }

  public setupBlocking(): void {
    if (this.isPatched) return;
    this.isPatched = true;
    if (!this.config.skipCreateElementOverride) {
      this.setupCreateElementBlocking();
    }
    this.setupAppendChildBlocking();
    this.setupInnerHTMLBlocking();
  }
} 