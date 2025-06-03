/**
 * Core types for Page Integrity JS
 */
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
    url?: string;
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
    url: string;
    /** Content of the script */
    content: string;
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
    /** Whether to enforce strict validation of all scripts */
    strictMode: boolean;
    /** List of trusted script URLs or partial URLs that are allowed to execute */
    whiteListedScripts: string[];
    /** List of blocked script URLs or partial URLs that are not allowed to execute */
    blackListedScripts: string[];
    /** Configuration for script analysis */
    analysisConfig: AnalysisConfig;
    /** Callback function that is called when a script is blocked */
    onBlocked?: (info: BlockedEventInfo) => void;
}
/** Information about a blocked script */
export interface BlockedScript {
    /** URL of the blocked script */
    url: string;
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
