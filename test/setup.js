import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Basic browser environment setup
global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  addEventListener: vi.fn(),
  scrollTo: vi.fn()
};

global.document = {
  body: {
    appendChild: vi.fn()
  },
  createElement: () => ({
    style: {},
    getContext: () => ({})
  })
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
}); 