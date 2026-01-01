import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DoubaoAPIClient, getDoubaoAPIClient } from '../services/doubaoAPIClient';
import { templateService } from '../services/templateService';
import { GenerateRequest, GenerateResponse } from '../types/generate';
import { ValidationError, NotFoundError, APIError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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
  generateImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Starting image generation request...');
    
    // 参数验证
    const { imageId, prompt, templateId }: GenerateRequest = req.body;
    
    if (!imageId || typeof imageId !== 'string') {
      throw new ValidationError('缺少有效的图片ID参数', 'imageId');
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new ValidationError('缺少有效的提示词参数', 'prompt');
    }

    if (!templateId || typeof templateId !== 'string') {
      throw new ValidationError('缺少有效的模板ID参数', 'templateId');
    }

    logger.info('Generation request validated', {
      imageId,
      templateId,
      promptLength: prompt.length
    });

    // 验证上传的图片是否存在
    const imagePath = this.getImagePath(imageId);
    if (!fs.existsSync(imagePath)) {
      logger.error(`Reference image not found: ${imagePath}`);
      throw new NotFoundError('参考图片', imageId);
    }

    // 验证模板是否存在
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      logger.error(`Template not found: ${templateId}`);
      throw new NotFoundError('模板', templateId);
    }

    logger.info(`Using template: ${template.name}`);

    // 读取参考图片
    const referenceImageBuffer = fs.readFileSync(imagePath);
    logger.info(`Reference image loaded: ${referenceImageBuffer.length} bytes`);

    // 调用豆包API生成图片
    logger.info('Calling Doubao API for image generation...');
    const generateResult = await this.doubaoClient.generateImageAndWait({
      referenceImage: referenceImageBuffer,
      prompt: prompt.trim(),
      templateId: templateId
    });

    if (!generateResult.success) {
      logger.error('Doubao API generation failed:', generateResult.error);
      throw new APIError(generateResult.error || '图片生成失败');
    }

    if (!generateResult.data?.imageUrl) {
      logger.error('No image URL returned from Doubao API');
      throw new APIError('图片生成失败：未返回图片URL');
    }

    // 生成记录ID
    const generationId = crypto.randomUUID();
    
    logger.info('Image generation successful', {
      generationId,
      imageUrl: generateResult.data.imageUrl
    });

    // 返回成功响应
    const response: GenerateResponse = {
      success: true,
      data: {
        generatedImageUrl: generateResult.data.imageUrl,
        generationId: generationId
      }
    };

    res.json(response);
  });

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