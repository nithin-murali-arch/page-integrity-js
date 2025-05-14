# Page Integrity JS

[![npm version](https://img.shields.io/npm/v/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![npm downloads](https://img.shields.io/npm/dm/page-integrity-js.svg)](https://www.npmjs.com/package/page-integrity-js)
[![Build Status](https://img.shields.io/github/actions/workflow/status/nithin-murali-arch/page-integrity-js/test.yml?branch=main)](https://github.com/nithin-murali-arch/page-integrity-js/actions)
[![Coverage](https://img.shields.io/codecov/c/github/nithin-murali-arch/page-integrity-js)](https://codecov.io/gh/nithin-murali-arch/page-integrity-js)
[![Bundle Size](https://img.shields.io/bundlephobia/min/page-integrity-js)](https://bundlephobia.com/package/page-integrity-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/nithin-murali-arch/page-integrity-js/pulls)

> A powerful library for monitoring and controlling DOM mutations and script execution in web applications. Built with TypeScript and designed for security-first applications.

## ✨ Features

- 🔒 **Security First**: Monitor and control all DOM mutations
- 🛡️ **Script Protection**: Block unauthorized script execution
- 🔄 **Service Worker Integration**: Advanced script validation
- ⚡ **Performance**: Minimal overhead with efficient monitoring
- 📦 **Zero Dependencies**: Lightweight and self-contained
- 🎯 **TypeScript Ready**: Full type definitions included

## 📦 Installation

```bash
# npm
npm install page-integrity-js

# yarn
yarn add page-integrity-js

# pnpm
pnpm add page-integrity-js
```

## 🚀 Quick Start

```typescript
import { PageIntegrity } from 'page-integrity-js';

// Initialize with configuration
const integrity = new PageIntegrity({
  whitelistedHosts: ['trusted-domain.com'],
  blacklistedHosts: ['malicious-domain.com'],
  onBlocked: (info) => {
    console.warn('Blocked script execution:', info);
  }
});

// Start monitoring
integrity.setupBlocking();
```

## 🔧 Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `whitelistedHosts` | `string[]` | `[]` | List of trusted hostnames |
| `blacklistedHosts` | `string[]` | `[]` | List of blocked hostnames |
| `onBlocked` | `(info: BlockInfo) => void` | - | Callback for blocked scripts |
| `skipCreateElementOverride` | `boolean` | `false` | Skip createElement override |

### Example Configuration

```typescript
const config = {
  whitelistedHosts: [
    'cdn.trusted.com',
    'api.secure.com'
  ],
  blacklistedHosts: [
    'malicious.com',
    'suspicious.net'
  ],
  onBlocked: (info) => {
    // Log blocked scripts
    console.warn('Blocked:', info);
    
    // Send to analytics
    analytics.track('script_blocked', info);
  }
};
```

## 🔍 Service Worker Setup

1. Copy the service worker to your public directory:
```bash
cp node_modules/page-integrity-js/dist/service-worker.js public/page-integrity-sw.js
```

2. Register the service worker:
```typescript
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

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 API Reference

### PageIntegrity

The main class for controlling page integrity.

#### Methods

- `setupBlocking()`: Start monitoring and blocking
- `stopBlocking()`: Stop monitoring and blocking
- `isBlocking()`: Check if monitoring is active

#### Events

- `onBlocked`: Triggered when a script is blocked
- `onMutation`: Triggered when DOM mutations occur

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [Nithin Murali](https://github.com/nithin-murali-arch)