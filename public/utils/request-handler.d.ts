import { CacheManager } from './cache-manager';
export declare function fetchAndClone(request: Request): Promise<{
    response: Response;
    text: string;
}>;
export declare function shouldAnalyzeScript(request: Request, response: Response): boolean;
export declare function analyzeAndCacheScript(text: string, url: string, cacheManager: CacheManager): Promise<{
    hash: string;
    analysis: import("../types").ScriptAnalysis;
}>;
export declare function cacheNonScript(text: string, url: string, cacheManager: CacheManager): Promise<{
    hash: string;
}>;
export declare class RequestHandler {
    private cacheManager;
    private static handledRequests;
    constructor(cacheManager: CacheManager);
    static createInstance(cacheManager: CacheManager): RequestHandler;
    private cleanupRequest;
    handleFetch(request: Request): Promise<Response>;
    handleXhrRequest(url: string, method: string, body?: string): Promise<{
        hash: string;
        analysis?: any;
    }>;
    handleScriptRequest(url: string): Promise<{
        hash: string;
        analysis?: any;
    }>;
}
