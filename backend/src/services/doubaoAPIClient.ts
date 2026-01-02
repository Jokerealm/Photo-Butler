import axios, { AxiosInstance, AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';
import {
  DoubaoAPIConfig,
  DoubaoGenerateRequest,
  DoubaoGenerateResponse,
  DoubaoTaskStatus,
  DoubaoAPIResponse,
  DoubaoImageGenerationParams,
  DoubaoImageGenerationResult,
  DoubaoAPIError
} from '../types/doubao';

/**
 * Doubao API Client for image generation
 * 豆包API客户端，用于图片生成
 */
export class DoubaoAPIClient {
  private config: DoubaoAPIConfig;
  private httpClient: AxiosInstance;

  constructor() {
    this.config = this.loadConfig();
    this.httpClient = this.createHttpClient();
  }

  /**
   * 从环境变量加载API配置
   * Load API configuration from environment variables
   */
  private loadConfig(): DoubaoAPIConfig {
    const apiKey = process.env.DOUBAO_API_KEY;
    const baseUrl = process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3';

    if (!apiKey) {
      throw new Error('DOUBAO_API_KEY environment variable is required');
    }

    return {
      apiKey,
      baseUrl,
      timeout: 180000, // 3分钟超时，适合AI图片生成
      maxRetries: 3   // 最大重试3次
    };
  }

  /**
   * 创建HTTP客户端实例
   * Create HTTP client instance
   */
  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PhotoButler/1.0'
      }
    });

    // 请求拦截器
    client.interceptors.request.use(
      (config) => {
        console.log(`[DoubaoAPI] Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[DoubaoAPI] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    client.interceptors.response.use(
      (response) => {
        console.log(`[DoubaoAPI] Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('[DoubaoAPI] Response error:', error.response?.status, error.response?.statusText);
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * 将图片文件转换为Base64 Data URL
   * Convert image file to Base64 Data URL
   */
  private bufferToBase64DataUrl(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * 上传图片到临时存储并获取URL
   * Upload image to temporary storage and get URL
   * 注意：这是一个简化实现，实际项目中应该使用云存储服务
   */
  private async uploadImageToTempStorage(buffer: Buffer): Promise<string> {
    // 将图片转换为base64格式，避免需要外网访问的URL
    const base64Image = buffer.toString('base64');
    const mimeType = 'image/jpeg'; // 假设是JPEG格式
    
    console.log(`[DoubaoAPI] Converting image to base64 format`);
    
    // 返回data URL格式
    return `data:${mimeType};base64,${base64Image}`;
  }

  /**
   * 处理API错误响应
   * Handle API error response
   */
  private handleAPIError(error: AxiosError): DoubaoAPIError {
    if (error.response) {
      // 服务器返回错误响应
      const response = error.response.data as DoubaoAPIResponse;
      const status = error.response.status;
      
      // 特殊处理429错误
      if (status === 429) {
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后重试',
          details: response.data
        };
      }
      
      return {
        code: response.code?.toString() || error.response.status.toString(),
        message: response.message || error.message,
        details: response.data
      };
    } else if (error.request) {
      // 请求发送但没有收到响应
      return {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络连接',
        details: error.message
      };
    } else {
      // 其他错误
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || '未知错误',
        details: error
      };
    }
  }

  /**
   * 实现重试逻辑
   * Implement retry logic
   */
  private async retryRequest<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[DoubaoAPI] Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[DoubaoAPI] Attempt ${attempt} failed:`, error);

        // 如果是429错误，使用更长的延迟
        const isRateLimit = error instanceof Error && 
          (error.message.includes('429') || error.message.includes('rate limit'));

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          break;
        }

        // 计算重试延迟（指数退避，429错误使用更长延迟）
        const baseDelay = isRateLimit ? 5000 : 1000; // 429错误等待5秒，其他错误等待1秒
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000); // 最多等待30秒
        
        console.log(`[DoubaoAPI] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * 生成AI图片
   * Generate AI image
   */
  async generateImage(request: DoubaoGenerateRequest): Promise<DoubaoGenerateResponse> {
    try {
      console.log('[DoubaoAPI] Starting image generation...');

      // 验证输入参数
      if (!request.referenceImage || request.referenceImage.length === 0) {
        throw new Error('Reference image is required');
      }

      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required');
      }

      // 上传参考图片到临时存储获取公开URL
      // 注意：在实际项目中，这里应该使用真实的云存储服务
      const imageUrl = await this.uploadImageToTempStorage(request.referenceImage);
      console.log(`[DoubaoAPI] Reference image uploaded: ${imageUrl}`);

      // 构建图片生成API请求参数 - 基于豆包图文生图API
      const params = {
        model: "doubao-seedream-4-5-251128", // 使用豆包的图片生成模型
        prompt: request.prompt.trim(),
        image: imageUrl, // 参考图片URL
        size: "2K", // 图片尺寸
        response_format: "url",
        watermark: false
      };

      console.log('[DoubaoAPI] Sending request to Doubao Image Generation API...');

      // 使用重试机制发送请求
      const response = await this.retryRequest(async () => {
        return await this.httpClient.post<any>(
          '/images/generations', // 使用正确的端点（复数形式）
          params
        );
      });

      // 解析响应 - 图片生成API的响应格式
      const apiResponse = response.data;
      
      console.log('[DoubaoAPI] API Response received:', JSON.stringify(apiResponse, null, 2));

      // 检查响应格式 - 图片生成API返回data数组
      if (!apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
        throw new Error('Invalid API response format: no image data received');
      }

      const generatedImageUrl = apiResponse.data[0].url;
      
      if (!generatedImageUrl) {
        throw new Error('No image URL in API response');
      }
      
      return {
        success: true,
        data: {
          imageUrl: generatedImageUrl,
          taskId: `task_${Date.now()}`,
          description: `Generated image based on prompt: ${request.prompt.trim()}`
        }
      };

    } catch (error) {
      console.error('[DoubaoAPI] Image generation failed:', error);

      if (error instanceof AxiosError) {
        console.error('[DoubaoAPI] Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        
        const apiError = this.handleAPIError(error);
        return {
          success: false,
          error: `API调用失败: ${apiError.message}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : '图片生成失败'
      };
    }
  }

  /**
   * 检查任务状态
   * Check task status
   */
  async checkTaskStatus(taskId: string): Promise<DoubaoTaskStatus> {
    try {
      console.log(`[DoubaoAPI] Checking task status: ${taskId}`);

      const response = await this.retryRequest(async () => {
        return await this.httpClient.get<DoubaoAPIResponse<DoubaoImageGenerationResult>>(
          `/image/task/${taskId}`
        );
      });

      const apiResponse = response.data;
      
      if (apiResponse.code !== 200 || !apiResponse.data) {
        throw new Error(apiResponse.message || 'Failed to get task status');
      }

      const result = apiResponse.data;

      // 映射API状态到内部状态
      let status: DoubaoTaskStatus['status'];
      let progress = 0;

      switch (result.status) {
        case 'pending':
          status = 'pending';
          progress = 0;
          break;
        case 'processing':
          status = 'processing';
          progress = 50; // 假设处理中为50%
          break;
        case 'completed':
          status = 'completed';
          progress = 100;
          break;
        case 'failed':
          status = 'failed';
          progress = 0;
          break;
        default:
          status = 'pending';
          progress = 0;
      }

      return {
        status,
        progress,
        result: result.image_url,
        error: status === 'failed' ? '图片生成失败' : undefined
      };

    } catch (error) {
      console.error('[DoubaoAPI] Failed to check task status:', error);

      return {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : '检查任务状态失败'
      };
    }
  }

  /**
   * 等待任务完成
   * Wait for task completion
   */
  async waitForTaskCompletion(
    taskId: string,
    maxWaitTime: number = 180000, // 最大等待3分钟
    pollInterval: number = 2000   // 每2秒检查一次
  ): Promise<DoubaoTaskStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkTaskStatus(taskId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      console.log(`[DoubaoAPI] Task ${taskId} status: ${status.status} (${status.progress}%)`);
      
      // 等待下次检查
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // 超时
    return {
      status: 'failed',
      progress: 0,
      error: '任务执行超时'
    };
  }

  /**
   * 生成图片并等待完成
   * Generate image and wait for completion
   */
  async generateImageAndWait(request: DoubaoGenerateRequest): Promise<DoubaoGenerateResponse> {
    try {
      // 启动图片生成
      const generateResult = await this.generateImage(request);
      
      if (!generateResult.success || !generateResult.data?.taskId) {
        return generateResult;
      }

      const taskId = generateResult.data.taskId;

      // 如果已经有图片URL，直接返回
      if (generateResult.data.imageUrl) {
        return generateResult;
      }

      // 等待任务完成
      console.log(`[DoubaoAPI] Waiting for task completion: ${taskId}`);
      const finalStatus = await this.waitForTaskCompletion(taskId);

      if (finalStatus.status === 'completed' && finalStatus.result) {
        return {
          success: true,
          data: {
            imageUrl: finalStatus.result,
            taskId
          }
        };
      } else {
        return {
          success: false,
          error: finalStatus.error || '图片生成失败'
        };
      }

    } catch (error) {
      console.error('[DoubaoAPI] Generate and wait failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '图片生成失败'
      };
    }
  }

  /**
   * 测试API连接
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[DoubaoAPI] Testing API connection...');
      
      // 发送一个简单的健康检查请求
      const response = await this.httpClient.get('/health');
      
      console.log('[DoubaoAPI] Connection test successful');
      return true;
    } catch (error) {
      console.error('[DoubaoAPI] Connection test failed:', error);
      return false;
    }
  }

  /**
   * 获取API配置信息（不包含敏感信息）
   * Get API configuration info (without sensitive data)
   */
  getConfigInfo(): Omit<DoubaoAPIConfig, 'apiKey'> {
    return {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries
    };
  }
}

// 导出单例实例 (only in non-test environment)
// 延迟初始化，避免在模块加载时就创建实例
let _doubaoAPIClient: DoubaoAPIClient | undefined;

export const getDoubaoAPIClient = (): DoubaoAPIClient => {
  if (!_doubaoAPIClient && process.env.NODE_ENV !== 'test') {
    _doubaoAPIClient = new DoubaoAPIClient();
  }
  if (!_doubaoAPIClient) {
    throw new Error('DoubaoAPIClient not initialized');
  }
  return _doubaoAPIClient;
};