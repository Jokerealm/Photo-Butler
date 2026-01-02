import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateMarketplace from './TemplateMarketplace';
import { useTemplateStore } from '../stores/templateStore';
import { useUIStore } from '../stores/uiStore';
import { apiService } from '../services/apiService';

// Mock the stores
jest.mock('../stores/templateStore');
jest.mock('../stores/uiStore');
jest.mock('../services/apiService');

// Mock child components
jest.mock('../components/TemplateCard', () => {
  return function MockTemplateCard({ template, onClick }: any) {
    return (
      <div data-testid={`template-card-${template.id}`} onClick={() => onClick(template)}>
        <span>{template.name}</span>
      </div>
    );
  };
});

jest.mock('../components/SearchBar', () => {
  return function MockSearchBar({ value, onChange, placeholder }: any) {
    return (
      <input
        data-testid="search-bar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  };
});

jest.mock('../components/TemplateModal', () => {
  return function MockTemplateModal({ template, isOpen, onClose, onTaskSubmit }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="template-modal">
        <span>Modal for {template.name}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onTaskSubmit({ id: 'test-task' })}>Submit Task</button>
      </div>
    );
  };
});

// Mock template data
const mockTemplates = [
  {
    id: 'template_1',
    name: '现代艺术',
    description: '现代艺术风格描述',
    previewUrl: '/images/modern.jpg',
    prompt: '现代艺术提示词',
    category: '艺术',
    tags: ['现代', '艺术'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'template_2',
    name: '古典油画',
    description: '古典油画风格描述',
    previewUrl: '/images/classical.jpg',
    prompt: '古典油画提示词',
    category: '绘画',
    tags: ['古典', '油画'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

describe('TemplateMarketplace', () => {
  const mockTemplateStore = {
    filteredTemplates: mockTemplates,
    searchQuery: '',
    loading: false,
    error: null,
    selectedTemplate: null,
    showModal: false,
    setTemplates: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    searchTemplates: jest.fn(),
    selectTemplate: jest.fn(),
    closeModal: jest.fn(),
  };

  const mockUIStore = {
    showToast: jest.fn(),
  };

  const mockApiService = {
    getTemplates: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplateStore as jest.Mock).mockReturnValue(mockTemplateStore);
    (useUIStore as jest.Mock).mockReturnValue(mockUIStore);
    (apiService.getTemplates as jest.Mock).mockImplementation(mockApiService.getTemplates);
  });

  describe('初始渲染 (Initial Rendering)', () => {
    it('should render marketplace header and search bar', () => {
      render(<TemplateMarketplace />);
      
      expect(screen.getByText('模板商城')).toBeInTheDocument();
      expect(screen.getByText('选择您喜欢的AI艺术风格模板')).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    it('should render template cards when templates are loaded', () => {
      render(<TemplateMarketplace />);
      
      expect(screen.getByTestId('template-card-template_1')).toBeInTheDocument();
      expect(screen.getByTestId('template-card-template_2')).toBeInTheDocument();
      expect(screen.getByText('现代艺术')).toBeInTheDocument();
      expect(screen.getByText('古典油画')).toBeInTheDocument();
    });
  });

  describe('加载状态 (Loading State)', () => {
    it('should display loading spinner when loading is true', () => {
      (useTemplateStore as jest.Mock).mockReturnValue({
        ...mockTemplateStore,
        loading: true,
        filteredTemplates: [],
      });

      render(<TemplateMarketplace />);
      
      expect(screen.getByText('加载模板中...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument(); // Loading spinner
    });

    it('should call loadTemplates on component mount', async () => {
      mockApiService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates }
      });

      render(<TemplateMarketplace />);
      
      await waitFor(() => {
        expect(mockApiService.getTemplates).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('错误处理 (Error Handling)', () => {
    it('should display error message when error exists', () => {
      (useTemplateStore as jest.Mock).mockReturnValue({
        ...mockTemplateStore,
        error: '网络连接失败',
        filteredTemplates: [],
      });

      render(<TemplateMarketplace />);
      
      expect(screen.getByText('加载失败')).toBeInTheDocument();
      expect(screen.getByText('网络连接失败')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('should handle API error and show toast', async () => {
      mockApiService.getTemplates.mockRejectedValue(new Error('API Error'));
      
      render(<TemplateMarketplace />);
      
      await waitFor(() => {
        expect(mockTemplateStore.setError).toHaveBeenCalledWith('API Error');
        expect(mockUIStore.showToast).toHaveBeenCalledWith('API Error', 'error');
      });
    });

    it('should handle retry button click', async () => {
      (useTemplateStore as jest.Mock).mockReturnValue({
        ...mockTemplateStore,
        error: '加载失败',
        filteredTemplates: [],
      });

      mockApiService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates }
      });

      render(<TemplateMarketplace />);
      
      const retryButton = screen.getByText('重试');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockApiService.getTemplates).toHaveBeenCalled();
      });
    });
  });

  describe('搜索功能 (Search Functionality)', () => {
    it('should call searchTemplates when search input changes', async () => {
      const user = userEvent.setup();
      render(<TemplateMarketplace />);
      
      const searchInput = screen.getByTestId('search-bar');
      await user.clear(searchInput);
      await user.type(searchInput, '现代');
      
      // Check that searchTemplates was called with both characters
      expect(mockTemplateStore.searchTemplates).toHaveBeenCalledWith('现');
      expect(mockTemplateStore.searchTemplates).toHaveBeenCalledWith('代');
      expect(mockTemplateStore.searchTemplates).toHaveBeenCalledTimes(2);
    });

    it('should display no results message when no templates match search', () => {
      (useTemplateStore as jest.Mock).mockReturnValue({
        ...mockTemplateStore,
        filteredTemplates: [],
        searchQuery: '不存在的模板',
      });

      render(<TemplateMarketplace />);
      
      expect(screen.getByText('未找到匹配模板')).toBeInTheDocument();
      expect(screen.getByText('尝试使用不同的关键词搜索')).toBeInTheDocument();
    });
  });

  describe('模板选择 (Template Selection)', () => {
    it('should handle template click and call onTemplateSelect', async () => {
      const mockOnTemplateSelect = jest.fn();
      render(<TemplateMarketplace onTemplateSelect={mockOnTemplateSelect} />);
      
      const templateCard = screen.getByTestId('template-card-template_1');
      fireEvent.click(templateCard);
      
      expect(mockTemplateStore.selectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
      expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it('should open modal when template is selected', () => {
      (useTemplateStore as jest.Mock).mockReturnValue({
        ...mockTemplateStore,
        selectedTemplate: mockTemplates[0],
        showModal: true,
      });

      render(<TemplateMarketplace />);
      
      expect(screen.getByTestId('template-modal')).toBeInTheDocument();
      expect(screen.getByText('Modal for 现代艺术')).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', () => {
      (useTemplateStore as jest.Mock).mockReturnValue({
        ...mockTemplateStore,
        selectedTemplate: mockTemplates[0],
        showModal: true,
      });

      render(<TemplateMarketplace />);
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      expect(mockTemplateStore.closeModal).toHaveBeenCalled();
    });
  });

  describe('任务提交 (Task Submission)', () => {
    it('should handle task submission from modal', () => {
      (useTemplateStore as jest.Mock).mockReturnValue({
        ...mockTemplateStore,
        selectedTemplate: mockTemplates[0],
        showModal: true,
      });

      render(<TemplateMarketplace />);
      
      const submitButton = screen.getByText('Submit Task');
      fireEvent.click(submitButton);
      
      expect(mockUIStore.showToast).toHaveBeenCalledWith(
        '生成任务已提交 (ID: test-task)',
        'success'
      );
      // Note: Modal is no longer automatically closed - TemplateModal handles confirmation flow
    });
  });

  describe('API集成 (API Integration)', () => {
    it('should handle successful API response', async () => {
      mockApiService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates }
      });

      render(<TemplateMarketplace />);
      
      await waitFor(() => {
        // Check that setTemplates was called with enhanced templates (including empty template)
        expect(mockTemplateStore.setTemplates).toHaveBeenCalled();
        const calledWith = mockTemplateStore.setTemplates.mock.calls[0][0];
        
        // Should include the empty template as first item
        expect(calledWith[0].id).toBe('empty-template');
        expect(calledWith[0].name).toBe('默认空模板');
        
        // Should include the original templates (possibly enhanced)
        expect(calledWith.length).toBeGreaterThanOrEqual(mockTemplates.length);
        expect(mockTemplateStore.setLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle API response with error flag', async () => {
      mockApiService.getTemplates.mockResolvedValue({
        success: false,
        error: '服务器错误'
      });

      render(<TemplateMarketplace />);
      
      await waitFor(() => {
        expect(mockTemplateStore.setError).toHaveBeenCalledWith('服务器错误');
        expect(mockUIStore.showToast).toHaveBeenCalledWith('服务器错误', 'error');
      });
    });

    it('should handle network error', async () => {
      mockApiService.getTemplates.mockRejectedValue(new Error('Network Error'));

      render(<TemplateMarketplace />);
      
      await waitFor(() => {
        expect(mockTemplateStore.setError).toHaveBeenCalledWith('Network Error');
        expect(mockUIStore.showToast).toHaveBeenCalledWith('Network Error', 'error');
      });
    });
  });

  describe('响应式布局 (Responsive Layout)', () => {
    it('should render grid layout for templates', () => {
      const { container } = render(<TemplateMarketplace />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });
  });
});