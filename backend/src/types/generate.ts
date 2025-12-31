/**
 * Generate API data models and type definitions
 * 图片生成API数据模型和类型定义
 */

export interface GenerateRequest {
  imageId: string;         // 上传图片的ID
  prompt: string;          // 提示词
  templateId: string;      // 模板ID
}

export interface GenerateResponse {
  success: boolean;
  data?: {
    generatedImageUrl: string;  // 生成的图片URL
    generationId: string;       // 生成记录ID
  };
  error?: string;
}

export interface GenerationResult {
  id: string;                    // 生成记录ID
  originalImageId: string;       // 原图ID
  generatedImageUrl: string;     // 生成图URL
  templateId: string;            // 使用的模板ID
  prompt: string;                // 使用的提示词
  timestamp: number;             // 生成时间戳
}