import { test as setup, expect } from '@playwright/test';

// Global setup for E2E tests
setup('global setup', async ({ page }) => {
  // Verify that the application is accessible
  await page.goto('/');
  
  // Wait for the application to load
  await page.waitForLoadState('networkidle');
  
  // Verify basic elements are present
  await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
  
  console.log('E2E test environment setup completed');
});

// Cleanup function for after tests
setup('global cleanup', async ({ page }) => {
  // Clear localStorage to ensure clean state for next test run
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  console.log('E2E test environment cleanup completed');
});