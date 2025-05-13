import PageIntegrity, { MutationType, ElementType } from './index';

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
      elementTypes: ['div', 'span', 'p'] as ElementType[],
      attributes: ['class', 'style'],
      patterns: [/^data-[a-z-]+$/]
    }
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    const script = document.createElement('script');
    script.src = 'https://trusted-cdn.com/test.js';
    script.textContent = 'console.log("test");';
    document.head.appendChild(script);

    pageIntegrity = new PageIntegrity(mockConfig);
    pageIntegrity.startMonitoring();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const instance = new PageIntegrity({ whitelistedHosts: [] });
      const config = instance.getConfig();
      
      expect(config.strictMode).toBe(false);
      expect(config.allowedMutations).toBeDefined();
      expect(config.whitelistedHosts).toEqual([]);
    });

    it('should initialize with custom configuration', () => {
      const config = pageIntegrity.getConfig();
      
      expect(config.whitelistedHosts).toEqual(['https://trusted-cdn.com']);
      expect(config.strictMode).toBe(true);
      expect(config.allowedMutations?.elementTypes).toEqual(['div', 'span', 'p']);
    });

    it('should register existing scripts', () => {
      const registry = pageIntegrity.getScriptRegistry();
      expect(registry.size).toBeGreaterThan(0);
    });
  });

  describe('Mutation Handling', () => {
    it('should track element insertions', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      expect(updates[0]?.type).toBe('insert');
    });

    it('should track element updates', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      element.className = 'updated';
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      expect(updates[1]?.type).toBe('update');
    });

    it('should track element removals', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      element.remove();
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      expect(updates[2]?.type).toBe('remove');
    });
  });

  describe('Content Updates', () => {
    it('should clear content updates', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const textNode = document.createTextNode('test');
      element.appendChild(textNode);
      
      await new Promise(r => setTimeout(r, 100));
      
      pageIntegrity.clearContentUpdates();
      const updates = pageIntegrity.getContentUpdates(element);
      expect(updates.length).toBe(0);
    });

    it('should track mutation context', async () => {
      const parent = document.createElement('div');
      const element = document.createElement('span');
      parent.appendChild(element);
      document.body.appendChild(parent);
      
      const textNode = document.createTextNode('test');
      element.appendChild(textNode);
      
      await new Promise(r => setTimeout(r, 100));
      
      const updates = pageIntegrity.getContentUpdates(element);
      expect(updates[0]?.context.parentElement).toBe(parent);
      expect(updates[0]?.context.previousSibling).toBeNull();
      expect(updates[0]?.context.nextSibling).toBeNull();
    });
  });

  describe('Script Registry', () => {
    it('should track script dependencies', () => {
      const script = document.createElement('script');
      script.src = 'https://trusted-cdn.com/dependency.js';
      script.textContent = 'import { something } from "./module";';
      document.head.appendChild(script);

      const registry = pageIntegrity.getScriptRegistry();
      const scriptInfo = Array.from(registry.values()).find(
        info => info.origin === 'https://trusted-cdn.com'
      );

      expect(scriptInfo?.dependencies).toContain('./module');
    });

    it('should maintain script load order', () => {
      const script1 = document.createElement('script');
      script1.src = 'https://trusted-cdn.com/script1.js';
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://trusted-cdn.com/script2.js';
      document.head.appendChild(script2);

      const registry = pageIntegrity.getScriptRegistry();
      const scripts = Array.from(registry.values())
        .filter(info => info.origin === 'https://trusted-cdn.com')
        .sort((a, b) => a.loadOrder - b.loadOrder);

      expect(scripts[0].hash).toContain('script1');
      expect(scripts[1].hash).toContain('script2');
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
}); 