// Test configuration for different environments
export const testConfig = {
  // Timeouts
  defaultTimeout: 30000,
  apiTimeout: 60000,
  uploadTimeout: 10000,
  
  // Test data
  testImages: {
    validJpg: 'image/film-grid-rainy-night.jpg',
    validPng: 'image/placeholder.png',
    invalidFile: 'README.md',
  },
  
  // API endpoints
  apiEndpoints: {
    upload: '/api/upload',
    templates: '/api/templates',
    generate: '/api/generate',
    download: '/api/download',
  },
  
  // Viewport sizes for responsive testing
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    smallMobile: { width: 320, height: 568 },
    largeMobile: { width:414, height: 896 },
  },
  
  // Test selectors
  selectors: {
    uploadArea: '[data-testid="upload-area"]',
    imagePreview: '[data-testid="image-preview"]',
    templatePrefix: '[data-testid^="template-"]',
    promptEditor: '[data-testid="prompt-editor"]',
    generateButton: '[data-testid="generate-button"]',
    generatedImage: '[data-testid="generated-image"]',
    downloadButton: '[data-testid="download-button"]',
    historyButton: '[data-testid="history-button"]',
    historyViewer: '[data-testid="history-viewer"]',
    errorMessage: '[data-testid="error-message"]',
    loadingIndicator: '[data-testid="loading-indicator"]',
    retryButton: '[data-testid="retry-button"]',
  },
  
  // Mock responses
  mockResponses: {
    successfulGeneration: {
      success: true,
      data: {
        generatedImageUrl: '/test-generated-image.jpg',
        generationId: 'test-generation-id',
      },
    },
    apiError: {
      success: false,
      error: '生成失败：API服务暂时不可用',
    },
    timeoutError: {
      success: false,
      error: '请求超时',
    },
    emptyTemplates: {
      success: true,
      data: {
        templates: [],
      },
    },
  },
};