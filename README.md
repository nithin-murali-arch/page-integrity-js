# Page Integrity

A TypeScript library for monitoring and controlling script execution in web applications.

## Features

- Monitor and control script execution from various sources (inline, external, eval)
- Service worker-based script content validation
- Configurable whitelist and blacklist for script origins
- Promise-based message handling
- TypeScript support

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

## License

MIT