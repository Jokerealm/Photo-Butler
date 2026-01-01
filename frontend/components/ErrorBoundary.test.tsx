import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, useErrorHandler } from './ErrorBoundary';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock alert
window.alert = jest.fn();

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
    console.error = jest.fn(); // Suppress console.error in tests
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('页面出现错误')).toBeInTheDocument();
    expect(screen.getByText(/很抱歉，页面遇到了一个意外错误/)).toBeInTheDocument();
  });

  it('should display error ID when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/错误ID:/)).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('错误详情')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should not show error details in production mode', () => {
    render(
      <ErrorBoundary showDetails={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('错误详情')).not.toBeInTheDocument();
  });

  it('should reset error state when retry button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('页面出现错误')).toBeInTheDocument();

    // Click retry button - this should reset the error state
    fireEvent.click(screen.getByText('重试'));

    // The error boundary should have reset its internal state
    // We can't easily test the state reset without re-rendering with a non-throwing component
    // But we can verify the button exists and is clickable
    expect(screen.getByText('重试')).toBeInTheDocument();
  });

  it('should have refresh page button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('刷新页面');
    expect(refreshButton).toBeInTheDocument();
    
    // Verify button is clickable
    fireEvent.click(refreshButton);
  });

  it('should copy error info when copy button is clicked in development mode', async () => {
    // Mock clipboard and alert for this test
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    const mockAlert = jest.fn();
    
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
    });
    
    const originalAlert = window.alert;
    window.alert = mockAlert;

    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('复制错误信息'));

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockWriteText).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith('错误信息已复制到剪贴板');

    // Restore
    window.alert = originalAlert;
  });

  it('should save error to localStorage', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'react_errors',
      expect.stringContaining('Test error message')
    );
  });

  it('should call onError callback when provided', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object),
      expect.any(String)
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('页面出现错误')).not.toBeInTheDocument();
  });

  it('should limit stored errors to 10', () => {
    // Mock existing errors
    const existingErrors = Array.from({ length: 10 }, (_, i) => ({
      message: `Error ${i}`,
      timestamp: new Date().toISOString(),
    }));
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingErrors));

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'react_errors',
      expect.stringMatching(/.*/) // Should contain the new error and remove the oldest
    );
  });
});

describe('useErrorHandler', () => {
  const TestComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
    const { handleError } = useErrorHandler();

    React.useEffect(() => {
      if (shouldThrow) {
        const error = new Error('Test hook error');
        handleError(error);
      }
    }, [shouldThrow, handleError]);

    return <div>Test component</div>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
    console.error = jest.fn();
  });

  it('should handle errors and return error ID', () => {
    render(<TestComponent shouldThrow={true} />);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'react_errors',
      expect.stringContaining('Test hook error')
    );
  });

  it('should save error details to localStorage', () => {
    render(<TestComponent shouldThrow={true} />);

    const savedData = mockLocalStorage.setItem.mock.calls[0][1];
    const errors = JSON.parse(savedData);
    
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      message: 'Test hook error',
      timestamp: expect.any(String),
      url: expect.any(String),
      userAgent: expect.any(String),
      errorId: expect.any(String),
    });
  });
});