import { Request, Response, NextFunction } from 'express';
import { 
  sanitizeInput, 
  validateFileUpload, 
  handleValidationErrors,
  validateEnvironmentVariables,
  SECURITY_CONFIG 
} from './security';
import { ValidationError } from './errorHandler';

// Mock express objects
const mockRequest = (body: any = {}, query: any = {}, file?: any) => ({
  body,
  query,
  file,
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-user-agent')
} as unknown as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Security Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeInput', () => {
    it('should sanitize XSS attempts in body', () => {
      const req = mockRequest({
        prompt: '<script>alert("xss")</script>Hello World',
        templateId: 'template-1'
      });
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(req.body.prompt).toBe('Hello World');
      expect(req.body.templateId).toBe('template-1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize XSS attempts in query parameters', () => {
      const req = mockRequest({}, {
        category: '<img src=x onerror=alert(1)>',
        search: 'normal search'
      });
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(req.query.category).toBe('');
      expect(req.query.search).toBe('normal search');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should trim whitespace from inputs', () => {
      const req = mockRequest({
        prompt: '  Hello World  ',
        templateId: '  template-1  '
      });
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(req.body.prompt).toBe('Hello World');
      expect(req.body.templateId).toBe('template-1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-string values', () => {
      const req = mockRequest({
        prompt: 'Hello World',
        number: 123,
        boolean: true,
        object: { key: 'value' }
      });
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(req.body.prompt).toBe('Hello World');
      expect(req.body.number).toBe(123);
      expect(req.body.boolean).toBe(true);
      expect(req.body.object).toEqual({ key: 'value' });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateFileUpload', () => {
    it('should pass validation for valid image file', () => {
      const validFile = {
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      };
      const req = mockRequest({}, {}, validFile);
      const res = mockResponse();

      expect(() => {
        validateFileUpload(req, res, mockNext);
      }).not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject file that is too large', () => {
      const largeFile = {
        originalname: 'large-image.jpg',
        mimetype: 'image/jpeg',
        size: SECURITY_CONFIG.FILE_UPLOAD.MAX_FILE_SIZE + 1
      };
      const req = mockRequest({}, {}, largeFile);
      const res = mockResponse();

      expect(() => {
        validateFileUpload(req, res, mockNext);
      }).toThrow(ValidationError);
    });

    it('should reject file with invalid MIME type', () => {
      const invalidFile = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024
      };
      const req = mockRequest({}, {}, invalidFile);
      const res = mockResponse();

      expect(() => {
        validateFileUpload(req, res, mockNext);
      }).toThrow(ValidationError);
    });

    it('should reject file with suspicious extension in filename', () => {
      const suspiciousFile = {
        originalname: 'image.jpg.exe',
        mimetype: 'image/jpeg',
        size: 1024
      };
      const req = mockRequest({}, {}, suspiciousFile);
      const res = mockResponse();

      expect(() => {
        validateFileUpload(req, res, mockNext);
      }).toThrow(ValidationError);
    });

    it('should reject file with filename that is too long', () => {
      const longFilename = 'a'.repeat(SECURITY_CONFIG.FILE_UPLOAD.MAX_FILENAME_LENGTH + 1) + '.jpg';
      const longNameFile = {
        originalname: longFilename,
        mimetype: 'image/jpeg',
        size: 1024
      };
      const req = mockRequest({}, {}, longNameFile);
      const res = mockResponse();

      expect(() => {
        validateFileUpload(req, res, mockNext);
      }).toThrow(ValidationError);
    });

    it('should pass when no file is present', () => {
      const req = mockRequest();
      const res = mockResponse();

      expect(() => {
        validateFileUpload(req, res, mockNext);
      }).not.toThrow();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateEnvironmentVariables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should pass when all required environment variables are set', () => {
      process.env.DOUBAO_API_KEY = 'valid-api-key';
      process.env.DOUBAO_API_URL = 'https://api.example.com';

      expect(() => {
        validateEnvironmentVariables();
      }).not.toThrow();
    });

    it('should throw when required environment variables are missing', () => {
      delete process.env.DOUBAO_API_KEY;
      delete process.env.DOUBAO_API_URL;

      expect(() => {
        validateEnvironmentVariables();
      }).toThrow('Missing required environment variables');
    });

    it('should throw when API key is still the example value', () => {
      process.env.DOUBAO_API_KEY = 'your_doubao_api_key_here';
      process.env.DOUBAO_API_URL = 'https://api.example.com';

      expect(() => {
        validateEnvironmentVariables();
      }).toThrow('DOUBAO_API_KEY must be set to a valid API key');
    });
  });

  describe('SECURITY_CONFIG', () => {
    it('should have reasonable rate limiting values', () => {
      expect(SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS).toBe(15 * 60 * 1000); // 15 minutes
      expect(SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS).toBe(100);
      expect(SECURITY_CONFIG.RATE_LIMIT.UPLOAD_MAX_REQUESTS).toBe(10);
      expect(SECURITY_CONFIG.RATE_LIMIT.GENERATE_MAX_REQUESTS).toBe(5);
    });

    it('should have secure file upload limits', () => {
      expect(SECURITY_CONFIG.FILE_UPLOAD.MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
      expect(SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_MIME_TYPES).toEqual(['image/jpeg', 'image/png']);
      expect(SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_EXTENSIONS).toEqual(['.jpg', '.jpeg', '.png']);
    });

    it('should have reasonable input validation limits', () => {
      expect(SECURITY_CONFIG.INPUT.MAX_PROMPT_LENGTH).toBe(2000);
      expect(SECURITY_CONFIG.INPUT.MAX_TEMPLATE_ID_LENGTH).toBe(50);
      expect(SECURITY_CONFIG.INPUT.MAX_IMAGE_ID_LENGTH).toBe(50);
    });
  });
});