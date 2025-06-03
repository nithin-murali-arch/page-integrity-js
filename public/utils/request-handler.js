var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createHash } from './hash';
import { analyzeScript } from './script-analyzer';
export function fetchAndClone(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(request);
        const clonedResponse = response.clone();
        const text = yield clonedResponse.text();
        return { response, text };
    });
}
export function shouldAnalyzeScript(request, response) {
    var _a;
    const url = request.url.toLowerCase();
    return (url.endsWith('.js') ||
        ((_a = response.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.includes('javascript')) ||
        false);
}
export function analyzeAndCacheScript(text, url, cacheManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const hash = createHash(text);
        const analysis = analyzeScript(text);
        yield cacheManager.cacheResponse(hash, url, analysis);
        return { hash, analysis };
    });
}
export function cacheNonScript(text, url, cacheManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const hash = createHash(text);
        yield cacheManager.cacheResponse(hash, url);
        return { hash };
    });
}
export class RequestHandler {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    static createInstance(cacheManager) {
        return new RequestHandler(cacheManager);
    }
    cleanupRequest(request) {
        RequestHandler.handledRequests.delete(request);
    }
    handleFetch(request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Skip if this request is already being handled by the service worker
            if (RequestHandler.handledRequests.get(request)) {
                try {
                    return yield fetch(request);
                }
                catch (error) {
                    console.error(`Failed to load resource: ${request.url}`, error);
                    throw error;
                }
            }
            // Mark this request as being handled
            RequestHandler.handledRequests.set(request, true);
            try {
                const response = yield fetch(request);
                const clonedResponse = response.clone();
                const text = yield clonedResponse.text();
                const url = request.url;
                try {
                    if (shouldAnalyzeScript(request, response)) {
                        yield analyzeAndCacheScript(text, url, this.cacheManager);
                    }
                    else {
                        yield cacheNonScript(text, url, this.cacheManager);
                    }
                }
                catch (error) {
                    console.error(`Error processing response for ${url}:`, error);
                }
                return response;
            }
            catch (error) {
                console.error(`Failed to load resource: ${request.url}`, error);
                throw error;
            }
            finally {
                this.cleanupRequest(request);
            }
        });
    }
    handleXhrRequest(url, method, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url, { method, body });
                const text = yield response.text();
                return analyzeAndCacheScript(text, url, this.cacheManager);
            }
            catch (error) {
                console.error(`Failed to load XHR resource: ${url}`, error);
                throw error;
            }
        });
    }
    handleScriptRequest(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url);
                const text = yield response.text();
                return analyzeAndCacheScript(text, url, this.cacheManager);
            }
            catch (error) {
                console.error(`Failed to load script resource: ${url}`, error);
                throw error;
            }
        });
    }
}
RequestHandler.handledRequests = new WeakMap();
//# sourceMappingURL=request-handler.js.map