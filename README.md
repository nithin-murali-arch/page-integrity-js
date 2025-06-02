# Page Integrity JS

[![npm version](https://img.shields.io/npm/v/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![npm downloads](https://img.shields.io/npm/dm/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![Security](https://img.shields.io/badge/Security-PCI%20DSS%20Compliant-red.svg)](https://www.pcisecuritystandards.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/min/page-integrity-js)](https://bundlephobia.com/package/page-integrity-js)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/nithin-murali-arch/page-integrity-js/actions)

A powerful JavaScript library for ensuring webpage content integrity by monitoring and controlling script execution and DOM mutations. Essential for PCI DSS compliance and security audits.

## Features

- 🔒 Script behavior monitoring and analysis
- 🛡️ Blacklist/whitelist-based script blocking
- 📊 Detailed script analysis reports
- 🔍 DOM mutation monitoring
- 🚫 Chrome extension blocking
- 📝 Comprehensive event callbacks
- ⚡ Lightweight and zero dependencies
- 🎯 Easy integration with any web application

## Installation

```bash
npm install page-integrity-js
```

## Quick Start

```javascript
import { PageIntegrity } from 'page-integrity-js';

// Initialize with configuration
const pageIntegrity = new PageIntegrity({
  blockedHosts: ['malicious.com', 'suspicious.net'],
  allowedHosts: ['trusted.com'],
  onBlocked: (info) => {
    console.log('Blocked event:', info);
  }
});

// Start monitoring
pageIntegrity.start();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strictMode` | `boolean` | `false` | When enabled, enforces strict validation of all mutations. In strict mode, any script or DOM mutation not explicitly allowed by `allowedHosts` will be blocked. This is useful for high-security environments where you want to maintain a strict allowlist of trusted sources. |
| `allowedHosts` | `string[]` | `[]` | List of trusted hosts and patterns allowed to modify content. Supports wildcards (e.g., `*.trusted.com`) and exact matches. When `strictMode` is true, only these hosts can execute scripts or modify the DOM. |
| `blockedHosts` | `string[]` | `[]` | List of blocked hosts and patterns that are not allowed to execute. Supports wildcards and exact matches. Scripts from these hosts will be blocked regardless of other settings. |
| `blockExtensions` | `boolean` | `false` | When enabled, blocks all Chrome extensions from executing scripts or modifying the DOM. This is useful for preventing extension-based attacks and maintaining strict control over page modifications. |
| `allowDynamicInline` | `boolean` | `true` | Controls whether dynamically added inline scripts are allowed. When false, any script added after page load using `document.createElement('script')` or similar methods will be blocked. This option specifically targets inline scripts (those without a `src` attribute). |
| `skipCreateElementOverride` | `boolean` | `false` | When true, completely disables the library's monitoring of `document.createElement` calls. This means the library won't intercept or analyze any elements created through `createElement`, including both inline and external scripts. Use with caution as this significantly reduces security coverage. |
| `reportUnknownScripts` | `boolean` | `false` | When enabled, triggers the `onBlocked` callback for scripts that aren't explicitly allowed or blocked. Useful for monitoring and auditing script execution patterns. |
| `analysisConfig` | `AnalysisConfig` | See below | Configuration for script analysis |

### Understanding Script Control Options

The library provides two distinct options for controlling script creation:

1. **allowDynamicInline** (`boolean`)
   - Controls whether dynamically added inline scripts are allowed
   - Only affects scripts without a `src` attribute
   - The library still monitors and can block these scripts based on other rules
   - Example of what this controls:
     ```javascript
     // This would be blocked if allowDynamicInline is false
     const script = document.createElement('script');
     script.textContent = 'alert("inline script")';
     document.body.appendChild(script);
     ```

2. **skipCreateElementOverride** (`boolean`)
   - Completely disables the library's monitoring of `document.createElement`
   - Affects ALL elements created through `createElement`, not just scripts
   - The library won't intercept or analyze any elements created this way
   - Example of what this affects:
     ```javascript
     // These would bypass the library's monitoring if skipCreateElementOverride is true
     const script = document.createElement('script');
     script.src = 'https://example.com/script.js';
     document.body.appendChild(script);

     const div = document.createElement('div');
     div.innerHTML = '<script>alert("nested script")</script>';
     document.body.appendChild(div);
     ```

#### When to Use Each Option

- Use `allowDynamicInline: false` when you want to prevent inline scripts but still monitor external scripts
- Use `skipCreateElementOverride: true` only when you have other libraries that conflict with the element creation monitoring, but be aware this reduces security coverage

### Analysis Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minScore` | `number` | `3` | Minimum score threshold for blocking |
| `maxThreats` | `number` | `2` | Maximum number of threats allowed |
| `weights` | `object` | See below | Scoring weights for different threat types |
| `scoringRules` | `object` | See below | Rules for scoring different script behaviors |

## Callback Events

The `onBlocked` callback receives a `BlockedEventInfo` object with the following structure:

```typescript
interface BlockedEventInfo {
  type: BlockedEventType;  // Type of blocked event
  target: Element | HTMLScriptElement;  // Target element or script
  stackTrace: string;  // Stack trace of the blocked event
  context: {
    source?: ScriptSource;  // Source of the script
    origin?: string;  // Origin of the script
    mutationType?: 'insert' | 'update' | 'remove';  // Type of mutation
    score?: number;  // Analysis score
    analysisDetails?: {
      staticScore: number;  // Static analysis score
      dynamicScore: number;  // Dynamic analysis score
      originScore: number;  // Origin-based score
      hashScore: number;  // Hash-based score
    };
  };
}
```

### Blocked Event Types

| Type | Description |
|------|-------------|
| `extension` | Blocked Chrome extension |
| `pattern-match` | Blocked due to pattern matching |
| `blocked` | Blocked by host rules |
| `unknown-origin` | Blocked due to unknown origin |
| `dynamic-inline` | Blocked dynamic inline script |
| `eval` | Blocked eval execution |
| `low-score` | Blocked due to low analysis score |

### Script Sources

| Source | Description |
|--------|-------------|
| `inline` | Inline script tag |
| `external` | External script file |
| `extension` | Chrome extension |
| `unknown` | Unknown source |

### onBlocked Callback Examples

#### Example 1: Basic Event Logging
```javascript
const pageIntegrity = new PageIntegrity({
  onBlocked: (info) => {
    console.log(`Blocked ${info.type} event from ${info.context.origin}`);
  }
});
```

#### Example 2: Detailed Event Analysis
```javascript
const pageIntegrity = new PageIntegrity({
  onBlocked: (info) => {
    const event = {
      timestamp: new Date().toISOString(),
      type: info.type,
      source: info.context.source,
      origin: info.context.origin,
      stackTrace: info.stackTrace,
      score: info.context.score,
      analysis: info.context.analysisDetails
    };
    
    // Log to monitoring service
    monitoringService.logSecurityEvent(event);
    
    // Alert on high-risk events
    if (info.context.score > 8) {
      securityTeam.alert('High-risk script blocked', event);
    }
  }
});
```

#### Example 3: Mutation Monitoring
```javascript
const pageIntegrity = new PageIntegrity({
  onBlocked: (info) => {
    if (info.context.mutationType) {
      console.log(`Blocked ${info.context.mutationType} mutation:`, {
        element: info.target.tagName,
        source: info.context.source,
        stackTrace: info.stackTrace
      });
    }
  }
});
```

#### Example 4: Extension Blocking
```javascript
const pageIntegrity = new PageIntegrity({
  blockExtensions: true,
  onBlocked: (info) => {
    if (info.type === 'extension') {
      console.warn('Chrome extension blocked:', {
        extensionId: info.context.origin,
        target: info.target,
        stackTrace: info.stackTrace
      });
    }
  }
});
```

#### Example 5: Unknown Script Reporting
```javascript
const pageIntegrity = new PageIntegrity({
  reportUnknownScripts: true,
  onBlocked: (info) => {
    if (info.type === 'unknown-origin') {
      console.log('Unknown script detected:', {
        url: info.target.src,
        source: info.context.source,
        stackTrace: info.stackTrace
      });
    }
  }
});
```

## Usage Examples

### Basic Usage

```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  blockedHosts: ['malicious.com']
});

pageIntegrity.start();
```

### Advanced Configuration

```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  strictMode: true,
  blockedHosts: ['malicious.com', 'suspicious.net'],
  allowedHosts: ['trusted.com', 'cdn.trusted.com'],
  blockExtensions: true,
  allowDynamicInline: false,
  onBlocked: (info) => {
    console.log('Blocked event:', {
      type: info.type,
      source: info.context.source,
      origin: info.context.origin,
      score: info.context.score
    });
  }
});

// Start monitoring
pageIntegrity.start();

// Get blocked scripts
const blockedScripts = pageIntegrity.getBlockedScripts();
console.log('Blocked scripts:', blockedScripts);

// Clear blocked scripts
pageIntegrity.clearBlockedScripts();
```

### React Integration

```javascript
import { useEffect } from 'react';
import { PageIntegrity } from 'page-integrity-js';

function App() {
  useEffect(() => {
    const pageIntegrity = new PageIntegrity({
      blockedHosts: ['malicious.com'],
      onBlocked: (info) => {
        // Handle blocked events
        console.log('Blocked:', info);
      }
    });

    pageIntegrity.start();

    return () => {
      pageIntegrity.stop();
    };
  }, []);

  return <div>Your app content</div>;
}
```

## Security Features

### Threat Detection

1. **Evasion Techniques**
   - CSP bypass attempts
   - Script execution hiding
   - Same-origin policy bypass attempts
   - Security feature disabling

2. **Covert Execution**
   - Hidden iframe usage
   - Stealthy script injection
   - Hidden context execution
   - Eval and Function constructor usage

3. **Security Bypass**
   - Security header modification
   - XSS filter bypass attempts
   - Security feature disabling
   - Same-origin policy bypass

4. **Malicious Intent**
   - Data theft attempts
   - Malicious code injection
   - Security setting modification
   - Data exfiltration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this library in any way you want.