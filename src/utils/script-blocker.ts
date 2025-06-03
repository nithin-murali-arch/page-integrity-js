import { analyzeScript as analyzeScriptContent, DEFAULT_ANALYSIS_CONFIG } from './script-analyzer';
import { createHash } from './hash';
import { CacheManager } from './cache-manager';
import { PageIntegrityConfig, TrustedScript, TrustedURL } from '../types';

export interface BlockedScript {
  url: TrustedURL | string;
  reason: string;
  analysis?: any;
}

export async function checkCachedResponse(cacheManager: CacheManager, url: TrustedURL | string, content: TrustedScript | string): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
  const hash = createHash(content);
  const cached = await cacheManager.getCachedResponse(hash);
  if (cached && cached.analysis) {
    const score = typeof cached.analysis.score === 'number' ? cached.analysis.score : 0;
    const threats = Array.isArray(cached.analysis.threats) ? cached.analysis.threats : [];
    const isMalicious = score >= 3 || threats.length >= 2;
    return { blocked: isMalicious, reason: cached.reason || 'Cached block', analysis: cached.analysis };
  }
  return { blocked: false };
}

export async function analyzeAndBlockScript(scriptBlocker: ScriptBlocker, url: TrustedURL | string, content: TrustedScript | string): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
  const analysis = analyzeScriptContent(content);
  const config = scriptBlocker['config']?.analysisConfig ?? DEFAULT_ANALYSIS_CONFIG;
  if (analysis.score >= config.minScore || analysis.threats.length >= config.maxThreats) {
    return { blocked: true, reason: 'Malicious script detected', analysis };
  }
  return { blocked: false, analysis };
}

export class ScriptBlocker {
  private cacheManager: CacheManager;
  private blockedScripts: Map<TrustedURL | string, BlockedScript>;
  private config: PageIntegrityConfig;

  public constructor(cacheManager: CacheManager, config: PageIntegrityConfig) {
    this.cacheManager = cacheManager;
    this.blockedScripts = new Map();
    this.config = {
      ...config,
      analysisConfig: config.analysisConfig ?? DEFAULT_ANALYSIS_CONFIG
    };
  }

  public async shouldBlockScript(url: TrustedURL | string, content: TrustedScript | string): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
    // Check if script is blacklisted
    const isBlacklisted = this.config.blackListedScripts?.some(pattern => url.includes(pattern));
    if (isBlacklisted) {
      const blockedInfo = {
        url,
        reason: 'Blacklisted script'
      };
      this.blockedScripts.set(url, blockedInfo);
      this.config.onBlocked?.({
        type: 'script',
        timestamp: Date.now(),
        url,
        source: 'external',
        details: blockedInfo
      });
      return { blocked: true, reason: 'Blacklisted script' };
    }

    // Check if script is whitelisted
    const isWhitelisted = this.config.whiteListedScripts?.some(pattern => url.includes(pattern));
    if (isWhitelisted) {
      this.blockedScripts.set(url, {
        url,
        reason: 'Whitelisted script'
      });
      return { blocked: false, reason: 'Whitelisted script' };
    }

    // Check cache first
    const cached = await checkCachedResponse(this.cacheManager, url, content);
    if (cached.blocked) {
      const blockedInfo = {
        url,
        reason: cached.reason || 'Cached block',
        analysis: cached.analysis
      };
      this.blockedScripts.set(url, blockedInfo);
      this.config.onBlocked?.({
        type: 'script',
        timestamp: Date.now(),
        url,
        source: 'external',
        details: blockedInfo
      });
      return cached;
    }

    // Analyze script for monitoring
    const analysis = analyzeScriptContent(content, this.config.analysisConfig);
    const { minScore, maxThreats } = this.config.analysisConfig ?? DEFAULT_ANALYSIS_CONFIG;
    if (analysis.score >= minScore || analysis.threats.length >= maxThreats) {
      const blockedInfo = {
        url,
        reason: 'Malicious script detected',
        analysis
      };
      this.blockedScripts.set(url, blockedInfo);
      this.config.onBlocked?.({
        type: 'script',
        timestamp: Date.now(),
        url,
        source: 'external',
        details: blockedInfo
      });
      return { blocked: true, reason: 'Malicious script detected', analysis };
    }

    this.blockedScripts.set(url, {
      url,
      reason: 'Script analyzed',
      analysis
    });
    
    return { blocked: false, analysis };
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