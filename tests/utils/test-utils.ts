// Test Utilities for React Components
// Setup testing environment for React components

import { render as rtlRender } from '@testing-library/react';
import { server } from '@./mocks/server';
import { vi } from 'vitest';

// Mock server responses
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock authentication
vi.stubGlobal('localStorage', {
  getItem: vi.fn().mockReturnValue(JSON.stringify({ token: 'test-token' })),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Mock environment variables
vi.stubGlobal('process', {
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    GOOGLE_SHEETS_API_KEY: 'test-key',
    JWT_SECRET: 'test-secret',
  },
});

// Mock Google Sheets API
vi.mock('@googleapis', () => ({
  google: {
    sheets: {
      v4: {
        Sheets: vi.fn().mockReturnValue({
          values: {
            get: vi.fn().mockResolvedValue({ data: { values: [] } }),
            update: vi.fn().mockResolvedValue({ data: { updatedCells: 1 } }),
            append: vi.fn().mockResolvedValue({ data: { updates: { updatedCells: 1 } } }),
          },
        }),
      },
    },
  },
}));

// Mock Drizzle ORM
vi.mock('@/db/schema', () => ({
  cc_recipients: {
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
  dropdown_options: {
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}));

// Mock authentication actions
vi.mock('@/app/actions/auth', () => ({
  isAuthenticated: vi.fn().mockResolvedValue(true),
  login: vi.fn().mockResolvedValue({ success: true, token: 'test-token' }),
  logout: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  sanitizeCell: vi.fn().mockImplementation((value) => value),
  cell: vi.fn().mockImplementation((row, index) => row[index]),
}));

// Custom render function
export const render = (
  ui: React.ReactElement,
  { route = '/', ...renderOptions } = {}
) => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  
  return rtlRender(ui, {
    route,
    ...renderOptions,
  });
};

// Custom screen object
export * from '@testing-library/react';
export { render };