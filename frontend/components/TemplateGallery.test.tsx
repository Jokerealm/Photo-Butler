import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateGallery from './TemplateGallery';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock template data
const mockTemplates = [
  {
    id: 'template_1',
    name: '三宫格胶片雨夜',
    previewUrl: '/images/三宫格胶片雨夜.jpg',
    prompt: '人像摄影，日常快照风格'
  },
  {
    id: 'template_2',
    name: '现代艺术',
    previewUrl: '/images/现代艺术.jpg',
    prompt: '现代艺术风格，抽象表现'
  },
  {
    id: 'template_3',
    name: '古典油画',
    previewUrl: '/images/古典油画.jpg',
    prompt: '古典油画风格，细腻笔触'
  }
];

const mockApiResponse = {
  success: true,
  data: {
    templates: mockTemplates
  }
};

describe('TemplateGallery', () => {
  const mockOnTemplateSelect = jest.fn();
  const defaultProps = {
    selectedTemplate: null,
    onTemplateSelect: mockOnTemplateSelect,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(mockApiResponse)
    });
  });

  describe('模板列表渲染 (Template List Rendering)', () => {
    it('should display loading state initially', () => {
      render(<TemplateGallery {...defaultProps} />);
      
      expect(screen.getByText('2. 选择风格模板')).toBeInTheDocument();
      expect(screen.getByText('加载模板中...')).toBeInTheDocument();
    });

    it('should fetch and display template list', async () => {
      render(<TemplateGallery {...defaultProps} />);
      
      // Wait for templates to load
      await waitFor(() => {
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
        expect(screen.getByText('现代艺术')).toBeInTheDocument();
        expect(screen.getByText('古典油画')).toBeInTheDocument();
      });

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/templates');
    });

    it('should display template names and preview images', async () => {
      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        // Check template names
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
        expect(screen.getByText('现代艺术')).toBeInTheDocument();
        expect(screen.getByText('古典油画')).toBeInTheDocument();

        // Check preview images
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(3);
        expect(images[0]).toHaveAttribute('src', '/images/三宫格胶片雨夜.jpg');
        expect(images[1]).toHaveAttribute('src', '/images/现代艺术.jpg');
        expect(images[2]).toHaveAttribute('src', '/images/古典油画.jpg');
      });
    });
  });

  describe('模板选择交互 (Template Selection Interaction)', () => {
    it('should handle template click and call onTemplateSelect', async () => {
      const user = userEvent.setup();
      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
      });

      // Click on first template
      const firstTemplate = screen.getByText('三宫格胶片雨夜').closest('[role="button"]');
      await user.click(firstTemplate!);

      expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it('should handle keyboard navigation (Enter key)', async () => {
      const user = userEvent.setup();
      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
      });

      // Focus and press Enter on first template
      const firstTemplate = screen.getByText('三宫格胶片雨夜').closest('[role="button"]');
      firstTemplate!.focus();
      await user.keyboard('{Enter}');

      expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it('should handle keyboard navigation (Space key)', async () => {
      const user = userEvent.setup();
      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('现代艺术')).toBeInTheDocument();
      });

      // Focus and press Space on second template
      const secondTemplate = screen.getByText('现代艺术').closest('[role="button"]');
      secondTemplate!.focus();
      await user.keyboard(' ');

      expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[1]);
    });
  });

  describe('模板选择高亮 (Template Selection Highlighting)', () => {
    it('should highlight selected template', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedTemplate: mockTemplates[0]
      };

      render(<TemplateGallery {...propsWithSelection} />);
      
      await waitFor(() => {
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
      });

      // Check if selected template has highlight styling
      const selectedTemplate = screen.getByText('三宫格胶片雨夜').closest('[role="button"]');
      expect(selectedTemplate).toHaveClass('border-blue-500', 'ring-2', 'ring-blue-200');

      // Check if selection indicator is present
      const checkIcon = selectedTemplate!.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should show selected template info panel', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedTemplate: mockTemplates[0]
      };

      render(<TemplateGallery {...propsWithSelection} />);
      
      await waitFor(() => {
        expect(screen.getByText('已选择模板: 三宫格胶片雨夜')).toBeInTheDocument();
        expect(screen.getByText('提示词: 人像摄影，日常快照风格')).toBeInTheDocument();
      });
    });

    it('should not highlight non-selected templates', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedTemplate: mockTemplates[0]
      };

      render(<TemplateGallery {...propsWithSelection} />);
      
      await waitFor(() => {
        expect(screen.getByText('现代艺术')).toBeInTheDocument();
      });

      // Check if non-selected template doesn't have highlight styling
      const nonSelectedTemplate = screen.getByText('现代艺术').closest('[role="button"]');
      expect(nonSelectedTemplate).not.toHaveClass('border-blue-500', 'ring-2', 'ring-blue-200');
      expect(nonSelectedTemplate).toHaveClass('border-gray-200');
    });
  });

  describe('禁用状态 (Disabled State)', () => {
    it('should disable interaction when disabled prop is true', async () => {
      const user = userEvent.setup();
      const disabledProps = {
        ...defaultProps,
        disabled: true
      };

      render(<TemplateGallery {...disabledProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
      });

      // Try to click on template
      const firstTemplate = screen.getByText('三宫格胶片雨夜').closest('[role="button"]');
      await user.click(firstTemplate!);

      // Should not call onTemplateSelect
      expect(mockOnTemplateSelect).not.toHaveBeenCalled();

      // Should have disabled styling
      expect(firstTemplate).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(firstTemplate).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('错误处理 (Error Handling)', () => {
    it('should display error message when API fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('网络错误，请稍后重试')).toBeInTheDocument();
        expect(screen.getByText('重试')).toBeInTheDocument();
      });
    });

    it('should display error message when API returns error', async () => {
      const errorResponse = {
        success: false,
        data: { templates: [] },
        error: '获取模板列表失败'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(errorResponse)
      });

      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('获取模板列表失败')).toBeInTheDocument();
        expect(screen.getByText('重试')).toBeInTheDocument();
      });
    });

    it('should retry loading templates when retry button is clicked', async () => {
      const user = userEvent.setup();
      
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockApiResponse)
      });

      render(<TemplateGallery {...defaultProps} />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('网络错误，请稍后重试')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText('重试');
      await user.click(retryButton);

      // Should show templates after retry
      await waitFor(() => {
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
      });

      // Should have called fetch twice
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('空状态 (Empty State)', () => {
    it('should display empty state when no templates are available', async () => {
      const emptyResponse = {
        success: true,
        data: {
          templates: []
        }
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(emptyResponse)
      });

      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('暂无可用模板')).toBeInTheDocument();
        expect(screen.getByText('请联系管理员添加模板')).toBeInTheDocument();
      });
    });
  });

  describe('图片错误处理 (Image Error Handling)', () => {
    it('should fallback to placeholder when image fails to load', async () => {
      render(<TemplateGallery {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('三宫格胶片雨夜')).toBeInTheDocument();
      });

      // Simulate image load error
      const images = screen.getAllByRole('img');
      const firstImage = images[0];
      
      // Trigger error event
      fireEvent.error(firstImage);

      // Should fallback to placeholder
      expect(firstImage).toHaveAttribute('src', '/images/placeholder.png');
    });
  });
});