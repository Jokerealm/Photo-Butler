import { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import { templateService } from '../services/templateService';

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
 * GET /api/download/:imageId?url=<imageUrl>&template=<templateName>&timestamp=<timestamp>
 */
export const downloadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const imageId = req.params.imageId;
    const { url, template, timestamp } = req.query as DownloadQuery;

    console.log(`Download request - ImageID: ${imageId}, URL: ${url}, Template: ${template}, Timestamp: ${timestamp}`);

    // 参数验证
    if (!imageId || typeof imageId !== 'string') {
      console.warn('Invalid imageId parameter:', imageId);
      res.status(400).json({
        success: false,
        error: '缺少有效的图片ID参数'
      });
      return;
    }

    if (!url || typeof url !== 'string') {
      console.warn('Invalid url parameter:', url);
      res.status(400).json({
        success: false,
        error: '缺少有效的图片URL参数'
      });
      return;
    }

    // 验证URL格式
    let imageUrl: URL;
    try {
      imageUrl = new URL(url);
    } catch (error) {
      console.warn('Invalid URL format:', url);
      res.status(400).json({
        success: false,
        error: '无效的图片URL格式'
      });
      return;
    }

    console.log(`Fetching image from URL: ${imageUrl.toString()}`);

    // 从URL获取图片数据
    const imageResponse = await axios.get(imageUrl.toString(), {
      responseType: 'arraybuffer',
      timeout: 30000, // 30秒超时
      headers: {
        'User-Agent': 'PhotoButler/1.0'
      }
    });

    if (!imageResponse.data) {
      console.error('No image data received from URL');
      res.status(404).json({
        success: false,
        error: '无法获取图片数据'
      });
      return;
    }

    // 获取图片的Content-Type
    const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
    console.log(`Image content type: ${contentType}`);

    // 确定文件扩展名
    let extension = '.jpg';
    if (contentType.includes('png')) {
      extension = '.png';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = '.jpg';
    } else if (contentType.includes('webp')) {
      extension = '.webp';
    }

    // 生成下载文件名
    const filename = generateDownloadFilename(template, timestamp, extension);
    console.log(`Generated filename: ${filename}`);

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', imageResponse.data.length);
    res.setHeader('Cache-Control', 'no-cache');

    // 发送图片数据
    res.send(Buffer.from(imageResponse.data));

    console.log(`Image download completed successfully: ${filename}`);

  } catch (error) {
    console.error('Error in downloadImage:', error);

    // 处理不同类型的错误
    let errorMessage = '图片下载失败';
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '图片下载超时，请稍后重试';
        statusCode = 504;
      } else if (error.response?.status === 404) {
        errorMessage = '图片不存在或已过期';
        statusCode = 404;
      } else if (error.response?.status === 403) {
        errorMessage = '无权限访问该图片';
        statusCode = 403;
      } else {
        errorMessage = '无法访问图片资源';
        statusCode = 502;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
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