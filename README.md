# Page Integrity JS

A robust JavaScript library that ensures webpage content integrity by verifying that DOM mutations come from trusted sources. This library provides a comprehensive solution for protecting your web application from unauthorized content modifications.

## Features

- **Script Registry**: Maintains a registry of all scripts with their hashes, origins, and dependencies
- **Mutation Analysis**: Analyzes and validates DOM mutations against allowed patterns
- **Trust Chain**: Builds a trust chain from script registration to mutation execution
- **Dynamic Script Monitoring**: Tracks dynamically added scripts and their mutations
- **Configurable Security**: Flexible configuration for different security requirements
- **Detailed Reporting**: Comprehensive information about content modifications
- **Extension Detection**: Identifies and blocks browser extension scripts
- **First-Party Script Protection**: Allows legitimate first-party scripts while blocking unauthorized ones
- **Debug Callbacks**: Detailed information about blocked events with stack traces

## Installation

```bash
npm install page-integrity-js
```

## Quick Start

```typescript
import PageIntegrity from 'page-integrity-js';

// Initialize with configuration
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: ['https://trusted-cdn.com'],
  strictMode: true,
  blockExtensions: true,
  allowDynamicInline: false,
  onBlocked: (info) => {
    console.log('Blocked event:', {
      type: info.type,
      stackTrace: info.stackTrace,
      context: info.context
    });
  },
  allowedMutations: {
    elementTypes: ['div', 'span', 'p', 'a', 'img', 'button'],
    attributes: ['class', 'style', 'src', 'href', 'alt'],
    patterns: [/^data-[a-z-]+$/]
  }
});

// Start monitoring DOM changes
pageIntegrity.startMonitoring();

// Get content updates for a specific element
const updates = pageIntegrity.getContentUpdates(document.querySelector('#my-element'));

// Get script registry
const scriptRegistry = pageIntegrity.getScriptRegistry();
```

## Configuration Options

### whitelistedHosts
Array of trusted hosts that are allowed to modify content. Must be valid HTTP/HTTPS URLs:
```typescript
whitelistedHosts: ['https://trusted-cdn.com', 'https://api.example.com']
```

### strictMode
When enabled, enforces strict validation of all mutations:
```typescript
strictMode: true // Default: false
```

### blockExtensions
When enabled, blocks scripts from browser extensions:
```typescript
blockExtensions: true // Default: true
```

### allowDynamicInline
When enabled, allows dynamically added inline scripts:
```typescript
allowDynamicInline: false // Default: false
```

### onBlocked
Callback function that receives information about blocked events:
```typescript
onBlocked: (info: BlockedEventInfo) => void
```

The callback receives an object with the following structure:
```typescript
interface BlockedEventInfo {
  /** Type of blocked event */
  type: 'extension' | 'dynamic-inline' | 'mutation';
  /** Target element or script that was blocked */
  target: Element | HTMLScriptElement;
  /** Stack trace of the blocked event */
  stackTrace: string;
  /** Additional context about the blocked event */
  context: {
    /** Source of the script if applicable */
    source?: ScriptSource;
    /** Origin of the script if applicable */
    origin?: string;
    /** Mutation type if applicable */
    mutationType?: MutationType;
    /** Script hash if applicable */
    scriptHash?: string;
  };
}
```

### allowedMutations
Configuration for allowed mutation types and attributes:
```typescript
allowedMutations: {
  // Allowed HTML element types
  elementTypes: ['div', 'span', 'p', 'a', 'img', 'button'],
  // Allowed HTML attributes
  attributes: ['class', 'style', 'src', 'href', 'alt'],
  // Regex patterns for allowed attributes
  patterns: [/^data-[a-z-]+$/]
}
```

## API Reference

### PageIntegrity

#### constructor(config: PageIntegrityConfig)
Creates a new PageIntegrity instance with the specified configuration.

#### startMonitoring(): void
Starts monitoring DOM changes for content integrity.

#### getContentUpdates(element: Element): MutationInfo[]
Returns an array of mutation information for the specified element.

#### clearContentUpdates(): void
Clears all recorded content updates.

#### getConfig(): PageIntegrityConfig
Returns the current configuration.

#### getScriptRegistry(): Map<string, ScriptInfo>
Returns the script registry containing information about all registered scripts.

### Types

#### PageIntegrityConfig
```typescript
interface PageIntegrityConfig {
  strictMode?: boolean;
  whitelistedHosts?: string[];
  blockExtensions?: boolean;
  allowDynamicInline?: boolean;
  onBlocked?: (info: BlockedEventInfo) => void;
  allowedMutations?: {
    elementTypes: string[];
    attributes: string[];
    patterns: RegExp[];
  };
}
```

#### BlockedEventInfo
```typescript
interface BlockedEventInfo {
  type: 'extension' | 'dynamic-inline' | 'mutation';
  target: Element | HTMLScriptElement;
  stackTrace: string;
  context: {
    source?: ScriptSource;
    origin?: string;
    mutationType?: MutationType;
    scriptHash?: string;
  };
}
```

#### ScriptInfo
```typescript
interface ScriptInfo {
  hash: string;
  origin: string;
  type: string;
  loadOrder: number;
  dependencies: string[];
  source: 'inline' | 'external' | 'extension' | 'unknown';
  isExtension: boolean;
  isFirstParty: boolean;
}
```

#### MutationInfo
```typescript
interface MutationInfo {
  target: Element;
  type: 'insert' | 'update' | 'remove';
  timestamp: number;
  scriptHash: string;
  context: {
    parentElement: Element | null;
    previousSibling: Element | null;
    nextSibling: Element | null;
  };
}
```

## Security Considerations

- Always enable `strictMode` in production environments
- Carefully configure `whitelistedHosts` to include only trusted domains
- Regularly audit the `allowedMutations` configuration
- Monitor the script registry for unexpected changes
- Consider implementing additional security measures for critical applications
- Enable `blockExtensions` to prevent browser extension interference
- Use `allowDynamicInline` carefully to prevent unauthorized inline script injection
- Regularly review script sources and execution contexts
- Use the `onBlocked` callback to monitor and debug security events

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT