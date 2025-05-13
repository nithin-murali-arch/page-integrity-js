# Page Integrity JS

A robust library for ensuring webpage content integrity by monitoring and controlling script execution and DOM mutations.

## Features

- Block unauthorized script execution from blacklisted domains
- Ignore scripts from whitelisted domains
- Call a callback for scripts from unknown origins (not in whitelist or blacklist)
- Monitor and control DOM mutations
- Prevent unauthorized content modifications
- Provide detailed reporting of blocked or suspicious events
- Highly configurable security rules

## Installation

### NPM

```bash
npm install page-integrity-js
```

### Browser

```html
<script type="module">
  import { PageIntegrity } from 'path/to/page-integrity-js/dist/index.js';
</script>
```

## Usage

### Basic Usage

```javascript
// Initialize with default settings
const pageIntegrity = new PageIntegrity();

// Start monitoring
pageIntegrity.start();
```

### Advanced Configuration

```javascript
const pageIntegrity = new PageIntegrity({
  // Enable strict mode (default: true)
  strictMode: true,
  
  // List of blocked domains
  blacklistedHosts: ['evil.com', 'malicious.com'],

  // List of explicitly allowed domains
  whitelistedHosts: ['trusted.com', 'cdn.example.com'],

  // Allow dynamically added inline scripts (default: true)
  allowDynamicInline: true,
  
  // Configure allowed mutations
  allowedMutations: {
    // Allowed element types
    elementTypes: ['div', 'span', 'p', 'a', 'img'],
    // Allowed attributes
    attributes: ['class', 'style', 'src', 'href'],
    // Regex patterns for allowed attributes
    patterns: [/^data-.*/]
  },
  
  // Callback for blocked or suspicious events
  onBlocked: (info) => {
    if (info.type === 'unknown-origin') {
      console.warn('Script from unknown origin:', info.context.origin);
    } else {
      console.warn('Blocked event:', info);
    }
  }
});

// Start monitoring
pageIntegrity.start();
```

### Configuration Options

- `strictMode`: Whether to enforce strict validation of all mutations
- `blacklistedHosts`: List of blocked hosts that are not allowed to execute
- `whitelistedHosts`: List of explicitly allowed hosts (ignored by the blocker)
- `allowDynamicInline`: Whether to allow dynamically added inline scripts
- `allowedMutations`: Configuration for allowed mutations
  - `elementTypes`: Types of elements that can be modified
  - `attributes`: Attributes that can be modified
  - `patterns`: Regex patterns for allowed attributes
- `onBlocked`: Callback function for blocked or suspicious events

### Blocked Event Information

The `onBlocked` callback receives an object with the following structure:

```typescript
interface BlockedEventInfo {
  type: 'extension' | 'dynamic-inline' | 'mutation' | 'blacklisted' | 'unknown-origin' | 'eval';
  target: Element | HTMLScriptElement;
  stackTrace: string;
  context: {
    source?: ScriptSource;
    origin?: string;
    mutationType?: 'insert' | 'update' | 'remove';
    scriptHash?: string;
  };
}
```

#### Event Types
- `blacklisted`: Script from a blacklisted host was blocked
- `unknown-origin`: Script from a host not in whitelist or blacklist (not blocked, but reported)
- `dynamic-inline`: Inline script execution (if not allowed)
- `mutation`: Disallowed DOM mutation
- `eval`: Use of `eval()` detected
- `extension`: Script from a browser extension

### Error Handling
- Invalid or relative script URLs are ignored and do not trigger the callback.
- Only absolute URLs (with protocol and hostname not matching the current page) are considered for unknown-origin reporting.

## Browser Support

The library is compatible with modern browsers that support:
- ES2015 (ES6)
- ES Modules
- MutationObserver API

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test
```

## License

MIT