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

  async getCurrentLayout() {
    const viewport = await this.page.viewportSize();
    const isMobile = viewport && viewport.width < 1024; // lg breakpoint
    return isMobile ? 'mobile' : 'desktop';
  }

  async getVisibleUploadArea() {
    const layout = await this.getCurrentLayout();
    return layout === 'mobile' 
      ? this.page.locator('[data-testid="mobile-layout"] [data-testid="upload-area"]')
      : this.page.locator('[data-testid="desktop-layout"] [data-testid="upload-area"]');
  }

  async uploadImage(imagePath: string) {
    // Determine which layout is visible and use the appropriate selector
    const viewport = await this.page.viewportSize();
    const isMobile = viewport && viewport.width < 1024; // lg breakpoint
    
    const fileInput = isMobile 
      ? this.page.locator('[data-testid="mobile-layout"] [data-testid="file-input"]')
      : this.page.locator('[data-testid="desktop-layout"] [data-testid="file-input"]');
    
    await fileInput.setInputFiles(imagePath);
    
    // Wait for upload to complete
    await this.page.waitForSelector('[data-testid="image-preview"]', { timeout: 10000 });
  }

  async selectTemplate(templateName: string) {
    const layout = await this.getCurrentLayout();
    const templateSelector = layout === 'mobile'
      ? `[data-testid="mobile-layout"] [data-testid="template-${templateName}"]`
      : `[data-testid="desktop-layout"] [data-testid="template-${templateName}"]`;
    
    await this.page.click(templateSelector);
    
    // Wait for template to be selected (check for selected class)
    await this.page.waitForSelector(`${templateSelector}.selected`, { timeout: 5000 });
  }

  async editPrompt(promptText: string) {
    const layout = await this.getCurrentLayout();
    const promptEditor = layout === 'mobile'
      ? this.page.locator('[data-testid="mobile-layout"] [data-testid="prompt-editor"]')
      : this.page.locator('[data-testid="desktop-layout"] [data-testid="prompt-editor"]');
    
    await promptEditor.clear();
    await promptEditor.fill(promptText);
  }

  async generateImage() {
    const layout = await this.getCurrentLayout();
    const generateButton = layout === 'mobile'
      ? this.page.locator('[data-testid="mobile-layout"] [data-testid="generate-button"]')
      : this.page.locator('[data-testid="desktop-layout"] [data-testid="generate-button"]');
    
    await generateButton.click();
    
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