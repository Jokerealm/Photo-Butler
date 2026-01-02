import { Request, Response } from 'express';
import { taskService } from '../services/taskService';
import { TaskResponse, TaskListResponse } from '../types/task';

/**
 * Task controller
 * 任务控制器
 */
export class TaskController {
  /**
   * 创建新任务
   * Create new task
   * 
   * POST /api/tasks
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { templateId, customPrompt } = req.body;
      const imageFile = req.file;

      // 验证必需参数
      if (!templateId) {
        const response: TaskResponse = {
          success: false,
          error: '缺少模板ID'
        };
        res.status(400).json(response);
        return;
      }

      if (!imageFile) {
        const response: TaskResponse = {
          success: false,
          error: '缺少图片文件'
        };
        res.status(400).json(response);
        return;
      }

      console.log('Creating task:', { templateId, customPrompt, filename: imageFile.originalname });

      // 创建任务
      const task = await taskService.createTask(templateId, imageFile, customPrompt);

      const response: TaskResponse = {
        success: true,
        data: {
          task
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in createTask:', error);
      
      const response: TaskResponse = {
        success: false,
        error: error instanceof Error ? error.message : '创建任务失败'
      };

      res.status(500).json(response);
    }
  }

  /**
   * 获取任务详情
   * Get task by ID
   * 
   * GET /api/tasks/:id
   */
  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log(`Fetching task by ID: ${id}`);
      
      const task = await taskService.getTaskById(id);

      if (!task) {
        console.warn(`Task not found: ${id}`);
        const response: TaskResponse = {
          success: false,
          error: '任务不存在'
        };
        res.status(404).json(response);
        return;
      }

      console.log(`Successfully found task: ${task.id}`);
      const response: TaskResponse = {
        success: true,
        data: {
          task
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getTaskById:', error);
      
      const response: TaskResponse = {
        success: false,
        error: '获取任务失败'
      };

      res.status(500).json(response);
    }
  }

  /**
   * 获取任务列表
   * Get tasks list
   * 
   * GET /api/tasks
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const { userId, page = '1', limit = '20' } = req.query;
      
      console.log('Fetching tasks:', { userId, page, limit });

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await taskService.getTasks(
        userId as string, 
        pageNum, 
        limitNum
      );

      console.log(`Successfully loaded ${result.tasks.length} tasks`);

      const response: TaskListResponse = {
        success: true,
        data: result
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getTasks:', error);
      
      const response: TaskListResponse = {
        success: false,
        error: '获取任务列表失败'
      };

      res.status(500).json(response);
    }
  }

  /**
   * 删除任务
   * Delete task
   * 
   * DELETE /api/tasks/:id
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log(`Deleting task: ${id}`);
      
      const success = await taskService.deleteTask(id);

      if (!success) {
        console.warn(`Task not found for deletion: ${id}`);
        const response: TaskResponse = {
          success: false,
          error: '任务不存在'
        };
        res.status(404).json(response);
        return;
      }

      console.log(`Successfully deleted task: ${id}`);
      const response: TaskResponse = {
        success: true
      };

      res.json(response);
    } catch (error) {
      console.error('Error in deleteTask:', error);
      
      const response: TaskResponse = {
        success: false,
        error: '删除任务失败'
      };

      res.status(500).json(response);
    }
  }
}

// 导出单例实例
export const taskController = new TaskController();