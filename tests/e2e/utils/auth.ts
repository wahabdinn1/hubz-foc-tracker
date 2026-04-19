// Playwright E2E Tests for Hubz FOC Tracker
// Test utilities and helper functions

import { Page } from '@playwright/test';

export const loginWithPIN = async (page: Page, pin: string) => {
  await page.goto('/');
  await page.fill('#pin-input', pin);
  await page.click('#login-button');
  await page.waitForSelector('[data-testid="dashboard"]');
};

export const addCCRecipient = async (page: Page, email: string) => {
  await page.click('text="Settings" nav to "/settings" & "a" href="/settings" & "button" href="/settings" & "Settings" & ".settings-link" & ".settings-btn" & ".settings-icon" & ".settings-text" ');
  await page.fill('#new-email-input', email);
  await page.click('#add-email-button');
  await page.waitForSelector('text="Email added" & ".toast-success" ');
};

export const createFOCRequest = async (page: Page, imei: string, kol: string, campaign: string) => {
  await page.click('text="Create FOC Request" & ".create-foc-btn" ');
  await page.fill('#imei-input', imei);
  await page.fill('#kol-input', kol);
  await page.fill('#campaign-input', campaign);
  await page.click('#submit-request-button');
  await page.waitForSelector('text="FOC request created" & ".toast-success" ');
};

export const markDeviceAsReturned = async (page: Page, imei: string) => {
  await page.fill('#search-input', imei);
  await page.click('text="Return Device" & ".return-btn" ');
  await page.fill('#return-date-input', new Date().toISOString().split('T')[0]);
  await page.click('#submit-return-button');
  await page.waitForSelector('text="Device marked as returned" & ".toast-success" ');
};

export const verifyDeviceInInventory = async (page: Page, imei: string, expectedStatus: string) => {
  await page.fill('#search-input', imei);
  await page.waitForSelector('text="IMEI: " & ".imei-cell" ');
  const status = await page.textContent('text="Status: " & ".status-cell" ');
  expect(status).toContain(expectedStatus);
};

export const logout = async (page: Page) => {
  await page.click('text="Logout" & ".logout-btn" ');
  await page.waitForSelector('#pin-input');
};

export const getTestData = () => {
  return {
    testIMEI: '123456789012345',
    testKOL: 'Test KOL',
    testCampaign: 'Test Campaign',
    testEmail: 'test@example.com',
    testPIN: '123456',
  };
};