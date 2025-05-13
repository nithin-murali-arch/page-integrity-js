/// <reference lib="webworker" />

import { createHash } from './utils/hash';

const CACHE_NAME = 'response-cache';
const MAX_CACHE_SIZE = 2500;

self.addEventListener('fetch', (event: Event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(
    fetch(fetchEvent.request)
      .then(response => {
        const clonedResponse = response.clone();
        clonedResponse.text().then(text => {
          const hash = createHash(text);
          const url = fetchEvent.request.url;
          cacheResponse(hash, url);
        });
        return response;
      })
      .catch(error => {
        console.error('Fetch error:', error);
        throw error;
      })
  );
});

function cacheResponse(hash: string, url: string): void {
  caches.open(CACHE_NAME).then(cache => {
    cache.put(hash, new Response(url));
    // Implement LRU by limiting cache size
    cache.keys().then(keys => {
      if (keys.length > MAX_CACHE_SIZE) {
        cache.delete(keys[0]);
      }
    });
  });
}

self.addEventListener('message', (event: MessageEvent) => {
  if (event.data.type === 'getUrl') {
    const hash = event.data.hash;
    caches.open(CACHE_NAME).then(cache => {
      cache.match(hash).then(response => {
        if (response) {
          response.text().then(url => {
            event.source?.postMessage({ type: 'url', url });
          });
        } else {
          event.source?.postMessage({ type: 'url', url: null });
        }
      });
    });
  }
});

// Intercept XHR requests
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data.type === 'xhr') {
    const { url, method, body } = event.data;
    fetch(url, { method, body })
      .then(response => response.text())
      .then(text => {
        const hash = createHash(text);
        cacheResponse(hash, url);
        event.source?.postMessage({ type: 'xhrResponse', hash });
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
    fetch(url)
      .then(response => response.text())
      .then(text => {
        const hash = createHash(text);
        cacheResponse(hash, url);
        event.source?.postMessage({ type: 'scriptResponse', hash });
      })
      .catch(error => {
        console.error('Script error:', error);
        event.source?.postMessage({ type: 'scriptError', error: error.message });
      });
  }
}); 