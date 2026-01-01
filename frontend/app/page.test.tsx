import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';

// Mock the components to focus on integration testing
jest.mock('../components/ImageUploader', () => {
  return function MockImageUploader({ onImageUpload }: any) {
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
      </div>
    );
  };
});

jest.mock('../components/TemplateGallery', () => {
  return function MockTemplateGallery({ onTemplateSelect, disabled }: any) {
    return (
      <div data-testid="template-gallery">
        <button
          disabled={disabled}
          onClick={() => {
            onTemplateSelect({
              id: 'test-template',
              name: 'Test Template',
              previewUrl: '/test.jpg',
              prompt: 'Test prompt'
            });
          }}
        >
          Select Template
        </button>
      </div>
    );
  };
});

jest.mock('../components/PromptEditor', () => {
  return function MockPromptEditor({ onPromptChange, disabled }: any) {
    return (
      <div data-testid="prompt-editor">
        <input
          disabled={disabled}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Edit prompt"
        />
      </div>
    );
  };
});

jest.mock('../components/ImageGenerator', () => {
  return function MockImageGenerator({ onGenerationComplete, disabled }: any) {
    return (
      <div data-testid="image-generator">
        <button
          disabled={disabled}
          onClick={() => {
            onGenerationComplete({
              imageUrl: 'https://example.com/generated.jpg',
              timestamp: Date.now(),
              template: 'Test Template',
              prompt: 'Test prompt',
              generationId: 'test-id'
            });
          }}
        >
          Generate Image
        </button>
      </div>
    );
  };
});

jest.mock('../components/HistoryViewer', () => {
  return function MockHistoryViewer() {
    return <div data-testid="history-viewer">History Viewer</div>;
  };
});

// Mock localStorage utilities
jest.mock('../utils/localStorage', () => ({
  saveHistoryItem: jest.fn(),
  generateHistoryId: () => 'test-history-id'
}));

describe('Home Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main page with all components', () => {
    render(<Home />);
    
    expect(screen.getByText('Photo Butler')).toBeInTheDocument();
    expect(screen.getByText('基于豆包API的AI图片生成应用')).toBeInTheDocument();
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
  });

  it('should show progress indicator in generation view', () => {
    render(<Home />);
    
    expect(screen.getByText('进度')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should switch between generation and history views', () => {
    render(<Home />);
    
    // Initially in generation view
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    expect(screen.queryByTestId('history-viewer')).not.toBeInTheDocument();
    
    // Switch to history view
    fireEvent.click(screen.getByText('历史记录'));
    expect(screen.getByTestId('history-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('image-uploader')).not.toBeInTheDocument();
    
    // Switch back to generation view
    fireEvent.click(screen.getByText('图片生成'));
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    expect(screen.queryByTestId('history-viewer')).not.toBeInTheDocument();
  });

  it('should handle complete workflow integration', async () => {
    render(<Home />);
    
    // Step 1: Upload image
    fireEvent.click(screen.getByText('Upload Image'));
    
    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
    
    // Step 2: Select template
    const templateButton = screen.getByText('Select Template');
    expect(templateButton).not.toBeDisabled();
    fireEvent.click(templateButton);
    
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument(); // Template selection loads prompt automatically
    });
    
    // Step 3: Edit prompt (already loaded from template)
    const promptInput = screen.getByPlaceholderText('Edit prompt');
    expect(promptInput).not.toBeDisabled();
    fireEvent.change(promptInput, { target: { value: 'Updated prompt' } });
    
    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument(); // Still 75% as prompt is ready
    });
    
    // Step 4: Generate image
    const generateButton = screen.getByText('Generate Image');
    expect(generateButton).not.toBeDisabled();
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('图片生成完成！')).toBeInTheDocument();
    });
  });

  it('should disable components based on workflow state', () => {
    render(<Home />);
    
    // Initially, template gallery should be disabled
    expect(screen.getByText('Select Template')).toBeDisabled();
    
    // Upload image to enable template selection
    fireEvent.click(screen.getByText('Upload Image'));
    
    expect(screen.getByText('Select Template')).not.toBeDisabled();
  });

  it('should show success message and next steps after generation', async () => {
    render(<Home />);
    
    // Complete the workflow
    fireEvent.click(screen.getByText('Upload Image'));
    fireEvent.click(screen.getByText('Select Template'));
    fireEvent.change(screen.getByPlaceholderText('Edit prompt'), { 
      target: { value: 'Test prompt' } 
    });
    fireEvent.click(screen.getByText('Generate Image'));
    
    await waitFor(() => {
      expect(screen.getByText('图片生成完成！')).toBeInTheDocument();
      expect(screen.getByText('生成新图片')).toBeInTheDocument();
      expect(screen.getByText('查看历史记录')).toBeInTheDocument();
    });
  });

  it('should reset workflow when clicking reset button', async () => {
    render(<Home />);
    
    // Upload image first
    fireEvent.click(screen.getByText('Upload Image'));
    
    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
    
    // Click reset
    fireEvent.click(screen.getByText('重新开始'));
    
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});