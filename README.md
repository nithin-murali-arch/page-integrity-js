# Page Integrity JS

A robust JavaScript library that ensures webpage content integrity by verifying that DOM mutations come from trusted sources. Inspired by Akamai's Page Integrity Manager, this library provides a comprehensive solution for protecting your web application from unauthorized content modifications.

## Features

- **Script Registry**: Maintains a registry of all scripts with their hashes, origins, and dependencies
- **Mutation Analysis**: Analyzes and validates DOM mutations against allowed patterns
- **Trust Chain**: Builds a trust chain from script registration to mutation execution
- **Dynamic Script Monitoring**: Tracks dynamically added scripts and their mutations
- **Configurable Security**: Flexible configuration for different security requirements
- **Detailed Reporting**: Comprehensive information about content modifications

## Installation

```bash
npm install page-integrity-js
```

## Quick Start

```javascript
import PageIntegrity from 'page-integrity-js';

// Initialize with configuration
const pageIntegrity = new PageIntegrity({
  whitelistedHosts: ['https://trusted-cdn.com'],
  strictMode: true,
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
```javascript
whitelistedHosts: ['https://trusted-cdn.com', 'https://api.example.com']
```

### strictMode
When enabled, enforces strict validation of all mutations:
```javascript
strictMode: true // Default: false
```

### allowedMutations
Configuration for allowed mutation types and patterns:

```javascript
allowedMutations: {
  // Allowed HTML element types
  elementTypes: ['div', 'span', 'p', 'a', 'img', 'button'],
  
  // Allowed attributes
  attributes: ['class', 'style', 'src', 'href', 'alt'],
  
  // Regex patterns for allowed attributes (e.g., data-* attributes)
  patterns: [/^data-[a-z-]+$/]
}
```

## How It Works

### 1. Script Registry
The library maintains a registry of all scripts in your application:
- Tracks script origins and hashes
- Monitors script load order
- Records script dependencies
- Detects dynamically added scripts

### 2. Mutation Analysis
When a DOM mutation occurs, the library:
- Identifies the executing script
- Validates the mutation against allowed patterns
- Checks the mutation context
- Records detailed information about the change

### 3. Trust Chain
The library builds a trust chain by:
- Registering scripts at load time
- Tracking script dependencies
- Validating mutation sources
- Maintaining a whitelist of trusted origins

## Security Features

### Script Integrity
- Script hashing for content verification
- Origin validation
- Dependency tracking
- Load order monitoring

### Mutation Validation
- Element type validation
- Attribute whitelisting
- Pattern-based validation
- Context verification

### Trust Management
- First-party script verification
- Whitelisted host support
- Dynamic script monitoring
- Trust chain validation

## Best Practices

1. **Enable Strict Mode in Production**
   ```javascript
   const pageIntegrity = new PageIntegrity({
     strictMode: true,
     // ... other config
   });
   ```

2. **Whitelist Only Trusted Hosts**
   ```javascript
   whitelistedHosts: [
     'https://your-cdn.com',
     'https://trusted-api.com'
   ]
   ```

3. **Define Clear Mutation Rules**
   ```javascript
   allowedMutations: {
     elementTypes: ['div', 'span', 'p'],
     attributes: ['class', 'data-*'],
     patterns: [/^data-[a-z-]+$/]
   }
   ```

4. **Monitor Content Updates**
   ```javascript
   const updates = pageIntegrity.getContentUpdates(element);
   updates.forEach(update => {
     console.log(`Mutation from ${update.scriptHash}`);
   });
   ```

## Security Considerations

- The library helps prevent unauthorized content modifications
- It can detect and block malicious script injections
- Provides visibility into the source of DOM changes
- Helps maintain content integrity in production
- Supports compliance with security requirements

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see the [LICENSE](LICENSE) file for details