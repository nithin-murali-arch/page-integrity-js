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
}

export interface BlockedEventInfo {
  type: 'blacklisted' | 'dynamic-inline' | 'mutation' | 'eval' | 'extension' | 'unknown-origin';
  target: Element | HTMLScriptElement;
  stackTrace: string;
  context: {
    source?: ScriptSource;
    origin?: string;
    mutationType?: 'insert' | 'update' | 'remove';
  };
}

export type ScriptSource = 'inline' | 'external' | 'extension' | 'eval'; 