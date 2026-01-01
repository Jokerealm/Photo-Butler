'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * 错误边界状态接口
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * 错误边界属性接口
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  showDetails?: boolean;
}

/**
 * 错误详情接口
 * Error details interface
 */
interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  errorId: string;
}

/**
 * React错误边界组件
 * React Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  /**
   * 生成错误ID
   * Generate error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录错误到控制台和本地存储
   * Log error to console and localStorage
   */
  private logError(error: Error, errorInfo: ErrorInfo, errorId: string): void {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId
    };

    // 控制台输出
    console.error('React Error Boundary caught an error:', errorDetails);

    // 保存到本地存储（用于调试）
    try {
      const existingErrors = JSON.parse(localStorage.getItem('react_errors') || '[]');
      existingErrors.push(errorDetails);
      
      // 只保留最近的10个错误
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('react_errors', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to save error to localStorage:', storageError);
    }

    // 调用外部错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  /**
   * 捕获错误
   * Catch error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * 组件捕获错误后调用
   * Called after component catches error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.generateErrorId();
    
    this.setState({
      errorInfo,
      errorId
    });

    this.logError(error, errorInfo, errorId);
  }

  /**
   * 重置错误状态
   * Reset error state
   */
  private resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  /**
   * 刷新页面
   * Refresh page
   */
  private refreshPage = (): void => {
    window.location.reload();
  };

  /**
   * 复制错误信息
   * Copy error information
   */
  private copyErrorInfo = (): void => {
    if (!this.state.error || !this.state.errorInfo || !this.state.errorId) return;

    const errorDetails: ErrorDetails = {
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    const errorText = JSON.stringify(errorDetails, null, 2);
    
    navigator.clipboard.writeText(errorText).then(() => {
      alert('错误信息已复制到剪贴板');
    }).catch(() => {
      // 降级方案：创建文本区域并选择
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('错误信息已复制到剪贴板');
    });
  };

  /**
   * 渲染错误UI
   * Render error UI
   */
  private renderErrorUI(): ReactNode {
    const { error, errorId } = this.state;
    const { showDetails = false } = this.props;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* 错误图标 */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>

            {/* 错误标题 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                页面出现错误
              </h2>
              <p className="text-gray-600 mb-6">
                很抱歉，页面遇到了一个意外错误。请尝试刷新页面或联系技术支持。
              </p>
            </div>

            {/* 错误ID */}
            {errorId && (
              <div className="bg-gray-50 rounded-md p-3 mb-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">错误ID: </span>
                  <span className="font-mono text-gray-900">{errorId}</span>
                </div>
              </div>
            )}

            {/* 错误详情（开发模式） */}
            {showDetails && error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-red-800 mb-2">错误详情</h3>
                <div className="text-sm text-red-700">
                  <p className="font-mono break-all">{error.message}</p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-600 hover:text-red-800">
                        查看堆栈跟踪
                      </summary>
                      <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-3">
              <button
                onClick={this.resetError}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                重试
              </button>
              
              <button
                onClick={this.refreshPage}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                刷新页面
              </button>

              {showDetails && (
                <button
                  onClick={this.copyErrorInfo}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  复制错误信息
                </button>
              )}
            </div>

            {/* 帮助信息 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                如果问题持续存在，请联系技术支持并提供错误ID
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // 否则使用默认错误UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

/**
 * 错误边界Hook（用于函数组件）
 * Error boundary hook (for function components)
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId
    };

    console.error('Error caught by useErrorHandler:', errorDetails);

    // 保存到本地存储
    try {
      const existingErrors = JSON.parse(localStorage.getItem('react_errors') || '[]');
      existingErrors.push(errorDetails);
      
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('react_errors', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to save error to localStorage:', storageError);
    }

    return errorId;
  }, []);

  return { handleError };
};

export default ErrorBoundary;