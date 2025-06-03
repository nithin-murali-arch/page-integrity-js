(function () {
    'use strict';

    function createHash(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data[i];
            hash = hash & hash;
        }
        return hash.toString(16); // Convert to hexadecimal
    }

    // Malicious behavior patterns to check for
    const MALICIOUS_PATTERNS = {
        // Evasion techniques
        evasion: [
            // Attempting to bypass CSP
            /document\.write\s*\(\s*['"]<iframe[^>]*src\s*=\s*['"]javascript:/i,
            /document\.location\s*=\s*['"]javascript:/i,
            // Trying to hide script execution
            /(?:setTimeout|setInterval)\s*\(\s*['"][^'"]*['"]/i,
            // Attempting to bypass same-origin policy
            /document\.domain\s*=\s*['"][^'"]*['"]/i,
            // Trying to disable security features
            /Object\.defineProperty\s*\(\s*window\s*,\s*['"]onerror['"]/i,
        ],
        // Covert execution patterns
        covertExecution: [
            // Hidden iframe with malicious intent
            /document\.write\s*\(\s*['"]<iframe[^>]*style\s*=\s*['"]display\s*:\s*none[^>]*src\s*=\s*['"](?:javascript|data|vbscript):/i,
            // Stealthy script injection
            /document\.write\s*\(\s*['"]<script[^>]*src\s*=\s*['"](?:javascript|data|vbscript):/i,
            // Attempting to execute code in a hidden context
            /new\s+Worker\s*\(\s*['"]data:application\/javascript;base64/i,
            // Trying to execute code in a way that avoids detection
            /Function\s*\(\s*['"]return\s+eval\s*\(/i,
            // Direct eval usage
            /eval\s*\(\s*['"][^'"]*['"]\s*\)/i,
            // Function constructor usage
            /new\s+Function\s*\(\s*['"][^'"]*['"]\s*\)/i,
        ],
        // Security bypass attempts
        securityBypass: [
            // Attempting to modify security headers
            /Object\.defineProperty\s*\(\s*document\s*,\s*['"]cookie['"]/i,
            // Trying to bypass XSS filters
            /String\.fromCharCode\s*\(\s*\d+\s*\)\s*\.\s*replace\s*\(\s*['"]\s*['"]\s*,\s*['"]\s*['"]/i,
            // Attempting to disable security features
            /Object\.defineProperty\s*\(\s*navigator\s*,\s*['"]userAgent['"]/i,
            // Trying to bypass same-origin policy
            /document\.domain\s*=\s*['"]\*['"]/i,
            // Modifying window properties
            /Object\.defineProperty\s*\(\s*window\s*,\s*['"]alert['"]/i,
            /delete\s+window\.alert/i,
            /window\.alert\s*=\s*function/i,
        ],
        // Malicious intent indicators
        maliciousIntent: [
            // Attempting to steal sensitive data
            /document\.cookie\s*\+\s*['"](?:\s*&\s*|%26)?(?:key|token|auth|password|secret)=\s*\+\s*encodeURIComponent/i,
            // Trying to inject malicious code
            /document\.write\s*\(\s*['"]<script[^>]*>\s*eval\s*\(/i,
            // Attempting to modify security settings
            /Object\.defineProperty\s*\(\s*window\s*,\s*['"]localStorage['"]/i,
            // Trying to bypass security controls
            /document\.createElement\s*\(\s*['"]script['"]\s*\)\s*\.\s*setAttribute\s*\(\s*['"]crossorigin['"]/i,
            // Data exfiltration
            /fetch\s*\(\s*['"][^'"]*malicious[^'"]*['"]/i,
            /navigator\.sendBeacon\s*\(\s*['"][^'"]*malicious[^'"]*['"]/i,
        ]
    };
    const DEFAULT_ANALYSIS_CONFIG = {
        minScore: 3,
        maxThreats: Infinity,
        checkSuspiciousStrings: true,
        weights: {
            evasion: 3,
            covertExecution: 3,
            securityBypass: 2,
            maliciousIntent: 2
        },
        scoringRules: {
            minSafeScore: 3,
            maxThreats: Infinity,
            suspiciousStringWeight: 1
        }
    };
    function analyzeScript(content, config = DEFAULT_ANALYSIS_CONFIG) {
        const threats = [];
        const details = [];
        let score = 0;
        // Check each category of patterns
        for (const [category, patterns] of Object.entries(MALICIOUS_PATTERNS)) {
            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    threats.push(category);
                    details.push({
                        pattern: pattern.toString(),
                        matches: matches
                    });
                    // Add weight for the category
                    score += config.weights[category];
                }
            }
        }
        // Check for suspicious combinations
        if (threats.includes('evasion') &&
            (threats.includes('covertExecution') || threats.includes('securityBypass'))) {
            score += config.scoringRules.suspiciousStringWeight;
        }
        // Check for suspicious string patterns
        const suspiciousStrings = config.checkSuspiciousStrings ? detectSuspiciousStrings(content) : [];
        if (suspiciousStrings.length > 0) {
            threats.push('suspicious-strings');
            // Add score based on severity of suspicious strings
            score += suspiciousStrings.reduce((total, match) => {
                const severityWeight = match.severity === 'high' ? 2 : match.severity === 'medium' ? 1 : 0.5;
                return total + (match.matches.length * severityWeight * config.scoringRules.suspiciousStringWeight);
            }, 0);
        }
        return {
            threats,
            score,
            details,
            analysisDetails: {
                suspiciousStrings: suspiciousStrings.map(match => match.pattern),
                categories: [...new Set(threats)]
            }
        };
    }
    function detectSuspiciousStrings(content) {
        const suspicious = [];
        const patterns = {
            'security-bypass': {
                // Look for actual security bypass techniques
                regex: /(?:document\.domain\s*=\s*['"]\*['"]|Object\.defineProperty\s*\(\s*(?:window|document|navigator)\s*,\s*['"](?:cookie|userAgent|referrer)['"]|delete\s+window\.(?:alert|confirm|prompt)|window\.(?:alert|confirm|prompt)\s*=\s*function)/i,
                severity: 'high'
            },
            'dangerous-extension': {
                // Look for actual dangerous file operations and extensions
                regex: /(?:\.(?:php|asp|jsp|exe|dll|bat|cmd|sh|bash)(?:\?|$)|(?:file|path)\.(?:exists|create|write|delete)|fs\.(?:writeFile|unlink|rmdir)|child_process\.(?:exec|spawn))/i,
                severity: 'high'
            },
            'attack-pattern': {
                // Look for actual attack techniques
                regex: /(?:UNION\s+ALL\s+SELECT|exec\s*\(\s*['"]|sp_executesql|eval\s*\(\s*['"]|document\.write\s*\(\s*['"]<script|unescape\s*\(\s*['"]%u|String\.fromCharCode\s*\(\s*\d+\s*\))/i,
                severity: 'high'
            },
            'obfuscation': {
                // Look for actual code obfuscation techniques
                regex: /(?:[a-zA-Z0-9]{20,}|(?:0x[0-9a-fA-F]{2}\s*,\s*){10,}|(?:\\x[0-9a-fA-F]{2}){10,}|(?:%[0-9a-fA-F]{2}){10,}|(?:[+\-*/%&|^~]{3,})|(?:[a-z]\s*=\s*[a-z](?:\s*[+\-*/%&|^~]\s*[a-z])+))/i,
                severity: 'medium'
            }
        };
        for (const [type, { regex, severity }] of Object.entries(patterns)) {
            const matches = content.match(regex);
            if (matches) {
                suspicious.push({
                    type: type,
                    pattern: regex.toString(),
                    matches: matches,
                    severity
                });
            }
        }
        return suspicious;
    }

    function shouldAnalyzeScript(request, response) {
        const url = request.url.toLowerCase();
        return (url.endsWith('.js') ||
            response.headers.get('content-type')?.includes('javascript') ||
            false);
    }
    async function analyzeAndCacheScript(text, url, cacheManager) {
        const hash = createHash(text);
        const analysis = analyzeScript(text);
        await cacheManager.cacheResponse(hash, url, analysis);
        return { hash, analysis };
    }
    async function cacheNonScript(text, url, cacheManager) {
        const hash = createHash(text);
        await cacheManager.cacheResponse(hash, url);
        return { hash };
    }
    class RequestHandler {
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

    const CACHE_NAME = 'response-cache';
    const MAX_CACHE_SIZE = 2500;
    class CacheManager {
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

    /// <reference lib="webworker" />
    const cacheManager = new CacheManager();
    const requestHandler = new RequestHandler(cacheManager);
    self.addEventListener('fetch', (event) => {
        const fetchEvent = event;
        fetchEvent.respondWith(requestHandler.handleFetch(fetchEvent.request));
    });
    self.addEventListener('message', (event) => {
        if (event.data.type === 'getUrl') {
            const hash = event.data.hash;
            cacheManager.getCachedResponse(hash).then(data => {
                if (data) {
                    event.source?.postMessage({
                        type: 'url',
                        url: data.url,
                        analysis: data.analysis
                    });
                }
                else {
                    event.source?.postMessage({ type: 'url', url: null });
                }
            });
        }
    });
    // Intercept XHR requests
    self.addEventListener('message', (event) => {
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
    self.addEventListener('message', (event) => {
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

})();
//# sourceMappingURL=service-worker.js.map
