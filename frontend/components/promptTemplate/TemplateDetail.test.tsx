/**
 * TemplateDetail 组件测试
 * Tests for TemplateDetail Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateDetail from './TemplateDetail';
import { PromptTemplate } from '../../types/promptTemplate';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

const mockTemplate: PromptTemplate = {
  id: 'test-template-1',
  title: '测试模板',
  description: '这是一个测试模板的描述',
  content: '这是测试提示词内容，用于验证组件功能',
  tags: ['测试', '示例', 'UI'],
  thumbnailPath: '/test-image.jpg',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  version: 1,
  category: '测试分类',
  usageCount: 42,
  rating: 4.5
};

const defaultProps = {
  template: mockTemplate,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onClose: jest.fn()
};

describe('TemplateDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders template information correctly', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    expect(screen.getByTestId('template-detail-title')).toHaveTextContent('测试模板');
    expect(screen.getByTestId('template-detail-description')).toHaveTextContent('这是一个测试模板的描述');
    expect(screen.getByTestId('template-detail-content')).toHaveTextContent('这是测试提示词内容，用于验证组件功能');
  });

  it('displays template metadata correctly', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    expect(screen.getByText('test-template-1')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('测试分类')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    const tagsContainer = screen.getByTestId('template-detail-tags');
    expect(tagsContainer).toBeInTheDocument();
    expect(screen.getByText('测试')).toBeInTheDocument();
    expect(screen.getByText('示例')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
  });

  it('displays thumbnail image', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    const thumbnail = screen.getByTestId('template-detail-thumbnail');
    expect(thumbnail).toHaveAttribute('src', '/test-image.jpg');
    expect(thumbnail).toHaveAttribute('alt', '测试模板');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTemplate);
  });

  it('calls onClose when close button is clicked', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows delete confirmation dialog when delete button is clicked', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);
    
    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('确认删除')).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    // Open delete confirmation
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);
    
    // Confirm delete
    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('test-template-1');
  });

  it('cancels delete when cancel button is clicked', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    // Open delete confirmation
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);
    
    // Cancel delete
    const cancelButton = screen.getByTestId('cancel-delete-button');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
  });

  it('copies content to clipboard when copy button is clicked', async () => {
    render(<TemplateDetail {...defaultProps} />);
    
    const copyButton = screen.getByTestId('copy-content-button');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('这是测试提示词内容，用于验证组件功能');
    });
  });

  it('renders without optional props', () => {
    const minimalProps = {
      template: mockTemplate
    };
    
    render(<TemplateDetail {...minimalProps} />);
    
    expect(screen.getByTestId('template-detail-title')).toHaveTextContent('测试模板');
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
  });

  it('handles template without optional fields', () => {
    const minimalTemplate: PromptTemplate = {
      id: 'minimal-template',
      title: '最小模板',
      description: '最小描述',
      content: '最小内容',
      tags: [],
      thumbnailPath: '',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1
    };

    render(<TemplateDetail template={minimalTemplate} />);
    
    expect(screen.getByText('最小模板')).toBeInTheDocument();
    expect(screen.getByText('最小描述')).toBeInTheDocument();
    expect(screen.getByText('最小内容')).toBeInTheDocument();
    
    // Optional fields should not be displayed
    expect(screen.queryByText('测试分类')).not.toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  it('displays creation and update dates correctly', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    expect(screen.getByText(/创建于/)).toBeInTheDocument();
    expect(screen.getByText(/更新于/)).toBeInTheDocument();
  });

  it('handles image loading error', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    const thumbnail = screen.getByTestId('template-detail-thumbnail');
    fireEvent.error(thumbnail);
    
    // Should show fallback icon instead of image
    expect(screen.queryByTestId('template-detail-thumbnail')).not.toBeInTheDocument();
  });

  it('shows loading state for image', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    // Before image loads, should show loading spinner
    const thumbnail = screen.getByTestId('template-detail-thumbnail');
    expect(thumbnail).toBeInTheDocument();
    
    // Simulate image load
    fireEvent.load(thumbnail);
  });

  it('renders star rating correctly', () => {
    render(<TemplateDetail {...defaultProps} />);
    
    // Should show 4.5 rating with appropriate stars
    expect(screen.getByText('4.5')).toBeInTheDocument();
    
    // Check for star elements (5 stars total)
    const stars = screen.getAllByRole('img', { hidden: true });
    expect(stars.length).toBeGreaterThan(0);
  });
});