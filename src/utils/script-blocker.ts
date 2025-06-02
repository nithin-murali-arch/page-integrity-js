import { analyzeScript as analyzeScriptContent } from './script-analyzer';
import { createHash } from './hash';
import { CacheManager } from './cache-manager';
import { PageIntegrityConfig } from '../types';

export interface BlockedScript {
  url: string;
  reason: string;
  analysis?: any;
}

export async function checkCachedResponse(cacheManager: CacheManager, url: string, content: string): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
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

export async function analyzeAndBlockScript(scriptBlocker: ScriptBlocker, url: string, content: string): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
  const analysis = analyzeScriptContent(content);
  const config = scriptBlocker['config']?.analysisConfig;
  if (!config) {
    return { blocked: false, analysis };
  }
  if (analysis.score >= config.minScore || analysis.threats.length >= config.maxThreats) {
    return { blocked: true, reason: 'Malicious script detected', analysis };
  }
  return { blocked: false, analysis };
}

export class ScriptBlocker {
  private cacheManager: CacheManager;
  private blockedScripts: Map<string, BlockedScript>;
  private config: PageIntegrityConfig;

  public constructor(cacheManager: CacheManager, config: PageIntegrityConfig) {
    this.cacheManager = cacheManager;
    this.blockedScripts = new Map();
    this.config = config;
  }

  public async shouldBlockScript(url: string, content: string): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
    // Check if script is blacklisted
    const isBlacklisted = this.config.blacklistedHosts?.some(host => url.includes(host));
    if (isBlacklisted) {
      this.blockedScripts.set(url, {
        url,
        reason: 'Blacklisted script'
      });
      return { blocked: true, reason: 'Blacklisted script' };
    }

    // Check cache first
    const cached = await checkCachedResponse(this.cacheManager, url, content);
    if (cached.blocked) {
      this.blockedScripts.set(url, {
        url,
        reason: cached.reason || 'Cached block',
        analysis: cached.analysis
      });
      return cached;
    }

    // Analyze script for monitoring
    const analysis = analyzeScriptContent(content);
    this.blockedScripts.set(url, {
      url,
      reason: 'Script analyzed',
      analysis
    });
    
    return { blocked: false, analysis };
  }

  public isScriptBlocked(url: string): boolean {
    return this.blockedScripts.has(url);
  }

  public getBlockedScript(url: string): BlockedScript | undefined {
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