/**
 * Core types for Page Integrity JS
 */

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