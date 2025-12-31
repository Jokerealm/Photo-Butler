/**
 * Template data models and type definitions
 * 模板数据模型和类型定义
 */

export interface Template {
  id: string;              // 唯一标识符
  name: string;            // 模板名称
  previewUrl: string;      // 预览图URL
  prompt: string;          // 提示词内容
  category?: string;       // 分类（预留）
}

export interface TemplateFile {
  filename: string;        // 文件名
  name: string;           // 解析后的模板名称
  extension: string;      // 文件扩展名
  path: string;           // 文件路径
}

export interface TemplateConfig {
  prompts: string[];      // 提示词列表
}

export interface TemplateListResponse {
  success: boolean;
  data: {
    templates: Template[];
  };
  error?: string;
}