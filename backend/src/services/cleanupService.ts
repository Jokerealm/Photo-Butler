import { storageConfig } from '../config/storage';
import { downloadService } from './downloadService';

/**
 * 清理服务
 * Cleanup service for managing file lifecycle
 */
export class CleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * 启动定时清理任务
   * Start scheduled cleanup tasks
   */
  start(): void {
    if (this.cleanupInterval) {
      console.log('[CleanupService] Cleanup service already running');
      return;
    }

    console.log('[CleanupService] Starting cleanup service...');
    
    // 立即执行一次清理
    this.performCleanup();
    
    // 每小时执行一次清理
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000); // 1小时

    console.log('[CleanupService] Cleanup service started (runs every hour)');
  }

  /**
   * 停止定时清理任务
   * Stop scheduled cleanup tasks
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[CleanupService] Cleanup service stopped');
    }
  }

  /**
   * 执行清理任务
   * Perform cleanup tasks
   */
  private async performCleanup(): Promise<void> {
    try {
      console.log('[CleanupService] Starting cleanup tasks...');
      
      // 清理临时文件（超过24小时）
      await storageConfig.cleanupTempFiles(24);
      
      // 清理下载文件（超过24小时）
      await downloadService.cleanupDownloads(24);
      
      // 打印存储统计
      const stats = storageConfig.getStorageStats();
      console.log('[CleanupService] Storage statistics:', stats);
      
      console.log('[CleanupService] Cleanup tasks completed');
    } catch (error) {
      console.error('[CleanupService] Error during cleanup:', error);
    }
  }

  /**
   * 手动执行清理
   * Manually trigger cleanup
   */
  async manualCleanup(): Promise<void> {
    console.log('[CleanupService] Manual cleanup triggered');
    await this.performCleanup();
  }

  /**
   * 获取清理服务状态
   * Get cleanup service status
   */
  getStatus(): { running: boolean; nextCleanup?: Date } {
    const running = this.cleanupInterval !== null;
    let nextCleanup: Date | undefined;
    
    if (running) {
      // 估算下次清理时间（当前时间 + 1小时）
      nextCleanup = new Date(Date.now() + 60 * 60 * 1000);
    }
    
    return { running, nextCleanup };
  }
}

// 导出单例实例
export const cleanupService = new CleanupService();