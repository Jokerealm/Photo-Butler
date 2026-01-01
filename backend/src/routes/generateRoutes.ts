import { Router, Request, Response, NextFunction } from 'express';
import { getGenerateController } from '../controllers/generateController';
import { 
  generateRateLimit, 
  validateGenerateRequest, 
  handleValidationErrors 
} from '../middleware/security';

/**
 * Generate routes
 * 图片生成路由
 */
const router = Router();

// POST /api/generate - 生成AI图片 with security checks
router.post('/', 
  generateRateLimit,         // Rate limiting for generation
  validateGenerateRequest,   // Input validation
  handleValidationErrors,    // Handle validation errors
  (req: Request, res: Response, next: NextFunction) => {
    const controller = getGenerateController();
    controller.generateImage.bind(controller)(req, res, next);
  }
);

export default router;