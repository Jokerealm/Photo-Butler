import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import ImageGenerator from './ImageGenerator';

// Mock fetch globally
global.fetch = jest.fn();

// Template interface for property testing
interface Template {
  id: string;
  name: string;
  previewUrl: string;
  prompt: string;
  category?: string;
}

// Property test generators
const templateArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }),
  previewUrl: fc.webUrl(),
  prompt: fc.string({ minLength: 1 }),
  category: fc.option(fc.string())
});

const fileArbitrary = fc.constant(new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

const promptArbitrary = fc.string({ minLength: 1 });

describe('ImageGenerator Property Tests', () => {
  const mockOnGenerationComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  /**
   * **Feature: ai-image-generator, Property 11: API调用加载状态**
   * **Validates: Requirements 4.2**
   * 
   * Property: For any API call period, the system should display a loading state indicator
   */
  it('Property 11: API调用加载状态 - should display loading indicator during any API call', () => {
    fc.assert(
      fc.property(
        fileArbitrary,
        promptArbitrary.filter(p => p.trim().length > 0), // Pre-filter to avoid precondition failures
        templateArbitrary,
        (referenceImage, prompt, template) => {
          // Mock a delayed API response to ensure we can observe loading state
          let resolveUpload: (value: any) => void;
          const uploadPromise = new Promise(resolve => {
            resolveUpload = resolve;
          });

          (fetch as jest.Mock).mockImplementationOnce(() => uploadPromise);

          const { unmount } = render(
            <ImageGenerator
              referenceImage={referenceImage}
              prompt={prompt}
              selectedTemplate={template}
              onGenerationComplete={mockOnGenerationComplete}
            />
          );

          // Trigger generation
          const generateButton = screen.getByText('开始生成');
          fireEvent.click(generateButton);

          // Property: During API call, loading indicator should be displayed
          // Check for loading state indicators
          const loadingIndicators = [
            screen.queryByText('生成中...'),
            screen.queryByText('正在上传参考图片...'),
            screen.queryByText('正在调用AI生成服务...'),
            screen.queryByText('正在生成图片，请稍候...'),
          ];

          // At least one loading indicator should be present
          const hasLoadingIndicator = loadingIndicators.some(indicator => indicator !== null);
          
          // Resolve the promise to clean up
          resolveUpload({
            json: () => Promise.resolve({
              success: false,
              error: 'Test cleanup'
            })
          });

          unmount();
          
          return hasLoadingIndicator;
        }
      ),
      { 
        numRuns: 100,
        timeout: 5000
      }
    );
  });

  /**
   * Property test: Button state should reflect loading state
   */
  it('Property 11 Related: Generate button should be disabled during loading', () => {
    fc.assert(
      fc.property(
        fileArbitrary,
        promptArbitrary.filter(p => p.trim().length > 0), // Pre-filter to avoid precondition failures
        templateArbitrary,
        (referenceImage, prompt, template) => {
          // Mock delayed response
          let resolveUpload: (value: any) => void;
          const uploadPromise = new Promise(resolve => {
            resolveUpload = resolve;
          });

          (fetch as jest.Mock).mockImplementationOnce(() => uploadPromise);

          const { unmount } = render(
            <ImageGenerator
              referenceImage={referenceImage}
              prompt={prompt}
              selectedTemplate={template}
              onGenerationComplete={mockOnGenerationComplete}
            />
          );

          // Initially button should be enabled
          const generateButton = screen.getByText('开始生成');
          const initiallyEnabled = !generateButton.hasAttribute('disabled');

          // Trigger generation
          fireEvent.click(generateButton);

          // During loading, button should be disabled
          const duringLoadingDisabled = generateButton.hasAttribute('disabled');

          // Clean up
          resolveUpload({
            json: () => Promise.resolve({
              success: false,
              error: 'Test cleanup'
            })
          });

          unmount();
          
          // Property: Button should be enabled initially and disabled during loading
          return initiallyEnabled && duringLoadingDisabled;
        }
      ),
      { 
        numRuns: 100,
        timeout: 5000
      }
    );
  });
});