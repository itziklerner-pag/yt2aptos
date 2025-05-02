import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Increase the default timeout for async tests
jest.setTimeout(10000);

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Mock ResizeObserver which is not available in JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver which is not available in JSDOM
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out act warnings as they're mostly noisy in testing libraries
  if (args[0]?.includes?.('Warning: An update to') && args[0]?.includes?.('inside a test was not wrapped in act')) {
    return;
  }
  originalConsoleError(...args);
};