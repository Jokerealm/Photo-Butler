import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploader from './ImageUploader';
import { ToastProvider } from './Toast';

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,mockbase64data',
  onload: null as any,
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader),
});

describe('ImageUploader', () => {
  const mockOnImageUpload = jest.fn();
  const defaultProps = {
    onImageUpload: mockOnImageUpload,
    acceptedFormats: ['image/jpeg', 'image/png'],
  };

  const renderWithToast = (props = defaultProps) => {
    return render(
      <ToastProvider>
        <ImageUploader {...props} />
      </ToastProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileReader.readAsDataURL.mockClear();
  });

  describe('文件选择功能 (File Selection Functionality)', () => {
    it('should display upload area when component loads', () => {
      renderWithToast();
      
      expect(screen.getByText('上传参考图片')).toBeInTheDocument();
      expect(screen.getByText('点击选择或拖拽图片到此处')).toBeInTheDocument();
      expect(screen.getByText('支持JPG、PNG格式，最大10MB')).toBeInTheDocument();
    });

    it('should open file dialog when upload area is clicked', async () => {
      const user = userEvent.setup();
      renderWithToast();
      
      // Get the div that has the click handler by finding the one with border classes
      const uploadArea = document.querySelector('[class*="border-2"]') as HTMLElement;
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Mock the click method
      const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      await user.click(uploadArea!);
      
      expect(clickSpy).toHaveBeenCalled();
      
      clickSpy.mockRestore();
    });

    it('should handle valid file selection', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      // Simulate FileReader onload
      act(() => {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mockbase64data' } });
      });
      
      await waitFor(() => {
        expect(mockOnImageUpload).toHaveBeenCalledWith(validFile, 'data:image/jpeg;base64,mockbase64data');
      });
    });
  });

  describe('拖放上传功能 (Drag and Drop Upload Functionality)', () => {
    it('should handle drag over event', async () => {
      renderWithToast();
      
      // Get the div that has the drag handlers by finding the one with border classes
      const uploadArea = document.querySelector('[class*="border-2"]') as HTMLElement;
      
      act(() => {
        fireEvent.dragOver(uploadArea!, {
          dataTransfer: { files: [] }
        });
      });
      
      // Wait for state update and check if dragging state is applied
      await waitFor(() => {
        const className = uploadArea?.className || '';
        expect(className).toContain('border-blue-500');
        expect(className).toContain('bg-blue-50');
      });
    });

    it('should handle drag leave event', async () => {
      renderWithToast();
      
      // Get the div that has the drag handlers by finding the one with border classes
      const uploadArea = document.querySelector('[class*="border-2"]') as HTMLElement;
      
      // First trigger drag over
      act(() => {
        fireEvent.dragOver(uploadArea!, {
          dataTransfer: { files: [] }
        });
      });
      
      // Wait for drag state to be applied
      await waitFor(() => {
        const className = uploadArea?.className || '';
        expect(className).toContain('border-blue-500');
      });
      
      // Then trigger drag leave
      act(() => {
        fireEvent.dragLeave(uploadArea!, {
          dataTransfer: { files: [] }
        });
      });
      
      // Check if dragging state is removed
      await waitFor(() => {
        const className = uploadArea?.className || '';
        expect(className).not.toContain('border-blue-500');
        expect(className).not.toContain('bg-blue-50');
      });
    });

    it('should handle file drop with valid file', async () => {
      renderWithToast();
      
      // Get the div that has the drag handlers by finding the one with border classes
      const uploadArea = document.querySelector('[class*="border-2"]') as HTMLElement;
      const validFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      fireEvent.drop(uploadArea!, {
        dataTransfer: { files: [validFile] }
      });
      
      // Simulate FileReader onload
      act(() => {
        mockFileReader.onload({ target: { result: 'data:image/png;base64,mockbase64data' } });
      });
      
      await waitFor(() => {
        expect(mockOnImageUpload).toHaveBeenCalledWith(validFile, 'data:image/png;base64,mockbase64data');
      });
    });
  });

  describe('文件格式验证 (File Format Validation)', () => {
    it('should accept valid JPG files', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      // Should not show error message
      expect(screen.queryByText('仅支持JPG和PNG格式的图片')).not.toBeInTheDocument();
    });

    it('should accept valid PNG files', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      // Should not show error message
      expect(screen.queryByText('仅支持JPG和PNG格式的图片')).not.toBeInTheDocument();
    });

    it('should reject invalid file formats', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getAllByText('仅支持JPG和PNG格式的图片')).toHaveLength(2); // One in component, one in toast
      });
      
      // Should not call onImageUpload
      expect(mockOnImageUpload).not.toHaveBeenCalled();
    });

    it('should reject files larger than 10MB', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock file size to be larger than 10MB
      Object.defineProperty(largeFile, 'size', {
        value: 11 * 1024 * 1024, // 11MB
        writable: false,
      });
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(screen.getAllByText('文件大小不能超过10MB')).toHaveLength(2); // One in component, one in toast
      });
      
      // Should not call onImageUpload
      expect(mockOnImageUpload).not.toHaveBeenCalled();
    });
  });

  describe('预览显示 (Preview Display)', () => {
    it('should display preview image after successful upload', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      // Simulate FileReader onload
      act(() => {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mockbase64data' } });
      });
      
      await waitFor(() => {
        const previewImage = screen.getByAltText('预览图');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', 'data:image/jpeg;base64,mockbase64data');
      });
      
      // Should show re-upload message
      expect(screen.getByText('点击重新选择图片')).toBeInTheDocument();
    });

    it('should show initial upload state when no image is uploaded', () => {
      renderWithToast();
      
      expect(screen.getByText('上传参考图片')).toBeInTheDocument();
      expect(screen.getByText('点击选择或拖拽图片到此处')).toBeInTheDocument();
      expect(screen.queryByAltText('预览图')).not.toBeInTheDocument();
    });

    it('should allow re-uploading after initial upload', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const firstFile = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      
      // First upload
      fireEvent.change(fileInput, { target: { files: [firstFile] } });
      act(() => {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,firstimage' } });
      });
      
      await waitFor(() => {
        expect(screen.getByAltText('预览图')).toBeInTheDocument();
      });
      
      // Second upload
      const secondFile = new File(['test2'], 'test2.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [secondFile] } });
      act(() => {
        mockFileReader.onload({ target: { result: 'data:image/png;base64,secondimage' } });
      });
      
      await waitFor(() => {
        const previewImage = screen.getByAltText('预览图');
        expect(previewImage).toHaveAttribute('src', 'data:image/png;base64,secondimage');
      });
      
      // Should have called onImageUpload twice
      expect(mockOnImageUpload).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid format', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        const errorMessages = screen.getAllByText('仅支持JPG和PNG格式的图片');
        expect(errorMessages).toHaveLength(2); // One in component, one in toast
        expect(errorMessages[0].closest('div')).toHaveClass('bg-red-50', 'border-red-200');
      });
    });

    it('should clear error message on successful upload', async () => {
      renderWithToast();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // First upload invalid file
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getAllByText('仅支持JPG和PNG格式的图片')).toHaveLength(2);
      });
      
      // Then upload valid file
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      
      // Error should be cleared from component (toast may still be visible)
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });
});