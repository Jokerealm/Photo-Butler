/**
 * Task related types
 * 任务相关类型定义
 */

// Task status enum
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Generation task interface
export interface GenerationTask {
  id: string;
  userId: string;
  templateId: string;
  originalImageUrl: string;
  generatedImageUrl?: string;
  status: TaskStatus;
  progress: number;
  errorMessage?: string;
  estimatedCompletionTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  customPrompt?: string; // 自定义提示词
}

// Task creation request
export interface CreateTaskRequest {
  templateId: string;
  imageFile: File;
  customPrompt?: string;
}

// API response types
export interface TaskResponse {
  success: boolean;
  data?: {
    task: GenerationTask;
  };
  error?: string;
}

export interface TaskListResponse {
  success: boolean;
  data?: {
    tasks: GenerationTask[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}