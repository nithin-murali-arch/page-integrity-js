import { ScriptAnalysis } from '../types';

const CACHE_NAME = 'response-cache';
const MAX_CACHE_SIZE = 2500;

export interface CacheEntry {
  url: string;
  analysis?: ScriptAnalysis;
  reason?: string;
}

export class CacheManager {
  private cacheName: string;
  private maxSize: number;

  public constructor(cacheName: string = CACHE_NAME, maxSize: number = MAX_CACHE_SIZE) {
    this.cacheName = cacheName;
    this.maxSize = maxSize;
  }

  public async cacheResponse(hash: string, url: string, analysis?: ScriptAnalysis): Promise<void> {
    const cache = await caches.open(this.cacheName);
    const responseData: CacheEntry = analysis ? { url, analysis } : { url };
    await cache.put(hash, new Response(JSON.stringify(responseData)));
    
    // Implement LRU by limiting cache size
    const keys = await cache.keys();
    if (keys.length > this.maxSize) {
      await cache.delete(keys[0]);
    }
  }

  public async getCachedResponse(hash: string): Promise<CacheEntry | null> {
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(hash);
    
    if (response) {
      const text = await response.text();
      return JSON.parse(text);
    }
    
    return null;
  }

  public async clearCache(): Promise<void> {
    await caches.delete(this.cacheName);
  }
} 