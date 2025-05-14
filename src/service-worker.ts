/// <reference lib="webworker" />

import { RequestHandler } from './utils/request-handler';
import { CacheManager } from './utils/cache-manager';

const requestHandler = RequestHandler.getInstance();
const cacheManager = CacheManager.getInstance();

self.addEventListener('fetch', (event: Event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(requestHandler.handleFetch(fetchEvent.request));
});

self.addEventListener('message', (event: MessageEvent) => {
  if (event.data.type === 'getUrl') {
    const hash = event.data.hash;
    cacheManager.getCachedResponse(hash).then(data => {
      if (data) {
        event.source?.postMessage({ 
          type: 'url', 
          url: data.url,
          analysis: data.analysis 
        });
      } else {
        event.source?.postMessage({ type: 'url', url: null });
      }
    });
  }
});

// Intercept XHR requests
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data.type === 'xhr') {
    const { url, method, body } = event.data;
    requestHandler.handleXhrRequest(url, method, body)
      .then(({ hash, analysis }) => {
        event.source?.postMessage({ 
          type: 'xhrResponse', 
          hash,
          analysis 
        });
      })
      .catch(error => {
        console.error('XHR error:', error);
        event.source?.postMessage({ type: 'xhrError', error: error.message });
      });
  }
});

// Intercept script element requests
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data.type === 'script') {
    const { url } = event.data;
    requestHandler.handleScriptRequest(url)
      .then(({ hash, analysis }) => {
        event.source?.postMessage({ 
          type: 'scriptResponse', 
          hash,
          analysis 
        });
      })
      .catch(error => {
        console.error('Script error:', error);
        event.source?.postMessage({ type: 'scriptError', error: error.message });
      });
  }
}); 