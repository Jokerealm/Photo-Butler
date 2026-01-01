import { Request, Response } from 'express';
import { GenerateController } from './generateController';
import { templateService } from '../services/templateService';
import { DoubaoAPIClient } from '../services/doubaoAPIClient';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../services/doubaoAPIClient');
jest.mock('../services/templateService');
jest.mock('fs');
jest.mock('path');

const mockTemplateService = templateService as jest.Mocked<typeof templateService>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('GenerateController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockDoubaoClient: jest.Mocked<DoubaoAPIClient>;
  let controller: GenerateController;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    // Mock DoubaoAPIClient instance
    mockDoubaoClient = {
      generateImageAndWait: jest.fn(),
      generateImage: jest.fn(),
      checkTaskStatus: jest.fn(),
      waitForTaskCompletion: jest.fn(),
      testConnection: jest.fn(),
      getConfigInfo: jest.fn()
    } as any;

    // Create controller with mocked client
    controller = new GenerateController(mockDoubaoClient);

    jest.clearAllMocks();
  });

  describe('generateImage', () => {
    it('should validate required imageId parameter', async () => {
      mockRequest.body = {
        prompt: 'test prompt',
        templateId: 'template1'
      };

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的图片ID参数'
      });
    });

    it('should validate required prompt parameter', async () => {
      mockRequest.body = {
        imageId: 'image123',
        templateId: 'template1'
      };

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的提示词参数'
      });
    });

    it('should validate required templateId parameter', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt'
      };

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的模板ID参数'
      });
    });

    it('should validate empty prompt parameter', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: '   ', // whitespace only
        templateId: 'template1'
      };

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的提示词参数'
      });
    });

    it('should return error when reference image does not exist', async () => {
      mockRequest.body = {
        imageId: 'nonexistent',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock path.join and fs.existsSync
      mockPath.join.mockReturnValue('/uploads/nonexistent.jpg');
      mockFs.existsSync.mockReturnValue(false);

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '参考图片不存在，请重新上传'
      });
    });

    it('should return error when template does not exist', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'nonexistent'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock template not found
      mockTemplateService.getTemplateById.mockResolvedValue(null);

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '指定的模板不存在'
      });
    });

    it('should successfully generate image when all parameters are valid', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock successful API call
      mockDoubaoClient.generateImageAndWait.mockResolvedValue({
        success: true,
        data: {
          imageUrl: 'https://example.com/generated.jpg',
          taskId: 'task123'
        }
      });

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockDoubaoClient.generateImageAndWait).toHaveBeenCalledWith({
        referenceImage: Buffer.from('mock-image-data'),
        prompt: 'test prompt',
        templateId: 'template1'
      });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          generatedImageUrl: 'https://example.com/generated.jpg',
          generationId: expect.any(String)
        }
      });
    });

    it('should handle API generation failure', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock API failure
      mockDoubaoClient.generateImageAndWait.mockResolvedValue({
        success: false,
        error: 'API调用失败'
      });

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'API调用失败'
      });
    });

    it('should handle API success but no image URL returned', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock API success but no image URL
      mockDoubaoClient.generateImageAndWait.mockResolvedValue({
        success: true,
        data: {
          taskId: 'task123',
          imageUrl: '' // empty imageUrl to simulate missing URL
        }
      });

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '图片生成失败：未返回图片URL'
      });
    });

    it('should handle timeout errors', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock timeout error
      const timeoutError = new Error('Request timeout ETIMEDOUT');
      mockDoubaoClient.generateImageAndWait.mockRejectedValue(timeoutError);

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(504);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '请求超时，请稍后重试'
      });
    });

    it('should handle network connection errors', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock network error
      const networkError = new Error('Network error ECONNREFUSED');
      mockDoubaoClient.generateImageAndWait.mockRejectedValue(networkError);

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '网络连接失败，请检查网络连接'
      });
    });

    it('should handle API key configuration errors', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock API key error
      const apiKeyError = new Error('DOUBAO_API_KEY not configured');
      mockDoubaoClient.generateImageAndWait.mockRejectedValue(apiKeyError);

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'API配置错误，请联系管理员'
      });
    });

    it('should handle generic errors', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock generic error
      const genericError = new Error('Some unexpected error');
      mockDoubaoClient.generateImageAndWait.mockRejectedValue(genericError);

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Some unexpected error'
      });
    });

    it('should validate imageId parameter type', async () => {
      mockRequest.body = {
        imageId: 123, // number instead of string
        prompt: 'test prompt',
        templateId: 'template1'
      };

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的图片ID参数'
      });
    });

    it('should validate prompt parameter type', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 123, // number instead of string
        templateId: 'template1'
      };

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的提示词参数'
      });
    });

    it('should validate templateId parameter type', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: 'test prompt',
        templateId: 123 // number instead of string
      };

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的模板ID参数'
      });
    });

    it('should trim whitespace from prompt before processing', async () => {
      mockRequest.body = {
        imageId: 'image123',
        prompt: '  test prompt with spaces  ',
        templateId: 'template1'
      };

      // Mock image exists
      mockPath.join.mockReturnValue('/uploads/image123.jpg');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
      
      // Mock template exists
      mockTemplateService.getTemplateById.mockResolvedValue({
        id: 'template1',
        name: 'Test Template',
        previewUrl: '/images/template1.jpg',
        prompt: 'template prompt'
      });

      // Mock successful API call
      mockDoubaoClient.generateImageAndWait.mockResolvedValue({
        success: true,
        data: {
          imageUrl: 'https://example.com/generated.jpg',
          taskId: 'task123'
        }
      });

      await controller.generateImage(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockDoubaoClient.generateImageAndWait).toHaveBeenCalledWith({
        referenceImage: Buffer.from('mock-image-data'),
        prompt: 'test prompt with spaces', // should be trimmed
        templateId: 'template1'
      });
    });
  });
});