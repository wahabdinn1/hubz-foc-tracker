// Unit Tests for Validation Utilities
// Test form validation and data validation logic

import { test, expect } from '@vitest/runner';
import {
  validateEmail,
  validateIMEI,
  validateDate,
  validateDropdownOptions,
} from '@/lib/validations';

test('validateEmail should accept valid email addresses', () => {
  const validEmails = [
    'test@example.com',
    'user.name@domain.co',
    'user+tag@domain.com',
    'user@sub.domain.com',
  ];

  validEmails.forEach(email => {
    expect(validateEmail(email)).toBe(true);
  });
});

test('validateEmail should reject invalid email addresses', () => {
  const invalidEmails = [
    'test@.com',
    'test@domain',
    'test@domain,com',
    'test@domain..com',
    'test@domain.c',
  ];

  invalidEmails.forEach(email => {
    expect(validateEmail(email)).toBe(false);
  });
});

test('validateIMEI should accept valid IMEI numbers', () => {
  const validIMEIs = [
    '123456789012345',
    '1234567890123456',
    '000000000000000',
    '987654321098765',
  ];

  validIMEIs.forEach(imei => {
    expect(validateIMEI(imei)).toBe(true);
  });
});

test('validateIMEI should reject invalid IMEI numbers', () => {
  const invalidIMEIs = [
    '123', // Too short
    '12345678901234567', // Too long
    '123456789012345a', // Contains letters
    '', // Empty
    '123-456-789-012-345', // Contains hyphens
  ];

  invalidIMEIs.forEach(imei => {
    expect(validateIMEI(imei)).toBe(false);
  });
});

test('validateDate should accept valid dates', () => {
  const validDates = [
    new Date().toISOString().split('T')[0],
    '2024-01-01',
    '2025-12-31',
    '2023-07-15',
  ];

  validDates.forEach(date => {
    expect(validateDate(date)).toBe(true);
  });
});

test('validateDate should reject invalid dates', () => {
  const invalidDates = [
    '2024-02-30', // Invalid date
    '2024-13-01', // Invalid month
    '2024-01-32', // Invalid day
    '01-01-2024', // Wrong format
    '2024/01/01', // Wrong separator
  ];

  invalidDates.forEach(date => {
    expect(validateDate(date)).toBe(false);
  });
});

test('validateDropdownOptions should accept valid options', () => {
  const validOptions = {
    campaign: 'Test Campaign',
    requestor: 'Test Requestor',
    deliveryType: 'Express',
  };

  expect(validateDropdownOptions(validOptions)).toBe(true);
});

test('validateDropdownOptions should reject invalid options', () => {
  const invalidOptions = {
    campaign: '', // Empty
    requestor: null, // Null
    deliveryType: undefined, // Undefined
  };

  expect(validateDropdownOptions(invalidOptions)).toBe(false);
});