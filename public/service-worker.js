(function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

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
        var _a;
        const url = request.url.toLowerCase();
        return (url.endsWith('.js') ||
            ((_a = response.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.includes('javascript')) ||
            false);
    }
    function analyzeAndCacheScript(text, url, cacheManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = createHash(text);
            const analysis = analyzeScript(text);
            yield cacheManager.cacheResponse(hash, url, analysis);
            return { hash, analysis };
        });
    }
    function cacheNonScript(text, url, cacheManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = createHash(text);
            yield cacheManager.cacheResponse(hash, url);
            return { hash };
        });
    }
    class RequestHandler {
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

    const CACHE_NAME = 'response-cache';
    const MAX_CACHE_SIZE = 2500;
    class CacheManager {
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
                var _a, _b;
                if (data) {
                    (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({
                        type: 'url',
                        url: data.url,
                        analysis: data.analysis
                    });
                }
                else {
                    (_b = event.source) === null || _b === void 0 ? void 0 : _b.postMessage({ type: 'url', url: null });
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
                var _a;
                (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({
                    type: 'xhrResponse',
                    hash,
                    analysis
                });
            })
                .catch(error => {
                var _a;
                console.error('XHR error:', error);
                (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({ type: 'xhrError', error: error.message });
            });
        }
    });
    // Intercept script element requests
    self.addEventListener('message', (event) => {
        if (event.data.type === 'script') {
            const { url } = event.data;
            requestHandler.handleScriptRequest(url)
                .then(({ hash, analysis }) => {
                var _a;
                (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({
                    type: 'scriptResponse',
                    hash,
                    analysis
                });
            })
                .catch(error => {
                var _a;
                console.error('Script error:', error);
                (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage({ type: 'scriptError', error: error.message });
            });
        }
    });

})();
//# sourceMappingURL=service-worker.js.map
