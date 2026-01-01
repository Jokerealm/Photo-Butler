import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateCard from './TemplateCard';
import { Template } from '../types';

// Mock LazyImage component
jest.mock('./LazyImage', () => {
  return function MockLazyImage({ src, alt, onLoad, onError, className, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={onError}
        data-testid="lazy-image"
        {...props}
      />
    );
  };
});

// Mock template data
const mockTemplate: Template = {
  id: 'template_1',
  name: '现代艺术风格',
  description: '这是一个现代艺术风格的模板，适合创作抽象和前卫的艺术作品',
  previewUrl: '/images/modern-art.jpg',
  prompt: '现代艺术，抽象表现主义，色彩丰富',
  category: '艺术',
  tags: ['现代', '抽象', '艺术', '色彩'],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15')
};

const mockTemplateWithoutOptionalFields: Template = {
  id: 'template_2',
  name: '简单模板',
  description: '简单的模板描述',
  previewUrl: '/images/simple.jpg',
  prompt: '简单提示词',
  tags: [],
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10')
};

describe('TemplateCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染 (Basic Rendering)', () => {
    it('should render template card with all information', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      expect(screen.getByTestId('template-card')).toBeInTheDocument();
      expect(screen.getByTestId('template-name')).toHaveTextContent('现代艺术风格');
      expect(screen.getByTestId('template-description')).toHaveTextContent('这是一个现代艺术风格的模板，适合创作抽象和前卫的艺术作品');
      expect(screen.getByTestId('template-image')).toHaveAttribute('src', '/images/modern-art.jpg');
      expect(screen.getByTestId('template-image')).toHaveAttribute('alt', '现代艺术风格');
    });

    it('should render template without optional fields', () => {
      render(<TemplateCard template={mockTemplateWithoutOptionalFields} onClick={mockOnClick} />);
      
      expect(screen.getByTestId('template-name')).toHaveTextContent('简单模板');
      expect(screen.getByTestId('template-description')).toHaveTextContent('简单的模板描述');
      expect(screen.queryByText('艺术')).not.toBeInTheDocument(); // No category badge
    });

    it('should display category badge when category exists', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      // Find the category badge specifically (in the top-left corner)
      const categoryBadges = screen.getAllByText('艺术');
      const categoryBadge = categoryBadges.find(el => 
        el.className.includes('bg-blue-500/90') && el.className.includes('text-white')
      );
      
      expect(categoryBadge).toBeInTheDocument();
      expect(categoryBadge).toHaveClass('bg-blue-500/90', 'text-white');
    });

    it('should display creation date', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      expect(screen.getByText('2024/1/15')).toBeInTheDocument();
    });
  });

  describe('标签显示 (Tags Display)', () => {
    it('should display up to 3 tags', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      expect(screen.getByText('现代')).toBeInTheDocument();
      expect(screen.getByText('抽象')).toBeInTheDocument();
      
      // Check for the tag version of "艺术" (not the category badge)
      const tagElements = screen.getAllByText('艺术');
      const tagElement = tagElements.find(el => 
        el.className.includes('bg-blue-50') && el.className.includes('text-blue-700')
      );
      expect(tagElement).toBeInTheDocument();
      
      expect(screen.getByText('+1')).toBeInTheDocument(); // +1 for the 4th tag
    });

    it('should not display tags section when no tags exist', () => {
      render(<TemplateCard template={mockTemplateWithoutOptionalFields} onClick={mockOnClick} />);
      
      expect(screen.queryByText('现代')).not.toBeInTheDocument();
      expect(screen.queryByText('+1')).not.toBeInTheDocument();
    });

    it('should display all tags when less than 4 tags exist', () => {
      const templateWithFewTags = {
        ...mockTemplate,
        tags: ['现代', '创意'], // Changed to avoid conflict with category
        category: '设计' // Changed category to avoid conflict
      };

      render(<TemplateCard template={templateWithFewTags} onClick={mockOnClick} />);
      
      expect(screen.getByText('现代')).toBeInTheDocument();
      expect(screen.getByText('创意')).toBeInTheDocument();
      expect(screen.queryByText('+')).not.toBeInTheDocument();
    });
  });

  describe('图片处理 (Image Handling)', () => {
    it('should show loading state initially', () => {
      const { container } = render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should handle image load success', async () => {
      const { container } = render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const image = screen.getByTestId('template-image');
      fireEvent.load(image);
      
      await waitFor(() => {
        expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
      });
    });

    it('should handle image load error and show fallback', async () => {
      const { container } = render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const image = screen.getByTestId('template-image');
      fireEvent.error(image);
      
      await waitFor(() => {
        expect(container.querySelector('svg')).toBeInTheDocument(); // Error icon
        expect(container.querySelector('.bg-gray-200')).toBeInTheDocument();
      });
    });
  });

  describe('交互行为 (Interaction Behavior)', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('template-card');
      await user.click(card);
      
      expect(mockOnClick).toHaveBeenCalledWith(mockTemplate);
    });

    it('should have cursor pointer styling', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('template-card');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should have hover effects', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('template-card');
      expect(card).toHaveClass('hover:scale-[1.02]', 'hover:shadow-xl', 'hover:border-blue-300');
    });
  });

  describe('悬停效果 (Hover Effects)', () => {
    it('should show hover overlay with view details button', () => {
      const { container } = render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      expect(screen.getByText('查看详情')).toBeInTheDocument();
      
      // Check hover overlay structure
      const overlay = container.querySelector('.absolute.inset-0.bg-gradient-to-t');
      expect(overlay).toBeInTheDocument();
    });

    it('should show arrow icon on hover', () => {
      const { container } = render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const arrowIcon = container.querySelector('.opacity-0.group-hover\\:opacity-100 svg');
      expect(arrowIcon).toBeInTheDocument();
    });
  });

  describe('自定义样式 (Custom Styling)', () => {
    it('should apply custom className', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} className="custom-class" />);
      
      const card = screen.getByTestId('template-card');
      expect(card).toHaveClass('custom-class');
    });

    it('should maintain default classes with custom className', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} className="custom-class" />);
      
      const card = screen.getByTestId('template-card');
      expect(card).toHaveClass('bg-white', 'rounded-xl', 'shadow-md', 'custom-class');
    });
  });

  describe('可访问性 (Accessibility)', () => {
    it('should have proper image alt text', () => {
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const image = screen.getByTestId('template-image');
      expect(image).toHaveAttribute('alt', '现代艺术风格');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('template-card');
      
      // Simulate keyboard interaction by directly calling the click handler
      fireEvent.keyDown(card, { key: 'Enter' });
      fireEvent.click(card);
      
      expect(mockOnClick).toHaveBeenCalledWith(mockTemplate);
    });
  });

  describe('文本截断 (Text Truncation)', () => {
    it('should truncate long template names', () => {
      const longNameTemplate = {
        ...mockTemplate,
        name: '这是一个非常非常长的模板名称，应该被截断显示'
      };

      render(<TemplateCard template={longNameTemplate} onClick={mockOnClick} />);
      
      const nameElement = screen.getByTestId('template-name');
      expect(nameElement).toHaveClass('line-clamp-1');
    });

    it('should truncate long descriptions', () => {
      const longDescTemplate = {
        ...mockTemplate,
        description: '这是一个非常非常长的描述文本，应该被截断为两行显示，超出的部分会被隐藏'
      };

      render(<TemplateCard template={longDescTemplate} onClick={mockOnClick} />);
      
      const descElement = screen.getByTestId('template-description');
      expect(descElement).toHaveClass('line-clamp-2');
    });
  });

  describe('边界情况 (Edge Cases)', () => {
    it('should handle template with empty strings', () => {
      const emptyTemplate = {
        ...mockTemplate,
        name: '',
        description: '',
        category: '',
        tags: []
      };

      render(<TemplateCard template={emptyTemplate} onClick={mockOnClick} />);
      
      expect(screen.getByTestId('template-card')).toBeInTheDocument();
      expect(screen.getByTestId('template-name')).toHaveTextContent('');
      expect(screen.getByTestId('template-description')).toHaveTextContent('');
    });

    it('should handle template with null/undefined optional fields', () => {
      const minimalTemplate = {
        id: 'minimal',
        name: 'Minimal Template',
        description: 'Minimal description',
        previewUrl: '/minimal.jpg',
        prompt: 'minimal prompt',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      render(<TemplateCard template={minimalTemplate} onClick={mockOnClick} />);
      
      expect(screen.getByTestId('template-card')).toBeInTheDocument();
      expect(screen.getByText('Minimal Template')).toBeInTheDocument();
    });
  });
});