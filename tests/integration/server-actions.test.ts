// Integration Tests for Server Actions
// Test server-side functionality and API endpoints

import { test, expect } from '@vitest/runner';
import { getInventory, requestUnits, markAsReturned } from '@/server/inventory';
import { addCCRecipient, deleteCCRecipient } from '@/app/actions/settings';
import { getDropdownOptions } from '@/app/actions/settings';

// Mock database and Google Sheets API
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

test('getInventory should return inventory data', async () => {
  const inventory = await getInventory();
  expect(inventory).toBeDefined();
  expect(Array.isArray(inventory)).toBe(true);
});

test('requestUnits should create FOC request successfully', async () => {
  const result = await requestUnits({
    imei: '123456789012345',
    kol: 'Test KOL',
    campaign: 'Test Campaign',
    requestor: 'Test Requestor',
    deliveryType: 'Express',
    notes: 'Test notes',
  });
  
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.data?.imei).toBe('123456789012345');
});

test('markAsReturned should update device status', async () => {
  const result = await markAsReturned({
    imei: '123456789012345',
    returnDate: new Date().toISOString(),
    condition: 'Good',
    notes: 'Test return notes',
  });
  
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
});

test('addCCRecipient should add email to CC list', async () => {
  const result = await addCCRecipient('test@example.com');
  
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.data?.email).toBe('test@example.com');
});

test('deleteCCRecipient should remove email from CC list', async () => {
  // First add a recipient
  const addResult = await addCCRecipient('test@example.com');
  expect(addResult.success).toBe(true);
  
  // Then delete it
  const deleteResult = await deleteCCRecipient(addResult.data!.id!);
  
  expect(deleteResult.success).toBe(true);
});

test('getDropdownOptions should return dropdown options', async () => {
  const options = await getDropdownOptions();
  expect(options).toBeDefined();
  expect(Array.isArray(options)).toBe(true);
});