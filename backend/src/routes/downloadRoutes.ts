import { Router } from 'express';
import { downloadImage } from '../controllers/downloadController';
import { 
  validateDownloadRequest, 
  handleValidationErrors 
} from '../middleware/security';

/**
 * Download routes
 * 图片下载路由
 */
const router = Router();

// GET /api/download/:imageId - 下载生成的图片 with security checks
router.get('/:imageId', 
  validateDownloadRequest,   // Validate image ID parameter
  handleValidationErrors,    // Handle validation errors
  downloadImage
);

export default router;