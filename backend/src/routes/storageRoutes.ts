import { Router } from 'express';
import { storageConfig } from '../config/storage';
import { downloadService } from '../services/downloadService';
import { cleanupService } from '../services/cleanupService';

/**
 * Storage management routes
 * 存储管理路由
 */
const router = Router();

// GET /api/storage/stats - 获取存储统计信息
router.get('/stats', async (req, res) => {
  try {
    const storageStats = storageConfig.getStorageStats();
    const downloadStats = downloadService.getDownloadStats();
    const cleanupStatus = cleanupService.getStatus();
    
    res.json({
      success: true,
      data: {
        storage: storageStats,
        downloads: downloadStats,
        cleanup: cleanupStatus
      }
    });
  } catch (error) {
    console.error('[StorageRoutes] Error getting storage stats:', error);
    res.status(500).json({
      success: false,
      error: '获取存储统计失败'
    });
  }
});

// POST /api/storage/cleanup - 手动触发清理
router.post('/cleanup', async (req, res) => {
  try {
    await cleanupService.manualCleanup();
    
    res.json({
      success: true,
      message: '清理任务已完成'
    });
  } catch (error) {
    console.error('[StorageRoutes] Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      error: '清理任务执行失败'
    });
  }
});

// POST /api/storage/cleanup-originals - 手动清理原图文件
router.post('/cleanup-originals', async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的任务ID数组'
      });
    }
    
    await storageConfig.cleanupProcessedUploads(taskIds);
    
    res.json({
      success: true,
      message: `已清理 ${taskIds.length} 个任务的原图文件`
    });
  } catch (error) {
    console.error('[StorageRoutes] Error cleaning up originals:', error);
    res.status(500).json({
      success: false,
      error: '清理原图文件失败'
    });
  }
});

export default router;