import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { parseAPIError, logError, withRetry, AppError } from './errorHandler';

/**
 * API客户端配置
 * API client configuration
 */
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retryConfig?: {
    maxRetries: number;
    delay: number;
    backoff: boolean;
  };
}

/**
 * 默认API客户端配置
 * Default API client configuration
 */
const DEFAULT_CONFIG: APIClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000, // 30秒超时
  retryConfig: {
    maxRetries: 3,
    delay: 1000,
    backoff: true
  }
};

/**
 * API客户端类
 * API client class
 */
export class APIClient {
  private client: AxiosInstance;
  private config: APIClientConfig;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = this.createAxiosInstance();
  }

  /**
   * 创建Axios实例
   * Create Axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // 请求拦截器
    client.interceptors.request.use(
      (config) => {
        // 添加请求时间戳
        (config as any).metadata = { startTime: Date.now() };
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        logError(error, { context: 'request_interceptor' });
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
        }
        
        return response;
      },
      (error: AxiosError) => {
        const duration = Date.now() - ((error.config as any)?.metadata?.startTime || 0);
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`[API] ${error.response?.status || 'ERROR'} ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`);
        }

        // 解析并记录错误
        const appError = parseAPIError(error);
        logError(appError, {
          context: 'api_response',
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          duration
        });

        return Promise.reject(appError);
      }
    );

    return client;
  }

  /**
   * 通用请求方法
   * Generic request method
   */
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      throw error; // 错误已经在拦截器中处理
    }
  }

  /**
   * 带重试的请求方法
   * Request method with retry
   */
  private async requestWithRetry<T>(config: AxiosRequestConfig): Promise<T> {
    if (!this.config.retryConfig) {
      return this.request<T>(config);
    }

    return withRetry(
      () => this.request<T>(config),
      this.config.retryConfig
    );
  }

  /**
   * GET请求
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'GET',
      url,
      ...config
    });
  }

  /**
   * POST请求
   * POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  /**
   * PUT请求
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  /**
   * DELETE请求
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'DELETE',
      url,
      ...config
    });
  }

  /**
   * 文件上传
   * File upload
   */
  async uploadFile<T>(
    url: string,
    file: File,
    fieldName: string = 'file',
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  }

  /**
   * 下载文件
   * Download file
   */
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob'
      });

      // 创建下载链接
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const appError = error instanceof AppError ? error : parseAPIError(error);
      logError(appError, { context: 'file_download', url, filename });
      throw appError;
    }
  }

  /**
   * 健康检查
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.get('/health');
  }

  /**
   * 设置认证令牌
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * 清除认证令牌
   * Clear authentication token
   */
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * 获取配置信息
   * Get configuration info
   */
  getConfig(): APIClientConfig {
    return { ...this.config };
  }
}

// 创建默认API客户端实例
export const apiClient = new APIClient();

// 导出常用的API方法
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.put<T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config),
  uploadFile: <T>(url: string, file: File, fieldName?: string, onProgress?: (progress: number) => void) => 
    apiClient.uploadFile<T>(url, file, fieldName, onProgress),
  downloadFile: (url: string, filename?: string) => apiClient.downloadFile(url, filename),
  healthCheck: () => apiClient.healthCheck()
};

export default apiClient;