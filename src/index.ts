/**
 * Page Integrity JS - A library to ensure webpage content integrity
 * by verifying that content updates come from first-party JavaScript.
 */

interface ScriptInfo {
  hash: string;
  origin: string;
  type: string;
  loadOrder: number;
  dependencies: string[];
}

interface MutationInfo {
  target: Element;
  type: 'insert' | 'update' | 'remove';
  timestamp: number;
  scriptHash: string;
  context: {
    parentElement: Element | null;
    previousSibling: Element | null;
    nextSibling: Element | null;
  };
}

interface PageIntegrityConfig {
  whitelistedHosts: string[];
  strictMode?: boolean;
  allowedMutations?: {
    elementTypes: string[];
    attributes: string[];
    patterns: RegExp[];
  };
}

class PageIntegrity {
  private contentUpdates: Map<Element, MutationInfo[]> = new Map();
  private isMonitoring: boolean = false;
  private allowedOrigins: Set<string>;
  private config: PageIntegrityConfig;
  private scriptRegistry: Map<string, ScriptInfo> = new Map();
  private mutationWhitelist: Set<string> = new Set();
  private loadOrder: number = 0;

  constructor(config: PageIntegrityConfig) {
    this.config = {
      strictMode: false,
      allowedMutations: {
        elementTypes: ['div', 'span', 'p', 'a', 'img', 'button'],
        attributes: ['class', 'style', 'src', 'href', 'alt'],
        patterns: [/^data-[a-z-]+$/]
      },
      ...config
    };
    this.allowedOrigins = new Set([
      window.location.origin,
      ...this.config.whitelistedHosts
    ]);
    this.initializeScriptRegistry();
  }

  /**
   * Initialize script registry by analyzing all scripts in the document
   */
  private initializeScriptRegistry(): void {
    const scripts = document.getElementsByTagName('script');
    Array.from(scripts).forEach(script => {
      this.registerScript(script);
    });

    // Monitor for new script additions
    this.monitorScriptAdditions();
  }

  /**
   * Register a script in the registry
   */
  private registerScript(script: HTMLScriptElement): void {
    if (!script.src) return;

    try {
      const url = new URL(script.src);
      const hash = this.calculateScriptHash(script);
      
      this.scriptRegistry.set(hash, {
        hash,
        origin: url.origin,
        type: script.type || 'text/javascript',
        loadOrder: this.loadOrder++,
        dependencies: this.extractDependencies(script)
      });
    } catch (e) {
      console.warn(`Failed to register script: ${script.src}`);
    }
  }

  /**
   * Calculate a hash for the script content
   */
  private calculateScriptHash(script: HTMLScriptElement): string {
    // In a real implementation, this would use a proper hashing algorithm
    // For now, we'll use a simple string-based hash
    const content = script.src + script.type + script.textContent;
    return btoa(content).slice(0, 32);
  }

  /**
   * Extract script dependencies
   */
  private extractDependencies(script: HTMLScriptElement): string[] {
    const dependencies: string[] = [];
    const content = script.textContent || '';

    // Look for common dependency patterns
    const patterns = [
      /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /define\s*\(\s*['"]([^'"]+)['"]/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
    });

    return dependencies;
  }

  /**
   * Monitor for new script additions
   */
  private monitorScriptAdditions(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'SCRIPT') {
            this.registerScript(node as HTMLScriptElement);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Start monitoring DOM changes
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.handleMutation(mutation);
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    this.isMonitoring = true;
  }

  /**
   * Handle a DOM mutation
   */
  private handleMutation(mutation: MutationRecord): void {
    const scriptHash = this.getExecutingScriptHash();
    const isAllowed = this.isAllowedMutation(mutation, scriptHash);

    if (!isAllowed) {
      console.warn('Content update detected from unauthorized source:', {
        target: mutation.target,
        type: mutation.type,
        scriptHash
      });
    }

    // Handle childList mutations
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) {
          this.recordUpdate(node, 'insert', scriptHash);
        }
      });
      mutation.removedNodes.forEach(node => {
        if (node instanceof Element) {
          this.recordUpdate(node, 'remove', scriptHash);
        }
      });
      // Also record update for the parent element
      if (mutation.target instanceof Element) {
        this.recordUpdate(mutation.target, 'update', scriptHash);
      }
    }
    // Handle attribute mutations
    else if (mutation.type === 'attributes' && mutation.target instanceof Element) {
      this.recordUpdate(mutation.target, 'update', scriptHash);
    }
    // Handle characterData mutations
    else if (mutation.type === 'characterData' && mutation.target.parentElement) {
      this.recordUpdate(mutation.target.parentElement, 'update', scriptHash);
    }
  }

  private recordUpdate(target: Element, type: 'insert' | 'update' | 'remove', scriptHash: string): void {
    const update: MutationInfo = {
      target,
      type,
      timestamp: Date.now(),
      scriptHash,
      context: {
        parentElement: target.parentElement,
        previousSibling: target.previousElementSibling,
        nextSibling: target.nextElementSibling
      }
    };

    const updates = this.contentUpdates.get(target) || [];
    updates.push(update);
    this.contentUpdates.set(target, updates);
  }

  /**
   * Get the hash of the currently executing script
   */
  private getExecutingScriptHash(): string {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    
    for (const line of lines) {
      for (const [hash, info] of this.scriptRegistry) {
        if (line.includes(info.origin)) {
          return hash;
        }
      }
    }

    return '';
  }

  /**
   * Check if a mutation is allowed
   */
  private isAllowedMutation(mutation: MutationRecord, scriptHash: string): boolean {
    if (!this.config.strictMode) {
      return true;
    }

    // Check if the script is registered
    const scriptInfo = this.scriptRegistry.get(scriptHash);
    if (!scriptInfo) {
      return false;
    }

    // Check if the script is from an allowed origin
    if (!this.allowedOrigins.has(scriptInfo.origin)) {
      return false;
    }

    // Check if the mutation type is allowed
    const mutationType = this.getMutationType(mutation);
    const target = mutation.target as Element;

    // Check element type
    if (!this.config.allowedMutations?.elementTypes.includes(target.tagName.toLowerCase())) {
      return false;
    }

    // Check attributes
    if (mutation.type === 'attributes') {
      const attributeName = mutation.attributeName;
      if (!attributeName) return false;

      const isAllowedAttribute = 
        this.config.allowedMutations.attributes.includes(attributeName) ||
        this.config.allowedMutations.patterns.some(pattern => pattern.test(attributeName));

      if (!isAllowedAttribute) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the type of mutation
   */
  private getMutationType(mutation: MutationRecord): 'insert' | 'update' | 'remove' {
    switch (mutation.type) {
      case 'childList':
        if (mutation.addedNodes.length > 0) return 'insert';
        if (mutation.removedNodes.length > 0) return 'remove';
        return 'update';
      case 'attributes':
        return 'update';
      case 'characterData':
        return 'update';
      default:
        return 'update';
    }
  }

  /**
   * Get all content updates for a specific element
   */
  public getContentUpdates(element: Element): MutationInfo[] {
    return this.contentUpdates.get(element) || [];
  }

  /**
   * Clear all recorded content updates
   */
  public clearContentUpdates(): void {
    this.contentUpdates.clear();
  }

  /**
   * Get current configuration
   */
  public getConfig(): PageIntegrityConfig {
    return { ...this.config };
  }

  /**
   * Get script registry
   */
  public getScriptRegistry(): Map<string, ScriptInfo> {
    return new Map(this.scriptRegistry);
  }
}

export default PageIntegrity; 