import { Request, Response } from 'express';
import { downloadService } from '../services/downloadService';
import fs from 'fs';
import path from 'path';

/**
 * Download controller
 * 图片下载控制器
 */

interface DownloadParams {
  imageId: string;
}

interface DownloadQuery {
  url?: string;
  template?: string;
  timestamp?: string;
}

/**
 * 下载生成的图片
 * Download generated image
 * 
 * GET /api/download/:taskId
 */
export const downloadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = req.params.imageId; // 保持兼容性，实际上是taskId
    
    console.log(`[DownloadController] Download request for task: ${taskId}`);

    // 参数验证
    if (!taskId || typeof taskId !== 'string') {
      console.warn('[DownloadController] Invalid taskId parameter:', taskId);
      res.status(400).json({
        success: false,
        error: '缺少有效的任务ID参数'
      });
      return;
    }

    // 使用下载服务准备文件
    const downloadInfo = await downloadService.prepareDownload(taskId);
    
    // 检查文件是否存在
    if (!fs.existsSync(downloadInfo.filePath)) {
      console.error('[DownloadController] Download file not found:', downloadInfo.filePath);
      res.status(404).json({
        success: false,
        error: '下载文件不存在或已过期'
      });
      return;
    }

    // 读取文件
    const imageData = fs.readFileSync(downloadInfo.filePath);
    
    console.log(`[DownloadController] Serving download: ${downloadInfo.filename}`);

    // 设置响应头
    res.setHeader('Content-Type', downloadInfo.mimeType);
    
    // 对文件名进行编码以支持中文字符
    const encodedFilename = encodeURIComponent(downloadInfo.filename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    
    res.setHeader('Content-Length', imageData.length);
    res.setHeader('Cache-Control', 'no-cache');

    // 发送图片数据
    res.send(imageData);

    console.log(`[DownloadController] Download completed: ${downloadInfo.filename}`);

  } catch (error) {
    console.error('[DownloadController] Error in downloadImage:', error);

    // 处理不同类型的错误
    let errorMessage = '图片下载失败';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = '任务不存在或图片未生成';
        statusCode = 404;
      } else if (error.message.includes('No generated image')) {
        errorMessage = '图片尚未生成完成，请稍后重试';
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};

/**
 * 生成下载文件名
 * Generate download filename
 * 
 * 格式：ai-generated-{template}-{timestamp}.{extension}
 * 例如：ai-generated-油画风格-20240101120000.jpg
 */
export const generateDownloadFilename = (
  template?: string,
  timestamp?: string,
  extension: string = '.jpg'
): string => {
  // 基础文件名
  let filename = 'ai-generated';

  // 添加模板名称（如果提供）
  if (template && template.trim().length > 0) {
    // 清理模板名称，移除特殊字符
    const cleanTemplate = template
      .trim()
      .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
      .replace(/\s+/g, '-')         // 空格替换为连字符
      .substring(0, 20);            // 限制长度
    
    if (cleanTemplate.length > 0) {
      filename += `-${cleanTemplate}`;
    }
  }

  // 添加时间戳（如果提供）
  if (timestamp && timestamp.trim().length > 0) {
    // 尝试解析时间戳
    const ts = parseInt(timestamp);
    if (!isNaN(ts) && ts > 0) {
      const date = new Date(ts);
      const dateStr = date.toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, '')
        .replace('T', '-');
      filename += `-${dateStr}`;
    } else {
      // 如果时间戳无效，使用当前时间
      const now = new Date();
      const dateStr = now.toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, '')
        .replace('T', '-');
      filename += `-${dateStr}`;
    }
  } else {
    // 如果没有提供时间戳，使用当前时间
    const now = new Date();
    const dateStr = now.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, '')
      .replace('T', '-');
    filename += `-${dateStr}`;
  }

  // 添加扩展名
  return filename + extension;
};