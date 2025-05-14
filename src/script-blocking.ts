import { BlockedEventInfo, BlockedEventType, PageIntegrityConfig, ScriptSource } from './types';
import { createHash } from './utils/hash';
import { sendMessage } from './utils/message';

export class ScriptBlocker {
  private config: PageIntegrityConfig;
  private blockedPatterns!: RegExp[] | null;
  private allowedPatterns!: RegExp[] | null;
  private readonly originalCreateElement: typeof document.createElement;
  private readonly originalAppendChild: typeof Node.prototype.appendChild;
  private readonly originalInnerHTML: PropertyDescriptor;
  private isPatched = false;

  constructor(config: PageIntegrityConfig) {
    this.config = config;
    this.setPatternsFromConfig(config);
    this.originalCreateElement = document.createElement;
    this.originalAppendChild = Node.prototype.appendChild;
    this.originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')!;
    this.monitorEval();
  }

  private setPatternsFromConfig(config: PageIntegrityConfig) {
    // Convert allowed hosts/patterns to RegExp
    this.allowedPatterns = (config.allowedHosts && config.allowedHosts.length > 0)
      ? config.allowedHosts.map(pattern => 
          new RegExp('^' + pattern.replace(/\*/g, '.*') + '$'))
      : null;
    
    // Convert blocked hosts/patterns to RegExp
    this.blockedPatterns = (config.blockedHosts && config.blockedHosts.length > 0)
      ? config.blockedHosts.map(pattern => 
          new RegExp('^' + pattern.replace(/\*/g, '.*') + '$'))
      : null;
  }

  private isChromeExtension(url: string): boolean {
    return url.startsWith('chrome-extension://');
  }

  private matchesPattern(url: string, patterns: RegExp[] | null): boolean {
    if (!patterns) return false;
    return patterns.some(pattern => pattern.test(url));
  }

  public updateConfig(newConfig: PageIntegrityConfig): void {
    Object.assign(this.config, newConfig);
    this.setPatternsFromConfig(this.config);
  }

  private monitorEval(): void {
    const self = this;
    const originalEval = window.eval;
    window.eval = function(...args: any[]) {
      const evalContent = typeof args[0] === 'string' ? args[0] : '';
      const hash = createHash(evalContent);
      sendMessage({ type: 'getUrl', hash })
        .then(response => {
          const url = response.url;
          if (url) {
            if (self.matchesPattern(url, self.allowedPatterns)) {
              originalEval(evalContent);
            } else if (self.matchesPattern(url, self.blockedPatterns)) {
              const stack = new Error().stack || '';
              self.config.onBlocked?.({
                type: 'blocked',
                target: document.documentElement,
                stackTrace: stack,
                context: { source: 'eval', origin: url }
              });
            } else if (self.config.onBlocked) {
              const stack = new Error().stack || '';
              self.config.onBlocked({
                type: 'unknown-origin',
                target: document.documentElement,
                stackTrace: stack,
                context: { source: 'eval', origin: url }
              });
              originalEval(evalContent);
            }
          } else {
            originalEval(evalContent);
          }
        })
        .catch(error => {
          console.error('Error fetching URL:', error);
          originalEval(evalContent);
        });
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
        const fullUrl = scriptUrl.href;

        // Check for Chrome extensions
        if (this.config.blockExtensions && this.isChromeExtension(fullUrl)) {
          this.handleUnauthorizedExecution('extension', script, {
            source: 'external',
            origin: scriptUrl.origin
          });
          script.remove();
          return true;
        }

        // 1. Check if allowed
        if (this.matchesPattern(fullUrl, this.allowedPatterns)) {
          return false; // Do nothing, not even callback
        }

        // 2. Check if blocked
        if (this.matchesPattern(fullUrl, this.blockedPatterns)) {
          this.handleUnauthorizedExecution('blocked', script, {
            source: 'external',
            origin: scriptUrl.origin
          });
          script.remove();
          return true;
        }

        // 3. Report unknown scripts if configured
        if (this.config.reportUnknownScripts && 
            (scriptUrl.protocol === 'http:' || scriptUrl.protocol === 'https:') && 
            scriptUrl.hostname !== window.location.hostname) {
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
    const self = this;
    document.createElement = function(tagName: string, options?: ElementCreationOptions): HTMLElement {
      const element = self.originalCreateElement.call(document, tagName, options);
      
      if (tagName.toLowerCase() === 'script') {
        const script = element as HTMLScriptElement;
        
        // Handle inline scripts
        if (!script.src && script.textContent) {
          const hash = createHash(script.textContent);
          sendMessage({ type: 'getUrl', hash })
            .then(response => {
              const url = response.url;
              if (url) {
                if (self.matchesPattern(url, self.allowedPatterns)) {
                  // Script is allowed, do nothing
                } else if (self.matchesPattern(url, self.blockedPatterns)) {
                  self.handleUnauthorizedExecution('blocked', script, {
                    source: 'inline',
                    origin: url
                  });
                  script.remove();
                } else if (self.config.onBlocked) {
                  self.handleUnauthorizedExecution('unknown-origin', script, {
                    source: 'inline',
                    origin: url
                  });
                }
              }
            })
            .catch(error => {
              console.error('Error validating inline script:', error);
            });
        }
        
        // Handle external scripts
        if (script.src) {
          try {
            const scriptUrl = new URL(script.src, window.location.origin);
            const fullUrl = scriptUrl.href;

            // Check for Chrome extensions
            if (self.config.blockExtensions && self.isChromeExtension(fullUrl)) {
              self.handleUnauthorizedExecution('extension', script, {
                source: 'external',
                origin: scriptUrl.origin
              });
              script.remove();
              return element;
            }

            // Check allowlist/blocklist
            if (self.matchesPattern(fullUrl, self.allowedPatterns)) {
              // Script is allowed, do nothing
            } else if (self.matchesPattern(fullUrl, self.blockedPatterns)) {
              self.handleUnauthorizedExecution('blocked', script, {
                source: 'external',
                origin: scriptUrl.origin
              });
              script.remove();
            } else if (self.config.reportUnknownScripts && 
                      (scriptUrl.protocol === 'http:' || scriptUrl.protocol === 'https:') && 
                      scriptUrl.hostname !== window.location.hostname) {
              if (!script.hasAttribute('data-pi-checked')) {
                script.setAttribute('data-pi-checked', '1');
                if (self.config.onBlocked) {
                  self.handleUnauthorizedExecution('unknown-origin', script, {
                    source: 'external',
                    origin: scriptUrl.origin
                  });
                }
              }
            }
          } catch (e) {
            console.warn(`Failed to validate script URL: ${script.src}`);
          }
        }
      }
      
      return element;
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

  private handleUnauthorizedExecution(type: BlockedEventType, script: HTMLScriptElement, context: { source: ScriptSource; origin: string }) {
    if (this.config.onBlocked) {
      this.config.onBlocked({
        type,
        target: script,
        stackTrace: new Error().stack || '',
        context
      });
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