/**
 * Core types for Page Integrity JS
 */
/** Trusted script content type */
export type TrustedScript = string & {
    __brand: 'TrustedScript';
};
/** Trusted URL type */
export type TrustedURL = string & {
    __brand: 'TrustedURL';
};
/** Source of a script */
export type ScriptSource = 'inline' | 'external' | 'extension' | 'eval' | 'unknown';
/** Type of blocked event */
export type BlockedEventType = 'script' | 'mutation' | 'network' | 'storage' | 'cookie' | 'iframe' | 'worker' | 'websocket' | 'other';
/** Information about a blocked event */
export interface BlockedEventInfo {
    /** Type of blocked event */
    type: BlockedEventType;
    /** Timestamp of the blocked event */
    timestamp: number;
    /** URL of the blocked event */
    url?: TrustedURL | string;
    /** Source of the blocked event */
    source?: string;
    /** Details of the blocked event */
    details?: any;
    /** Context of the blocked event */
    context?: {
        /** Type of element if applicable */
        elementType?: string;
        /** Type of mutation if applicable */
        mutationType?: MutationType;
        /** Source of the script if applicable */
        scriptSource?: ScriptSource;
        /** Additional key-value pairs */
        [key: string]: any;
    };
}
/** Information about a registered script */
export interface ScriptInfo {
    /** URL of the script */
    url: TrustedURL | string;
    /** Content of the script */
    content: TrustedScript | string;
    /** Hash of the script content */
    hash: string;
    /** Source of the script */
    source: ScriptSource;
    /** Whether the script is blocked */
    isBlocked: boolean;
    /** Reason for blocking the script */
    reason?: string;
    /** Timestamp of the script */
    timestamp: number;
    /** Analysis of the script */
    analysis?: {
        /** Score of the script */
        score: number;
        /** Threats identified in the script */
        threats: string[];
        /** Details of the script analysis */
        details: any;
    };
}
/** Threat categories */
export type ThreatCategory = 'evasion' | 'covertExecution' | 'securityBypass' | 'maliciousIntent';
/** Configuration for script analysis */
export interface AnalysisConfig {
    /** Minimum score required for a script to be considered safe */
    minScore: number;
    /** Maximum number of threats allowed in a script */
    maxThreats: number;
    /** Whether to check for suspicious strings in scripts */
    checkSuspiciousStrings: boolean;
    /** Weights for different types of threats */
    weights: Record<ThreatCategory, number>;
    /** Scoring rules for script analysis */
    scoringRules: {
        /** Minimum safe score for a script */
        minSafeScore: number;
        /** Maximum threats allowed in a script */
        maxThreats: number;
        /** Weight for suspicious strings in a script */
        suspiciousStringWeight: number;
    };
}
/** Result of script analysis */
export interface ScriptAnalysis {
    /** List of threats identified in the script */
    threats: string[];
    /** Overall score of the script */
    score: number;
    /** Details of the analysis */
    details: {
        /** Pattern that matched */
        pattern: string;
        /** Matches found */
        matches: string[];
    }[];
    /** Additional analysis details */
    analysisDetails?: {
        /** Suspicious strings found */
        suspiciousStrings?: string[];
        /** Categories of threats */
        categories?: string[];
    };
    /** Whether the script is considered malicious */
    isMalicious?: boolean;
}
/** Configuration for the PageIntegrity library */
export interface PageIntegrityConfig {
    /** Whether to enforce strict validation of all scripts. When enabled, scripts must either be whitelisted or pass analysis to execute.
     * When disabled, only blacklisted scripts are blocked. Default: false */
    strictMode: boolean;
    /** List of trusted script URLs or partial URLs that are allowed to execute without analysis.
     * Can include full URLs (e.g., 'https://trusted.com/script.js') or partial matches (e.g., 'trusted.com').
     * Whitelisted scripts bypass all security checks. Default: [] */
    whiteListedScripts: (TrustedURL | string)[];
    /** List of blocked script URLs or partial URLs that are not allowed to execute under any circumstances.
     * Can include full URLs (e.g., 'https://malicious.com/script.js') or partial matches (e.g., 'malicious.com').
     * Blacklisted scripts are blocked regardless of their content. Default: [] */
    blackListedScripts: (TrustedURL | string)[];
    /** Configuration for script analysis. Controls how scripts are evaluated for potential threats.
     * When not provided, uses the following defaults:
     * ```ts
     * {
     *   minScore: 3,                    // Minimum threat score before a script is considered malicious
     *   maxThreats: Infinity,           // Maximum number of threats allowed (Infinity = no limit)
     *   checkSuspiciousStrings: true,   // Whether to check for known malicious patterns
     *   weights: {                      // Threat category weights for scoring
     *     evasion: 3,                   // Weight for evasion techniques
     *     covertExecution: 3,           // Weight for covert execution attempts
     *     securityBypass: 2,            // Weight for security bypass attempts
     *     maliciousIntent: 2            // Weight for malicious intent indicators
     *   },
     *   scoringRules: {
     *     minSafeScore: 3,              // Minimum score required to be considered safe
     *     maxThreats: Infinity,         // Maximum threats allowed (Infinity = no limit)
     *     suspiciousStringWeight: 1     // Weight for suspicious string matches
     *   }
     * }
     * ```
     */
    analysisConfig?: AnalysisConfig;
    /** Callback function that is called when a script is blocked. Provides detailed information about:
     * - The type of block (script, mutation, etc.)
     * - Timestamp of the block
     * - URL of the blocked script
     * - Source of the script (inline, external, etc.)
     * - Detailed analysis results if available
     * - Context information about the block
     */
    onBlocked?: (info: BlockedEventInfo) => void;
}
/** Information about a blocked script */
export interface BlockedScript {
    /** URL of the blocked script */
    url: TrustedURL | string;
    /** Reason for blocking the script */
    reason: string;
    /** Analysis results if available */
    analysis?: ScriptAnalysis;
}
/** Mutation types */
export type MutationType = 'insert' | 'update' | 'remove';
/** Element types */
export type ElementType = 'div' | 'span' | 'p' | 'a' | 'img' | 'button';
export interface SuspiciousStringMatch {
    type: 'security-bypass' | 'dangerous-extension' | 'attack-pattern' | 'obfuscation';
    pattern: string;
    matches: string[];
    severity: 'high' | 'medium' | 'low';
}
