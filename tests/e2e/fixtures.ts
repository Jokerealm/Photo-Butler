import { test as base, expect } from '@playwright/test';
import path from 'path';

// Test fixtures for common test data
export const testImages = {
  validJpg: path.join(__dirname, '../../image/film-grid-rainy-night.jpg'),
  validPng: path.join(__dirname, '../../image/placeholder.png'),
  invalidFile: path.join(__dirname, '../../README.md'),
};

// Helper functions for common actions
export class PhotoButlerPage {
  constructor(public page: any) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async uploadImage(imagePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(imagePath);
    
    // Wait for upload to complete
    await this.page.waitForSelector('[data-testid="image-preview"]', { timeout: 10000 });
  }

  async selectTemplate(templateName: string) {
    await this.page.click(`[data-testid="template-${templateName}"]`);
    await this.page.waitForSelector(`[data-testid="template-${templateName}"].selected`);
  }

  async editPrompt(promptText: string) {
    const promptEditor = this.page.locator('[data-testid="prompt-editor"]');
    await promptEditor.clear();
    await promptEditor.fill(promptText);
  }

  async generateImage() {
    await this.page.click('[data-testid="generate-button"]');
    
    // Wait for generation to complete (with longer timeout for API call)
    await this.page.waitForSelector('[data-testid="generated-image"]', { timeout: 60000 });
  }

  async downloadImage() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('[data-testid="download-button"]');
    const download = await downloadPromise;
    return download;
  }

  async openHistory() {
    await this.page.click('[data-testid="history-button"]');
    await this.page.waitForSelector('[data-testid="history-viewer"]');
  }

  async getViewportSize() {
    return await this.page.viewportSize();
  }

  async resizeViewport(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
  }
}

// Extend the base test with our custom fixture
export const test = base.extend<{ photoButler: PhotoButlerPage }>({
  photoButler: async ({ page }, use) => {
    const photoButler = new PhotoButlerPage(page);
    await use(photoButler);
  },
});

export { expect };