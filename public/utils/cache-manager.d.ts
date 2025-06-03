import { ScriptAnalysis } from './script-analyzer';
export interface CacheEntry {
    url: string;
    analysis?: ScriptAnalysis;
    reason?: string;
}
export declare class CacheManager {
    private cacheName;
    private maxSize;
    constructor(cacheName?: string, maxSize?: number);
    cacheResponse(hash: string, url: string, analysis?: ScriptAnalysis): Promise<void>;
    getCachedResponse(hash: string): Promise<CacheEntry | null>;
    clearCache(): Promise<void>;
}
