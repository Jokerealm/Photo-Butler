import fs from 'fs';
import path from 'path';
import { Template, TemplateFile, TemplateConfig } from '../types/template';

/**
 * Template management service
 * 模板管理服务
 */
export class TemplateService {
  private readonly imageDir: string;
  private readonly promptFile: string;

  constructor() {
    // 使用项目根目录下的image文件夹（backend的上一级目录）
    this.imageDir = path.join(process.cwd(), '..', 'image');
    this.promptFile = path.join(process.cwd(), '..', 'prompt', 'prompt.txt');
  }

  /**
   * 解析模板文件名（去除扩展名）
   * Parse template filename (remove extension)
   * 
   * @param filename - 文件名
   * @returns 解析后的模板名称
   */
  parseTemplateName(filename: string): string {
    const ext = path.extname(filename);
    return path.basename(filename, ext);
  }

  /**
   * 从image文件夹读取模板预览图
   * Read template preview images from image folder
   * 
   * @returns 模板文件列表
   */
  async readTemplateFiles(): Promise<TemplateFile[]> {
    try {
      if (!fs.existsSync(this.imageDir)) {
        console.warn(`Image directory not found: ${this.imageDir}`);
        return [];
      }

      const files = await fs.promises.readdir(this.imageDir);
      const templateFiles: TemplateFile[] = [];

      for (const filename of files) {
        // 跳过占位图和提示词文件
        if (filename === 'placeholder.png' || filename === 'prompt.txt') {
          continue;
        }

        const filePath = path.join(this.imageDir, filename);
        
        try {
          const stat = await fs.promises.stat(filePath);

          // 只处理图片文件
          if (stat.isFile() && this.isImageFile(filename)) {
            const extension = path.extname(filename);
            const name = this.parseTemplateName(filename);

            templateFiles.push({
              filename,
              name,
              extension,
              path: filePath
            });
          }
        } catch (fileError) {
          console.warn(`Error processing file ${filename}:`, fileError);
          continue; // 跳过有问题的文件
        }
      }

      console.log(`Found ${templateFiles.length} template files`);
      return templateFiles;
    } catch (error) {
      console.error('Error reading template files:', error);
      return [];
    }
  }

  /**
   * 检查文件是否为图片格式
   * Check if file is an image format
   * 
   * @param filename - 文件名
   * @returns 是否为图片文件
   */
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * 从prompt.txt解析提示词
   * Parse prompts from prompt.txt file
   * 
   * @returns 提示词配置（按名称索引）
   */
  async parsePrompts(): Promise<{ [key: string]: string }> {
    try {
      if (!fs.existsSync(this.promptFile)) {
        console.warn(`Prompt file not found: ${this.promptFile}`);
        return {};
      }

      const content = await fs.promises.readFile(this.promptFile, 'utf-8');
      const lines = content.split('\n');
      const prompts: { [key: string]: string } = {};

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          // 解析格式：数字. 名称：提示词内容 (支持中文和英文冒号)
          const match = trimmedLine.match(/^\d+\.\s*([^：:]+)[：:]\s*(.+)$/);
          if (match) {
            const name = match[1].trim();
            const prompt = match[2].trim();
            prompts[name] = prompt;
          }
        }
      }

      console.log(`Loaded ${Object.keys(prompts).length} prompts from prompt.txt`);
      return prompts;
    } catch (error) {
      console.error('Error parsing prompts:', error);
      return {};
    }
  }

  /**
   * 获取模板列表
   * Get template list
   * 
   * @returns 模板列表
   */
  async getTemplates(): Promise<Template[]> {
    try {
      const [templateFiles, promptsMap] = await Promise.all([
        this.readTemplateFiles(),
        this.parsePrompts()
      ]);

      const templates: Template[] = [];

      for (let i = 0; i < templateFiles.length; i++) {
        const file = templateFiles[i];
        // 按名称匹配提示词
        const prompt = promptsMap[file.name] || '';

        // 生成预览图URL（相对于静态文件服务）
        const previewUrl = await this.getPreviewUrl(file.filename);

        templates.push({
          id: `template_${i + 1}`,
          name: file.name,
          previewUrl,
          prompt
        });
      }

      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  /**
   * 获取预览图URL，如果文件不存在则返回默认占位图
   * Get preview URL, return default placeholder if file doesn't exist
   * 
   * @param filename - 文件名
   * @returns 预览图URL（已编码）
   */
  private async getPreviewUrl(filename: string): Promise<string> {
    try {
      const filePath = path.join(this.imageDir, filename);
      
      // 检查文件是否存在
      if (fs.existsSync(filePath)) {
        // 对中文文件名进行URL编码
        const encodedFilename = encodeURIComponent(filename);
        return `/images/${encodedFilename}`;
      } else {
        console.warn(`Template preview image not found: ${filename}, using placeholder`);
        return '/images/placeholder.png'; // 默认占位图
      }
    } catch (error) {
      console.error(`Error checking preview image ${filename}:`, error);
      return '/images/placeholder.png'; // 出错时也返回占位图
    }
  }

  /**
   * 根据ID获取模板
   * Get template by ID
   * 
   * @param id - 模板ID
   * @returns 模板或null
   */
  async getTemplateById(id: string): Promise<Template | null> {
    const templates = await this.getTemplates();
    return templates.find(template => template.id === id) || null;
  }

  /**
   * 检查模板列表是否需要更新
   * Check if template list needs update
   * 
   * @returns 是否需要更新
   */
  async shouldUpdateTemplates(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.imageDir)) {
        return false;
      }

      // 检查image文件夹的修改时间
      const stat = await fs.promises.stat(this.imageDir);
      // 这里可以实现更复杂的缓存逻辑
      return true; // 暂时总是返回true，表示需要重新读取
    } catch (error) {
      console.error('Error checking template update status:', error);
      return false;
    }
  }
}

// 导出单例实例
export const templateService = new TemplateService();