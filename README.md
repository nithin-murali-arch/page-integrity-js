# Page Integrity JS

A lightweight JavaScript library for monitoring and controlling script execution in web applications. Page Integrity JS helps protect your web application by monitoring script behavior and blocking scripts from blacklisted hosts.

## Features

- Script behavior monitoring and analysis
- Blacklist-based script blocking
- Detailed script analysis reports
- No external dependencies
- Lightweight and easy to integrate

## Installation

```bash
npm install page-integrity-js
```

## Quick Start

```javascript
import { PageIntegrity } from 'page-integrity-js';

// Initialize with configuration
const pageIntegrity = new PageIntegrity({
  blacklistedHosts: ['malicious.com', 'suspicious.net'],
  whitelistedHosts: ['trusted.com']
});

// Start monitoring
pageIntegrity.start();
```

## API Documentation

### PageIntegrity

The main class for managing script integrity.

#### Constructor

```typescript
constructor(config: PageIntegrityConfig)
```

Creates a new PageIntegrity instance with the specified configuration.

#### Configuration Options

```typescript
interface PageIntegrityConfig {
  blacklistedHosts?: string[];  // List of hosts to block
  whitelistedHosts?: string[];  // List of trusted hosts
}
```

#### Methods

##### start()

```typescript
start(): void
```

Starts monitoring script execution. This will:
- Intercept script requests
- Analyze script content
- Block scripts from blacklisted hosts
- Track all script executions

##### stop()

```typescript
stop(): void
```

Stops monitoring script execution.

##### getBlockedScripts()

```typescript
getBlockedScripts(): BlockedScript[]
```

Returns an array of all blocked scripts with their analysis results.

##### clearBlockedScripts()

```typescript
clearBlockedScripts(): void
```

Clears the list of blocked scripts.

### Script Analysis

The library analyzes scripts for various security threats:

#### Threat Categories

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

#### Analysis Results

```typescript
interface ScriptAnalysis {
  threats: string[];           // List of detected threats
  score: number;              // Threat score (higher = more suspicious)
  details: {                  // Detailed analysis information
    pattern: string;          // Pattern that triggered detection
    matches: string[];        // Matching code snippets
  }[];
}
```

### Blocked Script Information

```typescript
interface BlockedScript {
  url: string;               // Script URL
  reason: string;            // Block reason
  analysis?: ScriptAnalysis; // Analysis results if available
}
```

## Usage Examples

### Basic Usage

```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  blacklistedHosts: ['malicious.com']
});

pageIntegrity.start();
```

### Advanced Configuration

```javascript
import { PageIntegrity } from 'page-integrity-js';

const pageIntegrity = new PageIntegrity({
  blacklistedHosts: ['malicious.com', 'suspicious.net'],
  whitelistedHosts: ['trusted.com', 'cdn.trusted.com']
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
      blacklistedHosts: ['malicious.com']
    });

    pageIntegrity.start();

    return () => {
      pageIntegrity.stop();
    };
  }, []);

  return <div>Your app content</div>;
}
```

## Security Considerations

- The library focuses on monitoring and blacklist-based blocking
- Script analysis is used for monitoring and reporting only
- Blacklisted hosts are the primary blocking mechanism
- Analysis results can be used for security monitoring and alerting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details