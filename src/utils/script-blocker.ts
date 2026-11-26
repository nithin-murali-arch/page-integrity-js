import { analyzeScript, DEFAULT_ANALYSIS_CONFIG } from './script-analyzer';
import { PageIntegrityConfig, ScriptAnalysis, TrustedScript, TrustedURL } from '../types';

export interface BlockedScript {
  url: TrustedURL | string;
  reason: string;
  analysis?: any;
}

export interface BlockResult {
  blocked: boolean;
  reason?: string;
  analysis?: ScriptAnalysis;
}

export class ScriptBlocker {
  private blockedScripts: Map<TrustedURL | string, BlockedScript>;
  private config: PageIntegrityConfig;

  public constructor(config: PageIntegrityConfig) {
    this.blockedScripts = new Map();
    this.config = {
      ...config,
      analysisConfig: config.analysisConfig ?? DEFAULT_ANALYSIS_CONFIG
    };
  }

  /**
   * Decides synchronously, so the patched globals can keep their native return values.
   */
  public shouldBlockScript(url: TrustedURL | string, content: TrustedScript | string): BlockResult {
    const isBlacklisted = this.config.blackListedScripts?.some(pattern => url.includes(pattern));
    if (isBlacklisted) {
      return this.block({ url, reason: 'Blacklisted script' });
    }

    const isWhitelisted = this.config.whiteListedScripts?.some(pattern => url.includes(pattern));
    if (isWhitelisted) {
      this.blockedScripts.set(url, {
        url,
        reason: 'Whitelisted script'
      });
      return { blocked: false, reason: 'Whitelisted script' };
    }

    const analysis = analyzeScript(content, this.config.analysisConfig);
    const { minScore, maxThreats } = this.config.analysisConfig ?? DEFAULT_ANALYSIS_CONFIG;
    if (analysis.score >= minScore || analysis.threats.length >= maxThreats) {
      return this.block({ url, reason: 'Malicious script detected', analysis });
    }

    this.blockedScripts.set(url, {
      url,
      reason: 'Script analyzed',
      analysis
    });

    return { blocked: false, analysis };
  }

  private block(blockedInfo: BlockedScript): BlockResult {
    this.blockedScripts.set(blockedInfo.url, blockedInfo);
    this.config.onBlocked?.({
      type: 'script',
      timestamp: Date.now(),
      url: blockedInfo.url,
      source: 'external',
      details: blockedInfo
    });
    return { blocked: true, reason: blockedInfo.reason, analysis: blockedInfo.analysis };
  }

  public isScriptBlocked(url: TrustedURL | string): boolean {
    return this.blockedScripts.has(url);
  }

  public getBlockedScript(url: TrustedURL | string): BlockedScript | undefined {
    return this.blockedScripts.get(url);
  }

  public getAllBlockedScripts(): BlockedScript[] {
    return Array.from(this.blockedScripts.values());
  }

  public clearBlockedScripts(): void {
    this.blockedScripts.clear();
  }

  public getBlockedScriptsCount(): number {
    return this.blockedScripts.size;
  }
}
