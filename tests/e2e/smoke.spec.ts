import { test, expect } from './fixtures';

test.describe('Smoke Tests', () => {
  test('should load the application successfully', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Verify basic page structure
    await expect(photoButler.page).toHaveTitle(/Photo Butler|AI图片生成/);
    
    // Verify main components are present - use the helper method to get visible upload area
    const uploadArea = await photoButler.getVisibleUploadArea();
    await expect(uploadArea).toBeVisible();
    
    console.log('✅ Application loads successfully');
  });

  test('should have responsive meta tag', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Check for responsive viewport meta tag
    const viewportMeta = await photoButler.page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
    
    console.log('✅ Responsive meta tag is present');
  });

  test('should load without JavaScript errors', async ({ photoButler }) => {
    const errors: string[] = [];
    
    photoButler.page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await photoButler.goto();
    
    // Wait for page to fully load
    await photoButler.page.waitForLoadState('networkidle');
    
    // Check for JavaScript errors
    expect(errors).toHaveLength(0);
    
    console.log('✅ No JavaScript errors detected');
  });
});