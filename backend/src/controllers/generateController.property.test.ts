import { Request, Response } from 'express';
import * as fc from 'fast-check';
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

describe('GenerateController Property Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockDoubaoClient: jest.Mocked<DoubaoAPIClient>;
  let controller: GenerateController;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
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

  /**
   * **Feature: ai-image-generator, Property 10: API调用参数完整性**
   * **Validates: Requirements 4.1, 8.2**
   */
  describe('Property 10: API调用参数完整性', () => {
    it('should call Doubao API with complete parameters for any valid generation request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageId: fc.string({ minLength: 1 }),
            prompt: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            templateId: fc.string({ minLength: 1 })
          }),
          fc.uint8Array({ minLength: 1 }), // Mock image buffer
          async (requestData, imageBuffer) => {
            // Clear previous mocks
            jest.clearAllMocks();
            
            // Setup mocks for successful path
            mockRequest.body = requestData;
            
            // Mock image exists
            mockPath.join.mockReturnValue(`/uploads/${requestData.imageId}.jpg`);
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(Buffer.from(imageBuffer));
            
            // Mock template exists
            mockTemplateService.getTemplateById.mockResolvedValue({
              id: requestData.templateId,
              name: 'Test Template',
              previewUrl: '/images/template.jpg',
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

            await controller.generateImage(mockRequest as Request, mockResponse as Response);

            // Verify API was called with complete parameters
            expect(mockDoubaoClient.generateImageAndWait).toHaveBeenCalledWith({
              referenceImage: Buffer.from(imageBuffer),
              prompt: requestData.prompt.trim(),
              templateId: requestData.templateId
            });

            // Verify all required parameters are present
            const apiCall = mockDoubaoClient.generateImageAndWait.mock.calls[0][0];
            expect(apiCall.referenceImage).toBeDefined();
            expect(apiCall.referenceImage.length).toBeGreaterThan(0);
            expect(apiCall.prompt).toBeDefined();
            expect(apiCall.prompt.trim().length).toBeGreaterThan(0);
            expect(apiCall.templateId).toBeDefined();
            expect(apiCall.templateId!.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ai-image-generator, Property 12: API成功响应处理**
   * **Validates: Requirements 4.3, 8.3**
   */
  describe('Property 12: API成功响应处理', () => {
    it('should properly handle successful API responses for any valid generation result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageId: fc.string({ minLength: 1 }),
            prompt: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            templateId: fc.string({ minLength: 1 })
          }),
          fc.record({
            imageUrl: fc.webUrl(),
            taskId: fc.string({ minLength: 1 })
          }),
          async (requestData, apiResponse) => {
            // Clear previous mocks
            jest.clearAllMocks();
            
            // Setup request
            mockRequest.body = requestData;
            
            // Mock image exists
            mockPath.join.mockReturnValue(`/uploads/${requestData.imageId}.jpg`);
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
            
            // Mock template exists
            mockTemplateService.getTemplateById.mockResolvedValue({
              id: requestData.templateId,
              name: 'Test Template',
              previewUrl: '/images/template.jpg',
              prompt: 'template prompt'
            });

            // Mock successful API response
            mockDoubaoClient.generateImageAndWait.mockResolvedValue({
              success: true,
              data: apiResponse
            });

            await controller.generateImage(mockRequest as Request, mockResponse as Response);

            // Verify successful response handling
            expect(mockStatus).not.toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
              success: true,
              data: {
                generatedImageUrl: apiResponse.imageUrl,
                generationId: expect.any(String)
              }
            });

            // Verify the response contains the generated image URL
            const responseCall = mockJson.mock.calls[0][0];
            expect(responseCall.success).toBe(true);
            expect(responseCall.data.generatedImageUrl).toBe(apiResponse.imageUrl);
            expect(responseCall.data.generationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ai-image-generator, Property 13: API失败响应处理**
   * **Validates: Requirements 4.4, 8.5**
   */
  describe('Property 13: API失败响应处理', () => {
    it('should properly handle API failure responses for any error condition', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageId: fc.string({ minLength: 1 }),
            prompt: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            templateId: fc.string({ minLength: 1 })
          }),
          fc.string({ minLength: 1 }), // Error message
          async (requestData, errorMessage) => {
            // Clear previous mocks
            jest.clearAllMocks();
            
            // Setup request
            mockRequest.body = requestData;
            
            // Mock image exists
            mockPath.join.mockReturnValue(`/uploads/${requestData.imageId}.jpg`);
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
            
            // Mock template exists
            mockTemplateService.getTemplateById.mockResolvedValue({
              id: requestData.templateId,
              name: 'Test Template',
              previewUrl: '/images/template.jpg',
              prompt: 'template prompt'
            });

            // Mock API failure
            mockDoubaoClient.generateImageAndWait.mockResolvedValue({
              success: false,
              error: errorMessage
            });

            await controller.generateImage(mockRequest as Request, mockResponse as Response);

            // Verify error response handling
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
              success: false,
              error: errorMessage
            });

            // Verify the response structure for failures
            const responseCall = mockJson.mock.calls[0][0];
            expect(responseCall.success).toBe(false);
            expect(responseCall.error).toBe(errorMessage);
            expect(responseCall.data).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle different types of API errors with appropriate status codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageId: fc.string({ minLength: 1 }),
            prompt: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            templateId: fc.string({ minLength: 1 })
          }),
          fc.oneof(
            fc.constant('timeout'),
            fc.constant('ETIMEDOUT'),
            fc.constant('network'),
            fc.constant('ECONNREFUSED'),
            fc.constant('DOUBAO_API_KEY'),
            fc.string({ minLength: 1 })
          ),
          async (requestData, errorType) => {
            // Clear previous mocks
            jest.clearAllMocks();
            
            // Setup request
            mockRequest.body = requestData;
            
            // Mock image exists
            mockPath.join.mockReturnValue(`/uploads/${requestData.imageId}.jpg`);
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(Buffer.from('mock-image-data'));
            
            // Mock template exists
            mockTemplateService.getTemplateById.mockResolvedValue({
              id: requestData.templateId,
              name: 'Test Template',
              previewUrl: '/images/template.jpg',
              prompt: 'template prompt'
            });

            // Create error based on type
            let error: Error;
            if (errorType === 'timeout' || errorType === 'ETIMEDOUT') {
              error = new Error(`Request ${errorType}`);
            } else if (errorType === 'network' || errorType === 'ECONNREFUSED') {
              error = new Error(`Network ${errorType}`);
            } else if (errorType === 'DOUBAO_API_KEY') {
              error = new Error('DOUBAO_API_KEY configuration error');
            } else {
              error = new Error(errorType);
            }

            // Mock API throwing error
            mockDoubaoClient.generateImageAndWait.mockRejectedValue(error);

            await controller.generateImage(mockRequest as Request, mockResponse as Response);

            // Verify appropriate error handling
            expect(mockJson).toHaveBeenCalled();
            const responseCall = mockJson.mock.calls[0][0];
            expect(responseCall.success).toBe(false);
            expect(responseCall.error).toBeDefined();
            expect(typeof responseCall.error).toBe('string');

            // Verify appropriate status codes and error messages for different error types
            if (errorType === 'timeout' || errorType === 'ETIMEDOUT') {
              expect(mockStatus).toHaveBeenCalledWith(504);
              expect(responseCall.error).toBe('请求超时，请稍后重试');
            } else if (errorType === 'network' || errorType === 'ECONNREFUSED') {
              expect(mockStatus).toHaveBeenCalledWith(503);
              expect(responseCall.error).toBe('网络连接失败，请检查网络连接');
            } else if (errorType === 'DOUBAO_API_KEY') {
              expect(mockStatus).toHaveBeenCalledWith(500);
              expect(responseCall.error).toBe('API配置错误，请联系管理员');
            } else {
              expect(mockStatus).toHaveBeenCalledWith(500);
              expect(responseCall.error).toBe(errorType);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});