import { Request, Response } from 'express';
import axios from 'axios';
import { downloadImage, generateDownloadFilename } from './downloadController';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Download Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockSend: jest.Mock;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockSend = jest.fn();
    mockSetHeader = jest.fn();
    
    mockRequest = {
      params: {},
      query: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: mockJson,
      send: mockSend,
      setHeader: mockSetHeader
    };

    jest.clearAllMocks();
  });

  describe('downloadImage', () => {
    it('should return error when imageId is missing', async () => {
      mockRequest.params = {};
      mockRequest.query = { url: 'https://example.com/image.jpg' };

      await downloadImage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的图片ID参数'
      });
    });

    it('should return error when url is missing', async () => {
      mockRequest.params = { imageId: 'test-id' };
      mockRequest.query = {};

      await downloadImage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '缺少有效的图片URL参数'
      });
    });

    it('should return error when url format is invalid', async () => {
      mockRequest.params = { imageId: 'test-id' };
      mockRequest.query = { url: 'invalid-url' };

      await downloadImage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '无效的图片URL格式'
      });
    });

    it('should successfully download image when parameters are valid', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      
      mockedAxios.get.mockResolvedValue({
        data: mockImageData,
        headers: {
          'content-type': 'image/jpeg'
        }
      });

      mockRequest.params = { imageId: 'test-id' };
      mockRequest.query = {
        url: 'https://example.com/image.jpg',
        template: '油画风格',
        timestamp: '1640995200000'
      };

      await downloadImage(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'PhotoButler/1.0'
          }
        }
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockSetHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment; filename='));
      expect(mockSetHeader).toHaveBeenCalledWith('Content-Length', mockImageData.length);
      expect(mockSetHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockSend).toHaveBeenCalledWith(mockImageData);
    });

    it('should handle axios timeout error', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.name = 'AxiosError';
      (timeoutError as any).code = 'ECONNABORTED';
      
      mockedAxios.get.mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      mockRequest.params = { imageId: 'test-id' };
      mockRequest.query = { url: 'https://example.com/image.jpg' };

      await downloadImage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(504);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '图片下载超时，请稍后重试'
      });
    });

    it('should handle 404 error from image URL', async () => {
      const notFoundError = {
        message: 'Request failed with status code 404',
        response: { status: 404 }
      };
      
      mockedAxios.get.mockRejectedValue(notFoundError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      mockRequest.params = { imageId: 'test-id' };
      mockRequest.query = { url: 'https://example.com/image.jpg' };

      await downloadImage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '图片不存在或已过期'
      });
    });
  });

  describe('generateDownloadFilename', () => {
    it('should generate filename with template and timestamp', () => {
      const filename = generateDownloadFilename('油画风格', '1640995200000', '.jpg');
      
      expect(filename).toMatch(/^ai-generated-油画风格-\d{8}-\d{6}\.jpg$/);
    });

    it('should generate filename without template', () => {
      const filename = generateDownloadFilename(undefined, '1640995200000', '.jpg');
      
      expect(filename).toMatch(/^ai-generated-\d{8}-\d{6}\.jpg$/);
    });

    it('should generate filename without timestamp (use current time)', () => {
      const filename = generateDownloadFilename('油画风格', undefined, '.jpg');
      
      expect(filename).toMatch(/^ai-generated-油画风格-\d{8}-\d{6}\.jpg$/);
    });

    it('should clean template name with special characters', () => {
      const filename = generateDownloadFilename('油画/风格<test>', '1640995200000', '.jpg');
      
      expect(filename).toMatch(/^ai-generated-油画风格test-\d{8}-\d{6}\.jpg$/);
    });

    it('should handle invalid timestamp', () => {
      const filename = generateDownloadFilename('油画风格', 'invalid-timestamp', '.jpg');
      
      expect(filename).toMatch(/^ai-generated-油画风格-\d{8}-\d{6}\.jpg$/);
    });

    it('should limit template name length', () => {
      const longTemplate = '这是一个非常长的模板名称用来测试长度限制功能是否正常工作';
      const filename = generateDownloadFilename(longTemplate, '1640995200000', '.jpg');
      
      // The template name should be truncated to 20 characters
      expect(filename).toMatch(/^ai-generated-这是一个非常长的模板名称用来测试长度限制-\d{8}-\d{6}\.jpg$/);
      expect(filename.length).toBeLessThan(100); // Reasonable filename length
    });

    it('should use different extensions', () => {
      const jpgFilename = generateDownloadFilename('test', '1640995200000', '.jpg');
      const pngFilename = generateDownloadFilename('test', '1640995200000', '.png');
      
      expect(jpgFilename.endsWith('.jpg')).toBe(true);
      expect(pngFilename.endsWith('.png')).toBe(true);
    });
  });
});