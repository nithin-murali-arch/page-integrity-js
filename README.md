# Page Integrity JS

A robust JavaScript library for protecting web applications against malicious script injections and unauthorized script executions. Page Integrity JS provides a comprehensive solution for script security, offering both static and dynamic script analysis, caching mechanisms, and configurable blocking rules.

## Features

- 🔒 **Script Security**: Protect against malicious script injections and unauthorized script executions
- 🛡️ **Multiple Protection Layers**:
  - Static analysis of script content
  - Dynamic analysis of script behavior
  - Origin-based blocking rules
  - Hash-based script verification
- ⚡ **Performance Optimized**:
  - Efficient script analysis
  - Response caching
  - Minimal performance impact
- 🔄 **Flexible Configuration**:
  - Whitelist/blacklist domains
  - Custom blocking rules
  - Configurable analysis depth
- 🛠️ **Developer Friendly**:
  - TypeScript support
  - Comprehensive API
  - Detailed documentation
  - Extensive test coverage

## Installation

```bash
npm install page-integrity-js
```

## Quick Start

```typescript
import { PageIntegrity } from 'page-integrity-js';

// Initialize with configuration
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: ['trusted-domain.com'],
  blacklistedHosts: ['malicious-domain.com'],
  onBlocked: (event) => {
    console.log('Blocked script:', event);
  }
});
```

## Configuration Options

```typescript
interface PageIntegrityConfig {
  // List of trusted domains
  whitelistedHosts?: string[];
  
  // List of blocked domains
  blacklistedHosts?: string[];
  
  // Allow dynamic inline scripts
  allowDynamicInline?: boolean;
  
  // Callback for blocked scripts
  onBlocked?: (event: BlockedScriptEvent) => void;
  
  // Cache configuration
  cacheConfig?: {
    enabled: boolean;
    maxAge: number;
  };
}
```

## Advanced Usage

### Domain Pattern Examples

Page Integrity JS supports various patterns for whitelisting and blacklisting domains and specific scripts:

```typescript
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: [
    // Exact domain match
    'trusted-domain.com',
    
    // Wildcard subdomain
    '*.trusted-domain.com',
    
    // Specific path
    'trusted-domain.com/scripts/*',
    
    // Multiple subdomains
    'api.trusted-domain.com',
    'cdn.trusted-domain.com',
    
    // Protocol specific
    'https://trusted-domain.com',
    
    // Port specific
    'trusted-domain.com:8080',
    
    // Complex patterns
    'https://*.trusted-domain.com/scripts/*',
    'https://trusted-domain.com/api/*',

    // Specific script files
    'trusted-domain.com/scripts/main.js',
    'cdn.trusted-domain.com/vendor/jquery.min.js',
    'https://trusted-domain.com/dist/bundle.js',
    
    // Scripts with query parameters
    'trusted-domain.com/script.js?v=1.0.0',
    'trusted-domain.com/script.js?version=2.1.0',
    
    // Scripts with specific hashes
    'trusted-domain.com/script.js#sha256-abc123',
    'trusted-domain.com/script.js#integrity=sha384-xyz789'
  ],
  
  blacklistedHosts: [
    // Block specific malicious domains
    'malicious-domain.com',
    
    // Block all subdomains
    '*.malicious-domain.com',
    
    // Block specific paths
    'malicious-domain.com/evil/*',
    
    // Block HTTP (non-secure) scripts
    'http://dangerous-domain.com/*',
    
    // Block specific ports
    'malicious-domain.com:8080',
    
    // Block specific file types
    'malicious-domain.com/*.js',
    
    // Block multiple patterns
    'malicious-domain.com',
    'dangerous-domain.com',
    '*.suspicious-domain.com',

    // Block specific script files
    'malicious-domain.com/evil.js',
    'dangerous-domain.com/inject.js',
    'https://malicious-domain.com/steal.js',
    
    // Block scripts with specific query parameters
    'malicious-domain.com/script.js?inject=true',
    'dangerous-domain.com/script.js?bypass=true',
    
    // Block scripts with specific hashes
    'malicious-domain.com/script.js#sha256-known-bad-hash',
    'dangerous-domain.com/script.js#integrity=sha384-known-bad-hash'
  ],
  
  // Allow dynamic inline scripts (use with caution)
  allowDynamicInline: false,
  
  // Handle blocked scripts
  onBlocked: (event) => {
    console.log('Blocked script:', {
      url: event.url,
      reason: event.reason,
      timestamp: event.timestamp
    });
    
    // Optionally report to your analytics
    analytics.track('script_blocked', event);
  }
});
```

### Common Use Cases

1. **Basic Security Setup**:
```typescript
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: ['cdn.trusted-domain.com'],
  blacklistedHosts: ['malicious-domain.com'],
  allowDynamicInline: false
});
```

2. **Multi-CDN Setup**:
```typescript
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: [
    'cdn1.trusted-domain.com',
    'cdn2.trusted-domain.com',
    'cdn3.trusted-domain.com'
  ],
  allowDynamicInline: false
});
```

3. **Development Environment**:
```typescript
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: [
    'localhost:3000',
    'localhost:8080',
    '*.local',
    'dev.trusted-domain.com'
  ],
  allowDynamicInline: true // More permissive in development
});
```

4. **Production Environment**:
```typescript
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: [
    'https://cdn.trusted-domain.com',
    'https://api.trusted-domain.com'
  ],
  allowDynamicInline: false,
  onBlocked: (event) => {
    // Log to your monitoring service
    monitoringService.log('script_blocked', event);
  }
});
```

## Security Considerations

- **Script Analysis**: The library performs both static and dynamic analysis of scripts to detect potential threats
- **Origin Verification**: Scripts are verified against whitelisted and blacklisted domains
- **Hash Verification**: Script content is hashed and verified against known good/bad hashes
- **Cache Security**: Cached responses are stored securely and verified before use

## Performance

Page Integrity JS is designed to minimize performance impact:

- Efficient script analysis algorithms
- Response caching to reduce analysis overhead
- Configurable analysis depth for different security needs
- Minimal memory footprint

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For support, please [open an issue](https://github.com/yourusername/page-integrity-js/issues) or contact us at support@example.com.