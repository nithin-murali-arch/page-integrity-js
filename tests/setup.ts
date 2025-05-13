// Mock MutationObserver
class MockMutationObserver implements MutationObserver {
  private callback: MutationCallback;
  private target: Node | null = null;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe(target: Node, options?: MutationObserverInit): void {
    this.target = target;
  }

  disconnect(): void {
    this.target = null;
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  simulateMutation(mutations: MutationRecord[]): void {
    if (this.target) {
      this.callback(mutations, this);
    }
  }
}

// Mock NodeList
class MockNodeList implements NodeList {
  private nodes: Node[] = [];

  constructor(nodes: Node[] = []) {
    this.nodes = nodes;
  }

  get length(): number {
    return this.nodes.length;
  }

  item(index: number): Node | null {
    return this.nodes[index] || null;
  }

  forEach(callback: (node: Node, index: number, list: NodeList) => void, thisArg?: any): void {
    this.nodes.forEach((node, index) => callback.call(thisArg, node, index, this));
  }

  entries(): IterableIterator<[number, Node]> {
    return this.nodes.entries();
  }

  keys(): IterableIterator<number> {
    return this.nodes.keys();
  }

  values(): IterableIterator<Node> {
    return this.nodes.values();
  }

  [Symbol.iterator](): IterableIterator<Node> {
    return this.nodes[Symbol.iterator]();
  }

  [index: number]: Node;

  // Add this method for test convenience
  addNode(node: Node): void {
    this.nodes.push(node);
  }
}

// Save the true original createElement before any override
const trueOriginalCreateElement = Document.prototype.createElement;

beforeEach(() => {
  document.createElement = trueOriginalCreateElement;
});

// Add test utilities to global scope
(global as any).createMockScriptElement = (src?: string, text?: string): HTMLScriptElement => {
  const script = document.createElement('script');
  if (src) script.src = src;
  if (text) script.textContent = text;
  return script;
};

(global as any).simulateDOMChange = (target: Node, type: 'childList' | 'attributes' | 'characterData', changes: Partial<MutationRecord>): void => {
  const mutation: MutationRecord = {
    type,
    target,
    addedNodes: new MockNodeList(Array.isArray(changes.addedNodes) ? changes.addedNodes : []),
    removedNodes: new MockNodeList(Array.isArray(changes.removedNodes) ? changes.removedNodes : []),
    previousSibling: changes.previousSibling || null,
    nextSibling: changes.nextSibling || null,
    attributeName: changes.attributeName || null,
    attributeNamespace: changes.attributeNamespace || null,
    oldValue: changes.oldValue || null
  };

  const observer = (target as any)._observer as MockMutationObserver;
  if (observer) {
    observer.simulateMutation([mutation]);
  }
};

(global as any).MockNodeList = MockNodeList;

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// After all imports, restore document.createElement to the true original
document.createElement = trueOriginalCreateElement; 