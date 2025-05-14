# Page Integrity JS

[![npm version](https://img.shields.io/npm/v/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![npm downloads](https://img.shields.io/npm/dm/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![Build Status](https://img.shields.io/github/actions/workflow/status/nithin-murali-arch/page-integrity-js/test.yml?branch=main)](https://github.com/nithin-murali-arch/page-integrity-js/actions)
[![Coverage](https://img.shields.io/codecov/c/github/nithin-murali-arch/page-integrity-js)](https://codecov.io/gh/nithin-murali-arch/page-integrity-js)
[![Bundle Size](https://img.shields.io/bundlephobia/min/page-integrity-js)](https://bundlephobia.com/package/page-integrity-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/nithin-murali-arch/page-integrity-js/pulls)
[![PCI DSS Compliant](https://img.shields.io/badge/PCI%20DSS-Compliant-brightgreen)](https://www.pcisecuritystandards.org/)
[![Security Audit](https://img.shields.io/badge/Security-Audit%20Ready-blue)](https://www.pcisecuritystandards.org/)
[![XSS Prevention](https://img.shields.io/badge/XSS-Prevention%20Enabled-red)](https://www.pcisecuritystandards.org/)

A library for monitoring and controlling DOM mutations and script execution, essential for PCI DSS compliance and security audits.

## Features

- DOM mutation monitoring and control
- Script execution blocking
- PCI DSS compliance support
- Security audit ready
- XSS prevention
- Service worker integration

## Installation

```bash
npm install page-integrity-js
```

## Usage

### Browser Usage

1. Copy the service worker file to your public directory:
```bash
cp node_modules/page-integrity-js/dist/service-worker.js public/page-integrity-sw.js
```

2. Register the service worker:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/page-integrity-sw.js')
    .then(registration => {
      console.log('Service Worker registered:', registration);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}
```

3. Initialize Page Integrity:

```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  whitelistedHosts: ['trusted-domain.com'],
  blacklistedHosts: ['malicious-domain.com'],
  onBlocked: (info) => {
    console.warn('Blocked script execution:', info);
  }
});

// Start monitoring
pageIntegrity.setupBlocking();
```

### TypeScript Usage

```typescript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  whitelistedHosts: ['trusted-domain.com'],
  blacklistedHosts: ['malicious-domain.com'],
  onBlocked: (info) => {
    console.warn('Blocked script execution:', info);
  }
});

// Start monitoring
pageIntegrity.setupBlocking();
```

## Configuration

The `PageIntegrity` constructor accepts a configuration object with the following options:

- `whitelistedHosts`: Array of trusted hostnames
- `blacklistedHosts`: Array of blocked hostnames
- `onBlocked`: Callback function for blocked script execution
- `skipCreateElementOverride`: Boolean to skip createElement override

## Service Worker

The library includes a service worker that intercepts and validates script content. The service worker:

- Intercepts fetch, XHR, and script element requests
- Generates content hashes for validation
- Implements LRU caching for performance
- Communicates with the main thread via message passing

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Build Process

The project uses two separate TypeScript configurations:
- `tsconfig.json` for the main library
- `tsconfig.sw.json` for the service worker

The build process:
1. Cleans the dist directory
2. Builds the main library
3. Builds the service worker

## PCI DSS Compliance

This library helps meet PCI DSS requirements by:
- Preventing unauthorized DOM modifications
- Blocking malicious script injections
- Maintaining page integrity
- Supporting security audits
- Enabling XSS prevention

## License

MIT