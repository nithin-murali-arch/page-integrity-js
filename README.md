# Page Integrity JS

[![npm version](https://img.shields.io/npm/v/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![npm downloads](https://img.shields.io/npm/dm/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![Security](https://img.shields.io/badge/Security-PCI%20DSS%20Compliant-red.svg)](https://www.pcisecuritystandards.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/min/page-integrity-js)](https://bundlephobia.com/package/page-integrity-js)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/nithin-murali-arch/page-integrity-js/actions)

A powerful JavaScript library for ensuring webpage content integrity by monitoring and controlling script execution. Essential for PCI DSS compliance and security audits.

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strictMode` | `boolean` | `false` | When enabled, enforces strict validation of all scripts. In strict mode, any script not explicitly allowed by `whitelistedHosts` will be blocked. |
| `whitelistedHosts` | `string[]` | `[]` | List of trusted domains allowed to execute scripts. When `strictMode` is true, only these domains can execute scripts. |
| `blacklistedHosts` | `string[]` | `[]` | List of blocked domains that are not allowed to execute scripts. Scripts from these domains will be blocked regardless of other settings. |
| `analysisConfig` | `object` | See below | Configuration for script analysis |

### Analysis Configuration

```typescript
interface AnalysisConfig {
  minScore: number;        // Minimum score threshold for blocking
  maxThreats: number;      // Maximum number of threats allowed
  checkSuspiciousStrings: boolean;  // Whether to check for suspicious strings
  weights: {
    evasion: number;       // Weight for evasion techniques
    covertExecution: number;  // Weight for covert execution
    securityBypass: number;   // Weight for security bypass attempts
    maliciousIntent: number;  // Weight for malicious intent
  };
  scoringRules: {
    minSafeScore: number;  // Minimum score for a script to be considered safe
    maxThreats: number;    // Maximum number of threats allowed
    suspiciousStringWeight: number;  // Weight for suspicious strings
  };
}
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