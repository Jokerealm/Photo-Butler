import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult, param, query } from 'express-validator';
import xss from 'xss';
import { ValidationError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * 安全配置常量
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
    UPLOAD_MAX_REQUESTS: 10, // stricter limit for uploads
    GENERATE_MAX_REQUESTS: 5, // stricter limit for generation
  },
  
  // File upload security
  FILE_UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
    MAX_FILENAME_LENGTH: 255,
  },
  
  // Input validation
  INPUT: {
    MAX_PROMPT_LENGTH: 2000,
    MAX_TEMPLATE_ID_LENGTH: 50,
    MAX_IMAGE_ID_LENGTH: 50,
  }
};

/**
 * Helmet安全头配置
 * Helmet security headers configuration
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow image uploads
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * CORS配置
 * CORS configuration
 */
export const corsConfig = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // In production, check against allowed origins from environment
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    logger.warn('CORS blocked request from origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

/**
 * 通用速率限制
 * General rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: process.env.NODE_ENV === 'test' ? 1000 : SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS, // Higher limit for tests
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for test environment
    return process.env.NODE_ENV === 'test';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS / 1000)
    });
  }
});

/**
 * 上传接口速率限制
 * Upload endpoint rate limiting
 */
export const uploadRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT.UPLOAD_MAX_REQUESTS,
  message: {
    success: false,
    error: '上传请求过于频繁，请稍后再试',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: '上传请求过于频繁，请稍后再试',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS / 1000)
    });
  }
});

/**
 * 生成接口速率限制
 * Generation endpoint rate limiting
 */
export const generateRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT.GENERATE_MAX_REQUESTS,
  message: {
    success: false,
    error: '生成请求过于频繁，请稍后再试',
    code: 'GENERATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Generate rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: '生成请求过于频繁，请稍后再试',
      code: 'GENERATE_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS / 1000)
    });
  }
});

/**
 * 输入清理中间件
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string fields in body
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        // Remove XSS attempts and normalize whitespace
        req.body[key] = xss(value.trim(), {
          whiteList: {}, // No HTML tags allowed
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = xss(value.trim(), {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      }
    }
  }
  
  next();
};

/**
 * 验证规则：图片生成请求
 * Validation rules: Image generation request
 */
export const validateGenerateRequest = [
  body('imageId')
    .isString()
    .isLength({ min: 1, max: SECURITY_CONFIG.INPUT.MAX_IMAGE_ID_LENGTH })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('图片ID格式无效'),
  
  body('prompt')
    .isString()
    .isLength({ min: 1, max: SECURITY_CONFIG.INPUT.MAX_PROMPT_LENGTH })
    .withMessage(`提示词长度必须在1-${SECURITY_CONFIG.INPUT.MAX_PROMPT_LENGTH}字符之间`),
  
  body('templateId')
    .isString()
    .isLength({ min: 1, max: SECURITY_CONFIG.INPUT.MAX_TEMPLATE_ID_LENGTH })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('模板ID格式无效')
];

/**
 * 验证规则：下载请求
 * Validation rules: Download request
 */
export const validateDownloadRequest = [
  param('imageId')
    .isString()
    .isLength({ min: 1, max: SECURITY_CONFIG.INPUT.MAX_IMAGE_ID_LENGTH })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('图片ID格式无效')
];

/**
 * 验证规则：模板查询
 * Validation rules: Template query
 */
export const validateTemplateQuery = [
  query('category')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .matches(/^[a-zA-Z0-9-_\u4e00-\u9fa5]+$/)
    .withMessage('分类参数格式无效')
];

/**
 * 处理验证错误
 * Handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    logger.warn('Validation failed', {
      errors: errors.array(),
      ip: req.ip,
      url: req.url,
      method: req.method,
      body: req.body
    });
    
    throw new ValidationError(errorMessages);
  }
  
  next();
};

/**
 * 文件安全检查中间件
 * File security check middleware
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }
  
  const file = req.file;
  
  // Check file size
  if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_FILE_SIZE) {
    throw new ValidationError(`文件大小不能超过${SECURITY_CONFIG.FILE_UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  // Check MIME type
  if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError('只支持JPG和PNG格式的图片文件');
  }
  
  // Check filename length
  if (file.originalname.length > SECURITY_CONFIG.FILE_UPLOAD.MAX_FILENAME_LENGTH) {
    throw new ValidationError('文件名过长');
  }
  
  // Check for suspicious file extensions in filename
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php', '.asp', '.jsp'];
  const filename = file.originalname.toLowerCase();
  
  for (const ext of suspiciousExtensions) {
    if (filename.includes(ext)) {
      throw new ValidationError('文件名包含不安全的扩展名');
    }
  }
  
  // Log file upload for security monitoring
  logger.info('File upload security check passed', {
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
};

/**
 * API密钥验证中间件（预留）
 * API key validation middleware (reserved)
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  // This is reserved for future implementation when API keys are required
  // Currently, the application doesn't require API keys for client access
  
  const apiKey = req.headers['x-api-key'] as string;
  
  // If API key is provided, validate it
  if (apiKey) {
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      logger.warn('Invalid API key provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        providedKey: apiKey.substring(0, 8) + '...' // Log only first 8 chars for security
      });
      
      return res.status(401).json({
        success: false,
        error: '无效的API密钥',
        code: 'INVALID_API_KEY'
      });
    }
  }
  
  next();
};

/**
 * 请求日志中间件
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
};

/**
 * 环境变量验证
 * Environment variables validation
 */
export const validateEnvironmentVariables = () => {
  const requiredVars = [
    'DOUBAO_API_KEY',
    'DOUBAO_API_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate API key format (should not be the example value)
  if (process.env.DOUBAO_API_KEY === 'your_doubao_api_key_here') {
    logger.error('DOUBAO_API_KEY is still set to example value');
    throw new Error('DOUBAO_API_KEY must be set to a valid API key');
  }
  
  logger.info('Environment variables validation passed');
};