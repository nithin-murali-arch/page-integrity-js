import { AnalysisConfig, ScriptAnalysis } from '../types/index';
export declare const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig;
export declare function analyzeScript(content: string, config?: AnalysisConfig): ScriptAnalysis;
interface SuspiciousStringMatch {
    type: 'security-bypass' | 'dangerous-extension' | 'attack-pattern' | 'obfuscation';
    pattern: string;
    matches: string[];
    severity: 'high' | 'medium' | 'low';
}
export declare function detectSuspiciousStrings(content: string): SuspiciousStringMatch[];
export {};
