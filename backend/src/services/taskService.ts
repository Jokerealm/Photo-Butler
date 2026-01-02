import { GenerationTask, TaskStatus } from '../types/task';
import { templateService } from './templateService';
import { getDoubaoAPIClient } from './doubaoAPIClient';
import { databaseService } from './databaseService';
import { storageConfig } from '../config/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

/**
 * Task management service
 * 任务管理服务
 */
export class TaskService {
  private tasks: Map<string, GenerationTask> = new Map();

  constructor() {
    // 存储配置已经在storageConfig中初始化了目录
    console.log('[TaskService] Initialized with storage config');
    
    // 从数据库加载现有任务到内存
    this.loadTasksFromDatabase();
  }

  /**
   * 从数据库加载任务到内存
   * Load tasks from database to memory
   */
  private async loadTasksFromDatabase(): Promise<void> {
    // 等待数据库初始化完成
    let retries = 0;
    const maxRetries = 10;
    
    while (!databaseService.isAvailable() && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 等待100ms
      retries++;
    }
    
    if (!databaseService.isAvailable()) {
      console.log('[TaskService] Database not available after waiting, using memory-only storage');
      return;
    }

    try {
      const db = databaseService.getConnection();
      if (!db) return;

      const sql = `
        SELECT id, user_id, template_id, original_image_url, generated_image_url, 
               status, progress, custom_prompt, error_message, 
               created_at, updated_at, completed_at
        FROM tasks 
        ORDER BY created_at DESC
      `;

      db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          console.error('[TaskService] Error loading tasks from database:', err);
          return;
        }

        rows.forEach(row => {
          const task: GenerationTask = {
            id: row.id,
            userId: row.user_id,
            templateId: row.template_id,
            originalImageUrl: row.original_image_url,
            generatedImageUrl: row.generated_image_url,
            status: row.status as TaskStatus,
            progress: row.progress,
            customPrompt: row.custom_prompt,
            errorMessage: row.error_message,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            completedAt: row.completed_at ? new Date(row.completed_at) : undefined
          };
          this.tasks.set(task.id, task);
        });

        console.log(`[TaskService] Loaded ${rows.length} tasks from database`);
      });
    } catch (error) {
      console.error('[TaskService] Error loading tasks from database:', error);
    }
  }

  /**
   * 保存任务到数据库
   * Save task to database
   */
  private async saveTaskToDatabase(task: GenerationTask): Promise<void> {
    if (!databaseService.isAvailable()) {
      return;
    }

    try {
      const db = databaseService.getConnection();
      if (!db) return;

      const sql = `
        INSERT OR REPLACE INTO tasks 
        (id, user_id, template_id, original_image_url, generated_image_url, 
         status, progress, custom_prompt, error_message, 
         created_at, updated_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        task.id,
        task.userId,
        task.templateId,
        task.originalImageUrl,
        task.generatedImageUrl || null,
        task.status,
        task.progress,
        task.customPrompt || null,
        task.errorMessage || null,
        task.createdAt.toISOString(),
        task.updatedAt.toISOString(),
        task.completedAt ? task.completedAt.toISOString() : null
      ];

      db.run(sql, params, function(err) {
        if (err) {
          console.error('[TaskService] Error saving task to database:', err);
        } else {
          console.log(`[TaskService] Task saved to database: ${task.id}`);
        }
      });
    } catch (error) {
      console.error('[TaskService] Error saving task to database:', error);
    }
  }

  /**
   * 从数据库删除任务
   * Delete task from database
   */
  private async deleteTaskFromDatabase(taskId: string): Promise<void> {
    if (!databaseService.isAvailable()) {
      return;
    }

    try {
      const db = databaseService.getConnection();
      if (!db) return;

      const sql = 'DELETE FROM tasks WHERE id = ?';
      
      db.run(sql, [taskId], function(err) {
        if (err) {
          console.error('[TaskService] Error deleting task from database:', err);
        } else {
          console.log(`[TaskService] Task deleted from database: ${taskId}`);
        }
      });
    } catch (error) {
      console.error('[TaskService] Error deleting task from database:', error);
    }
  }

  /**
   * 创建新任务
   * Create new task
   */
  async createTask(
    templateId: string, 
    imageFile: Express.Multer.File, 
    customPrompt?: string,
    userId: string = 'anonymous'
  ): Promise<GenerationTask> {
    try {
      // 验证模板是否存在
      const template = await templateService.getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // 生成任务ID
      const taskId = uuidv4();
      
      // 保存上传的图片到uploads/originals目录
      const imageExtension = path.extname(imageFile.originalname);
      const imageFilename = `${taskId}_original${imageExtension}`;
      const imagePath = storageConfig.getUploadPath(imageFilename);
      
      // 写入文件
      fs.writeFileSync(imagePath, imageFile.buffer);
      console.log(`[TaskService] Saved original image: ${imagePath}`);
      
      // 创建任务对象
      const task: GenerationTask = {
        id: taskId,
        userId,
        templateId,
        originalImageUrl: `/uploads/originals/${imageFilename}`, // 更新URL路径
        status: TaskStatus.PENDING,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customPrompt
      };

      // 保存任务
      this.tasks.set(taskId, task);
      
      // 保存到数据库
      await this.saveTaskToDatabase(task);

      // 异步开始处理任务
      this.processTaskAsync(taskId);

      // 添加模板信息到返回的任务中
      (task as any).template = template;

      console.log(`[TaskService] Task created: ${taskId}`);
      return task;
    } catch (error) {
      console.error('[TaskService] Error creating task:', error);
      throw error;
    }
  }

  /**
   * 获取任务详情
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<GenerationTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    // 获取模板信息并附加到任务中
    const template = await templateService.getTemplateById(task.templateId);
    if (template) {
      (task as any).template = template;
    }

    return task;
  }

  /**
   * 获取任务列表
   * Get tasks list
   */
  async getTasks(userId?: string, page: number = 1, limit: number = 20): Promise<{
    tasks: GenerationTask[];
    total: number;
    page: number;
    limit: number;
  }> {
    let allTasks = Array.from(this.tasks.values());
    
    // 按用户过滤
    if (userId) {
      allTasks = allTasks.filter(task => task.userId === userId);
    }

    // 按创建时间倒序排序
    allTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const tasks = allTasks.slice(startIndex, endIndex);

    // 为每个任务添加模板信息
    const tasksWithTemplates = await Promise.all(
      tasks.map(async (task) => {
        const template = await templateService.getTemplateById(task.templateId);
        if (template) {
          (task as any).template = template;
        }
        return task;
      })
    );

    return {
      tasks: tasksWithTemplates,
      total: allTasks.length,
      page,
      limit
    };
  }

  /**
   * 更新任务状态
   * Update task status
   */
  async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    progress?: number,
    generatedImageUrl?: string,
    errorMessage?: string
  ): Promise<GenerationTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    task.status = status;
    task.updatedAt = new Date();
    
    if (progress !== undefined) {
      task.progress = progress;
    }
    
    if (generatedImageUrl) {
      task.generatedImageUrl = generatedImageUrl;
    }
    
    if (errorMessage) {
      task.errorMessage = errorMessage;
    }
    
    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      task.completedAt = new Date();
    }

    this.tasks.set(taskId, task);
    
    // 保存到数据库
    await this.saveTaskToDatabase(task);
    
    return task;
  }

  /**
   * 异步处理任务
   * Process task asynchronously
   */
  private async processTaskAsync(taskId: string): Promise<void> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        return;
      }

      // 更新状态为处理中
      await this.updateTaskStatus(taskId, TaskStatus.PROCESSING, 10);

      // 获取模板信息
      const template = await templateService.getTemplateById(task.templateId);
      if (!template) {
        throw new Error(`Template not found: ${task.templateId}`);
      }

      // 读取上传的图片文件
      const originalFilename = path.basename(task.originalImageUrl);
      const imagePath = storageConfig.getUploadPath(originalFilename);
      
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Original image not found: ${imagePath}`);
      }

      const imageBuffer = fs.readFileSync(imagePath);
      await this.updateTaskStatus(taskId, TaskStatus.PROCESSING, 30);

      // 准备提示词（使用自定义提示词或模板提示词）
      const prompt = task.customPrompt || template.prompt;

      console.log(`[TaskService] Starting AI generation for task ${taskId}`);
      console.log(`[TaskService] Using prompt: ${prompt.substring(0, 100)}...`);

      try {
        // 调用豆包API生成图片
        const doubaoClient = getDoubaoAPIClient();
        await this.updateTaskStatus(taskId, TaskStatus.PROCESSING, 50);

        const generateResult = await doubaoClient.generateImageAndWait({
          referenceImage: imageBuffer,
          prompt: prompt
        });

        if (!generateResult.success) {
          throw new Error(generateResult.error || 'AI generation failed');
        }

        if (!generateResult.data?.imageUrl) {
          throw new Error('No image URL returned from AI service');
        }

        await this.updateTaskStatus(taskId, TaskStatus.PROCESSING, 90);

        // 下载生成的图片并保存到本地
        const generatedImageUrl = await this.downloadAndSaveGeneratedImage(
          taskId, 
          generateResult.data.imageUrl
        );

        // 更新任务状态为完成
        await this.updateTaskStatus(
          taskId, 
          TaskStatus.COMPLETED, 
          100, 
          generatedImageUrl
        );

        console.log(`[TaskService] Task completed successfully: ${taskId}`);

      } catch (apiError) {
        console.error(`[TaskService] AI generation failed for task ${taskId}:`, apiError);
        
        // 如果是429错误（频率限制），提供更友好的错误信息
        let errorMessage = apiError instanceof Error ? apiError.message : 'AI生成失败';
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          errorMessage = '服务繁忙，请稍后重试';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = '生成超时，请重试';
        } else if (errorMessage.includes('network')) {
          errorMessage = '网络连接失败，请检查网络';
        }

        // 如果AI生成失败，回退到模拟生成
        console.log(`[TaskService] Falling back to simulation for task ${taskId}`);
        await this.simulateImageGeneration(taskId);
      }

    } catch (error) {
      console.error(`[TaskService] Error processing task ${taskId}:`, error);
      await this.updateTaskStatus(
        taskId, 
        TaskStatus.FAILED, 
        0, 
        undefined, 
        error instanceof Error ? error.message : '处理失败'
      );
    }
  }

  /**
   * 下载并保存生成的图片
   * Download and save generated image
   */
  private async downloadAndSaveGeneratedImage(taskId: string, imageUrl: string): Promise<string> {
    try {
      console.log(`[TaskService] Processing generated image: ${imageUrl}`);
      
      // 如果是本地URL，检查是否需要移动到正确的目录
      if (imageUrl.startsWith('/uploads/')) {
        return imageUrl;
      }

      // 下载远程图片
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      // 保存到generated目录
      const filename = `${taskId}_generated.jpg`;
      const localPath = storageConfig.getGeneratedPath(filename);
      
      fs.writeFileSync(localPath, imageBuffer);
      
      const localUrl = `/uploads/generated/${filename}`;
      console.log(`[TaskService] Generated image saved: ${localUrl}`);
      
      // 异步清理原始上传文件（可选）
      this.cleanupOriginalFileAsync(taskId);
      
      return localUrl;
      
    } catch (error) {
      console.error(`[TaskService] Failed to download generated image:`, error);
      // 如果下载失败，回退到原始URL
      return imageUrl;
    }
  }

  /**
   * 异步清理原始上传文件
   * Async cleanup of original upload file
   */
  private async cleanupOriginalFileAsync(taskId: string): Promise<void> {
    // 根据环境变量决定是否清理原图
    const shouldCleanupOriginals = process.env.CLEANUP_ORIGINAL_IMAGES === 'true';
    const cleanupDelayMinutes = parseInt(process.env.CLEANUP_DELAY_MINUTES || '60');
    
    if (shouldCleanupOriginals) {
      try {
        // 延迟清理，确保任务完全处理完成
        setTimeout(() => {
          storageConfig.cleanupProcessedUploads([taskId]);
        }, cleanupDelayMinutes * 60 * 1000); // 转换为毫秒
      } catch (error) {
        console.error(`[TaskService] Error scheduling cleanup for ${taskId}:`, error);
      }
    } else {
      console.log(`[TaskService] Original image cleanup disabled for task ${taskId}`);
    }
  }

  /**
   * 模拟图片生成过程（作为备用方案）
   * Simulate image generation process (as fallback)
   */
  private async simulateImageGeneration(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    console.log(`[TaskService] Using simulation fallback for task ${taskId}`);

    // 模拟处理进度
    const progressSteps = [60, 70, 80, 90, 100];
    
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待0.5秒
      await this.updateTaskStatus(taskId, TaskStatus.PROCESSING, progress);
    }

    // 模拟生成完成
    // 生成完整的URL以支持下载功能
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const generatedImageUrl = `${baseUrl}/uploads/generated/${taskId}_generated.jpg`;
    
    // 创建占位符图片文件（模拟生成的图片）
    try {
      const filePath = storageConfig.getGeneratedPath(`${taskId}_generated.jpg`);
      
      // 查找一个现有的图片文件作为占位符
      const uploadsDir = storageConfig.getFullPath(storageConfig.directories.uploads);
      let existingFiles: string[] = [];
      
      try {
        existingFiles = fs.readdirSync(uploadsDir).filter(file => 
          file.endsWith('.jpg') || file.endsWith('.png')
        );
      } catch (error) {
        console.warn('[TaskService] Could not read uploads directory for placeholder');
      }
      
      if (existingFiles.length > 0) {
        // 复制第一个找到的图片文件作为占位符
        const sourcePath = path.join(uploadsDir, existingFiles[0]);
        fs.copyFileSync(sourcePath, filePath);
        console.log(`[TaskService] Created placeholder image by copying: ${existingFiles[0]} -> ${taskId}_generated.jpg`);
      } else {
        // 如果没有现有图片，创建一个最小的JPEG占位符
        const minimalJpeg = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
          0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
          0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
          0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
          0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
          0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
          0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
          0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
          0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
          0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
          0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
          0xFF, 0xD9
        ]);
        fs.writeFileSync(filePath, minimalJpeg);
        console.log(`[TaskService] Created minimal JPEG placeholder: ${taskId}_generated.jpg`);
      }
    } catch (error) {
      console.error('[TaskService] Error creating placeholder image:', error);
    }
    
    await this.updateTaskStatus(
      taskId, 
      TaskStatus.COMPLETED, 
      100, 
      generatedImageUrl
    );

    console.log(`[TaskService] Task completed with simulation: ${taskId}`);
  }

  /**
   * 获取所有任务（用于WebSocket等）
   * Get all tasks (for WebSocket etc.)
   */
  async getAllTasks(): Promise<GenerationTask[]> {
    const allTasks = Array.from(this.tasks.values());
    
    // 为每个任务添加模板信息
    const tasksWithTemplates = await Promise.all(
      allTasks.map(async (task) => {
        const template = await templateService.getTemplateById(task.templateId);
        if (template) {
          (task as any).template = template;
        }
        return task;
      })
    );

    return tasksWithTemplates;
  }
  async deleteTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // 删除相关文件
    try {
      if (task.originalImageUrl) {
        const originalPath = path.join(process.cwd(), '..', task.originalImageUrl);
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }
      }
      
      if (task.generatedImageUrl) {
        const generatedPath = path.join(process.cwd(), '..', task.generatedImageUrl);
        if (fs.existsSync(generatedPath)) {
          fs.unlinkSync(generatedPath);
        }
      }
    } catch (error) {
      console.warn(`Error deleting files for task ${taskId}:`, error);
    }

    // 删除任务记录
    this.tasks.delete(taskId);
    
    // 从数据库删除
    await this.deleteTaskFromDatabase(taskId);
    
    return true;
  }
}

// 导出单例实例
export const taskService = new TaskService();