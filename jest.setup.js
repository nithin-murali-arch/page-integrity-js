const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.Response = class {
  constructor(body, init) {
    this.body = body;
    this.init = init;
    const headersObj = (init && init.headers) ? init.headers : {};
    this.headers = {
      get: (key) => {
        // Support both lower and original case
        const foundKey = Object.keys(headersObj).find(
          k => k.toLowerCase() === key.toLowerCase()
        );
        return foundKey ? headersObj[foundKey] : undefined;
      }
    };
  }
  text() {
    return Promise.resolve(this.body);
  }
  clone() {
    return new global.Response(this.body, this.init);
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