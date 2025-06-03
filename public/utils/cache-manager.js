var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const CACHE_NAME = 'response-cache';
const MAX_CACHE_SIZE = 2500;
export class CacheManager {
    constructor(cacheName = CACHE_NAME, maxSize = MAX_CACHE_SIZE) {
        this.cacheName = cacheName;
        this.maxSize = maxSize;
    }
    cacheResponse(hash, url, analysis) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = yield caches.open(this.cacheName);
            const responseData = analysis ? { url, analysis } : { url };
            yield cache.put(hash, new Response(JSON.stringify(responseData)));
            // Implement LRU by limiting cache size
            const keys = yield cache.keys();
            if (keys.length > this.maxSize) {
                yield cache.delete(keys[0]);
            }
        });
    }
    getCachedResponse(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = yield caches.open(this.cacheName);
            const response = yield cache.match(hash);
            if (response) {
                const text = yield response.text();
                return JSON.parse(text);
            }
            return null;
        });
    }
    clearCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield caches.delete(this.cacheName);
        });
    }
}
//# sourceMappingURL=cache-manager.js.map