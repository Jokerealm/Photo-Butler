import { test, expect } from './fixtures';
import { testImages } from './fixtures';

test.describe('Responsive Layout', () => {
  test('should display desktop layout on large screens', async ({ photoButler }) => {
    // Set desktop viewport
    await photoButler.resizeViewport(1920, 1080);
    await photoButler.goto();
    
    // Verify desktop layout elements
    await expect(photoButler.page.locator('[data-testid="desktop-layout"]')).toBeVisible();
    
    // Verify multi-column layout
    const mainContainer = photoButler.page.locator('[data-testid="main-container"]');
    await expect(mainContainer).toHaveCSS('display', /grid|flex/);
    
    // Upload image to test layout with content
    await photoButler.uploadImage(testImages.validJpg);
    
    // Verify components are arranged in columns
    const uploadSection = photoButler.page.locator('[data-testid="upload-section"]');
    const templateSection = photoButler.page.locator('[data-testid="template-section"]');
    const promptSection = photoButler.page.locator('[data-testid="prompt-section"]');
    const resultSection = photoButler.page.locator('[data-testid="result-section"]');
    
    await expect(uploadSection).toBeVisible();
    await expect(templateSection).toBeVisible();
    await expect(promptSection).toBeVisible();
    await expect(resultSection).toBeVisible();
    
    // Verify horizontal arrangement (side by side)
    const uploadBox = await uploadSection.boundingBox();
    const templateBox = await templateSection.boundingBox();
    
    if (uploadBox && templateBox) {
      // In desktop layout, sections should be arranged horizontally
      expect(Math.abs(uploadBox.y - templateBox.y)).toBeLessThan(100);
    }
  });

  test('should display mobile layout on small screens', async ({ photoButler }) => {
    // Set mobile viewport
    await photoButler.resizeViewport(375, 667);
    await photoButler.goto();
    
    // Verify mobile layout elements
    await expect(photoButler.page.locator('[data-testid="mobile-layout"]')).toBeVisible();
    
    // Verify single-column layout
    const mainContainer = photoButler.page.locator('[data-testid="main-container"]');
    await expect(mainContainer).toHaveCSS('flex-direction', 'column');
    
    // Upload image to test layout with content
    await photoButler.uploadImage(testImages.validJpg);
    
    // Verify components are stacked vertically
    const uploadSection = photoButler.page.locator('[data-testid="upload-section"]');
    const templateSection = photoButler.page.locator('[data-testid="template-section"]');
    
    const uploadBox = await uploadSection.boundingBox();
    const templateBox = await templateSection.boundingBox();
    
    if (uploadBox && templateBox) {
      // In mobile layout, sections should be stacked vertically
      expect(templateBox.y).toBeGreaterThan(uploadBox.y + uploadBox.height - 50);
    }
    
    // Verify mobile-specific UI elements
    await expect(photoButler.page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });

  test('should adapt layout when screen size changes', async ({ photoButler }) => {
    // Start with desktop
    await photoButler.resizeViewport(1200, 800);
    await photoButler.goto();
    
    // Verify desktop layout
    await expect(photoButler.page.locator('[data-testid="desktop-layout"]')).toBeVisible();
    
    // Upload image and select template
    await photoButler.uploadImage(testImages.validJpg);
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    await photoButler.selectTemplate(templateName);
    
    // Resize to mobile
    await photoButler.resizeViewport(375, 667);
    
    // Wait for layout to adapt
    await photoButler.page.waitForTimeout(500);
    
    // Verify mobile layout
    await expect(photoButler.page.locator('[data-testid="mobile-layout"]')).toBeVisible();
    
    // Verify content is preserved
    await expect(photoButler.page.locator('[data-testid="image-preview"]')).toBeVisible();
    await expect(photoButler.page.locator(`[data-testid="template-${templateName}"]`)).toHaveClass(/selected/);
    
    // Resize back to desktop
    await photoButler.resizeViewport(1200, 800);
    await photoButler.page.waitForTimeout(500);
    
    // Verify desktop layout is restored
    await expect(photoButler.page.locator('[data-testid="desktop-layout"]')).toBeVisible();
    
    // Verify content is still preserved
    await expect(photoButler.page.locator('[data-testid="image-preview"]')).toBeVisible();
    await expect(photoButler.page.locator(`[data-testid="template-${templateName}"]`)).toHaveClass(/selected/);
  });

  test('should handle mobile image upload from camera/gallery', async ({ photoButler }) => {
    // Set mobile viewport
    await photoButler.resizeViewport(375, 667);
    await photoButler.goto();
    
    // Verify mobile upload options
    const fileInput = photoButler.page.locator('[data-testid="file-input"]');
    const acceptAttribute = await fileInput.getAttribute('accept');
    
    // On mobile, should accept camera input
    expect(acceptAttribute).toContain('image/*');
    
    // Verify capture attribute for camera access
    const captureAttribute = await fileInput.getAttribute('capture');
    if (captureAttribute) {
      expect(captureAttribute).toBe('environment');
    }
    
    // Test file upload works on mobile
    await photoButler.uploadImage(testImages.validPng);
    await expect(photoButler.page.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // Verify mobile-optimized preview size
    const preview = photoButler.page.locator('[data-testid="image-preview"]');
    const previewBox = await preview.boundingBox();
    
    if (previewBox) {
      // Preview should fit mobile screen width
      expect(previewBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should maintain usability across different screen sizes', async ({ photoButler }) => {
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1024, height: 768, name: 'iPad Landscape' },
      { width: 1440, height: 900, name: 'Desktop' },
    ];
    
    for (const viewport of viewports) {
      await photoButler.resizeViewport(viewport.width, viewport.height);
      await photoButler.goto();
      
      // Verify basic functionality works at each size
      await photoButler.uploadImage(testImages.validJpg);
      await expect(photoButler.page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      // Verify templates are accessible
      await photoButler.page.waitForSelector('[data-testid^="template-"]');
      const templates = await photoButler.page.locator('[data-testid^="template-"]').count();
      expect(templates).toBeGreaterThan(0);
      
      // Verify template selection works
      const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
      await firstTemplate.click();
      
      // Verify prompt editor is accessible
      await expect(photoButler.page.locator('[data-testid="prompt-editor"]')).toBeVisible();
      
      // Verify generate button is accessible
      await expect(photoButler.page.locator('[data-testid="generate-button"]')).toBeVisible();
      
      // Verify text is readable (not too small)
      const promptEditor = photoButler.page.locator('[data-testid="prompt-editor"]');
      const fontSize = await promptEditor.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      
      const fontSizeNum = parseInt(fontSize.replace('px', ''));
      expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Minimum readable font size
    }
  });

  test('should handle orientation changes on mobile', async ({ photoButler }) => {
    // Start in portrait
    await photoButler.resizeViewport(375, 667);
    await photoButler.goto();
    
    // Upload and select template
    await photoButler.uploadImage(testImages.validJpg);
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    await photoButler.selectTemplate(templateName);
    
    // Change to landscape
    await photoButler.resizeViewport(667, 375);
    await photoButler.page.waitForTimeout(500);
    
    // Verify layout adapts to landscape
    const mainContainer = photoButler.page.locator('[data-testid="main-container"]');
    await expect(mainContainer).toBeVisible();
    
    // Verify content is preserved
    await expect(photoButler.page.locator('[data-testid="image-preview"]')).toBeVisible();
    await expect(photoButler.page.locator(`[data-testid="template-${templateName}"]`)).toHaveClass(/selected/);
    
    // Verify horizontal space is utilized better in landscape
    const templateSection = photoButler.page.locator('[data-testid="template-section"]');
    const templateBox = await templateSection.boundingBox();
    
    if (templateBox) {
      // In landscape, template section should use more horizontal space
      expect(templateBox.width).toBeGreaterThan(300);
    }
    
    // Change back to portrait
    await photoButler.resizeViewport(375, 667);
    await photoButler.page.waitForTimeout(500);
    
    // Verify content is still preserved
    await expect(photoButler.page.locator('[data-testid="image-preview"]')).toBeVisible();
    await expect(photoButler.page.locator(`[data-testid="template-${templateName}"]`)).toHaveClass(/selected/);
  });

  test('should provide accessible touch targets on mobile', async ({ photoButler }) => {
    await photoButler.resizeViewport(375, 667);
    await photoButler.goto();
    
    // Upload image
    await photoButler.uploadImage(testImages.validJpg);
    
    // Wait for templates
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    
    // Verify template buttons have adequate touch target size
    const templates = await photoButler.page.locator('[data-testid^="template-"]').all();
    
    for (const template of templates) {
      const box = await template.boundingBox();
      if (box) {
        // Touch targets should be at least 44px (iOS) or 48px (Android) in each dimension
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    // Verify generate button has adequate size
    const generateButton = photoButler.page.locator('[data-testid="generate-button"]');
    const buttonBox = await generateButton.boundingBox();
    
    if (buttonBox) {
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
    
    // Verify adequate spacing between touch targets
    if (templates.length > 1) {
      const firstBox = await templates[0].boundingBox();
      const secondBox = await templates[1].boundingBox();
      
      if (firstBox && secondBox) {
        const spacing = Math.abs(firstBox.x - secondBox.x) - firstBox.width;
        expect(spacing).toBeGreaterThanOrEqual(8); // Minimum spacing
      }
    }
  });
});