import PageIntegrity from './index';

// Mock MutationRecord
class MockMutationRecord implements MutationRecord {
  type: MutationRecordType;
  target: Node;
  addedNodes: NodeList;
  removedNodes: NodeList;
  previousSibling: Node | null;
  nextSibling: Node | null;
  attributeName: string | null;
  attributeNamespace: string | null;
  oldValue: string | null;

  constructor() {
    this.type = 'attributes';
    this.target = document.createElement('div');
    this.addedNodes = document.createRange().createContextualFragment('').childNodes;
    this.removedNodes = document.createRange().createContextualFragment('').childNodes;
    this.previousSibling = null;
    this.nextSibling = null;
    this.attributeName = null;
    this.attributeNamespace = null;
    this.oldValue = null;
  }
}

describe('PageIntegrity', () => {
  let pageIntegrity: PageIntegrity;
  const mockConfig = {
    whitelistedHosts: ['https://trusted-cdn.com'],
    strictMode: true,
    allowedMutations: {
      elementTypes: ['div', 'span', 'p'],
      attributes: ['class', 'style'],
      patterns: [/^data-[a-z-]+$/]
    }
  };

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create test elements
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create test script
    const script = document.createElement('script');
    script.src = 'https://trusted-cdn.com/test.js';
    script.textContent = 'console.log("test");';
    document.head.appendChild(script);

    pageIntegrity = new PageIntegrity(mockConfig);
    pageIntegrity.startMonitoring();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const instance = new PageIntegrity({
        whitelistedHosts: []
      });
      const config = instance.getConfig();
      expect(config.strictMode).toBe(false);
      expect(config.allowedMutations).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const config = pageIntegrity.getConfig();
      expect(config.whitelistedHosts).toEqual(['https://trusted-cdn.com']);
      expect(config.strictMode).toBe(true);
      expect(config.allowedMutations?.elementTypes).toEqual(['div', 'span', 'p']);
    });

    test('should register existing scripts', () => {
      const registry = pageIntegrity.getScriptRegistry();
      expect(registry.size).toBeGreaterThan(0);
    });
  });

  describe('Script Registry', () => {
    test('should register new scripts', () => {
      const script = document.createElement('script');
      script.src = 'https://trusted-cdn.com/new.js';
      document.head.appendChild(script);

      const registry = pageIntegrity.getScriptRegistry();
      const hasNewScript = Array.from(registry.values()).some(
        info => info.origin === 'https://trusted-cdn.com' && info.hash
      );
      expect(hasNewScript).toBe(true);
    });

    test('should track script dependencies', () => {
      const script = document.createElement('script');
      script.textContent = `
        import { something } from 'https://trusted-cdn.com/dep.js';
        require('https://trusted-cdn.com/other.js');
      `;
      // @ts-ignore: Accessing private method for test
      const deps = (pageIntegrity as any).extractDependencies(script);
      expect(deps).toContain('https://trusted-cdn.com/dep.js');
      expect(deps).toContain('https://trusted-cdn.com/other.js');
    });
  });

  describe('Mutation Monitoring', () => {
    test('should detect and record mutations', async () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      document.body.appendChild(element);
      
      // Simulate a mutation
      const textNode = document.createTextNode('test content');
      element.appendChild(textNode);
      element.setAttribute('class', 'test-class');
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      console.log('DEBUG updates:', updates);
      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0]?.type).toBe('update');
    });

    test('should validate allowed element types', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const textNode = document.createTextNode('test');
      element.appendChild(textNode);
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      console.log('DEBUG updates:', updates);
      expect(updates[0]?.type).toBe('insert');
    });

    test('should validate allowed attributes', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      element.setAttribute('class', 'test-class');
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      console.log('DEBUG updates:', updates);
      expect(updates[0]?.type).toBe('update');
    });

    test('should validate data attributes', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      element.setAttribute('data-test', 'value');
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      console.log('DEBUG updates:', updates);
      expect(updates[0]?.type).toBe('update');
    });
  });

  describe('Security Features', () => {
    test('should reject mutations from unauthorized sources in strict mode', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      // Mock a mutation from an unauthorized source
      const mutation = new MockMutationRecord();
      mutation.target = element;
      mutation.type = 'attributes';
      mutation.attributeName = 'class';

      // @ts-ignore - Accessing private method for testing
      const isAllowed = pageIntegrity.isAllowedMutation(mutation, '');
      expect(isAllowed).toBe(false);
    });

    test('should allow mutations from whitelisted hosts', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      // Mock a mutation from a whitelisted host
      const mutation = new MockMutationRecord();
      mutation.target = element;
      mutation.type = 'attributes';
      mutation.attributeName = 'class';

      const scriptHash = Array.from(pageIntegrity.getScriptRegistry().keys())[0];
      // @ts-ignore - Accessing private method for testing
      const isAllowed = pageIntegrity.isAllowedMutation(mutation, scriptHash);
      expect(isAllowed).toBe(true);
    });
  });

  describe('Content Updates', () => {
    test('should clear content updates', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const textNode = document.createTextNode('test');
      element.appendChild(textNode);
      
      await new Promise(r => setTimeout(r, 100));
      
      pageIntegrity.clearContentUpdates();
      const updates = pageIntegrity.getContentUpdates(element);
      expect(updates.length).toBe(0);
    });

    test('should track mutation context', async () => {
      const parent = document.createElement('div');
      const element = document.createElement('span');
      parent.appendChild(element);
      document.body.appendChild(parent);
      
      const textNode = document.createTextNode('test');
      element.appendChild(textNode);
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      console.log('DEBUG updates:', updates);
      expect(updates[0]?.context.parentElement).toBe(parent);
    });
  });
}); 