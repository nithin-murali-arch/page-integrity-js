import { createHash } from './hash';
import { analyzeScript } from './script-analyzer';
export async function fetchAndClone(request) {
    const response = await fetch(request);
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    return { response, text };
}
export function shouldAnalyzeScript(request, response) {
    const url = request.url.toLowerCase();
    return (url.endsWith('.js') ||
        response.headers.get('content-type')?.includes('javascript') ||
        false);
}
export async function analyzeAndCacheScript(text, url, cacheManager) {
    const hash = createHash(text);
    const analysis = analyzeScript(text);
    await cacheManager.cacheResponse(hash, url, analysis);
    return { hash, analysis };
}
export async function cacheNonScript(text, url, cacheManager) {
    const hash = createHash(text);
    await cacheManager.cacheResponse(hash, url);
    return { hash };
}
export class RequestHandler {
    cacheManager;
    static handledRequests = new WeakMap();
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    static createInstance(cacheManager) {
        return new RequestHandler(cacheManager);
    }
    cleanupRequest(request) {
        RequestHandler.handledRequests.delete(request);
    }
    async handleFetch(request) {
        // Skip if this request is already being handled by the service worker
        if (RequestHandler.handledRequests.get(request)) {
            try {
                return await fetch(request);
            }
            catch (error) {
                console.error(`Failed to load resource: ${request.url}`, error);
                throw error;
            }
        }
        // Mark this request as being handled
        RequestHandler.handledRequests.set(request, true);
        try {
            const response = await fetch(request);
            const clonedResponse = response.clone();
            const text = await clonedResponse.text();
            const url = request.url;
            try {
                if (shouldAnalyzeScript(request, response)) {
                    await analyzeAndCacheScript(text, url, this.cacheManager);
                }
                else {
                    await cacheNonScript(text, url, this.cacheManager);
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
    }
    async handleXhrRequest(url, method, body) {
        try {
            const response = await fetch(url, { method, body });
            const text = await response.text();
            return analyzeAndCacheScript(text, url, this.cacheManager);
        }
        catch (error) {
            console.error(`Failed to load XHR resource: ${url}`, error);
            throw error;
        }
    }
    async handleScriptRequest(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            return analyzeAndCacheScript(text, url, this.cacheManager);
        }
        catch (error) {
            console.error(`Failed to load script resource: ${url}`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=request-handler.js.map