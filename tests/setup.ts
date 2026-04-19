// Test Setup
// Configure testing environment

import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Intersection Observer
const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

 // @ts-expect-error - Mocking browser API
 window.IntersectionObserver = mockIntersectionObserver;

 // Mock Resize Observer
 const mockResizeObserver = vi.fn().mockImplementation(() => ({
   observe: vi.fn(),
   unobserve: vi.fn(),
   disconnect: vi.fn(),
 }));

 // @ts-expect-error - Mocking browser API
 window.ResizeObserver = mockResizeObserver;

// Mock console.warn to suppress warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock console.error to suppress errors in tests
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock fetch API
vi.stubGlobal('fetch', vi.fn());

// Mock localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Mock sessionStorage
vi.stubGlobal('sessionStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Mock document.createRange
if (!document.createRange) {
  document.createRange = () => ({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    commonAncestorContainer: document.body,
    getBoundingClientRect: vi.fn().mockReturnValue({ width: 0, height: 0 }),
    getClientRects: vi.fn().mockReturnValue([]),
  });
}

// Mock Date.now for consistent timestamps
vi.stubGlobal('Date', class extends Date {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]) {
    if (args.length === 0) {
      return new Date(1234567890000);
    }
    return new Date(...args);
  }
});