import fs from 'fs';
import path from 'path';
import { storageConfig } from '../config/storage';
import { taskService } from './taskService';

/**
 * 下载服务
 * Download service for handling user downloads
 */
export class DownloadService {
  
  /**
   * 准备下载文件
   * Prepare file for download
   */
  async prepareDownload(taskId: string, options?: {
    format?: 'original' | 'optimized';
    quality?: number;
    addWatermark?: boolean;
  }): Promise<{ filePath: string; filename: string; mimeType: string }> {
    try {
      // 获取任务信息
      const task = await taskService.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      if (!task.generatedImageUrl) {
        throw new Error('No generated image available for download');
      }

      // 确定源文件路径
      let sourceFilePath: string;
      if (task.generatedImageUrl.startsWith('/uploads/generated/')) {
        const filename = path.basename(task.generatedImageUrl);
        sourceFilePath = storageConfig.getGeneratedPath(filename);
      } else {
        throw new Error('Invalid generated image URL');
      }

      if (!fs.existsSync(sourceFilePath)) {
        throw new Error('Generated image file not found');
      }

      // 生成下载文件名
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const downloadFilename = `PhotoButler_${taskId.slice(0, 8)}_${timestamp}.jpg`;
      
      // 准备下载文件
      const downloadPath = storageConfig.getDownloadPath(downloadFilename);
      
      // 如果需要处理（水印、压缩等），在这里进行
      // 目前直接复制文件
      fs.copyFileSync(sourceFilePath, downloadPath);
      
      console.log(`[DownloadService] Prepared download: ${downloadFilename}`);
      
      return {
        filePath: downloadPath,
        filename: downloadFilename,
        mimeType: 'image/jpeg'
      };

    } catch (error) {
      console.error('[DownloadService] Error preparing download:', error);
      throw error;
    }
  }

  /**
   * 清理下载文件
   * Clean up download files
   */
  async cleanupDownloads(maxAgeHours: number = 24): Promise<void> {
    try {
      const downloadsDir = storageConfig.getFullPath(storageConfig.directories.downloads);
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      
      if (!fs.existsSync(downloadsDir)) {
        return;
      }

      const files = fs.readdirSync(downloadsDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(downloadsDir, file);
        const stats = fs.statSync(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      console.log(`[DownloadService] Cleaned up ${deletedCount} download files`);
    } catch (error) {
      console.error('[DownloadService] Error cleaning up downloads:', error);
    }
  }

  /**
   * 获取下载统计
   * Get download statistics
   */
  getDownloadStats(): { totalFiles: number; totalSizeBytes: number } {
    try {
      const downloadsDir = storageConfig.getFullPath(storageConfig.directories.downloads);
      
      if (!fs.existsSync(downloadsDir)) {
        return { totalFiles: 0, totalSizeBytes: 0 };
      }

      const files = fs.readdirSync(downloadsDir);
      let totalSize = 0;

      files.forEach(file => {
        const filePath = path.join(downloadsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      });

      return {
        totalFiles: files.length,
        totalSizeBytes: totalSize
      };
    } catch (error) {
      console.error('[DownloadService] Error getting download stats:', error);
      return { totalFiles: 0, totalSizeBytes: 0 };
    }
  }
}

// 导出单例实例
export const downloadService = new DownloadService();