import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageGenerator from './ImageGenerator';

// Mock the template data
const mockTemplate = {
  id: 'test-template',
  name: '油画风格',
  previewUrl: '/images/test-template.jpg',
  prompt: '测试提示词'
};

// Mock file
const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ImageGenerator Download Functionality', () => {
  const mockOnGenerationComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should hide download button when no image is generated', () => {
    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    // Download button should not be visible when no image is generated
    expect(screen.queryByText('下载图片')).not.toBeInTheDocument();
  });

  it('should show download button when image is generated', async () => {
    // Mock successful upload and generation
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { imageId: 'test-image-id', imageUrl: '/uploads/test.jpg' }
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            generatedImageUrl: 'https://example.com/generated.jpg',
            generationId: 'test-generation-id'
          }
        })
      });

    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    // Click generate button
    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    // Wait for generation to complete
    await waitFor(() => {
      expect(screen.getByText('图片生成成功！')).toBeInTheDocument();
    });

    // Download button should now be visible
    expect(screen.getByText('下载图片')).toBeInTheDocument();
  });

  it('should not show download button when generation fails', async () => {
    // Mock successful upload but failed generation
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { imageId: 'test-image-id', imageUrl: '/uploads/test.jpg' }
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: '生成失败'
        })
      });

    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    // Click generate button
    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    // Wait for generation to fail
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '生成失败' })).toBeInTheDocument();
    });

    // Download button should not be visible
    expect(screen.queryByText('下载图片')).not.toBeInTheDocument();
  });
});