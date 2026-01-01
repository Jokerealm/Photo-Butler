import { test, expect } from './fixtures';
import { testImages } from './fixtures';

test.describe('Error Handling Flow', () => {
  test('should handle invalid file upload gracefully', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Try to upload invalid file format
    const fileInput = photoButler.page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(testImages.invalidFile);
    
    // Verify error message is displayed
    await expect(photoButler.page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(photoButler.page.locator('[data-testid="error-message"]')).toContainText(/仅支持|格式/);
    
    // Verify no preview is shown
    await expect(photoButler.page.locator('[data-testid="image-preview"]')).not.toBeVisible();
    
    // Verify generate button remains disabled
    await expect(photoButler.page.locator('[data-testid="generate-button"]')).toBeDisabled();
  });

  test('should handle empty prompt validation', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Upload valid image
    await photoButler.uploadImage(testImages.validJpg);
    
    // Select template
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    await photoButler.selectTemplate(templateName);
    
    // Clear the prompt
    await photoButler.editPrompt('');
    
    // Verify generate button is disabled
    await expect(photoButler.page.locator('[data-testid="generate-button"]')).toBeDisabled();
    
    // Add some text and verify button is enabled
    await photoButler.editPrompt('测试提示词');
    await expect(photoButler.page.locator('[data-testid="generate-button"]')).toBeEnabled();
  });

  test('should handle API generation failures', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Upload image and select template
    await photoButler.uploadImage(testImages.validJpg);
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    await photoButler.selectTemplate(templateName);
    
    // Mock API failure by intercepting the request
    await photoButler.page.route('**/api/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '生成失败：API服务暂时不可用'
        })
      });
    });
    
    // Try to generate
    await photoButler.page.click('[data-testid="generate-button"]');
    
    // Verify loading state appears first
    await expect(photoButler.page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Verify error message appears
    await expect(photoButler.page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(photoButler.page.locator('[data-testid="error-message"]')).toContainText(/生成失败|API服务/);
    
    // Verify retry button is available
    await expect(photoButler.page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Verify loading state is cleared
    await expect(photoButler.page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });

  test('should handle network timeout gracefully', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Upload image and select template
    await photoButler.uploadImage(testImages.validPng);
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    await photoButler.selectTemplate(templateName);
    
    // Mock timeout by delaying the response
    await photoButler.page.route('**/api/generate', route => {
      // Delay response to simulate timeout
      setTimeout(() => {
        route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: '请求超时'
          })
        });
      }, 35000); // Longer than expected timeout
    });
    
    // Try to generate
    await photoButler.page.click('[data-testid="generate-button"]');
    
    // Verify loading state
    await expect(photoButler.page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Wait for timeout error (with reasonable test timeout)
    await expect(photoButler.page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 40000 });
    await expect(photoButler.page.locator('[data-testid="error-message"]')).toContainText(/超时|timeout/i);
  });

  test('should handle localStorage quota exceeded', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Fill localStorage to near capacity
    await photoButler.page.evaluate(() => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB of data
      for (let i = 0; i < 5; i++) {
        try {
          localStorage.setItem(`test_data_${i}`, largeData);
        } catch (e) {
          // Storage full
          break;
        }
      }
    });
    
    // Complete a generation flow
    await photoButler.uploadImage(testImages.validJpg);
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    await photoButler.selectTemplate(templateName);
    
    // Mock successful generation
    await photoButler.page.route('**/api/generate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generatedImageUrl: '/test-generated-image.jpg',
            generationId: 'test-id'
          }
        })
      });
    });
    
    await photoButler.page.click('[data-testid="generate-button"]');
    
    // If localStorage is full, should show warning but continue working
    const warningMessage = photoButler.page.locator('[data-testid="storage-warning"]');
    if (await warningMessage.isVisible()) {
      await expect(warningMessage).toContainText(/存储空间|历史记录/);
    }
    
    // Clean up test data
    await photoButler.page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        localStorage.removeItem(`test_data_${i}`);
      }
    });
  });

  test('should handle missing templates gracefully', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Mock empty templates response
    await photoButler.page.route('**/api/templates', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            templates: []
          }
        })
      });
    });
    
    // Reload to get empty templates
    await photoButler.page.reload();
    await photoButler.page.waitForLoadState('networkidle');
    
    // Upload image
    await photoButler.uploadImage(testImages.validJpg);
    
    // Verify empty state message for templates
    await expect(photoButler.page.locator('[data-testid="templates-empty-state"]')).toBeVisible();
    await expect(photoButler.page.locator('[data-testid="templates-empty-state"]')).toContainText(/暂无模板|模板加载/);
    
    // Verify generate button is disabled
    await expect(photoButler.page.locator('[data-testid="generate-button"]')).toBeDisabled();
  });

  test('should recover from errors and allow retry', async ({ photoButler }) => {
    await photoButler.goto();
    
    // Upload image and select template
    await photoButler.uploadImage(testImages.validJpg);
    await photoButler.page.waitForSelector('[data-testid^="template-"]');
    const firstTemplate = await photoButler.page.locator('[data-testid^="template-"]').first();
    const templateId = await firstTemplate.getAttribute('data-testid');
    const templateName = templateId?.replace('template-', '') || '';
    await photoButler.selectTemplate(templateName);
    
    let requestCount = 0;
    
    // Mock first request to fail, second to succeed
    await photoButler.page.route('**/api/generate', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: '临时错误'
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              generatedImageUrl: '/test-generated-image.jpg',
              generationId: 'test-id'
            }
          })
        });
      }
    });
    
    // First attempt - should fail
    await photoButler.page.click('[data-testid="generate-button"]');
    await expect(photoButler.page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Retry - should succeed
    await photoButler.page.click('[data-testid="retry-button"]');
    await expect(photoButler.page.locator('[data-testid="generated-image"]')).toBeVisible();
    
    // Verify error message is cleared
    await expect(photoButler.page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });
});