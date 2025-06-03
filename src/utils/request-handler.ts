import { createHash } from './hash';
import { analyzeScript } from './script-analyzer';
import { CacheManager } from './cache-manager';

export async function fetchAndClone(request: Request): Promise<{ response: Response; text: string }> {
  const response = await fetch(request);
  const clonedResponse = response.clone();
  const text = await clonedResponse.text();
  return { response, text };
}

export function shouldAnalyzeScript(request: Request, response: Response): boolean {
  const url = request.url.toLowerCase();
  return (
    url.endsWith('.js') ||
    response.headers.get('content-type')?.includes('javascript') ||
    false
  );
}

export async function analyzeAndCacheScript(text: string, url: string, cacheManager: CacheManager) {
  const hash = createHash(text);
  const analysis = analyzeScript(text);
  await cacheManager.cacheResponse(hash, url, analysis);
  return { hash, analysis };
}

export async function cacheNonScript(text: string, url: string, cacheManager: CacheManager) {
  const hash = createHash(text);
  await cacheManager.cacheResponse(hash, url);
  return { hash };
}

export class RequestHandler {
  private cacheManager: CacheManager;
  private static handledRequests = new WeakMap<Request, boolean>();

  public constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  public static createInstance(cacheManager: CacheManager): RequestHandler {
    return new RequestHandler(cacheManager);
  }

  private cleanupRequest(request: Request): void {
    RequestHandler.handledRequests.delete(request);
  }

  public async handleFetch(request: Request): Promise<Response> {
    // Skip if this request is already being handled by the service worker
    if (RequestHandler.handledRequests.get(request)) {
      try {
        return await fetch(request);
      } catch (error) {
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
        } else {
          await cacheNonScript(text, url, this.cacheManager);
        }
      } catch (error) {
        console.error(`Error processing response for ${url}:`, error);
      }

      return response;
    } catch (error) {
      console.error(`Failed to load resource: ${request.url}`, error);
      throw error;
    } finally {
      this.cleanupRequest(request);
    }
  }

  public async handleXhrRequest(url: string, method: string, body?: string): Promise<{ hash: string; analysis?: any }> {
    try {
      const response = await fetch(url, { method, body });
      const text = await response.text();
      return analyzeAndCacheScript(text, url, this.cacheManager);
    } catch (error) {
      console.error(`Failed to load XHR resource: ${url}`, error);
      throw error;
    }
  }

  public async handleScriptRequest(url: string): Promise<{ hash: string; analysis?: any }> {
    try {
      const response = await fetch(url);
      const text = await response.text();
      return analyzeAndCacheScript(text, url, this.cacheManager);
    } catch (error) {
      console.error(`Failed to load script resource: ${url}`, error);
      throw error;
    }
  }
} 