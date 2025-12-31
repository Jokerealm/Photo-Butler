import { Request, Response } from 'express';
import { templateService } from '../services/templateService';
import { TemplateListResponse } from '../types/template';

/**
 * Template controller
 * 模板控制器
 */
export class TemplateController {
  /**
   * 获取模板列表
   * Get template list
   * 
   * GET /api/templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      console.log('Fetching template list...');
      const templates = await templateService.getTemplates();
      
      console.log(`Successfully loaded ${templates.length} templates`);

      const response: TemplateListResponse = {
        success: true,
        data: {
          templates
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getTemplates:', error);
      
      const response: TemplateListResponse = {
        success: false,
        data: {
          templates: []
        },
        error: '获取模板列表失败'
      };

      res.status(500).json(response);
    }
  }

  /**
   * 根据ID获取模板
   * Get template by ID
   * 
   * GET /api/templates/:id
   */
  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log(`Fetching template by ID: ${id}`);
      
      const template = await templateService.getTemplateById(id);

      if (!template) {
        console.warn(`Template not found: ${id}`);
        res.status(404).json({
          success: false,
          error: '模板不存在'
        });
        return;
      }

      console.log(`Successfully found template: ${template.name}`);
      res.json({
        success: true,
        data: {
          template
        }
      });
    } catch (error) {
      console.error('Error in getTemplateById:', error);
      
      res.status(500).json({
        success: false,
        error: '获取模板失败'
      });
    }
  }
}

// 导出单例实例
export const templateController = new TemplateController();