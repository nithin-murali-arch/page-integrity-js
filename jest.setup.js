const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.Response = class {
  constructor(body, init) {
    this.body = body;
    this.init = init;
  }
  text() {
    return Promise.resolve(this.body);
  }
};

global.Request = class {
  constructor(url, init) {
    this.url = url;
    this.init = init;
  }
};

global.FetchEvent = class {
  constructor(type, init) {
    this.type = type;
    this.request = init.request;
    this.respondWith = jest.fn();
  }
}; 