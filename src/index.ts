/**
 * Page Integrity JS
 * A library for ensuring webpage content integrity by verifying that content updates
 * come from first-party JavaScript.
 * 
 * @packageDocumentation
 */

import { PageIntegrityConfig, BlockedEventInfo } from './types';
import { ScriptBlocker } from './script-blocking';

// Types
export type MutationType = 'insert' | 'update' | 'remove';
export type ElementType = 'div' | 'span' | 'p' | 'a' | 'img' | 'button';
export type ScriptSource = 'inline' | 'external' | 'extension' | 'unknown';

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

  /**
   * Create a new PageIntegrity instance.
   * @param config Configuration options for script and DOM mutation monitoring.
   */
  constructor(config: PageIntegrityConfig) {
    this.config = {
      allowDynamicInline: true,
      ...config
    };
    this.scriptBlocker = new ScriptBlocker(this.config);
    this.scriptBlocker.setupBlocking();
    if (typeof window !== 'undefined') {
      (window as any).PageIntegrity = PageIntegrity;
    }
  }

  /**
   * Update the configuration for script and DOM mutation monitoring.
   * @param newConfig Partial configuration to merge with the current config.
   */
  public updateConfig(newConfig: Partial<PageIntegrityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.scriptBlocker.updateConfig(this.config);
    this.scriptBlocker.setupBlocking();
  }

  /**
   * Stop monitoring the page for unauthorized scripts and DOM mutations.
   */
  public stop(): void {
    // No longer needed as MutationMonitor is removed
  }
}

export * from './types'; 