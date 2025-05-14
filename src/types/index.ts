/**
 * Core types for Page Integrity JS
 */

/** Type of mutation that occurred */
export type MutationType = 'insert' | 'update' | 'remove';

/** Type of HTML element that can be modified */
export type ElementType = 'div' | 'span' | 'p' | 'a' | 'img' | 'button';

/** Source of a script */
export type ScriptSource = 'inline' | 'external' | 'extension' | 'unknown';

/** Type of blocked event */
export type BlockedEventType = 
  | 'extension'
  | 'pattern-match'
  | 'blocked'
  | 'unknown-origin'
  | 'dynamic-inline'
  | 'eval';

/** Information about a blocked event */
export interface BlockedEventInfo {
  /** Type of blocked event */
  type: BlockedEventType;
  /** Target element or script that was blocked */
  target: Element | HTMLScriptElement;
  /** Stack trace of the blocked event */
  stackTrace: string;
  /** Additional context about the blocked event */
  context: {
    /** Source of the script if applicable */
    source: ScriptSource;
    /** Origin of the script if applicable */
    origin: string;
  };
}

/** Information about a registered script */
export interface ScriptInfo {
  /** Hash of the script content */
  hash: string;
  /** Origin of the script */
  origin: string;
  /** Type of the script */
  type: string;
  /** Order in which the script was loaded */
  loadOrder: number;
  /** Dependencies of the script */
  dependencies: string[];
  /** Source of the script */
  source: ScriptSource;
  /** Whether the script is from an extension */
  isExtension: boolean;
  /** Whether the script is from a first-party source */
  isFirstParty: boolean;
}

/** Context information for a mutation */
export interface MutationContext {
  /** Parent element of the mutated element */
  parentElement: Element | null;
  /** Previous sibling of the mutated element */
  previousSibling: Element | null;
  /** Next sibling of the mutated element */
  nextSibling: Element | null;
}

/** Information about a mutation */
export interface MutationInfo {
  /** Target element that was mutated */
  target: Element;
  /** Type of mutation */
  type: MutationType;
  /** Timestamp of the mutation */
  timestamp: number;
  /** Hash of the script that caused the mutation */
  scriptHash: string;
  /** Context information about the mutation */
  context: MutationContext;
}

/** Configuration for allowed mutations */
export interface AllowedMutations {
  /** Types of elements that can be modified */
  elementTypes: ElementType[];
  /** Attributes that can be modified */
  attributes: string[];
  /** Patterns for allowed attributes */
  patterns: RegExp[];
}

/** Configuration for the PageIntegrity library */
export interface PageIntegrityConfig {
  /** Whether to enforce strict validation of all mutations */
  strictMode?: boolean;
  /** List of trusted hosts and patterns allowed to modify content */
  allowedHosts?: string[];
  /** List of blocked hosts and patterns that are not allowed to execute */
  blockedHosts?: string[];
  /** Whether to block Chrome extensions */
  blockExtensions?: boolean;
  /** Whether to allow dynamically added inline scripts */
  allowDynamicInline?: boolean;
  /** Callback function for blocked events */
  onBlocked?: (info: BlockedEventInfo) => void;
  /** Skip createElement override */
  skipCreateElementOverride?: boolean;
  /** Whether to report scripts not in either allowlist or blocklist */
  reportUnknownScripts?: boolean;
} 