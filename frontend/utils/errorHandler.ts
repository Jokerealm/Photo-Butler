/**
 * 前端错误处理工具
 * Frontend error handling utilities
 */

/**
 * API错误响应接口
 * API error response interface
 */
export interface APIErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp?: string;
  details?: any;
}

/**
 * API成功响应接口
 * API success response interface
 */
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * API响应类型
 * API response type
 */
export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

/**
 * 错误类型枚举
 * Error type enum
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  API_ERROR = 'API_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 应用错误类
 * Application error class
 */
export class AppError extends Error {
  public type: ErrorType;
  public code?: string;
  public statusCode?: number;
  public details?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    code?: string,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 网络错误类
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(message: string = '网络连接失败，请检查网络连接') {
    super(message, ErrorType.NETWORK_ERROR, 'NETWORK_ERROR');
  }
}

/**
 * 验证错误类
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, ErrorType.VALIDATION_ERROR, 'VALIDATION_ERROR');
    if (field) {
      this.details = { field };
    }
  }
}

/**
 * 文件错误类
 * File error class
 */
export class FileError extends AppError {
  constructor(message: string, code?: string) {
    super(message, ErrorType.FILE_ERROR, code || 'FILE_ERROR');
  }
}

/**
 * 超时错误类
 * Timeout error class
 */
export class TimeoutError extends AppError {
  constructor(message: string = '请求超时，请稍后重试') {
    super(message, ErrorType.TIMEOUT_ERROR, 'TIMEOUT_ERROR');
  }
}

/**
 * 解析API错误响应
 * Parse API error response
 */
export const parseAPIError = (error: any): AppError => {
  // 网络错误
  if (!error.response) {
    return new NetworkError();
  }

  const response = error.response;
  const data = response.data as APIErrorResponse;

  // 超时错误
  if (response.status === 504 || error.code === 'ECONNABORTED') {
    return new TimeoutError();
  }

  // 根据状态码和错误代码创建相应的错误
  const message = data?.error || '请求失败';
  const code = data?.code || `HTTP_${response.status}`;
  const statusCode = response.status;

  switch (response.status) {
    case 400:
      if (code.includes('VALIDATION')) {
        return new ValidationError(message);
      }
      if (code.includes('FILE')) {
        return new FileError(message, code);
      }
      return new AppError(message, ErrorType.VALIDATION_ERROR, code, statusCode);

    case 404:
      return new AppError(message, ErrorType.NOT_FOUND, code, statusCode);

    case 500:
    case 502:
    case 503:
      return new AppError(message, ErrorType.API_ERROR, code, statusCode);

    default:
      return new AppError(message, ErrorType.UNKNOWN_ERROR, code, statusCode);
  }
};

/**
 * 获取用户友好的错误消息
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      return '网络连接失败，请检查网络连接后重试';
    
    case ErrorType.TIMEOUT_ERROR:
      return '请求超时，请稍后重试';
    
    case ErrorType.VALIDATION_ERROR:
      return error.message || '输入信息有误，请检查后重试';
    
    case ErrorType.FILE_ERROR:
      return error.message || '文件处理失败，请重新选择文件';
    
    case ErrorType.NOT_FOUND:
      return error.message || '请求的资源不存在';
    
    case ErrorType.API_ERROR:
      if (error.statusCode === 500) {
        return '服务器内部错误，请稍后重试';
      }
      return error.message || '服务请求失败，请稍后重试';
    
    default:
      return error.message || '发生未知错误，请稍后重试';
  }
};

/**
 * 错误重试配置
 * Error retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: boolean;
}

/**
 * 默认重试配置
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delay: 1000,
  backoff: true
};

/**
 * 带重试的异步函数执行器
 * Async function executor with retry
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const { maxRetries, delay, backoff } = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break;
      }
      
      // 计算延迟时间
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError!;
};

/**
 * 错误日志记录
 * Error logging
 */
export const logError = (error: Error, context?: Record<string, any>): void => {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context
  };

  // 开发环境输出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }

  // 保存到本地存储（用于调试）
  try {
    const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    existingErrors.push(errorInfo);
    
    // 只保留最近的20个错误
    if (existingErrors.length > 20) {
      existingErrors.splice(0, existingErrors.length - 20);
    }
    
    localStorage.setItem('app_errors', JSON.stringify(existingErrors));
  } catch (storageError) {
    console.warn('Failed to save error to localStorage:', storageError);
  }
};

/**
 * 清理错误日志
 * Clear error logs
 */
export const clearErrorLogs = (): void => {
  try {
    localStorage.removeItem('app_errors');
    localStorage.removeItem('react_errors');
  } catch (error) {
    console.warn('Failed to clear error logs:', error);
  }
};

/**
 * 获取错误日志
 * Get error logs
 */
export const getErrorLogs = (): any[] => {
  try {
    const appErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    const reactErrors = JSON.parse(localStorage.getItem('react_errors') || '[]');
    return [...appErrors, ...reactErrors].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.warn('Failed to get error logs:', error);
    return [];
  }
};