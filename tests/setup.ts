import fetch, { Request, Response, Headers } from 'node-fetch';
import { TextEncoder } from 'util';

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

// Add type declarations
declare global {
  interface Window {
    TextEncoder: typeof TextEncoder;
    Request: typeof Request;
    Response: typeof Response;
    Headers: typeof Headers;
  }
}

// Add global polyfills
global.fetch = fetch as any;
global.Request = Request as any;
global.Response = Response as any;
global.Headers = Headers as any;
global.TextEncoder = TextEncoder; 