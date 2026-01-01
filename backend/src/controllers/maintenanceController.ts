import { Request, Response } from 'express';
import { fileService } from '../services/fileService';
import { imageProcessingService } from '../services/imageProcessingService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Maintenance controller for system cleanup and monitoring
 */
export class MaintenanceController {
  /**
   * Get storage statistics
   * GET /api/maintenance/stats
   */
  getStorageStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = fileService.getStorageStats();
      
      logger.info('Storage stats requested', stats);
      
      res.json({
        success: true,
        data: {
          ...stats,
          totalSizeFormatted: this.formatBytes(stats.totalSize),
          thumbnailSizeFormatted: this.formatBytes(stats.thumbnailSize)
        }
      });
    } catch (error) {
      logger.error('Error getting storage stats', { error });
      res.status(500).json({
        success: false,
        error: '获取存储统计失败'
      });
    }
  });

  /**
   * Force cleanup of old files
   * POST /api/maintenance/cleanup
   */
  forceCleanup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { maxAge } = req.body;
      const maxAgeMs = maxAge ? parseInt(maxAge) * 60 * 1000 : 60 * 60 * 1000; // Default 1 hour
      
      logger.info('Manual cleanup requested', { maxAgeMs });
      
      const [fileCleanup, thumbnailCleanup] = await Promise.all([
        fileService.forceCleanup(maxAgeMs),
        imageProcessingService.cleanupOldThumbnails(maxAgeMs)
      ]);
      
      const result = {
        filesDeleted: fileCleanup.filesDeleted,
        thumbnailsDeleted: fileCleanup.thumbnailsDeleted + thumbnailCleanup,
        orphansDeleted: fileCleanup.orphansDeleted
      };
      
      logger.info('Manual cleanup completed', result);
      
      res.json({
        success: true,
        data: result,
        message: `清理完成: 删除了 ${result.filesDeleted} 个文件, ${result.thumbnailsDeleted} 个缩略图, ${result.orphansDeleted} 个孤立文件`
      });
    } catch (error) {
      logger.error('Error during manual cleanup', { error });
      res.status(500).json({
        success: false,
        error: '手动清理失败'
      });
    }
  });

  /**
   * Health check endpoint
   * GET /api/maintenance/health
   */
  healthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = fileService.getStorageStats();
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      const health = {
        status: 'healthy',
        uptime: Math.floor(uptime),
        uptimeFormatted: this.formatUptime(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        storage: {
          files: stats.totalFiles,
          size: this.formatBytes(stats.totalSize),
          thumbnails: stats.thumbnailCount
        },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Error during health check', { error });
      res.status(500).json({
        success: false,
        error: '健康检查失败'
      });
    }
  });

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human readable format
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (secs > 0) parts.push(`${secs}秒`);
    
    return parts.join(' ') || '0秒';
  }
}

// Export singleton instance
export const maintenanceController = new MaintenanceController();