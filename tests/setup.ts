import fetch, { Request, Response, Headers } from 'node-fetch';
import { TextEncoder } from 'util';

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