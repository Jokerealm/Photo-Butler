import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageGenerator from './ImageGenerator';

// Mock fetch globally
global.fetch = jest.fn();

// Mock template for testing
const mockTemplate = {
  id: 'test-template',
  name: '测试模板',
  previewUrl: '/images/test.jpg',
  prompt: '测试提示词',
};

// Mock file for testing
const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

describe('ImageGenerator', () => {
  const mockOnGenerationComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders component with correct title', () => {
    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    expect(screen.getByText('4. 生成AI图片')).toBeInTheDocument();
  });

  it('shows ready status when all requirements are met', () => {
    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    expect(screen.getByText('准备就绪，可以开始生成')).toBeInTheDocument();
    expect(screen.getByText('开始生成')).toBeEnabled();
  });

  it('shows missing requirements when reference image is null', () => {
    render(
      <ImageGenerator
        referenceImage={null}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    expect(screen.getByText('请先上传参考图片')).toBeInTheDocument();
    expect(screen.getByText('开始生成')).toBeDisabled();
  });

  it('shows missing requirements when template is null', () => {
    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={null}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    expect(screen.getByText('请选择一个模板')).toBeInTheDocument();
    expect(screen.getByText('开始生成')).toBeDisabled();
  });

  it('shows missing requirements when prompt is empty', () => {
    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt=""
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    expect(screen.getByText('请输入提示词')).toBeInTheDocument();
    expect(screen.getByText('开始生成')).toBeDisabled();
  });

  it('disables generation when disabled prop is true', () => {
    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
        disabled={true}
      />
    );

    expect(screen.getByText('开始生成')).toBeDisabled();
  });

  it('handles successful generation flow', async () => {
    // Mock successful upload response
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { imageId: 'test-image-id', imageUrl: '/uploads/test.jpg' }
        })
      })
      // Mock successful generation response
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { 
            generatedImageUrl: '/generated/test.jpg',
            generationId: 'test-gen-id'
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

    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    // Check loading state
    expect(screen.getByText('生成中...')).toBeInTheDocument();
    expect(screen.getByText('正在上传参考图片...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('图片生成成功！')).toBeInTheDocument();
    });

    // Check if generated image is displayed
    expect(screen.getByAltText('AI生成的图片')).toBeInTheDocument();
    expect(screen.getByText('生成结果')).toBeInTheDocument();

    // Check if callback was called
    expect(mockOnGenerationComplete).toHaveBeenCalledWith({
      imageUrl: '/generated/test.jpg',
      timestamp: expect.any(Number),
      template: '测试模板',
      prompt: '测试提示词',
      generationId: 'test-gen-id'
    });
  });

  it('handles upload failure', async () => {
    // Mock failed upload response
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: false,
        error: '上传失败'
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

    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('生成失败')).toBeInTheDocument();
      expect(screen.getByText('上传失败')).toBeInTheDocument();
    });

    // Check retry button
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('handles generation API failure', async () => {
    // Mock successful upload but failed generation
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { imageId: 'test-image-id', imageUrl: '/uploads/test.jpg' }
        })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'API调用失败'
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

    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('生成失败')).toBeInTheDocument();
      expect(screen.getByText('API调用失败')).toBeInTheDocument();
    });

    // Check retry button
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('handles network error', async () => {
    // Mock network error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('生成失败')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('allows retry after failure', async () => {
    // Mock initial failure then success
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
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
            generatedImageUrl: '/generated/test.jpg',
            generationId: 'test-gen-id'
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

    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByText('重试');
    fireEvent.click(retryButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('图片生成成功！')).toBeInTheDocument();
    });
  });

  it('displays generation info correctly', async () => {
    // Mock successful generation
    (fetch as jest.Mock)
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
            generatedImageUrl: '/generated/test.jpg',
            generationId: 'test-gen-id-123'
          }
        })
      });

    render(
      <ImageGenerator
        referenceImage={mockFile}
        prompt="测试提示词内容"
        selectedTemplate={mockTemplate}
        onGenerationComplete={mockOnGenerationComplete}
      />
    );

    const generateButton = screen.getByText('开始生成');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('图片生成成功！')).toBeInTheDocument();
    });

    // Check generation info
    expect(screen.getByText('测试模板')).toBeInTheDocument();
    expect(screen.getByText('test-gen-id-123')).toBeInTheDocument();
    expect(screen.getByText('测试提示词内容')).toBeInTheDocument();
    expect(screen.getByText('重新生成')).toBeInTheDocument();
    expect(screen.getByText('下载图片')).toBeInTheDocument();
  });
});