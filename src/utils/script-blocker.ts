import { analyzeScript } from './script-analyzer';
import { createHash } from './hash';
import { CacheManager } from './cache-manager';

export interface BlockedScript {
  url: string;
  reason: string;
  analysis?: any;
}

export async function checkCachedResponse(hash: string, cacheManager: CacheManager): Promise<{ blocked: boolean; reason?: string; analysis?: any } | null> {
  const cachedResponse = await cacheManager.getCachedResponse(hash);
  if (cachedResponse?.analysis) {
    if (cachedResponse.analysis.isMalicious) {
      return { blocked: true, reason: 'Malicious script detected', analysis: cachedResponse.analysis };
    }
    return { blocked: false, analysis: cachedResponse.analysis };
  }
  return null;
}

export async function analyzeAndBlockScript(content: string, url: string, cacheManager: CacheManager, blockedScripts: Map<string, BlockedScript>): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
  const analysis = analyzeScript(content);
  if (analysis.isMalicious) {
    blockedScripts.set(url, {
      url,
      reason: 'Malicious script detected',
      analysis
    });
    return { blocked: true, reason: 'Malicious script detected', analysis };
  }
  return { blocked: false, analysis };
}

export class ScriptBlocker {
  private cacheManager: CacheManager;
  private blockedScripts: Map<string, BlockedScript>;

  public constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
    this.blockedScripts = new Map();
  }

  public static createInstance(cacheManager: CacheManager): ScriptBlocker {
    return new ScriptBlocker(cacheManager);
  }

  public async shouldBlockScript(url: string, content: string): Promise<{ blocked: boolean; reason?: string; analysis?: any }> {
    const hash = createHash(content);
    const cachedResult = await checkCachedResponse(hash, this.cacheManager);
    if (cachedResult) {
      if (cachedResult.blocked) {
        this.blockedScripts.set(url, {
          url,
          reason: cachedResult.reason || 'Malicious script detected',
          analysis: cachedResult.analysis
        });
      }
      return cachedResult;
    }
    return analyzeAndBlockScript(content, url, this.cacheManager, this.blockedScripts);
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