import { test, expect } from './fixtures';
import { testImages } from './fixtures';

test.describe('Complete Image Generation Flow', () => {
  test('should complete full generation workflow from upload to download', async ({ photoButler }) => {
    // Step 1: Navigate to the application
    await photoButler.goto();
    
    // Verify initial state - use helper method for visible upload area
    const uploadArea = await photoButler.getVisibleUploadArea();
    await expect(uploadArea).toBeVisible();
    
    // Step 2: Upload reference image
    await photoButler.uploadImage(testImages.validJpg);
    
    // Verify image preview is shown
    await expect(photoButler.page.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // Step 3: Wait for templates to load and select a template
    const layout = await photoButler.getCurrentLayout();
    const templateSelector = layout === 'mobile' 
      ? '[data-testid="mobile-layout"] [data-testid^="template-"]'
      : '[data-testid="desktop-layout"] [data-testid^="template-"]';
    
    await photoButler.page.waitForSelector(templateSelector, { timeout: 10000 });
    
    // Get the first available template
    const firstTemplate = await photoButler.page.locator(templateSelector).first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    
    await photoButler.selectTemplate(templateName);
    
    // Verify template is selected and prompt is loaded
    const selectedTemplateSelector = layout === 'mobile'
      ? `[data-testid="mobile-layout"] [data-testid="template-${templateName}"]`
      : `[data-testid="desktop-layout"] [data-testid="template-${templateName}"]`;
    await expect(photoButler.page.locator(selectedTemplateSelector)).toHaveClass(/selected/);
    
    // Check prompt editor based on current layout
    const promptEditor = layout === 'mobile'
      ? photoButler.page.locator('[data-testid="mobile-layout"] [data-testid="prompt-editor"]')
      : photoButler.page.locator('[data-testid="desktop-layout"] [data-testid="prompt-editor"]');
    await expect(promptEditor).not.toBeEmpty();
    
    // Step 4: Edit prompt (optional)
    const customPrompt = '测试提示词，生成一张美丽的艺术图片';
    await photoButler.editPrompt(customPrompt);
    
    // Verify prompt is updated
    await expect(photoButler.page.locator('[data-testid="prompt-editor"]')).toHaveValue(customPrompt);
    
    // Step 5: Generate image
    // Verify generate button is enabled
    await expect(photoButler.page.locator('[data-testid="generate-button"]')).toBeEnabled();
    
    await photoButler.generateImage();
    
    // Verify generated image is displayed
    await expect(photoButler.page.locator('[data-testid="generated-image"]')).toBeVisible();
    
    // Step 6: Download generated image
    await expect(photoButler.page.locator('[data-testid="download-button"]')).toBeVisible();
    
    const download = await photoButler.downloadImage();
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.(jpg|png)$/);
    expect(download.suggestedFilename()).toContain(templateName);
    
    // Step 7: Verify history is saved
    await photoButler.openHistory();
    
    // Verify history contains the generation
    const historyItems = photoButler.page.locator('[data-testid^="history-item-"]');
    await expect(historyItems).toHaveCount(1);
    
    // Verify history item contains all required information
    const historyItem = historyItems.first();
    await expect(historyItem.locator('[data-testid="history-original-image"]')).toBeVisible();
    await expect(historyItem.locator('[data-testid="history-generated-image"]')).toBeVisible();
    await expect(historyItem.locator('[data-testid="history-template"]')).toContainText(templateName);
    await expect(historyItem.locator('[data-testid="history-prompt"]')).toContainText(customPrompt);
    await expect(historyItem.locator('[data-testid="history-timestamp"]')).toBeVisible();
  });

  test('should maintain state consistency throughout the flow', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Upload image
    await photoButler.uploadImage(testImages.validPng);
    
    // Select template
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const templates = await photoButler.page.locator('[data-testid^="template-"]').all();
    if (templates.length > 1) {
      const secondTemplate = templates[1];
      const templateId = await secondTemplate.getAttribute('data-testid');
      const templateName = templateId?.replace('template-', '') || '';
      
      await photoButler.selectTemplate(templateName);
      
      // Verify only one template is selected
      const selectedTemplates = await photoButler.page.locator('[data-testid^="template-"].selected').count();
      expect(selectedTemplates).toBe(1);
      
      // Edit prompt
      const originalPrompt = await photoButler.page.locator('[data-testid="prompt-editor"]').inputValue();
      const modifiedPrompt = originalPrompt + ' 修改后的提示词';
      await photoButler.editPrompt(modifiedPrompt);
      
      // Verify prompt persists
      await expect(photoButler.page.locator('[data-testid="prompt-editor"]')).toHaveValue(modifiedPrompt);
      
      // Switch to another template and back
      if (templates.length > 2) {
        const thirdTemplate = templates[2];
        const thirdTemplateId = await thirdTemplate.getAttribute('data-testid');
        const thirdTemplateName = thirdTemplateId?.replace('template-', '') || '';
        
        await photoButler.selectTemplate(thirdTemplateName);
        await photoButler.selectTemplate(templateName);
        
        // Verify the modified prompt is restored
        await expect(photoButler.page.locator('[data-testid="prompt-editor"]')).toHaveValue(modifiedPrompt);
      }
    }
  });

  test('should handle multiple generations in sequence', async ({ photoButler }) => {
    await photoButler.goto();
    
    // First generation
    await photoButler.uploadImage(testImages.validJpg);
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    
    const templates = await photoButler.page.locator('[data-testid^="template-"]').all();
    
    for (let i = 0; i < Math.min(2, templates.length); i++) {
      const template = templates[i];
      const templateId = await template.getAttribute('data-testid');
      const templateName = templateId?.replace('template-', '') || '';
      
      await photoButler.selectTemplate(templateName);
      await photoButler.editPrompt(`测试提示词 ${i + 1}`);
      
      // Generate image
      await photoButler.generateImage();
      
      // Verify generation completed
      await expect(photoButler.page.locator('[data-testid="generated-image"]')).toBeVisible();
      
      // Wait a bit before next generation
      await photoButler.page.waitForTimeout(1000);
    }
    
    // Verify history contains multiple items
    await photoButler.openHistory();
    const historyItems = photoButler.page.locator('[data-testid^="history-item-"]');
    await expect(historyItems).toHaveCount(Math.min(2, templates.length));
    
    // Verify items are sorted by timestamp (newest first)
    const timestamps = await historyItems.locator('[data-testid="history-timestamp"]').allTextContents();
    for (let i = 0; i < timestamps.length - 1; i++) {
      const current = new Date(timestamps[i]).getTime();
      const next = new Date(timestamps[i + 1]).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});