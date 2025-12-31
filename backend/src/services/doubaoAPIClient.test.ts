import { DoubaoAPIClient } from './doubaoAPIClient';
import axios, { AxiosError } from 'axios';
import { DoubaoGenerateRequest } from '../types/doubao';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DoubaoAPIClient', () => {
  let client: DoubaoAPIClient;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      DOUBAO_API_KEY: 'test-api-key',
      DOUBAO_API_URL: 'https://test-api.doubao.com/v1'
    };

    // Reset axios mock
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Constructor and Configuration', () => {
    it('should load API key from environment variables', () => {
      expect(() => new DoubaoAPIClient()).not.toThrow();
    });

    it('should throw error when API key is missing', () => {
      delete process.env.DOUBAO_API_KEY;
      
      expect(() => new DoubaoAPIClient()).toThrow('DOUBAO_API_KEY environment variable is required');
    });

    it('should use default base URL when not provided', () => {
      delete process.env.DOUBAO_API_URL;
      
      const client = new DoubaoAPIClient();
      const config = client.getConfigInfo();
      
      expect(config.baseUrl).toBe('https://api.doubao.com/v1');
    });

    it('should use custom base URL when provided', () => {
      const client = new DoubaoAPIClient();
      const config = client.getConfigInfo();
      
      expect(config.baseUrl).toBe('https://test-api.doubao.com/v1');
    });

    it('should set correct timeout and retry configuration', () => {
      const client = new DoubaoAPIClient();
      const config = client.getConfigInfo();
      
      expect(config.timeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
    });
  });

  describe('HTTP Client Creation', () => {
    it('should create axios instance with correct configuration', () => {
      new DoubaoAPIClient();
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://test-api.doubao.com/v1',
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'User-Agent': 'PhotoButler/1.0'
        }
      });
    });

    it('should set up request and response interceptors', () => {
      new DoubaoAPIClient();
      
      const mockInstance = mockedAxios.create.mock.results[0].value;
      expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('generateImage', () => {
    beforeEach(() => {
      client = new DoubaoAPIClient();
    });

    it('should validate required parameters', async () => {
      const invalidRequest: DoubaoGenerateRequest = {
        referenceImage: Buffer.alloc(0),
        prompt: ''
      };

      const result = await client.generateImage(invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Reference image is required');
    });

    it('should validate prompt parameter', async () => {
      const invalidRequest: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '   '  // whitespace only
      };

      const result = await client.generateImage(invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Prompt is required');
    });

    it('should build correct request parameters', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      mockInstance.post.mockResolvedValue({
        data: {
          code: 200,
          message: 'Success',
          data: { task_id: 'test-task-id' }
        }
      });

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      await client.generateImage(request);

      expect(mockInstance.post).toHaveBeenCalledWith('', {
        model: "ep-20241231172228-8xqzr",
        messages: [
          {
            role: "user",
            content: "请根据以下描述生成图片：测试提示词"
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });
    });

    it('should handle successful API response', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      mockInstance.post.mockResolvedValue({
        data: {
          code: 200,
          message: 'Success',
          data: { task_id: 'test-task-id' }
        }
      });

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(true);
      expect(result.data?.imageUrl).toBe('https://example.com/generated-image.jpg');
      expect(result.data?.taskId).toMatch(/^task_\d+$/);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      client = new DoubaoAPIClient();
    });

    it('should handle network timeout errors', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      const timeoutError = new AxiosError('timeout of 30000ms exceeded');
      timeoutError.code = 'ETIMEDOUT';
      mockInstance.post.mockRejectedValue(timeoutError);

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API调用失败');
    });

    it('should handle API error responses', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      const apiError = new AxiosError('API Error');
      apiError.response = {
        status: 400,
        statusText: 'Bad Request',
        data: {
          code: 400,
          message: 'Invalid parameters'
        },
        headers: {},
        config: {} as any
      };
      mockInstance.post.mockRejectedValue(apiError);

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API调用失败: Invalid parameters');
    });

    it('should handle network connection errors', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      const networkError = new AxiosError('Network Error');
      networkError.request = {};
      mockInstance.post.mockRejectedValue(networkError);

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API调用失败: 网络连接失败，请检查网络连接');
    });

    it('should handle unknown errors', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      const unknownError = new Error('Unknown error');
      mockInstance.post.mockRejectedValue(unknownError);

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      client = new DoubaoAPIClient();
      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should retry failed requests up to maxRetries times', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      
      // First two calls fail, third succeeds
      mockInstance.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            code: 200,
            message: 'Success',
            data: { task_id: 'test-task-id' }
          }
        });

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      const result = await client.generateImage(request);

      expect(mockInstance.post).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('should fail after maxRetries attempts', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      
      // All calls fail
      mockInstance.post.mockRejectedValue(new Error('Persistent network error'));

      const request: DoubaoGenerateRequest = {
        referenceImage: Buffer.from('test-image-data'),
        prompt: '测试提示词'
      };

      const result = await client.generateImage(request);

      expect(mockInstance.post).toHaveBeenCalledTimes(3); // maxRetries = 3
      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent network error');
    });
  });

  describe('checkTaskStatus', () => {
    beforeEach(() => {
      client = new DoubaoAPIClient();
    });

    it('should handle successful task status check', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      mockInstance.get.mockResolvedValue({
        data: {
          code: 200,
          message: 'Success',
          data: {
            status: 'completed',
            image_url: 'https://example.com/result.jpg'
          }
        }
      });

      const result = await client.checkTaskStatus('test-task-id');

      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
      expect(result.result).toBe('https://example.com/result.jpg');
      expect(result.error).toBeUndefined();
    });

    it('should handle failed task status', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      mockInstance.get.mockResolvedValue({
        data: {
          code: 200,
          message: 'Success',
          data: {
            status: 'failed'
          }
        }
      });

      const result = await client.checkTaskStatus('test-task-id');

      expect(result.status).toBe('failed');
      expect(result.progress).toBe(0);
      expect(result.error).toBe('图片生成失败');
    });

    it('should handle API errors when checking status', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      mockInstance.get.mockRejectedValue(new Error('API Error'));

      const result = await client.checkTaskStatus('test-task-id');

      expect(result.status).toBe('failed');
      expect(result.progress).toBe(0);
      expect(result.error).toBe('API Error');
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      client = new DoubaoAPIClient();
    });

    it('should return true for successful connection test', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      mockInstance.get.mockResolvedValue({ data: { status: 'ok' } });

      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should return false for failed connection test', async () => {
      const mockInstance = mockedAxios.create.mock.results[0].value;
      mockInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('getConfigInfo', () => {
    it('should return configuration without sensitive data', () => {
      const client = new DoubaoAPIClient();
      const config = client.getConfigInfo();

      expect(config).toEqual({
        baseUrl: 'https://test-api.doubao.com/v1',
        timeout: 30000,
        maxRetries: 3
      });
      expect(config).not.toHaveProperty('apiKey');
    });
  });
});