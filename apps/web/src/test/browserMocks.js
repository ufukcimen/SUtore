function createLocalStorage() {
  const storage = new Map();

  return {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    },
  };
}

class MockEvent {
  constructor(type) {
    this.type = type;
  }
}

class MockCustomEvent extends MockEvent {
  constructor(type, init = {}) {
    super(type);
    this.detail = init.detail;
  }
}

export function installMockBrowser() {
  const windowMock = {
    localStorage: createLocalStorage(),
    dispatchedEvents: [],
    dispatchEvent(event) {
      this.dispatchedEvents.push(event);
      return true;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  globalThis.window = windowMock;
  globalThis.Event = MockEvent;
  globalThis.CustomEvent = MockCustomEvent;

  return windowMock;
}

export function cleanupMockBrowser() {
  delete globalThis.window;
  delete globalThis.Event;
  delete globalThis.CustomEvent;
}
