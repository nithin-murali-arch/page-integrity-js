export interface AnalysisWeights {
  staticAnalysis: number;
  dynamicAnalysis: number;
  originVerification: number;
  hashVerification: number;
}

export interface ScoringRules {
  suspiciousPatterns: number;
  evalUsage: number;
  dynamicScriptCreation: number;
  nonWhitelistedDomain: number;
}

export interface AnalysisConfig {
  minSafeScore: number;
  weights: AnalysisWeights;
  scoringRules: ScoringRules;
}

import { AnalysisConfig as ImportedAnalysisConfig } from './utils/script-analyzer';

export interface PageIntegrityConfig {
  strictMode?: boolean;
  blacklistedHosts?: string[];
  allowDynamicInline?: boolean;
  allowedMutations?: {
    elementTypes: string[];
  };
  onBlocked?: (info: BlockedEventInfo) => void;
  skipCreateElementOverride?: boolean;
  whitelistedHosts?: string[];
  analysisConfig?: ImportedAnalysisConfig;
}

export interface BlockedEventInfo {
  type: 'blacklisted' | 'dynamic-inline' | 'mutation' | 'eval' | 'extension' | 'unknown-origin' | 'low-score';
  target: Element | HTMLScriptElement;
  stackTrace: string;
  context: {
    source?: ScriptSource;
    origin?: string;
    mutationType?: 'insert' | 'update' | 'remove';
    score?: number;
    analysisDetails?: {
      staticScore: number;
      dynamicScore: number;
      originScore: number;
      hashScore: number;
    };
  };
}

export type ScriptSource = 'inline' | 'external' | 'extension' | 'eval' | 'unknown'; 