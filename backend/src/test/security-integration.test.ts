import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { 
  helmetConfig, 
  corsConfig, 
  sanitizeInput, 
  validateGenerateRequest, 
  handleValidationErrors,
  uploadRateLimit,
  generateRateLimit 
} from '../middleware/security';
import { errorHandler } from '../middleware/errorHandler';

// Create a test app with security middleware
const createTestApp = () => {
  const app = express();
  
  // Apply security middleware
  app.use(helmetConfig);
  app.use(express.json({ limit: '1mb' }));
  app.use(sanitizeInput);
  
  // Test routes
  app.post('/test/generate', 
    validateGenerateRequest,
    handleValidationErrors,
    (req: Request, res: Response) => {
      res.json({ success: true, data: req.body });
    }
  );
  
  app.post('/test/sanitize', (req: Request, res: Response) => {
    res.json({ success: true, data: req.body });
  });
  
  app.get('/test/headers', (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      headers: {
        'x-frame-options': res.get('X-Frame-Options'),
        'x-content-type-options': res.get('X-Content-Type-Options'),
        'x-xss-protection': res.get('X-XSS-Protection')
      }
    });
  });
  
  // Add error handler
  app.use(errorHandler);
  
  return app;
};

describe('Security Integration Tests', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in request body', async () => {
      const response = await request(app)
        .post('/test/sanitize')
        .send({
          prompt: '<script>alert("xss")</script>Hello World',
          templateId: 'template-1'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.prompt).toBe('Hello World');
      expect(response.body.data.templateId).toBe('template-1');
    });
    
    it('should remove HTML tags from inputs', async () => {
      const response = await request(app)
        .post('/test/sanitize')
        .send({
          prompt: '<img src=x onerror=alert(1)>Clean text<b>bold</b>',
          description: '<p>Paragraph</p>'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.prompt).toBe('Clean textbold');
      expect(response.body.data.description).toBe('Paragraph');
    });
  });
  
  describe('Input Validation', () => {
    it('should accept valid generation request', async () => {
      const response = await request(app)
        .post('/test/generate')
        .send({
          imageId: 'valid-image-123',
          prompt: 'A beautiful landscape',
          templateId: 'template-1'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should reject request with invalid imageId format', async () => {
      const response = await request(app)
        .post('/test/generate')
        .send({
          imageId: 'invalid@image#id',
          prompt: 'A beautiful landscape',
          templateId: 'template-1'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('图片ID格式无效');
    });
    
    it('should reject request with empty prompt', async () => {
      const response = await request(app)
        .post('/test/generate')
        .send({
          imageId: 'valid-image-123',
          prompt: '',
          templateId: 'template-1'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('提示词长度必须');
    });
    
    it('should reject request with prompt that is too long', async () => {
      const longPrompt = 'a'.repeat(2001);
      const response = await request(app)
        .post('/test/generate')
        .send({
          imageId: 'valid-image-123',
          prompt: longPrompt,
          templateId: 'template-1'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('提示词长度必须');
    });
    
    it('should reject request with invalid templateId format', async () => {
      const response = await request(app)
        .post('/test/generate')
        .send({
          imageId: 'valid-image-123',
          prompt: 'A beautiful landscape',
          templateId: 'invalid@template#id'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('模板ID格式无效');
    });
    
    it('should reject request with missing required fields', async () => {
      const response = await request(app)
        .post('/test/generate')
        .send({
          imageId: 'valid-image-123'
          // Missing prompt and templateId
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app)
        .get('/test/headers');
      
      expect(response.status).toBe(200);
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
    });
    
    it('should set Content Security Policy header', async () => {
      const response = await request(app)
        .get('/test/headers');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });
  
  describe('Request Size Limits', () => {
    it('should reject requests with payload too large', async () => {
      const largePayload = {
        prompt: 'a'.repeat(2 * 1024 * 1024), // 2MB string
        imageId: 'test-image',
        templateId: 'test-template'
      };
      
      const response = await request(app)
        .post('/test/generate')
        .send(largePayload);
      
      expect(response.status).toBe(413);
    });
  });
});