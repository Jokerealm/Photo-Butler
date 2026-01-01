import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * 错误类型定义
 * Error type definitions
 */
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * 创建应用错误
 * Create application error
 */
export class ApplicationError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误
 * Validation error
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    if (field) {
      this.message = `${field}: ${message}`;
    }
  }
}

/**
 * 资源未找到错误
 * Resource not found error
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * API错误
 * API error
 */
export class APIError extends ApplicationError {
  constructor(message: string, statusCode: number = 500, code: string = 'API_ERROR') {
    super(message, statusCode, code);
    this.name = 'APIError';
  }
}

/**
 * 文件处理错误
 * File processing error
 */
export class FileError extends ApplicationError {
  constructor(message: string, code: string = 'FILE_ERROR') {
    super(message, 400, code);
    this.name = 'FileError';
  }
}

/**
 * 统一错误处理中间件
 * Unified error handling middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 记录错误日志
  logger.error('Error occurred:', {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      isOperational: error.isOperational
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    timestamp: new Date().toISOString()
  });

  // 确定状态码
  const statusCode = error.statusCode || 500;
  
  // 确定错误代码
  const errorCode = error.code || 'INTERNAL_ERROR';

  // 确定错误消息（生产环境中隐藏敏感信息）
  let message = error.message;
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = '服务器内部错误';
  }

  // 构建错误响应
  const errorResponse: any = {
    success: false,
    error: message,
    code: errorCode,
    timestamp: new Date().toISOString()
  };

  // 开发环境中包含更多调试信息
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = {
      name: error.name,
      isOperational: error.isOperational
    };
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404错误处理中间件
 * 404 error handling middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError('API endpoint', req.originalUrl);
  next(error);
};

/**
 * 异步错误包装器
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 验证请求参数
 * Validate request parameters
 */
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];
    
    for (const field of fields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const error = new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
      return next(error);
    }

    next();
  };
};

/**
 * 处理Multer错误
 * Handle Multer errors
 */
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return next(new FileError('文件大小不能超过10MB', 'FILE_TOO_LARGE'));
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return next(new FileError('意外的文件字段', 'UNEXPECTED_FILE'));
  }

  if (error.message === '只支持JPG和PNG格式的图片文件') {
    return next(new FileError(error.message, 'INVALID_FILE_TYPE'));
  }

  if (error.message && error.message.includes('Unexpected end of form')) {
    return next(new ValidationError('请选择要上传的图片文件'));
  }

  next(error);
};