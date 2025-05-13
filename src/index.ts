/**
 * Page Integrity JS
 * A library for ensuring webpage content integrity by verifying that content updates
 * come from first-party JavaScript.
 * 
 * @packageDocumentation
 */

// Types
export type MutationType = 'insert' | 'update' | 'remove';
export type ElementType = 'div' | 'span' | 'p' | 'a' | 'img' | 'button';
export type ScriptSource = 'inline' | 'external' | 'extension' | 'unknown';

export interface BlockedEventInfo {
  /** Type of blocked event */
  type: 'extension' | 'dynamic-inline' | 'mutation';
  /** Target element or script that was blocked */
  target: Element | HTMLScriptElement;
  /** Stack trace of the blocked event */
  stackTrace: string;
  /** Additional context about the blocked event */
  context: {
    /** Source of the script if applicable */
    source?: ScriptSource;
    /** Origin of the script if applicable */
    origin?: string;
    /** Mutation type if applicable */
    mutationType?: MutationType;
    /** Script hash if applicable */
    scriptHash?: string;
  };
}

export interface ScriptInfo {
  /** Unique hash identifier for the script */
  hash: string;
  /** Origin of the script */
  origin: string;
  /** Script type (e.g., 'text/javascript') */
  type: string;
  /** Order in which the script was loaded */
  loadOrder: number;
  /** List of script dependencies */
  dependencies: string[];
  /** Source of the script execution */
  source: ScriptSource;
  /** Whether the script is from a Chrome extension */
  isExtension: boolean;
  /** Whether the script is first-party (part of the original HTML) */
  isFirstParty: boolean;
}

export interface MutationContext {
  /** Parent element of the mutated element */
  parentElement: Element | null;
  /** Previous sibling element */
  previousSibling: Element | null;
  /** Next sibling element */
  nextSibling: Element | null;
}

export interface MutationInfo {
  /** Target element that was mutated */
  target: Element;
  /** Type of mutation performed */
  type: MutationType;
  /** Timestamp of the mutation */
  timestamp: number;
  /** Hash of the script that performed the mutation */
  scriptHash: string;
  /** Context information about the mutation */
  context: MutationContext;
}

export interface AllowedMutations {
  /** Allowed HTML element types */
  elementTypes: ElementType[];
  /** Allowed HTML attributes */
  attributes: string[];
  /** Regex patterns for allowed attributes */
  patterns: RegExp[];
}

export interface PageIntegrityConfig {
  /** Whether to enforce strict validation of all mutations */
  strictMode?: boolean;
  /** List of trusted hosts allowed to modify content */
  whitelistedHosts?: string[];
  /** Configuration for allowed mutations */
  allowedMutations?: AllowedMutations;
  /** Whether to block Chrome extensions */
  blockExtensions?: boolean;
  /** Whether to allow dynamically added inline scripts */
  allowDynamicInline?: boolean;
  /** Callback function for blocked events */
  onBlocked?: (info: BlockedEventInfo) => void;
}

class PageIntegrity {
  private readonly contentUpdates: Map<Element, MutationInfo[]>;
  private readonly scriptRegistry: Map<string, ScriptInfo>;
  private readonly allowedOrigins: Set<string>;
  private readonly config: Required<PageIntegrityConfig>;
  private isMonitoring: boolean;
  private loadOrder: number;
  private readonly extensionPatterns: RegExp[] = [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^safari-extension:\/\//,
    /^ms-browser-extension:\/\//,
    /^chrome:\/\//,
    /^moz:\/\//,
    /^safari:\/\//,
    /^ms-browser:\/\//
  ];
  private readonly initialScripts: Set<string>;

  constructor(config: PageIntegrityConfig) {
    this.contentUpdates = new Map();
    this.scriptRegistry = new Map();
    this.isMonitoring = false;
    this.loadOrder = 0;
    this.initialScripts = new Set();

    this.config = {
      strictMode: false,
      whitelistedHosts: [],
      blockExtensions: true,
      allowDynamicInline: false,
      onBlocked: () => {},
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

    this.recordInitialScripts();
    this.initializeScriptRegistry();
  }

  private notifyBlocked(info: BlockedEventInfo): void {
    this.config.onBlocked(info);
  }

  private recordInitialScripts(): void {
    const scripts = document.getElementsByTagName('script');
    Array.from(scripts).forEach(script => {
      const hash = this.calculateScriptHash(script);
      this.initialScripts.add(hash);
    });
  }

  private isExtensionScript(url: string): boolean {
    return this.extensionPatterns.some(pattern => pattern.test(url));
  }

  private getScriptSource(script: HTMLScriptElement): ScriptSource {
    if (this.isExtensionScript(script.src)) {
      return 'extension';
    }
    if (!script.src && script.textContent) {
      return 'inline';
    }
    return 'external';
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
    if (!script.src && !script.textContent) return;

    try {
      const url = script.src ? new URL(script.src) : new URL(window.location.href);
      const hash = this.calculateScriptHash(script);
      const source = this.getScriptSource(script);
      const isExtension = source === 'extension';
      const isFirstParty = this.initialScripts.has(hash) || 
                          this.allowedOrigins.has(url.origin);
      const stack = new Error().stack || '';

      // Block extension scripts if configured
      if (isExtension && this.config.blockExtensions) {
        this.notifyBlocked({
          type: 'extension',
          target: script,
          stackTrace: stack,
          context: {
            source,
            origin: url.origin,
            scriptHash: hash
          }
        });

        if (this.config.strictMode) {
          return;
        }
      }

      // Block dynamic inline scripts if not allowed
      if (source === 'inline' && !isFirstParty && !this.config.allowDynamicInline) {
        this.notifyBlocked({
          type: 'dynamic-inline',
          target: script,
          stackTrace: stack,
          context: {
            source,
            origin: url.origin,
            scriptHash: hash
          }
        });

        if (this.config.strictMode) {
          return;
        }
      }
      
      this.scriptRegistry.set(hash, {
        hash,
        origin: url.origin,
        type: script.type || 'text/javascript',
        loadOrder: this.loadOrder++,
        dependencies: this.extractDependencies(script),
        source,
        isExtension,
        isFirstParty
      });
    } catch (e) {
      console.warn(`Failed to register script: ${script.src || 'inline'}`);
    }
  }

  /**
   * Calculate a hash for the script content
   */
  private calculateScriptHash(script: HTMLScriptElement): string {
    const content = `${script.src}${script.type}${script.textContent}`;
    return btoa(content).slice(0, 32);
  }

  /**
   * Extract script dependencies
   */
  private extractDependencies(script: HTMLScriptElement): string[] {
    const dependencies: string[] = [];
    const content = script.textContent || '';

    const patterns = [
      /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /define\s*\(\s*['"]([^'"]+)['"]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
    }

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
    const stack = new Error().stack || '';

    if (!isAllowed) {
      this.notifyBlocked({
        type: 'mutation',
        target: mutation.target as Element,
        stackTrace: stack,
        context: {
          mutationType: this.getMutationType(mutation),
          scriptHash
        }
      });
    }

    switch (mutation.type) {
      case 'childList':
        this.handleChildListMutation(mutation, scriptHash);
        break;
      case 'attributes':
        if (mutation.target instanceof Element) {
          this.recordUpdate(mutation.target, 'update', scriptHash);
        }
        break;
      case 'characterData':
        if (mutation.target.parentElement) {
          this.recordUpdate(mutation.target.parentElement, 'update', scriptHash);
        }
        break;
    }
  }

  private handleChildListMutation(mutation: MutationRecord, scriptHash: string): void {
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

    if (mutation.target instanceof Element) {
      this.recordUpdate(mutation.target, 'update', scriptHash);
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
    
    // Check for extension execution
    const extensionMatch = stack.match(/chrome-extension:\/\/[^/]+/);
    if (extensionMatch && this.config.blockExtensions && this.config.strictMode) {
      return '';
    }

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
    if (!this.config.allowedMutations?.elementTypes.includes(target.tagName.toLowerCase() as ElementType)) {
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