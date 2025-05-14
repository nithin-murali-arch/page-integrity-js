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

  public constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  public static createInstance(cacheManager: CacheManager): RequestHandler {
    return new RequestHandler(cacheManager);
  }

  public async handleFetch(request: Request): Promise<Response> {
    const { response, text } = await fetchAndClone(request);
    const url = request.url;
    try {
      if (shouldAnalyzeScript(request, response)) {
        await analyzeAndCacheScript(text, url, this.cacheManager);
      } else {
        await cacheNonScript(text, url, this.cacheManager);
      }
    } catch (error) {
      console.error('Error processing response:', error);
    }
    return response;
  }

  public async handleXhrRequest(url: string, method: string, body?: string): Promise<{ hash: string; analysis?: any }> {
    const response = await fetch(url, { method, body });
    const text = await response.text();
    return analyzeAndCacheScript(text, url, this.cacheManager);
  }

  public async handleScriptRequest(url: string): Promise<{ hash: string; analysis?: any }> {
    const response = await fetch(url);
    const text = await response.text();
    return analyzeAndCacheScript(text, url, this.cacheManager);
  }
} 