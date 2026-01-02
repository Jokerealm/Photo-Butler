/**
 * TemplateUpload 组件测试
 * Tests for TemplateUpload Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateUpload from './TemplateUpload';
import { CreateTemplateRequest } from '../../types/promptTemplate';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
  loading: false
};

// Helper function to create a mock file
const createMockFile = (name: string, type: string, size: number = 1024) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('TemplateUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload form correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    expect(screen.getByTestId('template-upload-form')).toBeInTheDocument();
    expect(screen.getByText('上传新模板')).toBeInTheDocument();
    expect(screen.getByTestId('title-input')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByTestId('content-input')).toBeInTheDocument();
    expect(screen.getByTestId('tag-input')).toBeInTheDocument();
  });

  it('handles title input correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: '测试标题' } });
    
    expect(titleInput).toHaveValue('测试标题');
    expect(screen.getByText('4/100 字符')).toBeInTheDocument();
  });

  it('handles description input correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.change(descriptionInput, { target: { value: '测试描述' } });
    
    expect(descriptionInput).toHaveValue('测试描述');
    expect(screen.getByText('4/500 字符')).toBeInTheDocument();
  });

  it('handles content input correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const contentInput = screen.getByTestId('content-input');
    fireEvent.change(contentInput, { target: { value: '测试内容' } });
    
    expect(contentInput).toHaveValue('测试内容');
    expect(screen.getByText('4/5000 字符')).toBeInTheDocument();
  });

  it('handles tag input and addition', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const tagInput = screen.getByTestId('tag-input');
    
    // Add first tag
    fireEvent.change(tagInput, { target: { value: '标签1' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    
    expect(screen.getByTestId('tag-0')).toHaveTextContent('标签1');
    expect(tagInput).toHaveValue('');
    
    // Add second tag with comma
    fireEvent.change(tagInput, { target: { value: '标签2' } });
    fireEvent.keyDown(tagInput, { key: ',' });
    
    expect(screen.getByTestId('tag-1')).toHaveTextContent('标签2');
  });

  it('removes tags correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const tagInput = screen.getByTestId('tag-input');
    
    // Add a tag
    fireEvent.change(tagInput, { target: { value: '测试标签' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    
    expect(screen.getByTestId('tag-0')).toBeInTheDocument();
    
    // Remove the tag
    const removeButton = screen.getByTestId('remove-tag-0');
    fireEvent.click(removeButton);
    
    expect(screen.queryByTestId('tag-0')).not.toBeInTheDocument();
  });

  it('handles backspace to remove last tag', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const tagInput = screen.getByTestId('tag-input');
    
    // Add a tag
    fireEvent.change(tagInput, { target: { value: '测试标签' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    
    expect(screen.getByTestId('tag-0')).toBeInTheDocument();
    
    // Press backspace with empty input
    fireEvent.keyDown(tagInput, { key: 'Backspace' });
    
    expect(screen.queryByTestId('tag-0')).not.toBeInTheDocument();
  });

  it('handles file selection correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    expect(screen.getByTestId('image-preview')).toBeInTheDocument();
    expect(screen.getByTestId('remove-image-button')).toBeInTheDocument();
  });

  it('validates file type correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const fileInput = screen.getByTestId('file-input');
    const invalidFile = createMockFile('test.txt', 'text/plain');
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    expect(screen.getByTestId('file-error')).toHaveTextContent('只支持 JPG 和 PNG 格式的图片');
  });

  it('validates file size correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const fileInput = screen.getByTestId('file-input');
    const largeFile = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024); // 6MB
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    expect(screen.getByTestId('file-error')).toHaveTextContent('文件大小不能超过 5MB');
  });

  it('removes selected file correctly', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    expect(screen.getByTestId('image-preview')).toBeInTheDocument();
    
    const removeButton = screen.getByTestId('remove-image-button');
    fireEvent.click(removeButton);
    
    expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    expect(screen.getByTestId('select-file-button')).toBeInTheDocument();
  });

  it('opens file selector when button is clicked', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const selectButton = screen.getByTestId('select-file-button');
    const fileInput = screen.getByTestId('file-input');
    
    // Mock click method
    fileInput.click = jest.fn();
    
    fireEvent.click(selectButton);
    
    expect(fileInput.click).toHaveBeenCalled();
  });

  it('handles drag and drop events', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const dropZone = screen.getByTestId('file-drop-zone');
    const mockFile = createMockFile('test.jpg', 'image/jpeg');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('border-blue-400');
    
    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile]
      }
    });
    
    expect(screen.getByTestId('image-preview')).toBeInTheDocument();
  });

  it('validates form before submission', async () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByTestId('title-error')).toBeInTheDocument();
      expect(screen.getByTestId('description-error')).toBeInTheDocument();
      expect(screen.getByTestId('content-error')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<TemplateUpload {...defaultProps} />);
    
    // Fill in valid data
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: '测试标题' } });
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: '测试描述内容' } });
    fireEvent.change(screen.getByTestId('content-input'), { target: { value: '测试提示词内容，这里是完整的提示词' } });
    
    // Add tags
    const tagInput = screen.getByTestId('tag-input');
    fireEvent.change(tagInput, { target: { value: '测试' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    
    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: '测试标题',
        description: '测试描述内容',
        content: '测试提示词内容，这里是完整的提示词',
        tags: ['测试'],
        thumbnailFile: undefined
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    render(<TemplateUpload {...defaultProps} loading={true} />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toHaveTextContent('创建中...');
    expect(submitButton).toBeDisabled();
    
    const cancelButton = screen.getByTestId('cancel-button');
    expect(cancelButton).toBeDisabled();
  });

  it('prevents duplicate tags', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const tagInput = screen.getByTestId('tag-input');
    
    // Add same tag twice
    fireEvent.change(tagInput, { target: { value: '重复标签' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    
    fireEvent.change(tagInput, { target: { value: '重复标签' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    
    // Should only have one tag
    expect(screen.getByTestId('tag-0')).toBeInTheDocument();
    expect(screen.queryByTestId('tag-1')).not.toBeInTheDocument();
  });

  it('limits maximum number of tags', () => {
    render(<TemplateUpload {...defaultProps} />);
    
    const tagInput = screen.getByTestId('tag-input');
    
    // Add 11 tags (should only accept 10)
    for (let i = 0; i < 11; i++) {
      fireEvent.change(tagInput, { target: { value: `标签${i}` } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
    }
    
    // Should only have 10 tags
    expect(screen.getByTestId('tag-9')).toBeInTheDocument();
    expect(screen.queryByTestId('tag-10')).not.toBeInTheDocument();
  });

  it('handles form without onCancel prop', () => {
    const propsWithoutCancel = {
      onSubmit: mockOnSubmit,
      loading: false
    };
    
    render(<TemplateUpload {...propsWithoutCancel} />);
    
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);
    
    // Should not throw error
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});