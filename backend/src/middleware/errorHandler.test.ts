import { Request, Response, NextFunction } from 'express';
import { 
  ApplicationError, 
  ValidationError, 
  NotFoundError, 
  APIError, 
  FileError,
  errorHandler,
  notFoundHandler,
  validateRequired,
  handleMulterError
} from './errorHandler';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {},
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent')
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('ApplicationError', () => {
    it('should create application error with default values', () => {
      const error = new ApplicationError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ApplicationError');
    });

    it('should create application error with custom values', () => {
      const error = new ApplicationError('Custom error', 400, 'CUSTOM_ERROR');
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should create validation error with field', () => {
      const error = new ValidationError('Required field', 'email');
      
      expect(error.message).toBe('email: Required field');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
    });

    it('should create not found error with id', () => {
      const error = new NotFoundError('User', '123');
      
      expect(error.message).toBe("User with id '123' not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('APIError', () => {
    it('should create API error with default values', () => {
      const error = new APIError('API failed');
      
      expect(error.message).toBe('API failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('API_ERROR');
      expect(error.name).toBe('APIError');
    });

    it('should create API error with custom values', () => {
      const error = new APIError('Bad request', 400, 'BAD_REQUEST');
      
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('FileError', () => {
    it('should create file error with default code', () => {
      const error = new FileError('File too large');
      
      expect(error.message).toBe('File too large');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('FILE_ERROR');
      expect(error.name).toBe('FileError');
    });

    it('should create file error with custom code', () => {
      const error = new FileError('Invalid format', 'INVALID_FORMAT');
      
      expect(error.message).toBe('Invalid format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_FORMAT');
    });
  });

  describe('errorHandler', () => {
    it('should handle ApplicationError correctly', () => {
      const error = new ApplicationError('Test error', 400, 'TEST_ERROR');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        code: 'TEST_ERROR',
        timestamp: expect.any(String)
      });
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error') as any;
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Generic error',
        code: 'INTERNAL_ERROR',
        timestamp: expect.any(String)
      });
    });

    it('should hide error message in production for 500 errors', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new ApplicationError('Internal error', 500);
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR',
        timestamp: expect.any(String)
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include debug info in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new ApplicationError('Test error', 400, 'TEST_ERROR');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        code: 'TEST_ERROR',
        timestamp: expect.any(String),
        stack: expect.any(String),
        details: {
          name: 'ApplicationError',
          isOperational: true
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should create NotFoundError for unknown endpoints', () => {
      mockRequest.originalUrl = '/unknown/endpoint';
      
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "API endpoint with id '/unknown/endpoint' not found",
          statusCode: 404,
          code: 'NOT_FOUND'
        })
      );
    });
  });

  describe('validateRequired', () => {
    it('should pass validation when all required fields are present', () => {
      mockRequest.body = {
        name: 'John',
        email: 'john@example.com'
      };
      
      const middleware = validateRequired(['name', 'email']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail validation when required fields are missing', () => {
      mockRequest.body = {
        name: 'John'
        // email is missing
      };
      
      const middleware = validateRequired(['name', 'email']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields: email',
          statusCode: 400,
          code: 'VALIDATION_ERROR'
        })
      );
    });

    it('should fail validation when fields are empty strings', () => {
      mockRequest.body = {
        name: '',
        email: null
      };
      
      const middleware = validateRequired(['name', 'email']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields: name, email',
          statusCode: 400,
          code: 'VALIDATION_ERROR'
        })
      );
    });
  });

  describe('handleMulterError', () => {
    it('should handle LIMIT_FILE_SIZE error', () => {
      const error = { code: 'LIMIT_FILE_SIZE' };
      
      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '文件大小不能超过10MB',
          code: 'FILE_TOO_LARGE'
        })
      );
    });

    it('should handle LIMIT_UNEXPECTED_FILE error', () => {
      const error = { code: 'LIMIT_UNEXPECTED_FILE' };
      
      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '意外的文件字段',
          code: 'UNEXPECTED_FILE'
        })
      );
    });

    it('should handle invalid file type error', () => {
      const error = { message: '只支持JPG和PNG格式的图片文件' };
      
      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '只支持JPG和PNG格式的图片文件',
          code: 'INVALID_FILE_TYPE'
        })
      );
    });

    it('should handle unexpected end of form error', () => {
      const error = { message: 'Unexpected end of form data' };
      
      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '请选择要上传的图片文件'
        })
      );
    });

    it('should pass through other errors', () => {
      const error = new Error('Some other error');
      
      handleMulterError(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});