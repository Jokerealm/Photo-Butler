import { 
  Template, 
  GenerationTask, 
  ApiResponse, 
  TemplateListResponse, 
  TemplateSearchResponse, 
  TaskListResponse 
} from '../types';
import { RetryService } from './retryService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// Simple in-memory cache for API responses
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

class ApiService {
  private cache = new ApiCache();

  private createApiError(message: string, status?: number, details?: any): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.code = status ? `HTTP_${status}` : 'NETWORK_ERROR';
    error.details = details;
    return error;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<ApiResponse<T>> {
    // Check cache first for GET requests
    if (cacheKey && (!options.method || options.method === 'GET')) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails: any = null;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw this.createApiError(errorMessage, response.status, errorDetails);
      }

      const result = await response.json();

      // Cache successful GET responses
      if (cacheKey && (!options.method || options.method === 'GET')) {
        this.cache.set(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw this.createApiError('网络连接失败，请检查网络连接', undefined, error);
      }
      
      if (error.name === 'AbortError') {
        throw this.createApiError('请求超时，请重试', undefined, error);
      }

      throw error;
    }
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<ApiResponse<T>> {
    return RetryService.withRetry(
      () => this.request<T>(endpoint, options, cacheKey, cacheTTL),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        retryCondition: (error: ApiError) => {
          // Retry on network errors and 5xx server errors
          if (error.code === 'NETWORK_ERROR') return true;
          if (error.status && error.status >= 500) return true;
          if (error.name === 'AbortError') return true;
          return false;
        },
        onRetry: (attempt, error) => {
          console.warn(`API request retry attempt ${attempt} for ${endpoint}:`, error.message);
        }
      }
    );
  }

  // Template API methods with caching
  async getTemplates(page = 1, limit = 20): Promise<ApiResponse<TemplateListResponse>> {
    const cacheKey = `templates_${page}_${limit}`;
    return this.requestWithRetry<TemplateListResponse>(
      `/api/templates`,
      {},
      cacheKey,
      300000 // 5 minutes cache
    );
  }

  async searchTemplates(query: string, page = 1, limit = 20): Promise<ApiResponse<TemplateSearchResponse>> {
    const encodedQuery = encodeURIComponent(query);
    const cacheKey = `search_${encodedQuery}_${page}_${limit}`;
    return this.requestWithRetry<TemplateSearchResponse>(
      `/api/templates/search?q=${encodedQuery}&page=${page}&limit=${limit}`,
      {},
      cacheKey,
      180000 // 3 minutes cache for search results
    );
  }

  async getTemplate(id: string): Promise<ApiResponse<{ template: Template }>> {
    const cacheKey = `template_${id}`;
    return this.requestWithRetry<{ template: Template }>(
      `/api/templates/${id}`,
      {},
      cacheKey,
      600000 // 10 minutes cache for individual templates
    );
  }

  // Task API methods (no caching for dynamic data)
  async createTask(templateId: string, imageFile: File): Promise<ApiResponse<{ task: GenerationTask }>> {
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('imageFile', imageFile);

    // Clear task list cache when creating new task
    this.clearTaskCache();

    // Don't retry task creation to avoid duplicates
    return this.request<{ task: GenerationTask }>('/api/tasks', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async getTasks(status?: string, page = 1, limit = 20): Promise<ApiResponse<TaskListResponse>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const cacheKey = `tasks_${params.toString()}`;
    return this.requestWithRetry<TaskListResponse>(
      `/api/tasks?${params.toString()}`,
      {},
      cacheKey,
      30000 // 30 seconds cache for task lists (shorter due to real-time updates)
    );
  }

  async getTask(id: string): Promise<ApiResponse<{ task: GenerationTask }>> {
    return this.requestWithRetry<{ task: GenerationTask }>(`/api/tasks/${id}`);
  }

  async retryTask(id: string): Promise<ApiResponse<{ task: GenerationTask }>> {
    // Clear task cache when retrying
    this.clearTaskCache();
    
    return this.request<{ task: GenerationTask }>(`/api/tasks/${id}/retry`, {
      method: 'POST',
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<{}>> {
    // Clear task cache when deleting
    this.clearTaskCache();
    
    return this.request<{}>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Cache management methods
  clearCache() {
    this.cache.clear();
  }

  clearTemplateCache() {
    // Clear all template-related cache entries
    for (const key of Array.from(this.cache['cache'].keys())) {
      if (key.startsWith('templates_') || key.startsWith('template_') || key.startsWith('search_')) {
        this.cache.delete(key);
      }
    }
  }

  clearTaskCache() {
    // Clear all task-related cache entries
    for (const key of Array.from(this.cache['cache'].keys())) {
      if (key.startsWith('tasks_')) {
        this.cache.delete(key);
      }
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/api/health', { method: 'HEAD' });
      return true;
    } catch {
      return false;
    }
  }

  // File download helper with error handling
  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await RetryService.withRetry(
        () => fetch(url),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          retryCondition: (error) => {
            return error.name === 'TypeError' || error.status >= 500;
          }
        }
      );

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('File download failed:', error);
      throw new Error(`文件下载失败: ${error.message}`);
    }
  }

  // Batch operations with progress tracking
  async batchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        const result = await operation(items[i]);
        results.push(result);
        onProgress?.(i + 1, items.length);
      } catch (error) {
        console.error(`Batch operation failed for item ${i}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}

// Singleton instance
export const apiService = new ApiService();