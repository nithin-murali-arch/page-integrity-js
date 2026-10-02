# Page Integrity JS

[![CI](https://github.com/nithin-murali-arch/page-integrity-js/actions/workflows/test.yml/badge.svg)](https://github.com/nithin-murali-arch/page-integrity-js/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)

Page Integrity JS blocks untrusted scripts and monitors mutations for PCI DSS compliance.

## Installation

```bash
npm install page-integrity-js
```

## Usage

```javascript
import { PageIntegrity } from 'page-integrity-js';

new PageIntegrity({
  whiteListedScripts: ['trusted.com'],
  blackListedScripts: ['evil.com']
});
```

## Features

- 🔒 Script behavior monitoring and analysis
- 🛡️ Domain-based script blocking
- 📊 Detailed script analysis reports
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
  strictMode: false,
  allowedDomains: ['trusted.com'],
  blockedDomains: ['malicious.com']
});

// Start monitoring
pageIntegrity.start();
```

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `strictMode` | `boolean` | Enables strict validation mode | `false` |
| `whiteListedScripts` | `string[]` | List of script URLs or patterns that are allowed to execute | `[]` |
| `blackListedScripts` | `string[]` | List of script URLs or patterns that are blocked from executing | `[]` |
| `analysisConfig` | `AnalysisConfig` | Configuration for script analysis | See below |
| `onBlocked` | `(info: BlockedEventInfo) => void` | Callback function that is called when a script is blocked | `undefined` |

### AnalysisConfig

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `minScore` | `number` | Minimum threat score to trigger blocking | `0.7` |
| `maxThreats` | `number` | Maximum number of threats allowed before blocking | `3` |
| `checkSuspiciousStrings` | `boolean` | Whether to check for suspicious strings | `true` |
| `weights` | `Record<ThreatCategory, number>` | Weights for different threat categories | See below |

### BlockedEventInfo

The `onBlocked` callback receives a `BlockedEventInfo` object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | Type of blocked event (e.g., 'script') |
| `timestamp` | `number` | Unix timestamp when the event occurred |
| `url` | `string` | URL of the blocked script |
| `source` | `string` | Source of the script (e.g., 'external') |
| `details` | `object` | Additional details about the blocked script |

Example usage of the `onBlocked` callback:

```javascript
const pageIntegrity = new PageIntegrity({
  strictMode: true,
  whiteListedScripts: ['trusted-domain.com'],
  blackListedScripts: ['malicious-domain.com'],
  onBlocked: (info) => {
    console.log('Script blocked:', info);
    // You can implement custom logging, analytics, or notifications here
  }
});
```

## Usage Examples

### Basic Protection
```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  whitelistedHosts: ['trusted.com'],
  blacklistedHosts: ['malicious.com']
});

pageIntegrity.start();
```

### Advanced Security
```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  strictMode: true,
  whitelistedHosts: ['trusted.com'],
  blacklistedHosts: ['malicious.com'],
  analysisConfig: {
    minScore: 5,
    maxThreats: 2,
    checkSuspiciousStrings: true,
    weights: {
      evasion: 4,
      covertExecution: 4,
      securityBypass: 3,
      maliciousIntent: 3
    },
    scoringRules: {
      minSafeScore: 5,
      maxThreats: 2,
      suspiciousStringWeight: 2
    }
  }
});

pageIntegrity.start();
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.