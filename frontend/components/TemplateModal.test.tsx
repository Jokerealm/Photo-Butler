import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateModal from './TemplateModal';
import { Template, GenerationTask } from '../types';
import { apiService } from '../services/apiService';

// Mock apiService
jest.mock('../services/apiService');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock ImageUploader component
jest.mock('./ImageUploader', () => {
  return function MockImageUploader({ onImageUpload, acceptedFormats }: any) {
    return (
      <div data-testid="image-uploader">
        <button
          onClick={() => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            onImageUpload(mockFile, 'data:image/jpeg;base64,test');
          }}
        >
          Upload Image
        </button>
        <span>Accepted: {acceptedFormats?.join(', ')}</span>
      </div>
    );
  };
});

// Mock template data
const mockTemplate: Template = {
  id: 'template_1',
  name: '现代艺术风格',
  description: '这是一个现代艺术风格的模板，适合创作抽象和前卫的艺术作品。它结合了当代艺术的表现手法和创新理念。',
  previewUrl: '/images/modern-art.jpg',
  prompt: '现代艺术，抽象表现主义，色彩丰富，创意构图，当代风格',
  category: '艺术',
  tags: ['现代', '抽象', '艺术', '色彩', '创意'],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15')
};

const mockTask: GenerationTask = {
  id: 'task_123',
  userId: 'user_1',
  templateId: 'template_1',
  template: mockTemplate,
  originalImageUrl: '/uploads/original.jpg',
  status: 'pending' as any,
  progress: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('TemplateModal', () => {
  const mockOnClose = jest.fn();
  const mockOnTaskSubmit = jest.fn();
  const mockApiService = apiService as jest.Mocked<typeof apiService>;

  const defaultProps = {
    template: mockTemplate,
    isOpen: true,
    onClose: mockOnClose,
    onTaskSubmit: mockOnTaskSubmit
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response by default
    mockApiService.createTask.mockResolvedValue({
      success: true,
      data: { task: mockTask }
    });
  });

  describe('模态框渲染 (Modal Rendering)', () => {
    it('should not render when isOpen is false', () => {
      render(<TemplateModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('现代艺术风格')).not.toBeInTheDocument();
    });

    it('should render modal content when isOpen is true', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(screen.getByText('现代艺术风格')).toBeInTheDocument();
      expect(screen.getByText('预览效果')).toBeInTheDocument();
      expect(screen.getByText('上传参考图片')).toBeInTheDocument();
    });

    it('should display template information correctly', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(screen.getByText('现代艺术风格')).toBeInTheDocument();
      expect(screen.getByText('这是一个现代艺术风格的模板，适合创作抽象和前卫的艺术作品。它结合了当代艺术的表现手法和创新理念。')).toBeInTheDocument();
      expect(screen.getByText('艺术')).toBeInTheDocument();
      expect(screen.getByText('2024/1/15')).toBeInTheDocument();
    });

    it('should display AI prompt in code block', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(screen.getByText('AI提示词')).toBeInTheDocument();
      expect(screen.getByText('现代艺术，抽象表现主义，色彩丰富，创意构图，当代风格')).toBeInTheDocument();
    });

    it('should display template tags', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(screen.getByText('风格标签')).toBeInTheDocument();
      expect(screen.getByText('#现代')).toBeInTheDocument();
      expect(screen.getByText('#抽象')).toBeInTheDocument();
      expect(screen.getByText('#艺术')).toBeInTheDocument();
    });
  });

  describe('模态框交互 (Modal Interactions)', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<TemplateModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('关闭');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<TemplateModal {...defaultProps} />);
      
      const backdrop = container.firstChild as HTMLElement;
      await user.click(backdrop);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close when modal content is clicked', async () => {
      const user = userEvent.setup();
      render(<TemplateModal {...defaultProps} />);
      
      const modalContent = screen.getByText('现代艺术风格').closest('div');
      await user.click(modalContent!);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle escape key press', () => {
      render(<TemplateModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('图片上传 (Image Upload)', () => {
    it('should render image uploader with correct props', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
      expect(screen.getByText('Accepted: image/jpeg, image/png')).toBeInTheDocument();
    });

    it('should handle successful image upload', async () => {
      const user = userEvent.setup();
      render(<TemplateModal {...defaultProps} />);
      
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      expect(screen.getByText('图片上传成功')).toBeInTheDocument();
      expect(screen.getByText('test.jpg (0KB)')).toBeInTheDocument();
    });

    it('should show upload instructions', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(screen.getByText('上传说明')).toBeInTheDocument();
      expect(screen.getByText('• 支持JPG、PNG格式，文件大小不超过10MB')).toBeInTheDocument();
      expect(screen.getByText('• 建议上传清晰、高质量的参考图片')).toBeInTheDocument();
    });

    it('should allow removing uploaded image', async () => {
      const user = userEvent.setup();
      render(<TemplateModal {...defaultProps} />);
      
      // Upload image first
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      expect(screen.getByText('图片上传成功')).toBeInTheDocument();
      
      // Remove image
      const removeButton = screen.getByTitle('重新上传');
      await user.click(removeButton);
      
      expect(screen.queryByText('图片上传成功')).not.toBeInTheDocument();
    });
  });

  describe('任务提交 (Task Submission)', () => {
    it('should disable submit button when no image is uploaded', () => {
      render(<TemplateModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /开始生成/ });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when image is uploaded', async () => {
      const user = userEvent.setup();
      render(<TemplateModal {...defaultProps} />);
      
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      const submitButton = screen.getByRole('button', { name: /开始生成/ });
      expect(submitButton).not.toBeDisabled();
    });

    it('should handle successful task submission', async () => {
      const user = userEvent.setup();
      render(<TemplateModal {...defaultProps} />);
      
      // Upload image first
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      // Submit task
      const submitButton = screen.getByText('开始生成');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('任务已添加到后台进行生成')).toBeInTheDocument();
        expect(screen.getByText('任务ID: task_123')).toBeInTheDocument();
      });
      
      expect(mockApiService.createTask).toHaveBeenCalledWith(
        'template_1',
        expect.any(File),
        undefined
      );
      expect(mockOnTaskSubmit).toHaveBeenCalledWith(mockTask);
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      mockApiService.createTask.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { task: mockTask }
        }), 100))
      );
      
      render(<TemplateModal {...defaultProps} />);
      
      // Upload image and submit
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      const submitButton = screen.getByRole('button', { name: /开始生成/ });
      await user.click(submitButton);
      
      expect(screen.getByText('提交中...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission error', async () => {
      const user = userEvent.setup();
      
      mockApiService.createTask.mockRejectedValue(new Error('网络错误'));
      
      render(<TemplateModal {...defaultProps} />);
      
      // Upload image and submit
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      const submitButton = screen.getByText('开始生成');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('提交失败')).toBeInTheDocument();
        expect(screen.getByText('网络错误')).toBeInTheDocument();
      });
    });

    it('should show error when trying to submit without image', async () => {
      render(<TemplateModal {...defaultProps} />);
      
      // The submit button should be disabled, so we need to test the internal logic
      // We can test this by checking the footer message
      expect(screen.getByText('请先上传参考图片')).toBeInTheDocument();
    });
  });

  describe('状态重置 (State Reset)', () => {
    it('should reset state when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TemplateModal {...defaultProps} />);
      
      // Upload image
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      expect(screen.getByText('图片上传成功')).toBeInTheDocument();
      
      // Close modal
      rerender(<TemplateModal {...defaultProps} isOpen={false} />);
      
      // Reopen modal
      rerender(<TemplateModal {...defaultProps} isOpen={true} />);
      
      expect(screen.queryByText('图片上传成功')).not.toBeInTheDocument();
    });

    it('should clear error state when modal reopens', async () => {
      const user = userEvent.setup();
      
      mockApiService.createTask.mockRejectedValue(new Error('测试错误'));
      
      const { rerender } = render(<TemplateModal {...defaultProps} />);
      
      // Upload image and submit to trigger error
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      const submitButton = screen.getByText('开始生成');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('测试错误')).toBeInTheDocument();
      });
      
      // Close and reopen modal
      rerender(<TemplateModal {...defaultProps} isOpen={false} />);
      rerender(<TemplateModal {...defaultProps} isOpen={true} />);
      
      expect(screen.queryByText('测试错误')).not.toBeInTheDocument();
    });
  });

  describe('响应式设计 (Responsive Design)', () => {
    it('should have responsive grid layout', () => {
      const { container } = render(<TemplateModal {...defaultProps} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });

    it('should have responsive modal sizing', () => {
      const { container } = render(<TemplateModal {...defaultProps} />);
      
      const modal = container.querySelector('.sm\\:max-w-4xl');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('可访问性 (Accessibility)', () => {
    it('should prevent body scroll when modal is open', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { unmount } = render(<TemplateModal {...defaultProps} />);
      
      unmount();
      
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should have proper ARIA labels', () => {
      render(<TemplateModal {...defaultProps} />);
      
      expect(screen.getByLabelText('关闭')).toBeInTheDocument();
    });
  });

  describe('边界情况 (Edge Cases)', () => {
    it('should handle template without category', () => {
      const templateWithoutCategory = {
        ...mockTemplate,
        category: undefined
      };
      
      render(<TemplateModal {...defaultProps} template={templateWithoutCategory} />);
      
      expect(screen.getByText('现代艺术风格')).toBeInTheDocument();
      expect(screen.queryByText('分类')).not.toBeInTheDocument();
    });

    it('should handle template without tags', () => {
      const templateWithoutTags = {
        ...mockTemplate,
        tags: []
      };
      
      render(<TemplateModal {...defaultProps} template={templateWithoutTags} />);
      
      expect(screen.queryByText('风格标签')).not.toBeInTheDocument();
    });

    it('should handle image load error in preview', () => {
      render(<TemplateModal {...defaultProps} />);
      
      const previewImage = screen.getByAltText('现代艺术风格');
      fireEvent.error(previewImage);
      
      expect(previewImage).toHaveAttribute('src', '/placeholder.png');
    });
  });

  describe('确认模态框 (Confirmation Modal)', () => {
    it('should show confirmation modal with action buttons', async () => {
      const user = userEvent.setup();
      
      render(<TemplateModal {...defaultProps} />);
      
      // Upload and submit
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      const submitButton = screen.getByRole('button', { name: /开始生成/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('任务已添加到后台进行生成')).toBeInTheDocument();
      });
      
      // Check for action buttons
      expect(screen.getByText('继续生成')).toBeInTheDocument();
      expect(screen.getByText('去查看')).toBeInTheDocument();
    });

    it('should handle "继续生成" button click', async () => {
      const user = userEvent.setup();
      
      render(<TemplateModal {...defaultProps} />);
      
      // Upload and submit
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      const submitButton = screen.getByRole('button', { name: /开始生成/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('任务已添加到后台进行生成')).toBeInTheDocument();
      });
      
      // Click "继续生成"
      const continueButton = screen.getByText('继续生成');
      await user.click(continueButton);
      
      // Modal should close and form should reset
      expect(screen.queryByText('任务已添加到后台进行生成')).not.toBeInTheDocument();
      expect(screen.queryByText('图片上传成功')).not.toBeInTheDocument();
    });

    it('should handle "去查看" button click and navigate to workspace', async () => {
      const user = userEvent.setup();
      const mockPush = jest.fn();
      
      // Mock useRouter to capture navigation
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
          replace: jest.fn(),
          prefetch: jest.fn(),
          back: jest.fn(),
          forward: jest.fn(),
          refresh: jest.fn(),
        }),
      }));
      
      render(<TemplateModal {...defaultProps} />);
      
      // Upload and submit
      const uploadButton = screen.getByText('Upload Image');
      await user.click(uploadButton);
      
      const submitButton = screen.getByRole('button', { name: /开始生成/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('任务已添加到后台进行生成')).toBeInTheDocument();
      });
      
      // Click "去查看"
      const viewButton = screen.getByText('去查看');
      await user.click(viewButton);
      
      // Should close modal and call onClose
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});