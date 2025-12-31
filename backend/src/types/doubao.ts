/**
 * Doubao API data models and type definitions
 * 豆包API数据模型和类型定义
 */

export interface DoubaoGenerateRequest {
  referenceImage: Buffer;  // 参考图片数据
  prompt: string;          // 提示词
  templateId?: string;     // 模板ID（可选）
}

export interface DoubaoGenerateResponse {
  success: boolean;
  data?: {
    imageUrl: string;      // 生成的图片URL
    taskId: string;        // 任务ID
    description?: string;  // AI生成的描述（可选）
  };
  error?: string;
}

export interface DoubaoTaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;        // 进度百分比 (0-100)
  result?: string;         // 结果图片URL
  error?: string;          // 错误信息
}

export interface DoubaoAPIConfig {
  apiKey: string;          // API密钥
  baseUrl: string;         // API基础URL
  timeout: number;         // 请求超时时间（毫秒）
  maxRetries: number;      // 最大重试次数
}

export interface DoubaoAPIError {
  code: string;
  message: string;
  details?: any;
}

// API响应的基础结构
export interface DoubaoAPIResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 图片生成请求参数
export interface DoubaoImageGenerationParams {
  image: string;           // Base64编码的图片
  prompt: string;          // 中文提示词
  style?: string;          // 风格参数（可选）
  quality?: 'standard' | 'high'; // 质量设置
}

// 图片生成响应数据
export interface DoubaoImageGenerationResult {
  task_id: string;         // 任务ID
  status: string;          // 任务状态
  image_url?: string;      // 生成的图片URL
  created_at: string;      // 创建时间
}