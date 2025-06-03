const CACHE_NAME = 'response-cache';
const MAX_CACHE_SIZE = 2500;
export class CacheManager {
    cacheName;
    maxSize;
    constructor(cacheName = CACHE_NAME, maxSize = MAX_CACHE_SIZE) {
        this.cacheName = cacheName;
        this.maxSize = maxSize;
    }
    async cacheResponse(hash, url, analysis) {
        const cache = await caches.open(this.cacheName);
        const responseData = analysis ? { url, analysis } : { url };
        await cache.put(hash, new Response(JSON.stringify(responseData)));
        // Implement LRU by limiting cache size
        const keys = await cache.keys();
        if (keys.length > this.maxSize) {
            await cache.delete(keys[0]);
        }
    }
    async getCachedResponse(hash) {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(hash);
        if (response) {
            const text = await response.text();
            return JSON.parse(text);
        }
        return null;
    }
    async clearCache() {
        await caches.delete(this.cacheName);
    }
}
//# sourceMappingURL=cache-manager.js.map