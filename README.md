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

### Use without a bundler

The package also ships a browser bundle at `dist/page-integrity.js`. It exposes the library as the global `PageIntegrityLib`.

```html
<script src="node_modules/page-integrity-js/dist/page-integrity.js"></script>
<script>
	new PageIntegrityLib.PageIntegrity({ blackListedScripts: ['evil.com'] });
</script>
```

[`example/index.html`](example/index.html) shows the bundle with a block list, an allow list, and `onBlocked`.

## How a script is judged

For each script the library sees, it applies these checks in order and stops at the first match.

1. **Block list.** If the URL contains any `blackListedScripts` entry, the script is blocked.
2. **Allow list.** If the URL contains any `whiteListedScripts` entry, the script is allowed. It skips analysis.
3. **Analysis.** The library scores the content. It blocks the script if the score reaches `minScore` or the threat count reaches `maxThreats`.

The decision is synchronous, so every patched global keeps its native return value.

List entries match as substrings of the URL, so `trusted.com` and `https://trusted.com/app.js` both work. The block list wins over the allow list.

## What it intercepts

`new PageIntegrity()` replaces these globals and DOM methods with checking wrappers.

| Global | When it is checked | When blocked |
|--------|--------------------|--------------|
| `window.eval` | Always. The code string is analyzed. | Returns `undefined`. |
| `window.Function` | When the function is created. | Throws `EvalError`. |
| `window.setTimeout`, `window.setInterval` | When the handler is a string or an object. | Returns `0`. No timer is set. |
| `window.fetch` | When the URL ends in `.js`. | Returns a rejected Promise. |
| `XMLHttpRequest.prototype.open` | When the URL ends in `.js`. | Throws. |
| `appendChild`, `insertBefore`, `replaceChild`, `append`, `prepend`, `before`, `after`, `replaceWith` | When the inserted node is a `<script>` or contains one. | Sets the script's `type` to `javascript/blocked`, so the browser neither fetches nor runs it. |

For `eval`, `Function`, `setTimeout`, and `setInterval`, the "URL" that the lists match against is the global's name, for example `eval`. For an inline `<script>` it is `inline`. An external `<script src>` is matched by its URL only. Its content is not fetched for analysis.

Script elements whose `type` is not JavaScript, such as `application/ld+json`, are left alone.

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
| `updateConfig(partial)` | Merges `partial` into the current config. It removes the current wrappers before it installs new ones. |
| `destroy()` | Restores every patched global and DOM method. |

## Service worker

The package ships `public/service-worker.js`. It fetches scripts, analyzes them, and stores each analysis in Cache Storage under the content hash. It answers `getUrl`, `xhr`, and `script` messages from the page with those analyses. The page-side blocker does not read this cache, and the service worker never blocks a request itself.

The library does not register the worker. Serve the file from your own origin and register it:

```javascript
navigator.serviceWorker.register('/service-worker.js');
```

## Known limitations

- **Scripts already in the HTML are not checked.** Only scripts inserted after `new PageIntegrity()` runs go through the DOM wrappers. Load the library before any script you want it to judge.
- **`innerHTML` and `document.write` are not wrapped.** Scripts inserted through `innerHTML` never run in browsers. Scripts written with `document.write` are not checked.
- **`eval` becomes indirect.** The wrapper calls the native `eval` from its own scope, so code that relies on direct `eval` seeing local variables breaks.
- **`strictMode` has no effect yet.**

## Upgrading from 3.x

4.0.0 is built from this repository. The 3.x line on npm used a different configuration (`allowedHosts`, `blockedHosts`, and related options). Move to `whiteListedScripts` and `blackListedScripts`. `ScriptBlocker.shouldBlockScript` now returns its result directly instead of a Promise, and `initScriptBlocker` takes only the config.

## Contributing

Contributions are welcome. Open an issue or a pull request.

## Sponsor

If this package saves you time, you can support its maintenance through [GitHub Sponsors](https://github.com/sponsors/nithin-murali-arch).

## License

MIT
