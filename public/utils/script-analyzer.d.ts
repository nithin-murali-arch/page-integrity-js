export interface AnalysisConfig {
    minScore: number;
    maxThreats: number;
    checkSuspiciousStrings: boolean;
    weights: {
        evasion: number;
        covertExecution: number;
        securityBypass: number;
        maliciousIntent: number;
    };
    scoringRules: {
        minSafeScore: number;
        maxThreats: number;
        suspiciousStringWeight: number;
    };
}
export declare const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig;
export interface ScriptAnalysis {
    threats: string[];
    score: number;
    details: {
        pattern: string;
        matches: string[];
    }[];
    analysisDetails?: {
        suspiciousStrings?: string[];
        categories?: string[];
        staticScore?: number;
        dynamicScore?: number;
        originScore?: number;
        hashScore?: number;
    };
    isMalicious?: boolean;
}
export declare function analyzeScript(content: string, config?: AnalysisConfig): ScriptAnalysis;
export declare function detectSuspiciousStrings(content: string): string[];
