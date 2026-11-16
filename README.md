# Page Integrity JS

[![CI](https://github.com/nithin-murali-arch/page-integrity-js/actions/workflows/test.yml/badge.svg)](https://github.com/nithin-murali-arch/page-integrity-js/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![npm downloads](https://img.shields.io/npm/dm/page-integrity-js)](https://www.npmjs.com/package/page-integrity-js)
[![license](https://img.shields.io/npm/l/page-integrity-js)](https://github.com/nithin-murali-arch/page-integrity-js/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/page-integrity-js)](https://www.npmjs.com/package/page-integrity-js)
[![Sponsor](https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ea4aaa?logo=githubsponsors)](https://github.com/sponsors/nithin-murali-arch)

Page Integrity JS blocks untrusted script execution in the browser. It matches script URLs against an allow list and a block list, and it scores script content against known malicious patterns. It supports PCI DSS script-integrity work. It does not make a page compliant on its own.

The package has no runtime dependencies.

## Install

```bash
npm install page-integrity-js
```

## Quick start

Creating a `PageIntegrity` instance starts blocking at once. There is no `start()` method.

```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
	strictMode: false,
	whiteListedScripts: ['trusted.com'],
	blackListedScripts: ['evil.com'],
	onBlocked: (info) => console.warn('Blocked', info.url, info.details.reason),
});
```

The TypeScript type `PageIntegrityConfig` requires `strictMode`, `whiteListedScripts`, and `blackListedScripts`. Plain JavaScript callers can omit any of them.

Each instance also sets `window.PageIntegrity` to the class.

## How a script is judged

For each script the library sees, it applies these checks in order and stops at the first match.

1. **Block list.** If the URL contains any `blackListedScripts` entry, the script is blocked.
2. **Allow list.** If the URL contains any `whiteListedScripts` entry, the script is allowed. It skips analysis.
3. **Cache.** If the content hash is in the response cache with a malicious analysis, the script is blocked.
4. **Analysis.** The library scores the content. It blocks the script if the score reaches `minScore` or the threat count reaches `maxThreats`.

List entries match as substrings of the URL, so `trusted.com` and `https://trusted.com/app.js` both work. The block list wins over the allow list.

## What it intercepts

`new PageIntegrity()` replaces these globals with checking wrappers.

| Global | When it is checked |
|--------|--------------------|
| `window.eval` | Always. The code string is analyzed. |
| `window.Function` | When the created function runs. |
| `window.setTimeout`, `window.setInterval` | When the handler is a string or an object. |
| `window.fetch` | When the URL ends in `.js`. |
| `XMLHttpRequest.prototype.open` | When the URL ends in `.js`. |

For `eval`, `Function`, `setTimeout`, and `setInterval`, the "URL" that the lists match against is the global's name, for example `eval`.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strictMode` | `boolean` | `false` | Accepted and stored. It has no effect yet. |
| `whiteListedScripts` | `string[]` | `[]` | URL substrings that are allowed without analysis. |
| `blackListedScripts` | `string[]` | `[]` | URL substrings that are always blocked. |
| `analysisConfig` | `AnalysisConfig` | See below | Controls content scoring. |
| `onBlocked` | `(info: BlockedEventInfo) => void` | `undefined` | Called when a script is blocked. |

### `analysisConfig`

If you pass `analysisConfig`, it replaces the defaults as a whole. Provide every field.

| Field | Default | Description |
|-------|---------|-------------|
| `minScore` | `3` | A script is blocked when its score is at least this value. |
| `maxThreats` | `Infinity` | A script is blocked when it matches at least this many threats. |
| `checkSuspiciousStrings` | `true` | Also scan for suspicious strings, such as obfuscation and attack patterns. |
| `weights` | `{ evasion: 3, covertExecution: 3, securityBypass: 2, maliciousIntent: 2 }` | Score added for each pattern matched in a threat category. |
| `scoringRules.suspiciousStringWeight` | `1` | Multiplier for suspicious-string matches. Also the bonus added when evasion occurs together with covert execution or a security bypass. |
| `scoringRules.minSafeScore` | `3` | Reserved. The blocking decision reads `minScore`. |
| `scoringRules.maxThreats` | `Infinity` | Reserved. The blocking decision reads `maxThreats`. |

### `onBlocked`

`onBlocked` receives a `BlockedEventInfo`. It runs for scripts blocked by the block list, the cache, or analysis. It does not run for allowed scripts.

| Property | Description |
|----------|-------------|
| `type` | Always `'script'` today. |
| `timestamp` | Milliseconds since the Unix epoch. |
| `url` | The script URL, or the global's name, such as `eval`. |
| `source` | Always `'external'` today. |
| `details` | `{ url, reason, analysis? }`. `reason` is `'Blacklisted script'`, `'Malicious script detected'`, or the cached reason. |

## Methods

| Method | Description |
|--------|-------------|
| `updateConfig(partial)` | Merges `partial` into the current config. See the known issues below. |
| `destroy()` | Stops the interceptor. See the known issues below. |

## Service worker

The package ships `public/service-worker.js`. It fetches scripts, analyzes them, and stores each analysis in Cache Storage under the content hash. The page-side blocker reads that cache in step 3 above. The service worker never blocks a request itself.

The library does not register the worker. Serve the file from your own origin and register it:

```javascript
navigator.serviceWorker.register('/service-worker.js');
```

## Known issues

These come from reading the source. Treat them as open bugs, not design.

- **Script elements are not intercepted.** A `<script src>` or an inline `<script>` added to the DOM is not checked. `interceptScriptElement` exists in `src/utils/script-interceptor.ts` but nothing calls it.
- **Patched globals are async.** `eval`, `setTimeout`, `setInterval`, `fetch`, and `XMLHttpRequest.prototype.open` become `async` functions. `eval` and `setTimeout` return a Promise, so `clearTimeout(setTimeout(...))` and the result of `eval('1 + 1')` no longer work as in the browser.
- **`destroy()` does not restore the globals.** It clears a flag only.
- **`updateConfig()` stacks wrappers.** It installs a new set of wrappers on top of the old ones, and the old wrappers keep their old config.
- **`Function` is checked after the fact.** The created function still runs when the check says to block it.

## Contributing

Contributions are welcome. Open an issue or a pull request.

## Sponsor

If this package saves you time, you can support its maintenance through [GitHub Sponsors](https://github.com/sponsors/nithin-murali-arch).

## License

MIT
