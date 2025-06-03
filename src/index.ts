/**
 * Page Integrity JS
 * A library for ensuring webpage content integrity by verifying that content updates
 * come from first-party JavaScript.
 * 
 * @packageDocumentation
 */

import { CacheManager } from './utils/cache-manager';
import { ScriptBlocker } from './utils/script-blocker';
import { ScriptInterceptor } from './utils/script-interceptor';
import { 
  PageIntegrityConfig, 
  ScriptInfo, 
  BlockedEventInfo,
  MutationType,
  ElementType,
  ScriptSource
} from './types/index';
import { DEFAULT_ANALYSIS_CONFIG } from './utils/script-analyzer';
import { startScriptBlocking, stopScriptBlocking } from './script-blocking';

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

export function mergeConfig(defaults: Partial<PageIntegrityConfig>, config: Partial<PageIntegrityConfig>): PageIntegrityConfig {
  return {
    strictMode: config.strictMode ?? defaults.strictMode ?? false,
    whiteListedScripts: config.whiteListedScripts ?? defaults.whiteListedScripts ?? [],
    blackListedScripts: config.blackListedScripts ?? defaults.blackListedScripts ?? [],
    analysisConfig: config.analysisConfig ?? defaults.analysisConfig ?? DEFAULT_ANALYSIS_CONFIG
  };
}

export function initScriptBlocker(config: PageIntegrityConfig, cacheManager: CacheManager): ScriptBlocker {
  return new ScriptBlocker(cacheManager, config);
}

export function exposeGlobally(cls: any, name: string): void {
  if (typeof window !== 'undefined') {
    (window as any)[name] = cls;
  }
}

/**
 * Main class for monitoring and enforcing page integrity.
 *
 * Example usage:
 * ```js
 * const pi = new PageIntegrity({
 *   blacklistedHosts: ['evil.com'],
 *   whitelistedHosts: ['trusted.com'],
 *   onBlocked: (info) => { ... }
 * });
 * ```
 */
export class PageIntegrity {
  private config: PageIntegrityConfig;
  private scriptBlocker: ScriptBlocker;
  private cacheManager: CacheManager;
  private scriptInterceptor: ScriptInterceptor;

  /**
   * Create a new PageIntegrity instance.
   * @param config Configuration options for script and DOM mutation monitoring.
   */
  constructor(config: PageIntegrityConfig) {
    this.config = mergeConfig({}, config);
    this.cacheManager = new CacheManager();
    this.scriptBlocker = initScriptBlocker(this.config, this.cacheManager);
    this.scriptInterceptor = new ScriptInterceptor(this.scriptBlocker);
    startScriptBlocking({
      scriptInterceptor: this.scriptInterceptor,
      scriptBlocker: this.scriptBlocker
    });
    exposeGlobally(PageIntegrity, 'PageIntegrity');
  }

  /**
   * Update the configuration for script and DOM mutation monitoring.
   * @param newConfig Partial configuration to merge with the current config.
   */
  public updateConfig(newConfig: Partial<PageIntegrityConfig>): void {
    this.config = mergeConfig(this.config, newConfig);
    this.scriptBlocker = initScriptBlocker(this.config, this.cacheManager);
    this.scriptInterceptor = new ScriptInterceptor(this.scriptBlocker);
    startScriptBlocking({
      scriptInterceptor: this.scriptInterceptor,
      scriptBlocker: this.scriptBlocker
    });
  }

  /**
   * Stop script blocking and cleanup resources.
   */
  public destroy(): void {
    stopScriptBlocking({
      scriptInterceptor: this.scriptInterceptor,
      scriptBlocker: this.scriptBlocker
    });
  }
}

export * from './types';