// Import testing libraries
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock any global browser objects that might be needed
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

// Mock browser storage if needed
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock() as unknown as Storage;
global.sessionStorage = new LocalStorageMock() as unknown as Storage;

// Mock for IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  // callback is needed in the constructor signature for the type matching
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private callback: IntersectionObserverCallback) {}
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
}

// Assign mock to global
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock for ResizeObserver
class MockResizeObserver implements ResizeObserver {
  // callback is needed in the constructor signature for the type matching
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private callback: ResizeObserverCallback) {}
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// Assign mock to global
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock for fetch if needed
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
  } as Response)
);