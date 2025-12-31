import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DoubaoAPIClient, getDoubaoAPIClient } from '../services/doubaoAPIClient';
import { templateService } from '../services/templateService';
import { GenerateRequest, GenerateResponse } from '../types/generate';

/**
 * Generate controller
 * 图片生成控制器
 */
export class GenerateController {
  private doubaoClient: DoubaoAPIClient;

  constructor(doubaoClient?: DoubaoAPIClient) {
    this.doubaoClient = doubaoClient || getDoubaoAPIClient();
  }

  /**
   * 生成AI图片
   * Generate AI image
   * 
   * POST /api/generate
   */
  async generateImage(req: Request, res: Response): Promise<void> {
    try {
      console.log('Starting image generation request...');
      
      // 参数验证
      const { imageId, prompt, templateId }: GenerateRequest = req.body;
      
      if (!imageId || typeof imageId !== 'string') {
        console.warn('Invalid imageId parameter:', imageId);
        res.status(400).json({
          success: false,
          error: '缺少有效的图片ID参数'
        } as GenerateResponse);
        return;
      }

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        console.warn('Invalid prompt parameter:', prompt);
        res.status(400).json({
          success: false,
          error: '缺少有效的提示词参数'
        } as GenerateResponse);
        return;
      }

      if (!templateId || typeof templateId !== 'string') {
        console.warn('Invalid templateId parameter:', templateId);
        res.status(400).json({
          success: false,
          error: '缺少有效的模板ID参数'
        } as GenerateResponse);
        return;
      }

      console.log(`Generation request - ImageID: ${imageId}, TemplateID: ${templateId}, Prompt: ${prompt.substring(0, 50)}...`);

      // 验证上传的图片是否存在
      const imagePath = this.getImagePath(imageId);
      if (!fs.existsSync(imagePath)) {
        console.error(`Reference image not found: ${imagePath}`);
        res.status(404).json({
          success: false,
          error: '参考图片不存在，请重新上传'
        } as GenerateResponse);
        return;
      }

      // 验证模板是否存在
      const template = await templateService.getTemplateById(templateId);
      if (!template) {
        console.error(`Template not found: ${templateId}`);
        res.status(404).json({
          success: false,
          error: '指定的模板不存在'
        } as GenerateResponse);
        return;
      }

      console.log(`Using template: ${template.name}`);

      // 读取参考图片
      const referenceImageBuffer = fs.readFileSync(imagePath);
      console.log(`Reference image loaded: ${referenceImageBuffer.length} bytes`);

      // 调用豆包API生成图片
      console.log('Calling Doubao API for image generation...');
      const generateResult = await this.doubaoClient.generateImageAndWait({
        referenceImage: referenceImageBuffer,
        prompt: prompt.trim(),
        templateId: templateId
      });

      if (!generateResult.success) {
        console.error('Doubao API generation failed:', generateResult.error);
        res.status(500).json({
          success: false,
          error: generateResult.error || '图片生成失败'
        } as GenerateResponse);
        return;
      }

      if (!generateResult.data?.imageUrl) {
        console.error('No image URL returned from Doubao API');
        res.status(500).json({
          success: false,
          error: '图片生成失败：未返回图片URL'
        } as GenerateResponse);
        return;
      }

      // 生成记录ID
      const generationId = crypto.randomUUID();
      
      console.log(`Image generation successful - GenerationID: ${generationId}, ImageURL: ${generateResult.data.imageUrl}`);

      // 返回成功响应
      const response: GenerateResponse = {
        success: true,
        data: {
          generatedImageUrl: generateResult.data.imageUrl,
          generationId: generationId
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Error in generateImage:', error);
      
      // 处理不同类型的错误
      let errorMessage = '图片生成失败';
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('DOUBAO_API_KEY')) {
          errorMessage = 'API配置错误，请联系管理员';
          statusCode = 500;
        } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          errorMessage = '请求超时，请稍后重试';
          statusCode = 504;
        } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
          errorMessage = '网络连接失败，请检查网络连接';
          statusCode = 503;
        } else {
          errorMessage = error.message;
        }
      }

      const response: GenerateResponse = {
        success: false,
        error: errorMessage
      };

      res.status(statusCode).json(response);
    }
  }

  /**
   * 根据图片ID获取图片文件路径
   * Get image file path by image ID
   */
  private getImagePath(imageId: string): string {
    // 查找上传目录中的图片文件
    const uploadDir = path.join(process.cwd(), 'uploads');
    const possibleExtensions = ['.jpg', '.jpeg', '.png'];
    
    for (const ext of possibleExtensions) {
      const filePath = path.join(uploadDir, `${imageId}${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    
    // 如果没有找到，返回默认路径（用于错误检查）
    return path.join(uploadDir, `${imageId}.jpg`);
  }
}

// 导出单例实例 - 延迟初始化
let _generateController: GenerateController | undefined;

export const getGenerateController = (): GenerateController => {
  if (!_generateController) {
    _generateController = new GenerateController();
  }
  return _generateController;
};